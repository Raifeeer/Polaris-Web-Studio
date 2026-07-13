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

// api/suggest-domains.ts
var suggest_domains_exports = {};
__export(suggest_domains_exports, {
  default: () => handler
});
module.exports = __toCommonJS(suggest_domains_exports);
var RDAP_SERVERS = {
  com: "https://rdap.verisign.com/com/v1/domain/",
  net: "https://rdap.verisign.com/net/v1/domain/",
  org: "https://rdap.org/domain/",
  io: "https://rdap.nic.io/domain/",
  co: "https://rdap.nic.co/domain/",
  app: "https://rdap.nic.google/domain/",
  dev: "https://rdap.nic.google/domain/",
  info: "https://rdap.afilias.net/rdap/info/domain/",
  biz: "https://rdap.nic.biz/domain/",
  me: "https://rdap.nic.me/domain/"
};
var DEFAULT_RDAP = "https://rdap.cloudflare.com/rdap/v1/domain/";
async function checkDomain(domain) {
  const ext = domain.split(".").pop()?.toLowerCase() || "com";
  const baseUrl = RDAP_SERVERS[ext] || DEFAULT_RDAP;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 8500);
  try {
    const response = await fetch(`${baseUrl}${encodeURIComponent(domain)}`, {
      headers: { Accept: "application/rdap+json" },
      signal: controller.signal
    });
    return response.status === 404;
  } catch (err) {
    console.error(`[RDAP Error for ${domain}]:`, err.message);
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
}
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
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }
  const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip, 30, 10 * 60 * 1e3)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }
  const { domain, sector, businessType } = req.body || {};
  if (!domain || typeof domain !== "string" || domain.length > 253) {
    return res.status(400).json({ error: "Par\xE1metro 'domain' inv\xE1lido o ausente." });
  }
  if (sector !== void 0 && (typeof sector !== "string" || sector.length > 100)) {
    return res.status(400).json({ error: "Par\xE1metro 'sector' inv\xE1lido." });
  }
  if (businessType !== void 0 && (typeof businessType !== "string" || businessType.length > 100)) {
    return res.status(400).json({ error: "Par\xE1metro 'businessType' inv\xE1lido." });
  }
  const cleanDomain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0].toLowerCase();
  const systemPrompt = `Eres un asesor de dominios e identidad digital para Polaris Web Studio, una prestigiosa agencia de desarrollo web en Rep\xFAblica Dominicana.
El dominio original solicitado por el usuario ("${cleanDomain}") NO est\xE1 disponible. Tu tarea es generar exactamente 4 sugerencias de nombres de dominio alternativas y creativas.

REGLAS DE GENERACI\xD3N:
1. Las alternativas deben estar basadas en el nombre de marca o idea original ("${cleanDomain}"), combin\xE1ndolo con el giro del negocio.
2. Contexto de negocio del cliente: Sector: "${sector || "No especificado"}", Tipo de negocio: "${businessType || "No especificado"}". Usa esta informaci\xF3n para que las sugerencias tengan sentido real y profesional (puedes agregar palabras como "rd", "digital", "shop", "app", "hub", "studio", "group", "web", etc., o palabras relacionadas con su sector).
3. Deben ser dominios cortos, f\xE1ciles de recordar, deletrear y pronunciar.
4. NUNCA utilices guiones (-), n\xFAmeros o caracteres especiales extra\xF1os.
5. Elige principalmente la extensi\xF3n .com (ej. "marca.com", "marcard.com", "marcadigital.com", "marcashop.com").
6. Devuelve \xDANICAMENTE un array de strings en formato JSON con exactamente 4 sugerencias de dominio con su extensi\xF3n.
7. NO incluyes explicaciones, ni bloques de c\xF3digo, ni markdown, ni backticks. Solo el JSON puro y crudo.

Ejemplo de respuesta esperada:
["miempresahub.com", "miempresard.com", "miempresadigital.com", "miempresaportal.com"]`;
  let rawAiResponse = "";
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
              text: `Dominio original: ${cleanDomain}
Sector: ${sector || "No especificado"}
Tipo de negocio: ${businessType || "No especificado"}`
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
            { role: "user", content: `Dominio original: ${cleanDomain}
Sector: ${sector || "No especificado"}
Tipo de negocio: ${businessType || "No especificado"}` }
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
  let suggestions = [];
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
  const results = await Promise.all(
    suggestions.map(async (dom) => {
      const isAvailable = await checkDomain(dom);
      return { domain: dom, available: isAvailable };
    })
  );
  let verifiedSuggestions = results.filter((r) => r.available);
  if (verifiedSuggestions.length === 0) {
    const backupChecks = [];
    const tlds = ["net", "co", "org"];
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
    verifiedSuggestions = backupResults.filter((r) => r.available);
  }
  return res.status(200).json({ suggestions: verifiedSuggestions.slice(0, 4) });
}
