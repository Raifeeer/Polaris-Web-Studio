import { tool } from "ai";
import { z } from "zod";

// Tools reales para Atlas Terminal (AI SDK, function calling real) --
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
const PACKAGES: Record<string, { name: string; price: number }> = {
  landing: { name: "Destello", price: 299 },
  corporate: { name: "Constelación", price: 699 },
  ecommerce: { name: "Nova", price: 1299 },
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
    "Calcula el precio real de un proyecto combinando un paquete (landing/corporate/ecommerce) con addons opcionales, aplicando la oferta de lanzamiento vigente. Úsala en vez de sumar los números vos mismo -- así el total siempre coincide exacto con lo que el cotizador real del sitio mostraría.",
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
        body: JSON.stringify({ name, email, start, timeZone: "America/Santo_Domingo", language: "es", notes: notes || "Agendado vía Atlas Terminal (chat con IA).", phone, type }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) return { error: data.error || "No se pudo confirmar la reserva -- ese horario puede haberse ocupado, prueba con otro." };
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
}[] = [
  { slug: "lumina-sky-concept", title: "Lúmina Sky", type: "Turismo · Web Corporativa", plan: "Constelación", shortDesc: "Web para un hotel de lujo en Santo Domingo, con motor de reservas y experiencia inmersiva.", liveUrl: "https://lumina-sky-demo.vercel.app/" },
  { slug: "nexus-real-estate", title: "Nexus Realty", type: "Inmobiliario · Plataforma", plan: "Constelación", shortDesc: "Plataforma de bienes raíces con catálogo de propiedades y filtros rápidos.", liveUrl: "https://nexus-realty-demo.vercel.app/" },
  { slug: "chroma-store", title: "Chroma Tech Store", type: "E-commerce · Tecnología", plan: "Nova", shortDesc: "Tienda online completa con carrito, pagos seguros y buscador inteligente con IA.", liveUrl: "https://chroma-tech-store-azure.vercel.app/" },
  { slug: "vitality-clinic", title: "Vitality Med", type: "Salud · Portal de Citas", plan: "Constelación", shortDesc: "Clínica con perfiles de médicos, blog de salud, agendado real de citas y panel administrativo.", liveUrl: "https://vitality-med-five.vercel.app/" },
  { slug: "sabor-autentico", title: "Sabor Auténtico", type: "Gastronomía · Landing Page", plan: "Destello", shortDesc: "Menú digital interactivo y gestor de reservas para restaurantes.", liveUrl: undefined },
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

export const atlasTools = {
  check_domain_price: checkDomainPrice,
  calculate_quote: calculateQuote,
  check_available_slots: checkAvailableSlots,
  book_call: bookCall,
  search_portfolio: searchPortfolio,
  capture_lead: captureLead,
};
