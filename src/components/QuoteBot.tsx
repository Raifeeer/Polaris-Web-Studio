import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ArrowRight, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';

type Question = {
  id: number;
  text: string;
  options: string[];
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "¡Hola! 👋 ¿Qué tipo de negocio tienes?",
    options: ['Restaurante/Café', 'Tienda/Retail', 'Servicios Profesionales', 'Startup', 'Otro']
  },
  {
    id: 2,
    text: "¿Tienes web actualmente?",
    options: ['Sí, pero quiero mejorarla', 'No tengo web', 'Tengo redes pero no web']
  },
  {
    id: 3,
    text: "¿Cuál es tu objetivo principal?",
    options: ['Conseguir más clientes', 'Vender en línea', 'Proyectar profesionalismo', 'Todos los anteriores']
  },
  {
    id: 4,
    text: "¿Cuándo quieres lanzar?",
    options: ['Lo antes posible', 'En 1-2 meses', 'Estoy explorando opciones']
  }
];

export default function QuoteBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100); // small delay to allow DOM updates
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [currentStep, isTyping, isOpen]);

  const handleOptionSelect = (option: string) => {
    const newAnswers = [...answers, option];
    setAnswers(newAnswers);
    setIsTyping(true);
    
    // Simulate bot thinking
    setTimeout(() => {
      setCurrentStep(prev => prev + 1);
      setIsTyping(false);
    }, 1000);
  };

  const resetChat = () => {
    setIsOpen(false);
    setTimeout(() => {
      setCurrentStep(0);
      setAnswers([]);
    }, 300);
  };

  const getRecommendation = () => {
    const businessType = answers[0];
    const goal = answers[2];

    if (businessType === 'Tienda/Retail' || goal === 'Vender en línea') {
      return {
        name: 'Paquete Nova',
        feature: 'pasarela de pagos avanzada y gestión de inventario',
        description: 'Ideal para negocios que buscan vender sin límites.'
      };
    }
    
    if (businessType === 'Startup' || goal === 'Conseguir más clientes') {
      return {
        name: 'Paquete Destello',
        feature: 'landing page optimizada para conversiones y SEO local',
        description: 'Perfecto para lanzamientos y tracción rápida.'
      };
    }

    return {
      name: 'Paquete Constelación',
      feature: 'arquitectura multi-página y blog corporativo',
      description: 'La opción equilibrada para proyectar una imagen sólida.'
    };
  };

  const rec = currentStep === QUESTIONS.length ? getRecommendation() : null;

  return (
    <div className="fixed bottom-24 right-6 z-[100]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[320px] max-h-[500px] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-[var(--color-surface-base)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
              <Logo size={24} showText={false} />
              <div className="text-left flex-1 ml-3">
                <span className="block text-xs font-black uppercase tracking-widest text-[var(--color-text-primary)] leading-none">Atlas Assistant</span>
                <span className="text-[10px] text-[var(--color-primary-base)] font-bold uppercase tracking-wider">En línea</span>
              </div>
              <button 
                onClick={resetChat}
                className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-full transition-colors"
                aria-label="Cerrar chat"
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-[var(--color-surface-elevated)]">
              {/* Message History */}
              {Array.from({ length: currentStep + 1 }).map((_, stepIndex) => {
                const question = QUESTIONS[stepIndex];
                if (!question) return null;

                return (
                  <div key={stepIndex} className="space-y-4">
                    {/* Bot Question */}
                    <motion.div 
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex justify-start"
                    >
                      <div className="max-w-[85%] p-3 rounded-2xl rounded-tl-none bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]">
                        <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                          {question.text}
                        </p>
                      </div>
                    </motion.div>

                    {/* User Answer (if exists) */}
                    {answers[stepIndex] ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-end"
                      >
                        <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-none bg-[var(--color-primary-muted)] text-[var(--color-primary-base)] border border-[var(--color-primary-base)]/20 shadow-sm">
                          <p className="text-sm font-bold leading-relaxed">
                            {answers[stepIndex]}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      /* Current Step Options */
                      stepIndex === currentStep && !isTyping && (
                        <div className="flex flex-col gap-2 pl-4">
                          {question.options.map((opt, i) => (
                            <motion.button
                              key={opt}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.05 }}
                              onClick={() => handleOptionSelect(opt)}
                              className="text-left p-3 rounded-xl border border-[var(--color-border-strong)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] text-xs font-bold uppercase tracking-wide transition-all group"
                            >
                              <span className="group-hover:translate-x-1 inline-block transition-transform">{opt}</span>
                            </motion.button>
                          ))}
                        </div>
                      )
                    )}
                  </div>
                );
              })}

              {/* Bot Typing Indicator */}
              {isTyping && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="p-3 rounded-2xl rounded-tl-none bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] flex items-center gap-1.5 h-[42px] px-4">
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0 }}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]" 
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]" 
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]" 
                    />
                  </div>
                </motion.div>
              )}

              {/* Final Recommendation */}
              {currentStep === QUESTIONS.length && rec && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary-base)] to-[var(--color-primary-strong)] text-white shadow-xl">
                    <p className="text-sm leading-relaxed mb-4">
                      Basado en lo que me contaste, el <span className="font-black uppercase">{rec.name}</span> es ideal para ti 🎯
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed mb-4">
                      Incluye <span className="font-bold underline">{rec.feature}</span>. {rec.description}
                    </p>
                    <p className="text-sm font-bold bg-white/20 p-2 rounded-lg text-center backdrop-blur-sm">
                      ¿Lo conversamos?
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Link 
                      to="/servicios" 
                      onClick={resetChat}
                      className="w-full py-3 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[var(--color-surface-highlight)] transition-colors"
                    >
                      Ver Planes <ArrowRight size={14} />
                    </Link>
                    <a 
                      href={`https://wa.me/18299200544?text=Hola%2C%20Atlas%20Assistant%20me%20recomendó%20el%20${encodeURIComponent(rec.name)}%20y%20me%20gustaría%20más%20información.`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg"
                    >
                      Hablar por WhatsApp
                    </a>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
          isOpen 
            ? 'bg-[var(--color-surface-base)] text-[var(--color-text-primary)] rotate-90' 
            : 'bg-indigo-600 text-white hover:bg-indigo-700'
        }`}
        aria-label="Abrir asistente de cotización"
      >
        {isOpen ? <X size={28} /> : <MessageSquare size={28} />}
        
        {!isOpen && (
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--color-primary-base)] rounded-full border-2 border-[var(--color-surface-base)] flex items-center justify-center"
          >
            <span className="text-[10px] font-black text-[var(--color-on-primary)]">1</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
