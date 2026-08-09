import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowLeft,
  Send,
  Square,
  SquarePen,
  Trash2,
  Copy,
  Check,
  PanelLeftClose,
  PanelLeftOpen,
  MessageSquare,
  MoreVertical,
  Pencil,
  Share2,
  Search,
} from "lucide-react";
import { useLanguage, T } from "../context/LanguageContext";
import { useAtlasChat, type AiMessage } from "../hooks/useAtlasChat";
import AtlasMarkdown from "../components/AtlasMarkdown";
import AtlasMark from "../components/AtlasMark";
import ConversationSearch from "../components/ConversationSearch";

const SUGGESTIONS = [
  { es: "¿Cuáles son los planes y precios?", en: "What are the plans and prices?" },
  { es: "¿Qué incluye el paquete Constelación?", en: "What's included in the Constelación package?" },
  { es: "¿Cuánto tarda un proyecto tipo e-commerce?", en: "How long does an e-commerce project take?" },
  { es: "¿Qué tecnologías usan?", en: "What tech stack do you use?" },
];

function TypingDots() {
  return (
    <div className="flex items-center gap-1.5 h-[20px]">
      {[0, 0.2, 0.4].map((delay) => (
        <motion.div
          key={delay}
          animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1, 0.8] }}
          transition={{ duration: 1.2, repeat: Infinity, delay }}
          className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)]"
        />
      ))}
    </div>
  );
}

function MessageBubble({ message, onSuggestionClick }: { message: AiMessage; onSuggestionClick: (q: string) => void }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

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
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
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
            <AtlasMarkdown content={message.content} />
          </div>

          {message.content && (
            <button
              onClick={handleCopy}
              // Siempre visible en mobile (no hay hover real); en desktop se
              // revela solo al pasar el mouse sobre el mensaje, como antes.
              className="mt-1.5 opacity-100 md:opacity-0 md:group-hover:opacity-100 focus:opacity-100 transition-opacity flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
            >
              {copied ? <Check size={12} /> : <Copy size={12} />}
              {copied ? <T en="Copied">Copiado</T> : <T en="Copy">Copiar</T>}
            </button>
          )}

          {message.suggestions && message.suggestions.length > 0 && (
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

export default function AtlasChat() {
  const { translate, language, setLanguage } = useLanguage();
  useEffect(() => {
    document.title = translate(
      "Asistente IA -- Atlas Assistant | Polaris Web Studio",
      "AI Assistant -- Atlas Assistant | Polaris Web Studio",
    );
  }, [translate]);

  const {
    messages,
    loading,
    thinkingMsg,
    error,
    activeId,
    conversations,
    sendMessage,
    stopGenerating,
    newChat,
    loadConversation,
    deleteConversation,
    renameConversation,
  } = useAtlasChat();
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(() => typeof window !== "undefined" && window.innerWidth >= 1024);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [shareFeedbackId, setShareFeedbackId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const endRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = conversations.find((c) => c.id === activeId);
  const activeTitle = messages.length === 0 ? translate("Nuevo chat", "New chat") : activeConversation?.title || translate("Nuevo chat", "New chat");
  const searchItems = conversations.map((c) => ({
    id: c.id,
    title: c.title,
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

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

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
            onClick={() => setSidebarOpen(false)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/50 md:hidden"
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
            className="fixed inset-y-0 left-0 z-50 w-full md:static md:z-auto md:w-[280px] shrink-0 border-r border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col overflow-hidden"
          >
            <div className="p-3 flex items-center gap-2">
              <button
                onClick={() => setSidebarOpen(false)}
                className="p-2 rounded-lg hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] transition-colors shrink-0 md:hidden"
                aria-label={translate("Cerrar menú", "Close menu")}
              >
                <PanelLeftClose size={18} />
              </button>
              <Link
                to="/"
                className="p-2 rounded-lg hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] transition-colors shrink-0"
                aria-label={translate("Volver al sitio", "Back to site")}
              >
                <ArrowLeft size={18} />
              </Link>
              <div className="flex-1" />
              {/* Esta página no tiene el Navbar del sitio (donde vive el switcher
                  ES/EN normal) -- sin esto, alguien con el navegador en inglés y
                  sin preferencia guardada queda atascado en inglés acá. */}
              <button
                onClick={() => setLanguage(language === "es" ? "en" : "es")}
                className="px-2.5 py-2 rounded-lg hover:bg-[var(--color-surface-highlight)] text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] transition-colors shrink-0"
                aria-label={translate("Cambiar idioma", "Change language")}
                title={translate("Cambiar idioma", "Change language")}
              >
                {language === "es" ? "EN" : "ES"}
              </button>
            </div>

            <div className="px-3 pb-3 flex items-center gap-2">
              <button
                onClick={newChat}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] text-xs font-black uppercase tracking-wider transition-colors"
              >
                <SquarePen size={14} />
                <T en="New chat">Nuevo chat</T>
              </button>
              {conversations.length > 0 && (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label={translate("Buscar conversaciones", "Search conversations")}
                  className="p-2 rounded-lg border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] transition-colors shrink-0"
                >
                  <Search size={14} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-1">
              {conversations.length === 0 && (
                <p className="text-sm text-[var(--color-text-tertiary)] px-3 py-4 text-center">
                  <T en="Your conversations will appear here.">Tus conversaciones aparecerán aquí.</T>
                </p>
              )}
              {conversations.map((c) => (
                <div
                  key={c.id}
                  className={`group relative flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                    c.id === activeId
                      ? "bg-[var(--color-primary-muted)] text-[var(--color-primary-base)]"
                      : "hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)]"
                  }`}
                  onClick={() => {
                    if (renamingId === c.id) return;
                    loadConversation(c.id);
                    // En mobile el sidebar es un overlay a pantalla completa --
                    // se cierra al elegir un chat. En desktop (md+) queda inline
                    // y no debe desaparecer, así que solo se cierra bajo el
                    // breakpoint real, no incondicionalmente.
                    if (typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches) {
                      setSidebarOpen(false);
                    }
                  }}
                >
                  <MessageSquare size={16} className="shrink-0 opacity-60" />
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
                      className="flex-1 min-w-0 text-sm font-semibold bg-transparent outline-none border-b border-[var(--color-primary-base)]"
                    />
                  ) : (
                    <span className="flex-1 min-w-0 text-sm font-semibold truncate">
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
                      <MoreVertical size={14} />
                    </button>
                  )}
                  {openMenuId === c.id && (
                    <div
                      ref={menuRef}
                      onClick={(e) => e.stopPropagation()}
                      className="absolute right-2 top-9 z-20 w-40 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg overflow-hidden text-[var(--color-text-primary)]"
                    >
                      <button
                        onClick={() => {
                          setRenamingId(c.id);
                          setRenameValue(c.title);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-[var(--color-surface-highlight)] transition-colors text-left"
                      >
                        <Pencil size={14} />
                        <T en="Rename">Renombrar</T>
                      </button>
                      <button
                        onClick={() => {
                          shareConversation(c.title, c.messages, c.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold hover:bg-[var(--color-surface-highlight)] transition-colors text-left"
                      >
                        <Share2 size={14} />
                        <T en="Share">Compartir</T>
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(c.id);
                          setOpenMenuId(null);
                        }}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10 transition-colors text-left"
                      >
                        <Trash2 size={14} />
                        <T en="Delete">Eliminar</T>
                      </button>
                    </div>
                  )}
                </div>
              ))}
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
              <h3 className="text-sm font-black text-[var(--color-text-primary)] mb-1.5">
                <T en="Delete this conversation?">¿Eliminar esta conversación?</T>
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mb-4">
                <T en="This can't be undone.">Esta acción no se puede deshacer.</T>
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setConfirmDeleteId(null)}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] transition-colors"
                >
                  <T en="Cancel">Cancelar</T>
                </button>
                <button
                  onClick={() => {
                    deleteConversation(confirmDeleteId);
                    setConfirmDeleteId(null);
                  }}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  <T en="Delete">Eliminar</T>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Panel principal */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="shrink-0 flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/80 backdrop-blur-md">
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] transition-colors"
            aria-label={translate("Mostrar/ocultar historial", "Toggle history")}
          >
            {sidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <AtlasMark variant="isotipo" className="w-6 h-6 shrink-0" />
          <p className="flex-1 min-w-0 truncate text-xs font-black uppercase tracking-widest text-[var(--color-text-primary)]">{activeTitle}</p>
          <button
            onClick={newChat}
            className="p-2 rounded-lg hover:bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] transition-colors shrink-0"
            aria-label={translate("Nuevo chat", "New chat")}
            title={translate("Nuevo chat", "New chat")}
          >
            <SquarePen size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center px-6 text-center">
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-lg w-full">
                <div className="flex flex-col items-center gap-2 mb-6">
                  <AtlasMark variant="isotipo" className="w-32 h-32" />
                  <AtlasMark variant="wordmark" label="Atlas Assistant" className="h-9 w-auto -mt-2" />
                </div>
                <p className="text-sm text-[var(--color-text-secondary)] mb-8">
                  <T en="Ask me about plans, timelines, or anything about your next project.">
                    Pregúntame sobre planes, plazos o lo que necesites de tu próximo proyecto.
                  </T>
                </p>
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.es}
                      onClick={() => handleSend(translate(s.es, s.en))}
                      className="text-left text-xs font-bold px-4 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-primary-muted)] hover:text-[var(--color-primary-base)] text-[var(--color-text-secondary)] transition-colors"
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
                return <MessageBubble key={i} message={m} onSuggestionClick={handleSend} />;
              })}

              {loading && !messages[messages.length - 1]?.content && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex justify-start">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex items-center justify-center shrink-0">
                      <AtlasMark variant="isotipo" className="w-6 h-6" />
                    </div>
                    <div className="px-4 py-3 rounded-2xl rounded-tl-md bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] flex items-center gap-2">
                      <TypingDots />
                      <span className="text-xs text-[var(--color-text-tertiary)]">{thinkingMsg}</span>
                    </div>
                  </div>
                </motion.div>
              )}

              {error && (
                <p className="text-xs text-red-500 text-center">
                  <T en="Something went wrong. Try again or write to us on WhatsApp.">
                    Algo falló. Intenta de nuevo o escríbenos por WhatsApp.
                  </T>
                </p>
              )}
              <div ref={endRef} />
            </div>
          )}
        </div>

        <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
          <div className="max-w-3xl mx-auto flex items-end gap-2 p-2 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-highlight)] focus-within:border-[var(--color-primary-base)] transition-colors">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              maxLength={2000}
              placeholder={translate("Escríbeme lo que quieras...", "Ask me anything...")}
              className="flex-1 resize-none bg-transparent outline-none text-sm px-2 py-2 max-h-32 placeholder:text-[var(--color-text-tertiary)]"
            />
            {loading ? (
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
            )}
          </div>
          <p className="text-center text-[10px] text-[var(--color-text-tertiary)] mt-1">
            <T en="Atlas can make mistakes. Verify important information.">
              Atlas puede cometer errores. Verifica la información importante.
            </T>
          </p>
        </div>
      </div>
      <ConversationSearch open={searchOpen} onClose={() => setSearchOpen(false)} items={searchItems} onSelect={loadConversation} />
    </div>
  );
}
