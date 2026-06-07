import React from 'react';
import { Mail, MessageSquare, ArrowRight, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { T } from '../context/LanguageContext';

export default function ContactSection() {
  const navigate = useNavigate();
  const [selectedScope, setSelectedScope] = React.useState('landing');

  const baseOptions = [
    { en: 'Conversion Landing Page', es: 'Landing Page de Conversión', value: 'landing' },
    { en: 'Corporate Website', es: 'Web Corporativa Completa', value: 'corporate' },
    { en: 'E-commerce Store', es: 'Tienda Online (E-commerce)', value: 'ecommerce' }
  ];

  const currentOpt = baseOptions.find(o => o.value === selectedScope) || baseOptions[0];

  const handleLaunch = () => {
    navigate(`/cotizar?scope=${selectedScope}`);
  };

  return (
    <section id="contacto" className="py-24 px-6 md:px-12 bg-[var(--color-surface-base)] relative overflow-hidden">
      {/* Background Graphic */}
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-[var(--color-primary-muted)] rounded-full blur-[120px] opacity-20 translate-x-1/2 translate-y-1/2" />
      <div className="absolute top-1/2 left-0 w-72 h-72 bg-[var(--color-primary-muted)] rounded-full blur-[100px] opacity-10 -translate-x-1/2" />
      
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        {/* Left Side: Text Area & Direct Channels */}
        <div className="flex-1 space-y-8 lg:pr-6">
          <div className="space-y-4">
            <span className="inline-block text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-highlight)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
              <T en="Zero compromise estimates">Estimaciones transparentes</T>
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter leading-tight text-[var(--color-text-primary)]">
              <T en={<>Let's design <br className="hidden md:block" /> your budget.</>}>Diseñemos el presupuesto <br className="hidden md:block" /> de tu proyecto.</T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-base md:text-lg max-w-lg leading-relaxed">
              <T en="Stop guessing developer rates. Select your scope, configure in real time, and unlock the exact custom quote in seconds. No subscriptions required.">Olvídate de tarifas misteriosas. Elige el tipo de sitio, diseña tu solución en tiempo real y obtén tu propuesta personalizada en segundos sin ningún compromiso.</T>
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-lg pt-2">
            <a 
              href="mailto:hola@polarisweb.studio" 
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 transition-transform">
                <Mail size={18} />
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] text-[9px] font-bold uppercase tracking-widest"><T en="Direct Email">Email Directo</T></p>
                <p className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">hola@polarisweb.studio</p>
              </div>
            </a>
            
            <a 
              href="https://wa.me/18299200544"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-4 p-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors"
            >
              <div className="w-10 h-10 rounded-lg bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 transition-transform">
                <MessageSquare size={18} />
              </div>
              <div>
                <p className="text-[var(--color-text-tertiary)] text-[9px] font-bold uppercase tracking-widest">WhatsApp Direct</p>
                <p className="font-bold text-xs sm:text-sm text-[var(--color-text-primary)]">+1 (829) 920-0544</p>
              </div>
            </a>
          </div>
        </div>

        {/* Right Side: Simple Configurator Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex-1 w-full bg-[var(--color-surface-elevated)] p-6 sm:p-8 md:p-10 rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] shadow-2xl relative overflow-hidden flex flex-col gap-6"
        >
          {/* Top colored indicator line */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-primary-base)]/10 via-[var(--color-primary-base)] to-[var(--color-primary-base)]/10" />

          <div className="space-y-1.5">
            <h3 className="text-xl md:text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
              <T en="Configurator Assistant">Configure su propuesta</T>
            </h3>
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <T en="Choose your project's basic scope. The next step will customize modules, delivery milestones, and pricing transparently.">Selecciona el tipo de proyecto para comenzar. En el siguiente paso podrás personalizar módulos, integraciones y plazos a tu medida de forma transparente.</T>
            </p>
          </div>

          {/* Interactive Options Preview (Selecting leaves a beautiful active state/border) */}
          <div className="space-y-3">
            <span className="text-[10px] font-mono font-black text-[var(--color-text-tertiary)] uppercase tracking-wider block">
              <T en="Choose platform type:">Elige el tipo de sitio:</T>
            </span>
            <div className="grid grid-cols-1 gap-3">
              {baseOptions.map((opt, idx) => {
                const isSelected = selectedScope === opt.value;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setSelectedScope(opt.value)}
                    className={`w-full p-4 rounded-xl text-left flex items-center justify-between group/opt transition-all duration-300 border cursor-pointer relative ${
                      isSelected 
                        ? 'bg-[var(--color-primary-base)]/[0.04] border-[var(--color-primary-base)] shadow-sm' 
                        : 'bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50 hover:bg-[var(--color-surface-highlight)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Circle visual indicator */}
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                        isSelected 
                          ? 'border-[var(--color-primary-base)] bg-[var(--color-primary-base)] text-white' 
                          : 'border-[var(--color-border-strong)] bg-transparent'
                      }`}>
                        {isSelected && <Check size={11} className="stroke-[3.5px]" />}
                      </div>
                      <span className={`text-xs sm:text-sm font-bold transition-colors ${
                        isSelected ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-secondary)]'
                      }`}>
                        <T en={opt.en}>{opt.es}</T>
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Minimal Key Benefits checklist */}
          <div className="space-y-2 py-2 border-t border-b border-[var(--color-border-subtle)]/50">
            <div className="flex items-start gap-2.5 text-xs">
              <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Check size={11} />
              </div>
              <span className="text-[var(--color-text-secondary)]">
                <T en="Interactive budget breakdown based on selected features">Planificación y desglose de módulos interactivo</T>
              </span>
            </div>
            <div className="flex items-start gap-2.5 text-xs">
              <div className="mt-0.5 w-4 h-4 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
                <Check size={11} />
              </div>
              <span className="text-[var(--color-text-secondary)]">
                <T en="Live delivery timeline tracking and meeting booking">Definición clara de plazos de entrega y metodología ágil</T>
              </span>
            </div>
          </div>

          {/* Dynamic Smart Action Button */}
          <div>
            <button
              type="button"
              onClick={handleLaunch}
              className="w-full py-4 px-6 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-xs sm:text-sm uppercase tracking-wider hover:scale-[1.01] hover:brightness-110 active:scale-[0.99] transition-all flex items-center justify-between gap-3 shadow-xl shadow-[var(--color-primary-base)]/15 cursor-pointer"
            >
              <span>
                <T en={`Continue with ${currentOpt.en} →`}>
                  {`Continuar cotización para ${currentOpt.es} →`}
                </T>
              </span>
              <ArrowRight size={16} className="shrink-0" />
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
