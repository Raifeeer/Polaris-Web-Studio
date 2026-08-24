import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Home,
  X,
  Send,
  Square,
  SquarePen,
  Trash2,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronsLeft,
  ChevronsRight,
  MoreVertical,
  Pencil,
  Share2,
  Search,
  Globe,
  Mic,
  Volume2,
  VolumeX,
  Loader2,
  RotateCcw,
  Settings,
  Sun,
  Moon,
  Pin,
  PinOff,
  FoldVertical,
  Download,
  CornerDownLeft,
  Type,
  Bell,
  BellOff,
} from "lucide-react";
import { useLanguage, T } from "../context/LanguageContext";
import { useTheme } from "../hooks/useTheme";
import { useAtlasPrefs, FONT_SIZE_CLASS, playAtlasChime, type AtlasFontSize } from "../hooks/useAtlasPrefs";
import { useAtlasChat, type AiMessage, type AiConversation } from "../hooks/useAtlasChat";
import AtlasMarkdown from "../components/AtlasMarkdown";
import AtlasMark from "../components/AtlasMark";
import AtlasWidget from "../components/AtlasWidget";
import WebSourcesPanel, { hostnameOf } from "../components/WebSourcesPanel";
import ThinkingText from "../components/ThinkingText";
import ConversationSearch from "../components/ConversationSearch";
import { getConversationIcon } from "../lib/conversationIcon";
import { useSpeechToText } from "../hooks/useSpeechToText";
import { useTextToSpeech } from "../hooks/useTextToSpeech";
import VoiceInputBar from "../components/VoiceInputBar";
import Tooltip from "../components/Tooltip";
import TemporaryChatIcon from "../components/TemporaryChatIcon";

// Banco de preguntas comerciales de arranque. En cada visita se muestran
// 4 preguntas seleccionadas aleatoriamente. Incluye Local Lift, sin mostrar
// Office Flow mientras sigue en pulido.
const SUGGESTIONS_POOL: { es: string; en: string }[] = [
  { es: "¿Cuáles son los planes y precios?", en: "What are the plans and prices?" },
  { es: "¿Qué es Polaris Flow?", en: "What is Polaris Flow?" },
  { es: "¿Qué incluye el paquete Constelación?", en: "What's included in the Constelación package?" },
  { es: "¿Cuánto tarda un proyecto tipo e-commerce?", en: "How long does an e-commerce project take?" },
  { es: "¿Qué tecnologías usan?", en: "What tech stack do you use?" },
  { es: "¿Cómo funciona el pago?", en: "How does payment work?" },
  { es: "¿El dominio está incluido?", en: "Is the domain included?" },
  { es: "¿Puedo agendar una llamada ahora mismo?", en: "Can I book a call right now?" },
  { es: "¿Qué es el Bot de Atención 24/7?", en: "What is the 24/7 support bot?" },
  { es: "¿Tienen ejemplos de tiendas online que hayan hecho?", en: "Do you have examples of online stores you've built?" },
  { es: "¿Cuál es el proceso desde que contrato hasta que lanza el sitio?", en: "What's the process from hiring to launch?" },
  { es: "¿Qué pasa si necesito cambios después de la entrega?", en: "What happens if I need changes after delivery?" },
  { es: "¿Cómo es la garantía?", en: "How does the warranty work?" },
  { es: "¿Puedo pagar con transferencia bancaria?", en: "Can I pay by bank transfer?" },
  { es: "¿Qué addons de IA ofrecen?", en: "What AI addons do you offer?" },
  { es: "¿Cuánto cuesta un sitio multilingüe?", en: "How much does a multilingual site cost?" },
  { es: "¿Qué es el portal de clientes?", en: "What is the client portal?" },
  { es: "¿Cómo puedo ver el estado de mi proyecto?", en: "How can I check my project status?" },
  { es: "¿Ofrecen mantenimiento mensual?", en: "Do you offer monthly maintenance?" },
  { es: "¿Puedo cancelar si ya empezaron a trabajar?", en: "Can I cancel once work has started?" },
  { es: "¿Cuál es la política de reembolsos?", en: "What's the refund policy?" },
  { es: "¿El código queda a mi nombre?", en: "Is the code owned by me?" },
  { es: "¿Cómo protegen mis datos?", en: "How do you protect my data?" },
  { es: "¿Hacen sitios para restaurantes?", en: "Do you build sites for restaurants?" },
  { es: "¿Hacen sitios para clínicas o consultorios?", en: "Do you build sites for clinics?" },
  { es: "¿Puedo agregar una tienda en línea más adelante?", en: "Can I add an online store later?" },
  { es: "¿Qué diferencia hay entre Destello y Constelación?", en: "What's the difference between Destello and Constelación?" },
  { es: "¿El paquete Nova incluye panel de administración?", en: "Does the Nova package include an admin panel?" },
  { es: "¿Cuánto cuesta el Agente de Ventas IA?", en: "How much is the AI Sales Agent?" },
  { es: "¿Puedo conectar mi propia base de datos?", en: "Can I connect my own database?" },
  { es: "¿Qué pasa si dejo de pagar un addon mensual?", en: "What happens if I stop paying a monthly addon?" },
  { es: "¿Ofrecen SEO?", en: "Do you offer SEO?" },
  { es: "¿Cuánto tarda una landing page?", en: "How long does a landing page take?" },
  { es: "¿Puedo ver el precio real de un dominio antes de decidir?", en: "Can I check a domain's real price before deciding?" },
  { es: "¿Trabajan con clientes fuera de República Dominicana?", en: "Do you work with clients outside the Dominican Republic?" },
  { es: "¿Qué incluye el Kit de Branding Básico?", en: "What's included in the Basic Branding Kit?" },
  { es: "¿Cómo contacto a Polaris directamente?", en: "How do I contact Polaris directly?" },
  { es: "¿Cuál es el tiempo de respuesta promedio?", en: "What's the average response time?" },
  { es: "¿Puedo pedir revisiones durante el desarrollo?", en: "Can I request revisions during development?" },
  { es: "¿Qué es el Buscador Semántico IA?", en: "What is the AI Semantic Search addon?" },
  { es: "¿El sitio queda optimizado para buscadores?", en: "Is the site optimized for search engines?" },
  { es: "¿Cómo funciona la firma electrónica del contrato?", en: "How does the electronic contract signature work?" },
  { es: "¿Puedo empezar con un paquete chico y crecer después?", en: "Can I start small and grow later?" },
  { es: "¿Qué pasa si mi dominio elegido cuesta más de lo incluido?", en: "What if my chosen domain costs more than what's included?" },
  { es: "¿Ofrecen copywriting profesional?", en: "Do you offer professional copywriting?" },
  { es: "¿Cómo se ve un ejemplo de sitio inmobiliario?", en: "What does a real estate site example look like?" },
  { es: "¿Puedo integrar mi CRM?", en: "Can I integrate my CRM?" },
  { es: "¿Qué pasa si no me gusta el diseño inicial?", en: "What if I don't like the initial design?" },
  { es: "¿Cuánto tiempo de soporte incluye el lanzamiento?", en: "How much post-launch support is included?" },
  { es: "¿Puedo pagar en cuotas?", en: "Can I pay in installments?" },
  { es: "¿Qué necesito para empezar hoy mismo?", en: "What do I need to get started today?" },
];

const LOCAL_LIFT_SUGGESTIONS: { es: string; en: string }[] = [
  { es: "¿Qué es Local Lift y cómo ayuda a mi negocio?", en: "What is Local Lift and how can it help my business?" },
  { es: "¿Qué incluye el Diagnóstico Express de Local Lift?", en: "What's included in the Local Lift Express Diagnosis?" },
  { es: "¿Qué diferencia hay entre Impulso y Ascenso?", en: "What's the difference between Impulso and Ascenso?" },
  { es: "¿Qué recibo después de generar el diagnóstico?", en: "What do I receive after generating the diagnosis?" },
  { es: "¿Qué información necesita Local Lift para analizar mi negocio?", en: "What information does Local Lift need to analyze my business?" },
  { es: "¿Cuánto tarda un paquete de Local Lift?", en: "How long does a Local Lift package take?" },
  { es: "¿Local Lift publica cambios por mí en Google?", en: "Does Local Lift publish changes for me on Google?" },
  { es: "¿Puedo usar Local Lift para más de un negocio?", en: "Can I use Local Lift for more than one business?" },
  { es: "¿Cómo aplico las recomendaciones de Local Lift?", en: "How do I apply Local Lift recommendations?" },
  { es: "¿Local Lift sirve si mi negocio ya tiene una ficha en Google?", en: "Does Local Lift help if my business already has a Google profile?" },
];

function shuffleSuggestions(pool: { es: string; en: string }[]): { es: string; en: string }[] {
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

function pickRandomSuggestions(count: number): { es: string; en: string }[] {
  return shuffleSuggestions([...SUGGESTIONS_POOL, ...LOCAL_LIFT_SUGGESTIONS]).slice(0, count);
}

function MessageBubble({
  message,
  onSuggestionClick,
  isLast,
  fontSizeClass = "text-sm",
}: {
  message: AiMessage;
  onSuggestionClick: (q: string) => void;
  isLast: boolean;
  fontSizeClass?: string;
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";
  const tts = useTextToSpeech(message.content, message.lang || "es");
  const { translate } = useLanguage();

  const handleCopy = () => {
    navigator.clipboard?.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  if (isUser) {
    return (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-end">
        <div className="max-w-[85%] sm:max-w-[70%] p-3 rounded-2xl rounded-tr-md bg-[var(--color-primary-base)] text-white shadow-sm">
          <p className={`${fontSizeClass} leading-relaxed whitespace-pre-wrap`}>{message.content}</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex justify-start">
      <div className="flex gap-3 max-w-[95%] sm:max-w-[75%]">
        <div className="w-8 h-8 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0 overflow-hidden">
          <AtlasMark variant="isotipo" className="w-6 h-6" />
        </div>
        <div className="group flex-1 min-w-0">
          <div className="p-3 rounded-2xl rounded-tl-md bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)]">
            <AtlasMarkdown content={message.content} sizeClass={fontSizeClass} />
          </div>

          <AtlasWidget widget={message.widget} onAction={onSuggestionClick} lang={message.lang || "es"} />

          {message.content && (
            <div className="mt-1.5 flex items-center gap-3">
              <motion.button
                onClick={handleCopy}
                aria-label={translate("Copiar", "Copy")}
                title={translate("Copiar", "Copy")}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                // Siempre visible en mobile (no hay hover real). En desktop:
                // siempre visible en la ÚLTIMA respuesta (pedido explícito del
                // usuario, mismo criterio ya usado para las sugerencias de
                // seguimiento), hover-only en las anteriores.
                className={`opacity-100 ${isLast ? "md:opacity-100" : "md:opacity-0 md:group-hover:opacity-100"} focus:opacity-100 transition-opacity p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]`}
              >
                {/* Morph real entre Copy/Check (pedido explícito del usuario,
                    con los colores de la web -- currentColor hereda del botón,
                    sin blanco/negro fijo como el ejemplo original) -- mismo
                    resorte (scale+opacity) que ya usan otras animaciones de
                    esta página, en vez del cambio de ícono instantáneo. */}
                <div className="relative w-3 h-3 flex items-center justify-center">
                  <AnimatePresence mode="popLayout" initial={false}>
                    {copied ? (
                      <motion.span
                        key="check"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 600, damping: 25 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Check size={12} />
                      </motion.span>
                    ) : (
                      <motion.span
                        key="copy"
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.5, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 600, damping: 25 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <Copy size={12} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </motion.button>
              <button
                onClick={tts.toggle}
                disabled={tts.loading}
                aria-label={tts.speaking ? translate("Detener", "Stop") : translate("Escuchar", "Listen")}
                title={tts.speaking ? translate("Detener", "Stop") : translate("Escuchar", "Listen")}
                className={`opacity-100 ${isLast ? "md:opacity-100" : "md:opacity-0 md:group-hover:opacity-100"} focus:opacity-100 transition-opacity p-1 ${
                  tts.speaking || tts.loading ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                {tts.loading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : tts.speaking ? (
                  <VolumeX size={12} />
                ) : (
                  <Volume2 size={12} />
                )}
              </button>
              {/* Pedido explícito del usuario: la longitud de la respuesta
                  ahora la decide el modelo según lo que amerite la pregunta
                  (ver REGLAS en quotebot-chat.ts) -- no siempre corta. Este
                  botón cubre el caso contrario: pedir una versión más breve
                  de una respuesta puntual sin tener que escribirlo a mano.
                  Solo tiene sentido en la última respuesta y si el texto ya
                  es largo -- no tiene caso ofrecerlo sobre una de 1 línea.
                  Va ANTES que "Búsqueda web" (pedido explícito del usuario). */}
              {isLast && message.content.length > 220 && (
                <motion.button
                  onClick={() => onSuggestionClick(message.lang === "en" ? "Make that shorter." : "Hazlo más corto.")}
                  aria-label={translate("Respuesta más corta", "Shorter answer")}
                  title={translate("Respuesta más corta", "Shorter answer")}
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="opacity-100 focus:opacity-100 transition-opacity p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  <FoldVertical size={12} />
                </motion.button>
              )}
              {message.usedWebSearch && (
                <div className={`opacity-100 ${isLast ? "md:opacity-100" : "md:opacity-0 md:group-hover:opacity-100"} focus-within:opacity-100 transition-opacity`}>
                  <WebSourcesPanel sources={message.webSearchSources || []} />
                </div>
              )}
            </div>
          )}

          {isLast && message.suggestions && message.suggestions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {message.suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => onSuggestionClick(s)}
                  className="text-xs font-bold px-3 py-2 rounded-full border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-[var(--color-text-secondary)] transition-colors text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Switch real (Ajustes), usado por "Sonido al responder" y "Enviar con
// Enter". Alineación por flex (justify-start/end) en vez de calcular
// translate-x a mano -- más robusto contra el box model real del botón
// (bug real reportado en vivo: el switch se veía deformado con el enfoque
// anterior). El thumb usa `layout` de framer-motion para deslizar con
// resorte real entre las dos posiciones, y el botón entero escala un poco
// al hacer hover/tap para que el control se sienta vivo, no solo un cambio
// de color instantáneo.
function ToggleSwitch({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <motion.button
      onClick={onChange}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      whileHover={{ scale: 1.06 }}
      whileTap={{ scale: 0.94 }}
      className={`w-11 h-6 shrink-0 rounded-full border-0 p-0.5 flex items-center transition-colors ${
        checked ? "bg-[var(--color-primary-base)] justify-end" : "bg-[var(--color-border-subtle)] justify-start"
      }`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 34 }} className="block w-5 h-5 rounded-full bg-white shadow-sm" />
    </motion.button>
  );
}

export default function AtlasChat() {
  const { translate, language, setLanguage } = useLanguage();
  useEffect(() => {
    document.title = translate(
      "Asistente IA — Atlas Assistant | Polaris Web Studio",
      "AI Assistant — Atlas Assistant | Polaris Web Studio",
    );
  }, [translate]);

  const {
    messages,
    loading,
    thinkingMsg,
    isSearchingWeb,
    liveSearchSources,
    liveSourceIdx,
    lastMsgLang,
    error,
    activeId,
    conversations,
    isTemporary,
    toggleTemporary,
    sendMessage,
    retryLast,
    stopGenerating,
    newChat,
    loadConversation,
    deleteConversation,
    renameConversation,
    togglePinConversation,
    clearAllConversations,
    maxPinned,
  } = useAtlasChat();
  const { theme, toggleTheme } = useTheme();
  const { fontSize, setFontSize, soundEnabled, setSoundEnabled, enterToSend, setEnterToSend } = useAtlasPrefs();
  const [input, setInput] = useState("");
  const speech = useSpeechToText(
    (transcript) => setInput((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript)),
    language,
  );
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  // Solo aplica en desktop (md+) -- en mobile el sidebar siempre es un
  // overlay a pantalla completa, "colapsar a rail de íconos" no tendría
  // sentido ahí. Persistido para que la preferencia sobreviva un refresh.
  const [desktopCollapsed, setDesktopCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("atlas_sidebar_collapsed") === "1";
  });
  useEffect(() => {
    localStorage.setItem("atlas_sidebar_collapsed", desktopCollapsed ? "1" : "0");
  }, [desktopCollapsed]);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [confirmClearAll, setConfirmClearAll] = useState(false);
  const pinnedCount = conversations.filter((c) => c.pinned).length;

  // Sonido opcional al terminar de responder (ajuste apagado por defecto) --
  // se detecta la transición true -> false de `loading`, no cada render.
  const prevLoadingRef = useRef(false);
  useEffect(() => {
    if (prevLoadingRef.current && !loading && soundEnabled) playAtlasChime();
    prevLoadingRef.current = loading;
  }, [loading, soundEnabled]);

  // Exporta todo el historial local a un .txt real -- distinto de
  // "Compartir" (una sola conversación a la vez). Genera el archivo
  // client-side (Blob + <a download>), sin pegarle a ningún backend.
  const exportAllConversations = () => {
    const lines: string[] = [];
    for (const c of conversations as AiConversation[]) {
      lines.push(`# ${c.title}`, "");
      for (const m of c.messages) {
        lines.push(`${m.role === "user" ? translate("Yo", "Me") : "Atlas"}: ${m.content}`, "");
      }
      lines.push("---", "");
    }
    const blob = new Blob([lines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `atlas-conversaciones-${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareFeedbackId, setShareFeedbackId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  // Solo importa mientras searchOpen Y sidebarOpen son true a la vez --
  // distingue "abrí la búsqueda desde el sidebar" (la búsqueda debe quedar
  // arriba, tapando el sidebar) de "estoy en la búsqueda y me asomé al
  // sidebar" (el sidebar debe quedar arriba, tapando la búsqueda -- al
  // cerrarlo con el X/backdrop, la búsqueda sigue exactamente como estaba,
  // mismo comportamiento que el botón de arriba a la izquierda en Gemini).
  const [sidebarAboveSearch, setSidebarAboveSearch] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [suggestions] = useState(() => pickRandomSuggestions(4));
  const menuRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const activeTitle = messages.length === 0 ? translate("Nuevo chat", "New chat") : activeConversation?.title || translate("Nuevo chat", "New chat");
  const searchItems = conversations.map((c) => ({
    id: c.id,
    title: c.title,
    icon: c.icon,
    text: c.messages.map((m) => m.content).join(" "),
    updatedAt: c.updatedAt,
  }));

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length, loading]);

  useEffect(() => {
    if (!openMenuId) return;
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpenMenuId(null);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [openMenuId]);

  // Bloquea el scroll de <body> mientras esta página está montada -- sin
  // esto, en mobile Safari/Chrome real (no reproducible en este entorno de
  // desarrollo) el navegador termina scrolleando la página completa en vez
  // de solo el panel de mensajes, arrastrando el header y la caja de texto
  // con él aunque estén dentro de un contenedor `h-dvh` con `overflow-hidden`.
  // Mismo patrón que el modo cine de Portfolio.tsx.
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  const handleSend = (override?: string) => {
    const text = override ?? input;
    if (!text.trim() || loading) return;
    sendMessage(text);
    setInput("");
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  // Enter siempre agrega una línea nueva -- el mensaje solo se manda con el
  // botón de enviar (pedido explícito del usuario: en mobile, Enter mandaba
  // el mensaje y el teclado tapaba la caja de texto justo después).

  const shareConversation = async (title: string, msgs: AiMessage[], id: string) => {
    const transcript = msgs.map((m) => `${m.role === "user" ? translate("Me", "Yo") : "Atlas"}: ${m.content}`).join("\n\n");
    const payload = { title, text: transcript || title };
    try {
      if (navigator.share) {
        await navigator.share(payload);
        return;
      }
    } catch {
      return; // el usuario canceló el share nativo
    }
    try {
      await navigator.clipboard?.writeText(transcript || title);
      setShareFeedbackId(id);
      setTimeout(() => setShareFeedbackId(null), 1500);
    } catch {
      // sin clipboard disponible, no hay más alternativa razonable acá
    }
  };

  return (
    <div className="h-dvh w-full flex bg-[var(--color-surface-base)] overflow-hidden pt-[env(safe-area-inset-top)]">
      {/* Sidebar de historial -- en mobile es un overlay a pantalla completa
          (no empuja el layout, mismo patrón que el drawer de Meridian y el
          menú de Gemini); en desktop (md+) queda inline como panel fijo. */}
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.div
            onClick={() => {
              setSidebarOpen(false);
              setSidebarAboveSearch(false);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`fixed inset-0 ${sidebarAboveSearch ? "z-[79]" : "z-40"} bg-black/50 md:hidden`}
          />
        )}
      </AnimatePresence>
      <AnimatePresence initial={false}>
        {sidebarOpen && (
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ duration: 0.2 }}
            // Sin overflow-hidden acá a propósito -- clipeaba el tooltip
            // (position:absolute) de los íconos del rail colapsado, que
            // necesita poder salirse del ancho angosto del panel (68px) para
            // mostrarse completo hacia la derecha. Los contenedores internos
            // (contenido completo, lista de conversaciones) ya manejan su
            // propio overflow-hidden/overflow-y-auto por separado.
            className={`fixed inset-y-0 left-0 ${sidebarAboveSearch ? "z-[80]" : "z-50"} w-full md:static md:z-auto ${desktopCollapsed ? "md:w-[68px]" : "md:w-[280px]"} shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col`}
          >
            {/* ---- Contenido completo: siempre visible en mobile (el sidebar
                ahí es un overlay a pantalla completa, "colapsar a rail" no
                aplica), y en desktop cuando NO está colapsado. ---- */}
            {/* Sin overflow-hidden -- mismo bug que el <aside> (ver arriba):
                cortaba el tooltip del botón de buscar, pegado cerca del
                borde derecho del panel expandido. La lista de conversaciones
                más abajo ya tiene su propio overflow-y-auto, no depende de
                que este contenedor recorte nada. */}
            <div className={`flex-1 flex flex-col ${desktopCollapsed ? "md:hidden" : ""}`}>
            <div className="p-3 flex items-center gap-2">
              {/* Ícono solo (sin la palabra "Inicio") -- deja más espacio real
                  para que el logo de Atlas quede centrado de verdad en el
                  header, en vez de descentrado por el ancho variable del
                  botón de texto que había antes. */}
              <Tooltip label={translate("Ir al inicio", "Go to home")}>
                <Link
                  to="/"
                  className="flex items-center justify-center p-2.5 md:p-1.5 rounded-full border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-[var(--color-text-secondary)] transition-colors shrink-0"
                  aria-label={translate("Ir al inicio", "Go to home")}
                >
                  <Home size={18} className="md:w-3.5 md:h-3.5" />
                </Link>
              </Tooltip>
              <div className="flex-1 flex items-center justify-center gap-1.5 min-w-0">
                <AtlasMark variant="isotipo" className="w-8 h-8 md:w-6 md:h-6 shrink-0" />
                <AtlasMark variant="wordmark" className="h-7 md:h-5 w-auto" />
              </div>
              {/* Reemplaza al botón de idioma de antes (movido al modal de
                  ajustes) -- colapsa el sidebar a un rail de solo íconos,
                  mismo patrón que Gemini. Solo visible en desktop -- en
                  mobile el sidebar es un overlay a pantalla completa, sin
                  concepto de "colapsado". */}
              <Tooltip label={translate("Colapsar panel", "Collapse panel")}>
                <button
                  onClick={() => setDesktopCollapsed(true)}
                  className="hidden md:flex items-center justify-center p-1.5 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-[var(--color-text-secondary)] transition-colors shrink-0"
                  aria-label={translate("Colapsar panel", "Collapse panel")}
                >
                  <ChevronsLeft size={14} />
                </button>
              </Tooltip>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  setSidebarAboveSearch(false);
                }}
                className="p-3 rounded-full border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-[var(--color-text-secondary)] transition-colors shrink-0 md:hidden"
                aria-label={translate("Cerrar menú", "Close menu")}
              >
                <X size={22} />
              </button>
            </div>

            <div className="px-3 pb-3 flex items-center gap-2">
              <Tooltip label={translate("Nuevo chat", "New chat")} className="flex-1">
                <button
                  onClick={() => {
                    newChat();
                    // Nuevo chat siempre sale de la búsqueda, esté o no
                    // "de fondo" -- no tendría sentido dejarla abierta detrás
                    // de un chat nuevo. En mobile el sidebar también se
                    // cierra (es un overlay a pantalla completa); en desktop
                    // queda inline y no debe desaparecer.
                    setSearchOpen(false);
                    setSidebarAboveSearch(false);
                    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                      setSidebarOpen(false);
                    }
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 md:py-1.5 px-3 md:px-2.5 rounded-full border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] text-sm md:text-xs font-black uppercase tracking-wider transition-colors"
                >
                  <SquarePen size={16} className="md:w-3.5 md:h-3.5" />
                  <T en="New chat">Nuevo chat</T>
                </button>
              </Tooltip>
              <Tooltip label={translate("Chat temporal", "Temporary chat")}>
                <button
                  onClick={() => {
                    toggleTemporary();
                    setSearchOpen(false);
                    setSidebarAboveSearch(false);
                    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                      setSidebarOpen(false);
                    }
                  }}
                  aria-label={translate("Chat temporal", "Temporary chat")}
                  className={`p-2.5 md:p-1.5 rounded-full border transition-colors shrink-0 ${
                    isTemporary
                      ? "border-[var(--color-text-primary)] bg-[var(--color-text-primary)] text-[var(--color-surface-base)]"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)]"
                  }`}
                >
                  <TemporaryChatIcon size={16} className="md:w-3.5 md:h-3.5" />
                </button>
              </Tooltip>
              {conversations.length > 0 && (
                <Tooltip label={translate("Buscar conversaciones", "Search conversations")}>
                  <button
                    onClick={() => {
                      setSearchOpen(true);
                      setSidebarAboveSearch(false);
                    }}
                    aria-label={translate("Buscar conversaciones", "Search conversations")}
                    className="p-2.5 md:p-1.5 rounded-full border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] transition-colors shrink-0"
                  >
                    <Search size={16} className="md:w-3.5 md:h-3.5" />
                  </button>
                </Tooltip>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {conversations.length === 0 && (
                <p className="text-sm text-[var(--color-text-tertiary)] px-3 py-4 text-center">
                  <T en="Your conversations will appear here.">Tus conversaciones aparecerán aquí.</T>
                </p>
              )}
              {conversations.length > 0 && (
                <p className="px-3 pt-1 pb-1.5 text-xs font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                  <T en="Recent">Recientes</T>
                </p>
              )}
              {conversations.map((c) => {
                const ConvIcon = getConversationIcon(c.icon, c.title, c.messages.map((m) => m.content).join(" "));
                return (
                <div
                  key={c.id}
                  className={`group relative flex items-center gap-2.5 px-3 py-3 md:py-2 rounded-lg cursor-pointer transition-colors ${
                    c.id === activeId
                      ? "bg-[var(--color-primary-muted)] text-[var(--color-primary-base)]"
                      : "hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"
                  }`}
                  onClick={() => {
                    if (renamingId === c.id) return;
                    loadConversation(c.id);
                    // Elegir un chat también sale de la búsqueda de fondo,
                    // igual que "Nuevo chat" -- mismo criterio.
                    setSearchOpen(false);
                    setSidebarAboveSearch(false);
                    // En mobile el sidebar es un overlay a pantalla completa --
                    // se cierra al elegir un chat. En desktop (md+) queda inline
                    // y no debe desaparecer, así que solo se cierra bajo el
                    // breakpoint real, no incondicionalmente.
                    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <ConvIcon size={18} className="shrink-0 opacity-60 md:w-4 md:h-4" />
                  {c.pinned && <Pin size={12} className="shrink-0 opacity-70 -ml-1 md:w-3 md:h-3" />}
                  {renamingId === c.id ? (
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      onFocus={(e) => e.currentTarget.select()}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          renameConversation(c.id, renameValue);
                          setRenamingId(null);
                        } else if (e.key === "Escape") {
                          setRenamingId(null);
                        }
                      }}
                      onBlur={() => {
                        renameConversation(c.id, renameValue);
                        setRenamingId(null);
                      }}
                      className="flex-1 min-w-0 text-base md:text-sm font-semibold bg-transparent outline-none border-b border-[var(--color-primary-base)]"
                    />
                  ) : (
                    <span className="flex-1 min-w-0 text-base md:text-sm font-semibold truncate">
                      {shareFeedbackId === c.id ? <T en="Copied to clipboard">Copiado al portapapeles</T> : c.title}
                    </span>
                  )}
                  {renamingId !== c.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(openMenuId === c.id ? null : c.id);
                      }}
                      className="shrink-0 p-1 rounded hover:bg-black/10 dark:hover:bg-white/10 transition-colors"
                      aria-label={translate("Más opciones", "More options")}
                    >
                      <MoreVertical size={16} className="md:w-3.5 md:h-3.5" />
                    </button>
                  )}
                  {openMenuId === c.id && (
                    <div
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-10 z-20 w-48 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg overflow-hidden text-[var(--color-text-primary)]"
                    >
                      <button
                        onClick={() => {
                          togglePinConversation(c.id);
                          setOpenMenuId(null);
                        }}
                        disabled={!c.pinned && pinnedCount >= maxPinned}
                        title={!c.pinned && pinnedCount >= maxPinned ? translate(`Máximo ${maxPinned} conversaciones fijadas`, `Max ${maxPinned} pinned conversations`) : undefined}
                        className="w-full flex items-center gap-2.5 px-4 py-3 md:py-2 text-base md:text-sm font-semibold hover:bg-[var(--color-surface-highlight)] transition-colors text-left disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      >
                        {c.pinned ? <PinOff size={18} className="md:w-4 md:h-4" /> : <Pin size={18} className="md:w-4 md:h-4" />}
                        {c.pinned ? <T en="Unpin">Desfijar</T> : <T en="Pin">Fijar</T>}
                      </button>
                      <button
                        onClick={() => {
                          setRenamingId(c.id);
                          setRenameValue(c.title);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 md:py-2 text-base md:text-sm font-semibold hover:bg-[var(--color-surface-highlight)] transition-colors text-left"
                      >
                        <Pencil size={18} className="md:w-4 md:h-4" />
                        <T en="Rename">Renombrar</T>
                      </button>
                      <button
                        onClick={() => {
                          shareConversation(c.title, c.messages, c.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 md:py-2 text-base md:text-sm font-semibold hover:bg-[var(--color-surface-highlight)] transition-colors text-left"
                      >
                        <Share2 size={18} className="md:w-4 md:h-4" />
                        <T en="Share">Compartir</T>
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(c.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-4 py-3 md:py-2 text-base md:text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <Trash2 size={18} className="md:w-4 md:h-4" />
                        <T en="Delete">Eliminar</T>
                      </button>
                    </div>
                  )}
                </div>
                );
              })}
            </div>

            {/* Botón de ajustes al fondo del panel -- abre el modal centrado
                con idioma, tema y borrar historial (pedido explícito del
                usuario, en vez de que el botón de idioma viviera suelto
                arriba del todo). */}
            <div className="shrink-0 border-t border-[var(--color-border-subtle)] p-2">
              <button
                onClick={() => setSettingsOpen(true)}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 md:py-2 rounded-full text-sm md:text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)] transition-colors"
              >
                <Settings size={16} className="md:w-3.5 md:h-3.5" />
                <T en="Settings">Ajustes</T>
              </button>
            </div>
            </div>

            {/* ---- Rail de solo íconos (desktop, colapsado) -- mismo patrón
                que el sidebar colapsado de Gemini: sin lista de
                conversaciones ni texto, solo los accesos rápidos reales. ---- */}
            <div className={`hidden ${desktopCollapsed ? "md:flex" : ""} flex-col items-center flex-1 py-3 gap-1`}>
              {/* Sin overflow-hidden acá (a diferencia del resto del sidebar)
                  -- bug real reportado: el tooltip (position:absolute) de
                  cada ícono quedaba cortado por el propio contenedor angosto
                  del rail. side="right" además evita que el tooltip intente
                  centrarse sobre un ícono pegado al borde izquierdo real de
                  la pantalla. */}
              <Tooltip label={translate("Expandir panel", "Expand panel")} side="right">
                <button
                  onClick={() => setDesktopCollapsed(false)}
                  className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] transition-colors"
                  aria-label={translate("Expandir panel", "Expand panel")}
                >
                  <ChevronsRight size={16} />
                </button>
              </Tooltip>
              <div className="h-px w-8 my-1.5 bg-[var(--color-border-subtle)]" />
              <Tooltip label={translate("Ir al inicio", "Go to home")} side="right">
                <Link
                  to="/"
                  className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] transition-colors"
                  aria-label={translate("Ir al inicio", "Go to home")}
                >
                  <Home size={16} />
                </Link>
              </Tooltip>
              <Tooltip label={translate("Nuevo chat", "New chat")} side="right">
                <button
                  onClick={() => {
                    newChat();
                    setSearchOpen(false);
                    setSidebarAboveSearch(false);
                  }}
                  className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] transition-colors"
                  aria-label={translate("Nuevo chat", "New chat")}
                >
                  <SquarePen size={16} />
                </button>
              </Tooltip>
              <Tooltip label={translate("Chat temporal", "Temporary chat")} side="right">
                <button
                  onClick={() => {
                    toggleTemporary();
                    setSearchOpen(false);
                    setSidebarAboveSearch(false);
                  }}
                  aria-label={translate("Chat temporal", "Temporary chat")}
                  className={`p-2 rounded-lg transition-colors ${
                    isTemporary
                      ? "bg-[var(--color-text-primary)] text-[var(--color-surface-base)]"
                      : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)]"
                  }`}
                >
                  <TemporaryChatIcon size={16} />
                </button>
              </Tooltip>
              {conversations.length > 0 && (
                <Tooltip label={translate("Buscar conversaciones", "Search conversations")} side="right">
                  <button
                    onClick={() => {
                      setSearchOpen(true);
                      setSidebarAboveSearch(false);
                    }}
                    aria-label={translate("Buscar conversaciones", "Search conversations")}
                    className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] transition-colors"
                  >
                    <Search size={16} />
                  </button>
                </Tooltip>
              )}
              <div className="flex-1" />
              <Tooltip label={translate("Ajustes", "Settings")} side="right">
                <button
                  onClick={() => setSettingsOpen(true)}
                  className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] transition-colors"
                  aria-label={translate("Ajustes", "Settings")}
                >
                  <Settings size={16} />
                </button>
              </Tooltip>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Confirmación antes de borrar -- una conversación borrada no se
          puede recuperar (no hay soft-delete), a diferencia de renombrar
          o compartir. */}
      <AnimatePresence>
        {confirmDeleteId && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setConfirmDeleteId(null)}
            className="fixed inset-0 z-[80] flex items-center justify-center p-6 bg-black/60"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5 shadow-2xl"
            >
              <h3 className="text-base font-black text-[var(--color-text-primary)] mb-1.5">
                <T en="Delete this conversation?">¿Eliminar esta conversación?</T>
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                <T en="This can't be undone.">Esta acción no se puede deshacer.</T>
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] transition-colors"
                >
                  <T en="Cancel">Cancelar</T>
                </button>
                <button
                  onClick={() => {
                    deleteConversation(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <T en="Delete">Eliminar</T>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de ajustes -- centrado, reemplaza el botón de idioma suelto
          que vivía arriba del sidebar (pedido explícito del usuario). Idioma,
          tema y borrar historial, todo en un mismo lugar en vez de esparcido. */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              setSettingsOpen(false);
              setConfirmClearAll(false);
            }}
            className="fixed inset-0 z-[90] flex items-center justify-center p-6 bg-black/60"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-6 shadow-2xl"
            >
              {confirmClearAll ? (
                <>
                  <h3 className="text-base font-black text-[var(--color-text-primary)] mb-1.5">
                    <T en="Delete all conversations?">¿Borrar todo el historial?</T>
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                    <T en="This can't be undone.">Esta acción no se puede deshacer.</T>
                  </p>
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => setConfirmClearAll(false)}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] transition-colors"
                    >
                      <T en="Cancel">Cancelar</T>
                    </button>
                    <button
                      onClick={() => {
                        clearAllConversations();
                        setConfirmClearAll(false);
                        setSettingsOpen(false);
                      }}
                      className="px-4 py-2.5 rounded-lg text-sm font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                    >
                      <T en="Delete all">Borrar todo</T>
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-black text-[var(--color-text-primary)]">
                      <T en="Settings">Ajustes</T>
                    </h3>
                    <button
                      onClick={() => setSettingsOpen(false)}
                      className="p-1.5 rounded-lg text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)] transition-colors"
                      aria-label={translate("Cerrar", "Close")}
                    >
                      <X size={18} />
                    </button>
                  </div>

                  <div className="space-y-5">
                    <div className="space-y-1.5">
                      <p className="px-3 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        <T en="Appearance">Apariencia</T>
                      </p>
                      {/* Idioma -- esta página no tiene el Navbar del sitio
                          (donde vive el switcher ES/EN normal), sin esto
                          alguien con el navegador en inglés y sin preferencia
                          guardada queda atascado en inglés acá. */}
                      <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-text-primary)]">
                          <Globe size={18} className="text-[var(--color-text-secondary)]" />
                          <T en="Language">Idioma</T>
                        </div>
                        <button
                          onClick={() => setLanguage(language === "es" ? "en" : "es")}
                          className="px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] transition-colors"
                        >
                          {language === "es" ? "Español" : "English"}
                        </button>
                      </div>

                      {/* Tema -- claro/oscuro, mismo useTheme() que ya usa el
                          resto del sitio (persistido en localStorage). */}
                      <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-text-primary)]">
                          {theme === "light" ? <Sun size={18} className="text-[var(--color-text-secondary)]" /> : <Moon size={18} className="text-[var(--color-text-secondary)]" />}
                          <T en="Theme">Tema</T>
                        </div>
                        <button
                          onClick={toggleTheme}
                          className="px-3 py-1.5 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] transition-colors"
                        >
                          {theme === "light" ? <T en="Light">Claro</T> : <T en="Dark">Oscuro</T>}
                        </button>
                      </div>

                      {/* Tamaño de texto -- 3 opciones reales (Chico/Mediano/Grande),
                          aplican tanto al widget flotante como a esta página (mismo
                          hook useAtlasPrefs, persistido en localStorage). */}
                      <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-text-primary)]">
                          <Type size={18} className="text-[var(--color-text-secondary)]" />
                          <T en="Text size">Tamaño de texto</T>
                        </div>
                        {/* Segmentado con indicador que desliza entre
                            opciones (layoutId de framer-motion, sin
                            overflow-hidden en el contenedor -- cada botón
                            tiene su propio radio real, no depende de que el
                            padre lo recorte). */}
                        <div className="relative flex items-center gap-0.5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-0.5">
                          {(["sm", "md", "lg"] as AtlasFontSize[]).map((size) => (
                            <button
                              key={size}
                              onClick={() => setFontSize(size)}
                              aria-label={size === "sm" ? translate("Chico", "Small") : size === "md" ? translate("Mediano", "Medium") : translate("Grande", "Large")}
                              className={`relative z-0 w-9 py-1.5 rounded-lg font-black transition-colors ${size === "sm" ? "text-xs" : size === "md" ? "text-sm" : "text-base"} ${
                                fontSize === size ? "text-white" : "text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)]"
                              }`}
                            >
                              {/* Bug real corregido: un z-index NEGATIVO sin un
                                  ancestro que abra su propio stacking context
                                  (position:relative solo, sin z-index propio,
                                  NO alcanza) puede terminar pintándose detrás
                                  de TODA la página, no solo detrás de la letra
                                  -- por eso la "A" activa se veía invisible en
                                  modo claro. Fix: el botón gana z-0 (ahora sí
                                  abre su propio contexto) y el indicador se
                                  queda en z-index normal (auto), mientras la
                                  letra pide z-10 explícito -- ya no depende de
                                  jerarquías negativas frágiles. */}
                              {fontSize === size && (
                                <motion.span
                                  layoutId="fontSizeIndicator"
                                  transition={{ type: "spring", stiffness: 500, damping: 32 }}
                                  className="absolute inset-0 rounded-lg bg-[var(--color-primary-base)]"
                                />
                              )}
                              <span className="relative z-10">A</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="px-3 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        <T en="Chat behavior">Comportamiento del chat</T>
                      </p>
                      {/* Sonido al terminar de responder -- apagado por
                          defecto, útil para quien cambia de pestaña mientras
                          espera. Beep generado con Web Audio, sin archivo. */}
                      <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-text-primary)]">
                          {soundEnabled ? <Bell size={18} className="text-[var(--color-text-secondary)]" /> : <BellOff size={18} className="text-[var(--color-text-secondary)]" />}
                          <T en="Sound on reply">Sonido al responder</T>
                        </div>
                        <ToggleSwitch checked={soundEnabled} onChange={() => setSoundEnabled(!soundEnabled)} label={translate("Sonido al responder", "Sound on reply")} />
                      </div>

                      {/* Enviar con Enter -- ON por defecto en desktop
                          (comportamiento ya existente); apagarlo hace que
                          Enter SIEMPRE agregue una línea nueva, solo se envía
                          con el botón. No aplica en mobile (ver textarea). */}
                      <div className="flex items-center justify-between px-3 py-3 rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors">
                        <div className="flex items-center gap-2.5 text-sm font-semibold text-[var(--color-text-primary)]">
                          <CornerDownLeft size={18} className="text-[var(--color-text-secondary)]" />
                          <div>
                            <T en="Send with Enter">Enviar con Enter</T>
                            <p className="text-xs font-normal text-[var(--color-text-tertiary)]">
                              <T en="Desktop only">Solo en desktop</T>
                            </p>
                          </div>
                        </div>
                        <ToggleSwitch checked={enterToSend} onChange={() => setEnterToSend(!enterToSend)} label={translate("Enviar con Enter", "Send with Enter")} />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <p className="px-3 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        <T en="Data">Datos</T>
                      </p>
                      {/* Exportar TODO el historial de una vez -- distinto de
                          "Compartir" (una sola conversación a la vez, desde el
                          menú de 3 puntos de cada chat). */}
                      <button
                        onClick={exportAllConversations}
                        disabled={conversations.length === 0}
                        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)] transition-colors text-left disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      >
                        <Download size={18} className="text-[var(--color-text-secondary)]" />
                        <T en="Export all conversations (.txt)">Exportar todo el historial (.txt)</T>
                      </button>

                      {/* Borrar historial -- irreversible, pide confirmación
                          aparte (misma vista del modal, no un segundo modal). */}
                      <button
                        onClick={() => setConfirmClearAll(true)}
                        disabled={conversations.length === 0}
                        className="w-full flex items-center gap-2.5 px-3 py-3 rounded-lg text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed"
                      >
                        <Trash2 size={18} />
                        <T en="Delete all conversations">Borrar todo el historial</T>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header
          className={`shrink-0 flex items-center gap-3 px-4 py-1.5 border-b backdrop-blur-md transition-colors ${
            isTemporary ? "bg-[var(--color-text-primary)] border-[var(--color-text-primary)]" : "bg-[var(--color-surface-base)]/80 border-[var(--color-border-subtle)]"
          }`}
        >
          {/* Solo mobile -- en desktop el sidebar ya no se oculta del todo
              desde acá (pedido explícito del usuario, redundante con el
              colapso a rail de íconos que ahora vive dentro del propio
              sidebar). En mobile sigue siendo el único acceso real para
              volver a abrir el overlay una vez cerrado. */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className={`md:hidden p-2 rounded-full transition-colors ${isTemporary ? "text-[var(--color-surface-base)] hover:bg-white/10" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"}`}
            aria-label={translate("Mostrar/ocultar historial", "Toggle history")}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          {/* AtlasMark queda SIEMPRE montado (nunca condicionado a
              !isTemporary) -- desmontar y volver a montar el <img> al
              alternar el modo forzaba al navegador a recargar/redecodificar
              el isotipo cada vez, con un parpadeo real de unos ms al volver
              rápido al chat normal. Con display:none en vez de unmount, el
              elemento ya decodificado queda listo de inmediato.
              El "hidden" va en un <span> envolvente, NUNCA metido dentro del
              className que recibe AtlasMark -- ahí adentro compite en
              especificidad con la propia lógica interna del componente
              (que decide variante negra/blanca según el tema) y puede
              perder, dejando el isotipo negro visible sobre la barra oscura
              invertida del modo temporal (bug real reportado en vivo: el
              logo quedaba invisible/negro sobre fondo oscuro en tema claro). */}
          <span className={isTemporary ? "hidden" : "contents"}>
            <AtlasMark variant="isotipo" className="w-6 h-6 shrink-0" />
          </span>
          {isTemporary && <TemporaryChatIcon size={18} className="text-[var(--color-surface-base)]" />}
          <p className={`flex-1 min-w-0 truncate text-xs font-black uppercase tracking-widest ${isTemporary ? "text-[var(--color-surface-base)]" : "text-[var(--color-text-primary)]"}`}>
            {isTemporary ? <T en="Temporary chat">Chat temporal</T> : activeTitle}
          </p>
          <button
            onClick={toggleTemporary}
            className={`p-2 rounded-full transition-colors shrink-0 ${
              isTemporary ? "text-[var(--color-surface-base)] hover:bg-white/10" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
            }`}
            aria-label={translate("Chat temporal", "Temporary chat")}
            title={translate("Chat temporal", "Temporary chat")}
          >
            <TemporaryChatIcon size={18} />
          </button>
          <button
            onClick={newChat}
            className={`p-2 rounded-full transition-colors shrink-0 ${
              isTemporary ? "text-[var(--color-surface-base)] hover:bg-white/10" : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
            }`}
            aria-label={translate("Nuevo chat", "New chat")}
            title={translate("Nuevo chat", "New chat")}
          >
            <SquarePen size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && isTemporary ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-md w-full flex flex-col items-center gap-3">
                <TemporaryChatIcon size={40} className="text-[var(--color-text-tertiary)]" />
                <p className="text-lg font-black text-[var(--color-text-primary)]">
                  <T en="Temporary chat">Chat temporal</T>
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] leading-relaxed">
                  <T en="This conversation won't be saved to your chat history, and won't appear in the sidebar or search. It's gone once you close it or start a new chat.">
                    Esta conversación no se guardará en tu historial, ni aparecerá en el sidebar o la búsqueda. Se pierde apenas la cierres o empieces un chat nuevo.
                  </T>
                </p>
              </motion.div>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
                <div className="flex flex-col items-center gap-2 mb-6">
                  <AtlasMark variant="isotipo" className="w-32 h-32" />
                  <AtlasMark variant="wordmark" label="Atlas Assistant" className="h-9 w-auto -mt-2" />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                  <T en="Ask me about web design, Local Lift, Polaris Flow, plans, timelines, or your next project.">
                    Pregúntame sobre diseño web, Local Lift, Polaris Flow, planes, plazos o lo que necesites de tu próximo proyecto.
                  </T>
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {suggestions.map((s) => (
                    <button
                      key={s.es}
                      onClick={() => handleSend(translate(s.es, s.en))}
                      className="text-left text-xs font-bold px-4 py-3 rounded-full border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-[var(--color-text-secondary)] transition-colors"
                    >
                      {translate(s.es, s.en)}
                    </button>
                  ))}
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
              {messages.map((m, i) => {
                // Se omite la burbuja del assistant mientras está vacía
                // (streaming aún sin el primer delta) -- ya la cubre el
                // indicador de "escribiendo" de abajo.
                if (m.role === "assistant" && !m.content && i === messages.length - 1) return null;
                return (
                  <MessageBubble
                    key={i}
                    message={m}
                    onSuggestionClick={handleSend}
                    isLast={i === messages.length - 1}
                    fontSizeClass={FONT_SIZE_CLASS[fontSize]}
                  />
                );
              })}

              {loading && !messages[messages.length - 1]?.content && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                      <AtlasMark variant="isotipo" className="w-6 h-6" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] flex items-center gap-2">
                      {isSearchingWeb && <Globe size={13} className="shrink-0 text-[var(--color-primary-base)] animate-pulse" />}
                      {isSearchingWeb && liveSearchSources.length > 0 ? (
                        <ThinkingText
                          message={{
                            es: `Leyendo **${hostnameOf(liveSearchSources[liveSourceIdx % liveSearchSources.length]?.url || "")}**…`,
                            en: `Reading **${hostnameOf(liveSearchSources[liveSourceIdx % liveSearchSources.length]?.url || "")}**…`,
                          }}
                          lang={lastMsgLang}
                        />
                      ) : (
                        <ThinkingText
                          message={isSearchingWeb ? { es: "Buscando en la web...", en: "Searching the web..." } : thinkingMsg}
                          lang={lastMsgLang}
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <div className="flex flex-col items-center gap-1.5">
                  <p className="text-xs text-red-500 text-center">
                    <T en="Something went wrong. Try again or write to us on WhatsApp.">
                      Algo falló. Intenta de nuevo o escríbenos por WhatsApp.
                    </T>
                  </p>
                  <button
                    onClick={retryLast}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-red-500/30 text-red-500 text-xs font-bold hover:bg-red-500/10 transition-colors"
                  >
                    <RotateCcw size={12} />
                    <T en="Retry">Reintentar</T>
                  </button>
                </div>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
          <div className="max-w-3xl mx-auto flex items-center gap-2 p-2 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-highlight)] focus-within:border-[var(--color-primary-base)] transition-colors">
            {speech.listening ? (
              <VoiceInputBar
                levels={speech.levels}
                interimText={speech.interimText}
                voiceLang={speech.voiceLang}
                onCancel={speech.cancel}
                onConfirm={speech.stop}
                onSwitchLang={speech.switchVoiceLang}
              />
            ) : (
              <>
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    // Enter envía el mensaje solo en desktop (mouse/teclado físico,
                    // sin touch) -- en mobile el teclado virtual tapa la caja justo
                    // después de escribir, así que ahí Enter solo agrega una línea.
                    // `enterToSend` (ajuste real en /asistente, ON por defecto) deja
                    // apagar esto del todo -- con el ajuste apagado, Enter SIEMPRE
                    // agrega una línea nueva, incluso en desktop.
                    if (
                      enterToSend &&
                      e.key === "Enter" &&
                      !e.shiftKey &&
                      typeof window !== "undefined" &&
                      window.matchMedia("(min-width: 768px) and (hover: hover) and (pointer: fine)").matches
                    ) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  rows={1}
                  maxLength={2000}
                  placeholder={translate("Escríbeme lo que quieras...", "Ask me anything...")}
                  className="flex-1 resize-none bg-transparent outline-none text-sm px-2 py-2 max-h-32 placeholder:text-[var(--color-text-tertiary)]"
                />
                {speech.supported && (
                  <button
                    onClick={speech.toggle}
                    aria-label={translate("Dictar por voz", "Dictate by voice")}
                    title={translate("Dictar por voz", "Dictate by voice")}
                    className="w-9 h-9 shrink-0 rounded-full flex items-center justify-center text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-primary-base)] transition-all"
                  >
                    <Mic size={16} />
                  </button>
                )}
              </>
            )}
            {!speech.listening &&
              (loading ? (
                <button
                  onClick={stopGenerating}
                  aria-label={translate("Detener", "Stop")}
                  className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-base)] text-white flex items-center justify-center hover:brightness-110 transition-all"
                >
                  <Square size={12} className="fill-current" />
                </button>
              ) : (
                <button
                  onClick={() => handleSend()}
                  disabled={!input.trim()}
                  aria-label={translate("Enviar mensaje", "Send message")}
                  className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-base)] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
                >
                  <Send size={14} />
                </button>
              ))}
          </div>
          <p className="text-center text-[10px] text-[var(--color-text-tertiary)] mt-1">
            <T en="Atlas can make mistakes. Verify important information.">
              Atlas puede cometer errores. Verifica la información importante.
            </T>
          </p>
        </div>
      </div>
      <ConversationSearch
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onBack={() => {
          // A diferencia de onClose, esto NO cierra la búsqueda -- solo
          // muestra el sidebar por encima. Si el usuario cierra el sidebar
          // (X/backdrop) sin elegir nada, vuelve a la búsqueda tal cual la
          // dejó (mismo comportamiento del botón de arriba a la izquierda
          // en Gemini). Elegir "Nuevo chat" o un chat del sidebar sí cierra
          // la búsqueda -- ver esos handlers más arriba.
          setSidebarOpen(true);
          setSidebarAboveSearch(true);
        }}
        items={searchItems}
        onSelect={(id) => {
          loadConversation(id);
          // Bug real reportado en vivo: abrir la búsqueda desde el botón
          // del sidebar deja `sidebarOpen` en true por debajo (la búsqueda
          // solo se monta encima, ver `onBack` arriba) -- sin cerrarlo acá,
          // al elegir una conversación la búsqueda se cierra y lo que
          // queda visible es el sidebar todavía abierto, no la
          // conversación elegida. Mismo criterio que el click de un chat
          // dentro del propio sidebar (ver más arriba): solo se fuerza en
          // mobile, en desktop el sidebar es inline y debe seguir visible.
          setSidebarAboveSearch(false);
          if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
            setSidebarOpen(false);
          }
        }}
      />
    </div>
  );
}
