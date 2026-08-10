import { useState, useCallback, useRef, useEffect } from "react";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebase";
import { detectLang } from "../lib/utils";

// Estado compartido del chat libre de Atlas (widget flotante + página
// completa /asistente) -- viven en el mismo localStorage para que abrir
// "/asistente" desde el widget continúe la misma conversación, y para que
// el historial tipo ChatGPT sobreviva a un refresh.

// `widget` es la "mini UI" real construida server-side (ver buildWidget en
// api/quotebot-chat.ts) a partir de datos de tools -- nunca texto libre del
// modelo -- que AtlasWidget.tsx renderiza debajo del mensaje.
export type AtlasWidgetData = { type: string; data: unknown };
// `lang` es el idioma detectado del mensaje del USUARIO que originó esta
// respuesta (ver detectLang en utils.ts) -- independiente del toggle ES/EN
// de la interfaz, así el indicador de "pensando" y las mini UIs de esa
// respuesta puntual quedan en el idioma real en el que escribió el usuario,
// aunque no haya tocado el selector manual.
export type AiMessage = { role: "user" | "assistant"; content: string; suggestions?: string[]; widget?: AtlasWidgetData; usedWebSearch?: boolean; lang?: "es" | "en" };
// `icon` es una clave de ICON_MAP (src/lib/conversationIcon.tsx), elegida por
// la IA junto con el título -- undefined hasta que ese llamado responde (o si
// falló), momento en el que el sidebar/búsqueda caen al ícono heurístico.
export type AiConversation = { id: string; title: string; icon?: string; messages: AiMessage[]; updatedAt: number };

const CONVERSATIONS_KEY = "atlas_conversations";
const ACTIVE_ID_KEY = "atlas_active_conversation_id";
const MAX_CONVERSATIONS = 30;

// Con tema de desarrollo web (Polaris es una agencia web), pero siguen siendo
// genéricas a propósito -- ninguna promete una acción puntual (ej. "calculando
// el precio") porque no sabemos qué pidió el cliente hasta que la IA responde.
// {es,en} en vez de string plano -- el componente que las muestra elige el
// idioma según el contexto actual, en vez de quedar fijas en español.
// Una palabra de cada frase va envuelta en `**...**` -- ThinkingText.tsx la
// resalta en negrita con el color de marca, el resto queda con el efecto de
// reflejo (shimmer) que barre el texto en loop.
export type ThinkingMessage = { es: string; en: string };
const THINKING_MESSAGES: ThinkingMessage[] = [
  { es: "Compilando la **respuesta**…", en: "Compiling the **answer**…" },
  { es: "Renderizando **ideas**…", en: "Rendering **ideas**…" },
  { es: "Un **commit** más y listo…", en: "One more **commit** and done…" },
  { es: "Optimizando cada **palabra**…", en: "Optimizing every **word**…" },
  { es: "Desplegando la **respuesta**…", en: "Deploying the **answer**…" },
  { es: "Conectando los **puntos**…", en: "Connecting the **dots**…" },
  { es: "Puliendo los **detalles**…", en: "Polishing the **details**…" },
  { es: "**Ya** casi…", en: "**Almost** there…" },
  { es: "**Cargando**…", en: "**Loading**…" },
  { es: "Ejecutando el **build**…", en: "Running the **build**…" },
  { es: "Sincronizando **ideas**…", en: "Syncing **ideas**…" },
  { es: "Armando el **layout**…", en: "Assembling the **layout**…" },
  { es: "Empaquetando la **respuesta**…", en: "Bundling the **answer**…" },
  { es: "Instalando **dependencias**…", en: "Installing **dependencies**…" },
  { es: "Depurando la **respuesta**…", en: "Debugging the **answer**…" },
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
  const trimmed = list.slice(0, MAX_CONVERSATIONS);
  try {
    localStorage.setItem(CONVERSATIONS_KEY, JSON.stringify(trimmed));
  } catch {
    // localStorage lleno o deshabilitado -- el chat sigue funcionando en memoria, solo no persiste local.
  }
  pushToCloud(trimmed);
}

// Respaldo en la nube -- localStorage sigue siendo la fuente rápida de
// siempre (lee/escribe sin red), Firestore es solo un espejo de respaldo
// contra el caso real de perder el historial (Safari borra localStorage de
// sitios inactivos tras ~7 días, "borrar datos de navegación", etc.).
// `visitorId` es anónimo (sin login, mismo criterio que `quoteSessions`/
// `cookie_consents` en firestore.rules) -- vive en localStorage junto al
// resto del estado, así que si se borra localStorage completo también se
// pierde el identificador de recuperación; lo que sí sobrevive es un
// vaciado *parcial* (p. ej. el navegador expirando solo esta clave) y le da
// a Cristian visibilidad real de las conversaciones desde el backend.
const VISITOR_ID_KEY = "atlas_visitor_id";
function getVisitorId(): string {
  if (typeof window === "undefined") return newId();
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = newId();
    try {
      localStorage.setItem(VISITOR_ID_KEY, id);
    } catch {
      // sin localStorage -- sigue funcionando, solo no persiste entre sesiones
    }
  }
  return id;
}

let pushDebounce: ReturnType<typeof setTimeout> | null = null;
function pushToCloud(list: AiConversation[]) {
  if (typeof window === "undefined") return;
  if (pushDebounce) clearTimeout(pushDebounce);
  pushDebounce = setTimeout(() => {
    setDoc(doc(db, "atlas_conversations", getVisitorId()), {
      conversations: list,
      updatedAt: serverTimestamp(),
    }).catch(() => {
      // Best-effort -- si falla (sin red, reglas, etc.) el chat sigue
      // funcionando normal desde localStorage, no hay nada que reintentar
      // acá que valga la pena bloquear la UI por eso.
    });
  }, 1200);
}

async function pullFromCloud(): Promise<AiConversation[] | null> {
  try {
    const snap = await getDoc(doc(db, "atlas_conversations", getVisitorId()));
    const data = snap.data();
    return Array.isArray(data?.conversations) ? (data!.conversations as AiConversation[]) : null;
  } catch {
    return null;
  }
}

// Combina lo que ya había en localStorage con lo que devolvió Firestore --
// por id, se queda con la versión más reciente (`updatedAt` mayor) de cada
// conversación. Cubre el caso real de abrir el chat en un dispositivo nuevo
// (local vacío, cloud con historial) sin pisar una conversación local más
// nueva que todavía no llegó a sincronizarse.
function mergeConversations(local: AiConversation[], cloud: AiConversation[]): AiConversation[] {
  const byId = new Map<string, AiConversation>();
  for (const c of local) byId.set(c.id, c);
  for (const c of cloud) {
    const existing = byId.get(c.id);
    if (!existing || c.updatedAt > existing.updatedAt) byId.set(c.id, c);
  }
  return [...byId.values()].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
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

// Igual que extractSuggestions().content, pero además recorta un prefijo
// PARCIAL del marcador si el texto todavía se está tipeando (streaming) --
// sin esto, mientras el modelo escribe "---SUGERENCIAS---" letra por letra
// se alcanza a ver "-", "--", "---S", "---SU"... colgando al final de la
// burbuja por una fracción de segundo antes de que el marcador quede
// completo y extractSuggestions lo reconozca. Usado solo para lo que se
// muestra en pantalla mientras llega el stream, nunca para el contenido
// final guardado (ese sigue pasando por extractSuggestions normal).
function stripStreamingSuggestionsMarker(raw: string): string {
  const { content, suggestions } = extractSuggestions(raw);
  if (suggestions.length > 0 || content !== raw.trim()) return content;
  const marker = "---SUGERENCIAS---";
  for (let len = Math.min(marker.length - 1, raw.length); len > 0; len--) {
    if (raw.endsWith(marker.slice(0, len))) return raw.slice(0, raw.length - len).trimEnd();
  }
  return raw;
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
  // Idioma detectado del último mensaje del usuario enviado (ver detectLang)
  // -- lo usa el indicador de "pensando" mientras se espera esa respuesta,
  // ver comentario junto a AiMessage.lang para el resto del criterio.
  const [lastMsgLang, setLastMsgLang] = useState<"es" | "en">("es");
  const abortRef = useRef<AbortController | null>(null);

  // Chat temporal (estilo Gemini/ChatGPT/Grok): mientras está activo, ningún
  // mensaje se guarda en localStorage/Firestore ni genera título/ícono por
  // IA -- ver los guards `!isTemporaryRef.current` dentro de sendMessage. Se
  // usa un ref además del state porque sendMessage es un useCallback que no
  // depende de `isTemporary` (evita recrear el callback en cada toggle);
  // el ref siempre refleja el valor más reciente sin ese costo.
  const [isTemporary, setIsTemporary] = useState(false);
  const isTemporaryRef = useRef(false);
  useEffect(() => {
    isTemporaryRef.current = isTemporary;
  }, [isTemporary]);

  // Mientras se espera la respuesta, la frase va rotando sola cada 1.5s (en
  // vez de quedar fija en una sola durante todo el request) -- refuerza la
  // sensación de progreso real, mismo criterio que el shimmer visual.
  useEffect(() => {
    if (!loading) return;
    const interval = setInterval(() => {
      setThinkingMsg(THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)]);
    }, 1500);
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_ID_KEY, activeId);
  }, [activeId]);

  // Reconciliación con el respaldo en la nube, una sola vez al montar --
  // solo actualiza la lista de conversaciones (sidebar/búsqueda), nunca
  // toca `messages`/`activeId` de la conversación que ya está abierta, para
  // no pisar un chat en curso mientras llega la respuesta de Firestore.
  useEffect(() => {
    let cancelled = false;
    pullFromCloud().then((cloud) => {
      if (cancelled || !cloud || cloud.length === 0) return;
      const merged = mergeConversations(loadConversations(), cloud);
      setConversations(merged);
      saveConversations(merged);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const persist = useCallback((id: string, msgs: AiMessage[]) => {
    setConversations((prev) => {
      const existingIdx = prev.findIndex((c) => c.id === id);
      // Si ya hay un título guardado (derivado antes, o renombrado a mano
      // por el usuario), se conserva -- así un rename manual no se pisa en
      // el siguiente mensaje de la misma conversación. Una conversación
      // NUEVA arranca siempre con el placeholder genérico, nunca con el
      // primer mensaje truncado (makeTitle) -- mostrarlo de entrada y
      // reemplazarlo segundos después por el título real de la IA se veía
      // como que el título "cambiaba dos veces" (bug real reportado por el
      // usuario). Con un único placeholder fijo, solo hay UNA transición
      // real: placeholder -> título de la IA. `makeTitle` queda como
      // respaldo dentro de generateSmartTitle si ese llamado falla.
      const title = existingIdx >= 0 ? prev[existingIdx].title : "Nueva conversación";
      // El ícono (si ya se resolvió por IA) se conserva igual que el título --
      // persist() se llama en cada mensaje, no solo en el primero.
      const icon = existingIdx >= 0 ? prev[existingIdx].icon : undefined;
      const entry: AiConversation = { id, title, icon, messages: msgs, updatedAt: Date.now() };
      const next = existingIdx >= 0 ? prev.map((c, i) => (i === existingIdx ? entry : c)) : [entry, ...prev];
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      const trimmed = next.slice(0, MAX_CONVERSATIONS);
      saveConversations(trimmed);
      return trimmed;
    });
  }, []);

  // Título inteligente + ícono por tema vía IA (llamado liviano, sin tools)
  // tras el primer intercambio de una conversación nueva -- reemplaza el
  // título derivado a mano (que solo copiaba el primer mensaje) por un
  // resumen corto real, y elige un ícono real de un pool grande (ver
  // ICON_MAP en conversationIcon.tsx) en vez de un match de palabras clave
  // siempre determinista -- mismo patrón que generateSmartTitle en
  // Meridian/Assistant.tsx, con el ícono agregado.
  const generateSmartTitle = useCallback(async (id: string, firstMessage: string) => {
    try {
      const res = await fetch("/api/quotebot-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: firstMessage, titleOnly: true }),
      });
      const data = await res.json();
      const title: string = data?.title || makeTitle(firstMessage);
      const icon: string | null = data?.icon || null;
      setConversations((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, title, ...(icon ? { icon } : {}) } : c));
        saveConversations(next);
        return next;
      });
    } catch {
      // Si falla la llamada por completo (sin red, etc.), igual se reemplaza
      // el placeholder por el título derivado del primer mensaje -- nunca se
      // queda pegado en "Nueva conversación".
      setConversations((prev) => {
        const next = prev.map((c) => (c.id === id ? { ...c, title: makeTitle(firstMessage) } : c));
        saveConversations(next);
        return next;
      });
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
      const msgLang = detectLang(trimmed);
      setLastMsgLang(msgLang);
      const withUser: AiMessage[] = [...messages, { role: "user", content: trimmed }];
      const assistantIdx = withUser.length;
      setMessages([...withUser, { role: "assistant", content: "" }]);
      setThinkingMsg(THINKING_MESSAGES[Math.floor(Math.random() * THINKING_MESSAGES.length)]);
      setLoading(true);

      // Guarda el mensaje del usuario de inmediato, ANTES de esperar la
      // respuesta -- si el navegador se cierra a mitad de la generación, esto
      // sobrevive igual (localStorage + Firestore en cola). La respuesta del
      // asistente en sí queda cubierta aparte por el respaldo server-side
      // (ver api/_atlasBackup.ts) que corre del lado del backend apenas
      // termina de generarse, sin depender de que el cliente siga conectado.
      if (!isTemporaryRef.current) persist(activeId, withUser);

      const controller = new AbortController();
      abortRef.current = controller;
      let raw = "";
      let gotAnyDelta = false;
      let widget: AtlasWidgetData | undefined;
      let usedWebSearch = false;

      try {
        const res = await fetch("/api/quotebot-chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: trimmed,
            history,
            stream: true,
            visitorId: isTemporaryRef.current ? undefined : getVisitorId(),
            conversationId: isTemporaryRef.current ? undefined : activeId,
            isTemporary: isTemporaryRef.current,
          }),
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
              // Nunca mostrar el bloque ---SUGERENCIAS--- crudo mientras se
              // tipea -- bug real reportado en vivo: el marcador y la lista
              // en formato "- texto" se veían un instante en la burbuja
              // antes de que extractSuggestions() los recortara al terminar
              // el stream. Se corta el texto mostrado en cuanto el marcador
              // empieza a aparecer, igual que ya hace extractSuggestions()
              // con el texto final.
              const displayed = stripStreamingSuggestionsMarker(raw);
              setMessages((prev) => {
                const next = [...prev];
                next[assistantIdx] = { role: "assistant", content: displayed };
                return next;
              });
            } else if (evt.type === "restart") {
              raw = "";
              gotAnyDelta = false;
              widget = undefined;
              usedWebSearch = false;
              setMessages((prev) => {
                const next = [...prev];
                next[assistantIdx] = { role: "assistant", content: "" };
                return next;
              });
            } else if (evt.type === "widget") {
              widget = evt.widget;
            } else if (evt.type === "web_search") {
              usedWebSearch = true;
            } else if (evt.type === "error") {
              throw new Error(evt.message || "stream error");
            }
          }
        }
        if (!gotAnyDelta) throw new Error("empty reply");

        const { content, suggestions } = extractSuggestions(raw);
        const finalMsgs: AiMessage[] = [...withUser, { role: "assistant", content, suggestions, widget, usedWebSearch, lang: msgLang }];
        setMessages(finalMsgs);
        if (!isTemporaryRef.current) {
          persist(activeId, finalMsgs);
          if (isNewConversation) generateSmartTitle(activeId, trimmed);
        }
      } catch (err: any) {
        if (err?.name === "AbortError") {
          // Detenido a propósito por el usuario -- se conserva el texto
          // parcial ya mostrado como respuesta final, en vez de descartarlo.
          const { content, suggestions } = extractSuggestions(raw);
          const finalMsgs: AiMessage[] = gotAnyDelta
            ? [...withUser, { role: "assistant", content, suggestions, widget, usedWebSearch, lang: msgLang }]
            : withUser;
          setMessages(finalMsgs);
          if (gotAnyDelta && !isTemporaryRef.current) {
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
    setIsTemporary(false);
  }, []);

  // Alterna el chat temporal -- siempre arranca una conversación en blanco
  // al entrar o salir (mismo criterio que Gemini/ChatGPT/Grok: cambiar de
  // modo a mitad de una conversación normal no tendría sentido, ya se
  // guardó lo que se guardó hasta ahí).
  const toggleTemporary = useCallback(() => {
    setIsTemporary((prev) => !prev);
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
      setIsTemporary(false);
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
    lastMsgLang,
    error,
    activeId,
    conversations,
    isTemporary,
    toggleTemporary,
    sendMessage,
    stopGenerating,
    newChat,
    loadConversation,
    deleteConversation,
    renameConversation,
  };
}
