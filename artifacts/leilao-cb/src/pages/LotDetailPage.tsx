import { useState } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";
import { useIsMobile } from "@/hooks/useIsMobile";

const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#0033C6";

function parsePrice(p: string): number {
  return parseFloat(p.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
}

function formatBRL(v: number): string {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function todayStr(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  const ss = String(d.getSeconds()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${mi}:${ss}`;
}

function todayDateStr(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy} 11:00`;
}

function fakeViews(itemId: string): number {
  let h = 0;
  for (let i = 0; i < itemId.length; i++) h = ((h << 5) - h + itemId.charCodeAt(i)) | 0;
  return 300 + (Math.abs(h) % 1700);
}

function anonymizeBuyer(name: string): string {
  if (!name) return "a*******0";
  const first = name[0].toLowerCase();
  return `${first}*******${name[name.length - 1].toLowerCase()}`;
}

function lanceinicial(price: number): string {
  return formatBRL(Math.round(price * 0.75 / 10) * 10);
}

export default function LotDetailPage() {
  const params = useParams<{ itemId: string }>();
  const [, setLocation] = useLocation();
  const [activeThumb, setActiveThumb] = useState(0);
  const isMobile = useIsMobile();

  const lot = lots.find(l => l.itemId === params.itemId);

  if (!lot) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f5", fontFamily: "'SiteFonte','Nunito',sans-serif" }}>
        <Header />
        <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#333" }}>Lote não encontrado</h2>
          <p style={{ fontSize: 14, color: "#888", marginTop: 8 }}>O item #{params.itemId} não existe neste leilão.</p>
          <button onClick={() => setLocation("/")} style={{ marginTop: 24, padding: "12px 28px", backgroundColor: CB_YELLOW, color: CB_BLUE, fontWeight: 900, fontSize: 14, border: "none", borderRadius: 8, cursor: "pointer" }}>
            ← Voltar
          </button>
        </div>
      </div>
    );
  }

  const category = getCategory(lot.title);
  const image = getCategoryImage(lot);
  const isVendido = lot.status === "Vendido";
  const related = lots.filter(l => getCategory(l.title) === category && l.itemId !== lot.itemId).slice(0, isMobile ? 4 : 5);
  const descLines = lot.description.split("\n").filter(Boolean);
  const thumbs = [image];
  const priceNum = parsePrice(lot.price);
  const comissao = priceNum * 0.05;
  const views = fakeViews(lot.itemId);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f5", fontFamily: "'SiteFonte','Nunito',sans-serif" }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "8px 12px" : "10px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888", overflowX: "auto" }} className="no-scrollbar">
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontSize: 12, padding: 0, whiteSpace: "nowrap" }}>Início</button>
          <span style={{ color: "#ccc", flexShrink: 0 }}>›</span>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontSize: 12, padding: 0, whiteSpace: "nowrap" }}>Leilão #144</button>
          <span style={{ color: "#ccc", flexShrink: 0 }}>›</span>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontSize: 12, padding: 0, whiteSpace: "nowrap" }}>{category}</button>
          <span style={{ color: "#ccc", flexShrink: 0 }}>›</span>
          <span style={{ color: "#555", fontWeight: 700, whiteSpace: "nowrap" }}>Lote {lot.loteNum}</span>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "12px 12px 40px" : "20px 16px 48px" }}>

        {/* ── Main product section ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr",
          gap: isMobile ? 16 : 24,
          alignItems: "start",
        }}>

          {/* ── Gallery ── */}
          <div>
            <div style={{
              backgroundColor: "white",
              border: "1px solid #e8e8e8",
              borderRadius: 10,
              padding: isMobile ? 20 : 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              aspectRatio: "1",
              position: "relative",
            }}>
              <img
                src={thumbs[activeThumb]}
                alt={lot.title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
            {thumbs.length > 1 && (
              <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-start" }}>
                {thumbs.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveThumb(i)}
                    style={{
                      width: isMobile ? 60 : 70,
                      height: isMobile ? 60 : 70,
                      border: `2px solid ${activeThumb === i ? CB_BLUE : "#ddd"}`,
                      borderRadius: 8,
                      overflow: "hidden",
                      cursor: "pointer",
                      backgroundColor: "white",
                      padding: 4,
                      transition: "border-color 0.15s",
                      flexShrink: 0,
                    }}
                  >
                    <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Right column: title + auction info panel ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {/* Tags */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{ backgroundColor: "#eef0ff", color: CB_BLUE, fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>Lote #{lot.loteNum}</span>
              <span style={{ backgroundColor: "#f5f5f5", color: "#555", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{category}</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: isMobile ? 17 : 20, fontWeight: 900, color: "#222", lineHeight: 1.3, margin: 0 }}>
              {lot.title}
            </h1>


            {/* ── Auction Info Panel ── */}
            <div style={{ border: "1px solid #ddd", borderRadius: 8, overflow: "hidden", backgroundColor: "white" }}>

              {/* Status header */}
              <div style={{
                backgroundColor: isVendido ? "#e53935" : "#2e7d32",
                padding: "10px 16px",
                textAlign: "center",
              }}>
                <span style={{ color: "white", fontWeight: 900, fontSize: 15, letterSpacing: "1px" }}>
                  {isVendido ? "VENDIDO" : "DISPONÍVEL"}
                </span>
              </div>

              {/* Price block */}
              <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: "#666", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                  {isVendido ? "Maior Lance no Momento" : "Maior Lance no Momento"}
                </p>
                <p style={{ fontSize: isMobile ? 26 : 30, fontWeight: 900, color: "#222", lineHeight: 1, marginBottom: 4 }}>
                  {lot.price}
                </p>
                <p style={{ fontSize: 11, color: "#999" }}>{todayStr()}</p>

                {isVendido && lot.buyer && (
                  <div style={{ marginTop: 8, fontSize: 12, color: "#555" }}>
                    <p style={{ fontWeight: 700 }}>{anonymizeBuyer(lot.buyer)}</p>
                    <p style={{ color: "#888" }}>Arrematante: {lot.buyer}</p>
                    <p style={{ color: "#888" }}>CPF: {lot.cpf}</p>
                  </div>
                )}
              </div>

              {/* Fees block */}
              <div style={{ padding: "12px 16px", borderBottom: "1px solid #eee", fontSize: 13 }}>
                <p style={{ color: "#444", marginBottom: 3 }}>+ Comissão (5%): <strong>{formatBRL(comissao)}</strong></p>
                <p style={{ fontWeight: 900, color: "#111", fontSize: 14, marginTop: 6 }}>
                  Total a Pagar: <span style={{ color: CB_BLUE }}>{formatBRL(priceNum + comissao)}</span>
                </p>
              </div>

              {/* Views */}
              <div style={{ padding: "8px 16px", borderBottom: "1px solid #eee", display: "flex", justifyContent: "flex-end", fontSize: 12, color: "#666" }}>
                <span>👁 {views.toLocaleString("pt-BR")}</span>
              </div>

              {/* CTA */}
              <div style={{ padding: "14px 16px" }}>
                {isVendido ? (
                  <button disabled style={{ display: "block", width: "100%", textAlign: "center", padding: "13px", backgroundColor: "#f5f5f5", color: "#aaa", fontWeight: 900, fontSize: 15, borderRadius: 6, border: "1px solid #ddd", cursor: "not-allowed" }}>
                    🔒 Lance Encerrado
                  </button>
                ) : (
                  <button
                    style={{
                      display: "block", width: "100%", textAlign: "center", padding: "13px",
                      backgroundColor: CB_YELLOW, color: "#1a1a2e", fontWeight: 900, fontSize: 15,
                      borderRadius: 6, border: "none", cursor: "pointer",
                    }}
                  >
                    Dar Lance →
                  </button>
                )}
                <button
                  onClick={() => setLocation("/")}
                  style={{
                    display: "block", width: "100%", textAlign: "center", padding: "11px",
                    backgroundColor: "white", color: CB_BLUE, fontWeight: 800, fontSize: 13,
                    borderRadius: 6, border: `2px solid ${CB_BLUE}`, cursor: "pointer", marginTop: 8,
                  }}
                >
                  ← Ver Todos os Lotes
                </button>
              </div>

              {/* Leiloeiro Oficial */}
              <div style={{ backgroundColor: "#fafafa", borderTop: "1px solid #eee", padding: "12px 16px", textAlign: "center" }}>
                <p style={{ fontSize: 11, fontWeight: 900, color: "#555", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 6 }}>Leiloeiro Oficial</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#222" }}>Osmar Campos Vicente Marques</p>
                <p style={{ fontSize: 12, color: "#888" }}>JUCESP 1487</p>
              </div>

              {/* Grupo Casas Bahia logo + auction details */}
              <div style={{ borderTop: "1px solid #eee", padding: "18px 16px", textAlign: "center" }}>
                <img
                  src="/images/grupo-casas-bahia.jpeg"
                  alt="Grupo Casas Bahia"
                  style={{ height: 220, width: "auto", objectFit: "contain", borderRadius: 10, display: "block", margin: "0 auto 14px" }}
                />
                <p style={{ fontSize: 12, color: "#555", lineHeight: 1.6 }}>
                  Leilão de Linha Branca - Logística Reversa<br />
                  Casas Bahia (186 Lotes)<br />
                  Online
                </p>
                <div style={{ marginTop: 10, display: "flex", flexDirection: "column", gap: 4 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>Data do Leilão:</span>
                    <span style={{ fontSize: 12, color: "#444" }}>{todayDateStr()}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 12, fontWeight: 800, color: "#444" }}>Lance Inicial:</span>
                    <span style={{ fontSize: 12, color: "#444" }}>{lanceinicial(priceNum)}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>

        {/* ── Observações do Lote ── */}
        <div style={{ marginTop: 24, backgroundColor: "white", borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 20, backgroundColor: CB_BLUE, borderRadius: 2 }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, color: "#222", margin: 0 }}>Observações do Lote</h2>
          </div>
          <div style={{ padding: isMobile ? "16px" : "20px 24px", display: "flex", flexDirection: "column", gap: 10 }}>
            {[
              {
                num: "1",
                text: "Os produtos são novos e sem uso, com avaria exclusivamente estética (amassados, riscos ou embalagem danificada). Não é possível realizar trocas ou devoluções."
              },
              {
                num: "2",
                text: "Os itens podem apresentar avarias estéticas como amassados, riscos, sujeira ou embalagem danificada. As avarias não comprometem o funcionamento dos equipamentos."
              },
              {
                num: "3",
                text: "Será cobrada uma taxa de 5% referente à comissão do leiloeiro sobre o valor arrematado, conforme descrito no edital."
              },
              {
                num: "4",
                text: "Aquisição do item: selecione o lote desejado, realize o pagamento da taxa de 5% de comissão do leiloeiro e informe o seu endereço de entrega. O produto será enviado diretamente para você em qualquer estado do Brasil."
              },
              {
                num: "5",
                text: "Pagamento na Entrega: o cliente pode optar pelo pagamento do produto diretamente na entrega. Nesse caso, é necessário assinar um contrato de compromisso de compra. Em caso de desistência no momento da entrega, será cobrada uma multa de R$ 240,00 para cobertura dos custos de transporte."
              },
            ].map(item => (
              <div key={item.num} style={{ display: "flex", gap: 10, padding: "10px 12px", backgroundColor: "#fafafa", borderRadius: 8, border: "1px solid #f0f0f0" }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: CB_BLUE, minWidth: 20, flexShrink: 0 }}>{item.num}.</span>
                <p style={{ fontSize: 13, color: "#555", lineHeight: 1.7, margin: 0 }}>{item.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Description ── */}
        <div style={{ marginTop: 20, backgroundColor: "white", borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 4, height: 20, backgroundColor: CB_YELLOW, borderRadius: 2 }} />
            <h2 style={{ fontSize: 16, fontWeight: 900, color: "#222", margin: 0 }}>Descrição do Lote</h2>
          </div>
          <div style={{ padding: isMobile ? "16px" : "20px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {descLines.map((line, i) => (
                <p key={i} style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: 0 }}>{line}</p>
              ))}
            </div>

            {/* Info grid */}
            <div style={{ marginTop: 20, borderTop: "1px solid #f0f0f0", paddingTop: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: "#333", marginBottom: 12 }}>Informações do Lote</h3>
              <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr" : "1fr 1fr", gap: isMobile ? "0" : "0 32px" }}>
                {[
                  ["Nº do Lote", lot.loteNum],
                  ["Item ID", lot.itemId],
                  ["Categoria", category],
                  ["Status", lot.status],
                  ["Valor do Lance", lot.price],
                  ["Entrega", "Todo o Brasil"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontSize: 13, color: "#999", fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#222", fontWeight: 900, textAlign: "right", maxWidth: "60%" }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Related lots ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 4, height: 20, backgroundColor: CB_YELLOW, borderRadius: 2 }} />
              <h2 style={{ fontSize: 16, fontWeight: 900, color: "#222", margin: 0 }}>Lotes Similares</h2>
              <span style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>— {category}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "repeat(5, 1fr)", gap: isMobile ? 10 : 14 }}>
              {related.map(rl => <RelatedCard key={rl.itemId} lot={rl} isMobile={isMobile} onClick={() => setLocation(`/lote/${rl.itemId}`)} />)}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: CB_BLUE, color: "white", padding: isMobile ? "24px 12px" : "28px 16px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexDirection: isMobile ? "column" : "row", justifyContent: "space-between", gap: 16 }}>
          <div>
            <img src="/images/logo-casasbahia-oficial.png" alt="Casas Bahia" style={{ height: 26, width: "auto", filter: "brightness(0) invert(1)", marginBottom: 8 }} />
            <p style={{ fontSize: 12, opacity: 0.65 }}>Leilão Oficial #144 — Linha Branca</p>
          </div>
          <div style={{ textAlign: isMobile ? "left" : "right", fontSize: 13 }}>
            <p style={{ fontWeight: 800, marginBottom: 4 }}>Leilão Oficial Casas Bahia</p>
            <p style={{ opacity: 0.75, marginBottom: 4 }}>Galpão: Jundiaí - SP</p>
            <p style={{ opacity: 0.75 }}>🚚 Entrega em todo o Brasil</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function RelatedCard({ lot, isMobile, onClick }: { lot: (typeof lots)[0]; isMobile: boolean; onClick: () => void }) {
  const [hov, setHov] = useState(false);
  const isVendido = lot.status === "Vendido";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        backgroundColor: "white",
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${hov ? "#b0b0b0" : "#e8e8e8"}`,
        cursor: "pointer",
        boxShadow: hov ? "0 6px 16px rgba(0,0,0,0.12)" : "0 2px 6px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "all 0.18s",
      }}
    >
      <div style={{ aspectRatio: "1", backgroundColor: "#fafafa", padding: isMobile ? 8 : 10 }}>
        <img
          src={getCategoryImage(lot)}
          alt={lot.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
      <div style={{ padding: isMobile ? "7px 8px 10px" : "8px 10px 12px" }}>
        <p style={{
          fontSize: 11,
          fontWeight: 700,
          color: "#333",
          lineHeight: 1.4,
          minHeight: "2.8em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
          marginBottom: 5,
        }}>{lot.title}</p>
        <p style={{ fontSize: isMobile ? 14 : 15, fontWeight: 900, color: CB_BLUE }}>{lot.price}</p>
        <p style={{ fontSize: 10, color: isVendido ? "#c0392b" : "#166534", fontWeight: 800, marginTop: 2 }}>
          {isVendido ? "✓ Vendido" : "● Disponível"} · #{lot.loteNum}
        </p>
      </div>
    </div>
  );
}
