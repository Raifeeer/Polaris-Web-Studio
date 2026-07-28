import { useState, useCallback, useEffect } from "react";

// Estado compartido del chat libre de Atlas (widget flotante + página
// completa /asistente) -- viven en el mismo localStorage para que abrir
// "/asistente" desde el widget continúe la misma conversación, y para que
// el historial tipo ChatGPT sobreviva a un refresh.

export type AiMessage = { role: "user" | "assistant"; content: string; suggestions?: string[] };
export type AiConversation = { id: string; title: string; messages: AiMessage[]; updatedAt: number };

const CONVERSATIONS_KEY = "atlas_conversations";
const ACTIVE_ID_KEY = "atlas_active_conversation_id";
const MAX_CONVERSATIONS = 30;

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean;
}

function loadConversations(): AiConversation[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(CONVERSATIONS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveConversations(list: AiConversation[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(list.slice(0, MAX_CONVERSATIONS)));
  } catch {
    // localStorage lleno o deshabilitado -- el chat sigue funcionando en memoria, solo no persiste.
  }
}

// Extrae el bloque ---SUGERENCIAS--- del texto del modelo (mismo contrato
// que se le exige en el system prompt) y lo separa del cuerpo real de la
// respuesta, para poder renderizarlo como chips clickeables aparte.
export function extractSuggestions(raw: string): { content: string; suggestions: string[] } {
  const marker = "---SUGERENCIAS---";
  const idx = raw.indexOf(marker);
  if (idx === -1) return { content: raw.trim(), suggestions: [] };
  const content = raw.slice(0, idx).trim();
  const block = raw.slice(idx + marker.length);
  const suggestions = Array.from(block.matchAll(/^[-*]\s*(.+)$/gm))
    .map((m) =>
      m[1]
        .trim()
        .replace(/^\[(.+)\]$/, "$1")
        .replace(/\*\*(.+?)\*\*/g, "$1") // las sugerencias se muestran en chips de texto plano, sin render de Markdown
        .trim(),
    )
    .filter(Boolean)
    .slice(0, 2);
  return { content: content || raw.trim(), suggestions };
}

export function useAtlasChat() {
  const [activeId, setActiveId] = useState<string>(() => {
    if (typeof window === "undefined") return newId();
    return localStorage.getItem(ACTIVE_ID_KEY) || newId();
  });
  const [conversations, setConversations] = useState<AiConversation[]>(() => loadConversations());
  const [messages, setMessages] = useState<AiMessage[]>(() => {
    const found = loadConversations().find((c) => c.id === activeId);
    return found ? found.messages : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_ID_KEY, activeId);
  }, [activeId]);

  const persist = useCallback((id: string, msgs: AiMessage[]) => {
    setConversations((prev) => {
      const firstUser = msgs.find((m) => m.role === "user");
      const title = firstUser ? makeTitle(firstUser.content) : "Nueva conversación";
      const entry: AiConversation = { id, title, messages: msgs, updatedAt: Date.now() };
      const existingIdx = prev.findIndex((c) => c.id === id);
      const next = existingIdx >= 0 ? prev.map((c, i) => (i === existingIdx ? entry : c)) : [entry, ...prev];
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      const trimmed = next.slice(0, MAX_CONVERSATIONS);
      saveConversations(trimmed);
      return trimmed;
    });
  }, []);

  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(false);
      const history = messages.map(({ role, content }) => ({ role, content }));
      const next: AiMessage[] = [...messages, { role: "user", content: trimmed }];
      setMessages(next);
      setLoading(true);
      try {
        const res = await fetch("/api/quotebot-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history }),
        });
        if (!res.ok) throw new Error("bad status");
        const data = await res.json();
        if (!data.reply) throw new Error("empty reply");
        const { content, suggestions } = extractSuggestions(data.reply as string);
        const finalMsgs: AiMessage[] = [...next, { role: "assistant", content, suggestions }];
        setMessages(finalMsgs);
        persist(activeId, finalMsgs);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    },
    [messages, loading, activeId, persist],
  );

  const newChat = useCallback(() => {
    setMessages([]);
    setError(false);
    setActiveId(newId());
  }, []);

  const loadConversation = useCallback(
    (id: string) => {
      const found = conversations.find((c) => c.id === id);
      if (!found) return;
      setActiveId(id);
      setMessages(found.messages);
      setError(false);
    },
    [conversations],
  );

  const deleteConversation = useCallback(
    (id: string) => {
      setConversations((prev) => {
        const next = prev.filter((c) => c.id !== id);
        saveConversations(next);
        return next;
      });
      if (id === activeId) {
        setMessages([]);
        setActiveId(newId());
      }
    },
    [activeId],
  );

  return { messages, loading, error, activeId, conversations, sendMessage, newChat, loadConversation, deleteConversation };
}
