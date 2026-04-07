import { useState } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";
import { useIsMobile } from "@/hooks/useIsMobile";

const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#0033C6";

export default function LotDetailPage() {
  const params = useParams<{ itemId: string }>();
  const [, setLocation] = useLocation();
  const [activeThumb, setActiveThumb] = useState(0);
  const isMobile = useIsMobile();

  const lot = lots.find(l => l.itemId === params.itemId);

  if (!lot) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f5", fontFamily: "'Nunito', sans-serif" }}>
        <Header />
        <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 22, fontWeight: 900, color: "#333" }}>Lote não encontrado</h2>
          <p style={{ fontSize: 14, color: "#888", marginTop: 8 }}>O item #{params.itemId} não existe neste leilão.</p>
          <button onClick={() => setLocation("/")} style={{ marginTop: 24, padding: "12px 28px", backgroundColor: CB_YELLOW, color: CB_BLUE, fontWeight: 900, fontSize: 14, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}>
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
  const thumbs = [image, image, image];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f5", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: isMobile ? "8px 12px" : "10px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#888", overflowX: "auto" }} className="no-scrollbar">
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: 0, whiteSpace: "nowrap" }}>Início</button>
          <span style={{ color: "#ccc", flexShrink: 0 }}>›</span>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: 0, whiteSpace: "nowrap" }}>Leilão #144</button>
          <span style={{ color: "#ccc", flexShrink: 0 }}>›</span>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: 0, whiteSpace: "nowrap" }}>{category}</button>
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
              <div style={{ position: "absolute", bottom: 10, left: 10, backgroundColor: "rgba(0,0,0,0.4)", color: "white", fontSize: 10, fontWeight: 700, padding: "3px 8px", borderRadius: 4 }}>
                Imagem ilustrativa
              </div>
            </div>

            {/* Thumbnails */}
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
          </div>

          {/* ── Details ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {/* Tags */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                backgroundColor: isVendido ? "#e6f9ef" : "#fef2f2",
                color: isVendido ? "#1a7a45" : "#c0392b",
                border: `1px solid ${isVendido ? "#c3e6cb" : "#fcd5d5"}`,
                fontSize: 12, fontWeight: 900, padding: "4px 12px", borderRadius: 20,
              }}>{isVendido ? "✓ Vendido" : "● Disponível"}</span>
              <span style={{ backgroundColor: "#eef0ff", color: CB_BLUE, fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>Lote #{lot.loteNum}</span>
              <span style={{ backgroundColor: "#f5f5f5", color: "#555", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{category}</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: isMobile ? 17 : 21, fontWeight: 900, color: "#222", lineHeight: 1.3, margin: 0 }}>
              {lot.title}
            </h1>

            {/* Stars */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= 4 ? CB_YELLOW : "#ddd"}>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>4.0 — Logística Reversa</span>
            </div>

            {/* Price box */}
            <div style={{
              backgroundColor: "white",
              border: "1px solid #e8e8e8",
              borderRadius: 10,
              padding: isMobile ? "14px 16px" : "18px 20px",
              borderLeft: `4px solid ${CB_YELLOW}`,
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>Lance Final</p>
              <p style={{ fontSize: isMobile ? 28 : 36, fontWeight: 900, color: CB_BLUE, lineHeight: 1, marginBottom: 4 }}>{lot.price}</p>
              <p style={{ fontSize: 11, color: "#bbb" }}>+ taxas do leiloeiro</p>
            </div>

            {/* CTA buttons */}
            <a
              href={lot.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: isMobile ? "14px" : "15px",
                backgroundColor: CB_YELLOW,
                color: "#1a1a2e",
                fontWeight: 900,
                fontSize: isMobile ? 15 : 16,
                borderRadius: 8,
                textDecoration: "none",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              Comprar no TudoLeilão →
            </a>

            <button
              onClick={() => setLocation("/")}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: isMobile ? "12px" : "13px",
                backgroundColor: "white",
                color: CB_BLUE,
                fontWeight: 900,
                fontSize: 14,
                borderRadius: 8,
                border: `2px solid ${CB_BLUE}`,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              ← Ver Todos os Lotes
            </button>

            {/* Warning */}
            <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 16, flexShrink: 0, lineHeight: 1.5 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 900, fontSize: 13, color: "#92400e", marginBottom: 4 }}>Atenção</p>
                <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
                  Produtos <strong>NÃO TESTADOS</strong> — podem apresentar avarias, falta de peças e/ou componentes, <strong>PODENDO SER SUCATA.</strong>
                </p>
                <p style={{ fontSize: 12, fontWeight: 900, color: "#78350f", marginTop: 5 }}>
                  NÃO ENTREGAMOS — Retirada: Jundiaí - SP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Description ── */}
        <div style={{ marginTop: 24, backgroundColor: "white", borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
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
                  ["Retirada", "Jundiaí - SP"],
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
            <p style={{ fontWeight: 800, marginBottom: 4 }}>Leiloeiro: TudoLeilão</p>
            <p style={{ opacity: 0.75, marginBottom: 4 }}>Retirada: Jundiaí - SP</p>
            <a href="https://tudoleilao.com.br/leilao/144/lotes" target="_blank" rel="noopener noreferrer"
              style={{ color: CB_YELLOW, fontWeight: 900, textDecoration: "none" }}>tudoleilao.com.br →</a>
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
          fontSize: isMobile ? 11 : 11,
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
        <p style={{ fontSize: 10, color: isVendido ? "#1a7a45" : "#c0392b", fontWeight: 800, marginTop: 2 }}>
          {isVendido ? "✓ Vendido" : "○ Disponível"} · #{lot.loteNum}
        </p>
      </div>
    </div>
  );
}
