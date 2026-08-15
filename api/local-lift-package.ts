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
// a los 10s, sin excepción. Generar los ~30 items del paquete (descripción +
// posts + respuestas + plantillas + WhatsApp) en un solo llamado a un
// modelo no entra ahí -- por eso se parte en 3 llamados MÁS CHICOS que
// corren EN PARALELO (Promise.allSettled), cada uno con un solo intento y
// timeout corto (ver generateFast en _localLift.ts). Si una pieza falla, se
// devuelve igual con las otras dos completas y esa pieza en null -- mejor
// un resultado parcial que nada.

const contentSchema = z.object({
  rewrittenDescription: z.string().describe("Descripción reescrita de la ficha de Google (máx. 750 caracteres), destacando servicios/ambiente/ubicación reales y una llamada a la acción clara."),
  services: z.array(z.string()).min(3).max(10).describe("Lista de servicios/productos reales a destacar en el perfil, inferidos de la categoría del negocio."),
  googlePosts: z
    .array(
      z.object({
        title: z.string().describe("Título corto de la publicación (máx. 10 palabras)."),
        body: z.string().describe("Texto de la publicación para Google Business Profile, máx. 1500 caracteres, listo para adaptar."),
        cta: z.enum(["Reservar", "Llamar ahora", "Ver más", "Comprar", "Cómo llegar", "Ninguno"]).describe("Botón de llamada a la acción sugerido."),
      })
    )
    .length(10)
    .describe("10 publicaciones variadas: ofertas, novedades, servicios destacados, testimonios, fechas especiales, detrás de escena, preguntas frecuentes, llamados a la acción directos -- sin repetir el mismo enfoque dos veces."),
});

const reviewsSchema = z.object({
  reviewReplies: z
    .array(
      z.object({
        author: z.string(),
        rating: z.number(),
        originalText: z.string(),
        reply: z.string().describe("Respuesta personalizada y real a ESA reseña puntual, en tono profesional/cálido, agradeciendo o resolviendo la queja según corresponda."),
      })
    )
    .describe("Respuesta a cada una de las reseñas reales provistas (puede haber menos de 5 si la ficha tiene menos)."),
  reviewReplyTemplates: z
    .array(
      z.object({
        forRating: z.number().int().min(1).max(5),
        template: z.string().describe("Plantilla genérica de respuesta para una reseña de esa calificación, con [corchetes] donde el cliente debe personalizar."),
      })
    )
    .length(5)
    .describe("Una plantilla por cada calificación de 1 a 5 estrellas, para reseñas futuras que la ficha no tiene todavía."),
});

const whatsappSchema = z.object({
  whatsappMessages: z
    .array(
      z.object({
        scenario: z.string().describe("Escenario breve (ej. 'Consulta sin respuesta en 24h', 'Confirmación de reserva')."),
        message: z.string().describe("Mensaje de WhatsApp listo para adaptar, tono cercano y profesional."),
      })
    )
    .length(10)
    .describe("10 mensajes cubriendo: seguimiento de consulta, confirmación, recordatorio previo a la visita, agradecimiento post-visita, pedido de reseña, reactivación de cliente inactivo, promoción puntual, y otros escenarios reales de un negocio local."),
});

type ContentPart = z.infer<typeof contentSchema>;
type ReviewsPart = z.infer<typeof reviewsSchema>;
type WhatsappPart = z.infer<typeof whatsappSchema>;

interface LocalLiftPackage {
  rewrittenDescription: string | null;
  services: string[] | null;
  googlePosts: ContentPart["googlePosts"] | null;
  reviewReplies: ReviewsPart["reviewReplies"] | null;
  reviewReplyTemplates: ReviewsPart["reviewReplyTemplates"] | null;
  whatsappMessages: WhatsappPart["whatsappMessages"] | null;
  partialFailure: boolean;
  errors: { content: string | null; reviews: string | null; whatsapp: string | null };
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

  const contentPrompt = `${baseHeader}Generá: descripción reescrita, lista de servicios, y 10 publicaciones para Google Business Profile (variadas: ofertas, novedades, servicios, testimonios, fechas especiales, detrás de escena, preguntas frecuentes, llamados a la acción -- sin repetir enfoque). Grounded en los datos reales de arriba, tono profesional y cálido, sin prometer resultados garantizados. Todo en ${langInstruction}.`;

  const reviewsPrompt = `${baseHeader}Reseñas reales disponibles (máximo 5, límite real de la API):\n${reviewsBlock}\n\nGenerá una respuesta personalizada a cada reseña real de arriba, y 5 plantillas genéricas de respuesta (una por calificación, 1 a 5 estrellas) para reseñas futuras. Tono profesional y cálido. Todo en ${langInstruction}.`;

  const whatsappPrompt = `${baseHeader}Generá 10 mensajes de WhatsApp de seguimiento, cubriendo escenarios reales de atención al cliente de un negocio local (consulta sin respuesta, confirmación, recordatorio, agradecimiento post-visita, pedido de reseña, reactivación, promoción, etc.). Tono cercano y profesional. Todo en ${langInstruction}.`;

  const [contentResult, reviewsResult, whatsappResult] = await Promise.allSettled([
    generateFast(contentSchema, contentPrompt, 0.6),
    generateFast(reviewsSchema, reviewsPrompt, 0.6),
    generateFast(whatsappSchema, whatsappPrompt, 0.6),
  ]);

  const errMsg = (r: PromiseRejectedResult) => String(r.reason?.message || r.reason).slice(0, 300);
  if (contentResult.status === "rejected") console.error("[local-lift-package] contentPart falló:", contentResult.reason);
  if (reviewsResult.status === "rejected") console.error("[local-lift-package] reviewsPart falló:", reviewsResult.reason);
  if (whatsappResult.status === "rejected") console.error("[local-lift-package] whatsappPart falló:", whatsappResult.reason);

  const content = contentResult.status === "fulfilled" ? contentResult.value : null;
  const reviewsPart = reviewsResult.status === "fulfilled" ? reviewsResult.value : null;
  const whatsapp = whatsappResult.status === "fulfilled" ? whatsappResult.value : null;

  return {
    rewrittenDescription: content?.rewrittenDescription ?? null,
    services: content?.services ?? null,
    googlePosts: content?.googlePosts ?? null,
    reviewReplies: reviewsPart?.reviewReplies ?? null,
    reviewReplyTemplates: reviewsPart?.reviewReplyTemplates ?? null,
    whatsappMessages: whatsapp?.whatsappMessages ?? null,
    partialFailure: !content || !reviewsPart || !whatsapp,
    errors: {
      content: contentResult.status === "rejected" ? errMsg(contentResult) : null,
      reviews: reviewsResult.status === "rejected" ? errMsg(reviewsResult) : null,
      whatsapp: whatsappResult.status === "rejected" ? errMsg(whatsappResult) : null,
    },
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
    <h2>${lang === "en" ? "10 Google posts" : "10 publicaciones para Google"}</h2>
    <ol>${postsHtml}</ol>
    <h2>${lang === "en" ? "Replies to real reviews" : "Respuestas a reseñas reales"}</h2>
    <ol>${repliesHtml || `<li>${lang === "en" ? "No reviews with text found." : "No se encontraron reseñas con texto."}</li>`}</ol>
    <h2>${lang === "en" ? "Reply templates by rating" : "Plantillas de respuesta por calificación"}</h2>
    <ol>${templatesHtml}</ol>
    <h2>${lang === "en" ? "10 WhatsApp follow-up messages" : "10 mensajes de WhatsApp de seguimiento"}</h2>
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
