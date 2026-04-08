import { Router } from "express";
import axios from "axios";

const router = Router();

const API_URL = "https://api.ghostspaysv2.com/functions/v1";
const PAID_STATUSES = new Set(["paid", "approved", "captured", "authorized", "settled"]);

function getAuthHeader(): string {
  const secretKey = process.env.GHOSTSPAY_SECRET_KEY;
  const companyId = process.env.GHOSTSPAY_COMPANY_ID;
  if (!secretKey || !companyId) throw new Error("GhostsPay credentials missing");
  const credentials = Buffer.from(`${secretKey}:${companyId}`).toString("base64");
  return `Basic ${credentials}`;
}

function isPaid(status: string, paidAt: unknown): boolean {
  return PAID_STATUSES.has(String(status).toLowerCase()) || !!paidAt;
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
    const amountInCents = Math.round(Number(amount) * 100);

    const payload = {
      amount: amountInCents,
      paymentMethod: "PIX",
      customer: {
        name,
        email: email || `${cleanCpf}@arrematante.com.br`,
        phone: cleanPhone,
        document: { number: cleanCpf, type: "CPF" },
      },
      items: [
        {
          title: `Comissão Leiloeiro — ${lotTitle || "Lote Leilão #144"}`,
          unitPrice: amountInCents,
          quantity: 1,
          tangible: false,
        },
      ],
    };

    const response = await axios.post(`${API_URL}/transactions`, payload, {
      headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      timeout: 15000,
    });

    const data = response.data as any;

    if (data.status === "refused") {
      const reason = data.refusedReason?.description || "Transação recusada";
      res.status(422).json({ error: reason });
      return;
    }

    res.json({
      id: data.id,
      status: data.status,
      pixCode: data.pix?.qrcode ?? null,
      expirationDate: data.pix?.expirationDate ?? null,
    });
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message || "Erro ao criar transação";
    res.status(500).json({ error: msg });
  }
});

// ─── Poll status (fallback) ───────────────────────────────────────────────────

router.get("/pix/status/:id", async (req, res) => {
  try {
    const response = await axios.get(`${API_URL}/transactions/${req.params.id}`, {
      headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
      timeout: 10000,
    });
    const data = response.data as any;
    res.json({ id: data.id, status: data.status, paidAt: data.paidAt ?? null });
  } catch (err: any) {
    const msg = err?.response?.data?.message || err.message || "Erro ao consultar transação";
    res.status(500).json({ error: msg });
  }
});

// ─── SSE stream — real-time payment confirmation ──────────────────────────────

router.get("/pix/stream/:id", async (req, res) => {
  const txId = req.params.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // disable nginx/proxy buffering (Heroku)
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

  // Heartbeat every 20s — keeps Heroku / proxies from dropping idle connection
  heartbeatTimer = setInterval(() => {
    if (!closed) res.write(": heartbeat\n\n");
  }, 20000);

  // Poll GhostsPay every 3s server-side
  pollTimer = setInterval(async () => {
    if (closed) return;
    try {
      const response = await axios.get(`${API_URL}/transactions/${txId}`, {
        headers: { Authorization: getAuthHeader(), "Content-Type": "application/json" },
        timeout: 8000,
      });
      const data = response.data as any;
      if (isPaid(data.status, data.paidAt)) {
        send({ type: "payment_approved", status: data.status });
        cleanup();
        res.end();
      }
    } catch {
      // keep trying on transient errors
    }
  }, 3000);

  // Auto-close after 10 minutes to avoid zombie connections
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
