import { useParams, useLocation } from "wouter";
import Header from "@/components/Header";
import { lots, getCategory, getCategoryImage } from "@/data/lots";

export default function LotDetailPage() {
  const params = useParams<{ itemId: string }>();
  const [, setLocation] = useLocation();

  const lot = lots.find(l => l.itemId === params.itemId);

  if (!lot) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="max-w-7xl mx-auto px-4 py-16 text-center">
          <div className="text-5xl mb-4">❌</div>
          <h2 className="text-xl font-bold text-gray-700">Lote não encontrado</h2>
          <p className="text-gray-500 mt-2 text-sm">O item #{params.itemId} não existe neste leilão.</p>
          <button
            onClick={() => setLocation("/")}
            className="mt-6 px-6 py-2 rounded font-semibold text-sm"
            style={{ backgroundColor: '#FFCC00', color: '#003087' }}
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

  // Get related lots (same category, excluding current)
  const related = lots
    .filter(l => getCategory(l.title) === category && l.itemId !== lot.itemId)
    .slice(0, 6);

  const descLines = lot.description.split('\n').filter(Boolean);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Breadcrumb */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 py-2 flex items-center gap-2 text-sm text-gray-500">
          <button onClick={() => setLocation("/")} className="hover:underline" style={{ color: '#003087' }}>
            Leilão #144
          </button>
          <span>›</span>
          <span className="hover:underline cursor-pointer" style={{ color: '#003087' }}
            onClick={() => setLocation("/")}>
            {category}
          </span>
          <span>›</span>
          <span className="text-gray-700 font-medium truncate max-w-xs">Lote {lot.loteNum}</span>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Image */}
          <div>
            <div className="bg-white rounded-xl overflow-hidden shadow-sm border aspect-square">
              <img
                src={image}
                alt={lot.title}
                className="w-full h-full object-cover"
              />
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center italic">
              * Imagem meramente ilustrativa
            </p>

            {/* Gallery thumbnails placeholder */}
            <div className="mt-3 flex gap-2">
              {[1, 2, 3].map(i => (
                <div
                  key={i}
                  className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 overflow-hidden cursor-pointer hover:border-yellow-400 transition-colors"
                >
                  <img
                    src={image}
                    alt=""
                    className="w-full h-full object-cover opacity-60"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            {/* Status badge */}
            <div className="flex items-center gap-3 mb-3">
              <span
                className={`text-sm font-bold px-3 py-1 rounded-full ${
                  isVendido
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {isVendido ? '✓ Vendido' : '○ Não Vendido'}
              </span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Lote #{lot.loteNum}
              </span>
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-1 rounded">
                {category}
              </span>
            </div>

            <h1 className="text-xl md:text-2xl font-black text-gray-900 leading-tight mb-4">
              {lot.title}
            </h1>

            {/* Price box */}
            <div
              className="rounded-xl p-5 mb-5 border-2"
              style={{ borderColor: '#FFCC00', backgroundColor: '#FFFEF0' }}
            >
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">
                Lance Final
              </p>
              <p className="text-4xl font-black" style={{ color: '#003087' }}>
                {lot.price}
              </p>
              <p className="text-xs text-gray-400 mt-1">
                + taxas do leiloeiro (verificar no site)
              </p>
            </div>

            {/* CTA */}
            <a
              href={lot.url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center py-3 rounded-lg font-bold text-base mb-3 transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#FFCC00', color: '#003087' }}
            >
              Ver no TudoLeilão →
            </a>

            <button
              onClick={() => setLocation("/")}
              className="block w-full text-center py-2.5 rounded-lg font-semibold text-sm border-2 transition-colors hover:bg-gray-50"
              style={{ borderColor: '#003087', color: '#003087' }}
            >
              ← Ver Todos os Lotes
            </button>

            {/* Warning box */}
            <div className="mt-5 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start gap-2">
                <span className="text-amber-500 text-lg mt-0.5">⚠️</span>
                <div>
                  <p className="text-sm font-bold text-amber-800">Atenção</p>
                  <p className="text-xs text-amber-700 mt-1">
                    Produtos NÃO TESTADOS, podendo apresentar avarias, falta de peças, acessórios
                    e/ou componentes, <strong>PODENDO SER SUCATA.</strong>
                  </p>
                  <p className="text-xs text-amber-700 mt-1 font-semibold">
                    NÃO ENTREGAMOS — Retirada em Jundiaí - SP
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-lg font-bold mb-4" style={{ color: '#003087' }}>
            Descrição do Lote
          </h2>
          <div className="space-y-2">
            {descLines.map((line, i) => (
              <p key={i} className="text-sm text-gray-700 leading-relaxed">
                {line}
              </p>
            ))}
          </div>

          {/* Details table */}
          <div className="mt-6 border-t pt-4">
            <h3 className="text-sm font-bold text-gray-800 mb-3">Informações do Lote</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              {[
                { label: 'Lote nº', value: lot.loteNum },
                { label: 'Item ID', value: lot.itemId },
                { label: 'Categoria', value: category },
                { label: 'Status', value: lot.status },
                { label: 'Valor final', value: lot.price },
                { label: 'Local retirada', value: 'Jundiaí - SP' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between py-1.5 border-b border-gray-100">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Related lots */}
        {related.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-bold mb-4" style={{ color: '#003087' }}>
              Lotes Similares — {category}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {related.map(rl => (
                <div
                  key={rl.itemId}
                  className="product-card bg-white rounded-lg overflow-hidden shadow-sm border cursor-pointer"
                  onClick={() => setLocation(`/lote/${rl.itemId}`)}
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    <img
                      src={getCategoryImage(rl.title)}
                      alt={rl.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                  <div className="p-2">
                    <p className="text-xs font-medium text-gray-700 line-clamp-2 min-h-[2rem]">
                      {rl.title}
                    </p>
                    <p className="text-xs font-bold mt-1" style={{ color: '#003087' }}>
                      {rl.price}
                    </p>
                    <p className="text-xs text-gray-400">Lote #{rl.loteNum}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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
            </div>
            <div className="text-xs opacity-60 text-right">
              <p>Leiloeiro: TudoLeilão</p>
              <p>Local: Jundiaí - SP</p>
              <a
                href="https://tudoleilao.com.br/leilao/144/lotes"
                target="_blank"
                rel="noopener noreferrer"
                className="underline"
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
