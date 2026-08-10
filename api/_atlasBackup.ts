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
//
// Reescrito a Firestore REST API + Web Crypto (10 de agosto) -- el SDK
// `firebase-admin` es Node-only (usa APIs nativas que no existen en Edge
// Runtime), y quotebot-chat.ts migró a Edge (ver Fase 59 de
// Meridian/CLAUDE.md) para que el streaming en vivo funcione de verdad en
// Vercel. `crypto.subtle` (Web Crypto, disponible en Edge y Node) alcanza
// para firmar el JWT del flujo OAuth2 de cuenta de servicio a mano, sin
// depender de `firebase-admin`/`google-auth-library`.

const FIRESTORE_PROJECT = process.env.FIREBASE_PROJECT_ID;
const FIRESTORE_DATABASE = "polaris-web-studio";
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

function base64UrlEncode(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let str = "";
  for (const b of arr) str += String.fromCharCode(b);
  return btoa(str).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const clean = pem
    .replace(/^["']|["']$/g, "")
    .replace(/\\n/g, "\n")
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const raw = atob(clean);
  const buf = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) buf[i] = raw.charCodeAt(i);
  return buf.buffer;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

// Firma el JWT de cuenta de servicio con Web Crypto (RS256) y lo canjea por
// un access token real en el endpoint OAuth2 de Google -- mismo flujo que
// documenta Meridian/CLAUDE.md como respaldo manual cuando `google-auth` no
// está disponible, adaptado acá para correr en runtime Edge/Node por igual.
async function getAccessToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) return cachedToken.token;

  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKeyRaw = process.env.FIREBASE_PRIVATE_KEY;
  if (!clientEmail || !privateKeyRaw) return null;

  const header = { alg: "RS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const claims = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/datastore",
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const encoder = new TextEncoder();
  const headerB64 = base64UrlEncode(encoder.encode(JSON.stringify(header)));
  const claimsB64 = base64UrlEncode(encoder.encode(JSON.stringify(claims)));
  const signingInput = `${headerB64}.${claimsB64}`;

  const key = await crypto.subtle.importKey(
    "pkcs8",
    pemToArrayBuffer(privateKeyRaw),
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, encoder.encode(signingInput));
  const jwt = `${signingInput}.${base64UrlEncode(signature)}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { access_token?: string; expires_in?: number };
  if (!data.access_token) return null;
  cachedToken = { token: data.access_token, expiresAt: Date.now() + (data.expires_in || 3600) * 1000 };
  return cachedToken.token;
}

// ---- Conversión mínima JS <-> valores tipados de la API REST de Firestore ----
// Solo cubre los tipos reales que este módulo necesita (string, number,
// boolean, null, array, object anidado) -- no es un conversor genérico.
function toFirestoreValue(v: unknown): Record<string, unknown> {
  if (v === null || v === undefined) return { nullValue: null };
  if (typeof v === "string") return { stringValue: v };
  if (typeof v === "number") return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === "boolean") return { booleanValue: v };
  if (Array.isArray(v)) return { arrayValue: { values: v.map(toFirestoreValue) } };
  if (typeof v === "object") {
    const fields: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
      if (val === undefined) continue;
      fields[k] = toFirestoreValue(val);
    }
    return { mapValue: { fields } };
  }
  return { nullValue: null };
}

function fromFirestoreValue(v: any): unknown {
  if (!v || typeof v !== "object") return null;
  if ("stringValue" in v) return v.stringValue;
  if ("integerValue" in v) return Number(v.integerValue);
  if ("doubleValue" in v) return v.doubleValue;
  if ("booleanValue" in v) return v.booleanValue;
  if ("nullValue" in v) return null;
  if ("arrayValue" in v) return (v.arrayValue.values || []).map(fromFirestoreValue);
  if ("mapValue" in v) {
    const out: Record<string, unknown> = {};
    for (const [k, val] of Object.entries(v.mapValue.fields || {})) out[k] = fromFirestoreValue(val);
    return out;
  }
  return null;
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
// (ver quotebot-chat.ts) -- así la función se mantiene viva hasta que la
// escritura a Firestore termina de verdad, en vez de confiar en que un
// fire-and-forget alcance a resolver antes de que la plataforma corte el
// proceso. Igual nunca lanza -- si falla (sin red, reglas, base caída, o el
// visitante nunca tuvo conversación previa), el respaldo se pierde para ESTE
// mensaje puntual, pero nunca debe tumbar la respuesta real al usuario.
//
// Sin transacción real (a diferencia de la versión con firebase-admin): la
// REST API de Firestore no ofrece un primitivo de transacción tan simple
// como el SDK para este caso; como es un respaldo best-effort de un único
// visitante (colisiones reales entre dos requests concurrentes del mismo
// visitorId son un caso extremadamente raro, y el peor resultado posible es
// perder el respaldo de un mensaje puntual, no corromper datos), un
// GET-luego-PATCH simple es una simplificación aceptable acá.
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
  if (!FIRESTORE_PROJECT) return;

  try {
    const token = await getAccessToken();
    if (!token) return;

    const { content, suggestions } = extractSuggestions(rawAssistantText);
    const messages: BackupMessage[] = [
      ...history,
      { role: "user", content: userMessage },
      { role: "assistant", content, suggestions, widget: widget || undefined, usedWebSearch },
    ];

    const docUrl = `https://firestore.googleapis.com/v1/projects/${FIRESTORE_PROJECT}/databases/${FIRESTORE_DATABASE}/documents/atlas_conversations/${visitorId}`;

    const getRes = await fetch(docUrl, { headers: { Authorization: `Bearer ${token}` } });
    let existing: BackupConversation[] = [];
    if (getRes.ok) {
      const doc = (await getRes.json()) as { fields?: Record<string, unknown> };
      const raw = doc.fields?.conversations ? fromFirestoreValue(doc.fields.conversations) : [];
      if (Array.isArray(raw)) existing = raw as BackupConversation[];
    }

    const idx = existing.findIndex((c) => c.id === conversationId);
    const title = idx >= 0 ? existing[idx].title : "Nueva conversación";
    const icon = idx >= 0 ? existing[idx].icon : undefined;
    const entry: BackupConversation = { id: conversationId, title, icon, messages, updatedAt: Date.now() };
    const next = idx >= 0 ? existing.map((c, i) => (i === idx ? entry : c)) : [entry, ...existing];
    next.sort((a, b) => b.updatedAt - a.updatedAt);
    const trimmed = next.slice(0, MAX_CONVERSATIONS);

    const patchUrl = `${docUrl}?updateMask.fieldPaths=conversations&updateMask.fieldPaths=updatedAt`;
    await fetch(patchUrl, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        fields: {
          conversations: toFirestoreValue(trimmed),
          updatedAt: toFirestoreValue(Date.now()),
        },
      }),
    });
  } catch (err) {
    console.warn("atlas backup falló (best-effort, no bloquea el chat):", (err as Error)?.message);
  }
}
