import type { VercelRequest, VercelResponse } from "@vercel/node";

const MAX_MESSAGE_CHARS = 2000;
const MAX_HISTORY_TURNS = 20;

// Rate limit best-effort por instancia (serverless): en cold start se reinicia,
// pero frena ráfagas sobre una instancia caliente. El límite real de coste lo
// dan los topes de longitud/historial de abajo (bounded por request).
const rlBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(ip: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = rlBuckets.get(ip);
  if (!b || now > b.resetAt) {
    rlBuckets.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (b.count >= max) return true;
  b.count++;
  return false;
}
function clientIp(req: VercelRequest): string {
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  return fwd.split(",")[0].trim() || "unknown";
}

// Solo se aceptan turnos user/assistant del historial. Descartar cualquier otro
// rol (p. ej. "system") evita que un cliente inyecte instrucciones de sistema
// a través del historial en el fallback de Grok.
function sanitizeHistory(history: unknown): { role: string; content: string }[] {
  if (!Array.isArray(history)) return [];
  const out: { role: string; content: string }[] = [];
  for (const h of history.slice(-MAX_HISTORY_TURNS)) {
    if (!h || typeof h !== "object") continue;
    const role = (h as any).role;
    const content = (h as any).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  return out;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (rateLimited(clientIp(req), 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }

  const { message } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Missing message" });
  if (message.length > MAX_MESSAGE_CHARS) return res.status(400).json({ error: "Message too long" });
  const history = sanitizeHistory((req.body || {}).history);

  const systemPrompt = `Eres Atlas, el asistente técnico de Polaris Web Studio, una agencia de desarrollo web premium en Punta Cana, República Dominicana. Fundada por Cristian Dicen. Especializada en React, TypeScript, Vite, Tailwind CSS, Framer Motion e integraciones de IA.

Planes disponibles:
- Destello: $299 USD — Landing page 1 página, entrega 1-2 semanas
- Constelación: $699 USD — Web corporativa hasta 5 páginas, chatbot IA, entrega 2-4 semanas  
- Nova: $1,299 USD — E-commerce + panel admin + herramienta IA, entrega 4-6 semanas

Contacto: hola@polarisweb.studio | +1 (829) 920-0544 | @polariswebstudio | Punta Cana, RD
Cotizador: /cotizar

REGLAS:
- Responde SIEMPRE en el idioma del usuario (español o inglés)
- Máximo 60 palabras por respuesta
- Tono técnico pero accesible, directo, sin relleno
- Si preguntan por precios, da el plan más relevante con precio exacto
- Si preguntan por tecnologías, menciona el stack real
- Si quieren contratar, diles que escriban "hire" o vayan a /cotizar
- Nunca inventes funcionalidades o precios que no existen
- Formato terminal: sin markdown, sin bullets con *, usa → para listas si es necesario`;

  const messages = [
    ...(history || []),
    { role: "user", content: message }
  ];

  try {
    // Intento 1 — Gemini 3.1 Flash Lite
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map(m => ({
            role: m.role === "assistant" ? "model" : "user",
            parts: [{ text: m.content }]
          })),
          generationConfig: { temperature: 0.8, maxOutputTokens: 150 }
        })
      }
    );

    if (!geminiRes.ok) throw new Error("Gemini failed");
    const geminiData = await geminiRes.json();
    const text = geminiData.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    if (!text) throw new Error("Empty response");
    return res.status(200).json({ reply: text, provider: "gemini" });

  } catch {
    // Fallback — Grok 4.3
    try {
      const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: "grok-4.3",
          messages: [
            { role: "system", content: systemPrompt },
            ...messages
          ],
          temperature: 0.8,
          max_tokens: 150
        })
      });

      if (!grokRes.ok) throw new Error("Grok failed");
      const grokData = await grokRes.json();
      const text = grokData.choices?.[0]?.message?.content?.trim() || "";
      if (!text) throw new Error("Empty response");
      return res.status(200).json({ reply: text, provider: "grok" });

    } catch {
      return res.status(500).json({ error: "all_providers_failed" });
    }
  }
}
