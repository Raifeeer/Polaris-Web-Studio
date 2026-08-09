import { useEffect, useRef, useState } from "react";
import { Search, X, ArrowLeft, MessageSquare, Stars } from "lucide-react";
import { useLanguage, T } from "../context/LanguageContext";

export interface SearchableConversation {
  id: string;
  title: string;
  text: string; // título + contenido de mensajes, para embeber/buscar
  updatedAt: number;
}

// Panel de búsqueda de conversaciones, estilo Gemini: pantalla completa en
// mobile (con el teclado enfocado al instante), modal centrado en desktop.
// Combina dos capas: (1) filtro instantáneo por substring, sin esperar red,
// para feedback inmediato; (2) tras una pausa corta de tipeo, un reranking
// semántico real (embeddings de Gemini vía la Cloud Function
// `semantic-search` de Meridian, pública) que puede encontrar una
// conversación vieja aunque no comparta ninguna palabra literal con la
// búsqueda -- ej. preguntar "lo del carrito" encuentra una conversación
// que habla de "checkout" sin que "carrito" aparezca ahí.
const SEMANTIC_SEARCH_URL = "https://semantic-search-wdvfac6mgq-ue.a.run.app";
const DEBOUNCE_MS = 450;

function snippetAround(text: string, query: string): string {
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text.slice(0, 90);
  const start = Math.max(0, idx - 30);
  return `${start > 0 ? "…" : ""}${text.slice(start, start + 100)}…`;
}

export default function ConversationSearch({
  open,
  onClose,
  items,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  items: SearchableConversation[];
  onSelect: (id: string) => void;
}) {
  const { translate } = useLanguage();
  const [query, setQuery] = useState("");
  const [semanticIds, setSemanticIds] = useState<string[] | null>(null);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSemanticIds(null);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    abortRef.current?.abort();
    const q = query.trim();
    if (q.length < 3 || items.length === 0) {
      setSemanticIds(null);
      setSemanticLoading(false);
      return;
    }
    setSemanticLoading(true);
    debounceRef.current = setTimeout(async () => {
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const res = await fetch(SEMANTIC_SEARCH_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: q, candidates: items.map((c) => ({ id: c.id, text: `${c.title} ${c.text}` })) }),
          signal: controller.signal,
        });
        const data = await res.json();
        const ranked: { id: string; score: number }[] = data.ranked || [];
        setSemanticIds(ranked.filter((r) => r.score > 0.45).map((r) => r.id));
      } catch {
        setSemanticIds(null); // sin red o función caída -- se queda con el filtro por substring
      } finally {
        setSemanticLoading(false);
      }
    }, DEBOUNCE_MS);
  }, [query, items]);

  if (!open) return null;

  const q = query.trim().toLowerCase();
  const substringMatches = q ? items.filter((c) => c.title.toLowerCase().includes(q) || c.text.toLowerCase().includes(q)) : items;

  const results = semanticIds
    ? [...new Set([...semanticIds, ...substringMatches.map((c) => c.id)])]
        .map((id) => items.find((c) => c.id === id))
        .filter((c): c is SearchableConversation => Boolean(c))
    : substringMatches;

  return (
    <div className="fixed inset-0 z-[70] flex flex-col sm:items-center sm:justify-center sm:p-6 bg-black/50 backdrop-blur-sm">
      <div className="flex flex-col w-full h-full sm:h-auto sm:max-h-[80vh] sm:max-w-lg bg-[var(--color-surface-elevated)] sm:rounded-2xl sm:border sm:border-[var(--color-border-subtle)] sm:shadow-2xl overflow-hidden">
        <div className="shrink-0 flex items-center gap-2 p-3 border-b border-[var(--color-border-subtle)]">
          <button onClick={onClose} className="p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] transition-colors sm:hidden">
            <ArrowLeft size={18} />
          </button>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)] pointer-events-none" />
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={translate("Buscar en tus conversaciones…", "Search your conversations…")}
              className="w-full pl-9 pr-8 py-2.5 rounded-full bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] outline-none focus:border-[var(--color-primary-base)] transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors"
                aria-label={translate("Limpiar búsqueda", "Clear search")}
              >
                <X size={14} />
              </button>
            )}
          </div>
          <button onClick={onClose} className="hidden sm:block p-2 rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)] transition-colors">
            <X size={18} />
          </button>
        </div>

        {semanticLoading && (
          <div className="shrink-0 flex items-center gap-1.5 px-4 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-primary-base)] border-b border-[var(--color-border-subtle)]">
            <Stars size={12} className="animate-pulse" />
            <T en="Searching by meaning…">Buscando por significado…</T>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-2">
          {results.length === 0 && (
            <p className="text-xs text-[var(--color-text-tertiary)] text-center py-10">
              {query ? (
                <T en={`No results for "${query}".`}>{`Sin resultados para "${query}".`}</T>
              ) : (
                <T en="Your conversations will appear here.">Tus conversaciones aparecerán aquí.</T>
              )}
            </p>
          )}
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                onSelect(c.id);
                onClose();
              }}
              className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[var(--color-surface-highlight)] transition-colors text-left"
            >
              <MessageSquare size={14} className="mt-0.5 shrink-0 text-[var(--color-text-tertiary)]" />
              <div className="flex-1 min-w-0">
                <span className="block text-sm font-bold text-[var(--color-text-primary)] truncate">{c.title}</span>
                {q && <p className="text-[11px] text-[var(--color-text-tertiary)] truncate mt-0.5">{snippetAround(c.text, q)}</p>}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
