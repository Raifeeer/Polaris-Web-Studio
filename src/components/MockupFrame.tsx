import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Gem,
  Search,
  Compass,
  Lock,
  Moon,
  Heart,
  Menu,
  ChevronDown,
  Landmark,
  Utensils,
} from "lucide-react";

interface MockupFrameProps {
  type: "browser" | "mobile";
  color?: string;
  projectSlug?: string;
  children?: React.ReactNode;
  // Cuando es false, se omite la barra falsa de navegador (puntos + URL) o
  // el bisel de celular (notch + home indicator) -- pedido explícito del
  // usuario para los mockups interactivos, donde ese "div" adicional se
  // solapaba con el propio toggle Desktop/Mobile de la tarjeta (ambos
  // flotando en la misma esquina superior). Default true para no tocar el
  // resto de los mockups (capturas estáticas), que no tienen ese problema.
  chrome?: boolean;
}

// Paleta y tipografía calcadas 1:1 del archivo real de Claude Design
// ("Lúmina Sky Mockup.dc.html", proyecto 9692471c-e6cc-4ed9-b30c-335132121b33)
// -- no son los tokens de marca de Polaris (esos son índigo/Cormorant), son
// los del propio proyecto de cliente que se está mostrando en el mockup.
const LUMINA_GOLD = "#D4AF37";
const LUMINA_DARK = "#1a1a1a";
const LUMINA_HERO_DARK = "#0b1320";
const LUMINA_BG = "#fdfbf7";
const LUMINA_SAND = "#f4efe6";
const LUMINA_GRAY = "#6b7280";
const LUMINA_LGRAY = "#e5e7eb";
const LUMINA_FOOTER_BG = "#121212";
const LUMINA_SERIF = '"Playfair Display", Georgia, serif';
const LUMINA_SANS = '"Inter", sans-serif';
const LUMINA_IMG = {
  hero: "https://i.imgur.com/VUKpL5x.jpeg",
  loft: "https://i.imgur.com/p182CEs.jpeg",
  pool: "https://i.imgur.com/gNDwbNG.jpeg",
  dining: "https://i.imgur.com/j5Yn6M0.jpeg",
  lounge: "https://i.imgur.com/urg42nu.jpeg",
};
const LUMINA_NAV_ES = ["SUITES", "GASTRONOMÍA", "SPA", "EXPERIENCIAS", "A MEDIDA", "JOURNAL", "CONTACTO"];
const LUMINA_NAV_EN = ["SUITES", "DINING", "SPA", "EXPERIENCES", "BESPOKE", "JOURNAL", "CONTACT"];

function LuminaLogo({ size = "lg" }: { size?: "lg" | "sm" }) {
  const big = size === "lg";
  return (
    <div
      style={{
        fontFamily: LUMINA_SERIF,
        fontSize: big ? 15 : 11,
        letterSpacing: "0.06em",
        textTransform: "uppercase",
        color: LUMINA_GOLD,
        fontWeight: 300,
        lineHeight: 1,
        display: "flex",
        alignItems: "baseline",
      }}
    >
      <span>L</span>
      <span>úmina</span>
      <span style={{ marginLeft: 4, fontFamily: LUMINA_SANS, fontSize: big ? 7 : 5, color: "#fff", fontWeight: 700, letterSpacing: "0.2em" }}>
        SKY
      </span>
    </div>
  );
}

// Página completa de Lúmina Sky (header, hero, booking bar, suites,
// amenities, cita, footer) -- reconstrucción fiel de la función page(desktop)
// del .dc.html real, en JSX, parametrizada por ancho (desktop/mobile) e
// idioma. La reserva sigue siendo interactiva de verdad (a diferencia del
// mockup original de Design, que era estático) -- eso es lo único que se
// mantiene como mejora sobre el diseño importado.
function LuminaSkyPage({ desktop, lang }: { desktop: boolean; lang: "EN" | "ESP" }) {
  const es = lang === "ESP";
  const [adults, setAdults] = useState(2);
  const [dateRange, setDateRange] = useState(es ? "17 jun. — 20 jun., 2026" : "Jun 17 – Jun 20, 2026");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const navLinks = es ? LUMINA_NAV_ES : LUMINA_NAV_EN;

  const handleCheckAvailability = () => {
    setIsProcessing(true);
    setSuccessCode(null);
    setTimeout(() => {
      setIsProcessing(false);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const randomCode = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
      setSuccessCode(`LUM-${randomCode}`);
    }, 1100);
  };

  return (
    <div style={{ fontFamily: LUMINA_SANS, background: LUMINA_BG, position: "relative" }}>
      {/* Header */}
      <header
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 50,
          padding: desktop ? "16px 24px" : "10px 14px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <LuminaLogo size={desktop ? "lg" : "sm"} />
        {desktop && (
          <nav style={{ display: "flex", gap: 14, alignItems: "center" }}>
            {navLinks.map((l) => (
              <span key={l} style={{ fontSize: 6, letterSpacing: "0.12em", color: "#fff", fontFamily: LUMINA_SANS }}>
                {l}
              </span>
            ))}
          </nav>
        )}
        <button
          style={{
            background: LUMINA_GOLD,
            color: LUMINA_DARK,
            border: "none",
            padding: desktop ? "6px 14px" : "5px 10px",
            fontSize: desktop ? 6 : 6,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: LUMINA_SANS,
            fontWeight: 500,
          }}
        >
          {es ? "Reservar" : "Book Now"}
        </button>
      </header>

      {/* Hero */}
      <section
        style={{
          position: "relative",
          height: desktop ? 300 : 220,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          overflow: "hidden",
        }}
      >
        <div style={{ position: "absolute", inset: 0, backgroundImage: `url(${LUMINA_IMG.hero})`, backgroundSize: "cover", backgroundPosition: "center" }} />
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${LUMINA_HERO_DARK}cc, transparent, ${LUMINA_HERO_DARK}99)` }} />
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "0 12px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <h1 style={{ fontFamily: LUMINA_SERIF, color: "#fff", fontSize: desktop ? 32 : 22, margin: "0 0 6px", fontWeight: 400, letterSpacing: "-0.01em" }}>
            Lúmina Sky
          </h1>
          <p style={{ color: "rgba(255,255,255,0.9)", fontSize: desktop ? 7 : 6, fontFamily: LUMINA_SANS, fontWeight: 300, margin: "0 0 12px", maxWidth: desktop ? 220 : 170 }}>
            {es ? "En una ciudad que nunca descansa, construimos un espacio que sí." : "In a city that never rests, we built a space that does."}
          </p>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 4.5, letterSpacing: "0.3em", color: "rgba(255,255,255,0.6)", fontFamily: LUMINA_SANS, textTransform: "uppercase" }}>
              {es ? "Desliza para explorar" : "Scroll to Explore"}
            </span>
            <div style={{ width: 1, height: 16, background: "linear-gradient(to bottom, rgba(255,255,255,0.6), transparent)" }} />
          </div>
        </div>
      </section>

      {/* Booking bar */}
      <div
        style={{
          position: "relative",
          zIndex: 20,
          marginTop: desktop ? -22 : -14,
          marginLeft: desktop ? 24 : 12,
          marginRight: desktop ? 24 : 12,
          background: LUMINA_BG,
          boxShadow: "0 10px 24px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: desktop ? "row" : "column",
          padding: 3,
        }}
      >
        <div style={{ display: "flex", flex: 1, flexDirection: desktop ? "row" : "column", background: LUMINA_LGRAY, gap: 1 }}>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: desktop ? "6px 10px" : "5px 8px", flex: 1, background: LUMINA_BG }}>
            <span style={{ fontSize: 4.5, letterSpacing: "0.1em", textTransform: "uppercase", color: LUMINA_GRAY, marginBottom: 1, fontFamily: LUMINA_SANS }}>
              {es ? "Estancia" : "Check-in – Check-out"}
            </span>
            <input
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              aria-label={es ? "Fechas de estancia" : "Stay dates"}
              style={{ fontSize: 6, color: LUMINA_DARK, fontFamily: LUMINA_SANS, background: "transparent", border: "none", outline: "none", padding: 0, width: "100%" }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", padding: desktop ? "6px 10px" : "5px 8px", flex: 1, background: LUMINA_BG }}>
            <span style={{ fontSize: 4.5, letterSpacing: "0.1em", textTransform: "uppercase", color: LUMINA_GRAY, marginBottom: 1, fontFamily: LUMINA_SANS }}>
              {es ? "Huéspedes" : "Guests"}
            </span>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <span style={{ fontSize: 6, color: LUMINA_DARK, fontFamily: LUMINA_SANS }}>
                {adults} {adults === 1 ? (es ? "Adulto" : "Adult") : es ? "Adultos" : "Adults"}
              </span>
              <div style={{ display: "flex", gap: 2 }}>
                <button
                  type="button"
                  onClick={() => setAdults((p) => Math.max(1, p - 1))}
                  style={{ width: 10, height: 10, border: `1px solid ${LUMINA_LGRAY}`, background: "#fff", fontSize: 5, lineHeight: 1 }}
                >
                  -
                </button>
                <button
                  type="button"
                  onClick={() => setAdults((p) => p + 1)}
                  style={{ width: 10, height: 10, border: `1px solid ${LUMINA_LGRAY}`, background: "#fff", fontSize: 5, lineHeight: 1 }}
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>
        <button
          onClick={handleCheckAvailability}
          disabled={isProcessing}
          style={{
            background: LUMINA_DARK,
            color: "#fff",
            border: "none",
            padding: desktop ? "0 18px" : "8px",
            fontSize: 5.5,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            fontFamily: LUMINA_SANS,
            fontWeight: 500,
            marginTop: desktop ? 0 : 2,
            marginLeft: desktop ? 1 : 0,
            opacity: isProcessing ? 0.6 : 1,
          }}
        >
          {isProcessing ? (es ? "Procesando…" : "Processing…") : es ? "Ver Disponibilidad" : "Check Availability"}
        </button>
      </div>

      <AnimatePresence>
        {successCode && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{
              margin: desktop ? "6px 24px 0" : "6px 12px 0",
              background: `${LUMINA_HERO_DARK}f2`,
              borderLeft: `2px solid ${LUMINA_GOLD}`,
              padding: "6px 8px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              gap: 6,
            }}
          >
            <div>
              <p style={{ fontSize: 4.5, letterSpacing: "0.08em", textTransform: "uppercase", color: LUMINA_GOLD, fontWeight: 700, margin: 0, marginBottom: 2 }}>
                {es ? "Suite Disponible" : "Suite Available"}
              </p>
              <p style={{ fontSize: 5.5, color: "rgba(255,255,255,0.8)", margin: 0, fontFamily: LUMINA_SANS }}>
                {es ? "Lúmina Suite con vista panorámica reservable con descuento." : "Lumina Suite with panoramic city view available for direct booking."}
              </p>
            </div>
            <span style={{ fontFamily: "monospace", fontSize: 6, color: "#fff", background: "rgba(255,255,255,0.1)", padding: "2px 4px", fontWeight: 700 }}>
              {successCode}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Suites */}
      <section style={{ padding: desktop ? "36px 24px 20px" : "24px 12px 14px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", maxWidth: 460, margin: "0 auto 14px" }}>
          <h2 style={{ fontFamily: LUMINA_SERIF, fontSize: desktop ? 16 : 13, fontWeight: 400, margin: 0, color: LUMINA_DARK }}>
            {es ? "Nuestras Suites" : "Our Suites"}
          </h2>
          {desktop && (
            <div style={{ display: "flex", gap: 4 }}>
              {["←", "→"].map((arrow) => (
                <div
                  key={arrow}
                  style={{ width: 16, height: 16, borderRadius: "50%", border: `1px solid ${LUMINA_LGRAY}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 7, color: LUMINA_DARK }}
                >
                  {arrow}
                </div>
              ))}
            </div>
          )}
        </div>
        <div style={{ maxWidth: 420, margin: "0 auto" }}>
          <div style={{ aspectRatio: desktop ? "21/9" : "16/10", background: LUMINA_LGRAY, marginBottom: 8, overflow: "hidden" }}>
            <img src={LUMINA_IMG.loft} alt="Skyline Loft" style={{ width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" loading="lazy" decoding="async" />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 5 }}>
            <h3 style={{ fontFamily: LUMINA_SERIF, fontSize: desktop ? 11 : 9, fontWeight: 400, margin: 0, color: LUMINA_DARK }}>Skyline Loft</h3>
            <div style={{ textAlign: "right" }}>
              <span style={{ display: "block", fontSize: 4.5, letterSpacing: "0.1em", textTransform: "uppercase", color: LUMINA_GRAY, fontFamily: LUMINA_SANS }}>
                {es ? "Desde" : "From"}
              </span>
              <span style={{ fontFamily: LUMINA_SERIF, fontSize: desktop ? 8.5 : 7, color: LUMINA_DARK }}>
                $1,250 <span style={{ fontSize: 5.5, color: LUMINA_GRAY, fontFamily: LUMINA_SANS }}>/{es ? "noche" : "night"}</span>
              </span>
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 10 }}>
            {(es ? ["Vista a la Avenida", "Piso 25", "Ventanales de Piso a Techo"] : ["Avenue View", "25th Floor", "Floor-to-Ceiling Glass"]).map((t) => (
              <span key={t} style={{ background: LUMINA_BG, padding: "2px 6px", fontSize: 4.5, letterSpacing: "0.08em", textTransform: "uppercase", color: LUMINA_GRAY, fontFamily: LUMINA_SANS }}>
                {t}
              </span>
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "center", gap: 3 }}>
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ width: 3, height: 3, borderRadius: "50%", background: i === 0 ? LUMINA_DARK : "transparent", border: `1px solid ${LUMINA_DARK}` }} />
            ))}
          </div>
        </div>
      </section>

      {/* Amenities */}
      <section style={{ padding: desktop ? "28px 24px" : "18px 12px", background: LUMINA_BG }}>
        <h2 style={{ fontFamily: LUMINA_SERIF, fontSize: desktop ? 16 : 13, fontWeight: 400, textAlign: "center", marginBottom: desktop ? 16 : 10, color: LUMINA_DARK }}>
          {es ? "Amenidades de Ciudad" : "City Amenities"}
        </h2>
        <div style={{ display: "flex", flexDirection: desktop ? "row" : "column", gap: 6, maxWidth: 460, margin: "0 auto" }}>
          <AmenityTile img={LUMINA_IMG.pool} title={es ? "Piscina y Sauna en la Azotea" : "Rooftop Pool & Sauna"} desc={es ? "Renueva tus sentidos con vistas a la ciudad desde nuestra piscina infinita climatizada." : "Rejuvenate your senses with skyline views from our temperature-controlled infinity pool."} big flex={2} />
          <div style={{ display: "flex", flexDirection: desktop ? "column" : "row", gap: 6, flex: 1 }}>
            <AmenityTile img={LUMINA_IMG.dining} title={es ? "Gastronomía en las Alturas" : "Skyline Dining"} desc={es ? "Un viaje culinario sobre el horizonte de la ciudad." : "A culinary journey above the city skyline."} flex={1} />
            <AmenityTile img={LUMINA_IMG.lounge} title={es ? "Salón de Negocios" : "Business Lounge"} flex={1} />
          </div>
        </div>
      </section>

      {/* Quote */}
      <section style={{ padding: desktop ? "40px 24px" : "24px 14px", background: LUMINA_SAND, textAlign: "center" }}>
        <div style={{ width: 1, height: 20, background: `${LUMINA_DARK}33`, margin: "0 auto 10px" }} />
        <h2 style={{ fontFamily: LUMINA_SERIF, fontSize: desktop ? 12 : 10, fontWeight: 400, color: LUMINA_DARK, maxWidth: 320, margin: "0 auto 8px", lineHeight: 1.4 }}>
          "{es ? "En una ciudad que nunca descansa, construimos un espacio que sí." : "In a city that never rests, we built a space that does."}"
        </h2>
        <p style={{ fontSize: desktop ? 6 : 5.5, color: `${LUMINA_DARK}b3`, fontFamily: LUMINA_SANS, fontWeight: 300, lineHeight: 1.5, maxWidth: 300, margin: "0 auto" }}>
          {es
            ? "Un contraste entre la energía urbana vibrante de Santo Domingo y la serenidad meticulosa de nuestro estado elevado."
            : "A contrast between the vibrant urban energy of Santo Domingo and the meticulous serenity of our elevated estate."}
        </p>
      </section>

      {/* Footer */}
      <footer style={{ background: LUMINA_FOOTER_BG, padding: desktop ? "28px 24px 14px" : "18px 12px 12px" }}>
        <div style={{ display: "flex", flexDirection: desktop ? "row" : "column", gap: desktop ? 18 : 14, marginBottom: 20, flexWrap: "wrap" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, minWidth: desktop ? 100 : "100%" }}>
            <LuminaLogo size="sm" />
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 6, fontFamily: LUMINA_SANS, fontWeight: 300, margin: 0 }}>
              {es ? "En una ciudad que nunca descansa, construimos un espacio que sí." : "In a city that never rests, we built a space that does."}
            </p>
          </div>
          <FooterCol title={es ? "Navegación" : "Navigation"} items={navLinks} />
          <FooterCol title={es ? "Contacto" : "Contact"} items={["+1 (809) 333 0000", "reservations@luminasky.com"]} />
          <FooterCol title={es ? "Seguir" : "Follow"} items={["Instagram", "Facebook", "Pinterest"]} />
        </div>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 10, display: "flex", flexDirection: desktop ? "row" : "column", justifyContent: "space-between", alignItems: desktop ? "center" : "flex-start", gap: 6 }}>
          <span style={{ color: "rgba(255,255,255,0.3)", fontSize: 5, fontFamily: LUMINA_SANS }}>
            {es ? "© 2026 Lúmina Sky. Todos los derechos reservados." : "© 2026 Lúmina Sky. All rights reserved."}
          </span>
          <span style={{ color: LUMINA_GOLD, fontSize: 4, letterSpacing: "0.15em", border: `1px solid ${LUMINA_GOLD}33`, padding: "1px 5px", fontFamily: "monospace", textTransform: "uppercase" }}>
            Demo
          </span>
        </div>
      </footer>
    </div>
  );
}

function AmenityTile({ img, title, desc, big, flex }: { img: string; title: string; desc?: string; big?: boolean; flex: number }) {
  return (
    <a style={{ position: "relative", display: "flex", overflow: "hidden", aspectRatio: "4/3", flex, textDecoration: "none" }}>
      <img src={img} alt={title} style={{ position: "absolute", width: "100%", height: "100%", objectFit: "cover" }} referrerPolicy="no-referrer" loading="lazy" decoding="async" />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `linear-gradient(to top, ${LUMINA_HERO_DARK}cc, transparent)`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: big ? 10 : 6,
        }}
      >
        <h3 style={{ fontFamily: LUMINA_SERIF, color: "#fff", fontSize: big ? 9 : 7, margin: "0 0 2px", fontWeight: 400 }}>{title}</h3>
        {desc && <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 5, fontFamily: LUMINA_SANS, fontWeight: 300, margin: 0, maxWidth: 140 }}>{desc}</p>}
      </div>
    </a>
  );
}

function FooterCol({ title, items }: { title: string; items: string[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 90 }}>
      <h3 style={{ color: LUMINA_GOLD, textTransform: "uppercase", fontSize: 4.5, letterSpacing: "0.12em", margin: 0, marginBottom: 2, fontFamily: LUMINA_SANS }}>
        {title}
      </h3>
      {items.map((i) => (
        <span key={i} style={{ color: "rgba(255,255,255,0.6)", fontSize: 5.5, fontFamily: LUMINA_SANS, fontWeight: 300 }}>
          {i}
        </span>
      ))}
    </div>
  );
}

// Ancho "de diseño" del mockup de escritorio. Se mide el contenedor real vía
// ResizeObserver y se escala hacia abajo (nunca hacia arriba) para que quepa
// siempre sin desbordar, en vez de dejar que el contenido de ancho fijo se
// desborde y quede scrolleable horizontalmente (bug real reportado por el
// usuario: el mockup "se desliza horizontalmente" en tarjetas angostas de
// Portfolio). 480 no alcanzaba -- el header (logo + 7 links de nav + botón
// "Reservar", en una sola fila sin wrap, con padding 24px a cada lado) mide
// más de eso y el botón quedaba cortado ("RESERV...") aunque el desborde se
// escalara proporcionalmente. 640 le da margen real a esa fila completa.
const LUMINA_BROWSER_BASE_WIDTH = 640;

function LuminaSkyMockup() {
  const [lang, setLang] = useState<"EN" | "ESP">("ESP");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  // Alto real (sin escalar) del contenido, medido en vivo -- necesario porque
  // el navegador calcula el alto scrolleable del contenedor contra el layout
  // SIN transformar del hijo, no contra su tamaño visual ya escalado. Sin
  // esto, el contenedor deja scrollear mucho más allá del contenido visible
  // real hacia una franja en blanco (bug real reportado por el usuario:
  // "sigue haciendo scroll infinito luego del footer"). Envolver el
  // contenido escalado en un wrapper con este alto ya multiplicado por la
  // escala hace que el alto de layout coincida con el alto visual real.
  const [naturalHeight, setNaturalHeight] = useState(0);

  React.useEffect(() => {
    const container = containerRef.current;
    const content = contentRef.current;
    if (!container || !content) return;
    const update = () => {
      setScale(Math.min(1, container.clientWidth / LUMINA_BROWSER_BASE_WIDTH));
      setNaturalHeight(content.offsetHeight);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(container);
    ro.observe(content);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 bg-[#fdfbf7] overflow-y-auto overflow-x-hidden overscroll-contain select-none [color-scheme:light]"
    >
      <div style={{ height: naturalHeight * scale || undefined }}>
        <div
          ref={contentRef}
          style={{ width: LUMINA_BROWSER_BASE_WIDTH, transform: `scale(${scale})`, transformOrigin: "top left" }}
        >
          <button
            onClick={() => setLang((l) => (l === "EN" ? "ESP" : "EN"))}
            className="absolute top-1.5 right-1.5 z-[60] text-[6px] tracking-widest uppercase border border-white/30 px-1 py-0.5 text-white bg-black/20"
          >
            {lang === "EN" ? "ESP" : "EN"}
          </button>
          <LuminaSkyPage desktop lang={lang} />
        </div>
      </div>
    </div>
  );
}

// Versión móvil real del mockup -- a diferencia del recorte aspect-video de
// escritorio, el marco de celular tiene alto real (580px) y sí puede
// scrollear -- ambas versiones renderizan la misma LuminaSkyPage (fiel al
// .dc.html real de Claude Design), solo cambia el ancho/escala.
function LuminaSkyMockupMobile() {
  const [lang, setLang] = useState<"EN" | "ESP">("ESP");
  return (
    <div className="absolute inset-0 bg-[#fdfbf7] overflow-y-auto overflow-x-hidden overscroll-contain select-none [color-scheme:light]">
      <button
        onClick={() => setLang((l) => (l === "EN" ? "ESP" : "EN"))}
        className="absolute top-8 right-2 z-[60] text-[8px] tracking-widest uppercase border border-white/30 px-1.5 py-0.5 text-white bg-black/20"
      >
        {lang === "EN" ? "ESP" : "EN"}
      </button>
      <LuminaSkyPage desktop={false} lang={lang} />
    </div>
  );
}

function NexusRealtyMockup() {
  const [search, setSearch] = useState("");
  return (
    <div className="absolute inset-0 bg-white text-[#0A1628] flex flex-col font-sans select-none overflow-hidden">
      {/* Navbar */}
      <div className="flex justify-between items-center px-4 py-3 bg-[#0A1628] z-20 text-white">
        <div className="flex items-center gap-2">
          <img
            src="https://i.imgur.com/Kq5wE4B.png"
            alt="Nexus Logo"
            className="w-8 h-8"
            loading="lazy"
            decoding="async"
            width="400"
            height="300"
          />
          <div className="flex flex-col">
            <span className="font-serif text-sm font-bold text-white tracking-[0.1em]">
              NEXUS
            </span>
            <span className="text-[6px] text-[#D4AF37] tracking-[0.2em] font-medium uppercase">
              REALTY
            </span>
          </div>
        </div>
        <div className="flex gap-4 text-white/70">
          <Lock className="w-4 h-4" />
          <Moon className="w-4 h-4" />
          <Heart className="w-4 h-4" />
          <Menu className="w-4 h-4" />
        </div>
      </div>

      {/* Hero */}
      <div className="relative flex-1 flex flex-col justify-center items-center px-6">
        <div className="absolute inset-0 z-0">
          <div className="w-full h-full bg-[url('https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=600&q=60&fm=webp')] bg-cover bg-center" />
          <div className="absolute inset-0 bg-white/30" />
        </div>

        {/* Tag */}
        <div className="relative z-10 flex items-center gap-1.5 px-3 py-1 border border-[#D4AF37]/50 rounded-full mb-6 bg-white/20 backdrop-blur-sm">
          <Gem className="w-3 h-3 text-[#D4AF37]" />
          <span className="text-[8px] tracking-[0.15em] font-bold text-[#D4AF37] uppercase font-serif">
            SANTUARIOS INMOBILIARIOS EXCLUSIVOS
          </span>
        </div>

        {/* Title */}
        <div className="relative z-10 font-serif text-3xl text-[#0A1628] text-center leading-tight mb-4 font-normal">
          Encuentre su <span className="text-[#D4AF37] italic">Legado</span>
          <br />
          en República Dominicana
        </div>

        {/* Subtitle */}
        <p className="relative z-10 text-[9px] text-[#0A1628]/70 text-center max-w-[260px] leading-relaxed mb-6 font-sans">
          Ofrecemos un portafolio ultracurado de las residencias más majestuosas
          ubicadas en las colinas de Samaná, farallones de Casa de Campo, y
          costas de Cap Cana.
        </p>

        {/* Search Widget */}
        <div className="relative z-10 bg-white w-full max-w-[300px] rounded-full shadow-2xl p-1 border border-gray-100 divide-y divide-gray-100">
          <div className="flex items-center gap-2 px-3 py-2">
            <Search className="text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Busque por Piantini, Cap Cana, Casa de Ca"
              className="glass-input text-[9px] text-gray-700 w-full focus:outline-none"
              aria-label="Buscar propiedades"
            />
          </div>
          <div className="flex justify-between items-center px-4 py-2 text-[9px] text-gray-700 font-bold">
            <span>ZONAS DE ALTO ESTATUS...</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <button
            type="button"
            tabIndex={-1}
            aria-hidden="true"
            className="flex w-full items-center justify-center gap-2 bg-[#D4AF37] text-white text-[9px] font-bold uppercase tracking-widest py-3 rounded-full"
          >
            <Compass className="w-3 h-3" /> EXPLORAR
          </button>
        </div>
      </div>
    </div>
  );
}

// MOCKUP_CONTENT tiene entradas para 5 proyectos, pero solo la de Lúmina Sky
// fue revisada/verificada visualmente (pedido explícito del usuario) -- las
// otras 4 (Nexus Realty, Chroma, Vitality Clinic, Sabor Auténtico) llevaban
// meses como código muerto sin usarse en ningún lado del sitio, y activarlas
// de golpe junto con Lúmina Sky se saldría del pedido real. Esta lista acota
// a propósito qué proyectos ya pasaron esa revisión y pueden mostrar el
// mockup interactivo en vez de la captura estática.
const VERIFIED_INTERACTIVE_SLUGS = new Set(["lumina-sky-concept"]);

export function hasMockupContent(projectSlug?: string): boolean {
  return !!projectSlug && projectSlug in MOCKUP_CONTENT && VERIFIED_INTERACTIVE_SLUGS.has(projectSlug);
}

const MOCKUP_CONTENT: Record<
  string,
  { browser?: React.ReactNode; mobile?: React.ReactNode }
> = {
  "lumina-sky-concept": {
    browser: <LuminaSkyMockup />,
    mobile: <LuminaSkyMockupMobile />,
  },
  "nexus-real-estate": {
    browser: <NexusRealtyMockup />,
    mobile: <NexusRealtyMockup />,
  },
  "chroma-store": {
    browser: (
      <div className="absolute inset-0 bg-[#0d091a] text-white flex flex-col font-sans mb-0">
        <nav className="flex justify-between items-center px-4 py-2 bg-white/5">
          <span className="text-[9px] font-black">MERCANIKA</span>
          <div className="flex gap-2 text-[6px] font-bold uppercase opacity-60">
            <span>Productos</span>
            <span>Ofertas</span>
            <span>Carrito</span>
          </div>
        </nav>
        <div className="p-4 space-y-3">
          <div className="bg-violet-600/20 p-4 rounded-xl border border-violet-500/30 text-center">
            <div className="text-[10px] font-black mb-1">Tech & Accesorios</div>
            <p className="text-[6px] opacity-70 mb-2">
              Envíos a todo RD · CardNet y PayPal
            </p>
            <button className="bg-violet-500 text-[7px] font-bold px-3 py-1 rounded-lg">
              Ver Catálogo
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "AirPods Pro", price: "$189" },
              { name: "Case iPhone 15", price: "$12" },
              { name: "Magsafe", price: "$35" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 p-2 rounded-lg border border-white/5"
              >
                <div className="w-full aspect-square bg-white/10 rounded-md mb-1.5" />
                <p className="text-[5px] font-bold leading-tight">
                  {item.name}
                </p>
                <p className="text-[5px] text-violet-400 font-black">
                  {item.price}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    mobile: (
      <div className="absolute inset-0 bg-[#0d091a] text-white p-4 pt-10 flex flex-col font-sans relative overflow-hidden">
        <nav className="flex justify-between items-center pb-3 border-b border-white/5 shrink-0">
          <span className="text-[10px] font-black tracking-wider text-violet-400">
            MERCANIKA
          </span>
          <div className="flex gap-2 text-[8px] font-bold uppercase opacity-80">
            <span>1</span>
          </div>
        </nav>
        <div className="mt-4 flex flex-col flex-1 space-y-4">
          <div className="bg-violet-600/20 p-4 rounded-xl border border-violet-500/30 text-center shrink-0">
            <div className="text-[11px] font-black mb-1">Tech & Accesorios</div>
            <p className="text-[7px] opacity-70 mb-2">
              Envíos a todo RD · CardNet y PayPal
            </p>
            <button className="bg-violet-500 text-[8px] font-bold px-3 py-1 rounded-lg">
              Ver Catálogo
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {[
              { name: "AirPods Pro", price: "$189" },
              { name: "Case iPhone 15", price: "$12" },
            ].map((item, i) => (
              <div
                key={i}
                className="bg-white/5 p-2 rounded-lg border border-white/5 flex flex-col justify-between"
              >
                <div className="w-full aspect-square bg-white/10 rounded-md mb-1.5" />
                <div>
                  <p className="text-[7px] font-bold leading-tight line-clamp-1">
                    {item.name}
                  </p>
                  <p className="text-[7px] text-violet-400 font-black mt-0.5">
                    {item.price}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
  },
  "vitality-clinic": {
    mobile: (
      <div className="absolute inset-0 bg-[#041d13] text-white p-4 pt-10 flex flex-col font-sans">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 text-lg">+</span>
            <span className="text-[10px] font-black tracking-widest uppercase">
              Bienestar RD
            </span>
          </div>
          <div className="text-sm font-black leading-tight">
            Tu Salud, Nuestra Prioridad
          </div>
          <p className="text-[9px] opacity-60">
            Santiago · Medicina General & Estética
          </p>
          <button className="w-full bg-emerald-500 text-slate-950 text-[10px] font-black py-2.5 rounded-xl shadow-lg shadow-emerald-500/20">
            Agendar Cita
          </button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-2">
          {["Medicina General", "Estética", "Nutrición", "Pediatría"].map(
            (s, i) => (
              <div
                key={i}
                className="bg-white/5 p-2 rounded-lg border border-emerald-500/10 flex items-center gap-2"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span className="text-[7px] font-bold">{s}</span>
              </div>
            ),
          )}
        </div>
        <div className="mt-auto pb-4 text-center">
          <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">
            Lun–Sáb · 8am–8pm
          </p>
        </div>
      </div>
    ),
  },
  "sabor-autentico": {
    mobile: (
      <div className="absolute inset-0 bg-[#1f0e08] text-white p-4 pt-10 flex flex-col font-sans relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <Utensils className="w-6 h-6 text-orange-400" />
          <div className="text-[12px] font-black uppercase tracking-tighter">
            Sabor Auténtico
          </div>
          <div className="text-sm font-black text-orange-400 font-bold">
            Sabor Dominicano Auténtico
          </div>
          <p className="text-[9px] opacity-60">
            Santo Domingo · Reservas & Catering
          </p>
          <button className="w-full bg-orange-500 text-black text-[10px] font-black py-2.5 rounded-xl">
            Reservar Mesa
          </button>
        </div>
        <div className="mt-8 space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">
            Destacados del Menú
          </p>
          {[
            { n: "Sancocho Dominicano", p: "RD$450" },
            { n: "Los Tres Golpes", p: "RD$280" },
            { n: "Pollo Guisado", p: "RD$390" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-orange-500/10"
            >
              <span className="text-[8px] font-bold">{item.n}</span>
              <span className="text-[8px] font-black text-orange-400">
                {item.p}
              </span>
            </div>
          ))}
        </div>
        <div className="mt-auto pb-4 flex justify-center">
          <div className="bg-white/10 px-3 py-1 rounded-full text-[8px] font-black text-orange-200 border border-orange-500/20">
            4.9 en Google Maps
          </div>
        </div>
      </div>
    ),
  },
};

export default function MockupFrame({
  type,
  color = "var(--color-surface-elevated)",
  projectSlug,
  children,
  chrome = true,
}: MockupFrameProps) {
  const customContent = projectSlug
    ? MOCKUP_CONTENT[projectSlug]?.[type]
    : null;
  const content = customContent || children;

  if (type === "browser") {
    if (!chrome) {
      return (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full aspect-video relative overflow-hidden rounded-xl shadow-2xl"
          style={{ backgroundColor: !customContent ? color : undefined }}
        >
          {content}
        </motion.div>
      );
    }
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-xl overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface-base)] shadow-2xl"
      >
        {/* Browser Header. Las esquinas superiores se redondean acá mismo
            (rounded-t-[11px] = los 12px del rounded-xl del padre menos su
            borde de 1px) en vez de depender de que el overflow-hidden del
            padre las recorte -- ese recorte falla en Safari/iOS cuando el
            padre además anima un transform, y la barra salía cuadrada
            (reportado en vivo por el usuario). Redondeando el propio
            elemento el resultado no depende de ningún recorte del padre. */}
        <div className="h-10 rounded-t-[11px] bg-[var(--color-surface-highlight)] border-b border-[var(--color-border-subtle)] flex items-center px-4 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          <div className="ml-4 flex-1 max-w-[400px]">
            <div className="h-5 bg-[var(--color-surface-base)] rounded-md border border-[var(--color-border-subtle)]" />
          </div>
        </div>
        {/* Browser Content Area -- mismo criterio que el header: redondea sus
            propias esquinas inferiores en vez de depender del recorte del padre. */}
        <div
          className="aspect-video relative overflow-hidden rounded-b-[11px]"
          style={{ backgroundColor: !customContent ? color : undefined }}
        >
          {content}
        </div>
      </motion.div>
    );
  }

  if (!chrome) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3 }}
        className="w-[280px] h-[580px] rounded-[1.5rem] relative shadow-2xl overflow-hidden mx-auto bg-[var(--color-surface-base)]"
        style={{ backgroundColor: !customContent ? color : undefined }}
      >
        {content}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
      className="w-[280px] h-[580px] rounded-[3rem] border-[8px] border-[var(--color-border-strong)] bg-[var(--color-border-strong)] relative shadow-2xl overflow-hidden mx-auto"
    >
      {/* Notch */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-[var(--color-border-strong)] rounded-b-2xl z-20" />
      {/* Screen -- mismo criterio que el mockup de navegador: redondea sus
          propias esquinas (48px del padre menos su borde de 8px = 40px) en
          vez de depender del recorte del padre. */}
      <div
        className="absolute inset-0 bg-[var(--color-surface-base)] overflow-hidden rounded-[40px]"
        style={{ backgroundColor: !customContent ? color : undefined }}
      >
        {content}
      </div>
      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full z-20" />
    </motion.div>
  );
}
