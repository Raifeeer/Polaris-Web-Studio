import React from 'react';
import { motion } from 'framer-motion';

interface MockupFrameProps {
  type: 'browser' | 'mobile';
  color?: string;
  projectSlug?: string;
  children?: React.ReactNode;
}

const MOCKUP_CONTENT: Record<string, { browser?: React.ReactNode, mobile?: React.ReactNode }> = {
  "bahia-dorada": {
    browser: (
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-950 to-slate-900 text-white flex flex-col font-sans">
        <nav className="flex justify-between items-center px-4 py-2 border-b border-white/10">
          <span className="text-[10px] font-black tracking-tighter">BDR</span>
          <div className="flex gap-2 text-[7px] font-bold uppercase tracking-widest opacity-70">
            <span>Habitaciones</span>
            <span>Experiencias</span>
            <span>Galería</span>
          </div>
          <button className="text-[7px] font-black uppercase bg-cyan-500 px-2 py-0.5 rounded">Reservar</button>
        </nav>
        <div className="flex-1 flex flex-col items-center justify-center text-center p-4 space-y-2">
          <h3 className="text-xs font-black leading-tight">Lujo Tropical en Las Terrenas</h3>
          <p className="text-[8px] opacity-60">24 habitaciones de ensueño frente al mar</p>
          <button className="bg-cyan-500 text-[8px] font-bold px-3 py-1 rounded-full shadow-lg">Reservar Ahora</button>
        </div>
        <div className="grid grid-cols-3 gap-2 p-2 mt-auto border-t border-white/5">
          {[
            { name: "Suite Deluxe", price: "$280" },
            { name: "Villa Privada", price: "$520" },
            { name: "Ocean View", price: "$180" }
          ].map((item, i) => (
            <div key={i} className="bg-white/5 p-1.5 rounded-lg border border-white/5">
              <div className="w-full aspect-video bg-white/10 rounded mb-1" />
              <p className="text-[6px] font-bold truncate">{item.name}</p>
              <p className="text-[6px] text-cyan-400">{item.price}/noche</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
  "nova-realty": {
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
  "mercanika": {
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
  "clinica-bienestar": {
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
