import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, ArrowRight, Share2, Send } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useLanguage, T } from "../context/LanguageContext";

type AiMessage = { role: "user" | "assistant"; content: string };

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
    text: "¡Hola! ¿Qué tipo de negocio tienes?",
    textEN: "Hi! What type of business do you have?",
    options: [
      "Restaurante/Café",
      "Tienda/Retail",
      "Servicios Profesionales",
      "Startup",
      "Otro",
    ],
    optionsEN: [
      "Restaurant/Café",
      "Store/Retail",
      "Professional Services",
      "Startup",
      "Other",
    ],
  },
  {
    id: 2,
    text: "¿Tienes web actualmente?",
    textEN: "Do you currently have a website?",
    options: [
      "Sí, pero quiero mejorarla",
      "No tengo web",
      "Tengo redes pero no web",
    ],
    optionsEN: [
      "Yes, but I want to improve it",
      "No, I don't have a website",
      "I have social media but no website",
    ],
  },
  {
    id: 3,
    text: "¿Cuál es tu objetivo principal?",
    textEN: "What is your main goal?",
    options: [
      "Conseguir más clientes",
      "Vender en línea",
      "Proyectar profesionalismo",
      "Todos los anteriores",
    ],
    optionsEN: [
      "Get more clients",
      "Sell online",
      "Project professionalism",
      "All of the above",
    ],
  },
  {
    id: 4,
    text: "¿Cuándo quieres lanzar?",
    textEN: "When do you want to launch?",
    options: ["Lo antes posible", "En 1-2 meses", "Estoy explorando opciones"],
    optionsEN: [
      "As soon as possible",
      "In 1-2 months",
      "Just exploring options",
    ],
  },
];

export default function QuoteBot() {
  const { translate } = useLanguage();
  const location = useLocation();

  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas_bot_open");
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [currentStep, setCurrentStep] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas_bot_step");
      return saved ? parseInt(saved, 10) : 0;
    }
    return 0;
  });

  const [answers, setAnswers] = useState<number[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("atlas_bot_answers");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });

  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Modo de texto libre con IA (DeepSeek, con Grok como respaldo) --
  // independiente del quiz guiado de arriba, disponible en cualquier
  // momento vía el input fijo al pie del panel.
  const [aiMessages, setAiMessages] = useState<AiMessage[]>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(false);

  const scrollToBottom = () => {
    setTimeout(() => {
      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
    }, 100); // small delay to allow DOM updates
  };

  const sendAiMessage = async () => {
    const text = aiInput.trim();
    if (!text || aiLoading) return;
    setAiInput("");
    setAiError(false);
    const nextMessages: AiMessage[] = [...aiMessages, { role: "user", content: text }];
    setAiMessages(nextMessages);
    setAiLoading(true);
    scrollToBottom();
    try {
      const res = await fetch("/api/quotebot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, history: nextMessages.slice(0, -1) }),
      });
      if (!res.ok) throw new Error("bad status");
      const data = await res.json();
      if (!data.reply) throw new Error("empty reply");
      setAiMessages((prev) => [...prev, { role: "assistant", content: data.reply }]);
    } catch {
      setAiError(true);
    } finally {
      setAiLoading(false);
      scrollToBottom();
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [currentStep, isTyping, isOpen, aiMessages.length, aiLoading]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas_bot_open", JSON.stringify(isOpen));
    }
  }, [isOpen]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas_bot_step", currentStep.toString());
    }
  }, [currentStep]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas_bot_answers", JSON.stringify(answers));
    }
  }, [answers]);

  const handleOptionSelect = (index: number) => {
    const newAnswers = [...answers, index];
    setAnswers(newAnswers);
    setIsTyping(true);

    // Simulate bot thinking
    setTimeout(() => {
      setCurrentStep((prev) => prev + 1);
      setIsTyping(false);
    }, 1000);
  };

  const resetChat = () => {
    setIsOpen(false);
    if (typeof window !== "undefined") {
      localStorage.setItem("atlas_bot_open", "false");
    }
    setTimeout(() => {
      setCurrentStep(0);
      setAnswers([]);
      if (typeof window !== "undefined") {
        localStorage.setItem("atlas_bot_step", "0");
        localStorage.setItem("atlas_bot_answers", "[]");
      }
    }, 300);
  };

  const getRecommendation = () => {
    const businessTypeIndex = answers[0];
    const goalIndex = answers[2];

    if (businessTypeIndex === 1 || goalIndex === 1) {
      // Tienda/Retail or Vender en línea
      return {
        name: translate("Paquete Nova", "Nova Package"),
        feature: translate(
          "pasarela de pagos avanzada y gestión de inventario",
          "advanced payment gateway and inventory management",
        ),
        description: translate(
          "Ideal para negocios que buscan vender sin límites.",
          "Ideal for businesses looking to sell without limits.",
        ),
      };
    }

    if (businessTypeIndex === 3 || goalIndex === 0) {
      // Startup or Conseguir más clientes
      return {
        name: translate("Paquete Destello", "Flash Package"),
        feature: translate(
          "landing page optimizada para conversiones y SEO local",
          "landing page optimized for conversions and local SEO",
        ),
        description: translate(
          "Perfecto para lanzamientos y tracción rápida.",
          "Perfect for quick traction and launches.",
        ),
      };
    }

    return {
      name: translate("Paquete Constelación", "Constellation Package"),
      feature: translate(
        "arquitectura multi-página y blog corporativo",
        "multi-page architecture and corporate blog",
      ),
      description: translate(
        "La opción equilibrada para proyectar una imagen sólida.",
        "The balanced option to project a solid corporate image.",
      ),
    };
  };

  const rec = currentStep === QUESTIONS.length ? getRecommendation() : null;

  // Guard DESPUÉS de declarar todos los hooks (no antes) para no violar las
  // Reglas de Hooks: el conteo de hooks debe ser estable entre renders al
  // navegar entre rutas públicas y /dashboard|/login.
  if (
    location.pathname.startsWith("/dashboard") ||
    location.pathname.startsWith("/login")
  ) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-[100] [.story-mode-active_&]:hidden">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="absolute bottom-20 right-0 w-[320px] max-h-[500px] glass-panel-indigo rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-[var(--color-surface-base)] border-b border-[var(--color-border-subtle)] flex items-center justify-between">
              <img
                src="/brand/isotipo-color-badge-circular.svg"
                alt=""
                className="w-6 h-6 rounded-full"
              />
              <div className="text-left flex-1 ml-3">
                <span className="block text-xs font-black uppercase tracking-widest text-[var(--color-text-primary)] leading-none">
                  Atlas Terminal
                </span>
                <span className="text-[10px] text-[var(--color-primary-base)] font-bold uppercase tracking-wider">
                  <T en="Online">En línea</T>
                </span>
              </div>
              <button
                onClick={resetChat}
                className="p-2 hover:bg-[var(--color-surface-highlight)] rounded-full transition-colors"
                aria-label={translate("Cerrar chat", "Close chat")}
              >
                <X size={18} />
              </button>
            </div>

            {/* Chat Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-hide bg-transparent">
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
                            {translate(
                              question.options[answers[stepIndex]],
                              question.optionsEN[answers[stepIndex]],
                            )}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      /* Current Step Options */
                      stepIndex === currentStep &&
                      !isTyping && (
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
                          {currentStep === 0 && (
                            <motion.a
                              href={`https://wa.me/18299200544?text=${encodeURIComponent(
                                translate(
                                  "Hola, vengo desde el asistente de tu web y me gustaría hablar directamente con un asesor.",
                                  "Hi, I am coming from your website assistant and I would like to chat directly with an advisor.",
                                ),
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                delay: question.options.length * 0.05,
                              }}
                              className="mt-3 px-4 py-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/30 text-xs font-bold transition-all text-emerald-400 flex items-center justify-between group"
                            >
                              <span className="flex items-center gap-2.5 group-hover:translate-x-1 transition-transform duration-200">
                                <svg
                                  viewBox="0 0 24 24"
                                  fill="currentColor"
                                  className="w-4 h-4 shrink-0 text-[#25D366]"
                                >
                                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
                                  <path d="M12 0C5.373 0 0 5.373 0 12c0 1.876.43 3.65 1.196 5.23L0 24l6.938-1.176A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.368l-.36-.214-3.732.633.646-3.637-.235-.374A9.818 9.818 0 0112 2.182c5.424 0 9.818 4.394 9.818 9.818s-4.394 9.818-9.818 9.818z" />
                                </svg>
                                <T en="Chat on WhatsApp">
                                  Chatear por WhatsApp
                                </T>
                              </span>
                              <span className="text-[10px] bg-emerald-500/15 text-emerald-300 font-bold px-2 py-0.5 rounded-full border border-emerald-500/20">
                                <T en="Advisor">Asesor</T>
                              </span>
                            </motion.a>
                          )}
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
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: 0.2,
                      }}
                      className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]"
                    />
                    <motion.div
                      animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        delay: 0.4,
                      }}
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
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-[var(--color-primary-base)] to-[var(--color-primary-hover)] text-white shadow-xl">
                    <p className="text-sm leading-relaxed mb-4">
                      <T
                        en={
                          <>
                            Based on what you told me, the{" "}
                            <span className="font-black uppercase">
                              {rec.name}
                            </span>{" "}
                            is ideal for you
                          </>
                        }
                      >
                        Basado en lo que me contaste, el{" "}
                        <span className="font-black uppercase">{rec.name}</span>{" "}
                        es ideal para ti
                      </T>
                    </p>
                    <p className="text-xs opacity-90 leading-relaxed mb-4">
                      <T
                        en={
                          <>
                            Includes{" "}
                            <span className="font-bold underline">
                              {rec.feature}
                            </span>
                            . {rec.description}
                          </>
                        }
                      >
                        Incluye{" "}
                        <span className="font-bold underline">
                          {rec.feature}
                        </span>
                        . {rec.description}
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
                      <T en="View Plans">Ver Paquetes</T> <ArrowRight size={14} />
                    </Link>
                    <a
                      href={`https://wa.me/18299200544?text=${encodeURIComponent(
                        translate(
                          `Hola, Atlas Terminal me recomendó el ${rec.name} y me gustaría más información.`,
                          `Hi, Atlas Terminal recommended the ${rec.name} and I would like more information.`,
                        ),
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

              {/* Mensajes del modo de texto libre (IA) */}
              {aiMessages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: m.role === "user" ? 10 : -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={
                      m.role === "user"
                        ? "max-w-[85%] p-3 rounded-2xl rounded-tr-none bg-[var(--color-primary-muted)] text-[var(--color-primary-base)] border border-[var(--color-primary-base)]/20 shadow-sm"
                        : "max-w-[85%] p-3 rounded-2xl rounded-tl-none bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]"
                    }
                  >
                    <p className={`text-sm leading-relaxed ${m.role === "user" ? "font-bold" : "text-[var(--color-text-primary)]"}`}>
                      {m.content}
                    </p>
                  </div>
                </motion.div>
              ))}

              {aiLoading && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="p-3 rounded-2xl rounded-tl-none bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] flex items-center gap-1.5 h-[42px] px-4">
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity }} className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.2 }} className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]" />
                    <motion.div animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }} transition={{ duration: 1.2, repeat: Infinity, delay: 0.4 }} className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]" />
                  </div>
                </motion.div>
              )}

              {aiError && (
                <p className="text-xs text-red-500 px-1">
                  <T en="Something went wrong. Try again or write to us on WhatsApp.">
                    Algo falló. Intenta de nuevo o escríbenos por WhatsApp.
                  </T>
                </p>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Input de texto libre -- siempre disponible, independiente del quiz */}
            <div className="p-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-center gap-2">
              <input
                type="text"
                value={aiInput}
                onChange={(e) => setAiInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") sendAiMessage();
                }}
                placeholder={translate("Escríbeme lo que quieras...", "Ask me anything...")}
                maxLength={2000}
                className="flex-1 text-sm bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] rounded-full px-4 py-2 outline-none focus:border-[var(--color-primary-base)] transition-colors placeholder:text-[var(--color-text-tertiary)]"
              />
              <button
                onClick={sendAiMessage}
                disabled={!aiInput.trim() || aiLoading}
                aria-label={translate("Enviar mensaje", "Send message")}
                className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-base)] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
              >
                <Send size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Launcher Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 bg-white border border-slate-200/80 hover:bg-slate-50 ${
          isOpen ? "rotate-90 text-slate-700" : "text-slate-700"
        }`}
        aria-label={translate(
          "Abrir planificador de proyectos",
          "Open project planner",
        )}
      >
        {isOpen ? (
          <X size={30} />
        ) : (
          <img
            src="/brand/isotipo-color-badge-circular.svg"
            alt=""
            className="w-11 h-11 rounded-full"
          />
        )}

        {!isOpen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-[22px] h-[22px] bg-[var(--color-primary-base)] rounded-full border-2 border-white flex items-center justify-center"
          >
            <span className="text-[10px] font-black text-white">1</span>
          </motion.div>
        )}
      </motion.button>
    </div>
  );
}
