import { useState } from "react";
import { useLocation } from "wouter";

interface HeaderProps {
  onSearch?: (query: string) => void;
  searchValue?: string;
}

const CB_YELLOW = "#FFCC00";
const CB_BLUE = "#003087";

export default function Header({ onSearch, searchValue = "" }: HeaderProps) {
  const [, setLocation] = useLocation();
  const [query, setQuery] = useState(searchValue);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch) onSearch(query);
  };

  const navCategories = [
    { label: "Todos os Lotes", value: "" },
    { label: "Refrigeradores", value: "REFRIGERADOR" },
    { label: "Lavanderia", value: "LAVADORA" },
    { label: "Fogões", value: "FOGÃO" },
    { label: "Freezers", value: "FREEZER" },
  ];

  return (
    <header style={{ fontFamily: "'Nunito', sans-serif" }}>
      {/* Top info bar */}
      <div style={{ backgroundColor: CB_BLUE, color: "white", fontSize: 12 }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "6px 16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
            <span style={{ fontWeight: 700 }}>Leilão Oficial Casas Bahia</span>
            <span style={{ opacity: 0.6 }}>|</span>
            <span style={{ opacity: 0.85 }}>Linha Branca — Logística Reversa</span>
          </div>
          <div style={{ display: "flex", gap: 16, alignItems: "center", opacity: 0.9 }}>
            <span>📍 Retirada: Jundiaí - SP</span>
            <a
              href="https://tudoleilao.com.br/leilao/144/lotes"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: CB_YELLOW, fontWeight: 700, textDecoration: "none" }}
            >
              Ver no TudoLeilão →
            </a>
          </div>
        </div>
      </div>

      {/* Main header */}
      <div style={{ backgroundColor: "white", borderBottom: "1px solid #e8e8e8" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "12px 16px", display: "flex", alignItems: "center", gap: 20 }}>
          {/* Logo */}
          <button
            onClick={() => setLocation("/")}
            style={{ flexShrink: 0, background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: 10, padding: 0 }}
          >
            <img
              src="/images/logo-casasbahia.jpg"
              alt="Casas Bahia"
              style={{ width: 52, height: 52, borderRadius: 8, objectFit: "cover" }}
            />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontSize: 18, fontWeight: 900, color: CB_BLUE, lineHeight: 1.1, letterSpacing: "-0.5px" }}>
                casas bahia
              </div>
              <div style={{ fontSize: 11, fontWeight: 600, color: "#888", letterSpacing: "0.5px", textTransform: "uppercase" }}>
                Leilão #144
              </div>
            </div>
          </button>

          {/* Search bar */}
          <form onSubmit={handleSearch} style={{ flex: 1, maxWidth: 680 }}>
            <div style={{ display: "flex", borderRadius: 8, overflow: "hidden", border: `2px solid ${CB_YELLOW}`, backgroundColor: "white" }}>
              <input
                type="search"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Buscar por modelo, categoria ou nº do lote..."
                style={{
                  flex: 1,
                  padding: "11px 16px",
                  fontSize: 14,
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 500,
                  border: "none",
                  outline: "none",
                  color: "#1a1a2e",
                }}
              />
              <button
                type="submit"
                style={{
                  backgroundColor: CB_YELLOW,
                  border: "none",
                  padding: "0 22px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontFamily: "'Nunito', sans-serif",
                  fontWeight: 800,
                  fontSize: 14,
                  color: CB_BLUE,
                }}
              >
                <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Buscar</span>
              </button>
            </div>
          </form>

          {/* Side info */}
          <div style={{ flexShrink: 0, display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
            <div style={{ fontSize: 11, color: "#888", fontWeight: 600 }}>LEILÃO</div>
            <div style={{ fontSize: 13, fontWeight: 800, color: CB_BLUE }}>186 Lotes</div>
          </div>
        </div>
      </div>

      {/* Category nav */}
      <div style={{ backgroundColor: CB_YELLOW }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px", display: "flex", gap: 4, overflowX: "auto" }} className="no-scrollbar">
          {navCategories.map(cat => (
            <button
              key={cat.label}
              onClick={() => {
                setLocation("/");
                if (onSearch) onSearch(cat.value);
                setQuery(cat.value === "REFRIGERADOR" ? "REFRIGERADOR" : cat.value === "LAVADORA" ? "LAVADORA" : cat.value === "FOGÃO" ? "FOGÃO" : cat.value === "FREEZER" ? "FREEZER" : "");
              }}
              style={{
                background: "none",
                border: "none",
                padding: "10px 14px",
                fontFamily: "'Nunito', sans-serif",
                fontWeight: 800,
                fontSize: 13,
                color: CB_BLUE,
                cursor: "pointer",
                whiteSpace: "nowrap",
                borderBottom: "3px solid transparent",
                transition: "border-color 0.15s",
              }}
              onMouseEnter={e => (e.currentTarget.style.borderBottomColor = CB_BLUE)}
              onMouseLeave={e => (e.currentTarget.style.borderBottomColor = "transparent")}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
