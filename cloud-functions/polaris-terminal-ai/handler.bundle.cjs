var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// api/terminal-ai.ts
var terminal_ai_exports = {};
__export(terminal_ai_exports, {
  default: () => handler
});
module.exports = __toCommonJS(terminal_ai_exports);
var MAX_MESSAGE_CHARS = 2e3;
var MAX_HISTORY_TURNS = 20;
var rlBuckets = /* @__PURE__ */ new Map();
function rateLimited(ip, max, windowMs) {
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
function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"] || "";
  return fwd.split(",")[0].trim() || "unknown";
}
function sanitizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const h of history.slice(-MAX_HISTORY_TURNS)) {
    if (!h || typeof h !== "object") continue;
    const role = h.role;
    const content = h.content;
    if (role !== "user" && role !== "assistant" || typeof content !== "string") continue;
    out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  return out;
}
async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (rateLimited(clientIp(req), 30, 10 * 60 * 1e3)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }
  const { message } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Missing message" });
  if (message.length > MAX_MESSAGE_CHARS) return res.status(400).json({ error: "Message too long" });
  const history = sanitizeHistory((req.body || {}).history);
  const systemPrompt = `Eres Atlas, el asistente t\xE9cnico de Polaris Web Studio, una agencia de desarrollo web premium en Punta Cana, Rep\xFAblica Dominicana. Fundada por Cristian Dicen. Especializada en React, TypeScript, Vite, Tailwind CSS, Framer Motion e integraciones de IA.

Planes disponibles:
- Destello: $299 USD \u2014 Landing page 1 p\xE1gina, entrega 1-2 semanas
- Constelaci\xF3n: $699 USD \u2014 Web corporativa hasta 5 p\xE1ginas, chatbot IA, entrega 2-4 semanas  
- Nova: $1,299 USD \u2014 E-commerce + panel admin + herramienta IA, entrega 4-6 semanas

Contacto: hola@polarisweb.studio | +1 (829) 920-0544 | @polariswebstudio | Punta Cana, RD
Cotizador: /cotizar

REGLAS:
- Responde SIEMPRE en el idioma del usuario (espa\xF1ol o ingl\xE9s)
- M\xE1ximo 60 palabras por respuesta
- Tono t\xE9cnico pero accesible, directo, sin relleno
- Si preguntan por precios, da el plan m\xE1s relevante con precio exacto
- Si preguntan por tecnolog\xEDas, menciona el stack real
- Si quieren contratar, diles que escriban "hire" o vayan a /cotizar
- Nunca inventes funcionalidades o precios que no existen
- Formato terminal: sin markdown, sin bullets con *, usa \u2192 para listas si es necesario`;
  const messages = [
    ...history || [],
    { role: "user", content: message }
  ];
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: messages.map((m) => ({
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
