import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Respaldo server-side de Atlas Assistant -- endurece el caso real de que el
// usuario mande un mensaje y cierre el navegador/pestaña antes de que la
// respuesta termine de generarse: si eso pasa, el cliente nunca llega a
// llamar persist() (ver useAtlasChat.ts), así que ni el mensaje del usuario
// ni la respuesta del modelo quedan guardados en ningún lado -- el
// pushToCloud existente es 100% dependiente de que el navegador siga vivo.
// Este módulo hace exactamente el mismo trabajo pero DESDE EL SERVIDOR, justo
// después de terminar de generar la respuesta completa -- así sobrevive
// aunque el cliente ya se haya ido, sin depender de que vuelva a conectarse.
// Mismas credenciales/base ("polaris-web-studio") que ya usa server-db.ts.
const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });
const firestore = getFirestore(firebaseApp, "polaris-web-studio");

const MAX_CONVERSATIONS = 30;

interface BackupMessage {
  role: "user" | "assistant";
  content: string;
  suggestions?: string[];
  widget?: unknown;
  usedWebSearch?: boolean;
}

interface BackupConversation {
  id: string;
  title: string;
  icon?: string;
  messages: BackupMessage[];
  updatedAt: number;
}

// Mismo contrato que extractSuggestions() en useAtlasChat.ts -- duplicado a
// propósito (el hook es código de cliente, este módulo corre server-side),
// mismo patrón de duplicación ya aceptado en esta cuenta.
function extractSuggestions(raw: string): { content: string; suggestions: string[] } {
  const marker = "---SUGERENCIAS---";
  const idx = raw.indexOf(marker);
  if (idx === -1) return { content: raw.trim(), suggestions: [] };
  const content = raw.slice(0, idx).trim();
  const block = raw.slice(idx + marker.length);
  const suggestions = Array.from(block.matchAll(/^[-*]\s*(.+)$/gm))
    .map((m) => m[1].trim().replace(/^\[(.+)\]$/, "$1").replace(/\*\*(.+?)\*\*/g, "$1").trim())
    .filter(Boolean)
    .slice(0, 2);
  return { content: content || raw.trim(), suggestions };
}

// Async y pensado para hacerle `await` antes de terminar la respuesta HTTP
// (ver quotebot-chat.ts) -- así la función de Vercel se mantiene viva hasta
// que la escritura a Firestore termina de verdad, en vez de confiar en que
// un fire-and-forget alcance a resolver antes de que la plataforma corte el
// proceso. Igual nunca lanza -- si falla (sin red, reglas, base caída), el
// respaldo se pierde para ESTE mensaje puntual, pero nunca debe tumbar la
// respuesta real al usuario por eso.
export async function backupConversation(
  visitorId: string | undefined,
  conversationId: string | undefined,
  history: { role: "user" | "assistant"; content: string }[],
  userMessage: string,
  rawAssistantText: string,
  widget: unknown,
  usedWebSearch: boolean
): Promise<void> {
  if (!visitorId || !conversationId) return;
  if (typeof visitorId !== "string" || typeof conversationId !== "string") return;

  const { content, suggestions } = extractSuggestions(rawAssistantText);
  const messages: BackupMessage[] = [
    ...history,
    { role: "user", content: userMessage },
    { role: "assistant", content, suggestions, widget: widget || undefined, usedWebSearch },
  ];

  const docRef = firestore.collection("atlas_conversations").doc(visitorId);

  try {
    await firestore.runTransaction(async (tx) => {
      const snap = await tx.get(docRef);
      const data = snap.data();
      const existing: BackupConversation[] = Array.isArray(data?.conversations) ? data!.conversations : [];
      const idx = existing.findIndex((c) => c.id === conversationId);
      const title = idx >= 0 ? existing[idx].title : "Nueva conversación";
      const icon = idx >= 0 ? existing[idx].icon : undefined;
      const entry: BackupConversation = { id: conversationId, title, icon, messages, updatedAt: Date.now() };
      const next = idx >= 0 ? existing.map((c, i) => (i === idx ? entry : c)) : [entry, ...existing];
      next.sort((a, b) => b.updatedAt - a.updatedAt);
      tx.set(docRef, { conversations: next.slice(0, MAX_CONVERSATIONS), updatedAt: Date.now() });
    });
  } catch (err) {
    console.warn("atlas backup falló (best-effort, no bloquea el chat):", (err as Error)?.message);
  }
}
