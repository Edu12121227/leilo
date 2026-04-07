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

  const categories = ["Refrigeradores", "Lavanderia", "Fogões", "Freezers", "Eletrodomésticos"];

  const navTo = (cat: string) => {
    setLocation("/");
    const q = cat === "Refrigeradores" ? "REFRIGERADOR"
      : cat === "Lavanderia" ? "LAVADORA"
      : cat === "Fogões" ? "FOGÃO"
      : cat === "Freezers" ? "FREEZER"
      : cat.toUpperCase();
    setQuery(q);
    if (onSearch) onSearch(q);
  };

  return (
    <header style={{ fontFamily: "'Nunito', sans-serif" }}>

      {/* ── Top bar ── */}
      <div className="bg-[#0033C6]">
        <div className="max-w-[1280px] mx-auto px-3 md:px-4 h-8 md:h-9 flex items-center justify-between gap-2">
          {/* Mobile: location only | Desktop: full text */}
          <div className="flex items-center gap-3 min-w-0 overflow-hidden">
            <span className="text-white font-semibold text-[11px] flex items-center gap-1 whitespace-nowrap">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" className="shrink-0">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              Jundiaí - SP
            </span>
            <span className="text-white/30 hidden md:block">|</span>
            <span className="text-white/80 text-[11px] font-semibold hidden md:block whitespace-nowrap">
              Leilão Oficial Casas Bahia — Linha Branca
            </span>
          </div>
          <a
            href="https://tudoleilao.com.br/leilao/144/lotes"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#FFCC00] text-[11px] md:text-[12px] font-extrabold whitespace-nowrap shrink-0 no-underline"
          >
            TudoLeilão →
          </a>
        </div>
      </div>

      {/* ── Main header ── */}
      <div className="bg-white shadow-sm">
        <div className="max-w-[1280px] mx-auto px-3 md:px-4 py-2.5 md:py-3 flex flex-col md:flex-row md:items-center gap-2 md:gap-6">

          {/* Logo row — on mobile: logo left + lote count right */}
          <div className="flex items-center justify-between md:contents">
            <button
              onClick={() => setLocation("/")}
              className="border-none bg-transparent p-0 cursor-pointer flex items-center shrink-0"
            >
              <img
                src="/images/logo-casasbahia-oficial.png"
                alt="Casas Bahia"
                className="h-[30px] md:h-[40px] w-auto block"
              />
            </button>
            {/* Mobile-only lote count */}
            <div className="md:hidden text-right shrink-0">
              <div className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">LEILÃO #144</div>
              <div className="text-[14px] font-black text-[#0033C6] leading-tight">186 Lotes</div>
            </div>
          </div>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 min-w-0">
            <div className="flex border-2 border-[#0033C6] rounded-lg overflow-hidden bg-white">
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar modelo, categoria ou nº do lote..."
                className="flex-1 px-3 md:px-4 py-2 md:py-2.5 text-[13px] md:text-[14px] font-medium border-none outline-none text-gray-900 bg-transparent min-w-0"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              />
              <button
                type="submit"
                className="bg-[#0033C6] border-none px-3 md:px-6 cursor-pointer flex items-center gap-1.5 font-extrabold text-[13px] text-white shrink-0"
                style={{ fontFamily: "'Nunito', sans-serif" }}
              >
                <svg width="17" height="17" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span className="hidden md:inline">Buscar</span>
              </button>
            </div>
          </form>

          {/* Desktop-only lote count */}
          <div className="hidden md:block text-right shrink-0">
            <div className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">LEILÃO #144</div>
            <div className="text-[16px] font-black text-[#0033C6] leading-tight">186 Lotes</div>
          </div>
        </div>
      </div>

      {/* ── Category nav ── */}
      <div className="bg-[#FFCC00] border-b-[3px] border-black/8">
        <div className="max-w-[1280px] mx-auto px-1 flex overflow-x-auto no-scrollbar">
          {/* Todos button */}
          <button
            onClick={() => { setLocation("/"); setQuery(""); if (onSearch) onSearch(""); }}
            className="bg-[#0033C6] border-none px-3 md:px-4 py-2 md:py-2.5 font-extrabold text-[12px] md:text-[13px] text-white cursor-pointer flex items-center gap-1.5 shrink-0 whitespace-nowrap"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" className="opacity-90">
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
            Todos
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => navTo(cat)}
              className="bg-transparent border-none px-3 md:px-3.5 py-2 md:py-2.5 font-extrabold text-[12px] md:text-[13px] text-gray-900 cursor-pointer whitespace-nowrap shrink-0 hover:text-[#0033C6] transition-colors"
              style={{ fontFamily: "'Nunito', sans-serif" }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
