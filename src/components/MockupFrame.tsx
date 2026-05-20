import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Users, ChevronRight, Globe } from 'lucide-react';

interface MockupFrameProps {
  type: 'browser' | 'mobile';
  color?: string;
  projectSlug?: string;
  children?: React.ReactNode;
}

function LuminaSkyMockup() {
  const [adults, setAdults] = useState(2);
  const [dateRange, setDateRange] = useState("15 Jun — 20 Jun");
  const [isProcessing, setIsProcessing] = useState(false);
  const [successCode, setSuccessCode] = useState<string | null>(null);
  const [lang, setLang] = useState<'EN' | 'ESP'>('ESP');

  const handleCheckAvailability = () => {
    setIsProcessing(true);
    setSuccessCode(null);
    setTimeout(() => {
      setIsProcessing(false);
      const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
      const randomCode = Array.from({ length: 5 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
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
        />
      </div>

      {/* Luxury Navbar */}
      <nav className="relative z-10 flex justify-between items-center px-4 py-2 border-b border-[#b59b70]/10 bg-black/40 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-2">
          <span className="font-serif text-[11px] font-bold tracking-[0.15em] text-[#b59b70] uppercase">
            Lúmina Sky
          </span>
          <button 
            onClick={() => setLang(l => l === 'EN' ? 'ESP' : 'EN')}
            className="flex items-center gap-0.5 text-[6px] tracking-widest uppercase border border-white/20 px-1 py-0.5 text-white/80 hover:text-[#b59b70] hover:border-[#b59b70]/50"
          >
            <Globe className="w-1.5 h-1.5" /> {lang === 'EN' ? 'ESP' : 'EN'}
          </button>
        </div>
        <div className="flex gap-2.5 text-[6px] font-medium uppercase tracking-[0.12em] text-white/80">
          <span className="hover:text-[#b59b70] transition-colors cursor-pointer">{lang === 'ESP' ? 'Suites' : 'Suites'}</span>
          <span className="hover:text-[#b59b70] transition-colors cursor-pointer">{lang === 'ESP' ? 'Gastronomía' : 'Dining'}</span>
          <span className="hover:text-[#b59b70] transition-colors cursor-pointer">{lang === 'ESP' ? 'Experiencias' : 'Experiences'}</span>
        </div>
        <button className="text-[6px] font-black tracking-widest uppercase bg-[#b59b70] text-[#1a1a1a] px-2 py-0.5 hover:bg-[#a38b60] transition-colors">
          {lang === 'ESP' ? 'RESERVAR' : 'BOOK'}
        </button>
      </nav>

      {/* Main Hero & Content area resized down to fit aspect-video perfectly */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-between p-3 text-center">
        {/* Title Group */}
        <div className="space-y-0.5 mt-1.5 max-w-[85%]">
          <h1 className="text-xl sm:text-2xl font-serif text-white tracking-tight drop-shadow-md">
            Lúmina Sky
          </h1>
          <p className="text-[6px] text-white/95 uppercase tracking-widest font-light">
            {lang === 'ESP' 
              ? 'Santuario Privado, Diseño Orgánico y Vistas en Piantini, SD'
              : 'Private Sanctuary, Organic Design & Unlimited Views in Piantini, SD'}
          </p>
        </div>

        {/* Dynamic & Interactive Reservation Widget */}
        <div className="w-full max-w-[340px] bg-[#fdfbf7] border border-[#b59b70]/20 shadow-xl p-1 flex flex-col gap-1 rounded mt-auto [color-scheme:light]">
          <div className="grid grid-cols-2 gap-1 text-left text-black">
            {/* Range Date */}
            <div className="bg-[#fcfaf5] border border-black/5 p-1 flex flex-col justify-center rounded">
              <span className="text-[5px] uppercase tracking-wider text-[#6b7280] leading-none mb-0.5">{lang === 'ESP' ? 'Estancia' : 'Stay'}</span>
              <div className="flex items-center gap-1">
                <Calendar className="w-1.5 h-1.5 text-[#b59b70] shrink-0" />
                <input 
                  type="text" 
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="bg-transparent border-none outline-none font-sans text-[7px] tracking-wide w-full p-0 h-auto"
                />
              </div>
            </div>

            {/* Guest Selector inside Widget */}
            <div className="bg-[#fcfaf5] border border-black/5 p-1 flex flex-col justify-center rounded">
              <span className="text-[5px] uppercase tracking-wider text-[#6b7280] leading-none mb-0.5">{lang === 'ESP' ? 'Huéspedes' : 'Guests'}</span>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Users className="w-1.5 h-1.5 text-[#b59b70] shrink-0" />
                  <span className="font-sans text-[7px] tracking-tight truncate leading-none text-[#1a1a1a]">
                    {adults} {adults === 1 ? (lang === 'ESP' ? 'Adulto' : 'Adult') : (lang === 'ESP' ? 'Adultos' : 'Adults')}
                  </span>
                </div>
                <div className="flex gap-0.5 leading-none shrink-0 scale-[0.85] origin-right">
                  <button 
                    type="button" 
                    onClick={() => setAdults(prev => Math.max(1, prev - 1))}
                    className="w-3 h-3 border border-gray-300 hover:border-[#b59b70] hover:text-[#b59b70] rounded-sm flex items-center justify-center font-sans text-[6px] bg-white"
                  >
                    -
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setAdults(prev => prev + 1)}
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
                {lang === 'ESP' ? 'PROCESANDO...' : 'PROCESSING...'}
              </span>
            ) : (
              <span className="flex items-center gap-0.5">
                {lang === 'ESP' ? 'VER DISPONIBILIDAD' : 'CHECK AVAILABILITY'}
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
                    {lang === 'ESP' ? 'SUITE DISPONIBLE' : 'SUITE AVAILABLE'}
                  </p>
                  <p className="text-[5.5px] text-white/80 leading-normal">
                    {lang === 'ESP' 
                      ? 'Lúmina Suite con vista panorámica reservable con descuento.'
                      : 'Lumina Suite with panoramic city view available for direct booking.'}
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

const MOCKUP_CONTENT: Record<string, { browser?: React.ReactNode, mobile?: React.ReactNode }> = {
  "lumina-sky-concept": {
    browser: <LuminaSkyMockup />
  },
  "nexus-real-estate": {
    browser: (
      <div className="absolute inset-0 bg-gradient-to-br from-amber-950 to-stone-900 text-white flex flex-col font-sans">
        <nav className="flex justify-between items-center px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-black tracking-tighter text-amber-500">NOVA</span>
          <div className="flex gap-2 text-[7px] font-bold uppercase tracking-widest opacity-70">
            <span>Propiedades</span>
            <span>Zonas</span>
            <span>Agentes</span>
          </div>
          <button className="text-[7px] font-bold opacity-60">Contacto</button>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2">
          <h3 className="text-xs font-black leading-tight text-amber-100">Tu Propiedad Ideal en RD</h3>
          <p className="text-[8px] opacity-60">Residencial · Turístico · Inversión</p>
          <button className="bg-amber-500 text-[8px] font-black px-3 py-1 rounded shadow-lg text-amber-950">Ver Propiedades</button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2 mt-auto">
          {[
            { name: "Apto Punta Cana", price: "$185K" },
            { name: "Villa Cap Cana", price: "$420K" },
            { name: "PH en Naco", price: "$310K" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 p-1.5 rounded-lg border border-amber-500/10">
              <div className="w-full aspect-square bg-white/10 rounded mb-1" />
              <p className="text-[6px] font-bold truncate">{item.name}</p>
              <p className="text-[6px] text-amber-400">{item.price}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "chroma-store": {
    browser: (
      <div className="absolute inset-0 bg-gradient-to-br from-violet-950 to-slate-900 text-white flex flex-col font-sans">
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
            <h3 className="text-[10px] font-black mb-1">Tech & Accesorios</h3>
            <p className="text-[6px] opacity-70 mb-2">Envíos a todo RD · CardNet y PayPal</p>
            <button className="bg-violet-500 text-[7px] font-bold px-3 py-1 rounded-lg">Ver Catálogo</button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { name: "AirPods Pro", price: "$189" },
              { name: "Case iPhone 15", price: "$12" },
              { name: "Magsafe", price: "$35" }
            ].map((item, i) => (
              <div key={i} className="bg-white/5 p-2 rounded-lg border border-white/5">
                <div className="w-full aspect-square bg-white/10 rounded-md mb-1.5" />
                <p className="text-[5px] font-bold leading-tight">{item.name}</p>
                <p className="text-[5px] text-violet-400 font-black">{item.price}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  },
  "vitality-clinic": {
    mobile: (
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-950 to-slate-900 text-white p-4 pt-10 flex flex-col font-sans">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-500 text-lg">✚</span>
            <span className="text-[10px] font-black tracking-widest uppercase">Bienestar RD</span>
          </div>
          <h3 className="text-sm font-black leading-tight">Tu Salud, Nuestra Prioridad</h3>
          <p className="text-[9px] opacity-60">Santiago · Medicina General & Estética</p>
          <button className="w-full bg-emerald-500 text-slate-950 text-[10px] font-black py-2.5 rounded-xl shadow-lg shadow-emerald-500/20">Agendar Cita</button>
        </div>
        <div className="mt-8 grid grid-cols-2 gap-2">
          {["Medicina General", "Estética", "Nutrición", "Pediatría"].map((s, i) => (
            <div key={i} className="bg-white/5 p-2 rounded-lg border border-emerald-500/10 flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[7px] font-bold">{s}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pb-4 text-center">
          <p className="text-[8px] font-bold opacity-40 uppercase tracking-widest">Lun–Sáb · 8am–8pm</p>
        </div>
      </div>
    )
  },
  "sabor-autentico": {
    mobile: (
      <div className="absolute inset-0 bg-gradient-to-br from-orange-950 to-red-950 text-white p-4 pt-10 flex flex-col font-sans relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl rounded-full" />
        <div className="relative z-10 flex flex-col items-center text-center space-y-4">
          <div className="text-2xl">🍽️</div>
          <h3 className="text-[12px] font-black uppercase tracking-tighter">Sabor Auténtico</h3>
          <h4 className="text-sm font-black text-orange-400">Sabor Dominicano Auténtico</h4>
          <p className="text-[9px] opacity-60">Santo Domingo · Reservas & Catering</p>
          <button className="w-full bg-orange-500 text-black text-[10px] font-black py-2.5 rounded-xl">Reservar Mesa</button>
        </div>
        <div className="mt-8 space-y-2">
          <p className="text-[8px] font-bold uppercase tracking-widest opacity-40">Destacados del Menú</p>
          {[
            { n: "Sancocho Dominicano", p: "RD$450" },
            { n: "Los Tres Golpes", p: "RD$280" },
            { n: "Pollo Guisado", p: "RD$390" }
          ].map((item, i) => (
            <div key={i} className="flex justify-between items-center bg-white/5 p-2 rounded-lg border border-orange-500/10">
              <span className="text-[8px] font-bold">{item.n}</span>
              <span className="text-[8px] font-black text-orange-400">{item.p}</span>
            </div>
          ))}
        </div>
        <div className="mt-auto pb-4 flex justify-center">
          <div className="bg-white/10 px-3 py-1 rounded-full text-[8px] font-black text-orange-200 border border-orange-500/20">
            ⭐ 4.9 en Google Maps
          </div>
        </div>
      </div>
    )
  }
};

export default function MockupFrame({ type, color = 'var(--color-surface-elevated)', projectSlug, children }: MockupFrameProps) {
  const customContent = projectSlug ? MOCKUP_CONTENT[projectSlug]?.[type] : null;

  if (type === 'browser') {
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
        <div className="aspect-video relative overflow-hidden" style={{ backgroundColor: !customContent ? color : undefined }}>
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
      <div className="absolute inset-0 bg-[var(--color-surface-base)] overflow-hidden" style={{ backgroundColor: !customContent ? color : undefined }}>
        {customContent || children}
      </div>
      {/* Home Indicator */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 bg-white/20 rounded-full z-20" />
    </motion.div>
  );
}
