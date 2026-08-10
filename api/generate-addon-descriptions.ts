import type { VercelRequest, VercelResponse } from "@vercel/node";

// Rate limit best-effort por instancia (ver nota en terminal-ai.ts).
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }

  const { businessType, sector, planType } = req.body || {};

  if (!businessType || !sector) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }
  // Acota longitudes para evitar abuso de coste de IA.
  if (typeof businessType !== "string" || businessType.length > 100 ||
      typeof sector !== "string" || sector.length > 100 ||
      (planType !== undefined && (typeof planType !== "string" || planType.length > 50))) {
    return res.status(400).json({ error: "Parámetros inválidos." });
  }

  const systemPrompt = `Eres un copywriter para Polaris Web Studio, agencia de desarrollo web en República Dominicana. Tu tarea es personalizar las descripciones de nuestros add-ons para el negocio específico del cliente.

ESTO ES LO QUE HACE CADA ADD-ON (no inventes funciones que no existen):
- bot_fast: Chatbot que responde preguntas frecuentes automáticamente 24/7 en la web
- ai_agent: Agente de ventas con IA que guía al visitante hacia una compra o contacto
- semantic_search: Buscador inteligente dentro de la tienda online que entiende lenguaje natural
- content_assistant: Genera borradores de artículos de blog y posts para redes sociales
- content_seo: Lista de keywords prioritarias y guía de estrategia SEO para su industria
- crm_connect: Sincroniza los leads del formulario web con su CRM o lista de contactos
- multilingual: Versión del sitio en inglés u otro idioma adicional
- copy: Redacción profesional de todos los textos del sitio web
- branding: Diseño o rediseño de logo y paleta de colores
- hosting: Mantenimiento mensual, backups, actualizaciones y soporte técnico

REGLAS:
- Personaliza SOLO el contexto del negocio — no cambies lo que hace el add-on
- 15-20 palabras por descripción
- Habla al dueño: "tus clientes", "tu negocio"
- Menciona una situación concreta y real de ese tipo de negocio
- Sin tecnicismos, tono cercano y directo
- Prohibido: "mejora tu presencia", "aumenta tus ventas", "potencia", "optimiza"
- Add-ons irrelevantes para este negocio = null
- Devuelve ÚNICAMENTE JSON con exactamente estas 10 claves: bot_fast, ai_agent, semantic_search, content_assistant, content_seo, crm_connect, multilingual, copy, branding, hosting
- Sin markdown, sin backticks, solo JSON válido`;

  try {
    // Intento 1 -- Gemini 3.1 Flash Lite
    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${process.env.GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [{
            parts: [{
              text: `Negocio: ${businessType}\nSector: ${sector}\nPlan: ${planType || "corporate"}`
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
    // Fallback -- Grok 4.3
    try {
      const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROK_API_KEY}`
        },
        body: JSON.stringify({
          model: "grok-4.20-non-reasoning",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Negocio: ${businessType}\nSector: ${sector}\nPlan: ${planType || "corporate"}` }
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
