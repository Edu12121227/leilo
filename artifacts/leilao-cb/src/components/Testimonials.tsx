import { useState } from "react";

import caixaAmassada from "@assets/Caixa_de_embalagem_da_lavadora_Philco_1775859164204.png";
import philcoMaquina from "@assets/br-11134103-820m5-mme0vzclbhtw3a_1775859164204.webp";
import clienteCarlos from "@assets/images_1775859164205.jpeg";

import mideaDetalhe from "@assets/br-11134103-820ls-mmmf8mfqugas1a_1775859312710.webp";
import mideaMaquina from "@assets/ff3b795b-3798-4abc-86ee-792ba7167c43_1775859312714.png";
import clientePatricia from "@assets/images_1775859312714.jpeg";

import samsungCaixa from "@assets/628ba0b0-6288-4c94-9810-92ec59bdebb7_1775859409974.png";
import samsungMaquina from "@assets/br-11134103-81z1k-mfb54i7x7xtx2a_1775859409976.webp";
import clienteAline from "@assets/images_1775859409976.jpeg";

import iphoneFoto from "@assets/D_NQ_NP_916853-MLB100095927822_122025-O_1775859791290.webp";
import clienteRoberto from "@assets/images_(5)_1775859791289.jpeg";

import iphone14Foto from "@assets/Smartphone_e_caixa_em_detalhe_1775859846657.png";
import clienteMarcos from "@assets/cafu-cesar-hortolandia-abc-1_1775859846657.png";

const CB_BLUE = "#0033C6";
const CB_YELLOW = "#FFCC00";

const TODAY = "Hoje, 10/04/2025";

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
    product: "Lavadora Philco PL511A 11kg",
    pricePaid: "R$ 240,00",
    text: "Ô rapaz... mandei o PIX e fiquei olhando o celular esperando chegar. Aí chegou, a caixa tava amassada de um lado, já pensei 'me ferrei'. Mas minha mulher falou 'abre logo'. A máquina tava com plástico em tudo, não tinha arranhado nada. Instalei no mesmo dia, lavei umas 3 cargas, funcionando normal demais. Minha vizinha ficou sem acreditar quando falei o preço.",
    photos: [caixaAmassada, philcoMaquina],
    stars: 5,
  },
  {
    id: 2,
    name: "Patrícia Alves S.",
    location: "Campinas - SP",
    avatar: clientePatricia,
    product: "Lava e Seca Midea 10,5kg/7kg",
    pricePaid: "R$ 380,00",
    text: "Meu marido ficou bravo quando fiz o PIX kkk. Falou que era golpe, que ia perder o dinheiro. A máquina chegou, ele mesmo que abriu a caixa, aí ficou quieto. Tava com o plástico original em tudo, nem um arranhão. Ligamos, funcionou de primeira. Agora ele fica falando pra todo mundo do trabalho que 'a gente comprou uma Midea baratíssima'. Homem né…",
    photos: [mideaMaquina, mideaDetalhe],
    stars: 5,
  },
  {
    id: 3,
    name: "Aline Ferreira C.",
    location: "Salvador - BA",
    avatar: clienteAline,
    product: "Lavadora Samsung 11kg Titanium",
    pricePaid: "R$ 280,00",
    text: "Vou ser direta: fiquei com medo. Uma Samsung dessa por R$ 280? Parecia demais. O anúncio apareceu umas 4 vezes pra mim e resolvi arriscar. A embalagem chegou destruída, papelão aberto. Mas a máquina tava enrolada em plástico bolha, intacta. Tô na terceira semana usando, não tem nenhum problema. Ainda bem que ousei.",
    photos: [samsungCaixa, samsungMaquina],
    stars: 5,
  },
  {
    id: 4,
    name: "Roberto Mendes G.",
    location: "Porto Alegre - RS",
    avatar: clienteRoberto,
    product: "iPhone 14 Pro",
    pricePaid: "R$ 320,00",
    text: "Meu filho ficou me enchendo o saco pra eu arrematar. Eu falei não, que era golpe. Ele insistiu, insistiu, aí eu cedi. Fiz o PIX, fiquei nervoso. Quando chegou tava na caixa original, com carregador, tudo lacrado. O celular não tem um arranhão. Meu filho até ficou com inveja kkk. Aprendi a ouvir ele.",
    photos: [iphoneFoto],
    stars: 5,
  },
  {
    id: 5,
    name: "Marcos Vinícius T.",
    location: "Ribeirão Preto - SP",
    avatar: clienteMarcos,
    product: "iPhone 14 Pro",
    pricePaid: "R$ 290,00",
    text: "Fiquei na dúvida dois dias. Aí resolvi. A caixa chegou com um amasso no canto e uma fita por fora, quase devolvi sem abrir. Mas era só a caixa mesmo. O iPhone tava com película de fábrica na tela e na traseira, não tinha sido tocado. Câmera boa demais. Não me arrependo.",
    photos: [iphone14Foto],
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
      minWidth: isMobile ? "82vw" : 520,
      maxWidth: isMobile ? "82vw" : 640,
      flexShrink: 0,
      scrollSnapAlign: "start",
    }}>
      {/* Foto do produto */}
      <div style={{ position: "relative", width: isMobile ? "100%" : 240, flexShrink: 0 }}>
        <img
          src={t.photos[activePhoto]}
          alt={t.product}
          style={{
            width: "100%",
            height: isMobile ? 260 : "100%",
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
      <div style={{ padding: isMobile ? "14px 14px 18px" : "20px 20px 20px", display: "flex", flexDirection: "column", gap: 10, flex: 1 }}>
        {/* Header cliente */}
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img
            src={t.avatar}
            alt={t.name}
            style={{ width: 48, height: 48, borderRadius: "50%", objectFit: "cover", border: `2px solid ${CB_YELLOW}`, flexShrink: 0 }}
          />
          <div>
            <p style={{ fontWeight: 900, fontSize: 14, color: "#1a1a1a", marginBottom: 1 }}>{t.name}</p>
            <p style={{ fontSize: 11, color: "#888", fontWeight: 700 }}>{t.location}</p>
            <p style={{ fontSize: 10, color: "#bbb", marginTop: 1, fontWeight: 600 }}>{TODAY}</p>
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
          gap: 12,
          overflowX: isMobile ? "auto" : "visible",
          flexWrap: isMobile ? "nowrap" : "wrap",
          paddingBottom: isMobile ? 8 : 0,
          paddingRight: isMobile ? 16 : 0,
          scrollSnapType: isMobile ? "x mandatory" : "none",
          WebkitOverflowScrolling: "touch",
        }} className="no-scrollbar">
          {TESTIMONIALS.map((t) => (
            <TestimonialCard key={t.id} t={t} isMobile={isMobile} />
          ))}
        </div>
      </div>
    </div>
  );
}
