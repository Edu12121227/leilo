import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";

const ITEMS_PER_PAGE = 20;

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
    if (category !== "Todos") result = result.filter(l => getCategory(l.title) === category);
    if (status !== "Todos") result = result.filter(l => l.status === status);
    if (sortBy === "lote") result.sort((a, b) => parseInt(a.loteNum) - parseInt(b.loteNum));
    else if (sortBy === "price-asc") result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    else result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
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
    <div className="min-h-screen bg-[#f0f0f5]" style={{ fontFamily: "'Nunito', sans-serif" }}>
      <Header onSearch={handleSearch} searchValue={search} />

      {/* ── Hero banner ── */}
      <div style={{ background: "linear-gradient(135deg, #0033C6 0%, #0047D0 100%)" }} className="text-white">
        <div className="max-w-[1280px] mx-auto px-3 md:px-4 py-4 md:py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 md:gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="bg-[#FFCC00] text-[#0033C6] text-[10px] font-black px-2.5 py-0.5 rounded">LEILÃO #144</span>
                <span className="text-[11px] opacity-70 font-bold">TudoLeilão</span>
              </div>
              <h1 className="text-[20px] md:text-[26px] font-black leading-snug mb-1">
                Linha Branca — Logística Reversa
              </h1>
              <p className="text-[12px] md:text-[13px] opacity-85 font-semibold">
                Refrigeradores • Lavadoras • Fogões • Freezers
                <span className="hidden md:inline"> — Retirada em Jundiaí - SP</span>
              </p>
            </div>
            <div className="flex gap-5 md:gap-7">
              {[
                { val: stats.total, label: "Total", color: "#FFCC00" },
                { val: stats.vendidos, label: "Vendidos", color: "#4ade80" },
                { val: stats.naoVendidos, label: "Não Vendidos", color: "#f87171" },
              ].map(item => (
                <div key={item.label} className="text-center">
                  <div className="text-[26px] md:text-[30px] font-black leading-none" style={{ color: item.color }}>{item.val}</div>
                  <div className="text-[10px] opacity-75 mt-0.5 font-bold">{item.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Sticky filters ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-sm">
        <div className="max-w-[1280px] mx-auto px-3 md:px-4 py-2 md:py-2.5">
          {/* Category pills — single scrollable row */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2 md:pb-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => { setCategory(cat); setPage(1); }}
                className="px-3 py-1 rounded-full text-[11px] md:text-[12px] font-extrabold cursor-pointer shrink-0 whitespace-nowrap transition-all border-2"
                style={{
                  borderColor: category === cat ? "#0033C6" : "#ddd",
                  backgroundColor: category === cat ? "#0033C6" : "white",
                  color: category === cat ? "white" : "#555",
                  fontFamily: "'Nunito', sans-serif",
                }}
              >{cat}</button>
            ))}
          </div>
          {/* Status + sort row */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-gray-500 whitespace-nowrap">Status:</span>
              <select
                value={status}
                onChange={e => { setStatus(e.target.value); setPage(1); }}
                className="border-2 border-gray-200 rounded-md px-2 py-1 text-[11px] font-bold text-gray-700 outline-none cursor-pointer bg-white"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-extrabold text-gray-500 whitespace-nowrap">Ordenar:</span>
              <select
                value={sortBy}
                onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
                className="border-2 border-gray-200 rounded-md px-2 py-1 text-[11px] font-bold text-gray-700 outline-none cursor-pointer bg-white"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                <option value="lote">Nº Lote</option>
                <option value="price-asc">Menor Preço</option>
                <option value="price-desc">Maior Preço</option>
              </select>
            </div>
            <div className="ml-auto text-[11px] font-extrabold text-gray-500">
              <span className="text-[#0033C6]">{filtered.length}</span> lotes
            </div>
          </div>
        </div>
      </div>

      {/* ── Product grid ── */}
      <main className="max-w-[1280px] mx-auto px-2.5 md:px-4 py-3 md:py-5 pb-10">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-black text-gray-600 mb-2">Nenhum lote encontrado</h3>
            <p className="text-sm text-gray-400">Tente outro termo ou remova os filtros</p>
            <button
              onClick={() => { setSearch(""); setCategory("Todos"); setStatus("Todos"); }}
              className="mt-5 px-6 py-2.5 rounded-lg font-extrabold text-sm border-none cursor-pointer"
              style={{ backgroundColor: "#FFCC00", color: "#0033C6", fontFamily: "'Nunito', sans-serif" }}
            >Limpar Filtros</button>
          </div>
        ) : (
          <>
            {/* 2 cols on mobile → 3 on sm → 4 on md → 5 on lg */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 md:gap-4">
              {paginated.map(lot => (
                <ProductCard key={lot.itemId} lot={lot} onClick={() => setLocation(`/lote/${lot.itemId}`)} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center items-center gap-1.5 flex-wrap">
                <PageBtn onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Ant.</PageBtn>
                {buildPages(page, totalPages).map((pn, i) =>
                  pn === "..." ? (
                    <span key={`d${i}`} className="px-1 text-gray-300 font-bold">•••</span>
                  ) : (
                    <PageBtn key={pn} onClick={() => setPage(pn as number)} active={page === pn}>{pn}</PageBtn>
                  )
                )}
                <PageBtn onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}>Prox. →</PageBtn>
              </div>
            )}
          </>
        )}
      </main>

      {/* ── Footer ── */}
      <footer className="bg-[#0033C6] text-white px-3 md:px-4 py-6 md:py-8">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row md:justify-between gap-4">
          <div>
            <img src="/images/logo-casasbahia-oficial.png" alt="Casas Bahia"
              className="h-6 w-auto mb-2" style={{ filter: "brightness(0) invert(1)" }} />
            <p className="text-[12px] opacity-60 max-w-sm leading-relaxed">
              Leilão Oficial #144 — Linha Branca Logística Reversa.<br />
              Fotos <strong>meramente ilustrativas</strong>. Produtos NÃO TESTADOS.
            </p>
          </div>
          <div className="text-[13px] md:text-right">
            <p className="font-extrabold mb-1">Leiloeiro: TudoLeilão</p>
            <p className="opacity-75 mb-1">Retirada: Jundiaí - SP</p>
            <a href="https://tudoleilao.com.br/leilao/144/lotes" target="_blank" rel="noopener noreferrer"
              className="text-[#FFCC00] font-black no-underline">tudoleilao.com.br →</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function ProductCard({ lot, onClick }: { lot: (typeof lots)[0]; onClick: () => void }) {
  const isVendido = lot.status === "Vendido";
  const [hov, setHov] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      className="bg-white rounded-lg overflow-hidden cursor-pointer flex flex-col relative"
      style={{
        border: `1px solid ${hov ? "#aaa" : "#e8e8e8"}`,
        boxShadow: hov ? "0 6px 20px rgba(0,0,0,0.11)" : "0 2px 6px rgba(0,0,0,0.05)",
        transform: hov ? "translateY(-2px)" : "none",
        transition: "box-shadow 0.18s, transform 0.18s, border-color 0.18s",
      }}
    >
      {/* Lote badge */}
      <div className="absolute top-1.5 left-1.5 bg-black/60 text-white text-[9px] font-black px-1.5 py-0.5 rounded z-10">
        #{lot.loteNum}
      </div>
      {/* Status dot */}
      <div
        className="absolute top-2 right-2 w-2 h-2 rounded-full z-10"
        style={{ backgroundColor: isVendido ? "#22c55e" : "#ef4444", boxShadow: "0 0 0 2px white" }}
      />

      {/* Image */}
      <div className="aspect-square bg-gray-50 flex items-center justify-center p-2 md:p-3">
        <img src={getCategoryImage(lot.title)} alt={lot.title} loading="lazy"
          className="max-w-full max-h-full object-contain block" />
      </div>

      {/* Content */}
      <div className="p-2 md:p-3 flex flex-col flex-1">
        {/* Stars — desktop only */}
        <div className="hidden md:flex items-center gap-0.5 mb-1.5">
          {[1,2,3,4,5].map(i => (
            <svg key={i} width="10" height="10" viewBox="0 0 24 24" fill={i <= 4 ? "#FFCC00" : "#ddd"}>
              <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
            </svg>
          ))}
          <span className="text-[9px] text-gray-400 ml-1 font-bold">4.0</span>
        </div>

        {/* Title */}
        <p className="text-[11px] md:text-[12px] font-bold text-gray-800 leading-snug mb-1.5 md:mb-2 line-clamp-2 min-h-[2.4em]">
          {lot.title}
        </p>

        {/* Price */}
        <div className="mb-2">
          <p className="hidden md:block text-[9px] text-gray-400 font-bold mb-0.5">Lance final</p>
          <p className="text-[15px] md:text-[18px] font-black leading-none" style={{ color: "#0033C6" }}>
            {lot.price}
          </p>
          <p className="hidden md:block text-[9px] text-gray-300 mt-0.5">+ taxas do leiloeiro</p>
        </div>

        {/* Status + CTA */}
        <div className="mt-auto flex items-center gap-1.5">
          <span
            className="text-[9px] md:text-[10px] font-extrabold px-1.5 py-0.5 rounded shrink-0"
            style={{
              backgroundColor: isVendido ? "#e6f9ef" : "#fef2f2",
              color: isVendido ? "#1a7a45" : "#c0392b",
              border: `1px solid ${isVendido ? "#c3e6cb" : "#fcd5d5"}`,
            }}
          >
            {isVendido ? "✓" : "○"} {isVendido ? "Vendido" : "Disponível"}
          </span>
          <button
            className="flex-1 py-1.5 rounded font-extrabold text-[11px] md:text-[12px] border-none cursor-pointer"
            style={{ backgroundColor: "#FFCC00", color: "#1a1a2e", fontFamily: "'Nunito', sans-serif" }}
          >
            Ver mais
          </button>
        </div>
      </div>
    </div>
  );
}

function PageBtn({ children, onClick, disabled = false, active = false }: {
  children: React.ReactNode; onClick: () => void; disabled?: boolean; active?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="min-w-[34px] px-2.5 py-1.5 rounded-md font-extrabold text-[12px] border-2 cursor-pointer transition-all"
      style={{
        borderColor: active ? "#0033C6" : "#ddd",
        backgroundColor: active ? "#0033C6" : "white",
        color: active ? "white" : disabled ? "#ccc" : "#444",
        fontFamily: "'Nunito', sans-serif",
        cursor: disabled ? "not-allowed" : "pointer",
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
