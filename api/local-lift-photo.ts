import type { VercelRequest, VercelResponse } from "@vercel/node";

// Proxy real de fotos de Google Places (New) -- pedido explícito del
// usuario tras ver íconos de imagen rota tanto en el panel admin
// (/local-lift-panel, sección "Ficha real del negocio") como potencialmente
// en el PDF: la URL cruda de Google (`https://places.googleapis.com/v1/
// {name}/media?key=...`) llevaba la GOOGLE_PLACES_API_KEY real pegada en
// el query string, expuesta directo en el HTML/PDF -- y esa key está
// restringida (misma cuenta que usa el resto de _localLift.ts server-side),
// así que un <img> cargándola directo desde el navegador del cliente recibe
// 403 de Google (restricción de referrer/IP no pensada para tráfico de
// navegador), de ahí el ícono roto. Este proxy resuelve ambos problemas:
// la key nunca sale del servidor, y la petición real a Google siempre es
// server-to-server (mismo contexto que ya funciona en el resto del archivo).
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });

  const ref = typeof req.query.ref === "string" ? req.query.ref : "";
  // Forma real de un resource name de Places API (New): "places/{placeId}/photos/{photoRef}".
  if (!/^places\/[^/]+\/photos\/[^/]+$/.test(ref)) {
    return res.status(400).json({ error: "Referencia de foto inválida." });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "GOOGLE_PLACES_API_KEY no configurada" });

  try {
    const googleRes = await fetch(`https://places.googleapis.com/v1/${ref}/media?maxWidthPx=800&key=${apiKey}`);
    if (!googleRes.ok) {
      return res.status(googleRes.status).json({ error: "No se pudo obtener la foto de Google." });
    }
    const contentType = googleRes.headers.get("content-type") || "image/jpeg";
    const buffer = Buffer.from(await googleRes.arrayBuffer());
    res.setHeader("Content-Type", contentType);
    // Las fotos reales de Google no cambian por resource name -- cachear
    // fuerte (24h) reduce llamadas repetidas server-to-server innecesarias.
    res.setHeader("Cache-Control", "public, max-age=86400, s-maxage=86400");
    return res.status(200).send(buffer);
  } catch (err) {
    console.error("[local-lift-photo] Error obteniendo foto:", err);
    return res.status(500).json({ error: "Error obteniendo la foto." });
  }
}
