import { useState, useEffect, useRef } from "react";

const CB_BLUE = "#0033C6";

interface BidModalProps {
  open: boolean;
  onClose: () => void;
  lotTitle: string;
  lotNum: string;
  bidAmount: number;
  comissao: number;
  itemId: string;
}

type Step =
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
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
}

function formatCPF(v: string): string {
  const n = v.replace(/\D/g, "").slice(0, 11);
  return n
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/(\d{3})\.(\d{3})\.(\d{3})(\d)/, "$1.$2.$3-$4");
}

function getApiBase(): string {
  return "/api";
}

export default function BidModal({ open, onClose, lotTitle, lotNum, bidAmount, comissao, itemId }: BidModalProps) {
  const [step, setStep] = useState<Step>("confirm");
  const [payMethod, setPayMethod] = useState<"pix" | "boleto" | "card" | "delivery" | null>(null);
  const [address, setAddress] = useState({ cep: "", logradouro: "", bairro: "", cidade: "", uf: "", numero: "" });
  const [cepLoading, setCepLoading] = useState(false);
  const [name, setName] = useState("");
  const [cpf, setCpf] = useState("");
  const [pixCode, setPixCode] = useState("");
  const [pixTxId, setPixTxId] = useState("");
  const [pixLoading, setPixLoading] = useState(false);
  const [pixPaid, setPixPaid] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setStep("confirm");
      setPayMethod(null);
      setAddress({ cep: "", logradouro: "", bairro: "", cidade: "", uf: "", numero: "" });
      setName("");
      setCpf("");
      setPixCode("");
      setPixTxId("");
      setPixPaid(false);
      setCopied(false);
      setError("");
      if (pollRef.current) clearInterval(pollRef.current);
    }
  }, [open]);

  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  async function fetchCep(cep: string) {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    setCepLoading(true);
    try {
      const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setAddress(a => ({ ...a, logradouro: data.logradouro || "", bairro: data.bairro || "", cidade: data.localidade || "", uf: data.uf || "" }));
      }
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
    setPixLoading(true);
    setError("");
    try {
      const res = await fetch(`${getApiBase()}/pix/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          cpf: cpf.replace(/\D/g, ""),
          amount: pixAmount,
          lotTitle,
          email: `${cpf.replace(/\D/g, "")}@arrematante.com.br`,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Erro ao gerar PIX");
      setPixCode(data.pixCode || "");
      setPixTxId(data.id || "");
      setStep("pix");
      startPolling(data.id);
    } catch (e: any) {
      setError(e.message || "Erro ao gerar PIX");
    }
    setPixLoading(false);
  }

  function startPolling(txId: string) {
    pollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`${getApiBase()}/pix/status/${txId}`);
        const data = await res.json();
        if (data.status === "paid" || data.paidAt) {
          setPixPaid(true);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {}
    }, 4000);
  }

  function handleCopy() {
    navigator.clipboard.writeText(pixCode).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  }

  if (!open) return null;

  const overlay: React.CSSProperties = {
    position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.55)", zIndex: 1000,
    display: "flex", alignItems: "flex-end", justifyContent: "center",
  };

  const modal: React.CSSProperties = {
    backgroundColor: "white", borderRadius: "16px 16px 0 0",
    width: "100%", maxWidth: 560, height: "70vh",
    display: "flex", flexDirection: "column",
    animation: "slideUp 0.28s ease",
    fontFamily: "'SiteFonte','Nunito',sans-serif",
    overflow: "hidden",
  };

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
                  <button
                    onClick={() => setStep("payment-select")}
                    style={{ display: "block", width: "100%", padding: "13px", backgroundColor: CB_BLUE, color: "white", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: "pointer" }}
                  >
                    Prosseguir
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: PAYMENT SELECT ─── */}
            {step === "payment-select" && (
              <>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 900, color: "#222", marginBottom: 4 }}>Forma de pagamento</p>
                  <p style={{ fontSize: 12, color: "#777" }}>Selecione como deseja quitar o valor do lote.</p>
                </div>
                {[
                  { key: "pix", label: "PIX", sub: "Aprovação imediata" },
                  { key: "boleto", label: "Boleto Bancário", sub: "Prazo de até 3 dias úteis" },
                  { key: "card", label: "Cartão de Crédito", sub: "Parcelamento em até 12×" },
                  { key: "delivery", label: "Pagamento na Entrega", sub: "Mediante aceitação dos termos de desistência" },
                ].map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => setPayMethod(opt.key as any)}
                    style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      padding: "12px 14px", borderRadius: 8, border: `1px solid ${payMethod === opt.key ? CB_BLUE : "#e0e0e0"}`,
                      backgroundColor: payMethod === opt.key ? "#f0f4ff" : "white",
                      cursor: "pointer", textAlign: "left", width: "100%",
                    }}
                  >
                    <div>
                      <p style={{ fontSize: 13, fontWeight: 800, color: "#222", marginBottom: 2 }}>{opt.label}</p>
                      <p style={{ fontSize: 11, color: "#888" }}>{opt.sub}</p>
                    </div>
                    <div style={{ width: 16, height: 16, borderRadius: "50%", border: `2px solid ${payMethod === opt.key ? CB_BLUE : "#ccc"}`, backgroundColor: payMethod === opt.key ? CB_BLUE : "white", flexShrink: 0 }} />
                  </button>
                ))}
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button
                    disabled={!payMethod}
                    onClick={() => setStep("address")}
                    style={{ display: "block", width: "100%", padding: "13px", backgroundColor: payMethod ? CB_BLUE : "#e0e0e0", color: payMethod ? "white" : "#aaa", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: payMethod ? "pointer" : "not-allowed" }}
                  >
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
                <input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  placeholder="CEP"
                  value={address.cep}
                  maxLength={9}
                  onChange={e => {
                    const v = e.target.value.replace(/\D/g, "").slice(0, 8);
                    const formatted = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v;
                    setAddress(a => ({ ...a, cep: formatted }));
                    if (v.length === 8) fetchCep(v);
                  }}
                  style={inputStyle}
                />
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
                  <button
                    disabled={!address.logradouro || !address.numero || !address.cidade}
                    onClick={handleAddressSave}
                    style={{ display: "block", width: "100%", padding: "13px", backgroundColor: address.logradouro && address.numero ? CB_BLUE : "#e0e0e0", color: address.logradouro && address.numero ? "white" : "#aaa", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: address.logradouro && address.numero ? "pointer" : "not-allowed" }}
                  >
                    Prosseguir
                  </button>
                </div>
              </>
            )}

            {/* ─── STEP: ADDRESS SAVING ─── */}
            {step === "address-saving" && (
              <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
                <div className="spin" style={{ width: 40, height: 40, borderRadius: "50%", border: `3px solid #e0e0e0`, borderTopColor: CB_BLUE }} />
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
                <div>
                  <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 8 }}>Dados pessoais</p>
                  <input placeholder="Nome completo" value={name} onChange={e => setName(e.target.value)} style={{ ...inputStyle, marginBottom: 8 }} />
                  <input
                    inputMode="numeric"
                    placeholder="CPF"
                    value={cpf}
                    onChange={e => setCpf(formatCPF(e.target.value))}
                    style={inputStyle}
                    maxLength={14}
                  />
                </div>
                <div style={{ marginTop: "auto", paddingTop: 8 }}>
                  <button
                    disabled={!name || cpf.length < 14}
                    onClick={() => setStep("info")}
                    style={{ display: "block", width: "100%", padding: "13px", backgroundColor: name && cpf.length >= 14 ? CB_BLUE : "#e0e0e0", color: name && cpf.length >= 14 ? "white" : "#aaa", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: name && cpf.length >= 14 ? "pointer" : "not-allowed" }}
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
                    <button
                      onClick={handleCreatePix}
                      disabled={pixLoading}
                      style={{ display: "block", width: "100%", padding: "13px", backgroundColor: pixLoading ? "#e0e0e0" : CB_BLUE, color: pixLoading ? "#aaa" : "white", fontWeight: 900, fontSize: 14, borderRadius: 8, border: "none", cursor: pixLoading ? "not-allowed" : "pointer" }}
                    >
                      {pixLoading ? "Gerando PIX..." : `Pagar ${formatBRL(pixAmount)} via PIX`}
                    </button>
                  </div>
                </>
              );
            })()}

            {/* ─── STEP: PIX ─── */}
            {step === "pix" && (() => {
              const pixAmount = (bidAmount + comissao) / 2;
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
                    <div>
                      <p style={{ fontSize: 11, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 6 }}>Código PIX copia e cola</p>
                      <div style={{ backgroundColor: "#fafafa", border: "1px solid #ebebeb", borderRadius: 8, padding: "10px 12px", wordBreak: "break-all", fontSize: 11, color: "#333", lineHeight: 1.6, marginBottom: 8 }}>
                        {pixCode}
                      </div>
                      <button
                        onClick={handleCopy}
                        style={{ display: "block", width: "100%", padding: "11px", backgroundColor: "white", color: CB_BLUE, fontWeight: 900, fontSize: 13, borderRadius: 8, border: `2px solid ${CB_BLUE}`, cursor: "pointer" }}
                      >
                        {copied ? "Copiado!" : "Copiar código PIX"}
                      </button>
                    </div>
                  )}
                  {!pixPaid ? (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 4 }}>
                      <div className="spin" style={{ width: 18, height: 18, borderRadius: "50%", border: `2px solid #e0e0e0`, borderTopColor: CB_BLUE, flexShrink: 0 }} />
                      <p style={{ fontSize: 12, color: "#666" }}>Aguardando confirmação do pagamento...</p>
                    </div>
                  ) : (
                    <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "12px 14px", textAlign: "center" }}>
                      <p style={{ fontSize: 14, fontWeight: 900, color: "#166534" }}>Pagamento confirmado!</p>
                      <p style={{ fontSize: 12, color: "#15803d", marginTop: 4 }}>Arrematação oficializada. O restante ({formatBRL(pixAmount)}) será pago na entrega.</p>
                    </div>
                  )}
                </>
              );
            })()}

          </div>
        </div>
      </div>
    </>
  );
}

const inputStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  padding: "14px 14px",
  fontSize: 14,
  border: "1px solid #e0e0e0",
  borderRadius: 8,
  outline: "none",
  fontFamily: "'SiteFonte','Nunito',sans-serif",
  color: "#222",
  backgroundColor: "white",
  boxSizing: "border-box",
  minHeight: 48,
};
