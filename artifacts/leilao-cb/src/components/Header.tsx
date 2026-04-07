import { useState } from "react";
import { useLocation } from "wouter";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

export default function Header({ onSearch, searchValue = "" }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(searchValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      {/* Top bar - CB Blue */}
      <div style={{ backgroundColor: '#003087' }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 py-1 flex items-center justify-between text-xs">
          <div className="flex items-center gap-4">
            <span>Leilão Oficial Casas Bahia</span>
            <span className="hidden sm:inline">|</span>
            <span className="hidden sm:inline">Linha Branca - Logística Reversa</span>
          </div>
          <div className="flex items-center gap-3">
            <span>Retirada: Jundiaí - SP</span>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
        {/* Logo */}
        <button
          onClick={() => setLocation("/")}
          className="flex-shrink-0 flex items-center gap-2"
        >
          <div
            style={{ backgroundColor: '#FFCC00' }}
            className="px-3 py-2 rounded flex items-center"
          >
            <span className="font-black text-lg" style={{ color: '#003087', letterSpacing: '-0.5px' }}>
              Casas Bahia
            </span>
          </div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold" style={{ color: '#003087' }}>Leilão Oficial</p>
            <p className="text-xs text-gray-500">Linha Branca</p>
          </div>
        </button>

        {/* Search bar */}
        <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
          <div className="flex">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Buscar produtos no leilão..."
              className="flex-1 border-2 border-gray-200 rounded-l-md px-4 py-2 text-sm outline-none focus:border-yellow-400 transition-colors"
            />
            <button
              type="submit"
              style={{ backgroundColor: '#FFCC00' }}
              className="px-5 py-2 rounded-r-md font-semibold text-sm text-black hover:opacity-90 transition-opacity flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="hidden sm:inline">Buscar</span>
            </button>
          </div>
        </form>

        {/* Actions */}
        <div className="flex-shrink-0 hidden md:flex items-center gap-3">
          <a
            href="https://tudoleilao.com.br/leilao/144/lotes"
            target="_blank"
            rel="noopener noreferrer"
            style={{ backgroundColor: '#003087' }}
            className="text-white text-xs px-3 py-2 rounded font-semibold hover:opacity-90 transition-opacity"
          >
            Ver no TudoLeilão
          </a>
        </div>
      </div>

      {/* Category bar */}
      <div style={{ backgroundColor: '#FFCC00' }}>
        <div className="max-w-7xl mx-auto px-4 py-1.5 flex items-center gap-6 overflow-x-auto">
          {['Todos os Lotes', 'Refrigeradores', 'Lavanderia', 'Fogões', 'Freezers'].map(cat => (
            <button
              key={cat}
              onClick={() => {
                setLocation("/");
                if (onSearch && cat !== 'Todos os Lotes') onSearch(cat === 'Refrigeradores' ? 'REFRIGERADOR' : cat === 'Lavanderia' ? 'LAVADORA' : cat === 'Fogões' ? 'FOGÃO' : cat === 'Freezers' ? 'FREEZER' : '');
                if (onSearch && cat === 'Todos os Lotes') onSearch('');
              }}
              className="text-xs font-bold whitespace-nowrap text-black hover:underline transition-all"
              style={{ color: '#003087' }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
