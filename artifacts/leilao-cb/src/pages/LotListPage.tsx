import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";

const ITEMS_PER_PAGE = 20;
const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#003087";

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
    const total = lots.length;
    const vendidos = lots.filter(l => l.status === "Vendido").length;
    return { total, vendidos, naoVendidos: total - vendidos };
  }, []);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f5f5f5", fontFamily: "'Nunito', sans-serif" }}>
      <Header onSearch={handleSearch} searchValue={search} />

      {/* Hero banner */}
      <div style={{ background: `linear-gradient(135deg, ${CB_BLUE} 0%, #0047C0 100%)`, color: "white" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "28px 16px" }}>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <span style={{
                  backgroundColor: CB_YELLOW,
                  color: CB_BLUE,
                  fontSize: 11,
                  fontWeight: 900,
                  padding: "3px 10px",
                  borderRadius: 4,
                  letterSpacing: "0.5px",
                }}>
                  LEILÃO #144
                </span>
                <span style={{ fontSize: 12, opacity: 0.7, fontWeight: 600 }}>TudoLeilão</span>
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 900, lineHeight: 1.15, letterSpacing: "-0.5px", marginBottom: 6 }}>
                Linha Branca — Logística Reversa
              </h1>
              <p style={{ fontSize: 13, opacity: 0.8, fontWeight: 500 }}>
                Refrigeradores • Lavadoras • Fogões • Freezers • Retirada em Jundiaí - SP
              </p>
            </div>
            <div style={{ display: "flex", gap: 32 }}>
              {[
                { val: stats.total, label: "Total de Lotes", color: CB_YELLOW },
                { val: stats.vendidos, label: "Vendidos", color: "#4ade80" },
                { val: stats.naoVendidos, label: "Não Vendidos", color: "#f87171" },
              ].map(item => (
                <div key={item.label} style={{ textAlign: "center" }}>
                  <div style={{ fontSize: 32, fontWeight: 900, color: item.color, lineHeight: 1 }}>{item.val}</div>
                  <div style={{ fontSize: 11, opacity: 0.7, marginTop: 4, fontWeight: 600 }}>{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Filters toolbar */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e8e8e8", position: "sticky", top: 0, zIndex: 40, boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "10px 16px", display: "flex", flexWrap: "wrap", alignItems: "center", gap: 12 }}>
          {/* Category filter as pills */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                style={{
                  padding: "5px 14px",
                  borderRadius: 20,
                  border: `2px solid ${category === cat ? CB_BLUE : "#e0e0e0"}`,
                  backgroundColor: category === cat ? CB_BLUE : "white",
                  color: category === cat ? "white" : "#555",
                  fontFamily: "'Nunito', sans-serif",
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: "pointer",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          <div style={{ width: 1, height: 24, backgroundColor: "#e0e0e0", flexShrink: 0 }} />

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Status:</span>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              style={{
                border: "2px solid #e0e0e0",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 600,
                color: "#333",
                outline: "none",
                cursor: "pointer",
              }}
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          {/* Sort */}
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: "#666" }}>Ordenar:</span>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              style={{
                border: "2px solid #e0e0e0",
                borderRadius: 6,
                padding: "4px 10px",
                fontSize: 12,
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 600,
                color: "#333",
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="lote">Nº do Lote</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
            </select>
          </div>

          <div style={{ marginLeft: "auto", fontSize: 13, fontWeight: 700, color: "#666" }}>
            {filtered.length} lote{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}
          </div>
        </div>
      </div>

      {/* Product grid */}
      <main style={{ maxWidth: 1280, margin: "0 auto", padding: "20px 16px 40px" }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: "64px 0" }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>🔍</div>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: "#555", marginBottom: 8 }}>Nenhum lote encontrado</h3>
            <p style={{ fontSize: 14, color: "#888" }}>Tente outro termo de busca ou remova os filtros</p>
            <button
              onClick={() => { setSearch(""); setCategory("Todos"); setStatus("Todos"); }}
              className="btn-yellow"
              style={{ marginTop: 20, padding: "10px 24px", fontSize: 14 }}
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
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
                <PaginationBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Anterior</PaginationBtn>
                {buildPageNumbers(page, totalPages).map((pn, i) =>
                  pn === "..." ? (
                    <span key={`dots-${i}`} style={{ padding: "6px 4px", color: "#999" }}>…</span>
                  ) : (
                    <PaginationBtn
                      key={pn}
                      onClick={() => setPage(pn as number)}
                      active={page === pn}
                    >
                      {pn}
                    </PaginationBtn>
                  )
                )}
                <PaginationBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Próxima →</PaginationBtn>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: CB_BLUE, color: "white", padding: "32px 16px", marginTop: 8 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "space-between", gap: 24 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
              <img src="/images/logo-casasbahia.jpg" alt="Casas Bahia" style={{ width: 40, height: 40, borderRadius: 6, objectFit: "cover" }} />
              <div>
                <div style={{ fontWeight: 900, fontSize: 16, color: CB_YELLOW }}>casas bahia</div>
                <div style={{ fontSize: 11, opacity: 0.7 }}>Leilão Oficial #144</div>
              </div>
            </div>
            <p style={{ fontSize: 12, opacity: 0.65, maxWidth: 360 }}>
              As fotos são meramente ilustrativas. Produtos NÃO TESTADOS, podendo apresentar avarias ou falta de componentes.
            </p>
          </div>
          <div style={{ textAlign: "right", fontSize: 12 }}>
            <p style={{ opacity: 0.85, fontWeight: 700, marginBottom: 4 }}>Leiloeiro: TudoLeilão</p>
            <p style={{ opacity: 0.7, marginBottom: 4 }}>Local de Retirada: Jundiaí - SP</p>
            <a
              href="https://tudoleilao.com.br/leilao/144/lotes"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: CB_YELLOW, fontWeight: 700, textDecoration: "none" }}
            >
              tudoleilao.com.br →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ lot, onClick }: { lot: (typeof lots)[0]; onClick: () => void }) {
  const isVendido = lot.status === "Vendido";
  const image = getCategoryImage(lot.title);

  return (
    <div
      className="product-card"
      onClick={onClick}
      style={{
        backgroundColor: "white",
        borderRadius: 10,
        overflow: "hidden",
        boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
        border: "1px solid #ececec",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Image area */}
      <div style={{ position: "relative", aspectRatio: "1", overflow: "hidden", backgroundColor: "#f9f9f9" }}>
        <img
          src={image}
          alt={lot.title}
          loading="lazy"
          style={{ width: "100%", height: "100%", objectFit: "contain", padding: 8 }}
        />
        {/* Lote badge */}
        <div style={{
          position: "absolute",
          top: 8,
          left: 8,
          backgroundColor: "rgba(0,0,0,0.65)",
          color: "white",
          fontSize: 10,
          fontWeight: 800,
          padding: "2px 7px",
          borderRadius: 4,
          backdropFilter: "blur(4px)",
        }}>
          Lote {lot.loteNum}
        </div>
        {/* Status dot */}
        <div style={{
          position: "absolute",
          top: 8,
          right: 8,
          width: 10,
          height: 10,
          borderRadius: "50%",
          backgroundColor: isVendido ? "#22c55e" : "#ef4444",
          boxShadow: `0 0 0 2px white, 0 0 0 3px ${isVendido ? "#22c55e" : "#ef4444"}`,
        }} />
      </div>

      {/* Content */}
      <div style={{ padding: "10px 12px 12px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        <p style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#1a1a2e",
          lineHeight: 1.4,
          minHeight: "2.8em",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
          overflow: "hidden",
        }}>
          {lot.title}
        </p>

        <div style={{ marginTop: "auto" }}>
          <p style={{ fontSize: 10, color: "#999", fontWeight: 600, marginBottom: 2 }}>Lance final</p>
          <p style={{ fontSize: 17, fontWeight: 900, color: "#003087", lineHeight: 1 }}>{lot.price}</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6, marginTop: 4 }}>
          <span style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "3px 8px",
            borderRadius: 4,
            backgroundColor: isVendido ? "#e6f9ef" : "#fef2f2",
            color: isVendido ? "#1a7a45" : "#c0392b",
            border: `1px solid ${isVendido ? "#b8e8cf" : "#fcd5d5"}`,
          }}>
            {lot.status}
          </span>
          <button
            style={{
              fontSize: 11,
              fontWeight: 800,
              padding: "3px 10px",
              borderRadius: 4,
              backgroundColor: "#FFCC00",
              color: "#003087",
              border: "none",
              cursor: "pointer",
              fontFamily: "'Nunito', sans-serif",
            }}
          >
            Ver mais
          </button>
        </div>
      </div>
    </div>
  );
}

function PaginationBtn({ children, onClick, disabled = false, active = false }: {
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
        padding: "7px 13px",
        borderRadius: 6,
        border: `2px solid ${active ? "#003087" : "#e0e0e0"}`,
        backgroundColor: active ? "#003087" : "white",
        color: active ? "white" : disabled ? "#bbb" : "#333",
        fontFamily: "'Nunito', sans-serif",
        fontWeight: 700,
        fontSize: 13,
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.15s",
      }}
    >
      {children}
    </button>
  );
}

function buildPageNumbers(current: number, total: number): (number | "...")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages: (number | "...")[] = [1];
  if (current > 3) pages.push("...");
  for (let p = Math.max(2, current - 1); p <= Math.min(total - 1, current + 1); p++) pages.push(p);
  if (current < total - 2) pages.push("...");
  pages.push(total);
  return pages;
}
