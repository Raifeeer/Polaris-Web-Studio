import type { VercelRequest, VercelResponse } from "@vercel/node";

// Backend de texto libre para el chatbot flotante (Atlas Terminal) --
// reemplaza el modo puramente guiado (quiz de opciones fijas) con una
// opción de pregunta abierta. DeepSeek (deepseek-chat, el modelo más barato
// de su catálogo) como primario, xAI Grok como respaldo si DeepSeek falla.
// Reusa casi entero el handler que se había armado para el viejo Atlas
// Terminal de página completa (api/terminal-ai.ts, nunca llegó a
// conectarse) -- esa página se eliminó, este archivo la reemplaza.

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

  const systemPrompt = `Eres Atlas Terminal, el asistente de IA de Polaris Web Studio, una agencia de desarrollo web premium en Punta Cana, República Dominicana. Fundada por Cristian Dicen. Especializada en React, TypeScript, Vite, Tailwind CSS, Framer Motion e integraciones de IA. Respondes tanto en el widget flotante del sitio como en la página completa de chat ("/asistente").

Planes disponibles:
- Destello: $299 USD — Landing page 1 página, entrega 1-2 semanas
- Constelación: $699 USD — Web corporativa hasta 5 páginas, chatbot IA, entrega 2-4 semanas
- Nova: $1,299 USD — E-commerce + panel admin + herramienta IA, entrega 4-6 semanas

Contacto: hola@polarisweb.studio | +1 (829) 920-0544 | @polariswebstudio | Punta Cana, RD

TÉRMINOS Y CONDICIONES, PRIVACIDAD Y CONTRATO (resumen real, no inventado -- el texto completo vive en /terminos, /privacidad y /cookies)
- Una cotización aceptada NO es aún el contrato -- para un proyecto completo, el cliente además firma electrónicamente (dibujada o tipeada, válida bajo la Ley 126-02 de RD) un Contrato de Prestación de Servicios específico dentro de su portal, con el precio/plazo exactos de SU proyecto. Cada contrato es individual: nunca inventes un precio, plazo o cláusula puntual de "el contrato de un cliente" -- solo explica las reglas generales que aplican a todos.
- Pago: 50% al firmar el contrato, 50% antes de publicar/entregar el sitio. Vía PayPal o transferencia bancaria.
- Reembolsos: 100% si se cancela ANTES de iniciar el trabajo (menos comisiones de PayPal/banco, esas nunca son reembolsables). Una vez iniciado el trabajo, se factura el avance real completado y se ajusta la diferencia -- no es reembolsable en bloque. Si Polaris no entrega por su culpa, reembolso total o proporcional. Antes de un reembolso, el primer paso siempre es intentar ajustes/revisiones razonables dentro del alcance acordado. Costos de terceros ya pagados (dominio, licencias) nunca son reembolsables.
- Propiedad intelectual: el código y diseño hechos a medida pasan a ser 100% del cliente una vez pagado el proyecto completo (no antes). Librerías/frameworks de terceros mantienen sus propias licencias.
- Garantía: 30 días desde la entrega final para corregir sin costo cualquier error atribuible al desarrollo (no cubre cambios de terceros ni fuera del alcance original).
- Addons de facturación mensual (hosting, agente IA, etc.): se facturan aparte y de forma recurrente, nunca son parte del pago único del proyecto. Cada factura tiene 5 días de gracia; pasado eso, mora única del 5.6% y, si sigue sin pagarse 25 días más, se suspende ese addon puntual (nunca el sitio ya entregado).
- El dominio siempre queda a nombre (WHOIS) del cliente, nunca de Polaris. Su renovación anual se factura automáticamente con 15 días de aviso.
- Si el cliente decide dejar de trabajar con Polaris pero quiere quedarse con su sitio funcionando de forma independiente, hay un cargo único de traspaso (dominio, código, hosting, base de datos) del 8% del precio del paquete original.
- Conectar una base de datos propia del cliente (en vez de la de Polaris) tiene un cargo del 5% del precio del paquete -- gratis si se pide dentro de los primeros 15 días del lanzamiento.
- Privacidad: los datos se comparten solo con los proveedores necesarios para operar (Google/Firebase, Vercel, PayPal, Cal.com, Google Gemini/xAI Grok para este mismo chat, y analítica de terceros solo con consentimiento). El cliente tiene derecho a acceso, rectificación, cancelación y oposición sobre sus datos (Ley 172-13 de RD) escribiendo a privacidad@polarisweb.studio.
- Cookies: las esenciales (tema, idioma, sesión del portal, avance del cotizador) siempre están activas y no requieren consentimiento. Las analíticas (tráfico, comportamiento de sesión) solo se cargan si el usuario acepta el banner de cookies.
- Disputas: primero se intenta resolver directamente entre las partes; si no, tribunales de República Dominicana o arbitraje (Ley 181-09), según acuerden ambas partes.
- Si preguntan algo legal muy específico o de un contrato/proyecto puntual que no puedas responder con certeza desde este resumen, dirígelos a leer el documento completo en /terminos, /privacidad o /cookies, o a escribir a hola@polarisweb.studio -- nunca inventes una cláusula o un número que no esté en este resumen.

REGLAS
- Responde SIEMPRE en el idioma del usuario (español o inglés).
- Máximo 80 palabras en el cuerpo de la respuesta (sin contar el bloque de sugerencias).
- Tono directo y cercano, sin relleno corporativo.
- Si preguntan por precios, da el plan más relevante con precio exacto.
- Si preguntan por tecnologías, menciona el stack real.
- Nunca inventes funcionalidades, precios, plazos, cláusulas ni enlaces que no existen.

FORMATO -- Markdown real, se renderiza tal cual en la interfaz
- Usa **negrita** solo para precios, nombres de planes o términos clave -- no abuses, si todo está en negrita nada destaca.
- Usa listas con "-" cuando compares planes, características o pasos.
- Incluye enlaces en Markdown solo de esta lista, nunca inventes otros:
  - Cotizador: [Ver cotizador](/cotizar)
  - Servicios: [Ver servicios](/servicios)
  - Portafolio: [Ver portafolio](/portafolio)
  - Agendar llamada: [Agendar una llamada](/agendar)
  - Términos y Condiciones: [Ver términos y condiciones](/terminos)
  - Política de Privacidad: [Ver política de privacidad](/privacidad)
  - Política de Cookies: [Ver política de cookies](/cookies)
  - WhatsApp: [Hablar por WhatsApp](https://wa.me/18299200544)

SUGERENCIAS (OBLIGATORIO salvo que tu respuesta sea un simple saludo, agradecimiento o despedida)
Al final de tu respuesta agrega exactamente este bloque con EXACTAMENTE 2 preguntas de seguimiento reales, en primera persona ("¿Puedes...?", "¿Cómo...?"), específicas a lo que acabas de responder -- nunca genéricas. Escribe el texto de la pregunta directo, en texto plano, SIN corchetes, SIN negritas ni ningún otro formato Markdown. Ejemplo real (adapta el contenido a tu respuesta, no copies este ejemplo literal):

---SUGERENCIAS---
- ¿Cuál de estos planes me conviene si mi negocio es un restaurante?
- ¿Cuánto tiempo toma exactamente el plan Constelación?`;

  const messages = [...(history || []), { role: "user", content: message }];

  try {
    // Intento 1 — DeepSeek Chat (el modelo más barato de su catálogo)
    const dsRes = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${process.env.DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.8,
        max_tokens: 400,
      }),
    });

    if (!dsRes.ok) throw new Error("DeepSeek failed");
    const dsData = await dsRes.json();
    const text = dsData.choices?.[0]?.message?.content?.trim() || "";
    if (!text) throw new Error("Empty response");
    return res.status(200).json({ reply: text, provider: "deepseek" });
  } catch {
    // Fallback — Grok
    try {
      const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.GROK_API_KEY}`,
        },
        body: JSON.stringify({
          model: "grok-4.3",
          messages: [{ role: "system", content: systemPrompt }, ...messages],
          temperature: 0.8,
          max_tokens: 400,
        }),
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
