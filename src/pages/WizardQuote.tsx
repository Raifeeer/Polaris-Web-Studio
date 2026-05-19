import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Check, Calendar, Clock, Loader2 } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { T } from '../context/LanguageContext';
import { format, addDays, startOfToday } from 'date-fns';

const steps = [
  { id: 'type', title: <T en="Project Type">Tipo de Proyecto</T> },
  { id: 'size', title: <T en="Size & Scope">Tamaño y Alcance</T> },
  { id: 'addons', title: <T en="AI & Add-ons">IA y Complementos</T> },
  { id: 'schedule', title: <T en="Schedule Meeting">Agendar Reunión</T> },
];

const types = [
  { id: 'landing', title: 'Landing Page', price: 299, desc: <T en="Single page focused on conversion">Página única enfocada en conversión</T> },
  { id: 'corporate', title: <T en="Corporate Web">Web Corporativa</T>, price: 699, desc: <T en="Multi-page site for businesses">Sitio multi-página para negocios</T> },
  { id: 'ecommerce', title: 'E-commerce', price: 1299, desc: <T en="Online store with payments">Tienda online con pagos</T> },
];

const sizes = [
  { id: 'basic', title: <T en="Basic">Básico</T>, multiplier: 1, desc: <T en="Standard sections / Up to 10 products">Secciones estándar / Hasta 10 productos</T> },
  { id: 'pro', title: 'Pro', multiplier: 1.5, desc: <T en="Custom sections / Up to 100 products">Secciones a medida / Hasta 100 productos</T> },
  { id: 'enterprise', title: 'Enterprise', multiplier: 2.5, desc: <T en="Advanced architecture / Unlimited">Arquitectura avanzada / Ilimitado</T> },
];

const addons = [
  { id: 'seo', title: <T en="Advanced SEO">SEO Avanzado</T>, price: 150 },
  { id: 'chatbot', title: <T en="AI Chatbot">Chatbot IA</T>, price: 200 },
  { id: 'crm', title: <T en="CRM Integration">Integración CRM</T>, price: 300 },
  { id: 'copy', title: <T en="Professional Copywriting">Copywriting Profesional</T>, price: 250 },
];

export default function WizardQuote() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  
  const [selections, setSelections] = useState({
    type: '',
    size: '',
    addons: [] as string[],
    date: null as Date | null,
    time: '',
    name: '',
    email: '',
  });

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const basePrice = types.find(t => t.id === selections.type)?.price || 0;
  const sizeMult = sizes.find(s => s.id === selections.size)?.multiplier || 1;
  const addonsPrice = addons.filter(a => selections.addons.includes(a.id)).reduce((acc, a) => acc + a.price, 0);
  const estimatedTotal = (basePrice * sizeMult) + addonsPrice;

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(c => c + 1);
    } else {
      submitQuote();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(c => c - 1);
  };

  const submitQuote = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
    }, 2000);
  };

  const toggleAddon = (id: string) => {
    setSelections(s => ({
      ...s,
      addons: s.addons.includes(id) ? s.addons.filter(a => a !== id) : [...s.addons, id]
    }));
  };

  // Generate next 7 days for scheduler
  const availableDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfToday(), i + 1));
  const availableTimes = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative">
      <Navbar />
      
      <main className="flex-1 max-w-5xl mx-auto w-full px-6 py-24 relative z-10 flex flex-col">
        
        {/* Header */}
        <div className="text-center mb-12 space-y-4">
           <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter">
             <T en="Interactive Quote">Cotizador Interactivo</T>
           </h1>
           <p className="text-[var(--color-text-secondary)]">
             <T en="Build your project and schedule a strategy session.">Construye tu proyecto y agenda una sesión estratégica.</T>
           </p>
        </div>

        {/* Progress Bar */}
        <div className="flex items-center gap-2 mb-12">
          {steps.map((step, idx) => (
            <React.Fragment key={idx}>
              <div className="flex-1 flex flex-col gap-2">
                <div className={`h-2 rounded-full transition-colors ${idx <= currentStep ? 'bg-[var(--color-primary-base)]' : 'bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]'}`} />
                <span className={`text-[10px] font-bold uppercase tracking-widest ${idx <= currentStep ? 'text-[var(--color-primary-base)]' : 'text-[var(--color-text-tertiary)]'}`}>
                  {step.title}
                </span>
              </div>
            </React.Fragment>
          ))}
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-12">
          
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-primary-base)]/30 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <Check size={40} />
                  </div>
                  <h2 className="text-3xl font-display font-black"><T en="Meeting Confirmed!">¡Reunión Agendada!</T></h2>
                  <p className="text-[var(--color-text-secondary)]">
                    <T en="We have sent the invitation via Google Meet to your email. See you soon!">
                    Hemos enviado la invitación vía Google Meet a tu correo. ¡Nos vemos pronto!
                    </T>
                  </p>
                  <button onClick={() => navigate('/')} className="mt-8 px-8 py-3 bg-[var(--color-surface-highlight)] rounded-xl font-bold hover:bg-[var(--color-primary-base)] hover:text-white transition-colors">
                    <T en="Return to Home">Volver al Inicio</T>
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[400px]"
                >
                  {/* STEP 0: TYPE */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-display font-bold mb-6"><T en="What are you looking to build?">¿Qué buscas construir?</T></h2>
                      <div className="grid gap-4">
                        {types.map(t => (
                          <button
                            key={t.id}
                            onClick={() => setSelections(s => ({ ...s, type: t.id }))}
                            className={`p-6 rounded-[var(--radius-bento)] border transition-all text-left flex items-center justify-between group ${selections.type === t.id ? 'bg-[var(--color-primary-base)]/10 border-[var(--color-primary-base)]' : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50'}`}
                          >
                            <div>
                               <h3 className={`font-bold font-display text-xl mb-1 ${selections.type === t.id ? 'text-[var(--color-primary-base)]' : ''}`}>{t.title}</h3>
                               <p className="text-[var(--color-text-secondary)] text-sm">{t.desc}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.type === t.id ? 'border-[var(--color-primary-base)] bg-[var(--color-primary-base)]' : 'border-[var(--color-border-strong)]'}`}>
                              {selections.type === t.id && <Check size={14} className="text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 1: SIZE */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-display font-bold mb-6"><T en="What is the dimension of your project?">¿Cuál es la dimensión de tu proyecto?</T></h2>
                      <div className="grid gap-4">
                        {sizes.map(s => (
                          <button
                            key={s.id}
                            onClick={() => setSelections(sel => ({ ...sel, size: s.id }))}
                            className={`p-6 rounded-[var(--radius-bento)] border transition-all text-left flex items-center justify-between group ${selections.size === s.id ? 'bg-[var(--color-primary-base)]/10 border-[var(--color-primary-base)]' : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50'}`}
                          >
                            <div>
                               <h3 className={`font-bold font-display text-xl mb-1 ${selections.size === s.id ? 'text-[var(--color-primary-base)]' : ''}`}>{s.title}</h3>
                               <p className="text-[var(--color-text-secondary)] text-sm">{s.desc}</p>
                            </div>
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.size === s.id ? 'border-[var(--color-primary-base)] bg-[var(--color-primary-base)]' : 'border-[var(--color-border-strong)]'}`}>
                              {selections.size === s.id && <Check size={14} className="text-white" />}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 2: ADD-ONS */}
                  {currentStep === 2 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-display font-bold mb-6"><T en="Would you like to add superpowers?">¿Deseas agregar superpoderes?</T></h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addons.map(a => (
                          <button
                            key={a.id}
                            onClick={() => toggleAddon(a.id)}
                            className={`p-6 rounded-[var(--radius-bento)] border transition-all text-left flex flex-col justify-between group h-32 ${selections.addons.includes(a.id) ? 'bg-[var(--color-primary-base)]/10 border-[var(--color-primary-base)]' : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50'}`}
                          >
                             <div className="flex justify-between w-full">
                               <h3 className={`font-bold font-display ${selections.addons.includes(a.id) ? 'text-[var(--color-primary-base)]' : ''}`}>{a.title}</h3>
                               <div className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${selections.addons.includes(a.id) ? 'border-[var(--color-primary-base)] bg-[var(--color-primary-base)] text-white' : 'border-[var(--color-border-strong)] text-transparent'}`}>
                                  <Check size={12} />
                               </div>
                             </div>
                             <span className="text-sm font-black text-[var(--color-text-tertiary)]">+${a.price}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: SCHEDULE */}
                  {currentStep === 3 && (
                    <div className="space-y-6">
                      <h2 className="text-2xl font-display font-bold"><T en="Let's build it together">Vamos a construirlo</T></h2>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                          <label className="text-xs font-black uppercase tracking-widest text-[var(--color-text-secondary)]"><T en="Select Day">Selecciona un Día</T></label>
                          <div className="grid grid-cols-3 gap-2">
                            {availableDays.map(d => (
                              <button
                                key={d.toISOString()}
                                onClick={() => setSelections(s => ({ ...s, date: d, time: '' }))}
                                className={`p-3 rounded-xl border text-center transition-colors ${selections.date?.toDateString() === d.toDateString() ? 'bg-[var(--color-primary-base)] border-[var(--color-primary-base)] text-white' : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50'}`}
                              >
                                <span className="block text-[10px] uppercase font-bold opacity-80">{format(d, 'MMM')}</span>
                                <span className="block text-xl font-black">{format(d, 'dd')}</span>
                              </button>
                            ))}
                          </div>
                        </div>

                        {selections.date && (
                          <div className="space-y-4">
                            <label className="text-xs font-black uppercase tracking-widest text-[var(--color-text-secondary)]"><T en="Select Time">Selecciona la Hora</T></label>
                            <div className="grid grid-cols-2 gap-2">
                              {availableTimes.map(t => (
                                <button
                                  key={t}
                                  onClick={() => setSelections(s => ({ ...s, time: t }))}
                                  className={`p-3 rounded-xl border font-black transition-colors ${selections.time === t ? 'bg-[var(--color-primary-base)] border-[var(--color-primary-base)] text-white' : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50'}`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {selections.time && (
                        <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)] p-6 bg-[var(--color-surface-elevated)] rounded-2xl">
                          <input 
                            placeholder="Tu Nombre Completo" 
                            className="w-full bg-transparent border border-[var(--color-border-strong)] p-4 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                            value={selections.name}
                            onChange={e => setSelections(s => ({ ...s, name: e.target.value }))}
                          />
                          <input 
                            placeholder="tu@email.com" 
                            type="email"
                            className="w-full bg-transparent border border-[var(--color-border-strong)] p-4 rounded-xl focus:outline-none focus:border-[var(--color-primary-base)]"
                            value={selections.email}
                            onChange={e => setSelections(s => ({ ...s, email: e.target.value }))}
                          />
                        </div>
                      )}

                    </div>
                  )}

                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Footer Navigation */}
            {!success && (
              <div className="mt-8 flex items-center justify-between pt-8 border-t border-[var(--color-border-subtle)]">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className="flex items-center gap-2 p-3 font-bold text-[var(--color-text-secondary)] hover:text-white disabled:opacity-30 disabled:hover:text-[var(--color-text-secondary)] transition-colors"
                >
                  <ArrowLeft size={18} /> <T en="Back">Atrás</T>
                </button>
                <button
                  onClick={handleNext}
                  disabled={
                    (currentStep === 0 && !selections.type) ||
                    (currentStep === 1 && !selections.size) ||
                    (currentStep === 3 && (!selections.date || !selections.time || !selections.name || !selections.email))
                  }
                  className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary-base)] text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border-none"
                >
                  {loading ? <Loader2 className="animate-spin" size={18} /> : (
                    currentStep === steps.length - 1 ? <><T en="Confirm Meeting">Confirmar Reunión</T> <Check size={18} /></> : <><T en="Next">Siguiente</T> <ArrowRight size={18} /></>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Sidebar Estimator */}
          <div className="w-full md:w-80 h-max sticky top-24 p-6 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
             <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6">
               <T en="Live Estimate">Estimación en vivo</T>
             </h3>

             <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)] text-sm">
                   <span className="text-[var(--color-text-secondary)]">Base</span>
                   <span className="font-bold">${basePrice}</span>
                </div>
                {selections.size && (
                  <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)] text-sm">
                     <span className="text-[var(--color-text-secondary)]"><T en="Scope Multiplier">Multiplicador de Alcance</T> ({sizes.find(s=>s.id === selections.size)?.title})</span>
                     <span className="font-bold">x{sizeMult}</span>
                  </div>
                )}
                {selections.addons.length > 0 && (
                  <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)] text-sm">
                     <span className="text-[var(--color-text-secondary)]">Add-ons ({selections.addons.length})</span>
                     <span className="font-bold">+${addonsPrice}</span>
                  </div>
                )}
             </div>

             <div className="mt-6">
                <span className="block text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1"><T en="Total Estimate">Estimado Total</T></span>
                <span className="text-4xl font-display font-black text-[var(--color-primary-base)]">${estimatedTotal}</span>
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2">
                  <T en="* Final prices may vary based on exact requirements.">* Los precios finales pueden variar según requisitos exactos.</T>
                </p>
             </div>
          </div>

        </div>

      </main>
      <Footer />
    </div>
  );
}
