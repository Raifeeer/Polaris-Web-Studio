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
  place?: PlaceData | null;
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
      place: params.place || null,
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

const reviewAnalysisSchema = z.object({
  headline: z.string().describe("Titular breve que resuma la lectura de la muestra de reseñas, sin prometer resultados."),
  overview: z.string().describe("Resumen de 2-3 frases sobre lo que expresa la muestra y cómo puede afectar la decisión de futuros clientes."),
  recurringThemes: z.array(z.object({
    theme: z.string().describe("Tema recurrente identificado en las reseñas."),
    evidence: z.string().describe("Evidencia breve basada únicamente en las reseñas proporcionadas."),
    impact: z.string().describe("Por qué este tema importa para la experiencia o la conversión."),
  })).min(1).max(4),
  strengths: z.array(z.string()).min(1).max(4).describe("Fortalezas que conviene conservar y reforzar."),
  frictionPoints: z.array(z.string()).min(1).max(4).describe("Fricciones o riesgos que conviene atender, sin inventar problemas."),
  bestPractices: z.array(z.object({
    title: z.string().describe("Nombre corto de la buena práctica."),
    action: z.string().describe("Acción concreta y personalizada que el negocio puede aplicar."),
    why: z.string().describe("Por qué esta acción responde a la evidencia encontrada."),
  })).min(3).max(5),
  responseGuidance: z.array(z.string()).min(1).max(4).describe("Orientaciones personalizadas para responder futuras reseñas con coherencia."),
});

type DescPart = z.infer<typeof descriptionSchema>;
type PostsHalfPart = z.infer<typeof postsHalfSchema>;
type RepliesPart = z.infer<typeof repliesSchema>;
type TemplatesPart = z.infer<typeof templatesSchema>;
type WhatsappHalfPart = z.infer<typeof whatsappHalfSchema>;
type ReviewAnalysisPart = z.infer<typeof reviewAnalysisSchema>;
type PackageTier = "impulso" | "ascenso";

function normalizeTier(value: unknown): PackageTier {
  return value === "ascenso" || value === "implementado" ? "ascenso" : "impulso";
}

interface LocalLiftPackage {
  rewrittenDescription: string | null;
  services: string[] | null;
  googlePosts: PostsHalfPart["googlePosts"] | null;
  reviewReplies: RepliesPart["reviewReplies"] | null;
  reviewReplyTemplates: TemplatesPart["reviewReplyTemplates"] | null;
  reviewAnalysis: ReviewAnalysisPart | null;
  reviewAnalysisNote: string | null;
  whatsappMessages: WhatsappHalfPart["whatsappMessages"] | null;
  partialFailure: boolean;
  errors: Record<"description" | "posts1" | "posts2" | "replies" | "templates" | "reviewAnalysis" | "whatsapp1" | "whatsapp2", string | null>;
}

async function generatePackage(
  place: NonNullable<Awaited<ReturnType<typeof findPlace>>>,
  reviews: Awaited<ReturnType<typeof findPlaceReviews>>,
  lang: "es" | "en",
  tier: PackageTier,
  onlyKeys?: Array<keyof LocalLiftPackage["errors"]>
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
    reviewAnalysis: `${baseHeader}Reseñas reales disponibles, ordenadas por fecha cuando Google lo permite (hasta 5, no son el historial completo):\n${reviewsBlock}\n\nRealiza un análisis profundo y honesto de esta muestra para un paquete Ascenso. Identifica temas recurrentes, fortalezas, fricciones y buenas prácticas personalizadas. Basa cada observación únicamente en el texto y la calificación recibidos. Si la muestra es pequeña, dilo con claridad. No inventes problemas, contexto, clientes, fechas, resultados ni promesas de ranking. Las recomendaciones deben ser concretas para este negocio y útiles para mejorar la experiencia y la forma de responder futuras reseñas. Todo en ${langInstruction}.`,
  };

  // DeepSeek queda afuera de este endpoint -- probado en vivo varias
  // rondas: falló la enorme mayoría de las veces que se usó acá (con o sin
  // concurrencia), mientras Grok y Gemini toleraron bien 3-4 llamados
  // paralelos cada uno. Repartido entre esos dos únicamente.
  const allCalls: Array<[keyof LocalLiftPackage["errors"], () => Promise<any>]> = [
    ["description", () => generateFast(descriptionSchema, prompts.description, 0.6, "gemini")],
    ["posts1", () => generateFast(postsHalfSchema, prompts.posts1, 0.6, "grok")],
    ["posts2", () => generateFast(postsHalfSchema, prompts.posts2, 0.6, "gemini")],
    ["replies", () => generateFast(repliesSchema, prompts.replies, 0.6, "grok")],
    ["templates", () => generateFast(templatesSchema, prompts.templates, 0.6, "gemini")],
    ["whatsapp1", () => generateFast(whatsappHalfSchema, prompts.whatsapp1, 0.6, "grok")],
    ["whatsapp2", () => generateFast(whatsappHalfSchema, prompts.whatsapp2, 0.6, "gemini")],
  ];
  if (tier === "ascenso" && reviews.length > 0) {
    allCalls.push(["reviewAnalysis", () => generateFast(reviewAnalysisSchema, prompts.reviewAnalysis, 0.6, "gemini")]);
  }

  // `onlyKeys` (usado en el reintento automático de piezas fallidas): con
  // muchas menos llamadas corriendo en paralelo hay mucha menos contención
  // real por proveedor, así que se usa `generateWithFallback` (encadena los
  // 3 proveedores en serie, hasta 25s cada uno) en vez de `generateFast` --
  // el presupuesto de 10s de Vercel Hobby ya no aplica igual porque esta
  // ronda corre en una invocación aparte de la función, con 1-2 piezas
  // nada más, así que sí cabe encadenar reintentos reales entre proveedores.
  const retrySchemas: Record<keyof LocalLiftPackage["errors"], any> = {
    description: descriptionSchema,
    posts1: postsHalfSchema,
    posts2: postsHalfSchema,
    replies: repliesSchema,
    templates: templatesSchema,
    whatsapp1: whatsappHalfSchema,
    whatsapp2: whatsappHalfSchema,
    reviewAnalysis: reviewAnalysisSchema,
  };
  const calls = onlyKeys
    ? onlyKeys.map((key) => [key, () => generateWithFallback(retrySchemas[key], (prompts as any)[key], 0.6)] as [keyof LocalLiftPackage["errors"], () => Promise<any>])
    : allCalls;

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
  const reviewAnalysis = values.reviewAnalysis as ReviewAnalysisPart | null;
  errors.reviewAnalysis = errors.reviewAnalysis ?? null;

  const googlePosts = [...(posts1?.googlePosts || []), ...(posts2?.googlePosts || [])];
  const whatsappMessages = [...(wa1?.whatsappMessages || []), ...(wa2?.whatsappMessages || [])];

  return {
    rewrittenDescription: desc?.rewrittenDescription ?? null,
    services: desc?.services ?? null,
    googlePosts: googlePosts.length > 0 ? googlePosts : null,
    reviewReplies: repliesPart?.reviewReplies ?? null,
    reviewReplyTemplates: templates?.reviewReplyTemplates ?? null,
    reviewAnalysis: tier === "ascenso" ? reviewAnalysis ?? null : null,
    reviewAnalysisNote: tier === "ascenso"
      ? reviews.length > 0
        ? "Análisis basado en una muestra de hasta cinco reseñas disponibles; no representa el historial completo del negocio."
        : "Google no devolvió reseñas con texto analizables para este negocio en esta consulta."
      : null,
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

// Plantilla de entrega de Local Lift. Se mantiene deliberadamente en HTML
// autocontenido: muchos clientes de correo bloquean hojas de estilo externas,
// por eso la estructura usa tablas y estilos inline. El PDF sigue siendo la
// entrega completa; este mensaje funciona como una portada visual y guía de
// siguientes pasos.
const LOCAL_LIFT_LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/local-lift-logo-v7.png";
const LOCAL_LIFT_ACCENT = "#16C8C1";
const LOCAL_LIFT_NAVY = "#111936";
const LOCAL_LIFT_MIST = "#F2FFFF";
const localLiftLogoHeader = `<img src="${LOCAL_LIFT_LOGO_URL}" alt="Local Lift by Polaris Web Studio" width="140" style="width:140px;height:auto;display:block;margin:0 auto;">`;

function escapeHtml(value: string | null | undefined): string {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function renderPackageEmailBody(
  businessName: string,
  contactName: string | null,
  lang: "es" | "en",
  tier: PackageTier,
  pkg: LocalLiftPackage,
  connectUrl?: string,
): string {
  const safeBusinessName = escapeHtml(businessName);
  const safeContactName = escapeHtml(contactName);
  const greeting = safeContactName ? (lang === "en" ? `Hi ${safeContactName},` : `Hola ${safeContactName},`) : lang === "en" ? "Hi," : "Hola,";
  const isEnglish = lang === "en";
  const reviewLine = tier === "ascenso" && pkg.reviewAnalysis
    ? isEnglish
      ? "Recent review analysis with personalized best practices"
      : "Análisis de reseñas recientes con buenas prácticas personalizadas"
    : "";
  const connectButton = connectUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr><td align="center"><a href="${connectUrl}" target="_blank" style="display:inline-block;background:#4f46e5;color:#ffffff;text-decoration:none;font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;line-height:1.2;padding:14px 24px;border-radius:8px;">${isEnglish ? "Connect my Google Business Profile" : "Conectar mi Perfil de Empresa de Google"}</a></td></tr></table>`
    : "";
  const connectNote = connectUrl
    ? isEnglish
      ? "Optional: you approve everything before anything is published."
      : "Opcional: apruebas todo antes de que publiquemos cualquier cosa."
    : "";

  const content = isEnglish
    ? {
        eyebrow: "YOUR PACKAGE IS READY",
        title: "Your Local Lift package is ready",
        intro: "Your complete PDF is attached with the content prepared for your business. Open it when you have a moment and start applying the changes in the order that makes the most sense for you.",
        cardTitle: "Inside your package",
        items: ["Rewritten business description", "Services and CTAs to highlight", "Google posts ready to adapt", "Personalized review replies", "WhatsApp follow-up messages", "A clear set of next steps"],
        ctaTitle: "Want us to help put it into motion?",
        ctaBody: "Connect your Google Business Profile and we can review the prepared content with you before anything is published.",
        signature: "The Polaris Local Lift team",
      }
    : {
        eyebrow: "TU PAQUETE ESTÁ LISTO",
        title: "Tu paquete Local Lift está listo",
        intro: "Adjuntamos tu PDF completo con el contenido preparado para tu negocio. Ábrelo cuando tengas un momento y empieza a aplicar los cambios en el orden que más sentido tenga para ti.",
        cardTitle: "Qué encontrarás dentro",
        items: ["Nueva descripción del negocio", "Servicios y llamadas a la acción", "Publicaciones para Google listas para adaptar", "Respuestas personalizadas a reseñas", "Mensajes de seguimiento para WhatsApp", "Siguientes pasos claros para avanzar"],
        ctaTitle: "¿Quieres que te ayudemos a ponerlo en marcha?",
        ctaBody: "Conecta tu Perfil de Empresa de Google y revisamos contigo el contenido preparado antes de publicar cualquier cosa.",
        signature: "El equipo de Polaris Local Lift",
      };

  const items = reviewLine
    ? [...content.items.slice(0, 5), reviewLine, content.items[5]]
    : content.items;
  const itemRows = items
    .map((item) => `<tr><td width="36" valign="middle" style="padding:0 0 14px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" valign="middle" style="width:30px;height:30px;border-radius:50%;background:#E8FBFA;color:#16C8C1;font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:13px;">&#10003;</td></tr></table></td><td valign="middle" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1f2937;padding:0 0 14px 12px;">${item}</td></tr>`)
    .join("");
  const connectBlock = connectUrl
    ? `<tr><td class="email-pad" style="padding:28px 40px 0;text-align:center;"><div style="border:1px solid #e2e8f0;border-radius:10px;padding:22px 24px;text-align:center;"><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:16px;line-height:1.35;color:#0f172a;margin-bottom:9px;">${content.ctaTitle}</div><p style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:#1f2937;margin:0 0 18px;">${content.ctaBody}<br><span style="font-size:12px;color:#64748b;">${connectNote}</span></p>${connectButton}</div></td></tr>`
    : "";

  return `<!DOCTYPE html><html lang="${isEnglish ? "en" : "es"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,500&f[]=satoshi@400,500,700&display=swap" rel="stylesheet"><title>${content.title}</title><style>body{margin:0;}a{text-decoration:none;color:#4f46e5;}.email-card{width:100% !important;max-width:600px !important;box-sizing:border-box !important;}.email-pad{padding-left:24px !important;padding-right:24px !important;}.email-item-card{box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;}</style></head><body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f8fafc;opacity:0;">${content.title} — ${safeBusinessName}</div><div style="width:100%;min-height:100vh;background:#f8fafc;padding:48px 16px;box-sizing:border-box;font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;"><table class="email-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><tr><td class="email-pad" style="padding:40px 40px 0;text-align:center;">${localLiftLogoHeader}</td></tr><tr><td class="email-pad" style="padding:8px 40px 8px;text-align:center;"><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#0284c7;margin-bottom:14px;">${content.eyebrow}</div><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.3;color:#0f172a;">${content.title}</div></td></tr><tr><td class="email-pad" style="padding:16px 40px 0;text-align:center;"><p style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1f2937;margin:0;">${greeting}<br>${content.intro}</p></td></tr><tr><td class="email-pad" style="padding:24px 40px 0;"><div class="email-item-card" style="border:1px solid #e2e8f0;border-radius:10px;padding:22px 24px;"><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:14px;color:#0f172a;margin-bottom:16px;">${content.cardTitle}</div><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:15px;line-height:1.4;color:#0f172a;margin-bottom:18px;">${safeBusinessName}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table></div></td></tr>${connectBlock}<tr><td class="email-pad" style="padding:40px 40px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr><tr><td class="email-pad" style="padding:28px 40px 0;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;"><tr><td style="padding:0 10px;"><a href="https://www.instagram.com/polariswebstudio/" target="_blank" rel="noopener noreferrer"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-instagram.png" width="22" height="22" alt="Instagram" style="width:22px;height:22px;display:block;"></a></td><td style="padding:0 10px;"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-facebook.png" width="22" height="22" alt="Facebook" style="width:22px;height:22px;display:block;"></td><td style="padding:0 10px;"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-x.png" width="22" height="22" alt="X" style="width:22px;height:22px;display:block;"></td><td style="padding:0 10px;"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-linkedin.png" width="22" height="22" alt="LinkedIn" style="width:22px;height:22px;display:block;"></td></tr></table></td></tr><tr><td class="email-pad" style="padding:0 40px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr><tr><td class="email-pad" style="padding:24px 40px 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:320px;margin:0 auto 16px auto;"><tr><td width="33%" style="text-align:left;white-space:nowrap;"><a href="https://www.polarisweb.studio" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#1f2937;">Sitio web</a></td><td width="34%" style="text-align:center;white-space:nowrap;"><a href="https://wa.me/18299200544" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#1f2937;">WhatsApp</a></td><td width="33%" style="text-align:right;white-space:nowrap;"><a href="mailto:hola@polarisweb.studio" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#1f2937;">Contacto</a></td></tr></table><div style="text-align:center;margin-bottom:16px;"><a href="https://www.polarisweb.studio/privacidad" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;">Privacidad</a><span style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;">&nbsp;&middot;&nbsp;</span><a href="https://www.polarisweb.studio/terminos" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;">Términos y condiciones</a></div><div style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;line-height:1.6;text-align:center;">Polaris Web Studio · República Dominicana · <a href="mailto:hola@polarisweb.studio" style="color:#64748b;text-decoration:underline;">hola@polarisweb.studio</a><br>Recibiste este correo porque adquiriste un paquete de contenido de Local Lift.</div></td></tr></table></div></body></html>`;
}

function renderPackageEmailText(businessName: string, contactName: string | null, lang: "es" | "en", connectUrl?: string): string {
  const safeBusinessName = businessName;
  const greeting = contactName ? (lang === "en" ? `Hi ${contactName},` : `Hola ${contactName},`) : lang === "en" ? "Hi," : "Hola,";
  const isEnglish = lang === "en";
  const items = isEnglish
    ? ["Rewritten business description", "Services and CTAs to highlight", "Google posts ready to adapt", "Personalized review replies", "WhatsApp follow-up messages", "Clear next steps"]
    : ["Nueva descripción del negocio", "Servicios y llamadas a la acción", "Publicaciones para Google listas para adaptar", "Respuestas personalizadas a reseñas", "Mensajes de seguimiento para WhatsApp", "Siguientes pasos claros"];
  const lines = [
    isEnglish ? "YOUR PACKAGE IS READY" : "TU PAQUETE ESTÁ LISTO",
    isEnglish ? "Your Local Lift package is ready" : "Tu paquete Local Lift está listo",
    "",
    greeting,
    isEnglish ? `Your complete PDF for ${safeBusinessName} is attached with the content prepared for your business.` : `Tu PDF completo para ${safeBusinessName} está adjunto con el contenido preparado para tu negocio.`,
    "",
    isEnglish ? "Inside your package:" : "Qué encontrarás dentro:",
    ...items.map((item) => `- ${item}`),
    "",
  ];
  if (connectUrl) lines.push("", isEnglish ? `Connect your Google Business Profile: ${connectUrl}` : `Conecta tu Perfil de Empresa de Google: ${connectUrl}`);
  lines.push("", isEnglish ? "The Polaris Local Lift team" : "El equipo de Polaris Local Lift");
  return lines.join("\n");
}

function renderTeaserHtml(place: { name: string }, pkg: LocalLiftPackage, tier: string, leadId: string, language: "es" | "en"): string {
  const price = TIER_PRICE[tier] || TIER_PRICE["impulso"];
  const postsCount = pkg.googlePosts?.length || 0;
  const repliesCount = pkg.reviewReplies?.length || 0;
  const waCount = pkg.whatsappMessages?.length || 0;
  const reviewAnalysisLine = tier === "ascenso" && pkg.reviewAnalysis
    ? language === "en"
      ? "A reading of recent available reviews with personalized best practices"
      : "Lectura de reseñas recientes disponibles con buenas prácticas personalizadas"
    : "";
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
        ${reviewAnalysisLine ? `<li>${reviewAnalysisLine}</li>` : ""}
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
      ${reviewAnalysisLine ? `<li>${reviewAnalysisLine}</li>` : ""}
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
  const requestedTier = normalizeTier(tier);
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
          tier: normalizeTier(v.tier),
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
      const finalTier = normalizeTier(lead.tier || tier);
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
      const connectUrl =
        typeof leadId === "string" && leadId.trim()
          ? `https://polarisweb.studio/local-lift/conectar/${leadId.trim()}`
          : undefined;
      const finalTier2 = normalizeTier(docRef ? (await docRef.get()).data()?.tier : tier);
      const tierLabelForPdf = TIER_PRICE[finalTier2]?.label || TIER_PRICE["impulso"].label;
      let pdfBuffer: Buffer | null = null;
      try {
        pdfBuffer = await fetchPackagePdf({
          businessName: givenPlace.name,
          tierLabel: tierLabelForPdf,
          lang: language,
          pkg: givenPackage,
          place: givenPlace,
        });
      } catch (pdfErr) {
        console.error("[local-lift-package] Error generando PDF, se envía sin adjunto:", pdfErr);
      }
      await transporter.sendMail({
        from: '"Polaris Local Lift" <hola@polarisweb.studio>',
        to: email,
        subject: language === "en" ? `Your Local Lift content package — ${givenPlace.name}` : `Tu paquete de contenido Local Lift — ${givenPlace.name}`,
text: renderPackageEmailText(givenPlace.name, contactName || null, language, connectUrl),
        html: renderPackageEmailBody(givenPlace.name, contactName || null, language, finalTier2, givenPackage, connectUrl),
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
      const finalTierPreview = normalizeTier(typeof leadId === "string" && leadId.trim() ? (await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get()).data()?.tier : tier);
      const tierLabelPreview = TIER_PRICE[finalTierPreview]?.label || TIER_PRICE["impulso"].label;
      let previewPdf: Buffer | null = null;
      try {
        previewPdf = await fetchPackagePdf({
          businessName: givenPlace.name,
          tierLabel: tierLabelPreview,
          lang: language,
          pkg: givenPackage,
          place: givenPlace,
        });
      } catch (pdfErr) {
        console.error("[local-lift-package] Error generando vista previa del PDF:", pdfErr);
      }
      if (!previewPdf) return res.status(500).json({ error: "No pudimos generar la vista previa." });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", "inline; filename=\"vista-previa.pdf\"");
      return res.status(200).send(previewPdf);
    }

    if (action === "retry_failed_parts") {
      // Reintenta SOLO las piezas que fallaron en la generación original
      // (ver 'errors' del paquete) -- pedido explícito del usuario tras ver
      // que el aviso de "no se pudieron generar estas partes" salía muy
      // seguido. La generación normal manda 7 llamados en paralelo repartidos
      // entre Grok/Gemini con un presupuesto de 9.2s cada uno (límite duro de
      // 10s de Vercel Hobby) -- con esa concurrencia, alguno falla por
      // saturación momentánea con más frecuencia de la deseada. Este
      // reintento corre en una invocación aparte, con muchas menos piezas en
      // paralelo (normalmente 1), así que hay margen real para usar
      // generateWithFallback (encadena los 3 proveedores en serie) en vez de
      // un único intento -- baja mucho la probabilidad de fallar de nuevo.
      const { existingPackage } = req.body || {};
      if (!givenPlace || !existingPackage || !existingPackage.errors) {
        return res.status(400).json({ error: "Falta 'place' o 'existingPackage'." });
      }
      const failedKeys = (Object.entries(existingPackage.errors) as Array<[string, string | null]>)
        .filter(([, err]) => err !== null)
        .map(([key]) => key) as Array<keyof LocalLiftPackage["errors"]>;
      if (failedKeys.length === 0) {
        return res.json({ success: true, package: existingPackage });
      }
      try {
        const place = givenPlace as PlaceData;
        const reviews = await findPlaceReviews(place.id, language, { newest: requestedTier === "ascenso" });
        const retried = await generatePackage(place, reviews, language, requestedTier, failedKeys);

        const merged: LocalLiftPackage = {
          ...existingPackage,
          errors: { ...existingPackage.errors },
        };
        for (const key of failedKeys) {
          if (retried.errors[key] !== null) continue; // sigue fallando, se deja el error tal cual
          merged.errors[key] = null;
          if (key === "description") {
            merged.rewrittenDescription = retried.rewrittenDescription;
            merged.services = retried.services;
          } else if (key === "replies") {
            merged.reviewReplies = retried.reviewReplies;
          } else if (key === "templates") {
            merged.reviewReplyTemplates = retried.reviewReplyTemplates;
          } else if (key === "reviewAnalysis") {
            merged.reviewAnalysis = retried.reviewAnalysis;
          } else if (key === "posts1" || key === "posts2") {
            const existingPosts = [...(merged.googlePosts || [])];
            while (existingPosts.length < 10) existingPosts.push(null as any);
            const offset = key === "posts1" ? 0 : 5;
            (retried.googlePosts || []).forEach((p, i) => { existingPosts[offset + i] = p; });
            merged.googlePosts = existingPosts.filter(Boolean);
          } else if (key === "whatsapp1" || key === "whatsapp2") {
            const existingWa = [...(merged.whatsappMessages || [])];
            while (existingWa.length < 10) existingWa.push(null as any);
            const offset = key === "whatsapp1" ? 0 : 5;
            (retried.whatsappMessages || []).forEach((m, i) => { existingWa[offset + i] = m; });
            merged.whatsappMessages = existingWa.filter(Boolean);
          }
        }
        merged.partialFailure = Object.values(merged.errors).some((e) => e !== null);

        if (typeof leadId === "string" && leadId.trim()) {
          try {
            await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).update({ package: merged });
          } catch (dbErr) {
            console.error("[local-lift-package] Error guardando reintento:", dbErr);
          }
        }
        return res.json({ success: true, package: merged });
      } catch (retryErr) {
        console.error("[local-lift-package] Error reintentando piezas fallidas:", retryErr);
        return res.status(500).json({ error: "No pudimos reintentar las partes fallidas." });
      }
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

    const reviews = await findPlaceReviews(place.id, language, { newest: requestedTier === "ascenso" });
    const pkg = await generatePackage(place, reviews, language, requestedTier);

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
          await docRef.update({ place, package: pkg, tier: requestedTier, status: "package_ready", businessName: place.name, city });
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
          tier: requestedTier,
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

    return res.json({ success: true, place, reviews, package: pkg, tier: requestedTier, leadId: finalLeadId, status: finalStatus, paid: finalPaid });
  } catch (error: any) {
    console.error("[local-lift-package] Error:", error);
    return res.status(500).json({ error: error?.message || "No se pudo generar/enviar el paquete." });
  }
}
