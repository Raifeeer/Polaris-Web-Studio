import type { VercelRequest, VercelResponse } from "@vercel/node";

const RDAP_SERVERS: Record<string, string> = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  org: "https://rdap.org/domain/",
  io:  "https://rdap.nic.io/domain/",
  co:  "https://rdap.nic.co/domain/",
  app: "https://rdap.nic.google/domain/",
  dev: "https://rdap.nic.google/domain/",
  info: "https://rdap.afilias.net/rdap/info/domain/",
  biz: "https://rdap.nic.biz/domain/",
  me:  "https://rdap.nic.me/domain/",
};

const DEFAULT_RDAP = "https://rdap.cloudflare.com/rdap/v1/domain/";

async function checkDomain(domain: string): Promise<boolean> {
  const ext = domain.split(".").pop()?.toLowerCase() || "com";
  const baseUrl = RDAP_SERVERS[ext] || DEFAULT_RDAP;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);

  try {
    const response = await fetch(`${baseUrl}${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/rdap+json" },
      signal: controller.signal,
    });
    return response.status === 404;
  } catch (err: any) {
    console.error(`[RDAP Error for ${domain}]:`, err.message);
    return false; // treat as occupied/error to prevent false positives
  } finally {
    clearTimeout(timeoutId);
  }
}

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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip, 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }

  const { domain, sector, businessType } = req.body || {};

  // Validación de entradas: acota longitudes para evitar abuso de coste de IA.
  if (!domain || typeof domain !== "string" || domain.length > 253) {
    return res.status(400).json({ error: "Parámetro 'domain' inválido o ausente." });
  }
  if (sector !== undefined && (typeof sector !== "string" || sector.length > 100)) {
    return res.status(400).json({ error: "Parámetro 'sector' inválido." });
  }
  if (businessType !== undefined && (typeof businessType !== "string" || businessType.length > 100)) {
    return res.status(400).json({ error: "Parámetro 'businessType' inválido." });
  }

  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();

  const systemPrompt = `Eres un asesor de dominios e identidad digital para Polaris Web Studio, una prestigiosa agencia de desarrollo web en República Dominicana.
El dominio original solicitado por el usuario ("${cleanDomain}") NO está disponible. Tu tarea es generar exactamente 4 sugerencias de nombres de dominio alternativas y creativas.

REGLAS DE GENERACIÓN:
1. Las alternativas deben estar basadas en el nombre de marca o idea original ("${cleanDomain}"), combinándolo con el giro del negocio.
2. Contexto de negocio del cliente: Sector: "${sector || "No especificado"}", Tipo de negocio: "${businessType || "No especificado"}". Usa esta información para que las sugerencias tengan sentido real y profesional (puedes agregar palabras como "rd", "digital", "shop", "app", "hub", "studio", "group", "web", etc., o palabras relacionadas con su sector).
3. Deben ser dominios cortos, fáciles de recordar, deletrear y pronunciar.
4. NUNCA utilices guiones (-), números o caracteres especiales extraños.
5. Elige principalmente la extensión .com (ej. "marca.com", "marcard.com", "marcadigital.com", "marcashop.com").
6. Devuelve ÚNICAMENTE un array de strings en formato JSON con exactamente 4 sugerencias de dominio con su extensión.
7. NO incluyes explicaciones, ni bloques de código, ni markdown, ni backticks. Solo el JSON puro y crudo.

Ejemplo de respuesta esperada:
["miempresahub.com", "miempresard.com", "miempresadigital.com", "miempresaportal.com"]`;

  let rawAiResponse = "";

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
              text: `Dominio original: ${cleanDomain}\nSector: ${sector || "No especificado"}\nTipo de negocio: ${businessType || "No especificado"}`
            }]
          }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 400 }
        })
      }
    );

    if (geminiRes.ok) {
      const geminiResult = await geminiRes.json();
      rawAiResponse = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
    } else {
      throw new Error("Gemini error");
    }

  } catch {
    // Fallback -- Grok 4.3 (or grok-2-latest as configured elsewhere)
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
            { role: "user", content: `Dominio original: ${cleanDomain}\nSector: ${sector || "No especificado"}\nTipo de negocio: ${businessType || "No especificado"}` }
          ],
          temperature: 0.7,
          max_tokens: 600
        })
      });

      if (grokRes.ok) {
        const grokResult = await grokRes.json();
        rawAiResponse = grokResult.choices?.[0]?.message?.content || "";
      } else {
        throw new Error("Grok error");
      }
    } catch {
      return res.status(500).json({ error: "all_providers_failed" });
    }
  }

  // Parse suggested domains from response
  let suggestions: string[] = [];
  try {
    const cleanJson = rawAiResponse.replace(/```json|```/g, "").trim();
    suggestions = JSON.parse(cleanJson);
  } catch (err) {
    console.error("Failed to parse AI response as JSON:", rawAiResponse);
    return res.status(500).json({ error: "parse_error", raw: rawAiResponse });
  }

  if (!Array.isArray(suggestions) || suggestions.length === 0) {
    return res.status(500).json({ error: "invalid_suggestions_format" });
  }

  // Check initial 4 suggestions in parallel against RDAP
  const results = await Promise.all(
    suggestions.map(async (dom) => {
      const isAvailable = await checkDomain(dom);
      return { domain: dom, available: isAvailable };
    })
  );

  // Bug real (19 de julio): antes se filtraban a solo las disponibles --
  // si la IA sugería 4 y solo 1 estaba libre, el cliente veía nada más
  // esa 1, aunque la UI ya soporta marcar ocupadas con un punto rojo. Ahora
  // se devuelven las 4 sugeridas siempre, con su estado real.
  let verifiedSuggestions = results;

  // Si NINGUNA de las 4 sugeridas por la IA está disponible, se suman
  // alternativas .net/.co/.org (sin reemplazar las 4 originales, para que
  // el cliente siga viendo qué se le sugirió) hasta tener al menos una
  // opción disponible real entre las mostradas.
  if (!results.some((r) => r.available)) {
    const backupChecks: string[] = [];
    const tlds = ["net", "co", "org"];

    // Take the first 2-3 suggestions, strip their extensions, and combine with net/co/org
    const topSuggestions = suggestions.slice(0, 2);
    for (const item of topSuggestions) {
      const base = item.split(".")[0];
      for (const tld of tlds) {
        backupChecks.push(`${base}.${tld}`);
      }
    }

    const backupResults = await Promise.all(
      backupChecks.map(async (dom) => {
        const isAvailable = await checkDomain(dom);
        return { domain: dom, available: isAvailable };
      })
    );

    verifiedSuggestions = [...results, ...backupResults.filter((r) => r.available)];
  }

  // Limit suggestions to maximum 6 (las 4 originales + hasta 2 backups reales)
  return res.status(200).json({ suggestions: verifiedSuggestions.slice(0, 6) });
}
