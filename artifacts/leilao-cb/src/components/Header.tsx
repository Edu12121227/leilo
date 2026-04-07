import { useState } from "react";
import { useLocation } from "wouter";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#0033C6";
const CB_DARK = "#1a1a2e";

export default function Header({ onSearch, searchValue = "" }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(searchValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  const categories = [
    "Refrigeradores",
    "Lavanderia",
    "Fogões",
    "Freezers",
    "Eletrodomésticos",
  ];

  return (
    <header style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* ── Top utility bar (blue) ── */}
      <div style={{ backgroundColor: CB_BLUE }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 16px",
          height: 36,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
        }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <a
              href="https://tudoleilao.com.br/leilao/144/lotes"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "white", fontSize: 12, fontWeight: 700, textDecoration: "none", opacity: 0.9 }}
            >
              Leilão Oficial Casas Bahia
            </a>
            <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 12 }}>|</span>
            <span style={{ color: "rgba(255,255,255,0.8)", fontSize: 12, fontWeight: 600 }}>
              Linha Branca — Logística Reversa
            </span>
          </div>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.85)", fontSize: 12, fontWeight: 600, display: "flex", alignItems: "center", gap: 4 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Retirada: Jundiaí - SP
            </span>
            <a
              href="https://tudoleilao.com.br/leilao/144/lotes"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: CB_YELLOW, fontSize: 12, fontWeight: 800, textDecoration: "none" }}
            >
              Ver no TudoLeilão →
            </a>
          </div>
        </div>
      </div>

      {/* ── Main header (white) ── */}
      <div style={{ backgroundColor: "white", boxShadow: "0 2px 6px rgba(0,0,0,0.08)" }}>
        <div style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: 24,
        }}>
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            style={{
              flexShrink: 0,
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
              display: "flex",
              alignItems: "center",
            }}
          >
            <img
              src="/images/logo-casasbahia-oficial.png"
              alt="Casas Bahia"
              style={{ height: 40, width: "auto", display: "block" }}
            />
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 720 }}>
            <div style={{
              display: "flex",
              border: `2px solid ${CB_BLUE}`,
              borderRadius: 8,
              overflow: "hidden",
              backgroundColor: "white",
            }}>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar modelo, categoria ou nº do lote..."
                style={{
                  flex: 1,
                  padding: "10px 16px",
                  fontSize: 14,
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 500,
                  border: "none",
                  outline: "none",
                  color: CB_DARK,
                  backgroundColor: "transparent",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: CB_BLUE,
                  border: "none",
                  padding: "0 24px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  color: "white",
                  letterSpacing: "0.2px",
                  flexShrink: 0,
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Buscar
              </button>
            </div>
          </form>

          {/* Leilão badge */}
          <div style={{ flexShrink: 0, textAlign: "right" }}>
            <div style={{ fontSize: 10, color: "#999", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.5px" }}>LEILÃO #144</div>
            <div style={{ fontSize: 16, fontWeight: 900, color: CB_BLUE, lineHeight: 1.2 }}>186 Lotes</div>
          </div>
        </div>
      </div>

      {/* ── Category nav (yellow) ── */}
      <div style={{ backgroundColor: CB_YELLOW, borderBottom: "3px solid rgba(0,0,0,0.08)" }}>
        <div
          style={{ maxWidth: 1280, margin: "0 auto", padding: "0 12px", display: "flex", alignItems: "stretch", gap: 0 }}
          className="no-scrollbar"
        >
          {/* "Todos os Departamentos" pill */}
          <button
            onClick={() => { setLocation("/"); setQuery(""); if (onSearch) onSearch(""); }}
            style={{
              background: CB_BLUE,
              border: "none",
              padding: "9px 16px",
              fontFamily: "'Nunito', sans-serif",
              fontWeight: 800,
              fontSize: 13,
              color: "white",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              flexShrink: 0,
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.9 }}>
              <path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z"/>
            </svg>
            Todos os Lotes
          </button>

          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => {
                setLocation("/");
                const q = cat === "Refrigeradores" ? "REFRIGERADOR"
                  : cat === "Lavanderia" ? "LAVADORA"
                  : cat === "Fogões" ? "FOGÃO"
                  : cat === "Freezers" ? "FREEZER"
                  : cat.toUpperCase();
                setQuery(q);
                if (onSearch) onSearch(q);
              }}
              style={{
                background: "none",
                border: "none",
                padding: "9px 14px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: CB_DARK,
                cursor: "pointer",
                whiteSpace: "nowrap",
                position: "relative",
                transition: "color 0.12s",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.color = CB_BLUE;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.color = CB_DARK;
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
