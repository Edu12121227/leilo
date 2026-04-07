import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";

const ITEMS_PER_PAGE = 24;

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

    if (sortBy === "lote") {
      result.sort((a, b) => parseInt(a.loteNum) - parseInt(b.loteNum));
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => parsePrice(a.price) - parsePrice(b.price));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => parsePrice(b.price) - parsePrice(a.price));
    }

    return result;
  }, [search, category, status, sortBy]);

  function parsePrice(p: string) {
    return parseFloat(p.replace("R$", "").replace(/\./g, "").replace(",", ".").trim()) || 0;
  }

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const paginated = filtered.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSearch = (q: string) => {
    setSearch(q);
    setPage(1);
  };

  const stats = useMemo(() => {
    const total = lots.length;
    const vendidos = lots.filter(l => l.status === "Vendido").length;
    return { total, vendidos, naoVendidos: total - vendidos };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header onSearch={handleSearch} searchValue={search} />

      {/* Hero banner */}
      <div style={{ background: 'linear-gradient(135deg, #003087 0%, #0052CC 100%)' }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="text-xs font-bold px-2 py-0.5 rounded"
                  style={{ backgroundColor: '#FFCC00', color: '#003087' }}
                >
                  LEILÃO #144
                </span>
                <span className="text-xs opacity-70">TudoLeilão</span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black">
                Linha Branca — Logística Reversa
              </h1>
              <p className="text-sm opacity-80 mt-1">
                Refrigeradores, Lavadoras, Fogões e mais • Retirada em Jundiaí - SP
              </p>
            </div>
            <div className="flex gap-4 md:gap-6">
              <div className="text-center">
                <div className="text-2xl font-black" style={{ color: '#FFCC00' }}>{stats.total}</div>
                <div className="text-xs opacity-75">Total de Lotes</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-green-400">{stats.vendidos}</div>
                <div className="text-xs opacity-75">Vendidos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-black text-red-300">{stats.naoVendidos}</div>
                <div className="text-xs opacity-75">Não Vendidos</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border-b shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Categoria:</label>
            <select
              value={category}
              onChange={e => { setCategory(e.target.value); setPage(1); }}
              className="border rounded px-2 py-1 text-sm outline-none focus:border-yellow-400"
            >
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Status:</label>
            <select
              value={status}
              onChange={e => { setStatus(e.target.value); setPage(1); }}
              className="border rounded px-2 py-1 text-sm outline-none focus:border-yellow-400"
            >
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-semibold text-gray-600">Ordenar:</label>
            <select
              value={sortBy}
              onChange={e => { setSortBy(e.target.value as typeof sortBy); setPage(1); }}
              className="border rounded px-2 py-1 text-sm outline-none focus:border-yellow-400"
            >
              <option value="lote">Nº do Lote</option>
              <option value="price-asc">Menor Preço</option>
              <option value="price-desc">Maior Preço</option>
            </select>
          </div>

          <div className="ml-auto text-sm text-gray-500">
            {filtered.length} lote{filtered.length !== 1 ? 's' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Grid */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {filtered.length === 0 ? (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold text-gray-700">Nenhum lote encontrado</h3>
            <p className="text-gray-500 text-sm mt-1">Tente outro termo de busca ou filtro</p>
            <button
              onClick={() => { setSearch(""); setCategory("Todos"); setStatus("Todos"); }}
              className="mt-4 px-4 py-2 text-sm font-semibold rounded"
              style={{ backgroundColor: '#FFCC00', color: '#003087' }}
            >
              Limpar Filtros
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {paginated.map(lot => (
                <div
                  key={lot.itemId}
                  className="product-card bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 cursor-pointer"
                  onClick={() => setLocation(`/lote/${lot.itemId}`)}
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    <img
                      src={getCategoryImage(lot.title)}
                      alt={lot.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2">
                      <span className="bg-black bg-opacity-60 text-white text-xs px-1.5 py-0.5 rounded font-semibold">
                        #{lot.loteNum}
                      </span>
                    </div>
                    <div className="absolute top-2 right-2">
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                          lot.status === 'Vendido'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {lot.status === 'Vendido' ? '✓' : '○'}
                      </span>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="p-3">
                    <p className="text-xs font-medium text-gray-800 line-clamp-2 min-h-[2.5rem]">
                      {lot.title}
                    </p>
                    <div className="mt-2 flex items-end justify-between">
                      <div>
                        <p className="text-xs text-gray-500">Lance final</p>
                        <p className="text-sm font-black" style={{ color: '#003087' }}>
                          {lot.price}
                        </p>
                      </div>
                      <span
                        className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                          lot.status === 'Vendido'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {lot.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 text-sm rounded border font-medium disabled:opacity-40 hover:bg-gray-50"
                >
                  ← Anterior
                </button>

                {Array.from({ length: Math.min(7, totalPages) }, (_, i) => {
                  let pageNum;
                  if (totalPages <= 7) {
                    pageNum = i + 1;
                  } else if (page <= 4) {
                    pageNum = i + 1;
                  } else if (page >= totalPages - 3) {
                    pageNum = totalPages - 6 + i;
                  } else {
                    pageNum = page - 3 + i;
                  }
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setPage(pageNum)}
                      className="px-3 py-1.5 text-sm rounded border font-medium transition-colors"
                      style={page === pageNum
                        ? { backgroundColor: '#003087', color: 'white', borderColor: '#003087' }
                        : {}
                      }
                    >
                      {pageNum}
                    </button>
                  );
                })}

                <button
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 text-sm rounded border font-medium disabled:opacity-40 hover:bg-gray-50"
                >
                  Próxima →
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Footer */}
      <footer style={{ backgroundColor: '#003087' }} className="text-white mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div
                style={{ backgroundColor: '#FFCC00', color: '#003087' }}
                className="inline-block px-3 py-1 rounded font-black text-sm mb-2"
              >
                Casas Bahia
              </div>
              <p className="text-xs opacity-70">Leilão Oficial #144 — Linha Branca Logística Reversa</p>
              <p className="text-xs opacity-60 mt-1">
                As fotos são meramente ilustrativas. Produtos NÃO TESTADOS.
              </p>
            </div>
            <div className="text-xs opacity-60 text-right">
              <p>Leiloeiro: TudoLeilão</p>
              <p>Local: Jundiaí - SP</p>
              <a
                href="https://tudoleilao.com.br/leilao/144/lotes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:opacity-90"
              >
                tudoleilao.com.br
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
