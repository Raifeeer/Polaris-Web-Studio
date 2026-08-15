import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import nodemailer from "nodemailer";
import { findPlace, findPlaceReviews, generateFast, placeDataSummary } from "./_localLift.js";

// Genera el paquete completo del tier "Local Lift 48H" ($99) / "Implementado"
// ($179): descripción reescrita, 10 publicaciones para Google Business
// Profile, respuestas a reseñas reales (hasta 5 -- límite real de Places API,
// nunca 15, ver nota en el schema) + plantillas por calificación, y 10
// mensajes de WhatsApp de seguimiento. Solo contenido -- la "implementación"
// real en la ficha del cliente sigue siendo trabajo manual (requeriría
// Business Profile API + OAuth del cliente, fuera de alcance por ahora).
//
// Admin-only a propósito: a diferencia de local-lift-diagnostic.ts (gratis,
// público, gancho de venta), esto es el entregable del tier PAGO -- no debe
// ser gatillable por cualquier visitante. La autenticación real (verificar
// que quien llama es un admin del portal) la hace el middleware
// authenticateToken+requireAdmin ya existente, aplicado en server.ts ANTES
// de llegar a este handler -- no se revalida acá.
//
// Vercel Hobby (plan real de esta cuenta) mata cualquier función serverless
// a los 10s, sin excepción. Probado en vivo, varias rondas: el cuello de
// botella real es CANTIDAD DE ITEMS por llamado, no el proveedor -- los
// schemas de 5 items (respuestas, plantillas) siempre completaron a tiempo,
// los de 10 items (posts, WhatsApp) nunca lo hicieron, sin importar el
// modelo. Fix real: partir "10 posts" y "10 mensajes" en 2 llamados de 5
// cada uno, y correr los 7 llamados totales en paralelo, repartidos entre
// los 3 proveedores (DeepSeek solo lleva UNO -- 2 llamados simultáneos a
// DeepSeek fallaron los 2 en las pruebas).

const descriptionSchema = z.object({
  rewrittenDescription: z.string().describe("Descripción reescrita de la ficha de Google (máx. 750 caracteres), destacando servicios/ambiente/ubicación reales y una llamada a la acción clara."),
  services: z.array(z.string()).min(3).max(8).describe("Lista de servicios/productos reales a destacar en el perfil, inferidos de la categoría del negocio."),
});

const postsHalfSchema = z.object({
  googlePosts: z
    .array(
      z.object({
        title: z.string().describe("Título corto de la publicación (máx. 10 palabras)."),
        body: z.string().describe("Texto de la publicación para Google Business Profile, máx. 800 caracteres, listo para adaptar."),
        cta: z.enum(["Reservar", "Llamar ahora", "Ver más", "Comprar", "Cómo llegar", "Ninguno"]).describe("Botón de llamada a la acción sugerido."),
      })
    )
    .length(5),
});

const repliesSchema = z.object({
  reviewReplies: z
    .array(
      z.object({
        author: z.string(),
        rating: z.number(),
        originalText: z.string(),
        reply: z.string().describe("Respuesta breve y personalizada a ESA reseña puntual, tono profesional/cálido, agradeciendo o resolviendo la queja según corresponda."),
      })
    )
    .describe("Respuesta a cada una de las reseñas reales provistas (puede haber menos de 5 si la ficha tiene menos)."),
});

const templatesSchema = z.object({
  reviewReplyTemplates: z
    .array(
      z.object({
        forRating: z.number().int().min(1).max(5),
        template: z.string().describe("Plantilla breve y genérica de respuesta para una reseña de esa calificación, con [corchetes] donde el cliente debe personalizar."),
      })
    )
    .length(5)
    .describe("Una plantilla por cada calificación de 1 a 5 estrellas, para reseñas futuras que la ficha no tiene todavía."),
});

const whatsappHalfSchema = z.object({
  whatsappMessages: z
    .array(
      z.object({
        scenario: z.string().describe("Escenario breve (ej. 'Consulta sin respuesta en 24h', 'Confirmación de reserva')."),
        message: z.string().describe("Mensaje breve de WhatsApp listo para adaptar, tono cercano y profesional."),
      })
    )
    .length(5),
});

type DescPart = z.infer<typeof descriptionSchema>;
type PostsHalfPart = z.infer<typeof postsHalfSchema>;
type RepliesPart = z.infer<typeof repliesSchema>;
type TemplatesPart = z.infer<typeof templatesSchema>;
type WhatsappHalfPart = z.infer<typeof whatsappHalfSchema>;

interface LocalLiftPackage {
  rewrittenDescription: string | null;
  services: string[] | null;
  googlePosts: PostsHalfPart["googlePosts"] | null;
  reviewReplies: RepliesPart["reviewReplies"] | null;
  reviewReplyTemplates: TemplatesPart["reviewReplyTemplates"] | null;
  whatsappMessages: WhatsappHalfPart["whatsappMessages"] | null;
  partialFailure: boolean;
  errors: Record<"description" | "posts1" | "posts2" | "replies" | "templates" | "whatsapp1" | "whatsapp2", string | null>;
}

async function generatePackage(
  place: NonNullable<Awaited<ReturnType<typeof findPlace>>>,
  reviews: Awaited<ReturnType<typeof findPlaceReviews>>,
  lang: "es" | "en"
): Promise<LocalLiftPackage> {
  const dataBlock = placeDataSummary(place);
  const langInstruction = lang === "en" ? "inglés" : "español neutro, sin voseo";
  const baseHeader = `Sos un consultor de Polaris Local Lift preparando contenido para este negocio. Datos REALES de su ficha de Google (Places API) -- no inventes cifras ni datos que no estén acá:\n\n${dataBlock}\n\n`;

  const reviewsBlock =
    reviews.length > 0
      ? reviews.map((r, i) => `${i + 1}. [${r.rating}/5] ${r.author}: "${r.text}"`).join("\n")
      : "No hay reseñas con texto disponibles en la ficha.";

  const prompts = {
    description: `${baseHeader}Generá una descripción reescrita del negocio y una lista de sus servicios/productos reales. Grounded en los datos de arriba. Todo en ${langInstruction}.`,
    posts1: `${baseHeader}Generá 5 publicaciones breves para Google Business Profile, enfocadas en: ofertas/promociones, novedades, y servicios destacados. Todo en ${langInstruction}.`,
    posts2: `${baseHeader}Generá otras 5 publicaciones breves para Google Business Profile, enfocadas en: testimonios/reseñas, fechas especiales o temporada, detrás de escena, preguntas frecuentes, y un llamado a la acción directo. No repitas el enfoque de ofertas/novedades/servicios (ya cubierto en otra tanda). Todo en ${langInstruction}.`,
    replies: `${baseHeader}Reseñas reales disponibles (máximo 5, límite real de la API):\n${reviewsBlock}\n\nGenerá una respuesta breve y personalizada a cada reseña real de arriba. Todo en ${langInstruction}.`,
    templates: `${baseHeader}Generá 5 plantillas breves y genéricas de respuesta a reseñas, una por calificación (1 a 5 estrellas), para reseñas futuras. Todo en ${langInstruction}.`,
    whatsapp1: `${baseHeader}Generá 5 mensajes breves de WhatsApp de seguimiento para: consulta sin respuesta en 24h, confirmación de reserva/pedido, recordatorio previo a la visita, agradecimiento post-visita, y pedido de reseña. Todo en ${langInstruction}.`,
    whatsapp2: `${baseHeader}Generá otros 5 mensajes breves de WhatsApp para: reactivación de cliente inactivo, promoción puntual, respuesta a consulta de horario/ubicación, respuesta a consulta de precio, y mensaje de bienvenida a cliente nuevo. No repitas los escenarios de otra tanda (consulta sin respuesta, confirmación, recordatorio, agradecimiento, pedido de reseña). Todo en ${langInstruction}.`,
  };

  // DeepSeek queda afuera de este endpoint -- probado en vivo varias
  // rondas: falló la enorme mayoría de las veces que se usó acá (con o sin
  // concurrencia), mientras Grok y Gemini toleraron bien 3-4 llamados
  // paralelos cada uno. Repartido entre esos dos únicamente.
  const calls: Array<[keyof LocalLiftPackage["errors"], () => Promise<any>]> = [
    ["description", () => generateFast(descriptionSchema, prompts.description, 0.6, "gemini")],
    ["posts1", () => generateFast(postsHalfSchema, prompts.posts1, 0.6, "grok")],
    ["posts2", () => generateFast(postsHalfSchema, prompts.posts2, 0.6, "gemini")],
    ["replies", () => generateFast(repliesSchema, prompts.replies, 0.6, "grok")],
    ["templates", () => generateFast(templatesSchema, prompts.templates, 0.6, "gemini")],
    ["whatsapp1", () => generateFast(whatsappHalfSchema, prompts.whatsapp1, 0.6, "grok")],
    ["whatsapp2", () => generateFast(whatsappHalfSchema, prompts.whatsapp2, 0.6, "gemini")],
  ];

  const results = await Promise.allSettled(calls.map(([, fn]) => fn()));

  const errors = {} as LocalLiftPackage["errors"];
  const values: Record<string, any> = {};
  results.forEach((r, i) => {
    const [label] = calls[i];
    if (r.status === "fulfilled") {
      values[label] = r.value;
      errors[label] = null;
    } else {
      values[label] = null;
      errors[label] = String((r.reason as any)?.message || r.reason).slice(0, 300);
      console.error(`[local-lift-package] pieza '${label}' falló:`, r.reason);
    }
  });

  const desc = values.description as DescPart | null;
  const posts1 = values.posts1 as PostsHalfPart | null;
  const posts2 = values.posts2 as PostsHalfPart | null;
  const repliesPart = values.replies as RepliesPart | null;
  const templates = values.templates as TemplatesPart | null;
  const wa1 = values.whatsapp1 as WhatsappHalfPart | null;
  const wa2 = values.whatsapp2 as WhatsappHalfPart | null;

  const googlePosts = [...(posts1?.googlePosts || []), ...(posts2?.googlePosts || [])];
  const whatsappMessages = [...(wa1?.whatsappMessages || []), ...(wa2?.whatsappMessages || [])];

  return {
    rewrittenDescription: desc?.rewrittenDescription ?? null,
    services: desc?.services ?? null,
    googlePosts: googlePosts.length > 0 ? googlePosts : null,
    reviewReplies: repliesPart?.reviewReplies ?? null,
    reviewReplyTemplates: templates?.reviewReplyTemplates ?? null,
    whatsappMessages: whatsappMessages.length > 0 ? whatsappMessages : null,
    partialFailure: Object.values(errors).some((e) => e !== null),
    errors,
  };
}

const rlBuckets = new Map<string, { count: number; resetAt: number }>();
function rateLimited(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const b = rlBuckets.get(key);
  if (!b || now > b.resetAt) {
    rlBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }
  if (b.count >= max) return true;
  b.count++;
  return false;
}

function renderPackageHtml(pkg: LocalLiftPackage, lang: "es" | "en"): string {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const postsHtml = (pkg.googlePosts || [])
    .map((p) => `<li><strong>${esc(p.title)}</strong><br/>${esc(p.body)}<br/><em>CTA: ${esc(p.cta)}</em></li>`)
    .join("");
  const repliesHtml = (pkg.reviewReplies || [])
    .map((r) => `<li><strong>${esc(r.author)} (${r.rating}/5):</strong> "${esc(r.originalText)}"<br/>→ ${esc(r.reply)}</li>`)
    .join("");
  const templatesHtml = (pkg.reviewReplyTemplates || [])
    .map((t) => `<li><strong>${t.forRating}/5:</strong> ${esc(t.template)}</li>`)
    .join("");
  const waHtml = (pkg.whatsappMessages || [])
    .map((m) => `<li><strong>${esc(m.scenario)}:</strong> ${esc(m.message)}</li>`)
    .join("");

  return `
    <h2>${lang === "en" ? "New description" : "Descripción nueva"}</h2>
    <p>${pkg.rewrittenDescription ? esc(pkg.rewrittenDescription) : "--"}</p>
    <h2>${lang === "en" ? "Services to highlight" : "Servicios a destacar"}</h2>
    <ul>${(pkg.services || []).map((s) => `<li>${esc(s)}</li>`).join("")}</ul>
    <h2>${lang === "en" ? "Google posts" : "Publicaciones para Google"}</h2>
    <ol>${postsHtml}</ol>
    <h2>${lang === "en" ? "Replies to real reviews" : "Respuestas a reseñas reales"}</h2>
    <ol>${repliesHtml || `<li>${lang === "en" ? "No reviews with text found." : "No se encontraron reseñas con texto."}</li>`}</ol>
    <h2>${lang === "en" ? "Reply templates by rating" : "Plantillas de respuesta por calificación"}</h2>
    <ol>${templatesHtml}</ol>
    <h2>${lang === "en" ? "WhatsApp follow-up messages" : "Mensajes de WhatsApp de seguimiento"}</h2>
    <ol>${waHtml}</ol>
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip, 30, 15 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }

  const { action, businessName, city, lang, email, contactName, place: givenPlace, package: givenPackage } = req.body || {};
  const language: "es" | "en" = lang === "en" ? "en" : "es";

  try {
    if (action === "send") {
      // Envía un paquete YA generado (revisado por el admin en pantalla) --
      // no vuelve a llamar a la IA ni a Places, así el admin puede editar el
      // texto antes de mandarlo sin gastar otro llamado.
      if (!givenPlace || !givenPackage) {
        return res.status(400).json({ error: "Falta 'place' o 'package' para enviar." });
      }
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "El correo no es válido." });
      }
      const zohoPassword = process.env.ZOHO_PASSWORD;
      if (!zohoPassword) {
        return res.status(500).json({ error: "ZOHO_PASSWORD no configurado -- no se puede enviar." });
      }
      const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true,
        auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
      });
      await transporter.sendMail({
        from: '"Polaris Local Lift" <hola@polarisweb.studio>',
        to: email,
        subject: language === "en" ? `Your Local Lift content package -- ${givenPlace.name}` : `Tu paquete de contenido Local Lift -- ${givenPlace.name}`,
        html: `<p>${language === "en" ? "Hi" : "Hola"} ${contactName || ""},</p>${renderPackageHtml(givenPackage, language)}`,
      });
      return res.json({ success: true, sent: true });
    }

    // action === "generate" (default)
    if (typeof businessName !== "string" || !businessName.trim() || businessName.length > 200) {
      return res.status(400).json({ error: "Falta el nombre del negocio." });
    }
    if (typeof city !== "string" || !city.trim() || city.length > 100) {
      return res.status(400).json({ error: "Falta la ciudad." });
    }

    const place = await findPlace(businessName.trim(), city.trim());
    if (!place) {
      return res.status(404).json({ error: "No se encontró esa ficha en Google. Revisa el nombre y la ciudad." });
    }

    const reviews = await findPlaceReviews(place.id, language);
    const pkg = await generatePackage(place, reviews, language);

    return res.json({ success: true, place, reviews, package: pkg });
  } catch (error: any) {
    console.error("[local-lift-package] Error:", error);
    return res.status(500).json({ error: error?.message || "No se pudo generar/enviar el paquete." });
  }
}
