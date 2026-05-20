import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquare, X, ArrowRight, Share2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import Logo from './Logo';
import { useLanguage, T } from '../context/LanguageContext';

type Question = {
  id: number;
  text: string;
  textEN: string;
  options: string[];
  optionsEN: string[];
};

const QUESTIONS: Question[] = [
  {
    id: 1,
    text: "¡Hola! 👋 ¿Qué tipo de negocio tienes?",
    textEN: "Hi! 👋 What type of business do you have?",
    options: ['Restaurante/Café', 'Tienda/Retail', 'Servicios Profesionales', 'Startup', 'Otro'],
    optionsEN: ['Restaurant/Café', 'Store/Retail', 'Professional Services', 'Startup', 'Other']
  },
  {
    id: 2,
    text: "¿Tienes web actualmente?",
    textEN: "Do you currently have a website?",
    options: ['Sí, pero quiero mejorarla', 'No tengo web', 'Tengo redes pero no web'],
    optionsEN: ['Yes, but I want to improve it', 'No, I don\'t have a website', 'I have social media but no website']
  },
  {
    id: 3,
    text: "¿Cuál es tu objetivo principal?",
    textEN: "What is your main goal?",
    options: ['Conseguir más clientes', 'Vender en línea', 'Proyectar profesionalismo', 'Todos los anteriores'],
    optionsEN: ['Get more clients', 'Sell online', 'Project professionalism', 'All of the above']
  },
  {
    id: 4,
    text: "¿Cuándo quieres lanzar?",
    textEN: "When do you want to launch?",
    options: ['Lo antes posible', 'En 1-2 meses', 'Estoy explorando opciones'],
    optionsEN: ['As soon as possible', 'In 1-2 months', 'Just exploring options']
  }
];

export default function QuoteBot() {
  const { translate } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
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

  const handleOptionSelect = (index: number) => {
    const newAnswers = [...answers, index];
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
    const businessTypeIndex = answers[0];
    const goalIndex = answers[2];

    if (businessTypeIndex === 1 || goalIndex === 1) { // Tienda/Retail or Vender en línea
      return {
        name: translate('Paquete Nova', 'Nova Package'),
        feature: translate('pasarela de pagos avanzada y gestión de inventario', 'advanced payment gateway and inventory management'),
        description: translate('Ideal para negocios que buscan vender sin límites.', 'Ideal for businesses looking to sell without limits.')
      };
    }
    
    if (businessTypeIndex === 3 || goalIndex === 0) { // Startup or Conseguir más clientes
      return {
        name: translate('Paquete Destello', 'Flash Package'),
        feature: translate('landing page optimizada para conversiones y SEO local', 'landing page optimized for conversions and local SEO'),
        description: translate('Perfecto para lanzamientos y tracción rápida.', 'Perfect for quick traction and launches.')
      };
    }

    return {
      name: translate('Paquete Constelación', 'Constellation Package'),
      feature: translate('arquitectura multi-página y blog corporativo', 'multi-page architecture and corporate blog'),
      description: translate('La opción equilibrada para proyectar una imagen sólida.', 'The balanced option to project a solid corporate image.')
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
                <span className="text-[10px] text-[var(--color-primary-base)] font-bold uppercase tracking-wider">
                  <T en="Online">En línea</T>
                </span>
              </div>
              <button 
                onClick={resetChat}
                className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-full transition-colors"
                aria-label={translate('Cerrar chat', 'Close chat')}
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
                          {translate(question.text, question.textEN)}
                        </p>
                      </div>
                    </motion.div>

                    {/* User Answer (if exists) */}
                    {answers[stepIndex] !== undefined ? (
                      <motion.div 
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex justify-end"
                      >
                        <div className="max-w-[85%] p-3 rounded-2xl rounded-tr-none bg-[var(--color-primary-muted)] text-[var(--color-primary-base)] border border-[var(--color-primary-base)]/20 shadow-sm">
                          <p className="text-sm font-bold leading-relaxed">
                            {translate(question.options[answers[stepIndex]], question.optionsEN[answers[stepIndex]])}
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
                              onClick={() => handleOptionSelect(i)}
                              className="text-left p-3 rounded-xl border border-[var(--color-border-strong)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] text-xs font-bold uppercase tracking-wide transition-all group"
                            >
                              <span className="group-hover:translate-x-1 inline-block transition-transform">
                                {translate(opt, question.optionsEN[i])}
                              </span>
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
                      <T en={<>Based on what you told me, the <span className="font-black uppercase">{rec.name}</span> is ideal for you 🎯</>}>
                        Basado en lo que me contaste, el <span className="font-black uppercase">{rec.name}</span> es ideal para ti 🎯
                      </T>
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed mb-4">
                      <T en={<>Includes <span className="font-bold underline">{rec.feature}</span>. {rec.description}</>}>
                        Incluye <span className="font-bold underline">{rec.feature}</span>. {rec.description}
                      </T>
                    </p>
                    <p className="text-sm font-bold bg-white/20 p-2 rounded-lg text-center backdrop-blur-sm">
                      <T en="Should we chat?">¿Lo conversamos?</T>
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Link 
                      to="/servicios" 
                      onClick={resetChat}
                      className="w-full py-3 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-xl text-[var(--color-text-primary)] text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:bg-[var(--color-surface-highlight)] transition-colors"
                    >
                      <T en="View Plans">Ver Planes</T> <ArrowRight size={14} />
                    </Link>
                    <a 
                      href={`https://wa.me/18299200544?text=${encodeURIComponent(
                        translate(
                          `Hola, Atlas Assistant me recomendó el ${rec.name} y me gustaría más información.`,
                          `Hi, Atlas Assistant recommended the ${rec.name} and I would like more information.`
                        )
                      )}`} 
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 bg-[#25D366] text-white rounded-xl text-xs font-black uppercase tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 transition-all shadow-lg"
                    >
                      <T en="Chat on WhatsApp">Hablar por WhatsApp</T>
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
        aria-label={translate('Abrir asistente de cotización', 'Open quote assistant')}
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
