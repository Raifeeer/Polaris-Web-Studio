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
} from "lucide-react";

interface MockupFrameProps {
  type: "browser" | "mobile";
  color?: string;
  projectSlug?: string;
  children?: React.ReactNode;
}

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
    <div className="absolute inset-0 bg-[#121212] text-white flex flex-col overflow-hidden font-sans select-none">
      {/* Background with Elegant Gradients */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-b from-black/85 via-black/40 to-[#121212] z-[1]" />
        <img
          src="https://i.imgur.com/VUKpL5x.jpeg"
          alt="Lumina Sky View"
          className="w-full h-full object-cover opacity-80"
          referrerPolicy="no-referrer"
          loading="lazy"
          decoding="async"
          fetchpriority="low"
          width="800"
          height="600"
        />
      </div>

      {/* Luxury Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-4 py-2 border-b border-[#b59b70]/10 bg-black/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[11px] font-bold tracking-[0.15em] text-[#b59b70] uppercase">
            Lúmina Sky
          </span>
          <button
            onClick={() => setLang((l) => (l === "EN" ? "ESP" : "EN"))}
            className="flex items-center gap-0.5 text-[6px] tracking-widest uppercase border border-white/20 px-1 py-0.5 text-white/80 hover:text-[#b59b70] hover:border-[#b59b70]/50"
          >
            <Globe className="w-1.5 h-1.5" /> {lang === "EN" ? "ESP" : "EN"}
          </button>
        </div>
        <div className="flex gap-2.5 text-[6px] font-medium uppercase tracking-[0.12em] text-white/80">
          <span className="hover:text-[#b59b70] transition-colors cursor-pointer">
            {lang === "ESP" ? "Suites" : "Suites"}
          </span>
          <span className="hover:text-[#b59b70] transition-colors cursor-pointer">
            {lang === "ESP" ? "Gastronomía" : "Dining"}
          </span>
          <span className="hover:text-[#b59b70] transition-colors cursor-pointer">
            {lang === "ESP" ? "Experiencias" : "Experiences"}
          </span>
        </div>
        <button className="text-[6px] font-black tracking-widest uppercase bg-[#b59b70] text-[#1a1a1a] px-2 py-0.5 hover:bg-[#a38b60] transition-colors">
          {lang === "ESP" ? "RESERVAR" : "BOOK"}
        </button>
      </nav>

      {/* Main Hero & Content area resized down to fit aspect-video perfectly */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-3 text-center">
        {/* Title Group */}
        <div className="space-y-0.5 mt-1.5 max-w-[85%]">
          <div className="text-xl sm:text-2xl font-serif font-black text-white tracking-tight drop-shadow-md">
            Lúmina Sky
          </div>
          <p className="text-[6px] text-white/95 uppercase tracking-widest font-light">
            {lang === "ESP"
              ? "Santuario Privado, Diseño Orgánico y Vistas en Piantini, SD"
              : "Private Sanctuary, Organic Design & Unlimited Views in Piantini, SD"}
          </p>
        </div>

        {/* Dynamic & Interactive Reservation Widget */}
        <div className="w-full max-w-[340px] bg-[#fdfbf7] border border-[#b59b70]/20 shadow-xl p-1 flex flex-col gap-1 rounded mt-auto [color-scheme:light]">
          <div className="grid grid-cols-2 gap-1 text-left text-black">
            {/* Range Date */}
            <div className="bg-[#fcfaf5] border border-black/5 p-1 flex flex-col justify-center rounded">
              <span className="text-[5px] uppercase tracking-wider text-[#6b7280] leading-none mb-0.5">
                {lang === "ESP" ? "Estancia" : "Stay"}
              </span>
              <div className="flex items-center gap-1">
                <Calendar className="w-1.5 h-1.5 text-[#b59b70] shrink-0" />
                <input
                  type="text"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent border-none outline-none font-sans text-[7px] tracking-wide w-full p-0 h-auto"
                  aria-label="Fechas de estancia"
                />
              </div>
            </div>

            {/* Guest Selector inside Widget */}
            <div className="bg-[#fcfaf5] border border-black/5 p-1 flex flex-col justify-center rounded">
              <span className="text-[5px] uppercase tracking-wider text-[#6b7280] leading-none mb-0.5">
                {lang === "ESP" ? "Huéspedes" : "Guests"}
              </span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="w-1.5 h-1.5 text-[#b59b70] shrink-0" />
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
                    className="w-3 h-3 border border-gray-300 hover:border-[#b59b70] hover:text-[#b59b70] rounded-sm flex items-center justify-center font-sans text-[6px] bg-white"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdults((prev) => prev + 1)}
                    className="w-3 h-3 border border-gray-300 hover:border-[#b59b70] hover:text-[#b59b70] rounded-sm flex items-center justify-center font-sans text-[6px] bg-white"
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
            className="w-full bg-[#1a1a1a] text-white py-1 rounded-sm text-[6px] tracking-widest uppercase font-bold flex items-center justify-center gap-1 hover:bg-[#b59b70] hover:text-black transition-colors duration-300 disabled:opacity-50"
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
              className="absolute bottom-1 right-1 left-1 bg-[#0d1521]/95 backdrop-blur-md border-l-2 border-[#b59b70] p-1.5 text-left rounded shadow-2xl z-20 text-white"
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[4.5px] uppercase tracking-wider text-[#b59b70] font-black leading-none mb-0.5">
                    {lang === "ESP" ? "SUITE DISPONIBLE" : "SUITE AVAILABLE"}
                  </p>
                  <p className="text-[5.5px] text-white/80 leading-normal">
                    {lang === "ESP"
                      ? "Lúmina Suite con vista panorámica reservable con descuento."
                      : "Lumina Suite with panoramic city view available for direct booking."}
                  </p>
                </div>
                <span className="font-mono text-[6px] text-white bg-white/10 px-1 py-0.5 rounded leading-none font-bold select-all">
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
              className="bg-transparent text-[9px] text-gray-700 w-full focus:outline-none"
              aria-label="Buscar propiedades"
            />
          </div>
          <div className="flex justify-between items-center px-4 py-2 text-[9px] text-gray-700 font-bold">
            <span>ZONAS DE ALTO ESTATUS...</span>
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={() => alert(`Buscando: ${search}`)}
            className="flex w-full items-center justify-center gap-2 bg-[#D4AF37] text-white text-[9px] font-bold uppercase tracking-widest py-3 rounded-full"
          >
            <Compass className="w-3 h-3" /> EXPLORAR
          </button>
        </div>
      </div>
    </div>
  );
}

const MOCKUP_CONTENT: Record<
  string,
  { browser?: React.ReactNode; mobile?: React.ReactNode }
> = {
  "lumina-sky-concept": {
    browser: <LuminaSkyMockup />,
  },
  "nexus-real-estate": {
    browser: <NexusRealtyMockup />,
    mobile: <NexusRealtyMockup />,
  },
  "chroma-store": {
    browser: (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 to-slate-900 text-white flex flex-col font-sans mb-0">
        <nav className="flex justify-between items-center px-4 py-2 bg-white/5">
          <span className="text-[9px] font-black">MERCANIKA</span>
          <div className="flex gap-2 text-[6px] font-bold uppercase opacity-60">
            <span>Productos</span>
            <span>Ofertas</span>
            <span>Carrito 🛒</span>
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
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 to-slate-900 text-white p-4 pt-10 flex flex-col font-sans relative overflow-hidden">
        <nav className="flex justify-between items-center pb-3 border-b border-white/5 shrink-0">
          <span className="text-[10px] font-black tracking-wider text-violet-400">
            MERCANIKA
          </span>
          <div className="flex gap-2 text-[8px] font-bold uppercase opacity-80">
            <span>🛒 1</span>
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
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 to-slate-900 text-white p-4 pt-10 flex flex-col font-sans">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 text-lg">✚</span>
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
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950 to-red-950 text-white p-4 pt-10 flex flex-col font-sans relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="text-2xl">🍽️</div>
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
            ⭐ 4.9 en Google Maps
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
