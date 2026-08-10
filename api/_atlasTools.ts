import { tool, generateText } from "ai";
import { z } from "zod";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { BLOG_POSTS } from "../src/data/blogData.js";

// Tools reales para Atlas Assistant (AI SDK, function calling real) --
// reemplazan hechos estáticos incrustados en el system prompt por consultas
// en vivo, mismo criterio ya usado en Meridian (domains-status, etc.).

// ---- 1. Precio real de un dominio (misma API que /dominios en Meridian) ----
const PORKBUN_API_KEY = process.env.PORKBUN_API_KEY;
const PORKBUN_SECRET_KEY = process.env.PORKBUN_SECRET_KEY;

export const checkDomainPrice = tool({
  description:
    "Consulta en vivo si un dominio está disponible para comprar y su precio real (primer año y renovación), vía la API real de Porkbun. Úsala siempre que el usuario pregunte por un dominio específico -- nunca inventes un precio de dominio.",
  inputSchema: z.object({
    domain: z.string().describe("El dominio completo a consultar, ej. 'miempresa.com' o 'restaurante.click'."),
  }),
  execute: async ({ domain }) => {
    if (!PORKBUN_API_KEY || !PORKBUN_SECRET_KEY) {
      return { error: "No se pudo consultar el precio del dominio en este momento." };
    }
    try {
      const res = await fetch(`https://api.porkbun.com/api/json/v3/domain/checkDomain/${encodeURIComponent(domain)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apikey: PORKBUN_API_KEY, secretapikey: PORKBUN_SECRET_KEY }),
      });
      const json = await res.json();
      if (json.status !== "SUCCESS") return { error: json.message || "No se pudo consultar el dominio." };
      const r = json.response;
      return {
        domain,
        available: r.avail === "yes",
        firstYearPrice: Number(r.price),
        renewalPrice: Number(r.additional?.renewal?.price ?? r.price),
        premium: r.premium === "yes",
      };
    } catch {
      return { error: "No se pudo consultar el precio del dominio en este momento." };
    }
  },
});

// ---- 2. Cotización real (paquetes/addons reales, mismos que usa el cotizador) ----
// Duplicado de las constantes reales de precios (mismo patrón ya aceptado en
// la cuenta para PACKAGES/ADDONS -- ver Meridian/cloud-functions/proposal-send).
// La oferta de lanzamiento (-25%) es la vigente hoy en Remote Config -- esta
// función serverless de Vercel no tiene acceso a credenciales de GCP para
// leerlo en vivo (a diferencia de server.ts, que sí es un proceso de larga
// vida con eso ya resuelto), así que usa el valor conocido como fallback
// razonable, no como dato inventado.
const PACKAGES: Record<string, { name: string; price: number; timeline: string; highlights: string[] }> = {
  landing: {
    name: "Destello",
    price: 299,
    timeline: "1-2 semanas",
    highlights: ["Landing page de 1 página", "Diseño a medida, responsive", "SEO básico incluido"],
  },
  corporate: {
    name: "Constelación",
    price: 699,
    timeline: "2-4 semanas",
    highlights: ["Web corporativa hasta 5 páginas", "Chatbot IA incluido", "El más elegido"],
  },
  ecommerce: {
    name: "Nova",
    price: 1299,
    timeline: "4-6 semanas",
    highlights: ["E-commerce + panel admin", "1 herramienta IA incluida", "Catálogo ilimitado"],
  },
};

const ADDONS: Record<string, { label: string; price: number; isMonthly?: boolean }> = {
  ai_agent: { label: "Agente de Ventas IA", price: 49, isMonthly: true },
  bot_fast: { label: "Bot de Atención 24/7", price: 149 },
  semantic_search: { label: "Buscador Semántico IA", price: 249 },
  content_assistant: { label: "Asistente de Contenido IA", price: 29, isMonthly: true },
  content_seo: { label: "Guía de Estrategia SEO", price: 49 },
  crm_connect: { label: "CRM Connect", price: 149 },
  multilingual: { label: "Sitio Web Multilingüe", price: 99 },
  copy: { label: "Copywriting Profesional", price: 97 },
  branding: { label: "Kit de Branding Básico", price: 149 },
  hosting: { label: "Mantenimiento y Soporte Premium", price: 30, isMonthly: true },
};

const OFFER_DISCOUNT_PERCENT = 25;

export const calculateQuote = tool({
  description:
    "Calcula el precio real de un proyecto combinando un paquete (landing/corporate/ecommerce) con addons opcionales, aplicando la oferta de lanzamiento vigente. Úsala en vez de sumar los números tú mismo -- así el total siempre coincide exacto con lo que el cotizador real del sitio mostraría.",
  inputSchema: z.object({
    packageId: z.enum(["landing", "corporate", "ecommerce"]).describe("landing=Destello $299, corporate=Constelación $699, ecommerce=Nova $1299"),
    addonIds: z.array(z.enum(Object.keys(ADDONS) as [string, ...string[]])).optional().describe("IDs de addons a incluir, opcional."),
  }),
  execute: async ({ packageId, addonIds }) => {
    const pkg = PACKAGES[packageId];
    if (!pkg) return { error: "Paquete inválido." };
    const chosenAddons = (addonIds || []).map((id) => ({ id, ...ADDONS[id] })).filter((a) => a.label);
    const oneTimeAddons = chosenAddons.filter((a) => !a.isMonthly);
    const monthlyAddons = chosenAddons.filter((a) => a.isMonthly);
    const oneTimeSubtotal = pkg.price + oneTimeAddons.reduce((s, a) => s + a.price, 0);
    const discountAmount = Math.round(oneTimeSubtotal * (OFFER_DISCOUNT_PERCENT / 100));
    const oneTimeTotal = oneTimeSubtotal - discountAmount;
    const monthlyTotal = monthlyAddons.reduce((s, a) => s + a.price, 0);
    return {
      package: pkg.name,
      packagePrice: pkg.price,
      addons: chosenAddons.map((a) => ({ label: a.label, price: a.price, monthly: !!a.isMonthly })),
      offerDiscountPercent: OFFER_DISCOUNT_PERCENT,
      oneTimeSubtotal,
      discountAmount,
      oneTimeTotal,
      monthlyTotal,
    };
  },
});

// ---- 2.b. Los 3 planes reales, para una vista comparativa general ----
// Distinta de calculate_quote: esta no calcula un total con addons, solo
// devuelve los 3 planes reales tal cual -- el frontend la usa para dibujar
// una mini tabla/tarjetas comparativas dentro del chat (ver AtlasWidget.tsx)
// en vez de que el usuario tenga que leer los 3 precios en un párrafo.
export const listPackages = tool({
  description:
    "Devuelve los 3 planes reales de Polaris (Destello/Constelación/Nova) con precio, plazo real y highlights, para mostrar una comparación general. Úsala cuando el usuario pregunte por los planes/precios en general -- para un cálculo específico con addons, usa calculate_quote en su lugar.",
  inputSchema: z.object({}),
  execute: async () => ({
    offerDiscountPercent: OFFER_DISCOUNT_PERCENT,
    packages: Object.entries(PACKAGES).map(([id, p]) => ({ id, ...p })),
  }),
});

// ---- 2.c. Comparación enfocada de 2-3 planes puntuales ----
// Distinta de list_packages: esa siempre trae los 3 planes reales para una
// vista general; esta se usa cuando el usuario ya redujo la duda a 2 (o 3)
// planes concretos ("¿Destello o Constelación?") -- la tarjeta resultante
// solo muestra esos, lado a lado, sin el resto como ruido visual.
export const comparePackages = tool({
  description:
    "Compara 2 o 3 planes específicos que el usuario ya nombró, lado a lado (ej. '¿Destello o Constelación?', '¿cuál me conviene entre Constelación y Nova?'). Úsala en vez de list_packages cuando el usuario está decidiendo entre planes puntuales, no pidiendo la lista completa.",
  inputSchema: z.object({
    packageIds: z
      .array(z.enum(["landing", "corporate", "ecommerce"]))
      .min(2)
      .max(3)
      .describe("IDs de los planes a comparar: 'landing' (Destello), 'corporate' (Constelación), 'ecommerce' (Nova)."),
  }),
  execute: async ({ packageIds }) => ({
    offerDiscountPercent: OFFER_DISCOUNT_PERCENT,
    packages: packageIds.map((id) => ({ id, ...PACKAGES[id] })),
  }),
});

// ---- 3/4. Disponibilidad real y reserva real de llamada (Cal.com) ----
const BOOKING_URL = "https://calcom-booking-wdvfac6mgq-ue.a.run.app";

export const checkAvailableSlots = tool({
  description:
    "Consulta los próximos horarios reales disponibles para agendar una llamada con Polaris, vía el agendador real del sitio. Úsala siempre que el usuario quiera agendar o pregunte por disponibilidad -- nunca inventes horarios.",
  inputSchema: z.object({
    type: z.enum(["consulta", "proyecto"]).default("consulta").describe("Tipo de llamada: 'consulta' (breve, inicial) o 'proyecto' (alineación de un proyecto ya en marcha)."),
  }),
  execute: async ({ type }) => {
    try {
      const res = await fetch(`${BOOKING_URL}?action=slots&days=14&type=${type}`);
      const data = await res.json();
      const starts: string[] = [];
      Object.values(data.slots || {}).forEach((daySlots) => {
        (daySlots as { start: string }[]).forEach(({ start }) => starts.push(start));
      });
      return { availableSlots: starts.slice(0, 12) };
    } catch {
      return { error: "No se pudo consultar la disponibilidad real en este momento." };
    }
  },
});

export const bookCall = tool({
  description:
    "Agenda una llamada REAL con Polaris en un horario específico. Solo llámala cuando ya tengas el nombre completo, email válido, y un horario exacto (ISO de check_available_slots) confirmados explícitamente por el usuario en la conversación -- nunca inventes o asumas estos datos.",
  inputSchema: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    start: z.string().describe("Horario exacto en formato ISO, tomado de check_available_slots."),
    type: z.enum(["consulta", "proyecto"]).default("consulta"),
    phone: z.string().optional(),
    notes: z.string().optional().describe("Resumen breve de qué quiere hablar el usuario."),
  }),
  execute: async ({ name, email, start, type, phone, notes }) => {
    try {
      const res = await fetch(BOOKING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, start, timeZone: "America/Santo_Domingo", language: "es", notes: notes || "Agendado vía Atlas Assistant (chat con IA).", phone, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error || "No se pudo confirmar la reserva — ese horario puede haberse ocupado, prueba con otro." };
      return { ok: true, confirmedStart: start };
    } catch {
      return { error: "No se pudo confirmar la reserva en este momento." };
    }
  },
});

// ---- 5. Portafolio real (mismos proyectos reales que /portafolio) ----
// Duplicado liviano de src/constants/projects.ts (mismo patrón ya aceptado
// para PACKAGES/ADDONS) -- sin los campos de imagen/video/case-study, solo
// lo que hace falta para responder con un ejemplo real y su link.
const PORTFOLIO: {
  slug: string;
  title: string;
  type: string;
  plan: string;
  shortDesc: string;
  liveUrl?: string;
  image?: string;
}[] = [
  {
    slug: "lumina-sky-concept",
    title: "Lúmina Sky",
    type: "Turismo · Web Corporativa",
    plan: "Constelación",
    shortDesc: "Web para un hotel de lujo en Santo Domingo, con motor de reservas y experiencia inmersiva.",
    liveUrl: "https://lumina-sky-demo.vercel.app/",
    image: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Lum/LuminaPreviewHD-v2.webp",
  },
  {
    slug: "nexus-real-estate",
    title: "Nexus Realty",
    type: "Inmobiliario · Plataforma",
    plan: "Constelación",
    shortDesc: "Plataforma de bienes raíces con catálogo de propiedades y filtros rápidos.",
    liveUrl: "https://nexus-realty-demo.vercel.app/",
    image: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Nexus/NexusPoster-v12.jpg",
  },
  {
    slug: "chroma-store",
    title: "Chroma Tech Store",
    type: "E-commerce · Tecnología",
    plan: "Nova",
    shortDesc: "Tienda online completa con carrito, pagos seguros y buscador inteligente con IA.",
    liveUrl: "https://chroma-tech-store-azure.vercel.app/",
    image: "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/Chroma/ChromaPoster-v4.jpg",
  },
  {
    slug: "vitality-clinic",
    title: "Vitality Med",
    type: "Salud · Portal de Citas",
    plan: "Constelación",
    shortDesc: "Clínica con perfiles de médicos, blog de salud, agendado real de citas y panel administrativo.",
    liveUrl: "https://vitality-med-five.vercel.app/",
    image: "https://polarisweb.studio/screenshots/vitality-clinic-desktop.png",
  },
  {
    slug: "sabor-autentico",
    title: "Sabor Auténtico",
    type: "Gastronomía · Landing Page",
    plan: "Destello",
    shortDesc: "Menú digital interactivo y gestor de reservas para restaurantes.",
    liveUrl: undefined,
    image: "https://polarisweb.studio/screenshots/sabor-autentico-desktop.png",
  },
];

export const searchPortfolio = tool({
  description:
    "Busca proyectos reales del portafolio de Polaris por rubro/tipo de negocio (ej. 'restaurante', 'inmobiliaria', 'clínica', 'tienda online'). Úsala cuando el usuario pregunte si ya han hecho algo parecido a su negocio, para responder con un ejemplo real y su link en vez de una afirmación genérica.",
  inputSchema: z.object({
    query: z.string().describe("Palabra clave del rubro/tipo de negocio a buscar, ej. 'restaurante', 'inmobiliaria'."),
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();
    const matches = PORTFOLIO.filter(
      (p) => p.type.toLowerCase().includes(q) || p.title.toLowerCase().includes(q) || p.shortDesc.toLowerCase().includes(q)
    );
    return { results: (matches.length ? matches : PORTFOLIO).slice(0, 3) };
  },
});

// ---- 6. Captura real de lead (mismo pipeline que el paso final del cotizador) ----
// Reusa quote-confirmation-send (Meridian) tal cual -- el mismo endpoint que
// usa WizardQuote.tsx en su paso final: manda la confirmación real al
// cliente (con su cotización y quoteRef) Y la alerta interna real a
// Cristian. No inventa un pipeline nuevo -- mismo camino ya probado en
// producción, solo con otro punto de entrada (el chat en vez del wizard).
const QUOTE_CONFIRMATION_URL = "https://quote-confirmation-send-wdvfac6mgq-ue.a.run.app";

export const captureLead = tool({
  description:
    "Guarda a la persona como lead real y le manda por correo su cotización (con número de referencia real) -- Cristian también recibe una alerta real. SOLO llámala cuando el usuario ya dio explícitamente su nombre Y su email Y pidió que le envíes/guardes la cotización (ej. 'mándamela por correo', 'apúntame'). Nunca la llames solo porque el usuario mencionó su email de pasada, y nunca antes de haber calculado la cotización con calculate_quote si se trata de un paquete específico -- primero cotiza, después ofrece capturar el lead, nunca al revés.",
  inputSchema: z.object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().optional(),
    packageId: z.enum(["landing", "corporate", "ecommerce"]).optional().describe("Paquete de interés, si ya se definió."),
    addonIds: z.array(z.string()).optional(),
    domain: z.string().optional().describe("Dominio que mencionó, si aplica."),
  }),
  execute: async ({ name, email, phone, packageId, addonIds, domain }) => {
    try {
      const res = await fetch(QUOTE_CONFIRMATION_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          phone: phone || "",
          domain: domain || "",
          packageId: packageId || "corporate",
          addonIds: addonIds || [],
          language: "es",
        }),
      });
      if (!res.ok) return { error: "No se pudo guardar el lead en este momento." };
      return { ok: true };
    } catch {
      return { error: "No se pudo guardar el lead en este momento." };
    }
  },
});

// ---- 8. Búsqueda web real (grounding nativo de Gemini) ----
// Usada por cualquier modelo sin buscador propio utilizable acá (hoy,
// DeepSeek) y como tool de respaldo en el set completo -- Grok y Gemini, al
// responder ellos mismos el turno, usan su propio buscador nativo directo
// (ver toolsFor() en quotebot-chat.ts), sin pasar por este wrapper.
// Migrado de un llamado anidado a Grok (xai.tools.webSearch) a uno a Gemini
// (google.tools.googleSearch) el 10 de agosto: medido en vivo que el
// grounding de Gemini resuelve bastante más rápido que el salto completo a
// Grok (~2-13s vs ~30-60s+ en las pruebas reales de esa sesión) -- ver
// Meridian/CLAUDE.md. Mismo mecanismo "provider-executed" que el de xAI, con
// la ventaja de que Gemini sí devuelve un título real de la fuente (no solo
// el número de cita que devolvía xAI).
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

export const webSearch = tool({
  description:
    "Busca en la web información general o actual (noticias, hechos, datos que cambian con el tiempo, temas fuera del negocio de Polaris) que el modelo no sabría de memoria con certeza. Úsala para preguntas generales o del momento -- no para precios/servicios propios de Polaris, que ya tienen sus tools dedicadas.",
  inputSchema: z.object({
    query: z.string().describe("La pregunta o términos de búsqueda, en el idioma que sea más efectivo para buscar (usualmente inglés para temas globales)."),
  }),
  execute: async ({ query }) => {
    if (!GEMINI_API_KEY) {
      return { error: "La búsqueda web no está disponible en este momento." };
    }
    try {
      const google = createGoogleGenerativeAI({ apiKey: GEMINI_API_KEY });
      const result = await generateText({
        model: google("gemini-3.5-flash"),
        // Provider-executed (corre server-side en la API de Gemini, no vía
        // execute() local) -- de ahí el `as any` puntual, mismo motivo que
        // el resto de los tools nativos de esta cuenta.
        tools: { google_search: google.tools.googleSearch({}) } as any,
        prompt: query,
      });
      // Mismo patrón que xAI: las fuentes reales viven en `result.sources`
      // (content parts sueltos, `{type:"source", sourceType:"url", url,
      // title}`), no en `toolResults`. A diferencia de xAI, acá `title` SÍ
      // suele traer un título real de la página (metadata de grounding de
      // Google), no solo el número de cita -- se usa igual el hostname como
      // respaldo si faltara. La misma URL puede repetirse varias veces (una
      // cita por uso dentro de la respuesta), así que se deduplica por URL
      // -- sin recorte de cantidad, se muestran todas las fuentes reales
      // usadas (pedido explícito del usuario, 10 de agosto).
      const rawSources = (result.sources || []).filter((s: any) => s.sourceType === "url" && s.url) as { url: string; title?: string }[];
      const seen = new Set<string>();
      const sources: { url: string; title: string }[] = [];
      for (const s of rawSources) {
        if (seen.has(s.url)) continue;
        seen.add(s.url);
        let title = s.title || s.url;
        if (!s.title) {
          try {
            title = new URL(s.url).hostname.replace(/^www\./, "");
          } catch {
            // URL inválida -- se deja el string crudo como título
          }
        }
        sources.push({ url: s.url, title });
      }
      return { answer: result.text, sources };
    } catch {
      return { error: "No se pudo completar la búsqueda web en este momento." };
    }
  },
});

// ---- 9. Búsqueda real en el blog de Polaris (contenido real ya publicado) ----
export const searchBlog = tool({
  description:
    "Busca un artículo real del blog de Polaris relacionado con la pregunta del usuario (SEO, performance, e-commerce, IA, desarrollo). Úsala para preguntas educativas/técnicas ('¿qué es X?', '¿por qué importa X?') para responder con un artículo real y su link en vez de explicarlo solo de memoria -- no reemplaza la explicación, la complementa.",
  inputSchema: z.object({
    query: z.string().describe("Tema o palabras clave a buscar, ej. 'seo', 'core web vitals', 'inteligencia artificial'."),
  }),
  execute: async ({ query }) => {
    const q = query.toLowerCase();
    const scored = BLOG_POSTS.map((p) => {
      let score = 0;
      if (p.title.toLowerCase().includes(q)) score += 3;
      if (p.summary.toLowerCase().includes(q)) score += 2;
      if (p.tags.some((t) => t.toLowerCase().includes(q))) score += 2;
      if (p.concepts.some((c) => c.toLowerCase().includes(q))) score += 1;
      if (p.category.toLowerCase().includes(q)) score += 1;
      return { p, score };
    })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 2)
      .map(({ p }) => ({
        title: p.title,
        summary: p.summary,
        category: p.category,
        url: `https://polarisweb.studio/blog/${p.slug}`,
      }));
    return { results: scored };
  },
});

// ---- 10. Respuesta grounded a preguntas de política (reembolso, cancelación, etc.) ----
// El texto es un resumen fiel de las cláusulas reales de /terminos (LegalPage.tsx)
// -- nunca inventado -- para que el modelo no responda de memoria sobre temas
// legales/de dinero, donde una alucinación pesa mucho más que en otras preguntas.
const POLICY_TOPICS: Record<string, { es: string; en: string }> = {
  refund: {
    es: "El anticipo no es reembolsable una vez que el trabajo ya empezó (kickoff, primer borrador, o cualquier entregable producido), salvo que Polaris no entregue por razones propias — ahí sí aplica reembolso total o proporcional según el avance. Antes de empezar el trabajo, cancelar da derecho a 100% de reembolso (menos comisiones de PayPal/banco, que no son reembolsables). El primer paso ante un resultado no satisfactorio siempre son ajustes razonables dentro del alcance acordado, no un reembolso directo.",
    en: "The deposit is non-refundable once work has started (kickoff, first draft, or any deliverable produced), unless Polaris fails to deliver for reasons of its own — then a full or proportional refund applies based on progress. Cancelling before work starts gives you a 100% refund (minus PayPal/bank fees, which aren't refundable). The first step for an unsatisfactory result is always reasonable adjustments within scope, not a direct refund.",
  },
  cancellation: {
    es: "Cancelar antes de empezar el trabajo: reembolso completo del anticipo (menos comisiones de pago ya cobradas por PayPal/banco). Cancelar después de empezar: se factura el valor del trabajo ya completado — si pagaste de más, se reembolsa la diferencia; si pagaste de menos, el saldo restante queda pendiente. Costos de terceros ya gastados (dominios, licencias) nunca son reembolsables. El mantenimiento mensual se puede cancelar cuando quieras, efectivo al fin del ciclo ya pagado.",
    en: "Cancelling before work starts: full deposit refund (minus payment fees already charged by PayPal/bank). Cancelling after work has started: we invoice the value of work already completed — if you overpaid, we refund the difference; if you underpaid, the remaining balance is due. Third-party costs already spent (domains, licenses) are never refundable. Monthly maintenance can be cancelled anytime, effective at the end of the already-paid cycle.",
  },
  revisions: {
    es: "Si no estás conforme con un resultado entregado, el primer paso siempre es trabajar de buena fe en ajustes razonables dentro del alcance acordado en tu cotización — no un reembolso. Un reembolso solo se considera si, después de un intento genuino de revisiones, no logramos entregar un resultado razonablemente alineado con lo acordado.",
    en: "If you're not satisfied with a delivered result, the first step is always good-faith reasonable adjustments within the scope agreed in your quote — not a refund. A refund is only considered if, after a genuine attempt at revisions, we're unable to deliver a result reasonably aligned with what was agreed.",
  },
  payment_methods: {
    es: "Aceptamos PayPal (en línea, confirmación automática) y transferencia bancaria o efectivo (confirmado manualmente en tu portal una vez verificamos la recepción de los fondos). Los precios son los indicados en tu cotización aceptada, en la moneda ahí señalada.",
    en: "We accept PayPal (online, automatic confirmation) and bank transfer or cash (manually confirmed in your portal once we verify receipt of funds). Prices are those stated in your accepted quote, in the currency indicated there.",
  },
  delivery_timeline: {
    es: "El plazo de entrega indicado en tu cotización asume que nos das a tiempo el contenido, accesos y retroalimentación necesarios. Cualquier demora de tu parte extiende el plazo en la misma medida y no cuenta como una demora atribuible a Polaris.",
    en: "The timeline stated in your quote assumes timely delivery of content, access, and feedback from you. Delays on your part extend the timeline accordingly and don't count as a delay attributable to Polaris.",
  },
  intellectual_property: {
    es: "Una vez que tu proyecto está pagado en su totalidad, eres dueño del código, diseño y contenido a medida creado específicamente para ti. Esto no incluye librerías, frameworks, plugins o recursos de terceros usados para construirlo, que se mantienen bajo sus propias licencias. Hasta recibir el pago completo, los entregables siguen siendo propiedad de Polaris Web Studio.",
    en: "Once your project is fully paid for, you own the custom code, design, and content created specifically for you. This doesn't include third-party libraries, frameworks, plugins, or assets, which remain under their own licenses. Until full payment, deliverables remain the property of Polaris Web Studio.",
  },
};

export const getPolicyAnswer = tool({
  description:
    "Devuelve el texto real y exacto de la política de Polaris sobre reembolsos, cancelación, revisiones, formas de pago, plazos de entrega, o propiedad intelectual -- basado en los Términos de Servicio reales (/terminos), nunca inventado. Úsala SIEMPRE que el usuario pregunte por reembolsos, cancelación, garantías, o de quién es el código/diseño después de pagar -- nunca respondas estas preguntas solo de memoria.",
  inputSchema: z.object({
    topic: z
      .enum(["refund", "cancellation", "revisions", "payment_methods", "delivery_timeline", "intellectual_property"])
      .describe("Tema de la política que se está consultando."),
    lang: z.enum(["es", "en"]).default("es"),
  }),
  execute: async ({ topic, lang }) => {
    const entry = POLICY_TOPICS[topic];
    if (!entry) return { error: "Tema no encontrado." };
    return { answer: entry[lang] || entry.es, sourceUrl: "https://polarisweb.studio/terminos" };
  },
});

// ---- 11. Escalar a un humano real por WhatsApp, con contexto ----
export const requestHumanHandoff = tool({
  description:
    "Genera un link real de WhatsApp para que el usuario hable directo con Cristian (fundador), con un resumen breve de la conversación pre-cargado en el mensaje. Úsala SOLO cuando el usuario pida explícitamente hablar con una persona/humano, o diga que el chat no le está resolviendo lo que necesita -- nunca la ofrezcas como primera opción antes de intentar ayudar tú mismo.",
  inputSchema: z.object({
    summary: z.string().describe("Resumen breve (1-2 frases, en el idioma del usuario) de qué necesita/preguntó, para pre-cargar el mensaje de WhatsApp."),
  }),
  execute: async ({ summary }) => {
    const message = `Hola, estuve hablando con Atlas (el chat de Polaris) y quisiera continuar con alguien del equipo. Resumen: ${summary}`;
    return { whatsappUrl: `https://wa.me/18299200544?text=${encodeURIComponent(message)}` };
  },
});

export const atlasTools = {
  check_domain_price: checkDomainPrice,
  calculate_quote: calculateQuote,
  list_packages: listPackages,
  compare_packages: comparePackages,
  check_available_slots: checkAvailableSlots,
  book_call: bookCall,
  search_portfolio: searchPortfolio,
  capture_lead: captureLead,
  web_search: webSearch,
  search_blog: searchBlog,
  get_policy_answer: getPolicyAnswer,
  request_human_handoff: requestHumanHandoff,
};
