import { useState } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";

const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#0033C6";

export default function LotDetailPage() {
  const params = useParams<{ itemId: string }>();
  const [, setLocation] = useLocation();
  const [activeThumb, setActiveThumb] = useState(0);

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
            ← Voltar aos Lotes
          </button>
        </div>
      </div>
    );
  }

  const category = getCategory(lot.title);
  const image = getCategoryImage(lot.title);
  const isVendido = lot.status === "Vendido";
  const related = lots.filter(l => getCategory(l.title) === category && l.itemId !== lot.itemId).slice(0, 5);
  const descLines = lot.description.split("\n").filter(Boolean);
  const thumbs = [image, image, image];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f5", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#888" }}>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: 0 }}>
            Início
          </button>
          <span style={{ color: "#ccc" }}>›</span>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: 0 }}>
            Leilão #144
          </button>
          <span style={{ color: "#ccc" }}>›</span>
          <button onClick={() => setLocation("/")} style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 800, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 12, padding: 0 }}>
            {category}
          </button>
          <span style={{ color: "#ccc" }}>›</span>
          <span style={{ color: "#555", fontWeight: 700 }}>Lote {lot.loteNum}</span>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px 48px" }}>
        {/* Main product section */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>

          {/* ── Left: Gallery ── */}
          <div>
            {/* Main image */}
            <div style={{
              backgroundColor: "white",
              border: "1px solid #e8e8e8",
              borderRadius: 10,
              padding: 32,
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
              {/* Illustrative badge */}
              <div style={{
                position: "absolute",
                bottom: 12,
                left: 12,
                backgroundColor: "rgba(0,0,0,0.45)",
                color: "white",
                fontSize: 10,
                fontWeight: 700,
                padding: "3px 8px",
                borderRadius: 4,
              }}>
                Imagem ilustrativa
              </div>
            </div>

            {/* Thumbnails */}
            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "flex-start" }}>
              {thumbs.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveThumb(i)}
                  style={{
                    width: 70,
                    height: 70,
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

          {/* ── Right: Details ── */}
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Tags */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span style={{
                backgroundColor: isVendido ? "#e6f9ef" : "#fef2f2",
                color: isVendido ? "#1a7a45" : "#c0392b",
                border: `1px solid ${isVendido ? "#c3e6cb" : "#fcd5d5"}`,
                fontSize: 12,
                fontWeight: 900,
                padding: "4px 12px",
                borderRadius: 20,
              }}>{isVendido ? "✓ Vendido" : "● Disponível"}</span>
              <span style={{ backgroundColor: "#eef0ff", color: CB_BLUE, fontSize: 12, fontWeight: 800, padding: "4px 12px", borderRadius: 20 }}>Lote #{lot.loteNum}</span>
              <span style={{ backgroundColor: "#f5f5f5", color: "#555", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>{category}</span>
            </div>

            {/* Title */}
            <h1 style={{ fontSize: 21, fontWeight: 900, color: "#222", lineHeight: 1.3, margin: 0 }}>
              {lot.title}
            </h1>

            {/* Stars */}
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ display: "flex", gap: 2 }}>
                {[1,2,3,4,5].map(i => (
                  <svg key={i} width="15" height="15" viewBox="0 0 24 24" fill={i <= 4 ? CB_YELLOW : "#ddd"}>
                    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
                  </svg>
                ))}
              </div>
              <span style={{ fontSize: 12, color: "#888", fontWeight: 700 }}>4.0 — Item de logística reversa</span>
            </div>

            {/* Price box */}
            <div style={{
              backgroundColor: "white",
              border: `1px solid #e8e8e8`,
              borderRadius: 10,
              padding: "18px 20px",
              borderLeft: `4px solid ${CB_YELLOW}`,
            }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: "#999", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: 4 }}>
                Lance Final
              </p>
              <p style={{ fontSize: 36, fontWeight: 900, color: CB_BLUE, lineHeight: 1, marginBottom: 4 }}>
                {lot.price}
              </p>
              <p style={{ fontSize: 11, color: "#bbb", marginBottom: 0 }}>
                + taxas do leiloeiro (verifique no site)
              </p>
            </div>

            {/* CTA buttons */}
            <a
              href={lot.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: "block",
                textAlign: "center",
                padding: "15px",
                backgroundColor: CB_YELLOW,
                color: "#1a1a2e",
                fontWeight: 900,
                fontSize: 16,
                borderRadius: 8,
                textDecoration: "none",
                fontFamily: "'Nunito', sans-serif",
                transition: "filter 0.15s",
                letterSpacing: "0.2px",
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = "brightness(0.95)")}
              onMouseLeave={e => (e.currentTarget.style.filter = "none")}
            >
              Comprar no TudoLeilão →
            </a>

            <button
              onClick={() => setLocation("/")}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "13px",
                backgroundColor: "white",
                color: CB_BLUE,
                fontWeight: 900,
                fontSize: 14,
                borderRadius: 8,
                border: `2px solid ${CB_BLUE}`,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
                transition: "background 0.15s, color 0.15s",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = CB_BLUE; (e.currentTarget as HTMLElement).style.color = "white"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = "white"; (e.currentTarget as HTMLElement).style.color = CB_BLUE; }}
            >
              ← Ver Todos os Lotes
            </button>

            {/* Warning */}
            <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fcd34d", borderRadius: 10, padding: "14px 16px", display: "flex", gap: 10 }}>
              <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.4 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 900, fontSize: 13, color: "#92400e", marginBottom: 4 }}>Atenção</p>
                <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
                  Produtos <strong>NÃO TESTADOS</strong> — podem apresentar avarias, falta de peças, acessórios
                  e/ou componentes, <strong>PODENDO SER SUCATA.</strong>
                </p>
                <p style={{ fontSize: 12, fontWeight: 900, color: "#78350f", marginTop: 6 }}>
                  NÃO ENTREGAMOS — Retirada: Jundiaí - SP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Description section ── */}
        <div style={{ marginTop: 28, backgroundColor: "white", borderRadius: 10, border: "1px solid #e8e8e8", overflow: "hidden" }}>
          {/* Section header */}
          <div style={{ padding: "18px 24px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 4, height: 22, backgroundColor: CB_YELLOW, borderRadius: 2 }} />
            <h2 style={{ fontSize: 17, fontWeight: 900, color: "#222", margin: 0 }}>Descrição do Lote</h2>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {descLines.map((line, i) => (
                <p key={i} style={{ fontSize: 13, color: "#555", lineHeight: 1.8, margin: 0 }}>{line}</p>
              ))}
            </div>

            {/* Info table */}
            <div style={{ marginTop: 24, borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: "#333", marginBottom: 14 }}>Informações do Lote</h3>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 32px" }}>
                {[
                  ["Nº do Lote", lot.loteNum],
                  ["Item ID", lot.itemId],
                  ["Categoria", category],
                  ["Status", lot.status],
                  ["Valor do Lance", lot.price],
                  ["Local de Retirada", "Jundiaí - SP"],
                ].map(([label, value]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                    <span style={{ fontSize: 13, color: "#999", fontWeight: 700 }}>{label}</span>
                    <span style={{ fontSize: 13, color: "#222", fontWeight: 900 }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── Related lots ── */}
        {related.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <div style={{ width: 4, height: 22, backgroundColor: CB_YELLOW, borderRadius: 2 }} />
              <h2 style={{ fontSize: 17, fontWeight: 900, color: "#222", margin: 0 }}>Lotes Similares</h2>
              <span style={{ fontSize: 13, color: "#888", fontWeight: 700 }}>— {category}</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
              {related.map(rl => <RelatedCard key={rl.itemId} lot={rl} onClick={() => setLocation(`/lote/${rl.itemId}`)} />)}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: CB_BLUE, color: "white", padding: "28px 16px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
          <div>
            <img src="/images/logo-casasbahia-oficial.png" alt="Casas Bahia" style={{ height: 28, width: "auto", filter: "brightness(0) invert(1)", marginBottom: 8 }} />
            <p style={{ fontSize: 12, opacity: 0.65 }}>Leilão Oficial #144 — Linha Branca Logística Reversa</p>
          </div>
          <div style={{ textAlign: "right", fontSize: 12 }}>
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

function RelatedCard({ lot, onClick }: { lot: (typeof lots)[0]; onClick: () => void }) {
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
      <div style={{ aspectRatio: "1", backgroundColor: "#fafafa", padding: 8 }}>
        <img
          src={getCategoryImage(lot.title)}
          alt={lot.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </div>
      <div style={{ padding: "8px 10px 12px" }}>
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
          marginBottom: 6,
        }}>{lot.title}</p>
        <p style={{ fontSize: 15, fontWeight: 900, color: CB_BLUE }}>{lot.price}</p>
        <p style={{ fontSize: 10, color: isVendido ? "#1a7a45" : "#c0392b", fontWeight: 800, marginTop: 3 }}>
          {isVendido ? "✓ Vendido" : "● Disponível"} · Lote #{lot.loteNum}
        </p>
      </div>
    </div>
  );
}
