import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Users,
  ChevronRight,
  Globe,
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
}

const LUMINA_GOLD = "#D4AF37";
const LUMINA_DARK = "#1a1a1a";
const LUMINA_IMG = {
  hero: "https://i.imgur.com/VUKpL5x.jpeg",
  loft: "https://i.imgur.com/p182CEs.jpeg",
  pool: "https://i.imgur.com/gNDwbNG.jpeg",
  dining: "https://i.imgur.com/j5Yn6M0.jpeg",
};

function LuminaSkyMockup() {
  const [adults, setAdults] = useState(2);
  const [dateRange, setDateRange] = useState("15 Jun — 20 Jun");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [lang, setLang] = useState<"EN" | "ESP">("ESP");

  const handleCheckAvailability = () => {
    setIsProcessing(true);
    setSuccessCode(null);
    setTimeout(() => {
      setIsProcessing(false);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const randomCode = Array.from(
        { length: 5 },
        () => chars[Math.floor(Math.random() * chars.length)],
      ).join("");
      setSuccessCode(`LUM-${randomCode}`);
    }, 1200);
  };

  return (
    <div className="absolute inset-0 bg-[#0b1320] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Background with Elegant Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0b1320]/85 via-[#0b1320]/35 to-[#0b1320] z-[1]" />
        <img
          src={LUMINA_IMG.hero}
          alt="Lumina Sky View"
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          fetchPriority="low"
          width="800"
          height="600"
        />
      </div>

      {/* Luxury Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-4 py-2 shrink-0">
        <div className="flex items-center gap-2">
          <span
            className="font-serif text-[11px] font-normal tracking-[0.06em] uppercase"
            style={{ color: LUMINA_GOLD }}
          >
            Lúmina<span className="text-white ml-0.5">Sky</span>
          </span>
          <button
            onClick={() => setLang((l) => (l === "EN" ? "ESP" : "EN"))}
            className="flex items-center gap-0.5 text-[6px] tracking-widest uppercase border border-white/20 px-1 py-0.5 text-white/80 hover:border-white/50"
            style={{ color: undefined }}
          >
            <Globe className="w-1.5 h-1.5" /> {lang === "EN" ? "ESP" : "EN"}
          </button>
        </div>
        <div className="hidden sm:flex gap-2.5 text-[6px] font-medium uppercase tracking-[0.15em] text-white/85">
          <span className="hover:text-white transition-colors cursor-pointer">
            {lang === "ESP" ? "Suites" : "Suites"}
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            {lang === "ESP" ? "Gastronomía" : "Dining"}
          </span>
          <span className="hover:text-white transition-colors cursor-pointer">
            {lang === "ESP" ? "Experiencias" : "Experiences"}
          </span>
        </div>
        <button
          className="text-[6px] font-semibold tracking-widest uppercase px-2 py-1 transition-colors"
          style={{ background: LUMINA_GOLD, color: LUMINA_DARK }}
        >
          {lang === "ESP" ? "RESERVAR" : "BOOK NOW"}
        </button>
      </nav>

      {/* Main Hero & Content area resized down to fit aspect-video perfectly */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between px-3 pb-2 text-center">
        {/* Title Group */}
        <div className="space-y-1 mt-3 max-w-[85%] flex flex-col items-center">
          <div className="text-2xl sm:text-3xl font-serif font-normal text-white tracking-tight drop-shadow-md">
            Lúmina Sky
          </div>
          <p className="text-[6px] text-white/90 tracking-widest font-light max-w-[220px]">
            {lang === "ESP"
              ? "En una ciudad que nunca descansa, construimos un espacio que sí."
              : "In a city that never rests, we built a space that does."}
          </p>
          <div className="flex flex-col items-center gap-0.5 mt-1 opacity-70">
            <span className="text-[4.5px] tracking-[0.3em] uppercase">
              {lang === "ESP" ? "Desliza para explorar" : "Scroll to explore"}
            </span>
            <div className="w-px h-4 bg-gradient-to-b from-white/60 to-transparent" />
          </div>
        </div>

        {/* Dynamic & Interactive Reservation Widget */}
        <div className="w-full max-w-[340px] bg-[#fdfbf7] shadow-xl p-1 flex flex-col gap-1 mt-auto [color-scheme:light]">
          <div className="grid grid-cols-2 gap-px bg-[#e5e7eb] text-left text-black">
            {/* Range Date */}
            <div className="bg-[#fdfbf7] p-1 flex flex-col justify-center">
              <span className="text-[5px] uppercase tracking-wider text-[#6b7280] leading-none mb-0.5">
                {lang === "ESP" ? "Estancia" : "Stay"}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="w-1.5 h-1.5 shrink-0" style={{ color: LUMINA_GOLD }} />
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="glass-input border-none outline-none font-sans text-[7px] tracking-wide w-full p-0 h-auto"
                  aria-label="Fechas de estancia"
                />
              </div>
            </div>

            {/* Guest Selector inside Widget */}
            <div className="bg-[#fdfbf7] p-1 flex flex-col justify-center">
              <span className="text-[5px] uppercase tracking-wider text-[#6b7280] leading-none mb-0.5">
                {lang === "ESP" ? "Huéspedes" : "Guests"}
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="w-1.5 h-1.5 shrink-0" style={{ color: LUMINA_GOLD }} />
                  <span className="font-sans text-[7px] tracking-tight truncate leading-none text-[#1a1a1a]">
                    {adults}{" "}
                    {adults === 1
                      ? lang === "ESP"
                        ? "Adulto"
                        : "Adult"
                      : lang === "ESP"
                        ? "Adultos"
                        : "Adults"}
                  </span>
                </div>
                <div className="flex gap-0.5 leading-none shrink-0 scale-[0.85] origin-right">
                  <button
                    type="button"
                    onClick={() => setAdults((prev) => Math.max(1, prev - 1))}
                    className="w-3 h-3 border border-gray-300 hover:border-black rounded-sm flex items-center justify-center font-sans text-[6px] bg-white"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdults((prev) => prev + 1)}
                    className="w-3 h-3 border border-gray-300 hover:border-black rounded-sm flex items-center justify-center font-sans text-[6px] bg-white"
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
            className="w-full bg-[#1a1a1a] text-white py-1 text-[6px] tracking-widest uppercase font-semibold flex items-center justify-center gap-1 transition-colors duration-300 disabled:opacity-50"
          >
            {isProcessing ? (
              <span className="flex items-center gap-0.5">
                <span className="w-1.5 h-1.5 border border-white border-t-transparent rounded-full animate-spin" />
                {lang === "ESP" ? "PROCESANDO..." : "PROCESSING..."}
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                {lang === "ESP" ? "VER DISPONIBILIDAD" : "CHECK AVAILABILITY"}
                <ChevronRight className="w-1.5 h-1.5" />
              </span>
            )}
          </button>
        </div>

        {/* Real-time Reservation Notification Modal */}
        <AnimatePresence>
          {successCode && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute bottom-1 right-1 left-1 bg-[#0d1521]/95 backdrop-blur-md border-l-2 p-1.5 text-left shadow-2xl z-20 text-white"
              style={{ borderColor: LUMINA_GOLD }}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p
                    className="text-[4.5px] uppercase tracking-wider font-semibold leading-none mb-0.5"
                    style={{ color: LUMINA_GOLD }}
                  >
                    {lang === "ESP" ? "SUITE DISPONIBLE" : "SUITE AVAILABLE"}
                  </p>
                  <p className="text-[5.5px] text-white/80 leading-normal">
                    {lang === "ESP"
                      ? "Lúmina Suite con vista panorámica reservable con descuento."
                      : "Lumina Suite with panoramic city view available for direct booking."}
                  </p>
                </div>
                <span className="font-mono text-[6px] text-white bg-white/10 px-1 py-0.5 leading-none font-semibold select-all">
                  {successCode}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

// Versión móvil real del mockup -- a diferencia de la de escritorio (que
// solo muestra el hero, todo lo que entra en el recorte aspect-video),
// el marco de celular tiene alto real (580px) y sí puede scrollear, así
// que acá se refleja el resto de las secciones del diseño importado de
// Claude Design (suites, amenities, cierre) en vez de una captura estática.
function LuminaSkyMockupMobile() {
  const [lang, setLang] = useState<"EN" | "ESP">("ESP");

  return (
    <div className="absolute inset-0 bg-[#fdfbf7] text-[#1a1a1a] overflow-y-auto font-sans select-none [color-scheme:light]">
      {/* Hero */}
      <div className="relative h-[300px] flex flex-col justify-end">
        <div className="absolute inset-0">
          <img
            src={LUMINA_IMG.hero}
            alt="Lumina Sky View"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#0b1320]/80 via-[#0b1320]/10 to-[#fdfbf7]" />
        </div>
        {/* pt-8 despeja el notch del marco de celular (MockupFrame), que se
            superpone físicamente sobre los primeros ~24px de la pantalla */}
        <nav className="relative z-10 flex justify-between items-center px-3 pt-8 pb-2">
          <span
            className="font-serif text-[13px] font-normal tracking-[0.06em] uppercase"
            style={{ color: LUMINA_GOLD }}
          >
            Lúmina<span className="text-white ml-0.5">Sky</span>
          </span>
          <button
            onClick={() => setLang((l) => (l === "EN" ? "ESP" : "EN"))}
            className="text-[8px] tracking-widest uppercase border border-white/30 px-1.5 py-0.5 text-white"
          >
            {lang === "EN" ? "ESP" : "EN"}
          </button>
        </nav>
        <div className="relative z-10 text-center pb-8 px-4">
          <div className="text-3xl font-serif text-white drop-shadow-md">Lúmina Sky</div>
          <p className="text-[9px] text-white/90 mt-1 tracking-wide">
            {lang === "ESP"
              ? "En una ciudad que nunca descansa, construimos un espacio que sí."
              : "In a city that never rests, we built a space that does."}
          </p>
        </div>
      </div>

      {/* Booking bar */}
      <div className="relative z-10 -mt-6 mx-4 bg-white shadow-xl p-2.5 flex flex-col gap-2">
        <div className="grid grid-cols-1 divide-y divide-[#e5e7eb] border border-[#e5e7eb]">
          <div className="p-2 flex flex-col">
            <span className="text-[8px] uppercase tracking-wider text-[#6b7280] mb-0.5">
              {lang === "ESP" ? "Estancia" : "Stay"}
            </span>
            <span className="text-[11px]">26 Jul — 29 Jul, 2026</span>
          </div>
          <div className="p-2 flex flex-col">
            <span className="text-[8px] uppercase tracking-wider text-[#6b7280] mb-0.5">
              {lang === "ESP" ? "Huéspedes" : "Guests"}
            </span>
            <span className="text-[11px]">2 {lang === "ESP" ? "Adultos" : "Adults"}</span>
          </div>
        </div>
        <button
          className="w-full py-2.5 text-[9px] tracking-widest uppercase font-semibold text-white"
          style={{ background: LUMINA_DARK }}
        >
          {lang === "ESP" ? "Ver Disponibilidad" : "Check Availability"}
        </button>
      </div>

      {/* Suite teaser */}
      <div className="px-4 pt-8 pb-6">
        <h3 className="font-serif text-lg mb-3">{lang === "ESP" ? "Nuestras Suites" : "Our Suites"}</h3>
        <div className="aspect-[16/10] bg-[#e5e7eb] overflow-hidden mb-2">
          <img
            src={LUMINA_IMG.loft}
            alt="Skyline Loft"
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
        </div>
        <div className="flex justify-between items-start">
          <span className="font-serif text-base">Skyline Loft</span>
          <span className="font-serif text-sm">
            $1,250 <span className="text-[9px] text-[#6b7280] font-sans">/{lang === "ESP" ? "noche" : "night"}</span>
          </span>
        </div>
      </div>

      {/* Amenities strip */}
      <div className="px-4 pb-8 grid grid-cols-2 gap-2">
        <a className="relative aspect-square overflow-hidden block">
          <img
            src={LUMINA_IMG.pool}
            alt="Rooftop Pool"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1320]/80 to-transparent flex items-end p-2">
            <span className="text-white text-[10px] font-serif leading-tight">
              {lang === "ESP" ? "Piscina en la Azotea" : "Rooftop Pool"}
            </span>
          </div>
        </a>
        <a className="relative aspect-square overflow-hidden block">
          <img
            src={LUMINA_IMG.dining}
            alt="Skyline Dining"
            className="absolute inset-0 w-full h-full object-cover"
            referrerPolicy="no-referrer"
            loading="lazy"
            decoding="async"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0b1320]/80 to-transparent flex items-end p-2">
            <span className="text-white text-[10px] font-serif leading-tight">
              {lang === "ESP" ? "Gastronomía en las Alturas" : "Skyline Dining"}
            </span>
          </div>
        </a>
      </div>

      {/* Footer strip */}
      <div className="bg-[#121212] text-white/70 px-4 py-6 text-center">
        <span
          className="font-serif text-[11px] tracking-[0.06em] uppercase block mb-1"
          style={{ color: LUMINA_GOLD }}
        >
          Lúmina Sky
        </span>
        <p className="text-[8px]">© 2026 Lúmina Sky.</p>
      </div>
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

export function hasMockupContent(projectSlug?: string): boolean {
  return !!projectSlug && projectSlug in MOCKUP_CONTENT;
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
}: MockupFrameProps) {
  const customContent = projectSlug
    ? MOCKUP_CONTENT[projectSlug]?.[type]
    : null;

  if (type === "browser") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="w-full rounded-xl overflow-hidden border border-[var(--color-border-strong)] bg-[var(--color-surface-base)] shadow-2xl"
      >
        {/* Browser Header */}
        <div className="h-10 bg-[var(--color-surface-highlight)] border-b border-[var(--color-border-subtle)] flex items-center px-4 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
          <div className="ml-4 flex-1 max-w-[400px]">
            <div className="h-5 bg-[var(--color-surface-base)] rounded-md border border-[var(--color-border-subtle)]" />
          </div>
        </div>
        {/* Browser Content Area */}
        <div
          className="aspect-video relative overflow-hidden"
          style={{ backgroundColor: !customContent ? color : undefined }}
        >
          {customContent || children}
        </div>
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
      {/* Screen */}
      <div
        className="absolute inset-0 bg-[var(--color-surface-base)] overflow-hidden"
        style={{ backgroundColor: !customContent ? color : undefined }}
      >
        {customContent || children}
      </div>
      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full z-20" />
    </motion.div>
  );
}
