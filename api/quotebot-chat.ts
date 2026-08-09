import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateText, generateObject, streamText, stepCountIs } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { atlasTools } from "./_atlasTools.js";

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
// cambian. DeepSeek (deepseek-chat) como primario, xAI Grok como respaldo
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
function clientIp(req: VercelRequest): string {
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  return fwd.split(",")[0].trim() || "unknown";
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

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  if (rateLimited(clientIp(req), 30, 10 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }

  const { message, stream: wantsStream, titleOnly } = req.body || {};
  if (!message || typeof message !== "string") return res.status(400).json({ error: "Missing message" });
  if (message.length > MAX_MESSAGE_CHARS) return res.status(400).json({ error: "Message too long" });
  const history = sanitizeHistory((req.body || {}).history);

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
      const model = key === "gemini" ? google("gemini-3.5-flash") : key === "grok" ? xai("grok-4.3") : deepseek("deepseek-chat");
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
      return res.status(200).json({ title: title || null, icon: result.object.icon || null });
    } catch {
      return res.status(200).json({ title: null, icon: null });
    }
  }

  const systemPrompt = `Eres Atlas Assistant, el asistente de IA de Polaris Web Studio, una agencia de desarrollo web premium en Punta Cana, República Dominicana. Fundada por Cristian Dicen. Especializada en React, TypeScript, Vite, Tailwind CSS, Framer Motion e integraciones de IA. Respondes tanto en el widget flotante del sitio como en la página completa de chat ("/asistente").

Planes disponibles:
- Destello (id: landing): $299 USD -- Landing page 1 página, entrega 1-2 semanas
- Constelación (id: corporate): $699 USD -- Web corporativa hasta 5 páginas, chatbot IA, entrega 2-4 semanas
- Nova (id: ecommerce): $1,299 USD -- E-commerce + panel admin + herramienta IA, entrega 4-6 semanas

Contacto: hola@polarisweb.studio | +1 (829) 920-0544 | @polariswebstudio | Punta Cana, RD

TOOLS REALES DISPONIBLES -- úsalas siempre que apliquen, en vez de inventar o recordar un número. Las tools son para dar información exacta y avanzar la conversación hacia una acción real (cotizar, agendar, dejar el lead) -- nunca para alargar la charla con datos de más que el usuario no pidió:
- check_domain_price: si preguntan por el precio/disponibilidad de un dominio específico.
- list_packages: si preguntan por los planes/precios EN GENERAL (comparar los 3, "¿cuánto cuesta?", "¿qué planes tienen?") sin un addon específico en mente.
- calculate_quote: si preguntan cuánto costaría un paquete CON addons puntuales, o quieren un total específico -- nunca sumes los números tú mismo, esta tool ya aplica la oferta de lanzamiento vigente y da el total exacto.
- check_available_slots: si quieren agendar o preguntan por horarios disponibles.
- book_call: SOLO cuando ya tengas nombre completo, email y el horario exacto (de check_available_slots) confirmados explícitamente por el usuario -- nunca la llames con datos inventados o asumidos, y nunca confirmes una reserva antes de llamarla de verdad.
- search_portfolio: si preguntan "¿han hecho algo parecido a mi negocio?" o mencionan un rubro (restaurante, inmobiliaria, clínica, tienda online, etc.) -- responde con el ejemplo real que devuelva y su link, en vez de una afirmación genérica de "sí, hacemos de todo".
- capture_lead: SOLO cuando el usuario ya dio su nombre Y su email Y pidió explícitamente que le guardes/envíes la cotización (ej. "mándamela por correo", "apúntame", "quiero que me contacten") -- nunca la ofrezcas de forma insistente ni la dispares solo porque el usuario mencionó su email de pasada. Es una alternativa de baja fricción para quien no quiere agendar una llamada ni pasar por el cotizador del sitio, NO un reemplazo de esos dos caminos: si el usuario está listo para más, sigue ofreciendo agendar una llamada o ir al cotizador (/cotizar) primero.

ADDONS DISPONIBLES (ids reales para calculate_quote entre paréntesis) -- son items DISTINTOS entre sí, no los mezcles -- "chatbot IA" (mencionado en la descripción del plan Constelación) es una funcionalidad base ya incluida en ese plan; "Agente de Ventas IA" (ai_agent) y "Bot de Atención 24/7" (bot_fast) son dos addons separados y diferentes entre sí, no la misma cosa que el chatbot base de Constelación.
- Agente de Ventas IA (ai_agent) -- $49/mes (ya incluido en Nova, no aplica ahí)
- Bot de Atención 24/7 (bot_fast) -- $149 (pago único)
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
- Privacidad: los datos se comparten solo con los proveedores necesarios para operar (Google/Firebase, Vercel, PayPal, Cal.com, Google Gemini/xAI Grok para este mismo chat, y analítica de terceros solo con consentimiento). El cliente tiene derecho a acceso, rectificación, cancelación y oposición sobre sus datos (Ley 172-13 de RD) escribiendo a privacidad@polarisweb.studio.
- Cookies: las esenciales (tema, idioma, sesión del portal, avance del cotizador) siempre están activas y no requieren consentimiento. Las analíticas (tráfico, comportamiento de sesión) solo se cargan si el usuario acepta el banner de cookies.
- Disputas: primero se intenta resolver directamente entre las partes; si no, tribunales de República Dominicana o arbitraje (Ley 181-09), según acuerden ambas partes.
- Si preguntan algo legal muy específico o de un contrato/proyecto puntual que no puedas responder con certeza desde este resumen, dirígelos a leer el documento completo en /terminos, /privacidad o /cookies, o a escribir a hola@polarisweb.studio -- nunca inventes una cláusula o un número que no esté en este resumen.

REGLAS
- Responde SIEMPRE en el idioma del usuario (español o inglés).
- Máximo 80 palabras en el cuerpo de la respuesta (sin contar el bloque de sugerencias).
- Tono directo y cercano, sin relleno corporativo.
- Si preguntan por precios, usa las tools reales -- nunca inventes ni "redondees" un número.
- Si preguntan por tecnologías, menciona el stack real.
- Nunca inventes funcionalidades, precios, plazos, cláusulas ni enlaces que no existen.
- Prioriza siempre avanzar hacia una acción real (agendar una llamada o ir a /cotizar) por sobre seguir conversando -- las tools están para quitar fricción de esa decisión, no para reemplazarla. No uses capture_lead como salida fácil cuando agendar una llamada (book_call) es la mejor opción disponible para lo que el usuario está pidiendo.
- No dispares una tool con efectos reales (book_call, capture_lead) sin que el usuario haya confirmado explícitamente esa acción en ese mismo turno -- ante cualquier duda, pregunta primero.
- Cuando uses list_packages, calculate_quote, check_domain_price, check_available_slots o search_portfolio, la interfaz ya dibuja automáticamente una tarjeta visual con esos datos exactos debajo de tu respuesta (precios, horarios, tarjetas de portafolio) -- tu texto NO debe repetir esa lista completa en prosa (sería redundante). En vez de eso, responde en 1-2 frases cortas que interpreten o resuman el resultado (ej. "Estos son nuestros 3 planes -- el Constelación es el más elegido para negocios como el tuyo." o "$X.XX/año, disponible ahora mismo.") y deja que la tarjeta muestre el detalle.
- Si tu respuesta breve (por la regla de arriba) menciona que el dominio "está incluido"/"incluye dominio"/"dominio estándar", SIEMPRE aclara el límite real de $15 USD (primer año) en esa misma frase corta -- nunca lo describas como "incluido" a secas ni delegues esa aclaración solo a la sección DOMINIO de más arriba; esa sección es tu fuente del dato, no un reemplazo de decirlo. Ej. correcto: "Todos los planes incluyen dominio hasta $15 USD el primer año." Ej. incorrecto (no hacer): "Todos los planes incluyen un dominio estándar." (sin el monto, da a entender que no hay límite).

FORMATO -- Markdown real, se renderiza tal cual en la interfaz
- Usa **negrita** solo para precios, nombres de planes o términos clave -- no abuses, si todo está en negrita nada destaca.
- Usa listas con "-" cuando compares planes, características o pasos.
- Al insertar un link DENTRO de una oración (no como línea/ítem aparte), redáctalo con gramática natural -- ej. "personalízalo en el [cotizador](/cotizar)" o "puedes ver más en [nuestro portafolio](/portafolio)". Nunca insertes la etiqueta larga tal cual ("...en el Ver cotizador.") en medio de una frase, eso lee mal en español.
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
    if (key === "grok") return createXai({ apiKey: process.env.GROK_API_KEY })("grok-4.3");
    return createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })("deepseek-chat");
  }

  const baseParams = { system: systemPrompt, messages, tools: atlasTools, stopWhen: stepCountIs(6), temperature: 0.3 };

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
    const quote = byName("calculate_quote");
    if (quote) return { type: "quote_summary", data: quote.output };
    const domain = byName("check_domain_price");
    if (domain) return { type: "domain_check", data: domain.output };
    const slots = byName("check_available_slots");
    if (slots && (slots.output as any).availableSlots?.length) return { type: "schedule_slots", data: slots.output };
    const portfolio = byName("search_portfolio");
    if (portfolio && (portfolio.output as any).results?.length) return { type: "portfolio_card", data: portfolio.output };
    const packages = byName("list_packages");
    if (packages) return { type: "pricing_table", data: packages.output };
    return null;
  }

  // Streaming real vía NDJSON (mismo patrón que meridian-assistant): el
  // frontend pide stream:true para ver el texto aparecer en vivo. Acá se
  // simplifica el fallback a solo 2 niveles (default configurado -> DeepSeek)
  // en vez del tryOrder completo de 3 proveedores + detección de "hedge" del
  // modo no-streaming -- una vez que ya se mandaron deltas al usuario no se
  // puede "retractar" el texto mostrado, así que no tiene sentido detectar
  // evasión de precio a mitad de stream; el modo no-streaming (abajo) sigue
  // con la lógica completa para quien no pida streaming.
  if (wantsStream) {
    res.setHeader("Content-Type", "application/x-ndjson; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("X-Accel-Buffering", "no");
    const send = (obj: Record<string, unknown>) => res.write(`${JSON.stringify(obj)}\n`);
    try {
      let toolResults: ToolResultLike[] = [];
      try {
        const result = streamText({ model: resolveModel(defaultModel), ...baseParams });
        for await (const delta of result.textStream) send({ type: "delta", text: delta });
        const finalText = (await result.text).trim();
        if (!finalText) throw new Error("Respuesta vacía del modelo seleccionado.");
        if (omitsDomainCap(finalText)) throw new Error("Reply mentions included domain without the real $15 cap");
        toolResults = (await result.toolResults) as unknown as ToolResultLike[];
      } catch (err) {
        if (defaultModel === "deepseek") throw err;
        console.warn(`Fallo con modelo "${defaultModel}" (stream), cayendo a DeepSeek:`, (err as Error)?.message);
        send({ type: "restart" });
        const result = streamText({ model: resolveModel("deepseek"), ...baseParams });
        for await (const delta of result.textStream) send({ type: "delta", text: delta });
        toolResults = (await result.toolResults) as unknown as ToolResultLike[];
      }
      const widget = buildWidget(toolResults);
      if (widget) send({ type: "widget", widget });
      send({ type: "done" });
    } catch (err) {
      send({ type: "error", message: (err as Error)?.message || "Error interno del asistente." });
    }
    res.end();
    return;
  }

  for (const key of tryOrder) {
    try {
      const result = await generateText({ model: resolveModel(key), ...baseParams });
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
      const widget = buildWidget(result.toolResults as unknown as ToolResultLike[]);
      return res.status(200).json({ reply: text, provider: key, widget });
    } catch {
      continue;
    }
  }
  return res.status(500).json({ error: "all_providers_failed" });
}
