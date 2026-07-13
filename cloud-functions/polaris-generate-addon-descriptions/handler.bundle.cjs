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

// api/generate-addon-descriptions.ts
var generate_addon_descriptions_exports = {};
__export(generate_addon_descriptions_exports, {
  default: () => handler
});
module.exports = __toCommonJS(generate_addon_descriptions_exports);
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
async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip, 30, 10 * 60 * 1e3)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }
  const { businessType, sector, planType } = req.body || {};
  if (!businessType || !sector) {
    return res.status(400).json({ error: "Faltan par\xE1metros" });
  }
  if (typeof businessType !== "string" || businessType.length > 100 || typeof sector !== "string" || sector.length > 100 || planType !== void 0 && (typeof planType !== "string" || planType.length > 50)) {
    return res.status(400).json({ error: "Par\xE1metros inv\xE1lidos." });
  }
  const systemPrompt = `Eres un copywriter para Polaris Web Studio, agencia de desarrollo web en Rep\xFAblica Dominicana. Tu tarea es personalizar las descripciones de nuestros add-ons para el negocio espec\xEDfico del cliente.

ESTO ES LO QUE HACE CADA ADD-ON (no inventes funciones que no existen):
- bot_fast: Chatbot que responde preguntas frecuentes autom\xE1ticamente 24/7 en la web
- ai_agent: Agente de ventas con IA que gu\xEDa al visitante hacia una compra o contacto
- semantic_search: Buscador inteligente dentro de la tienda online que entiende lenguaje natural
- content_assistant: Genera borradores de art\xEDculos de blog y posts para redes sociales
- content_seo: Lista de keywords prioritarias y gu\xEDa de estrategia SEO para su industria
- crm_connect: Sincroniza los leads del formulario web con su CRM o lista de contactos
- multilingual: Versi\xF3n del sitio en ingl\xE9s u otro idioma adicional
- copy: Redacci\xF3n profesional de todos los textos del sitio web
- branding: Dise\xF1o o redise\xF1o de logo y paleta de colores
- hosting: Mantenimiento mensual, backups, actualizaciones y soporte t\xE9cnico

REGLAS:
- Personaliza SOLO el contexto del negocio \u2014 no cambies lo que hace el add-on
- 15-20 palabras por descripci\xF3n
- Habla al due\xF1o: "tus clientes", "tu negocio"
- Menciona una situaci\xF3n concreta y real de ese tipo de negocio
- Sin tecnicismos, tono cercano y directo
- Prohibido: "mejora tu presencia", "aumenta tus ventas", "potencia", "optimiza"
- Add-ons irrelevantes para este negocio = null
- Devuelve \xDANICAMENTE JSON con exactamente estas 10 claves: bot_fast, ai_agent, semantic_search, content_assistant, content_seo, crm_connect, multilingual, copy, branding, hosting
- Sin markdown, sin backticks, solo JSON v\xE1lido`;
  try {
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            parts: [{
              text: `Negocio: ${businessType}
Sector: ${sector}
Plan: ${planType || "corporate"}`
            }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
        })
      }
    );
    if (!geminiRes.ok) throw new Error("Gemini error");
    const geminiResult = await geminiRes.json();
    const text = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
    const clean = text.replace(/```json|```/g, "").trim();
    return res.status(200).json(JSON.parse(clean));
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
            { role: "user", content: `Negocio: ${businessType}
Sector: ${sector}
Plan: ${planType || "corporate"}` }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });
      if (!grokRes.ok) throw new Error("Grok error");
      const grokResult = await grokRes.json();
      const text = grokResult.choices?.[0]?.message?.content || "";
      const clean = text.replace(/```json|```/g, "").trim();
      return res.status(200).json(JSON.parse(clean));
    } catch {
      return res.status(500).json({ error: "all_providers_failed" });
    }
  }
}
