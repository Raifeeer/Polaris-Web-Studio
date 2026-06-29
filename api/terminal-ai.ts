import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { message, history } = req.body;
  if (!message) return res.status(400).json({ error: "Missing message" });

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
