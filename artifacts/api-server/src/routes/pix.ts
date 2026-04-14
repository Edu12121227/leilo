import { Router } from "express";
import axios from "axios";

const router = Router();

const THEKEY_BASE = "https://api.the-key.club/api";
const WEBHOOK_URL = "https://leilaocasasbahia.comprarprodutos-shop.com/api/webhook/thekey";

// ── Token cache ───────────────────────────────────────────────────────────────

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) return cachedToken;
  const clientId = process.env.THEKEY_CLIENT_ID;
  const clientSecret = process.env.THEKEY_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("THEKEY_CLIENT_ID / THEKEY_CLIENT_SECRET ausentes");
  const res = await axios.post(
    `${THEKEY_BASE}/auth/login`,
    { client_id: clientId, client_secret: clientSecret },
    { timeout: 10000 }
  );
  cachedToken = res.data.token as string;
  tokenExpiry = Date.now() + 55 * 60 * 1000; // renova 5 min antes do 1h
  return cachedToken;
}

// ── In-memory paid map (webhook → SSE) ───────────────────────────────────────
// Quando o webhook da TheKey chegar com status COMPLETED, marcamos o txId aqui.
// O SSE stream verifica esse map a cada 2s em vez de fazer polling externo.

const paidTxIds = new Map<string, number>(); // txId -> timestamp

function markPaid(txId: string) {
  paidTxIds.set(txId, Date.now());
}

function isPaidInMemory(txId: string): boolean {
  return paidTxIds.has(txId);
}

// Limpa entradas com mais de 30 minutos para não vazar memória
setInterval(() => {
  const cutoff = Date.now() - 30 * 60 * 1000;
  paidTxIds.forEach((ts, id) => { if (ts < cutoff) paidTxIds.delete(id); });
}, 30 * 60 * 1000);

// ─── Create PIX transaction ───────────────────────────────────────────────────

router.post("/pix/create", async (req, res) => {
  try {
    const { name, email, cpf, phone, amount, lotTitle } = req.body;

    if (!name || !cpf || !amount) {
      res.status(400).json({ error: "name, cpf e amount são obrigatórios" });
      return;
    }

    const token = await getToken();
    const cleanCpf = cpf.replace(/\D/g, "");
    const cleanPhone = (phone || "11999999999").replace(/\D/g, "");
    const amountNum = Number(amount);
    const externalId = `leilao_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;

    const payload = {
      amount: amountNum,
      external_id: externalId,
      clientCallbackUrl: WEBHOOK_URL,
      payer: {
        name,
        email: email || `${cleanCpf}@arrematante.com.br`,
        document: cleanCpf,
        phone: cleanPhone,
      },
    };

    const response = await axios.post(`${THEKEY_BASE}/payments/deposit`, payload, {
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      timeout: 15000,
    });

    const qrData = response.data.qrCodeResponse || response.data;
    const txId = qrData.transactionId as string;

    console.log(`[THEKEY] PIX criado — id: ${txId}`);
    res.json({
      id: txId,
      status: "pending",
      pixCode: qrData.qrcode ?? null,
      expirationDate: null,
    });
  } catch (err: any) {
    const msg = err?.response?.data?.message || err?.response?.data?.error || err.message || "Erro ao criar transação";
    console.error(`[THEKEY] Erro ao criar PIX: ${msg}`);
    res.status(500).json({ error: msg });
  }
});

// ─── PIX status (verifica mapa local preenchido pelo webhook) ─────────────────

router.get("/pix/status/:id", (req, res) => {
  const txId = req.params.id;
  if (isPaidInMemory(txId)) {
    res.json({ id: txId, status: "paid", paidAt: new Date().toISOString() });
    return;
  }
  res.json({ id: txId, status: "pending", paidAt: null });
});

// ─── Webhook — TheKey → nosso servidor ───────────────────────────────────────

router.post("/webhook/thekey", (req, res) => {
  try {
    const { transaction_id, status, amount } = req.body;
    if (status === "COMPLETED" && transaction_id) {
      console.log(`[THEKEY WEBHOOK] Pagamento confirmado: ${transaction_id} — R$ ${amount}`);
      markPaid(transaction_id);
    } else {
      console.log(`[THEKEY WEBHOOK] Evento recebido: status=${status} id=${transaction_id}`);
    }
  } catch (err) {
    console.error("[THEKEY WEBHOOK] Erro ao processar:", err);
  }
  // Sempre retorna 200 para a TheKey não reenviar
  res.json({ received: true });
});

// ─── SSE stream — confirmação em tempo real via webhook ───────────────────────

router.get("/pix/stream/:id", (req, res) => {
  const txId = req.params.id;

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // desativa buffering Heroku/Nginx
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

  // Heartbeat a cada 20s — evita que Heroku/proxies matem a conexão ociosa
  heartbeatTimer = setInterval(() => {
    if (!closed) res.write(": heartbeat\n\n");
  }, 20000);

  // Verifica o mapa in-memory a cada 2s (populado pelo webhook da TheKey)
  pollTimer = setInterval(() => {
    if (closed) return;
    if (isPaidInMemory(txId)) {
      send({ type: "payment_approved", status: "paid" });
      cleanup();
      res.end();
    }
  }, 2000);

  // Auto-fecha após 10 minutos para evitar conexões zumbi
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
