import { useState } from "react";
import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";

const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#003087";

export default function LotDetailPage() {
  const params = useParams<{ itemId: string }>();
  const [, setLocation] = useLocation();
  const [activeThumb, setActiveThumb] = useState(0);

  const lot = lots.find(l => l.itemId === params.itemId);

  if (!lot) {
    return (
      <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "'Nunito', sans-serif" }}>
        <Header />
        <div style={{ maxWidth: 480, margin: "80px auto", textAlign: "center", padding: "0 16px" }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2 style={{ fontSize: 20, fontWeight: 800, color: "#333", marginBottom: 8 }}>Lote não encontrado</h2>
          <p style={{ fontSize: 14, color: "#888" }}>O item #{params.itemId} não existe neste leilão.</p>
          <button
            onClick={() => setLocation("/")}
            style={{
              marginTop: 24,
              padding: "12px 28px",
              borderRadius: 8,
              backgroundColor: CB_YELLOW,
              color: CB_BLUE,
              fontWeight: 800,
              fontSize: 14,
              border: "none",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            ← Voltar aos Lotes
          </button>
        </div>
      </div>
    );
  }

  const category = getCategory(lot.title);
  const image = getCategoryImage(lot.title);
  const isVendido = lot.status === "Vendido";

  const related = lots
    .filter(l => getCategory(l.title) === category && l.itemId !== lot.itemId)
    .slice(0, 5);

  const descLines = lot.description.split("\n").filter(Boolean);

  const thumbImages = [image, image, image];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "'Nunito', sans-serif" }}>
      <Header />

      {/* Breadcrumb */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 16px", display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#888" }}>
          <button
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, padding: 0 }}
          >
            Leilão #144
          </button>
          <span>›</span>
          <button
            onClick={() => setLocation("/")}
            style={{ background: "none", border: "none", color: CB_BLUE, fontWeight: 700, cursor: "pointer", fontFamily: "'Nunito', sans-serif", fontSize: 13, padding: 0 }}
          >
            {category}
          </button>
          <span>›</span>
          <span style={{ color: "#555", fontWeight: 600 }}>Lote {lot.loteNum}</span>
        </div>
      </div>

      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "24px 16px 48px" }}>
        {/* Main product area */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>

          {/* Left: Image gallery */}
          <div>
            <div style={{
              backgroundColor: "white",
              borderRadius: 12,
              border: "1px solid #e8e8e8",
              overflow: "hidden",
              aspectRatio: "1",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 24,
            }}>
              <img
                src={thumbImages[activeThumb]}
                alt={lot.title}
                style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }}
              />
            </div>
            <p style={{ textAlign: "center", fontSize: 11, color: "#bbb", marginTop: 8, fontStyle: "italic" }}>
              * Imagem meramente ilustrativa
            </p>
            <div style={{ display: "flex", gap: 10, marginTop: 12, justifyContent: "center" }}>
              {thumbImages.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setActiveThumb(i)}
                  style={{
                    width: 72,
                    height: 72,
                    border: `2px solid ${activeThumb === i ? CB_YELLOW : "#e0e0e0"}`,
                    borderRadius: 8,
                    overflow: "hidden",
                    cursor: "pointer",
                    background: "white",
                    padding: 4,
                    transition: "border-color 0.15s",
                  }}
                >
                  <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Right: Details */}
          <div>
            {/* Tags row */}
            <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
              <span style={{
                backgroundColor: isVendido ? "#e6f9ef" : "#fef2f2",
                color: isVendido ? "#1a7a45" : "#c0392b",
                border: `1px solid ${isVendido ? "#b8e8cf" : "#fcd5d5"}`,
                fontSize: 12,
                fontWeight: 800,
                padding: "4px 12px",
                borderRadius: 20,
              }}>
                {isVendido ? "✓ Vendido" : "● Não Vendido"}
              </span>
              <span style={{ backgroundColor: "#f0f0f0", color: "#555", fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
                Lote #{lot.loteNum}
              </span>
              <span style={{ backgroundColor: "#e8f0ff", color: CB_BLUE, fontSize: 12, fontWeight: 700, padding: "4px 12px", borderRadius: 20 }}>
                {category}
              </span>
            </div>

            <h1 style={{ fontSize: 22, fontWeight: 900, color: "#1a1a2e", lineHeight: 1.3, marginBottom: 20 }}>
              {lot.title}
            </h1>

            {/* Price card */}
            <div style={{
              backgroundColor: "white",
              border: `2px solid ${CB_YELLOW}`,
              borderRadius: 12,
              padding: 20,
              marginBottom: 16,
            }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase", marginBottom: 4 }}>
                Lance Final
              </p>
              <p style={{ fontSize: 38, fontWeight: 900, color: CB_BLUE, lineHeight: 1, marginBottom: 4 }}>
                {lot.price}
              </p>
              <p style={{ fontSize: 11, color: "#aaa" }}>
                + taxas do leiloeiro (verificar no site)
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
                padding: "14px",
                backgroundColor: CB_YELLOW,
                color: CB_BLUE,
                fontWeight: 900,
                fontSize: 16,
                borderRadius: 8,
                textDecoration: "none",
                marginBottom: 10,
                transition: "filter 0.15s",
                fontFamily: "'Nunito', sans-serif",
              }}
            >
              Ver no TudoLeilão →
            </a>
            <button
              onClick={() => setLocation("/")}
              style={{
                display: "block",
                width: "100%",
                textAlign: "center",
                padding: "12px",
                backgroundColor: "transparent",
                color: CB_BLUE,
                fontWeight: 800,
                fontSize: 14,
                borderRadius: 8,
                border: `2px solid ${CB_BLUE}`,
                cursor: "pointer",
                fontFamily: "'Nunito', sans-serif",
                transition: "background 0.15s",
              }}
            >
              ← Ver Todos os Lotes
            </button>

            {/* Warning */}
            <div style={{
              marginTop: 16,
              backgroundColor: "#fffbeb",
              border: "1px solid #fcd34d",
              borderRadius: 10,
              padding: "14px 16px",
              display: "flex",
              gap: 10,
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <div>
                <p style={{ fontWeight: 800, fontSize: 13, color: "#92400e", marginBottom: 4 }}>Atenção</p>
                <p style={{ fontSize: 12, color: "#78350f", lineHeight: 1.5 }}>
                  Produtos <strong>NÃO TESTADOS</strong>, podendo apresentar avarias, falta de peças,
                  acessórios e/ou componentes, <strong>PODENDO SER SUCATA.</strong>
                </p>
                <p style={{ fontSize: 12, color: "#78350f", fontWeight: 800, marginTop: 6 }}>
                  NÃO ENTREGAMOS — Retirada em Jundiaí - SP
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Description block */}
        <div style={{
          marginTop: 28,
          backgroundColor: "white",
          borderRadius: 12,
          border: "1px solid #e8e8e8",
          padding: "24px 28px",
        }}>
          <h2 style={{ fontSize: 17, fontWeight: 900, color: CB_BLUE, marginBottom: 16, paddingBottom: 12, borderBottom: "2px solid #FFCC00", display: "inline-block" }}>
            Descrição do Lote
          </h2>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {descLines.map((line, i) => (
              <p key={i} style={{ fontSize: 13, color: "#555", lineHeight: 1.7 }}>{line}</p>
            ))}
          </div>

          {/* Info table */}
          <div style={{ marginTop: 24, borderTop: "1px solid #f0f0f0", paddingTop: 20 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: "#333", marginBottom: 14 }}>Informações do Lote</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0 24px" }}>
              {[
                ["Nº do Lote", lot.loteNum],
                ["Item ID", lot.itemId],
                ["Categoria", category],
                ["Status", lot.status],
                ["Valor do Lance", lot.price],
                ["Local de Retirada", "Jundiaí - SP"],
              ].map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: "1px solid #f5f5f5" }}>
                  <span style={{ fontSize: 13, color: "#888", fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 13, color: "#1a1a2e", fontWeight: 800 }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related lots */}
        {related.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 900, color: CB_BLUE, marginBottom: 16 }}>
              Lotes Similares — {category}
            </h2>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 14 }}>
              {related.map(rl => (
                <div
                  key={rl.itemId}
                  className="product-card"
                  onClick={() => setLocation(`/lote/${rl.itemId}`)}
                  style={{
                    backgroundColor: "white",
                    borderRadius: 10,
                    overflow: "hidden",
                    border: "1px solid #ececec",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
                  }}
                >
                  <div style={{ aspectRatio: "1", backgroundColor: "#f9f9f9", padding: 8 }}>
                    <img
                      src={getCategoryImage(rl.title)}
                      alt={rl.title}
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
                    }}>{rl.title}</p>
                    <p style={{ fontSize: 14, fontWeight: 900, color: CB_BLUE, marginTop: 6 }}>{rl.price}</p>
                    <p style={{ fontSize: 10, color: "#aaa", marginTop: 2 }}>Lote #{rl.loteNum}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: CB_BLUE, color: "white", padding: "28px 16px", marginTop: 16 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 20, alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/images/logo-casasbahia.jpg" alt="Casas Bahia" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
            <div>
              <div style={{ fontWeight: 900, fontSize: 15, color: CB_YELLOW }}>casas bahia</div>
              <div style={{ fontSize: 11, opacity: 0.7 }}>Leilão Oficial #144 — Linha Branca</div>
            </div>
          </div>
          <div style={{ fontSize: 12, textAlign: "right" }}>
            <p style={{ opacity: 0.85, fontWeight: 700, marginBottom: 3 }}>Leiloeiro: TudoLeilão</p>
            <p style={{ opacity: 0.7, marginBottom: 3 }}>Retirada: Jundiaí - SP</p>
            <a href="https://tudoleilao.com.br/leilao/144/lotes" target="_blank" rel="noopener noreferrer"
              style={{ color: CB_YELLOW, fontWeight: 700, textDecoration: "none" }}>
              tudoleilao.com.br →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
