import type { VercelRequest, VercelResponse } from "@vercel/node";

// Canal de diagnóstico real desde el navegador -- pedido explícito del
// usuario tras varios reportes de bugs de voz/TTS en vivo que no se podían
// reproducir por curl (dependen de la red/dispositivo real del usuario, ver
// Meridian/CLAUDE.md). El cliente manda eventos puntuales acá (éxito/fallo,
// tiempos, tamaños) vía sendBeacon/fetch keepalive, y quedan visibles en los
// logs reales de Vercel (`console.log`) -- sin backend/base de datos nueva,
// solo para poder consultar `get_runtime_logs` en vez de adivinar.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).end();
  try {
    const body = req.body || {};
    // Nunca de más de ~2KB -- esto es un beacon de diagnóstico puntual, no
    // un canal para mandar datos arbitrarios.
    const safe = JSON.stringify(body).slice(0, 2000);
    console.log(`[client-log] ${safe}`);
  } catch {
    // no bloquear nunca por un log roto
  }
  res.status(204).end();
}
