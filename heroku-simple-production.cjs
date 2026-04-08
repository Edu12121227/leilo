'use strict';

const express = require('express');
const path = require('path');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
