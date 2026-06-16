import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { businessType, sector, planType } = req.body;

  if (!businessType || !sector) {
    return res.status(400).json({ error: "Faltan parámetros" });
  }

  const systemPrompt = `Copywriter de marketing digital para PyMEs en República Dominicana. Escribe descripciones de add-ons para sitios web, personalizadas para el negocio indicado.

REGLAS:
- 15-22 palabras por descripción
- Habla al dueño: "tus clientes", "tu negocio"
- Situaciones concretas y reales del negocio — nunca genérico
- Sin tecnicismos, tono cercano
- Prohibido: "mejora tu presencia", "aumenta tus ventas", "potencia", "optimiza"
- JSON con exactamente estas 10 claves: bot_fast, ai_agent, semantic_search, content_assistant, content_seo, crm_connect, multilingual, copy, branding, hosting
- Irrelevantes = null. Solo JSON, sin markdown ni backticks.`;

  try {
    // Intento 1 — Gemini 3.1 Flash Lite
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
