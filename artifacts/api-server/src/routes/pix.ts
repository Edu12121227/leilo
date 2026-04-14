import { Router } from "express";
import axios from "axios";

const router = Router();

const PAGNET_BASE = "https://api.pagnetbrasil.com/v1";
const PAID_STATUSES = new Set(["paid", "approved", "captured", "authorized", "settled"]);

function getAuthHeader(): string {
  const publicKey = process.env.PAGNET_PUBLIC_KEY;
  const secretKey = process.env.PAGNET_SECRET_KEY;
  if (!publicKey || !secretKey) throw new Error("PAGNET_PUBLIC_KEY / PAGNET_SECRET_KEY ausentes");
  return `Basic ${Buffer.from(`${publicKey}:${secretKey}`).toString("base64")}`;
}

function isPaid(status: string): boolean {
  return PAID_STATUSES.has(String(status).toLowerCase());
}

// ─── Create PIX transaction ───────────────────────────────────────────────────

router.post("/pix/create", async (req, res) => {
  try {
    const { name, email, cpf, phone, amount, lotTitle } = req.body;

    if (!name || !cpf || !amount) {
      res.status(400).json({ error: "name, cpf e amount são obrigatórios" });
      return;
    }

    const cleanCpf = cpf.replace(/\D/g, "");
    const cleanPhone = (phone || "11999999999").replace(/\D/g, "");
    const amountCents = Math.round(Number(amount) * 100);
    const externalReference = `PIX${Date.now()}${Math.random().toString(36).slice(0, 8).toUpperCase()}`;

    const payload = {
      amount: amountCents,
      paymentMethod: "pix",
      pix: { expiresInDays: 3 },
      items: [
        {
          title: lotTitle || "Lote Leilão Casas Bahia",
          unitPrice: amountCents,
          quantity: 1,
          tangible: false,
        },
      ],
      customer: {
        name,
        email: email || `${cleanCpf}@arrematante.com.br`,
        document: { type: "cpf", number: cleanCpf },
        phone: cleanPhone,
      },
      externalReference,
    };

    const response = await axios.post(`${PAGNET_BASE}/transactions`, payload, {
      headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      timeout: 15000,
    });

    const data = response.data as any;
    const pixCode = data?.pix?.qrcode || data?.qrCode || data?.qrcode || null;
    const txId = String(data?.id || data?.transactionId || externalReference);

    console.log(`[PAGNET] PIX criado — id: ${txId} status: ${data?.status}`);
    res.json({
      id: txId,
      status: data?.status || "pending",
      pixCode,
      expirationDate: null,
    });
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Erro ao criar transação";
    console.error(`[PAGNET] Erro ao criar PIX: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── PIX status (polling direto na Pagnet) ────────────────────────────────────

router.get("/pix/status/:id", async (req, res) => {
  try {
    const response = await axios.get(`${PAGNET_BASE}/transactions/${req.params.id}`, {
      headers: { Authorization: getAuthHeader(), Accept: "application/json" },
      timeout: 10000,
    });
    const data = response.data as any;
    const status = data?.status || "pending";
    res.json({ id: req.params.id, status, paidAt: isPaid(status) ? new Date().toISOString() : null });
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message || "Erro ao consultar transação";
    res.status(500).json({ error: msg });
  }
});

// ─── SSE stream — real-time confirmation via polling ─────────────────────────

router.get("/pix/stream/:id", (req, res) => {
  const txId = req.params.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  let closed = false;
  let pollTimer: ReturnType<typeof setInterval> | null = null;
  let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

  function cleanup() {
    closed = true;
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
    if (heartbeatTimer) { clearInterval(heartbeatTimer); heartbeatTimer = null; }
  }

  function send(data: object) {
    if (!closed) res.write(`data: ${JSON.stringify(data)}\n\n`);
  }

  heartbeatTimer = setInterval(() => {
    if (!closed) res.write(": heartbeat\n\n");
  }, 20000);

  // Poll Pagnet a cada 3s
  pollTimer = setInterval(async () => {
    if (closed) return;
    try {
      const response = await axios.get(`${PAGNET_BASE}/transactions/${txId}`, {
        headers: { Authorization: getAuthHeader(), Accept: "application/json" },
        timeout: 8000,
      });
      const data = response.data as any;
      if (isPaid(data?.status || "")) {
        send({ type: "payment_approved", status: data.status });
        cleanup();
        res.end();
      }
    } catch {
      // continua tentando em erros transientes
    }
  }, 3000);

  const timeout = setTimeout(() => {
    if (!closed) {
      send({ type: "timeout" });
      cleanup();
      res.end();
    }
  }, 10 * 60 * 1000);

  req.on("close", () => {
    clearTimeout(timeout);
    cleanup();
  });
});

export default router;
