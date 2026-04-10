import { useState } from "react";

import caixaAmassada from "@assets/Caixa_de_embalagem_da_lavadora_Philco_1775859164204.png";
import maquinaFoto from "@assets/br-11134103-820le-mme0vzcqibd3cd_1775859164202.webp";
import clienteCarlos from "@assets/images_1775859164205.jpeg";

const CB_BLUE = "#0033C6";
const CB_YELLOW = "#FFCC00";

interface Testimonial {
  id: number;
  name: string;
  location: string;
  avatar: string;
  product: string;
  pricePaid: string;
  text: string;
  photos: string[];
  stars: number;
}

const TESTIMONIALS: Testimonial[] = [
  {
    id: 1,
    name: "Carlos Eduardo M.",
    location: "Goiânia - GO",
    avatar: clienteCarlos,
    product: "Máquina de Lavar Midea 11kg",
    pricePaid: "R$ 390,00",
    text: "Fui com desconfiança, vou ser honesto. Paguei o PIX e fiquei dois dias sem dormir direito esperando chegar. Quando o frete chegou, a caixa estava bem amassada — dei uma estressada, já pensei o pior. Mas abri e a máquina estava zero, nem um arranhão na lataria. Já lavei umas seis turmas de roupa e funcionando perfeito até agora. Uma Midea 11kg nova por R$ 390 enquanto na loja está passando de R$ 2.100. Não tem discussão, vale muito a pena.",
    photos: [caixaAmassada, maquinaFoto],
    stars: 5,
  },
];

function StarRating({ count }: { count: number }) {
  return (
    <div style={{ display: "flex", gap: 2 }}>
      {[1, 2, 3, 4, 5].map((i) => (
        <svg key={i} width="14" height="14" viewBox="0 0 24 24" fill={i <= count ? CB_YELLOW : "#ddd"}>
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
        </svg>
      ))}
    </div>
  );
}

function TestimonialCard({ t, isMobile }: { t: Testimonial; isMobile: boolean }) {
  const [activePhoto, setActivePhoto] = useState(0);

  return (
    <div style={{
      backgroundColor: "white",
      borderRadius: 12,
      overflow: "hidden",
      boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
      border: "1px solid #e8e8e8",
      display: "flex",
      flexDirection: isMobile ? "column" : "row",
      minWidth: isMobile ? "100%" : 520,
      maxWidth: isMobile ? "100%" : 640,
      flexShrink: 0,
    }}>
      {/* Foto do produto */}
      <div style={{ position: "relative", width: isMobile ? "100%" : 220, flexShrink: 0 }}>
        <img
          src={t.photos[activePhoto]}
          alt={t.product}
          style={{
            width: "100%",
            height: isMobile ? 200 : "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {t.photos.length > 1 && (
          <div style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            display: "flex",
            gap: 5,
          }}>
            {t.photos.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePhoto(i)}
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: i === activePhoto ? "white" : "rgba(255,255,255,0.5)",
                  padding: 0,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Conteúdo */}
      <div style={{ padding: isMobile ? "16px 16px 20px" : "20px 20px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Header cliente */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={t.avatar}
            alt={t.name}
            style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", border: `2px solid ${CB_YELLOW}`, flexShrink: 0 }}
          />
          <div>
            <p style={{ fontWeight: 900, fontSize: 14, color: "#1a1a1a", marginBottom: 1 }}>{t.name}</p>
            <p style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>{t.location}</p>
          </div>
          <div style={{ marginLeft: "auto", textAlign: "right" }}>
            <StarRating count={t.stars} />
            <p style={{ fontSize: 10, color: "#aaa", marginTop: 2, fontWeight: 700 }}>Comprador verificado</p>
          </div>
        </div>

        {/* Produto + preço */}
        <div style={{
          backgroundColor: "#f0f7ff",
          borderRadius: 6,
          padding: "8px 10px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
        }}>
          <p style={{ fontSize: 12, fontWeight: 800, color: CB_BLUE }}>{t.product}</p>
          <span style={{
            backgroundColor: CB_BLUE,
            color: "white",
            fontWeight: 900,
            fontSize: 12,
            padding: "3px 8px",
            borderRadius: 4,
            whiteSpace: "nowrap",
            flexShrink: 0,
          }}>
            {t.pricePaid}
          </span>
        </div>

        {/* Depoimento */}
        <p style={{
          fontSize: 13,
          color: "#444",
          lineHeight: 1.55,
          fontStyle: "italic",
        }}>
          "{t.text}"
        </p>
      </div>
    </div>
  );
}

export default function Testimonials({ isMobile }: { isMobile: boolean }) {
  if (TESTIMONIALS.length === 0) return null;

  return (
    <div style={{
      backgroundColor: "#f8f9ff",
      borderTop: "1px solid #e0e4f0",
      borderBottom: "1px solid #e0e4f0",
      padding: isMobile ? "20px 12px" : "28px 16px",
    }}>
      <div style={{ maxWidth: 1280, margin: "0 auto" }}>
        {/* Título da seção */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <div style={{ width: 4, height: 24, backgroundColor: CB_BLUE, borderRadius: 2 }} />
          <div>
            <h2 style={{ fontSize: isMobile ? 15 : 18, fontWeight: 900, color: "#1a1a1a", lineHeight: 1 }}>
              Quem arrematou aprovou
            </h2>
            <p style={{ fontSize: 11, color: "#888", fontWeight: 700, marginTop: 3 }}>
              Depoimentos reais de compradores verificados
            </p>
          </div>
        </div>

        {/* Cards — scroll horizontal no mobile */}
        <div style={{
          display: "flex",
          gap: 16,
          overflowX: isMobile ? "auto" : "visible",
          flexWrap: isMobile ? "nowrap" : "wrap",
          paddingBottom: isMobile ? 4 : 0,
        }} className="no-scrollbar">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} t={t} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </div>
  );
}
