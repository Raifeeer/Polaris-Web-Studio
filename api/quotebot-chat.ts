import { generateText, generateObject, streamText, stepCountIs } from "ai";

// Edge Runtime, no Node -- probado en vivo (10 de agosto, ver Fase 59 de
// Meridian/CLAUDE.md): las Vercel Node Functions bufferizan la respuesta
// COMPLETA y solo la sueltan cuando la función termina (confirmado con un
// test de timing real), rompiendo el streaming en vivo sin importar
// res.write()/X-Accel-Buffering. Edge sí transmite de verdad byte a byte.
// Además, Node en el plan Hobby tiene un techo duro de 60s (`maxDuration`,
// no configurable más alto sin Pro) -- insuficiente para una búsqueda web
// real (60-180s+ medido en vivo). Edge NO permite configurar `maxDuration`
// en absoluto (la plataforma le da su propio límite fijo) -- medido en vivo
// con un endpoint de prueba (`api/edge-timeout-test.ts`, borrado tras la
// medición): sostuvo un stream real de más de 200s sin cortarse, muy por
// encima de lo que necesita esta búsqueda -- confirma que Edge es viable acá.
export const config = { runtime: "edge" };
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { atlasTools } from "./_atlasTools.js";
import { backupConversation } from "./_atlasBackup.js";

// Mismas claves que ICON_MAP en src/lib/conversationIcon.tsx -- duplicado a
// propósito (mismo patrón ya aceptado en esta cuenta para PACKAGES/ADDONS
// entre repos/funciones distintas), porque el cliente no puede importar
// código de `api/` y viceversa. Si se agrega/saca un ícono del pool, hay que
// actualizar ambas listas.
const ICON_KEYS = [
  "dollar", "cart", "code", "globe", "grid", "calendar", "card", "bot", "palette", "file",
  "shield", "handshake", "rocket", "server", "mail", "phone", "chat", "help", "star", "heart",
  "briefcase", "database", "cloud", "lock", "key", "settings", "wrench", "image", "video", "mic",
  "camera", "pin", "flag", "trophy", "idea", "puzzle", "book", "graduation", "target", "chart",
  "users", "building", "home", "plane", "food", "health", "car", "search", "wand", "layers",
  "phone2", "monitor", "brush", "gift", "clock", "trend", "zap", "package", "truck", "checklist",
  "filecode",
] as const;

// Backend de texto libre para el chatbot flotante (Atlas Assistant) --
// reemplaza el modo puramente guiado (quiz de opciones fijas) con una
// opción de pregunta abierta. Migrado al AI SDK de Vercel (8 de agosto):
// antes cada hecho (precio de dominio, total de una cotización, horarios
// disponibles) vivía como texto fijo en el system prompt, que el modelo
// podía citar mal o quedar desactualizado. Ahora son 4 "tools" reales
// (ver _atlasTools.ts) que el modelo llama en vivo cuando hacen falta --
// el system prompt solo describe el negocio, ya no carga los datos que
// cambian. DeepSeek (deepseek-v4-flash) como primario, xAI Grok como respaldo
// si DeepSeek falla -- el AI SDK no tiene fallback entre proveedores
// integrado, se mantiene el mismo patrón manual de siempre.

const MAX_MESSAGE_CHARS = 2000;

// Modelo por defecto de este chat, leído de la config central de Meridian
// (editable desde /configuracion, sin deploy) -- pública, no requiere
// secreto (el nombre de un modelo no es dato sensible). Cacheado 2 min en
// memoria por instancia para no pegarle a Firestore en cada mensaje.
let defaultModelCache: "deepseek" | "grok" | "gemini" | null = null;
let defaultModelCacheAt = 0;
async function getDefaultModel(): Promise<"deepseek" | "grok" | "gemini"> {
  if (defaultModelCache && Date.now() - defaultModelCacheAt < 2 * 60 * 1000) return defaultModelCache;
  try {
    const res = await fetch("https://ai-model-config-wdvfac6mgq-ue.a.run.app", { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    const key = ["deepseek", "grok", "gemini"].includes(data.polarisChat) ? data.polarisChat : "deepseek";
    defaultModelCache = key;
    defaultModelCacheAt = Date.now();
    return key;
  } catch {
    return "deepseek";
  }
}
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
function clientIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for") || "";
  return fwd.split(",")[0].trim() || "unknown";
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

// Solo se aceptan turnos user/assistant del historial. Descartar cualquier otro
// rol (p. ej. "system") evita que un cliente inyecte instrucciones de sistema
// a través del historial en el fallback de Grok.
function sanitizeHistory(history: unknown): { role: "user" | "assistant"; content: string }[] {
  if (!Array.isArray(history)) return [];
  const out: { role: "user" | "assistant"; content: string }[] = [];
  for (const h of history.slice(-MAX_HISTORY_TURNS)) {
    if (!h || typeof h !== "object") continue;
    const role = (h as any).role;
    const content = (h as any).content;
    if ((role !== "user" && role !== "assistant") || typeof content !== "string") continue;
    out.push({ role, content: content.slice(0, MAX_MESSAGE_CHARS) });
  }
  return out;
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  if (rateLimited(clientIp(req), 30, 10 * 60 * 1000)) {
    return jsonResponse({ error: "Demasiadas solicitudes. Espera un momento." }, 429);
  }

  const body = await req.json().catch(() => ({}) as Record<string, unknown>);
  const { message, stream: wantsStream, titleOnly, visitorId, conversationId, isTemporary } = body as {
    message?: unknown;
    stream?: boolean;
    titleOnly?: boolean;
    visitorId?: string;
    conversationId?: string;
    isTemporary?: boolean;
  };
  if (!message || typeof message !== "string") return jsonResponse({ error: "Missing message" }, 400);
  if (message.length > MAX_MESSAGE_CHARS) return jsonResponse({ error: "Message too long" }, 400);
  // Alias tipado explícito -- la narrowing de `message` a `string` de las dos
  // líneas de arriba no sobrevive dentro del closure `async start(controller)`
  // del ReadableStream más abajo (limitación real de TS con narrowing cruzando
  // límites de función), así que backupConversation() usa este alias en vez
  // del `message` original.
  const messageText: string = message;
  const history = sanitizeHistory((body as Record<string, unknown>).history);

  // Modo liviano: genera un título corto + elige un ícono real (de un pool
  // de ~60, no un match de palabras clave siempre determinista) para la
  // conversación, en un solo llamado estructurado (usado por
  // useAtlasChat.ts tras el primer intercambio), sin tools ni el resto del
  // system prompt -- mismo patrón que titleOnly en meridian-assistant, con
  // el ícono agregado como campo del objeto. Usa el modelo por defecto
  // configurado (no DeepSeek fijo) + timeout explícito de 8s -- sin esto, un
  // proveedor colgado deja la respuesta sin terminar nunca (bug real
  // encontrado en vivo: DeepSeek sin `signal` se quedó esperando
  // indefinidamente, sin cortar ni caer a otro modelo).
  if (titleOnly) {
    try {
      const key = await getDefaultModel();
      const google = createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY });
      const xai = createXai({ apiKey: process.env.GROK_API_KEY });
      const deepseek = createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY });
      const model = key === "gemini" ? google("gemini-3.5-flash") : key === "grok" ? xai("grok-4.20-non-reasoning") : deepseek("deepseek-v4-flash");
      const result = await generateObject({
        model,
        schema: z.object({
          title: z.string().describe("Título corto (máximo 6 palabras, sin comillas ni punto final) que resume de qué trata la conversación, en el mismo idioma del mensaje."),
          icon: z.enum(ICON_KEYS).describe("El ícono que mejor representa el tema del mensaje -- variedad real, no siempre el mismo para temas similares."),
        }),
        prompt: `Primer mensaje del usuario: "${message.slice(0, 500)}"\n\nElige un título corto y el ícono más representativo del tema.`,
        temperature: 0.4,
        abortSignal: AbortSignal.timeout(8000),
      });
      const title = result.object.title.trim().replace(/^["']|["']$/g, "").slice(0, 60);
      return jsonResponse({ title: title || null, icon: result.object.icon || null });
    } catch {
      return jsonResponse({ title: null, icon: null });
    }
  }

  const systemPrompt = `Eres Atlas Assistant, el asistente de IA de Polaris Web Studio, una agencia de desarrollo web premium en Punta Cana, República Dominicana. Fundada por Cristian Dicen. Especializada en React, TypeScript, Vite, Tailwind CSS, Framer Motion e integraciones de IA. Respondes tanto en el widget flotante del sitio como en la página completa de chat ("/asistente").

Planes disponibles:
- Destello (id: landing): $299 USD -- Landing page 1 página, entrega 1-2 semanas
- Constelación (id: corporate): $699 USD -- Web corporativa hasta 5 páginas, chatbot IA, entrega 2-4 semanas
- Nova (id: ecommerce): $1,299 USD -- E-commerce + panel admin + herramienta IA, entrega 4-6 semanas

Contacto: hola@polarisweb.studio | +1 (829) 920-0544 | @polariswebstudio | Punta Cana, RD

TOOLS REALES DISPONIBLES -- úsalas siempre que apliquen, en vez de inventar o recordar un número. Las tools son para dar información exacta y avanzar la conversación hacia una acción real (cotizar, agendar, dejar el lead) -- nunca para alargar la charla con datos de más que el usuario no pidió:
- check_domain_price: SOLO cuando el usuario da o confirma un dominio concreto para consultar en ESTE turno -- nunca la llames sobre un dominio de un turno anterior (ya consultado antes) solo porque sigue en el historial, y nunca sobre un nombre que tú mismo estás sugiriendo como alternativa todavía sin confirmar. Si el usuario pide "recomiéndame otros dominios similares" o "qué alternativas hay", eso es una petición de sugerencias -- responde con nombres propuestos EN TEXTO (sin la tool, sin tarjeta) y espera a que el usuario elija uno antes de consultarlo de verdad. La tarjeta que dibuja esta tool muestra el dominio exacto que consultaste -- si no coincide con lo que tu texto está discutiendo en este mismo turno, confundes al usuario.
- list_packages: si preguntan por los planes/precios EN GENERAL (comparar los 3, "¿cuánto cuesta?", "¿qué planes tienen?") sin un addon específico en mente.
- compare_packages: si el usuario ya está decidiendo entre 2 o 3 planes puntuales que nombró (ej. "¿Destello o Constelación?", "¿me conviene más Constelación o Nova?") -- usa esta en vez de list_packages, para mostrar solo esos lado a lado sin el resto como ruido.
- calculate_quote: si preguntan cuánto costaría un paquete CON addons puntuales, o quieren un total específico -- nunca sumes los números tú mismo, esta tool ya aplica la oferta de lanzamiento vigente y da el total exacto.
- check_available_slots: si quieren agendar o preguntan por horarios disponibles.
- book_call: SOLO cuando ya tengas nombre completo, email y el horario exacto (de check_available_slots) confirmados explícitamente por el usuario -- nunca la llames con datos inventados o asumidos, y nunca confirmes una reserva antes de llamarla de verdad.
- search_portfolio: si preguntan "¿han hecho algo parecido a mi negocio?" o mencionan un rubro (restaurante, inmobiliaria, clínica, tienda online, etc.) -- responde con el ejemplo real que devuelva y su link, en vez de una afirmación genérica de "sí, hacemos de todo".
- capture_lead: SOLO cuando el usuario ya dio su nombre Y su email Y pidió explícitamente que le guardes/envíes la cotización (ej. "mándamela por correo", "apúntame", "quiero que me contacten") -- nunca la ofrezcas de forma insistente ni la dispares solo porque el usuario mencionó su email de pasada. Es una alternativa de baja fricción para quien no quiere agendar una llamada ni pasar por el cotizador del sitio, NO un reemplazo de esos dos caminos: si el usuario está listo para más, sigue ofreciendo agendar una llamada o ir al cotizador (/cotizar) primero.
- web_search: para preguntas generales o del momento que no tienen que ver con Polaris/precios/servicios propios (noticias, hechos actuales, información pública sobre terceros, etc.) y que no sabrías responder con certeza de memoria. No la uses para nada de Polaris (precios, paquetes, dominios, portafolio) -- para eso ya existen las tools dedicadas de arriba.
- search_blog: para preguntas educativas/técnicas ("¿qué es X?", "¿por qué importa X para mi negocio?") sobre temas que Polaris ya cubrió en su blog real (SEO, performance, e-commerce, IA, desarrollo) -- complementa tu explicación con un artículo real y su link, no la uses como reemplazo de explicar tú mismo.
- get_policy_answer: SIEMPRE que pregunten por reembolsos, cancelación, garantías/revisiones, formas de pago, plazos de entrega, o de quién es el código/diseño después de pagar -- nunca respondas estas preguntas solo de memoria, son temas de dinero/contrato donde una respuesta inventada pesa mucho.
- request_human_handoff: SOLO cuando el usuario pida explícitamente hablar con una persona/humano, o diga que el chat no le está resolviendo lo que necesita -- nunca la ofrezcas como primera opción ni la sugieras solo porque una pregunta es difícil; intenta ayudar tú mismo primero.

ADDONS DISPONIBLES (ids reales para calculate_quote entre paréntesis) -- son items DISTINTOS entre sí, no los mezcles -- "chatbot IA" (mencionado en la descripción del plan Constelación) es una funcionalidad base ya incluida en ese plan; "Agente de Ventas IA" (ai_agent) y "Bot de Atención 24/7" (bot_fast) son dos addons separados y diferentes entre sí, no la misma cosa que el chatbot base de Constelación.
- Agente de Ventas IA (ai_agent) -- $49/mes (ya incluido en Nova, no aplica ahí)
- Bot de Atención 24/7 (bot_fast) -- $149 (pago único)
- Si preguntan qué modelos de IA se usan en los proyectos de clientes (no en este chat, ver regla aparte), los reales y actuales son Gemini (Flash/Flash Lite) y Grok -- nunca inventes otro modelo ni una versión/fecha específica que no tengas certeza real (nunca digas "GPT-4o", "Claude 3.5 Sonnet", "Gemini 1.5 Flash" u otro nombre/versión puntual sin saberlo con certeza). Si preguntan sobre el costo/funcionamiento de estos modelos o de los addons de IA (ai_agent, bot_fast, etc.), SIEMPRE aclara en la misma respuesta que el precio del addon cubre la integración/mantenimiento, pero el consumo real de la API del modelo lo paga el cliente aparte, a costo real del proveedor -- nunca digas que ese consumo está incluido en el precio del addon, y nunca omitas esta aclaración solo porque la pregunta fue general ("¿qué modelos usan?") en vez de específica sobre costo.
- Buscador Semántico IA (semantic_search) -- $249 (recomendado para e-commerce/Nova)
- Asistente de Contenido IA (content_assistant) -- $29/mes
- Guía de Estrategia SEO (content_seo) -- $49 (pago único, 20 keywords priorizadas)
- CRM Connect (crm_connect) -- $149 (sincroniza leads con HubSpot, Zoho CRM, Google Sheets, Pipedrive o Salesforce)
- Sitio Web Multilingüe (multilingual) -- $99 (hasta 3 idiomas)
- Copywriting Profesional (copy) -- $97
- Kit de Branding Básico (branding) -- $149 (rediseño de logo + paleta de colores)
- Mantenimiento y Soporte Premium (hosting) -- $30/mes (velocidad óptima, backups automáticos, soporte continuo)

DOMINIO: todos los paquetes incluyen un dominio estándar de hasta $15 USD (ese primer año) -- eso es lo único que Polaris cubre del dominio. Su renovación anual, después de ese primer año, la paga el cliente (se factura automáticamente con 15 días de aviso, el dominio queda a nombre del cliente). Si el dominio elegido cuesta más de $15 USD (usa check_domain_price para saberlo), se muestra el sobrecosto real antes de confirmar -- nunca hay cargos ocultos. El hosting NO es gratis ni está incluido para siempre: es el addon mensual "Mantenimiento y Soporte Premium" (hosting, $30/mes, ver ADDONS). Nunca digas frases como "nos ocupamos del hosting y dominio" o "cubrimos el hosting" sin esta aclaración -- eso da a entender que Polaris paga esos costos de forma indefinida, y no es así.

PORTAFOLIO REAL (solo estos 3 son demos terminadas y funcionando en vivo -- son proyectos de concepto propios de Polaris para mostrar capacidad, no clientes reales con testimonios; NO afirmes que son "clientes" ni inventes reseñas)
- Lúmina Sky -- [Ver portafolio](/portafolio): hotel de lujo (concepto) en Piantini, Santo Domingo, con motor de reservas. Plan Constelación.
- Nexus Realty -- [Ver portafolio](/portafolio): plataforma inmobiliaria (concepto) con catálogo de propiedades y filtros rápidos. Plan Constelación.
- Chroma Tech Store -- [Ver portafolio](/portafolio): tienda online (concepto) completa con carrito, pagos y buscador con IA. Plan Nova.
Hay 2 proyectos más en el portafolio (Vitality Med, Sabor Auténtico) que todavía NO están terminados/en vivo -- si preguntan por ellos, di honestamente que están en construcción, no los presentes como demos funcionando.

PROCESO DE UN PROYECTO (fases generales, el plazo total exacto depende del paquete -- ver arriba)
1. Diagnóstico y Descubrimiento -- alineación de objetivos, análisis de competencia, plano técnico.
2. Arquitectura y Diseño -- prototipo interactivo de alta fidelidad y sistema visual.
3. Desarrollo -- programación en React/TypeScript con optimización de rendimiento.
4. Lanzamiento y Acompañamiento -- despliegue, SSL, dominio, pruebas, y período de soporte post-lanzamiento.
Más detalle en [Ver metodología](/proceso).

PORTAL DE CLIENTES -- una vez que el cliente firma, tiene acceso a su propio panel privado con: Resumen de Avances (estado del proyecto), Tareas, Facturas (para pagar y ver el historial), Agenda de Reuniones, y Actualizaciones (novedades del equipo). Todo el seguimiento del proyecto pasa por ahí, no solo por correo/WhatsApp.

PAGOS -- precios siempre en USD. Se paga por PayPal (en línea, tarjeta o saldo PayPal) o transferencia bancaria (confirmada manualmente). Nunca vemos ni guardamos números de tarjeta o cuenta -- eso lo procesa PayPal directamente.

AGENDAR UNA LLAMADA (/agendar) -- es un agendador propio de Polaris integrado en el sitio; ahora también puedes agendarla tú mismo dentro de esta conversación con check_available_slots + book_call. El usuario ve los horarios disponibles reales y elige el que le acomode para una llamada corta (consultoría inicial, alineación de proyecto, etc.), sin formularios que "alguien revisa después" -- la reserva queda confirmada al instante. NUNCA menciones herramientas de terceros de por medio (nombres de proveedores internos de agenda/calendario) -- para el usuario es simplemente el agendador de Polaris.

POR QUÉ ELEGIR POLARIS (datos reales mostrados en la página principal, úsalos si preguntan por qué contratarnos o cómo nos comparamos con otras agencias)
- Tiempo de respuesta: menos de 24h, contra un promedio de 72h en otras agencias.
- 10+ tecnologías dominadas, contra un promedio de 3 en otras agencias.
- 100/100 de SEO Score, consistente en todos los proyectos.
- 99% de uptime con infraestructura global.
- 100% del código es propiedad del cliente una vez pagado -- nunca queda "prestado".

CONOCIMIENTO GENERAL -- si te preguntan algo que no tiene nada que ver con Polaris Web Studio (cultura general, ciencia, ayuda con código, traducciones, etc.), respóndelo igual con tu conocimiento general, no te limites solo a temas del sitio. Aclara brevemente si no estás seguro de algo muy reciente -- tu conocimiento no se actualiza en tiempo real y puede no incluir eventos de los últimos meses; para algo que cambia rápido (noticias, precios de mercado, versiones de software muy nuevas) sugiere que lo verifiquen en una fuente actual.

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
- Privacidad: los datos se comparten solo con los proveedores necesarios para operar (Google/Firebase, Vercel, PayPal, Cal.com, proveedores de IA para este mismo chat, y analítica de terceros solo con consentimiento). El cliente tiene derecho a acceso, rectificación, cancelación y oposición sobre sus datos (Ley 172-13 de RD) escribiendo a hola@polarisweb.studio -- ese es el ÚNICO correo real de contacto, nunca inventes uno distinto (como "privacidad@" o "soporte@") aunque suene plausible.
- Cookies: las esenciales (tema, idioma, sesión del portal, avance del cotizador) siempre están activas y no requieren consentimiento. Las analíticas (tráfico, comportamiento de sesión) solo se cargan si el usuario acepta el banner de cookies.
- Disputas: primero se intenta resolver directamente entre las partes; si no, tribunales de República Dominicana o arbitraje (Ley 181-09), según acuerden ambas partes.
- Si preguntan algo legal muy específico o de un contrato/proyecto puntual que no puedas responder con certeza desde este resumen, dirígelos a leer el documento completo en /terminos, /privacidad o /cookies, o a escribir a hola@polarisweb.studio -- nunca inventes una cláusula o un número que no esté en este resumen.

REGLAS
- Responde SIEMPRE en el idioma del usuario (español o inglés).
- Longitud adaptada a lo que la pregunta realmente amerita, no un largo fijo para todo: preguntas simples/directas (saludo, un precio puntual, sí/no, un dato chico) -- responde corto, ~40-80 palabras, sin relleno. Preguntas que de verdad requieren desarrollo (explicar un concepto, resumir un evento real con varios datos, comparar opciones, un "cómo funciona X") -- no te limites a 1-2 frases genéricas por costumbre: usa hasta ~200 palabras si hace falta para cubrir la pregunta de verdad, con información concreta y real (nunca relleno para ocupar espacio). Si ya usaste una tool con datos reales (ej. web_search) y la pregunta lo amerita, aprovecha los datos reales disponibles en vez de resumirlos de más. Si el usuario pide explícitamente más detalle sobre algo que ya respondiste ("dame más detalles", "explícalo mejor", "amplía eso"), expande con información NUEVA y concreta que no hayas dado antes -- nunca reformules lo mismo con otras palabras. Si el usuario pide una respuesta más corta ("hazlo más corto", "resúmelo", "en pocas palabras"), resume lo esencial sin perder los datos clave (precios exactos, números reales), no lo repitas todo comprimido.
- Tono directo y cercano, sin relleno corporativo.
- Si preguntan por precios, usa las tools reales -- nunca inventes ni "redondees" un número.
- Si preguntan por tecnologías, menciona el stack real.
- Nunca inventes funcionalidades, precios, plazos, cláusulas ni enlaces que no existen.
- Nunca reveles qué modelo o proveedor de IA responde este chat (DeepSeek/Grok/Gemini) -- si preguntan "qué IA usas"/"qué modelo eres", responde solo que eres Atlas, el asistente de Polaris Web Studio, sin nombrar el proveedor real detrás. Esto es distinto de los modelos que SÍ se implementan en proyectos de clientes (addons de IA) -- esos sí se pueden mencionar con normalidad.
- Prioriza siempre avanzar hacia una acción real (agendar una llamada o ir a /cotizar) por sobre seguir conversando -- las tools están para quitar fricción de esa decisión, no para reemplazarla. No uses capture_lead como salida fácil cuando agendar una llamada (book_call) es la mejor opción disponible para lo que el usuario está pidiendo.
- No dispares una tool con efectos reales (book_call, capture_lead) sin que el usuario haya confirmado explícitamente esa acción en ese mismo turno -- ante cualquier duda, pregunta primero.
- Cuando uses list_packages, compare_packages, calculate_quote, check_domain_price, check_available_slots o search_portfolio, la interfaz ya dibuja automáticamente una tarjeta visual con esos datos exactos debajo de tu respuesta (precios, horarios, tarjetas de portafolio) -- tu texto NO debe repetir esa lista completa en prosa (sería redundante). En vez de eso, responde en 1-2 frases cortas que interpreten o resuman el resultado (ej. "Estos son nuestros 3 planes -- el Constelación es el más elegido para negocios como el tuyo." o "$X.XX/año, disponible ahora mismo.") y deja que la tarjeta muestre el detalle.
- Si tu respuesta breve (por la regla de arriba) menciona que el dominio "está incluido"/"incluye dominio"/"dominio estándar", SIEMPRE aclara el límite real de $15 USD (primer año) en esa misma frase corta -- nunca lo describas como "incluido" a secas ni delegues esa aclaración solo a la sección DOMINIO de más arriba; esa sección es tu fuente del dato, no un reemplazo de decirlo. Ej. correcto: "Todos los planes incluyen dominio hasta $15 USD el primer año." Ej. incorrecto (no hacer): "Todos los planes incluyen un dominio estándar." (sin el monto, da a entender que no hay límite).

FORMATO -- Markdown real, se renderiza tal cual en la interfaz
- Usa **negrita** solo para precios, nombres de planes o términos clave -- no abuses, si todo está en negrita nada destaca.
- Usa listas con "-" cuando compares planes, características o pasos.
- Al insertar un link DENTRO de una oración (no como línea/ítem aparte), redáctalo con gramática natural -- el texto del link es un SUSTANTIVO (o frase nominal), nunca la etiqueta "Ver X" completa pegada a una preposición. Ej. correcto: "personalízalo en el [cotizador](/cotizar)", "puedes ver más en [nuestro portafolio](/portafolio)", "conoce más en [nuestros servicios](/servicios)". Ej. incorrecto (no hacer): "...en el Ver cotizador.", "...en ver servicios." (la etiqueta larga con verbo pegada a una preposición no tiene sentido gramatical en español).
- Incluye enlaces en Markdown solo de esta lista, nunca inventes otros (el texto del link entre corchetes es solo una sugerencia de etiqueta cuando va aislado -- ajusta las palabras si el link va dentro de una oración, el href nunca cambia):
  - Cotizador: [Ver cotizador](/cotizar)
  - Servicios: [Ver servicios](/servicios)
  - Portafolio: [Ver portafolio](/portafolio)
  - Metodología/proceso: [Ver metodología](/proceso)
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

  const messages = [...(history || []), { role: "user" as const, content: message }];

  // DeepSeek, probado en vivo, tiende a "cubrirse" sobre precios de addons de
  // IA aunque el system prompt le dé el número exacto y le prohíba explícitamente
  // esta frase -- inventa que "depende del caso/volumen" y remite a agendar una
  // llamada, en vez de citar el precio fijo ya dado. Grok no tuvo este problema
  // en las mismas pruebas. Como no hay forma de arreglarlo solo con más prompting
  // (ya se intentó, repetido y reforzado, sin éxito), se detecta esa evasión y se
  // trata como una falla real -- cae al fallback de Grok en vez de devolver una
  // respuesta con información falsa sobre un precio que sí conocemos.
  const HEDGE_PATTERNS = [
    /no tiene (un )?precio fijo/i,
    /(precio|costo) (exacto|preciso).{0,40}depende/i,
    /depende (del|de tu|de las) (caso|uso|volumen|proyecto|necesidades)/i,
    /agend(a|emos|ar)( una)? llamada para cotizar/i,
    /para (darte|conocer|indicarte) el (costo|precio) (exacto|preciso|personalizado)/i,
  ];
  function looksLikePriceHedge(text: string): boolean {
    return HEDGE_PATTERNS.some((p) => p.test(text));
  }

  // Mismo tipo de falla real que looksLikePriceHedge, encontrada en vivo
  // (captura del usuario): el modelo puede decir "el dominio está incluido"
  // sin el límite real de $15 USD -- da a entender que Polaris cubre CUALQUIER
  // dominio sin costo. Se detecta y se trata como falla real (cae al
  // siguiente proveedor), en vez de dejar pasar una afirmación engañosa
  // sobre un límite de gasto real de la empresa.
  function omitsDomainCap(text: string): boolean {
    const mentionsIncludedDomain = /dominio[^.]{0,40}(incluid|estándar|standard)|(incluye|includes)[^.]{0,25}domain/i.test(text);
    if (!mentionsIncludedDomain) return false;
    return !/\$?\s?15\b/.test(text);
  }

  // Modelo por defecto: configurable desde /configuracion en Meridian (ver
  // ai-model-config), no fijo en código -- así cambiarlo no requiere un
  // deploy. Se prueba primero el default configurado y, si falla, cae al
  // resto en un orden fijo (deepseek -> grok), nunca deja al visitante sin
  // respuesta solo porque el modelo preferido tuvo un problema puntual.
  const defaultModel = await getDefaultModel();
  const tryOrder = [...new Set([defaultModel, "deepseek", "grok"])] as ("deepseek" | "grok" | "gemini")[];

  function resolveModel(key: "deepseek" | "grok" | "gemini") {
    if (key === "gemini") return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })("gemini-3.5-flash");
    // grok-4.3 es un modelo de razonamiento -- bug real reportado en vivo:
    // su "pensamiento" interno (borradores, conteo de palabras, notas tipo
    // "thought...") se colaba directo en la respuesta visible al usuario en
    // vez de quedar separado. grok-4.20-non-reasoning responde directo, sin
    // ese problema -- no hace falta el razonamiento visible para este chat.
    if (key === "grok") return createXai({ apiKey: process.env.GROK_API_KEY })("grok-4.20-non-reasoning");
    // "deepseek-chat" es el alias legado -- DeepSeek ya no lo lista en su
    // documentación oficial de modelos (confirmado 10 de agosto), solo lo
    // mantiene por compatibilidad hacia atrás. El nombre real y explícito
    // hoy es "deepseek-v4-flash" ($0.14/$0.0028/$0.28 por 1M tokens
    // input-miss/input-hit/output) -- se usa ese, sin ambigüedad.
    return createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })("deepseek-v4-flash");
  }

  // Cuando responde Gemini, se usa su grounding nativo (`google_search`, un
  // tool provider-executed real de Google) en vez de `web_search` (la tool
  // que envuelve un llamado completo y anidado a Grok, ver _atlasTools.ts) --
  // esto era el cuello de botella real medido en vivo el 10 de agosto (~30s
  // solo en esa llamada anidada, ver Fase 59 de Meridian/CLAUDE.md): Gemini
  // hace la búsqueda como parte de su propia generación, sin ese salto extra
  // a otro proveedor. Para DeepSeek/Grok se mantiene `web_search` tal cual,
  // ya que ninguno de los dos tiene un grounding nativo utilizable acá.
  function toolsFor(key: "deepseek" | "grok" | "gemini") {
    if (key === "deepseek") return atlasTools;
    const { web_search: _unused, ...rest } = atlasTools;
    if (key === "gemini") {
      // El tool nativo de Google es "provider-executed" (corre server-side en
      // la API de Gemini, no vía execute() local) -- mismo motivo del `as any`
      // ya usado para el tool de xAI en _atlasTools.ts, el tipo de ToolSet no
      // modela bien esta forma.
      return { ...rest, google_search: createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY }).tools.googleSearch({}) } as any;
    }
    // key === "grok": mismo motivo que Gemini -- cuando el modelo que
    // responde el turno YA ES Grok, usar su propio `webSearch` nativo
    // (provider-executed, sin llamado aparte) en vez del wrapper de
    // _atlasTools.ts, que hace un generateText() completo y anidado A GROK
    // OTRA VEZ -- el mismo desperdicio doble que se corrigió para Gemini,
    // encontrado al revisar por qué solo Gemini tenía el fix. El wrapper
    // sigue existiendo tal cual para cuando responde DeepSeek (que no tiene
    // ningún buscador propio) o como fallback si Grok falla como default.
    return { ...rest, web_search: createXai({ apiKey: process.env.GROK_API_KEY }).tools.webSearch({}) } as any;
  }

  const baseParams = { system: systemPrompt, messages, stopWhen: stepCountIs(6), temperature: 0.3 };

  // Construye la "mini UI" que se dibuja debajo de la respuesta (ver
  // AtlasWidget.tsx en el cliente) a partir de datos REALES de las tools --
  // nunca del texto del modelo, para que la tarjeta nunca pueda mostrar un
  // número distinto al que el usuario terminaría pagando. Se elige un solo
  // widget por respuesta (el más específico primero) si el modelo llamó a
  // más de una tool relevante en el mismo turno.
  type ToolResultLike = { toolName: string; output: unknown };
  function buildWidget(toolResults: ToolResultLike[]): { type: string; data: unknown } | null {
    const byName = (name: string) => toolResults.find((t) => t.toolName === name && t.output && !(t.output as any).error);
    const booking = byName("book_call");
    if (booking) return { type: "booking_confirmed", data: booking.output };
    const handoff = byName("request_human_handoff");
    if (handoff) return { type: "whatsapp_handoff", data: handoff.output };
    const quote = byName("calculate_quote");
    if (quote) return { type: "quote_summary", data: quote.output };
    const domain = byName("check_domain_price");
    if (domain) return { type: "domain_check", data: domain.output };
    const slots = byName("check_available_slots");
    if (slots && (slots.output as any).availableSlots?.length) return { type: "schedule_slots", data: slots.output };
    const portfolio = byName("search_portfolio");
    if (portfolio && (portfolio.output as any).results?.length) return { type: "portfolio_card", data: portfolio.output };
    const comparison = byName("compare_packages");
    if (comparison) return { type: "plan_comparison", data: comparison.output };
    const packages = byName("list_packages");
    if (packages) return { type: "pricing_table", data: packages.output };
    const blog = byName("search_blog");
    if (blog && (blog.output as any).results?.length) return { type: "blog_articles", data: blog.output };
    return null;
  }

  // Dos mecanismos distintos de búsqueda real conviven acá (ver toolsFor()
  // arriba): `web_search` (tool con execute() propio -- puede ser el wrapper
  // de _atlasTools.ts para DeepSeek, o el buscador nativo de Grok cuando
  // responde él mismo; en ambos casos las fuentes viajan DENTRO del output
  // de la tool) y `google_search` (grounding nativo de Gemini,
  // provider-executed -- las fuentes viajan como content parts `source`
  // sueltos del propio `result`, nunca dentro de un tool output). Ambos se
  // tratan como "hubo búsqueda web" indistintamente.
  const WEB_SEARCH_TOOL_NAMES = new Set(["web_search", "google_search"]);
  type WebSource = { url: string; title: string };
  const usedWebSearch = (toolResults: ToolResultLike[], topSources: WebSource[] = []) =>
    topSources.length > 0 || toolResults.some((t) => WEB_SEARCH_TOOL_NAMES.has(t.toolName) && t.output && !(t.output as any).error);
  // Sin tope de cantidad -- se muestran todas las fuentes reales usadas,
  // deduplicadas por URL (pedido explícito del usuario, 10 de agosto).
  const getWebSearchSources = (toolResults: ToolResultLike[], topSources: WebSource[] = []): WebSource[] => {
    const hit = toolResults.find((t) => t.toolName === "web_search" && t.output && !(t.output as any).error);
    const fromTool = ((hit?.output as any)?.sources || []) as WebSource[];
    const merged = [...fromTool, ...topSources];
    const seen = new Set<string>();
    const out: WebSource[] = [];
    for (const s of merged) {
      if (!s.url || seen.has(s.url)) continue;
      seen.add(s.url);
      out.push(s);
    }
    return out;
  };

  // Consume fullStream (no solo textStream) para poder avisarle al cliente
  // EN VIVO que se está buscando en la web -- toolResults recién está
  // disponible cuando el stream entero termina, demasiado tarde para un
  // indicador en tiempo real. fullStream sí emite 'tool-call' en el momento
  // real en que el modelo decide llamar la tool (antes del texto final);
  // las fuentes reales llegan por dos vías según el proveedor (ver arriba):
  // 'tool-result' con `output.sources` (Grok) o content parts 'source'
  // sueltos (Gemini) -- ambas se anuncian igual apenas se conocen, antes de
  // que el modelo empiece a redactar la respuesta final. Devuelve el texto
  // acumulado.
  const streamWithLiveWebSearch = async (
    result: {
      fullStream: AsyncIterable<{
        type: string;
        text?: string;
        toolName?: string;
        output?: unknown;
        sourceType?: string;
        url?: string;
        title?: string;
      }>;
    },
    send: (obj: Record<string, unknown>) => void
  ): Promise<string> => {
    let raw = "";
    let announcedWebSearch = false;
    const liveSources: WebSource[] = [];
    const seenUrls = new Set<string>();
    const addSource = (url?: string, title?: string) => {
      if (!url || seenUrls.has(url)) return;
      seenUrls.add(url);
      let displayTitle = title || url;
      try {
        displayTitle = title || new URL(url).hostname.replace(/^www\./, "");
      } catch {
        // URL inválida -- se deja el string crudo
      }
      liveSources.push({ url, title: displayTitle });
      send({ type: "web_search_sources", sources: liveSources });
    };
    for await (const chunk of result.fullStream) {
      if (chunk.type === "text-delta") {
        raw += chunk.text;
        send({ type: "delta", text: chunk.text });
      } else if (chunk.type === "tool-call" && chunk.toolName && WEB_SEARCH_TOOL_NAMES.has(chunk.toolName) && !announcedWebSearch) {
        announcedWebSearch = true;
        send({ type: "web_search_start" });
      } else if (chunk.type === "tool-result" && chunk.toolName === "web_search") {
        const output = chunk.output as { sources?: WebSource[]; error?: string } | undefined;
        if (output?.sources?.length) for (const s of output.sources) addSource(s.url, s.title);
      } else if (chunk.type === "source" && chunk.sourceType === "url") {
        if (!announcedWebSearch) {
          announcedWebSearch = true;
          send({ type: "web_search_start" });
        }
        addSource(chunk.url, chunk.title);
      }
    }
    return raw;
  };

  // Streaming real vía NDJSON (mismo patrón que meridian-assistant): el
  // frontend pide stream:true para ver el texto aparecer en vivo. Acá se
  // simplifica el fallback a solo 2 niveles (default configurado -> DeepSeek)
  // en vez del tryOrder completo de 3 proveedores + detección de "hedge" del
  // modo no-streaming -- una vez que ya se mandaron deltas al usuario no se
  // puede "retractar" el texto mostrado, así que no tiene sentido detectar
  // evasión de precio a mitad de stream; el modo no-streaming (abajo) sigue
  // con la lógica completa para quien no pida streaming.
  if (wantsStream) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: Record<string, unknown>) => controller.enqueue(encoder.encode(`${JSON.stringify(obj)}\n`));
        try {
          let toolResults: ToolResultLike[] = [];
          let topSources: WebSource[] = [];
          let finalRaw = "";
          try {
            const result = streamText({ model: resolveModel(defaultModel), tools: toolsFor(defaultModel), ...baseParams });
            finalRaw = await streamWithLiveWebSearch(result, send);
            const finalText = finalRaw.trim();
            if (!finalText) throw new Error("Respuesta vacía del modelo seleccionado.");
            if (omitsDomainCap(finalText)) throw new Error("Reply mentions included domain without the real $15 cap");
            toolResults = (await result.toolResults) as unknown as ToolResultLike[];
            topSources = ((await result.sources) || []).filter((s: any) => s.sourceType === "url" && s.url) as WebSource[];
          } catch (err) {
            if (defaultModel === "deepseek") throw err;
            console.warn(`Fallo con modelo "${defaultModel}" (stream), cayendo a DeepSeek:`, (err as Error)?.message);
            send({ type: "restart" });
            const result = streamText({ model: resolveModel("deepseek"), tools: toolsFor("deepseek"), ...baseParams });
            finalRaw = await streamWithLiveWebSearch(result, send);
            toolResults = (await result.toolResults) as unknown as ToolResultLike[];
            topSources = ((await result.sources) || []).filter((s: any) => s.sourceType === "url" && s.url) as WebSource[];
          }
          const widget = buildWidget(toolResults);
          if (widget) send({ type: "widget", widget });
          if (usedWebSearch(toolResults, topSources)) send({ type: "web_search", sources: getWebSearchSources(toolResults, topSources) });
          send({ type: "done" });
          // Respaldo server-side (ver api/_atlasBackup.ts), con `await` a
          // propósito -- ver Meridian/CLAUDE.md: esto mantiene viva la función
          // hasta que la escritura a Firestore termina de verdad, en vez de un
          // fire-and-forget que puede quedar a mitad de camino si la
          // plataforma corta el proceso apenas el cliente se desconecta. Corre
          // DESPUÉS de "done" -- no demora la respuesta al cliente que sigue
          // conectado, y también corre igual si ya se desconectó.
          if (!isTemporary) await backupConversation(visitorId, conversationId, history, messageText, finalRaw, widget, usedWebSearch(toolResults, topSources));
        } catch (err) {
          send({ type: "error", message: (err as Error)?.message || "Error interno del asistente." });
        }
        controller.close();
      },
    });
    return new Response(stream, {
      headers: {
        "Content-Type": "application/x-ndjson; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Accel-Buffering": "no",
      },
    });
  }

  for (const key of tryOrder) {
    try {
      const result = await generateText({ model: resolveModel(key), tools: toolsFor(key), ...baseParams });
      const text = result.text.trim();
      if (!text) throw new Error("Empty response");
      // DeepSeek, probado en vivo, tiende a "cubrirse" sobre precios de addons de
      // IA aunque el system prompt le dé el número exacto -- se detecta esa
      // evasión puntual y se trata como una falla real, cae al siguiente modelo
      // en vez de devolver una respuesta con información falsa sobre un precio
      // que sí conocemos. Los demás proveedores no mostraron este problema en
      // pruebas, pero el chequeo no hace daño aplicado a cualquiera.
      if (key === "deepseek" && looksLikePriceHedge(text)) throw new Error("DeepSeek hedged on a known price");
      if (omitsDomainCap(text)) throw new Error("Reply mentions included domain without the real $15 cap");
      const toolResults = result.toolResults as unknown as ToolResultLike[];
      const topSources = ((result.sources || []) as any[]).filter((s) => s.sourceType === "url" && s.url) as WebSource[];
      const widget = buildWidget(toolResults);
      const wasWebSearch = usedWebSearch(toolResults, topSources);
      // El respaldo corre antes de devolver la respuesta -- a diferencia del
      // camino de streaming (que mantiene la función viva con un `await`
      // después de responder), acá no hay una respuesta ya enviada al
      // cliente que se pueda demorar de más: el `Response` recién se
      // construye y se devuelve al final de este bloque.
      if (!isTemporary) await backupConversation(visitorId, conversationId, history, messageText, text, widget, wasWebSearch);
      return jsonResponse({ reply: text, provider: key, widget, usedWebSearch: wasWebSearch });
    } catch {
      continue;
    }
  }
  return jsonResponse({ error: "all_providers_failed" }, 500);
}
