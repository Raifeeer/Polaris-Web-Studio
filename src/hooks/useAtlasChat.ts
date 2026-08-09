import { useState, useCallback, useRef, useEffect } from "react";

// Estado compartido del chat libre de Atlas (widget flotante + página
// completa /asistente) -- viven en el mismo localStorage para que abrir
// "/asistente" desde el widget continúe la misma conversación, y para que
// el historial tipo ChatGPT sobreviva a un refresh.

export type AiMessage = { role: "user" | "assistant"; content: string; suggestions?: string[] };
export type AiConversation = { id: string; title: string; messages: AiMessage[]; updatedAt: number };

const CONVERSATIONS_KEY = "atlas_conversations";
const ACTIVE_ID_KEY = "atlas_active_conversation_id";
const MAX_CONVERSATIONS = 30;

// Con tema de desarrollo web (Polaris es una agencia web), pero siguen siendo
// genéricas a propósito -- ninguna promete una acción puntual (ej. "calculando
// el precio") porque no sabemos qué pidió el cliente hasta que la IA responde.
// {es,en} en vez de string plano -- el componente que las muestra elige el
// idioma según el contexto actual, en vez de quedar fijas en español.
export type ThinkingMessage = { es: string; en: string };
const THINKING_MESSAGES: ThinkingMessage[] = [
  { es: "Compilando la respuesta…", en: "Compiling the answer…" },
  { es: "Renderizando ideas…", en: "Rendering ideas…" },
  { es: "Un commit más y listo…", en: "One more commit and done…" },
  { es: "Optimizando cada palabra…", en: "Optimizing every word…" },
  { es: "Desplegando la respuesta…", en: "Deploying the answer…" },
  { es: "Conectando los puntos…", en: "Connecting the dots…" },
  { es: "Puliendo los detalles…", en: "Polishing the details…" },
  { es: "Ya casi…", en: "Almost there…" },
  { es: "Cargando…", en: "Loading…" },
  { es: "Ejecutando el build…", en: "Running the build…" },
  { es: "Sincronizando ideas…", en: "Syncing ideas…" },
  { es: "Armando el layout…", en: "Assembling the layout…" },
  { es: "Empaquetando la respuesta…", en: "Bundling the answer…" },
  { es: "Instalando dependencias…", en: "Installing dependencies…" },
  { es: "Depurando la respuesta…", en: "Debugging the answer…" },
];

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function makeTitle(text: string): string {
  const clean = text.trim().replace(/\s+/g, " ");
  return clean.length > 48 ? `${clean.slice(0, 48)}…` : clean || "Nueva conversación";
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
  const [thinkingMsg, setThinkingMsg] = useState(THINKING_MESSAGES[0]);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_ID_KEY, activeId);
  }, [activeId]);

  const persist = useCallback((id: string, msgs: AiMessage[]) => {
    setConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === id);
      // Si ya hay un título guardado (derivado antes, o renombrado a mano
      // por el usuario), se conserva -- así un rename manual no se pisa en
      // el siguiente mensaje de la misma conversación.
      const firstUser = msgs.find((m) => m.role === "user");
      const title = existingIdx >= 0 ? prev[existingIdx].title : firstUser ? makeTitle(firstUser.content) : "Nueva conversación";
      const entry: AiConversation = { id, title, messages: msgs, updatedAt: Date.now() };
      const next = existingIdx >= 0 ? prev.map((c, i) => (i === existingIdx ? entry : c)) : [entry, ...prev];
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      const trimmed = next.slice(0, MAX_CONVERSATIONS);
      saveConversations(trimmed);
      return trimmed;
    });
  }, []);

  // Título inteligente vía IA (llamado liviano, sin tools) tras el primer
  // intercambio de una conversación nueva -- reemplaza el título derivado a
  // mano (que solo copiaba el primer mensaje) por un resumen corto real.
  // Mismo patrón que generateSmartTitle en Meridian/Assistant.tsx.
  const generateSmartTitle = useCallback(async (id: string, firstMessage: string) => {
    try {
      const res = await fetch("/api/quotebot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: firstMessage, titleOnly: true }),
      });
      const data = await res.json();
      const title: string | null = data?.title || null;
      if (!title) return;
      setConversations((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, title } : c));
        saveConversations(next);
        return next;
      });
    } catch {
      // Si falla, se queda con el título derivado del primer mensaje -- no crítico.
    }
  }, []);

  // Streaming real vía NDJSON (mismo patrón que meridian-assistant/Assistant.tsx):
  // el backend manda una línea JSON por delta de texto en vez de esperar la
  // respuesta completa. Si el modelo por defecto falla a mitad de camino, el
  // backend manda un evento "restart" y reintenta con DeepSeek -- el texto
  // parcial ya mostrado se descarta y se vuelve a empezar desde cero.
  const sendMessage = useCallback(
    async (text: string) => {
      const trimmed = text.trim();
      if (!trimmed || loading) return;
      setError(false);
      const isNewConversation = messages.length === 0;
      const history = messages.map(({ role, content }) => ({ role, content }));
      const withUser: AiMessage[] = [...messages, { role: "user", content: trimmed }];
      const assistantIdx = withUser.length;
      setMessages([...withUser, { role: "assistant", content: "" }]);
      setThinkingMsg(THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)]);
      setLoading(true);

      const controller = new AbortController();
      abortRef.current = controller;
      let raw = "";
      let gotAnyDelta = false;

      try {
        const res = await fetch("/api/quotebot-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: trimmed, history, stream: true }),
          signal: controller.signal,
        });
        if (!res.ok || !res.body) throw new Error("bad status");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            if (!line.trim()) continue;
            let evt: any;
            try {
              evt = JSON.parse(line);
            } catch {
              continue;
            }
            if (evt.type === "delta") {
              gotAnyDelta = true;
              raw += evt.text;
              setMessages((prev) => {
                const next = [...prev];
                next[assistantIdx] = { role: "assistant", content: raw };
                return next;
              });
            } else if (evt.type === "restart") {
              raw = "";
              gotAnyDelta = false;
              setMessages((prev) => {
                const next = [...prev];
                next[assistantIdx] = { role: "assistant", content: "" };
                return next;
              });
            } else if (evt.type === "error") {
              throw new Error(evt.message || "stream error");
            }
          }
        }
        if (!gotAnyDelta) throw new Error("empty reply");

        const { content, suggestions } = extractSuggestions(raw);
        const finalMsgs: AiMessage[] = [...withUser, { role: "assistant", content, suggestions }];
        setMessages(finalMsgs);
        persist(activeId, finalMsgs);
        if (isNewConversation) generateSmartTitle(activeId, trimmed);
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // Detenido a propósito por el usuario -- se conserva el texto
          // parcial ya mostrado como respuesta final, en vez de descartarlo.
          const { content, suggestions } = extractSuggestions(raw);
          const finalMsgs: AiMessage[] = gotAnyDelta
            ? [...withUser, { role: "assistant", content, suggestions }]
            : withUser;
          setMessages(finalMsgs);
          if (gotAnyDelta) {
            persist(activeId, finalMsgs);
            if (isNewConversation) generateSmartTitle(activeId, trimmed);
          }
        } else {
          setError(true);
          setMessages(withUser);
        }
      } finally {
        setLoading(false);
        abortRef.current = null;
      }
    },
    [messages, loading, activeId, persist, generateSmartTitle],
  );

  const stopGenerating = useCallback(() => {
    abortRef.current?.abort();
  }, []);

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

  const renameConversation = useCallback((id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setConversations((prev) => {
      const next = prev.map((c) => (c.id === id ? { ...c, title: clean.slice(0, 80) } : c));
      saveConversations(next);
      return next;
    });
  }, []);

  return {
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
  };
}
