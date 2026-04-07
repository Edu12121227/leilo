import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";

const ITEMS_PER_PAGE = 20;
const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#0033C6";

const CATEGORIES = ["Todos", "Refrigeradores", "Lavanderia", "Fogões", "Freezers", "Eletrodomésticos"];
const STATUSES = ["Todos", "Vendido", "Não Vendido"];

export default function LotListPage() {
  const [, setLocation] = useLocation();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("Todos");
  const [status, setStatus] = useState("Todos");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<"lote" | "price-asc" | "price-desc">("lote");

  const filtered = useMemo(() => {
    let result = [...lots];
    if (search.trim()) {
      const q = search.trim().toUpperCase();
      result = result.filter(l =>
        l.title.toUpperCase().includes(q) ||
        l.description.toUpperCase().includes(q) ||
        l.loteNum.includes(q)
      );
    }
    if (category !== "Todos") {
      result = result.filter(l => getCategory(l.title) === category);
    }
    if (status !== "Todos") {
      result = result.filter(l => l.status === status);
    }
    if (sortBy === "lote") result.sort((a, b) => parseInt(a.loteNum) - parseInt(b.loteNum));
    else if (sortBy === "price-asc") result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else if (sortBy === "price-desc") result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    return result;
  }, [search, category, status, sortBy]);

  function parsePrice(p: string) {
    return parseFloat(p.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);
  const handleSearch = (q: string) => { setSearch(q); setPage(1); };

  const stats = useMemo(() => {
    const vendidos = lots.filter(l => l.status === "Vendido").length;
    return { total: lots.length, vendidos, naoVendidos: lots.length - vendidos };
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f0f0f5", fontFamily: "'Nunito', sans-serif" }}>
      <Header onSearch={handleSearch} searchValue={search} />

      {/* ── Auction hero banner ── */}
      <div style={{ background: `linear-gradient(135deg, ${CB_BLUE} 0%, #0047D0 100%)`, color: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "22px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 16 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 5 }}>
                <span style={{
                  backgroundColor: CB_YELLOW,
                  color: CB_BLUE,
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "3px 10px",
                  borderRadius: 4,
                  letterSpacing: "0.5px",
                }}>LEILÃO #144</span>
                <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 700 }}>TudoLeilão</span>
              </div>
              <h1 style={{ fontSize: 26, fontWeight: 900, lineHeight: 1.2, marginBottom: 4 }}>
                Linha Branca — Logística Reversa
              </h1>
              <p style={{ fontSize: 13, opacity: 0.85, fontWeight: 600 }}>
                Refrigeradores • Lavadoras • Fogões • Freezers — Retirada em Jundiaí - SP
              </p>
            </div>
            <div style={{ display: "flex", gap: 28, alignItems: "center" }}>
              {[
                { val: stats.total, label: "Total de Lotes", color: CB_YELLOW },
                { val: stats.vendidos, label: "Vendidos", color: "#4ade80" },
                { val: stats.naoVendidos, label: "Não Vendidos", color: "#f87171" },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 30, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.val}</div>
                  <div style={{ fontSize: 11, opacity: 0.75, marginTop: 3, fontWeight: 700 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Filters bar ── */}
      <div style={{
        backgroundColor: "white",
        borderBottom: "1px solid #e0e0e0",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 2px 6px rgba(0,0,0,0.07)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10 }}>
          {/* Category pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                style={{
                  padding: "5px 13px",
                  borderRadius: 20,
                  border: `2px solid ${category === cat ? CB_BLUE : "#ddd"}`,
                  backgroundColor: category === cat ? CB_BLUE : "white",
                  color: category === cat ? "white" : "#555",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s",
                }}
              >{cat}</button>
            ))}
          </div>

          <div style={{ width: 1, height: 22, backgroundColor: "#e0e0e0", flexShrink: 0 }} />

          {/* Status dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#666" }}>Status:</span>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{ border: "2px solid #ddd", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#333", outline: "none", cursor: "pointer", backgroundColor: "white" }}
            >{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
          </div>

          {/* Sort dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 800, color: "#666" }}>Ordenar:</span>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              style={{ border: "2px solid #ddd", borderRadius: 6, padding: "4px 10px", fontSize: 12, fontFamily: "'Nunito', sans-serif", fontWeight: 700, color: "#333", outline: "none", cursor: "pointer", backgroundColor: "white" }}
            >
              <option value="lote">Nº do Lote</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
            </select>
          </div>

          <div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 800, color: "#666" }}>
            <span style={{ color: CB_BLUE }}>{filtered.length}</span> lote{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px 48px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 20, fontWeight: 900, color: "#444", marginBottom: 8 }}>Nenhum lote encontrado</h3>
            <p style={{ fontSize: 14, color: "#888" }}>Tente outro termo ou remova os filtros</p>
            <button
              onClick={() => { setSearch(""); setCategory("Todos"); setStatus("Todos"); }}
              style={{ marginTop: 20, padding: "10px 28px", backgroundColor: CB_YELLOW, color: CB_BLUE, fontWeight: 900, fontSize: 14, border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "'Nunito', sans-serif" }}
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))",
              gap: 16,
            }}>
              {paginated.map(lot => (
                <ProductCard
                  key={lot.itemId}
                  lot={lot}
                  onClick={() => setLocation(`/lote/${lot.itemId}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ marginTop: 36, display: "flex", justifyContent: "center", alignItems: "center", gap: 6 }}>
                <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</PageBtn>
                {buildPages(page, totalPages).map((pn, i) =>
                  pn === "..." ? (
                    <span key={`d${i}`} style={{ padding: "0 4px", color: "#bbb", fontWeight: 700 }}>•••</span>
                  ) : (
                    <PageBtn key={pn} onClick={() => setPage(pn as number)} active={page === pn}>{pn}</PageBtn>
                  )
                )}
                <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima →</PageBtn>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer style={{ backgroundColor: CB_BLUE, color: "white", padding: "32px 16px" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 24, alignItems: "flex-start" }}>
          <div>
            <img src="/images/logo-casasbahia-oficial.png" alt="Casas Bahia" style={{ height: 32, width: "auto", filter: "brightness(0) invert(1)", marginBottom: 10 }} />
            <p style={{ fontSize: 12, opacity: 0.65, maxWidth: 380, lineHeight: 1.7 }}>
              Leilão Oficial #144 — Linha Branca Logística Reversa.<br />
              As fotos são <strong>meramente ilustrativas</strong>. Produtos NÃO TESTADOS, podendo apresentar avarias ou falta de componentes.
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: 13 }}>
            <p style={{ fontWeight: 800, marginBottom: 4 }}>Leiloeiro: TudoLeilão</p>
            <p style={{ opacity: 0.75, marginBottom: 4 }}>Local de Retirada: Jundiaí - SP</p>
            <a href="https://tudoleilao.com.br/leilao/144/lotes" target="_blank" rel="noopener noreferrer"
              style={{ color: CB_YELLOW, fontWeight: 900, textDecoration: "none", fontSize: 13 }}>
              tudoleilao.com.br →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ── Product Card (matching CB's exact card style) ──
function ProductCard({ lot, onClick }: { lot: (typeof lots)[0]; onClick: () => void }) {
  const isVendido = lot.status === "Vendido";
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        backgroundColor: "white",
        borderRadius: 8,
        overflow: "hidden",
        border: `1px solid ${hovered ? "#b0b0b0" : "#e8e8e8"}`,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        boxShadow: hovered ? "0 6px 20px rgba(0,0,0,0.12)" : "0 2px 6px rgba(0,0,0,0.06)",
        transform: hovered ? "translateY(-3px)" : "none",
        transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
        position: "relative",
      }}
    >
      {/* Lote badge */}
      <div style={{
        position: "absolute",
        top: 8,
        left: 8,
        backgroundColor: "rgba(0,0,0,0.6)",
        color: "white",
        fontSize: 10,
        fontWeight: 900,
        padding: "2px 7px",
        borderRadius: 4,
        zIndex: 2,
        letterSpacing: "0.3px",
      }}>
        Lote {lot.loteNum}
      </div>

      {/* Status indicator dot */}
      <div style={{
        position: "absolute",
        top: 10,
        right: 10,
        width: 9,
        height: 9,
        borderRadius: "50%",
        backgroundColor: isVendido ? "#22c55e" : "#ef4444",
        zIndex: 2,
        boxShadow: `0 0 0 2px white`,
      }} />

      {/* Image */}
      <div style={{ aspectRatio: "1", backgroundColor: "#fafafa", display: "flex", alignItems: "center", justifyContent: "center", padding: 12 }}>
        <img
          src={getCategoryImage(lot.title)}
          alt={lot.title}
          loading="lazy"
          style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain", display: "block" }}
        />
      </div>

      {/* Content */}
      <div style={{ padding: "10px 12px 14px", flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Stars (illustrative) */}
        <div style={{ display: "flex", alignItems: "center", gap: 2, marginBottom: 5 }}>
          {[1,2,3,4,5].map(i => (
            <svg key={i} width="11" height="11" viewBox="0 0 24 24" fill={i <= 4 ? "#FFCC00" : "#ddd"}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          ))}
          <span style={{ fontSize: 10, color: "#888", marginLeft: 2, fontWeight: 700 }}>(4.0)</span>
        </div>

        {/* Title */}
        <p style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#333",
          lineHeight: 1.4,
          marginBottom: 8,
          minHeight: "2.8em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {lot.title}
        </p>

        {/* Price section */}
        <div style={{ marginBottom: 10 }}>
          <p style={{ fontSize: 10, color: "#aaa", fontWeight: 700, marginBottom: 2 }}>Lance final</p>
          <p style={{ fontSize: 20, fontWeight: 900, color: CB_BLUE, lineHeight: 1, letterSpacing: "-0.3px" }}>
            {lot.price}
          </p>
          <p style={{ fontSize: 10, color: "#999", marginTop: 3 }}>+ taxas do leiloeiro</p>
        </div>

        {/* Status + CTA */}
        <div style={{ marginTop: "auto", display: "flex", gap: 6, alignItems: "center" }}>
          <span style={{
            fontSize: 11,
            fontWeight: 800,
            padding: "3px 8px",
            borderRadius: 4,
            backgroundColor: isVendido ? "#e6f9ef" : "#fef2f2",
            color: isVendido ? "#1a7a45" : "#c0392b",
            border: `1px solid ${isVendido ? "#c3e6cb" : "#fcd5d5"}`,
            flexShrink: 0,
          }}>
            {isVendido ? "✓ Vendido" : "○ Disponível"}
          </span>
          <button
            style={{
              flex: 1,
              padding: "6px 8px",
              backgroundColor: CB_YELLOW,
              color: "#1a1a2e",
              fontWeight: 900,
              fontSize: 12,
              border: "none",
              borderRadius: 6,
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
              letterSpacing: "0.2px",
            }}
          >
            Ver mais
          </button>
        </div>
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, disabled = false, active = false }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        minWidth: 38,
        padding: "7px 12px",
        borderRadius: 6,
        border: `2px solid ${active ? CB_BLUE : "#ddd"}`,
        backgroundColor: active ? CB_BLUE : "white",
        color: active ? "white" : disabled ? "#ccc" : "#444",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 800,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
      }}
    >{children}</button>
  );
}

function buildPages(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
