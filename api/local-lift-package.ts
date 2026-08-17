import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createPublicKey, verify as cryptoVerify } from "node:crypto";
import { z } from "zod";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { findPlace, findPlaceReviews, generateFast, generateWithFallback, placeDataSummary, type PlaceData } from "./_localLift.js";

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });

// Único email admin real del portal (mismo patrón ya usado en Chroma
// Tech Store/VELVET Admin.tsx para gating por email exacto).
const ADMIN_EMAIL = "cristian2200299@gmail.com";

// FIX DE SEGURIDAD REAL (15 de agosto): este archivo asumía que el
// middleware authenticateToken+requireAdmin de server.ts protegía esta
// ruta -- FALSO en producción. Vercel resuelve /api/local-lift-package
// directo a ESTE archivo (coincidencia exacta de nombre de archivo le gana
// al rewrite genérico /api/(.*) -> /api/index.ts que carga server.ts), así
// que el Express de server.ts NUNCA se ejecuta para este path en Vercel --
// solo en `npm run dev` local. Confirmado en vivo: un POST real sin ningún
// header Authorization devolvía 200 con la lista completa de leads (PII de
// clientes reales) y probablemente podía disparar generate/send también.
//
// Verificación manual (RS256 + Node crypto nativo) en vez de
// firebase-admin/auth: getAuth().verifyIdToken() arrastra `jwks-rsa`, que
// hace require() de `jose` (paquete ESM-only) -- rompe TODA la función acá
// (500 real, confirmado en vivo con `vercel logs`: "ERR_REQUIRE_ESM ...
// jose/dist/webapi/index.js") por el mismo motivo ya documentado en
// Meridian (Fase 53, `ai` SDK import estático tumbando server.cjs entero).
// Mismo patrón ya usado y probado en producción en server.ts
// (verifyFirebaseToken/getGoogleCerts) -- replicado acá tal cual.
let googleCertsCache: { certs: Record<string, string> | null; exp: number } = { certs: null, exp: 0 };
async function getGoogleCerts(): Promise<Record<string, string>> {
  if (googleCertsCache.certs && Date.now() < googleCertsCache.exp) return googleCertsCache.certs;
  const res = await fetch("https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com");
  if (!res.ok) throw new Error("No se pudieron obtener los certificados de Google");
  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAge = cacheControl.match(/max-age=(\d+)/);
  const ttl = maxAge ? parseInt(maxAge[1], 10) * 1000 : 3600 * 1000;
  googleCertsCache = { certs, exp: Date.now() + ttl };
  return certs;
}
async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  const authHeader = (req.headers.authorization as string) || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
    if (header.alg !== "RS256" || !header.kid) return false;
    const certs = await getGoogleCerts();
    const certPem = certs[header.kid];
    if (!certPem) return false;
    const publicKey = createPublicKey(certPem);
    const signedData = Buffer.from(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], "base64url");
    if (!cryptoVerify("RSA-SHA256", signedData, publicKey, signature)) return false;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.aud !== process.env.FIREBASE_PROJECT_ID) return false;
    if (payload.iss !== `https://securetoken.google.com/${process.env.FIREBASE_PROJECT_ID}`) return false;
    if (!payload.exp || nowSec >= payload.exp) return false;
    return (payload.email || "").toLowerCase() === ADMIN_EMAIL;
  } catch {
    return false;
  }
}

const LOCAL_LIFT_PDF_URL = "https://local-lift-package-pdf-wdvfac6mgq-ue.a.run.app";

// Pide el PDF del paquete a la Cloud Function nueva (diseño Claude Design,
// ver Meridian/cloud-functions/local-lift-package-pdf) -- reemplaza el
// volcado de HTML en el cuerpo del correo por un adjunto real y descargable.
async function fetchPackagePdf(params: {
  businessName: string;
  tierLabel: string;
  lang: "es" | "en";
  pkg: LocalLiftPackage;
}): Promise<Buffer | null> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return null;
  const resp = await fetch(LOCAL_LIFT_PDF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
    body: JSON.stringify({
      lang: params.lang,
      businessName: params.businessName,
      tierLabel: params.tierLabel,
      date: new Date().toLocaleDateString(params.lang === "en" ? "en-US" : "es-DO", { year: "numeric", month: "long", day: "numeric" }),
      package: params.pkg,
    }),
  });
  if (!resp.ok) throw new Error(`local-lift-package-pdf ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

const TIER_PRICE: Record<string, { amount: string; label: string }> = {
  "impulso": { amount: "29", label: "Impulso" },
  "ascenso": { amount: "99", label: "Ascenso" },
};

// Genera el paquete completo del tier "Impulso" ($29) / "Ascenso"
// ($99): descripción reescrita, 10 publicaciones para Google Business
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
  // "No pegues URLs completas" -- encontrado en vivo (16 de agosto): el
  // modelo copiaba el sitio web real del negocio (con parámetros UTM largos)
  // tal cual dentro del texto de posts/WhatsApp, dejando un enlace de
  // cientos de caracteres en un mensaje que se manda por WhatsApp real. El
  // campo `cta` de las publicaciones ya cubre la acción real, y un mensaje
  // de WhatsApp no necesita un link con tracking pegado.
  const noUrlsInstruction = "Si un mensaje de WhatsApp necesita un link clickeable (ej. para que el cliente lo reenvíe), usa ÚNICAMENTE el 'link corto' de la ficha de arriba, tal cual, nunca inventes uno ni le agregues parámetros. Para publicaciones de Google no hace falta pegar ningún link -- ya tienen su propio botón de acción (cta).";
  const baseHeader = `Eres un consultor de Polaris Local Lift preparando contenido para este negocio. Datos reales de su ficha de Google (Places API), no inventes cifras ni datos que no estén acá:\n\n${dataBlock}\n\n${noUrlsInstruction}\n\n`;

  const reviewsBlock =
    reviews.length > 0
      ? reviews.map((r, i) => `${i + 1}. [${r.rating}/5] ${r.author}: "${r.text}"`).join("\n")
      : "No hay reseñas con texto disponibles en la ficha.";

  const prompts = {
    description: `${baseHeader}Escribe una descripción reescrita del negocio y una lista de sus servicios/productos reales. Grounded en los datos de arriba. Todo en ${langInstruction}.`,
    posts1: `${baseHeader}Escribe 5 publicaciones breves para Google Business Profile, enfocadas en: ofertas/promociones, novedades, y servicios destacados. Todo en ${langInstruction}.`,
    posts2: `${baseHeader}Escribe otras 5 publicaciones breves para Google Business Profile, enfocadas en: testimonios/reseñas, fechas especiales o temporada, detrás de escena, preguntas frecuentes, y un llamado a la acción directo. No repitas el enfoque de ofertas/novedades/servicios (ya cubierto en otra tanda). Todo en ${langInstruction}.`,
    replies: `${baseHeader}Reseñas reales disponibles (máximo 5, límite real de la API):\n${reviewsBlock}\n\nEscribe una respuesta breve y personalizada a cada reseña real de arriba. Todo en ${langInstruction}.`,
    templates: `${baseHeader}Escribe 5 plantillas breves y genéricas de respuesta a reseñas, una por calificación (1 a 5 estrellas), para reseñas futuras. Todo en ${langInstruction}.`,
    whatsapp1: `${baseHeader}Escribe 5 mensajes breves de WhatsApp de seguimiento para: consulta sin respuesta en 24h, confirmación de reserva/pedido, recordatorio previo a la visita, agradecimiento post-visita, y pedido de reseña. Todo en ${langInstruction}.`,
    whatsapp2: `${baseHeader}Escribe otros 5 mensajes breves de WhatsApp para: reactivación de cliente inactivo, promoción puntual, respuesta a consulta de horario/ubicación, respuesta a consulta de precio, y mensaje de bienvenida a cliente nuevo. No repitas los escenarios de otra tanda (consulta sin respuesta, confirmación, recordatorio, agradecimiento, pedido de reseña). Todo en ${langInstruction}.`,
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

// Logo real de Local Lift (variante "stacked-light" -- LOCAL en navy, pensada
// para un fondo blanco, ver Polaris Product Brand System v1) alojado en
// Storage, mismo patrón que LOGO_URL en local-lift-order.ts/-followup.ts/
// -diagnostic-mailer.ts.
const LOCAL_LIFT_LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/local-lift-logo-v7.png";
const localLiftLogoHeader = `<p style="text-align:center;margin:0 0 20px 0;"><img src="${LOCAL_LIFT_LOGO_URL}" alt="Local Lift by Polaris Web Studio" width="180" style="width:180px;height:auto;display:inline-block;"></p>`;

// El contenido completo del paquete ahora vive en el PDF adjunto (ver
// fetchPackagePdf/local-lift-package-pdf) -- este cuerpo del correo queda
// como un mensaje breve que anuncia el adjunto, en vez de volcar todo el
// contenido en HTML dentro del correo mismo.
function renderPackageEmailBody(businessName: string, contactName: string | null, lang: "es" | "en"): string {
  if (lang === "en") {
    return `
      ${localLiftLogoHeader}
      <p>Hi ${contactName || ""},</p>
      <p>Your Local Lift content package for <strong>${businessName}</strong> is ready — you'll find it attached as a PDF, with everything organized and ready to use: your new business description, services to highlight, Google posts, review replies, templates, and WhatsApp follow-up messages.</p>
    `;
  }
  return `
    ${localLiftLogoHeader}
    <p>Hola ${contactName || ""},</p>
    <p>Tu paquete de contenido Local Lift para <strong>${businessName}</strong> está listo — lo encontrarás adjunto en PDF, con todo organizado y listo para usar: tu nueva descripción del negocio, servicios a destacar, publicaciones para Google, respuestas a reseñas, plantillas y mensajes de WhatsApp de seguimiento.</p>
  `;
}

function renderTeaserHtml(place: { name: string }, pkg: LocalLiftPackage, tier: string, leadId: string, language: "es" | "en"): string {
  const price = TIER_PRICE[tier] || TIER_PRICE["impulso"];
  const postsCount = pkg.googlePosts?.length || 0;
  const repliesCount = pkg.reviewReplies?.length || 0;
  const waCount = pkg.whatsappMessages?.length || 0;
  const payUrl = `https://polarisweb.studio/local-lift/pagar/${leadId}`;
  if (language === "en") {
    return `
      ${localLiftLogoHeader}
      <p>Hi,</p>
      <p>We already prepared your <strong>${price.label}</strong> package for <strong>${place.name}</strong> — everything is ready to send, based on your real Google listing:</p>
      <ul>
        <li>A rewritten description and highlighted services</li>
        <li>${postsCount || 10} Google posts ready to publish</li>
        <li>${repliesCount || "Your"} personalized replies to your real reviews</li>
        <li>${waCount || 10} WhatsApp follow-up messages</li>
      </ul>
      <p>Complete your payment to receive the full package with all the actual content, ready to use:</p>
      <p><a href="${payUrl}" style="display:inline-block;background:#16C8C1;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;">Pay $${price.amount} and get my package</a></p>
      <p>Questions? Just reply to this email or write us on WhatsApp: https://wa.me/18299200544</p>
    `;
  }
  return `
    ${localLiftLogoHeader}
    <p>Hola,</p>
    <p>Ya preparamos tu paquete <strong>${price.label}</strong> para <strong>${place.name}</strong> — todo está listo para enviarte, basado en tu ficha real de Google:</p>
    <ul>
      <li>Descripción reescrita y servicios destacados</li>
      <li>${postsCount || 10} publicaciones listas para tu perfil de Google</li>
      <li>${repliesCount || "Tus"} respuestas personalizadas a tus reseñas reales</li>
      <li>${waCount || 10} mensajes de WhatsApp de seguimiento</li>
    </ul>
    <p>Completa tu pago para recibir el paquete completo con todo el contenido real, listo para usar:</p>
    <p><a href="${payUrl}" style="display:inline-block;background:#16C8C1;color:#fff;padding:12px 24px;border-radius:10px;text-decoration:none;font-weight:bold;">Pagar $${price.amount} y recibir mi paquete</a></p>
    <p>¿Dudas? Responde este correo o escríbenos por WhatsApp: https://wa.me/18299200544</p>
  `;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!(await verifyAdmin(req))) {
    return res.status(403).json({ error: "Acceso denegado." });
  }

  const ip = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip, 30, 15 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento." });
  }

  const { action, businessName, city, lang, email, contactName, tier, leadId, place: givenPlace, package: givenPackage } = req.body || {};
  const language: "es" | "en" = lang === "en" ? "en" : "es";
  const firestore = getFirestore(firebaseApp, "polaris-web-studio");

  try {
    if (action === "leads") {
      // Solo leads YA PAGADOS -- pedido explícito del usuario (16 de agosto):
      // el correo gratis de diagnóstico ya invita a pagar por su cuenta, este
      // panel es únicamente para generar/enviar el contenido de quien ya
      // pagó, no para "proponerle" nada a quien todavía no lo hizo (eso
      // sería un sistema de recordatorios aparte, no implementado todavía).
      const snap = await firestore
        .collection("localLiftDiagnostics")
        .where("paid", "==", true)
        .orderBy("createdAt", "desc")
        .limit(50)
        .get();
      const leads = snap.docs.map((d) => {
        const v = d.data();
        return {
          id: d.id,
          businessName: v.businessName || "",
          city: v.city || "",
          contactName: v.contactName || "",
          email: v.email || "",
          tier: v.tier || "impulso",
          status: v.status || "awaiting_generation",
          paid: !!v.paid,
          source: v.source || "free_diagnostic",
          gbpConnected: !!v.gbp?.refreshToken,
          createdAt: v.createdAt?.toDate?.() || null,
          sentAt: v.sentAt?.toDate?.() || null,
          place: v.placeData || null,
        };
      });
      return res.json({ success: true, leads });
    }

    if (action === "send_teaser") {
      // Manda la propuesta SIN el contenido exacto -- solo highlights reales
      // + botón de pago hacia /local-lift/pagar/:leadId. Nunca revela el
      // paquete completo antes de que el pago quede confirmado.
      if (typeof leadId !== "string" || !leadId.trim()) {
        return res.status(400).json({ error: "Falta el lead a enviar." });
      }
      const docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Lead no encontrado." });
      const lead = doc.data()!;
      if (!lead.place || !lead.package) {
        return res.status(400).json({ error: "Genera el paquete primero antes de enviar la propuesta." });
      }
      const finalEmail = typeof email === "string" && email.trim() ? email.trim() : lead.email;
      const finalContactName = typeof contactName === "string" && contactName.trim() ? contactName.trim() : lead.contactName;
      if (!finalEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(finalEmail)) {
        return res.status(400).json({ error: "El correo del cliente no es válido." });
      }
      const zohoPassword = process.env.ZOHO_PASSWORD;
      if (!zohoPassword) return res.status(500).json({ error: "ZOHO_PASSWORD no configurado." });
      const finalTier = lead.tier || tier || "impulso";
      const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com", port: 465, secure: true,
        auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
      });
      await transporter.sendMail({
        from: '"Polaris Local Lift" <hola@polarisweb.studio>',
        to: finalEmail,
        subject: language === "en" ? `Your Local Lift package is ready — ${lead.place.name}` : `Tu paquete Local Lift está listo — ${lead.place.name}`,
        html: renderTeaserHtml(lead.place, lead.package, finalTier, leadId.trim(), language),
      });
      await docRef.update({
        status: "teaser_sent",
        tier: finalTier,
        contactName: finalContactName || lead.contactName || null,
        email: finalEmail,
        teaserSentAt: new Date(),
      });
      return res.json({ success: true, sent: true });
    }

    if (action === "send") {
      // Envía el paquete COMPLETO -- exige que el lead ya esté pagado
      // (cuando se rastrea con leadId) para nunca regalar el contenido real
      // antes del pago. Sin leadId (uso manual/legacy) no se puede validar
      // el pago, así que se deja pasar -- comportamiento previo preservado.
      if (!givenPlace || !givenPackage) {
        return res.status(400).json({ error: "Falta 'place' o 'package' para enviar." });
      }
      if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: "El correo no es válido." });
      }
      let docRef = null;
      if (typeof leadId === "string" && leadId.trim()) {
        docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
        const doc = await docRef.get();
        if (!doc.exists) return res.status(404).json({ error: "Lead no encontrado." });
        if (!doc.data()!.paid) {
          return res.status(400).json({ error: "Este lead todavía no ha pagado. Envía la propuesta primero (botón 'Enviar propuesta')." });
        }
      }
      const zohoPassword = process.env.ZOHO_PASSWORD;
      if (!zohoPassword) {
        return res.status(500).json({ error: "ZOHO_PASSWORD no configurado — no se puede enviar." });
      }
      const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true,
        auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
      });
      const connectCta =
        typeof leadId === "string" && leadId.trim()
          ? `<p style="margin-top:24px;">${
              language === "en"
                ? `Want us to publish this directly on your real Google listing? <a href="https://polarisweb.studio/local-lift/conectar/${leadId.trim()}">Connect your Google Business Profile</a> (optional, you approve everything before we publish anything).`
                : `¿Quieres que publiquemos esto directo en tu ficha real de Google? <a href="https://polarisweb.studio/local-lift/conectar/${leadId.trim()}">Conecta tu Google Business Profile</a> (opcional, apruebas todo antes de que publiquemos nada).`
            }</p>`
          : "";
      const finalTier2 = (docRef ? (await docRef.get()).data()?.tier : tier) || tier || "impulso";
      const tierLabelForPdf = TIER_PRICE[finalTier2]?.label || TIER_PRICE["impulso"].label;
      let pdfBuffer: Buffer | null = null;
      try {
        pdfBuffer = await fetchPackagePdf({
          businessName: givenPlace.name,
          tierLabel: tierLabelForPdf,
          lang: language,
          pkg: givenPackage,
        });
      } catch (pdfErr) {
        console.error("[local-lift-package] Error generando PDF, se envía sin adjunto:", pdfErr);
      }
      await transporter.sendMail({
        from: '"Polaris Local Lift" <hola@polarisweb.studio>',
        to: email,
        subject: language === "en" ? `Your Local Lift content package — ${givenPlace.name}` : `Tu paquete de contenido Local Lift — ${givenPlace.name}`,
        html: `${renderPackageEmailBody(givenPlace.name, contactName || null, language)}${connectCta}`,
        attachments: pdfBuffer
          ? [{ filename: `Local-Lift-${givenPlace.name.replace(/[^a-zA-Z0-9-]+/g, "-")}.pdf`, content: pdfBuffer, contentType: "application/pdf" }]
          : [],
      });
      if (docRef) {
        await docRef.update({
          status: "sent",
          contactName: contactName || null,
          email,
          sentAt: new Date(),
          ...(pdfBuffer ? { pdfBase64: pdfBuffer.toString("base64") } : {}),
        });
        // Avisa al portal (si el proyecto de este cliente ya está vinculado a
        // este lead) para que deje de mostrar "preparando tu paquete" y
        // muestre el paquete real como entregado. Nunca bloquea la respuesta
        // real al admin si el portal no responde.
        try {
          const cronSecret = process.env.CRON_SECRET;
          const portalUrl = process.env.PORTAL_BASE_URL || "https://polarisweb.studio";
          if (cronSecret) {
            await fetch(`${portalUrl}/api/portal/local-lift/package-sent`, {
              method: "POST",
              headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
              body: JSON.stringify({ leadId: leadId.trim() }),
            });
          }
        } catch (notifyErr) {
          console.error("[local-lift-package] Error avisando al portal que el paquete se envió:", notifyErr);
        }
      }
      return res.json({ success: true, sent: true });
    }

    if (action === "preview_pdf") {
      // Genera el PDF real con el contenido actual, para que el admin lo vea
      // ANTES de decidir enviarlo -- nunca manda correo ni toca el lead.
      // Si no le gusta, vuelve a "Generar paquete" y pide otra vista previa.
      if (!givenPlace || !givenPackage) {
        return res.status(400).json({ error: "Falta 'place' o 'package' para la vista previa." });
      }
      const finalTierPreview = (typeof leadId === "string" && leadId.trim() ? (await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get()).data()?.tier : tier) || tier || "impulso";
      const tierLabelPreview = TIER_PRICE[finalTierPreview]?.label || TIER_PRICE["impulso"].label;
      let previewPdf: Buffer | null = null;
      try {
        previewPdf = await fetchPackagePdf({
          businessName: givenPlace.name,
          tierLabel: tierLabelPreview,
          lang: language,
          pkg: givenPackage,
        });
      } catch (pdfErr) {
        console.error("[local-lift-package] Error generando vista previa del PDF:", pdfErr);
      }
      if (!previewPdf) return res.status(500).json({ error: "No pudimos generar la vista previa." });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=\"vista-previa.pdf\"");
      return res.status(200).send(previewPdf);
    }

    if (action === "regenerate_snippet") {
      // Regenera UNA sola pieza del paquete (una publicación, una respuesta,
      // una plantilla, un mensaje, o la descripción) -- pedido explícito del
      // usuario: poder corregir un solo párrafo sin tener que rehacer el
      // paquete completo ni editar el PDF a mano. Nunca toca el resto del
      // contenido, el cliente decide qué reemplazar en su propio estado.
      const { kind, current, instruction } = req.body || {};
      if (!givenPlace || !kind || !current) {
        return res.status(400).json({ error: "Falta 'place', 'kind' o 'current'." });
      }
      const place = givenPlace as PlaceData;
      const dataBlock = placeDataSummary(place);
      const langInstruction = language === "en" ? "inglés" : "español neutro, sin voseo";
      const baseHeader = `Eres un consultor de Polaris Local Lift preparando contenido para este negocio. Datos reales de su ficha de Google (Places API), no inventes cifras ni datos que no estén acá:\n\n${dataBlock}\n\nSi un mensaje de WhatsApp necesita un link clickeable (ej. para que el cliente lo reenvíe), usa ÚNICAMENTE el 'link corto' de la ficha de arriba, tal cual, nunca inventes uno ni le agregues parámetros. Para publicaciones de Google no hace falta pegar ningún link, ya tienen su propio botón de acción (cta).\n\n`;
      const instructionLine = typeof instruction === "string" && instruction.trim()
        ? `Instrucción real del admin sobre qué cambiar: "${instruction.trim()}". Aplícala tal cual, sin ignorarla.`
        : "No hay instrucción puntual: genera una alternativa igual de buena, distinta a la actual.";

      try {
        if (kind === "description") {
          const schema = z.object({ rewrittenDescription: z.string().describe("Descripción reescrita de la ficha de Google (máx. 750 caracteres).") });
          const prompt = `${baseHeader}Descripción actual: "${current.rewrittenDescription || ""}"\n\nReescribe SOLO la descripción del negocio. ${instructionLine} Todo en ${langInstruction}.`;
          const result = await generateWithFallback(schema, prompt, 0.65);
          return res.json({ success: true, result });
        }
        if (kind === "post") {
          const schema = z.object({
            title: z.string().describe("Título corto de la publicación (máx. 10 palabras)."),
            body: z.string().describe("Texto de la publicación para Google Business Profile, máx. 800 caracteres."),
            cta: z.enum(["Reservar", "Llamar ahora", "Ver más", "Comprar", "Cómo llegar", "Ninguno"]),
          });
          const prompt = `${baseHeader}Publicación actual:\nTítulo: "${current.title || ""}"\nTexto: "${current.body || ""}"\nCTA: "${current.cta || ""}"\n\nReescribe SOLO esta publicación para Google Business Profile. ${instructionLine} Todo en ${langInstruction}.`;
          const result = await generateWithFallback(schema, prompt, 0.65);
          return res.json({ success: true, result });
        }
        if (kind === "reply") {
          const schema = z.object({ reply: z.string().describe("Respuesta breve y personalizada a esa reseña real.") });
          const prompt = `${baseHeader}Reseña real: [${current.rating}/5] ${current.author}: "${current.originalText}"\n\nRespuesta actual: "${current.reply || ""}"\n\nReescribe SOLO la respuesta a esta reseña real (nunca inventes datos de la reseña misma). ${instructionLine} Todo en ${langInstruction}.`;
          const result = await generateWithFallback(schema, prompt, 0.65);
          return res.json({ success: true, result: { ...result, author: current.author, rating: current.rating, originalText: current.originalText } });
        }
        if (kind === "template") {
          const schema = z.object({ template: z.string().describe("Plantilla breve y genérica de respuesta, con [corchetes] donde el cliente personaliza.") });
          const prompt = `${baseHeader}Plantilla actual (para calificación ${current.forRating}/5): "${current.template || ""}"\n\nReescribe SOLO esta plantilla genérica. ${instructionLine} Todo en ${langInstruction}.`;
          const result = await generateWithFallback(schema, prompt, 0.65);
          return res.json({ success: true, result: { ...result, forRating: current.forRating } });
        }
        if (kind === "whatsapp") {
          const schema = z.object({
            scenario: z.string().describe("Escenario breve (ej. 'Consulta sin respuesta en 24h')."),
            message: z.string().describe("Mensaje breve de WhatsApp listo para adaptar."),
          });
          const prompt = `${baseHeader}Mensaje actual:\nEscenario: "${current.scenario || ""}"\nMensaje: "${current.message || ""}"\n\nReescribe SOLO este mensaje de WhatsApp. ${instructionLine} Todo en ${langInstruction}.`;
          const result = await generateWithFallback(schema, prompt, 0.65);
          return res.json({ success: true, result });
        }
        return res.status(400).json({ error: "Tipo de pieza inválido." });
      } catch (regenErr) {
        console.error("[local-lift-package] Error regenerando pieza:", regenErr);
        return res.status(500).json({ error: "No pudimos regenerar esta parte. Intenta de nuevo." });
      }
    }

    if (action === "download_pdf") {
      // Descarga del paquete ya enviado -- usado por el portal de cliente
      // para ofrecer el mismo PDF que recibió por correo, sin regenerarlo
      // (se guarda en base64 al momento del envío, ver acción "send").
      if (typeof leadId !== "string" || !leadId.trim()) {
        return res.status(400).json({ error: "Falta el lead." });
      }
      const doc = await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get();
      if (!doc.exists) return res.status(404).json({ error: "Lead no encontrado." });
      const lead = doc.data()!;
      if (!lead.pdfBase64) return res.status(404).json({ error: "Este paquete todavía no tiene un PDF generado." });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Local-Lift-${(lead.businessName || "paquete").replace(/[^a-zA-Z0-9-]+/g, "-")}.pdf"`);
      return res.status(200).send(Buffer.from(lead.pdfBase64, "base64"));
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

    // Cada generación queda rastreada como un lead -- si viene un leadId
    // existente (lead ya originado por el diagnóstico gratis o un pago
    // directo) se actualiza preservando su `paid`/`status` real; si no,
    // se crea uno nuevo (ej. admin busca un negocio nuevo desde cero en el
    // panel) para que siempre haya un lead consistente al que mandarle algo.
    let finalLeadId = typeof leadId === "string" && leadId.trim() ? leadId.trim() : null;
    let finalStatus = "package_ready";
    let finalPaid = false;
    try {
      if (finalLeadId) {
        const docRef = firestore.collection("localLiftDiagnostics").doc(finalLeadId);
        const existing = await docRef.get();
        if (existing.exists) {
          const v = existing.data()!;
          finalPaid = !!v.paid;
          await docRef.update({ place, package: pkg, tier: tier || v.tier || "impulso", status: "package_ready", businessName: place.name, city });
        } else {
          finalLeadId = null; // lead inválido/borrado — cae al branch de creación abajo
        }
      }
      if (!finalLeadId) {
        const docRef = await firestore.collection("localLiftDiagnostics").add({
          businessName: place.name,
          city,
          contactName: contactName || null,
          email: email || null,
          place,
          package: pkg,
          tier: tier || "impulso",
          status: "package_ready",
          paid: false,
          source: "admin_manual",
          createdAt: new Date(),
        });
        finalLeadId = docRef.id;
      }
    } catch (dbErr) {
      console.error("[local-lift-package] Error guardando lead:", dbErr);
    }

    return res.json({ success: true, place, reviews, package: pkg, leadId: finalLeadId, status: finalStatus, paid: finalPaid });
  } catch (error: any) {
    console.error("[local-lift-package] Error:", error);
    return res.status(500).json({ error: error?.message || "No se pudo generar/enviar el paquete." });
  }
}
