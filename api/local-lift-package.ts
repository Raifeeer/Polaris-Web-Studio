import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHash, createPublicKey, timingSafeEqual, verify as cryptoVerify } from "node:crypto";
import { z } from "zod";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, type DocumentReference } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { findPlace, findPlaceReviews, generateFast, generateWithFallback, placeDataSummary, type PlaceData } from "./_localLift.js";

// Ascenso incluye análisis profundo de reseñas; necesita margen para el
// fallback entre proveedores sin caer en el timeout por defecto.
export const config = { maxDuration: 60 };

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });

const GUIDE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;

async function saveGuidePdfToStorage(leadId: string, buffer: Buffer): Promise<string> {
  const objectPath = `local-lift-guides/${leadId.trim()}.pdf`;
  const file = getStorage(firebaseApp).bucket(GUIDE_STORAGE_BUCKET).file(objectPath);
  await file.save(buffer, {
    resumable: false,
    contentType: "application/pdf",
    metadata: { cacheControl: "private, max-age=0, no-store" },
  });
  return objectPath;
}

async function readGuidePdfFromStorage(objectPath: string): Promise<Buffer> {
  const [buffer] = await getStorage(firebaseApp).bucket(GUIDE_STORAGE_BUCKET).file(objectPath).download();
  return buffer;
}

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
function hasServerAdminSecret(req: VercelRequest): boolean {
  const provided = String(req.headers["x-portal-admin-secret"] || "");
  const expected = process.env.PORTAL_ADMIN_SECRET || "";
  if (!provided || !expected) return false;
  const providedBuffer = Buffer.from(provided);
  const expectedBuffer = Buffer.from(expected);
  return providedBuffer.length === expectedBuffer.length && timingSafeEqual(providedBuffer, expectedBuffer);
}

async function verifyAdmin(req: VercelRequest): Promise<boolean> {
  if (hasServerAdminSecret(req)) return true;
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
const PREVIEW_CACHE_TTL_MS = 10 * 60 * 1000;
const PREVIEW_CACHE_MAX_ENTRIES = 8;
const previewPdfCache = new Map<string, { createdAt: number; buffer: Buffer }>();

function buildPreviewCacheKey(params: {
  businessName: string;
  tierLabel: string;
  lang: "es" | "en";
  pkg: LocalLiftPackage;
  place?: PlaceData | null;
  documentType?: "package" | "guide";
}): string {
  return createHash("sha256")
    .update(JSON.stringify({
      businessName: params.businessName,
      tierLabel: params.tierLabel,
      lang: params.lang,
      pkg: params.pkg,
      place: params.place || null,
      documentType: params.documentType || "package",
    }))
    .digest("hex");
}

function getCachedPreviewPdf(key: string): Buffer | null {
  const entry = previewPdfCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > PREVIEW_CACHE_TTL_MS) {
    previewPdfCache.delete(key);
    return null;
  }
  return entry.buffer;
}

function cachePreviewPdf(key: string, buffer: Buffer): void {
  if (previewPdfCache.size >= PREVIEW_CACHE_MAX_ENTRIES) {
    const oldestKey = [...previewPdfCache.entries()].sort((a, b) => a[1].createdAt - b[1].createdAt)[0]?.[0];
    if (oldestKey) previewPdfCache.delete(oldestKey);
  }
  previewPdfCache.set(key, { createdAt: Date.now(), buffer });
}

async function fetchPackagePdf(params: {
  businessName: string;
  tierLabel: string;
  lang: "es" | "en";
  pkg: LocalLiftPackage;
  place?: PlaceData | null;
  documentType?: "package" | "guide";
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
      documentType: params.documentType || "package",
    }),
  });
  if (!resp.ok) throw new Error(`local-lift-package-pdf ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

const TIER_PRICE: Record<string, { amount: string; label: string; enLabel: string }> = {
  "impulso": { amount: "29", label: "Impulso", enLabel: "Boost" },
  "ascenso": { amount: "99", label: "Ascenso", enLabel: "Rise" },
};

// Genera el paquete completo del tier "Impulso" ($29) / "Ascenso"
// ($99): descripción reescrita, 10 publicaciones para Google Business
// Profile, respuestas a reseñas reales (hasta 5 -- límite real de Places API,
// nunca 15, ver nota en el schema) + plantillas por calificación, y 10
// mensajes de WhatsApp de seguimiento. Impulso recibe el contenido para
// aplicarlo por su cuenta; Ascenso además incluye una guía paso a paso,
// rondas agrupadas de revisión y acompañamiento 1:1.
//
// Admin-only a propósito: a diferencia de local-lift-diagnostic.ts (gratis,
// público, gancho de venta), esto es el paquete del tier PAGO -- no debe
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

type ImplementationGuideStep = {
  title: string;
  titleEn: string;
  visualAsset: string;
  visualAlt: string;
  summary: string;
  summaryEn: string;
  quickStart: string;
  quickStartEn: string;
  where: string;
  whereEn: string;
  beforeYouStart: string[];
  beforeYouStartEn: string[];
  steps: string[];
  stepsEn: string[];
  verify: string[];
  verifyEn: string[];
  avoid: string[];
  avoidEn: string[];
};

const ASCENSO_IMPLEMENTATION_GUIDE: ImplementationGuideStep[] = [
  {
    title: "Descripción del negocio",
    titleEn: "Business description",
    visualAsset: "description-reference.jpg",
    visualAlt: "Referencia visual del panel de Perfil de Empresa con accesos para editar el perfil",
    summary: "Coloca la descripción preparada para explicar con claridad qué ofrece tu negocio y por qué alguien debería contactarte.",
    summaryEn: "Use the prepared description to explain clearly what your business offers and why someone should contact you.",
    quickStart: "Abre el editor de tu Perfil de Empresa desde Google Search o Maps, localiza la sección de descripción, pega el texto preparado y guarda. Google puede mostrar nombres distintos y revisar el cambio; si no ves la opción, guarda una captura para la sesión.",
    quickStartEn: "Open your Business Profile editor from Google Search or Maps, find the description section, paste the prepared text, and save. Google may use different labels and review the change; if you do not see the option, save a screenshot for the session.",
    where: "Perfil de Empresa en Google → Editar perfil → Descripción (Búsqueda o Maps)",
    whereEn: "Google Business Profile → Edit profile → Description (Search or Maps)",
    beforeYouStart: ["Ten a mano la versión preparada en tu paquete.", "Confirma que el nombre, los servicios y la ubicación mencionados siguen siendo correctos."],
    beforeYouStartEn: ["Keep the prepared version from your package nearby.", "Confirm that the name, services, and location mentioned are still correct."],
    steps: ["Entra a tu Perfil de Empresa desde la Búsqueda de Google o Google Maps.", "En la Búsqueda, selecciona “Editar perfil”; en Maps móvil, presiona “Negocio” y luego “Editar perfil”.", "Junto a “Descripción”, selecciona “Editar”, reemplaza o ajusta el texto preparado y selecciona “Guardar”.", "Vuelve a abrir la vista pública para comprobar cómo se muestra; Google puede revisar el cambio antes de aceptarlo."],
    stepsEn: ["Open your Business Profile from Google Search or Google Maps.", "In Search, select “Edit profile”; in the Maps app, select “Business” and then “Edit profile”.", "Next to “Description”, select “Edit”, replace or adjust the prepared text, and select “Save”.", "Reopen the public view to check how it appears; Google may review the change before accepting it."],
    verify: ["El texto representa lo que realmente vendes hoy.", "Los servicios y datos mencionados coinciden con tu operación actual."],
    verifyEn: ["The text represents what you actually sell today.", "The services and details mentioned match your current operation."],
    avoid: ["No agregues servicios, horarios o promesas que no puedas cumplir.", "No cambies el sentido de la descripción sin pedir una aclaración si tienes dudas."],
    avoidEn: ["Do not add services, hours, or promises you cannot fulfill.", "Do not change the meaning of the description without asking for clarification if needed."],
  },
  {
    title: "Servicios y llamadas a la acción",
    titleEn: "Services and calls to action",
    visualAsset: "services-reference.png",
    visualAlt: "Referencia visual de servicios con acceso al editor y campos de precio y descripción",
    summary: "Organiza lo que ofreces para que el cliente entienda rápidamente qué puede solicitar y cuál es el siguiente paso.",
    summaryEn: "Organize what you offer so customers quickly understand what they can request and what to do next.",
    quickStart: "En el editor de servicios, agrega solo lo que realmente ofreces y revisa el nombre, la descripción y el precio si aplica antes de guardar. Si no ves el editor, la categoría o la región pueden no ser elegibles.",
    quickStartEn: "In the services editor, add only what you actually offer and review the name, description, and price when applicable before saving. If you do not see the editor, your category or region may not be eligible.",
    where: "Perfil de Empresa → Editar servicios (si está disponible)",
    whereEn: "Business Profile → Edit services (if available)",
    beforeYouStart: ["Revisa la lista de servicios preparada por Polaris.", "Define qué acción puedes atender mejor: llamar, escribir, reservar, comprar o solicitar información."],
    beforeYouStartEn: ["Review the service list prepared by Polaris.", "Choose the action you can handle best: call, message, book, buy, or request information."],
    steps: ["Ve a tu Perfil de Empresa y busca la opción “Editar servicios”; si no aparece, consulta la disponibilidad durante la sesión.", "Selecciona los servicios sugeridos o usa “Añadir servicio personalizado” cuando Google lo permita.", "Revisa y ajusta el nombre, la descripción y el precio si aplica; luego selecciona “Guardar”.", "Comprueba que cada llamada a la acción del paquete lleve a un canal real y atendible."],
    stepsEn: ["Go to your Business Profile and look for “Edit services”; if it is missing, discuss availability during the session.", "Select suggested services or use “Add custom service” when Google allows it.", "Review and adjust the name, description, and price when applicable; then select “Save”.", "Check that each call to action in the package leads to a real channel you can handle."],
    verify: ["No hay servicios repetidos o fuera de temporada.", "Cada llamada a la acción tiene un destino real y atendible."],
    verifyEn: ["There are no duplicate or out-of-season services.", "Each call to action leads to a real channel you can handle."],
    avoid: ["No publiques una oferta si ya no está disponible.", "No dejes una llamada a la acción apuntando a un número, enlace o canal que nadie revisa."],
    avoidEn: ["Do not publish an offer that is no longer available.", "Do not leave a call to action pointing to a number, link, or channel nobody monitors."],
  },
  {
    title: "Publicaciones y novedades",
    titleEn: "Posts and updates",
    visualAsset: "posts-reference.jpg",
    visualAlt: "Referencia visual de la creación de una publicación con revisión y publicación",
    summary: "Convierte cada publicación preparada en una actualización real, revisada y adaptada al momento en que la vas a publicar.",
    summaryEn: "Turn each prepared post into a real update, reviewed and adapted to the moment you publish it.",
    quickStart: "En tu Perfil de Empresa, abre Publicaciones y Agregar publicación, elige el tipo disponible y revisa fechas, enlaces y vigencia antes de publicar. Si el menú no aparece, consúltalo durante la sesión; no todas las cuentas muestran programación o los mismos tipos.",
    quickStartEn: "In your Business Profile, open Posts and Add post, choose the available type, and review dates, links, and validity before publishing. If the menu does not appear, discuss it during the session; not every account shows scheduling or the same post types.",
    where: "Perfil de Empresa → Publicaciones → Agregar publicación (si está disponible)",
    whereEn: "Business Profile → Posts → Add post (if available)",
    beforeYouStart: ["Reúne las fechas, precios, enlaces e imágenes aprobadas que correspondan a esa publicación.", "Confirma que la oferta siga vigente antes de comenzar."],
    beforeYouStartEn: ["Gather the relevant dates, prices, links, and approved images for the post.", "Confirm that the offer is still valid before you begin."],
    steps: ["Crea una publicación nueva y selecciona el formato más cercano al objetivo.", "Copia el texto preparado y reemplaza los campos variables, como fechas o disponibilidad.", "Añade la imagen aprobada o una imagen propia que represente exactamente la oferta.", "Selecciona la llamada a la acción indicada, revisa la vista previa y publica solo cuando todo esté correcto."],
    stepsEn: ["Create a new post and choose the format closest to the goal.", "Copy the prepared text and replace variable details such as dates or availability.", "Add the approved image or an original image that accurately represents the offer.", "Select the suggested call to action, review the preview, and publish only when everything is correct."],
    verify: ["La fecha, el precio, la disponibilidad y el enlace coinciden.", "La imagen y el texto prometen exactamente lo mismo."],
    verifyEn: ["The date, price, availability, and link match.", "The image and text make the same promise."],
    avoid: ["No publiques una promoción vencida.", "No uses una imagen que muestre un producto, precio o condición diferente a la oferta."],
    avoidEn: ["Do not publish an expired promotion.", "Do not use an image showing a different product, price, or condition than the offer."],
  },
  {
    title: "Fotos del negocio",
    titleEn: "Business photos",
    visualAsset: "photos-reference.jpg",
    visualAlt: "Referencia visual del panel de fotos y del selector para añadir imágenes y videos",
    summary: "Aplica las imágenes aprobadas para que la presencia visual del negocio esté actualizada y sea coherente con lo que ofreces.",
    summaryEn: "Apply the approved images so the business presence stays current and matches what you offer.",
    quickStart: "Desde Fotos y Añadir fotos —o la ruta equivalente en Maps móvil— selecciona imágenes reales y aprobadas, revisa el recorte y confirma el estado después de subirlas. Google puede tardar entre 24 y 48 horas en mostrarlas.",
    quickStartEn: "From Photos and Add photos—or the equivalent route in the Maps app—select real, approved images, review the crop, and check the status after uploading. Google may take 24 to 48 hours to display them.",
    where: "Perfil de Empresa → Fotos → Añadir fotos (Búsqueda o Maps)",
    whereEn: "Business Profile → Photos → Add photos (Search or Maps)",
    beforeYouStart: ["Descarga o reúne las imágenes aprobadas que acompañan tu paquete.", "Identifica qué muestra cada imagen: espacio, producto, equipo, servicio o resultado."],
    beforeYouStartEn: ["Download or gather the approved images included with your package.", "Identify what each image shows: space, product, team, service, or result."],
    steps: ["Abre la sección de fotos del perfil.", "Elige la categoría más apropiada para cada imagen cuando esté disponible.", "Sube las imágenes aprobadas y revisa que no se hayan recortado de forma problemática.", "Comprueba la vista pública después de guardar y anota cualquier imagen que necesite reemplazo."],
    stepsEn: ["Open the profile photos section.", "Choose the most appropriate category for each image when available.", "Upload the approved images and check that they were not cropped incorrectly.", "Check the public view after saving and note any image that needs replacement."],
    verify: ["Las imágenes muestran el negocio real y actual.", "No aparecen datos privados, personas sin autorización o información que ya no aplica."],
    verifyEn: ["The images show the real, current business.", "No private data, unauthorized people, or outdated information appears."],
    avoid: ["No subas imágenes de bancos de fotos como si fueran del negocio.", "No publiques una imagen solo porque se ve bonita si puede confundir al cliente."],
    avoidEn: ["Do not upload stock images as if they were from the business.", "Do not publish an image just because it looks good if it could confuse customers."],
  },
  {
    title: "Lectura de reseñas y buenas prácticas",
    titleEn: "Review insights and best practices",
    visualAsset: "review-analysis-reference.png",
    visualAlt: "Visual rellenado para convertir patrones de reseñas en prioridades y acciones",
    summary: "Convierte el análisis preparado por Polaris en decisiones concretas: identifica patrones, prioriza acciones y llévalas a las secciones correspondientes del perfil.",
    summaryEn: "Turn Polaris's prepared analysis into concrete decisions: identify patterns, prioritize actions, and carry them into the relevant profile sections.",
    quickStart: "Lee primero los temas repetidos, separa fortalezas de fricciones y elige las acciones que puedes aplicar ahora. Usa las secciones de descripción, servicios, publicaciones, fotos y respuestas para ejecutar esas acciones; las dudas se revisan durante el acompañamiento.",
    quickStartEn: "Read the recurring themes first, separate strengths from friction points, and choose the actions you can apply now. Use the description, services, posts, photos, and replies sections to carry them out; review questions during accompaniment.",
    where: "Análisis preparado por Polaris y las secciones correspondientes de tu Perfil de Empresa",
    whereEn: "Polaris analysis and the relevant sections of your Business Profile",
    beforeYouStart: ["Lee el resumen, los temas recurrentes y las fricciones antes de cambiar nada.", "Ten abierto el contenido preparado al que corresponde cada recomendación."],
    beforeYouStartEn: ["Read the overview, recurring themes, and friction points before changing anything.", "Keep the prepared content related to each recommendation available."],
    steps: ["Agrupa las observaciones que hablan del mismo problema o fortaleza.", "Elige una acción concreta para cada prioridad y relaciónala con la sección adecuada del paquete.", "Aplica los cambios usando las instrucciones de esa sección, sin inventar datos que no estén confirmados.", "Anota dudas o diferencias para revisarlas durante el acompañamiento."],
    stepsEn: ["Group observations that describe the same problem or strength.", "Choose one concrete action for each priority and link it to the relevant package section.", "Apply the changes using that section's instructions, without inventing unconfirmed details.", "Note questions or differences for the accompaniment session."],
    verify: ["Cada recomendación termina en una acción concreta o en una duda documentada.", "No se presentan cinco reseñas como si representaran todo el historial."],
    verifyEn: ["Each recommendation ends in a concrete action or a documented question.", "The five-review sample is not presented as the full history."],
    avoid: ["No cambies información real solo porque aparece como una sugerencia.", "No confundas una tendencia de la muestra con una conclusión sobre todas tus reseñas."],
    avoidEn: ["Do not change real information just because it appears as a suggestion.", "Do not treat a sample trend as a conclusion about all your reviews."],
  },
  {
    title: "Respuestas a reseñas",
    titleEn: "Review replies",
    visualAsset: "review-replies-reference.jpg",
    visualAlt: "Referencia visual de la sección de reseñas con el botón Reply junto a cada reseña",
    summary: "Usa las respuestas preparadas como base, pero personalízalas después de leer la reseña y su contexto completo.",
    summaryEn: "Use the prepared replies as a starting point, but personalize them after reading the full review and context.",
    quickStart: "En Leer reseñas, abre la reseña correspondiente y selecciona Responder. Usa el texto preparado como base, personaliza el contexto y envíalo; si no aparece la opción, verifica el perfil y guarda una captura para la sesión.",
    quickStartEn: "In Read reviews, open the relevant review and select Reply. Use the prepared text as a base, personalize the context, and send it; if the option is missing, verify the profile and save a screenshot for the session.",
    where: "Perfil de Empresa → Leer reseñas → Responder (perfil verificado)",
    whereEn: "Business Profile → Read reviews → Reply (verified profile)",
    beforeYouStart: ["Abre la reseña original y confirma el nombre, la calificación y el contenido.", "Ten disponible la respuesta preparada correspondiente."],
    beforeYouStartEn: ["Open the original review and confirm the name, rating, and content.", "Keep the corresponding prepared reply available."],
    steps: ["Lee la reseña completa antes de escribir.", "Usa la respuesta preparada como base y personaliza el saludo o el detalle relevante.", "Si la reseña es crítica, responde al problema concreto sin discutir ni compartir datos privados.", "Revisa el texto final y envíalo desde la opción de responder."],
    stepsEn: ["Read the full review before writing.", "Use the prepared reply as a base and personalize the greeting or relevant detail.", "If the review is critical, address the specific issue without arguing or sharing private details.", "Review the final text and send it through the reply option."],
    verify: ["La respuesta corresponde a esa reseña y no a otra.", "El tono es profesional, humano y coherente con el negocio."],
    verifyEn: ["The reply matches that specific review and not another one.", "The tone is professional, human, and consistent with the business."],
    avoid: ["No copies la misma respuesta para todas las reseñas.", "No confirmes públicamente datos personales ni prometas una solución que no hayas coordinado."],
    avoidEn: ["Do not copy the same reply for every review.", "Do not confirm personal data publicly or promise a solution you have not arranged."],
  },
  {
    title: "Mensajes de seguimiento",
    titleEn: "Follow-up messages",
    visualAsset: "messages-reference.svg",
    visualAlt: "Visual rellenado para elegir escenario, adaptar variables y confirmar el canal de seguimiento",
    summary: "Adapta los mensajes preparados para WhatsApp u otros canales y envíalos solo cuando el escenario realmente corresponda.",
    summaryEn: "Adapt the prepared messages for WhatsApp or other channels and send them only when the situation truly applies.",
    quickStart: "Elige el escenario correcto, reemplaza las variables y comprueba que el enlace o canal funcione antes de enviar. No dependas del chat interno de Google: WhatsApp o SMS solo aparecen en perfiles y regiones elegibles.",
    quickStartEn: "Choose the correct scenario, replace the variables, and confirm that the link or channel works before sending. Do not depend on Google's internal chat: WhatsApp or SMS only appear for eligible profiles and regions.",
    where: "Perfil de Empresa → Editar perfil → Contacto → Chat (si está disponible)",
    whereEn: "Business Profile → Edit profile → Contact → Chat (if available)",
    beforeYouStart: ["Identifica el escenario del mensaje: consulta, reserva, seguimiento o reactivación.", "Revisa el nombre, la fecha, el producto y cualquier dato variable antes de enviarlo."],
    beforeYouStartEn: ["Identify the message scenario: inquiry, booking, follow-up, or reactivation.", "Review the name, date, product, and any variable detail before sending."],
    steps: ["Elige la plantilla que corresponde a la situación.", "Reemplaza los campos variables y escribe como hablarías con ese cliente.", "Confirma que el enlace o el canal indicado sigue funcionando.", "Envía el mensaje y registra cualquier respuesta que requiera seguimiento."],
    stepsEn: ["Choose the template that matches the situation.", "Replace variable fields and write as you would speak to that customer.", "Confirm that the link or channel mentioned still works.", "Send the message and record any reply that needs follow-up."],
    verify: ["El mensaje tiene un siguiente paso claro.", "No contiene datos de otro cliente o de otra reserva."],
    verifyEn: ["The message has a clear next step.", "It contains no details from another customer or booking."],
    avoid: ["No envíes mensajes masivos sin revisar el contexto.", "No uses una plantilla fuera del escenario para el que fue preparada."],
    avoidEn: ["Do not send mass messages without checking the context.", "Do not use a template outside the scenario it was prepared for."],
  },
  {
    title: "Verificación final",
    titleEn: "Final verification",
    visualAsset: "final-check-reference.png",
    visualAlt: "Referencia visual del estado de una edición del Perfil de Empresa",
    summary: "Comprueba que los cambios aplicados se vean bien desde la perspectiva de un cliente y reúne tus dudas para la sesión.",
    summaryEn: "Check that the applied changes look right from a customer's perspective and collect questions for the session.",
    quickStart: "Compara la vista del negocio en Search y Maps, revisa si el cambio aparece como Aceptado, Pendiente o No aprobado y espera los plazos de revisión de Google antes de concluir que algo falló.",
    quickStartEn: "Compare the business view in Search and Maps, check whether the change is Accepted, Pending, or Not approved, and allow Google's review time before concluding that something failed.",
    where: "Búsqueda de Google y Google Maps",
    whereEn: "Google Search and Google Maps",
    beforeYouStart: ["Abre la vista pública del negocio desde una ventana independiente.", "Ten a mano el paquete y marca qué piezas ya aplicaste."],
    beforeYouStartEn: ["Open the public business view in a separate window.", "Keep the package nearby and mark which pieces you already applied."],
    steps: ["Comprueba la descripción, los servicios, las fotos y las publicaciones visibles.", "Prueba los enlaces, botones o canales de contacto que hayas configurado.", "Revisa las respuestas y confirma que cada una esté asociada a la reseña correcta.", "Anota diferencias o dudas concretas para resolverlas durante el acompañamiento."],
    stepsEn: ["Check the visible description, services, photos, and posts.", "Test the links, buttons, or contact channels you configured.", "Review the replies and confirm each one is associated with the correct review.", "Write down specific differences or questions to resolve during accompaniment."],
    verify: ["La presencia pública cuenta una historia coherente.", "Los canales de contacto funcionan y llegan a alguien que puede responder."],
    verifyEn: ["The public presence tells a coherent story.", "Contact channels work and reach someone who can respond."],
    avoid: ["No marques el servicio como terminado si aún tienes cambios del material por solicitar.", "No agrupes en una nueva ronda dudas que solo necesitan una aclaración sobre la revisión actual."],
    avoidEn: ["Do not mark the service complete if you still need changes to the prepared material.", "Do not use a new round for questions that only need clarification about the current review."],
  },
];

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
  implementationGuide?: ImplementationGuideStep[] | null;
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
    // El análisis profundo tarda más que las piezas cortas: usa fallback de
    // 25s por proveedor para que una respuesta lenta no deje el paquete parcial.
    allCalls.push(["reviewAnalysis", () => generateWithFallback(reviewAnalysisSchema, prompts.reviewAnalysis, 0.6)]);
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
        ? "Análisis basado en una muestra de hasta cinco reseñas disponibles; no representa el historial completo."
        : "Google no devolvió reseñas con texto analizables para este negocio en esta consulta."
      : null,
    implementationGuide: tier === "ascenso" ? ASCENSO_IMPLEMENTATION_GUIDE : null,
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
  portalUrl?: string,
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
  const portalButton = portalUrl
    ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px auto;"><tr><td align="center"><a href="${portalUrl}" target="_blank" style="display:inline-block;background:#111936;color:#ffffff;text-decoration:none;font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-size:14px;font-weight:700;line-height:1.2;padding:14px 24px;border-radius:8px;">${isEnglish ? "Review my package" : "Revisar mi paquete"}</a></td></tr></table>`
    : "";
  const content = isEnglish
    ? {
        eyebrow: "YOUR PACKAGE IS READY",
        title: "Your Local Lift package is ready",
        intro: tier === "ascenso" ? "We attached two PDFs: your content package and a separate visual implementation guide with annotated references. Open the package first, then use the guide while applying each change." : "Your complete PDF is attached with the content prepared for your business. Open it when you have a moment and start applying the changes in the order that makes the most sense for you.",
        cardTitle: "Inside your package",
        items: ["Rewritten business description", "Services and CTAs to highlight", "Google posts ready to adapt", "Personalized review replies", "WhatsApp follow-up messages", "A clear set of next steps"],
        ctaTitle: tier === "ascenso" ? "Your visual Rise guide is attached" : "Your implementation guide is ready",
        ctaBody: tier === "ascenso" ? "Use the separate guide while applying the content. The client portal also keeps the package and your review rounds together." : "Use the client portal to follow the steps, review the material and request changes if needed. The guide shows you what to do and where to do it.",
        signature: "The Polaris Local Lift team",
      }
    : {
        eyebrow: "TU PAQUETE ESTÁ LISTO",
        title: "Tu paquete Local Lift está listo",
        intro: tier === "ascenso" ? "Adjuntamos dos PDFs: tu paquete de contenido y una guía visual independiente con referencias anotadas. Abre primero el paquete y usa la guía mientras aplicas cada cambio." : "Adjuntamos tu PDF completo con el contenido preparado para tu negocio. Ábrelo cuando tengas un momento y empieza a aplicar los cambios en el orden que más sentido tenga para ti.",
        cardTitle: "Qué encontrarás dentro",
        items: ["Nueva descripción del negocio", "Servicios y llamadas a la acción", "Publicaciones para Google listas para adaptar", "Respuestas personalizadas a reseñas", "Mensajes de seguimiento para WhatsApp", "Siguientes pasos claros para avanzar"],
        ctaTitle: tier === "ascenso" ? "Tu guía visual Ascenso está adjunta" : "Tu guía de implementación está lista",
        ctaBody: tier === "ascenso" ? "Usa la guía independiente mientras aplicas el contenido. En el portal también tendrás reunidos el paquete y tus rondas de revisión." : "Entra al portal para seguir el paso a paso, revisar el material y solicitar cambios si los necesitas. La guía te muestra qué hacer y dónde hacerlo.",
        signature: "El equipo de Polaris Local Lift",
      };

  const tierItems = tier === "ascenso"
    ? (isEnglish ? ["Detailed guide for applying the changes", "Up to three grouped review rounds"] : ["Documento detallado para aplicar los cambios", "Hasta tres rondas agrupadas de revisión"])
    : [];
  const items = reviewLine
    ? [...content.items.slice(0, 5), reviewLine, ...tierItems, content.items[5]]
    : [...content.items.slice(0, 5), ...tierItems, content.items[5]];
  const itemRows = items
    .map((item) => `<tr><td width="36" valign="middle" style="padding:0 0 14px 0;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td width="30" height="30" align="center" valign="middle" style="width:30px;height:30px;border-radius:50%;background:#E8FBFA;color:#16C8C1;font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:13px;">&#10003;</td></tr></table></td><td valign="middle" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.5;color:#1f2937;padding:0 0 14px 12px;">${item}</td></tr>`)
    .join("");
  const connectBlock = portalUrl
    ? `<tr><td class="email-pad" style="padding:28px 40px 0;text-align:center;"><div style="border:1px solid #e2e8f0;border-radius:10px;padding:22px 24px;text-align:center;"><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:16px;line-height:1.35;color:#0f172a;margin-bottom:9px;">${content.ctaTitle}</div><p style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:14px;line-height:1.65;color:#1f2937;margin:0 0 18px;">${content.ctaBody}</p>${portalButton}</div></td></tr>`
    : "";

  return `<!DOCTYPE html><html lang="${isEnglish ? "en" : "es"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light"><link rel="preconnect" href="https://fonts.googleapis.com"><link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,500&f[]=satoshi@400,500,700&display=swap" rel="stylesheet"><title>${content.title}</title><style>body{margin:0;}a{text-decoration:none;color:#4f46e5;}.email-card{width:100% !important;max-width:600px !important;box-sizing:border-box !important;}.email-pad{padding-left:24px !important;padding-right:24px !important;}.email-item-card{box-sizing:border-box;overflow-wrap:anywhere;word-break:break-word;}</style></head><body style="margin:0;padding:0;background:#f8fafc;color:#0f172a;"><div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f8fafc;opacity:0;">${content.title} — ${safeBusinessName}</div><div style="width:100%;min-height:100vh;background:#f8fafc;padding:48px 16px;box-sizing:border-box;font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;"><table class="email-card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;"><tr><td class="email-pad" style="padding:40px 40px 0;text-align:center;">${localLiftLogoHeader}</td></tr><tr><td class="email-pad" style="padding:8px 40px 8px;text-align:center;"><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#0284c7;margin-bottom:14px;">${content.eyebrow}</div><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:800;font-size:26px;line-height:1.3;color:#0f172a;">${content.title}</div></td></tr><tr><td class="email-pad" style="padding:16px 40px 0;text-align:center;"><p style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:15px;line-height:1.7;color:#1f2937;margin:0;">${greeting}<br>${content.intro}</p></td></tr><tr><td class="email-pad" style="padding:24px 40px 0;"><div class="email-item-card" style="border:1px solid #e2e8f0;border-radius:10px;padding:22px 24px;"><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:14px;color:#0f172a;margin-bottom:16px;">${content.cardTitle}</div><div style="font-family:'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif;font-weight:700;font-size:15px;line-height:1.4;color:#0f172a;margin-bottom:18px;">${safeBusinessName}</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}</table></div></td></tr>${connectBlock}<tr><td class="email-pad" style="padding:40px 40px 0;"><div style="height:1px;background:#e2e8f0;"></div></td></tr><tr><td class="email-pad" style="padding:28px 40px 0;text-align:center;"><table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 24px auto;"><tr><td style="padding:0 10px;"><a href="https://www.instagram.com/polariswebstudio/" target="_blank" rel="noopener noreferrer"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-instagram.png" width="22" height="22" alt="Instagram" style="width:22px;height:22px;display:block;"></a></td><td style="padding:0 10px;"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-facebook.png" width="22" height="22" alt="Facebook" style="width:22px;height:22px;display:block;"></td><td style="padding:0 10px;"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-x.png" width="22" height="22" alt="X" style="width:22px;height:22px;display:block;"></td><td style="padding:0 10px;"><img src="https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/social-linkedin.png" width="22" height="22" alt="LinkedIn" style="width:22px;height:22px;display:block;"></td></tr></table></td></tr><tr><td class="email-pad" style="padding:0 40px;"><div style="height:1px;background:#e2e8f0;"></div></td></tr><tr><td class="email-pad" style="padding:24px 40px 40px;"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:320px;margin:0 auto 16px auto;"><tr><td width="33%" style="text-align:left;white-space:nowrap;"><a href="https://www.polarisweb.studio" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#1f2937;">Sitio web</a></td><td width="34%" style="text-align:center;white-space:nowrap;"><a href="https://wa.me/18299200544" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#1f2937;">WhatsApp</a></td><td width="33%" style="text-align:right;white-space:nowrap;"><a href="mailto:hola@polarisweb.studio" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:13px;color:#1f2937;">Contacto</a></td></tr></table><div style="text-align:center;margin-bottom:16px;"><a href="https://www.polarisweb.studio/privacidad" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;">Privacidad</a><span style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;">&nbsp;&middot;&nbsp;</span><a href="https://www.polarisweb.studio/terminos" target="_blank" style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;">Términos y condiciones</a></div><div style="font-family:'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif;font-size:12px;color:#64748b;line-height:1.6;text-align:center;">Polaris Web Studio · República Dominicana · <a href="mailto:hola@polarisweb.studio" style="color:#64748b;text-decoration:underline;">hola@polarisweb.studio</a><br>Recibiste este correo porque adquiriste un paquete de contenido de Local Lift.</div></td></tr></table></div></body></html>`;
}

async function getLocalLiftContractStatus(leadId: string): Promise<{ ok: boolean; signed: boolean; status?: string; signedAt?: string | null; deliveryDueAt?: string | null; error?: string }> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return { ok: false, signed: false, error: "CRON_SECRET no configurado." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const portalUrl = process.env.PORTAL_BASE_URL || "https://polarisweb.studio";
    const response = await fetch(`${portalUrl}/api/portal/local-lift/contract-status/${encodeURIComponent(leadId.trim())}`, {
      method: "GET",
      headers: { "x-cron-secret": cronSecret },
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) return { ok: false, signed: false, error: String(data.error || `Portal respondió ${response.status}.`) };
    return { ok: true, signed: data.status === "signed", status: String(data.status || "sent"), signedAt: data.signedAt || null, deliveryDueAt: data.deliveryDueAt || null };
  } catch (error: any) {
    return { ok: false, signed: false, error: error?.name === "AbortError" ? "Timeout consultando el contrato." : String(error?.message || "No se pudo consultar el contrato.") };
  } finally {
    clearTimeout(timeout);
  }
}

async function syncPortalPackageSent(leadId: string, guideAvailable = false, finalDelivery = false): Promise<{ synced: boolean; matched: boolean; error?: string }> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return { synced: false, matched: false, error: "CRON_SECRET no configurado." };
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const portalUrl = process.env.PORTAL_BASE_URL || "https://polarisweb.studio";
    const response = await fetch(`${portalUrl}/api/portal/local-lift/package-sent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
      body: JSON.stringify({ leadId: leadId.trim(), guideAvailable: !!guideAvailable, finalDelivery: !!finalDelivery }),
      signal: controller.signal,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || data.matched === false) {
      return { synced: false, matched: data.matched === true, error: String(data.error || `Portal respondió ${response.status}.`) };
    }
    return { synced: true, matched: true };
  } catch (error: any) {
    return { synced: false, matched: false, error: error?.name === "AbortError" ? "Timeout sincronizando el portal." : String(error?.message || "No se pudo sincronizar el portal.") };
  } finally {
    clearTimeout(timeout);
  }
}

function renderPackageEmailText(businessName: string, contactName: string | null, lang: "es" | "en", tier: PackageTier, portalUrl?: string): string {
  const safeBusinessName = businessName;
  const greeting = contactName ? (lang === "en" ? `Hi ${contactName},` : `Hola ${contactName},`) : lang === "en" ? "Hi," : "Hola,";
  const isEnglish = lang === "en";
  const items = isEnglish
    ? ["Rewritten business description", "Services and CTAs to highlight", "Google posts ready to adapt", "Personalized review replies", "WhatsApp follow-up messages", ...(tier === "ascenso" ? ["Detailed guide for applying the changes", "Up to three grouped review rounds"] : []), "Clear next steps"]
    : ["Nueva descripción del negocio", "Servicios y llamadas a la acción", "Publicaciones para Google listas para adaptar", "Respuestas personalizadas a reseñas", "Mensajes de seguimiento para WhatsApp", ...(tier === "ascenso" ? ["Documento detallado para aplicar los cambios", "Hasta tres rondas agrupadas de revisión"] : []), "Siguientes pasos claros"];
  const lines = [
    isEnglish ? "YOUR PACKAGE IS READY" : "TU PAQUETE ESTÁ LISTO",
    isEnglish ? "Your Local Lift package is ready" : "Tu paquete Local Lift está listo",
    "",
    greeting,
    tier === "ascenso"
      ? (isEnglish ? `Two PDFs are attached for ${safeBusinessName}: your content package and a separate visual implementation guide.` : `Adjuntamos dos PDFs para ${safeBusinessName}: tu paquete de contenido y una guía visual de implementación independiente.`)
      : (isEnglish ? `Your complete PDF for ${safeBusinessName} is attached with the content prepared for your business.` : `Tu PDF completo para ${safeBusinessName} está adjunto con el contenido preparado para tu negocio.`),
    "",
    isEnglish ? "Inside your package:" : "Qué encontrarás dentro:",
    ...items.map((item) => `- ${item}`),
    "",
  ];
  if (portalUrl) lines.push("", isEnglish ? `Review your Rise package in the client portal: ${portalUrl}` : `Revisa tu paquete Ascenso en el portal de cliente: ${portalUrl}`);
  if (tier === "ascenso") lines.push("", isEnglish ? "Your Rise package includes up to three grouped review rounds." : "Tu paquete Ascenso incluye hasta tres rondas agrupadas de revisión.");
  lines.push("", isEnglish ? "The Polaris Local Lift team" : "El equipo de Polaris Local Lift");
  return lines.join("\n");
}

function renderPackageApprovalReadyBody(
  businessName: string,
  contactName: string | null,
  lang: "es" | "en",
  pkg: LocalLiftPackage,
  portalUrl: string,
  deliveryDueAt?: string | null,
): string {
  const isEnglish = lang === "en";
  const safeBusinessName = escapeHtml(businessName);
  const safeContactName = escapeHtml(contactName);
  const greeting = safeContactName ? (isEnglish ? `Hi ${safeContactName},` : `Hola ${safeContactName},`) : (isEnglish ? "Hi," : "Hola,");
  const dueText = deliveryDueAt ? new Date(deliveryDueAt).toLocaleString(isEnglish ? "en-US" : "es-DO", { dateStyle: "medium", timeStyle: "short" }) : (isEnglish ? "within five consecutive hours" : "dentro de cinco horas corridas");
  const items = isEnglish
    ? ["Rewritten business description", "Services and calls to action", "Google posts ready to adapt", "Personalized review replies", "Recent review analysis and best practices", "Visual implementation guide"]
    : ["Nueva descripción del negocio", "Servicios y llamadas a la acción", "Publicaciones para Google listas para adaptar", "Respuestas personalizadas a reseñas", "Análisis de reseñas recientes y buenas prácticas", "Guía visual de implementación"];
  const itemRows = items.map((item) => `<li style="margin:0 0 8px;color:#1f2937;">${escapeHtml(item)}</li>`).join("");
  const intro = isEnglish
    ? `Your Rise material for <b>${safeBusinessName}</b> is ready in the client portal. Review it there before approving the version. The final PDFs are intentionally not attached yet; after your approval, we will send them by email.`
    : `Tu material Ascenso para <b>${safeBusinessName}</b> ya está listo en el portal de cliente. Revísalo allí antes de aprobar la versión. Los PDFs finales todavía no van adjuntos; después de tu aprobación te los enviaremos por correo.`;
  return `<!DOCTYPE html><html lang="${isEnglish ? "en" : "es"}"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><style>body{margin:0;background:#f8fafc}a{text-decoration:none}.card{width:100%;max-width:600px!important;box-sizing:border-box}@media(max-width:480px){.pad{padding-left:24px!important;padding-right:24px!important}}</style></head><body><div style="width:100%;padding:40px 16px;box-sizing:border-box;background:#f8fafc;font-family:'Satoshi','Helvetica Neue',Arial,sans-serif"><table class="card" role="presentation" width="100%" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden"><tr><td class="pad" style="padding:36px 40px 0;text-align:center">${localLiftLogoHeader}</td></tr><tr><td class="pad" style="padding:20px 40px 0;text-align:center"><div style="font-family:'Cabinet Grotesk','Century Gothic',Arial,sans-serif;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#0f9f99;font-weight:700">${isEnglish ? "READY TO REVIEW" : "LISTO PARA REVISAR"}</div><h1 style="font-family:'Cabinet Grotesk','Century Gothic',Arial,sans-serif;font-size:25px;line-height:1.3;color:${LOCAL_LIFT_NAVY};margin:9px 0 0">${isEnglish ? "Your Rise package is ready" : "Tu paquete Ascenso está listo"}</h1></td></tr><tr><td class="pad" style="padding:18px 40px 0;text-align:center"><p style="font-size:15px;line-height:1.7;color:#1f2937;margin:0">${greeting}<br>${intro}</p></td></tr><tr><td class="pad" style="padding:22px 40px 0"><div style="border:1px solid #99f6e4;background:#f0fdfa;border-radius:10px;padding:16px 18px;font-size:13px;line-height:1.65;color:#334155"><b>${isEnglish ? "Review available until:" : "Revisión disponible desde:"}</b><br>${escapeHtml(dueText)}<br><span style="font-size:12px;color:#64748b">${isEnglish ? "This is the estimated preparation window counted from your payment confirmation." : "Este es el plazo estimado de preparación contado desde la confirmación de tu pago."}</span></div></td></tr><tr><td class="pad" style="padding:22px 40px 0"><div style="border:1px solid #e2e8f0;border-radius:10px;padding:20px 22px"><p style="font-family:'Cabinet Grotesk','Century Gothic',Arial,sans-serif;font-size:15px;font-weight:700;color:#0f172a;margin:0 0 12px">${isEnglish ? "Inside your package" : "Qué encontrarás dentro"}</p><ul style="padding-left:20px;margin:0;font-size:14px;line-height:1.5">${itemRows}</ul></div></td></tr><tr><td class="pad" style="padding:24px 40px 0;text-align:center"><a href="${escapeHtml(portalUrl)}" style="display:inline-block;background:${LOCAL_LIFT_ACCENT};color:#111936;padding:14px 24px;border-radius:8px;font-family:'Cabinet Grotesk','Century Gothic',Arial,sans-serif;font-weight:700;font-size:14px">${isEnglish ? "Review and approve my package" : "Revisar y aprobar mi paquete"}</a></td></tr><tr><td class="pad" style="padding:28px 40px 36px;text-align:center"><p style="font-size:12px;line-height:1.6;color:#64748b;margin:0">${isEnglish ? "You can request grouped changes from the portal before approving. Clarifications about the same version do not use an additional round." : "Puedes solicitar cambios agrupados desde el portal antes de aprobar. Las aclaraciones sobre una misma versión no consumen una ronda adicional."}</p></td></tr></table></div></body></html>`;
}

function renderPackageApprovalReadyText(businessName: string, contactName: string | null, lang: "es" | "en", portalUrl: string, deliveryDueAt?: string | null): string {
  const greeting = contactName ? (lang === "en" ? `Hi ${contactName},` : `Hola ${contactName},`) : (lang === "en" ? "Hi," : "Hola,");
  const dueText = deliveryDueAt ? new Date(deliveryDueAt).toLocaleString(lang === "en" ? "en-US" : "es-DO", { dateStyle: "medium", timeStyle: "short" }) : (lang === "en" ? "within five consecutive hours" : "dentro de cinco horas corridas");
  return lang === "en"
    ? `READY TO REVIEW\n\n${greeting}\n\nYour Rise package for ${businessName} is ready in the client portal. Review it and approve the version there. The final PDFs will be emailed after approval.\n\nEstimated window: ${dueText}\n\nOpen the portal: ${portalUrl}`
    : `LISTO PARA REVISAR\n\n${greeting}\n\nTu paquete Ascenso para ${businessName} ya está listo en el portal de cliente. Revísalo y aprueba la versión allí. Los PDFs finales se enviarán por correo después de tu aprobación.\n\nPlazo estimado: ${dueText}\n\nAbrir portal: ${portalUrl}`;
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
      <p>We already prepared your <strong>${price.enLabel}</strong> package for <strong>${place.name}</strong> — everything is ready to send, based on your real Google listing:</p>
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

  const { action, businessName, city, lang, email, contactName, tier, leadId, place: givenPlace, package: givenPackage, documentType } = req.body || {};
  const language: "es" | "en" = lang === "en" ? "en" : "es";
  const requestedTier = normalizeTier(tier);
  const firestore = getFirestore(firebaseApp, "polaris-web-studio");
  let packageSendLockRef: DocumentReference | null = null;
  let packageEmailSent = false;

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
          language: v.language === "en" || v.lang === "en" ? "en" : "es",
          tier: normalizeTier(v.tier),
          status: v.status || "awaiting_generation",
          paid: !!v.paid,
          source: v.source || "free_diagnostic",
          gbpConnected: !!v.gbp?.refreshToken || v.gbp?.demo === true,
          gbpDemo: v.gbp?.demo === true,
          reviews: Array.isArray(v.reviews) ? v.reviews : [],
          package: v.package || null,
          guidePdfAvailable: !!v.guidePdfStoragePath || !!v.guidePdfBase64,
          createdAt: v.createdAt?.toDate?.() || null,
          sentAt: v.sentAt?.toDate?.() || null,
          portalSyncStatus: v.portalSyncStatus || null,
          portalSyncAttempts: Number(v.portalSyncAttempts || 0),
          portalSyncLastError: v.portalSyncLastError || "",
          packageSendInProgress: !!v.packageSendInProgress,
          packageSendStartedAt: v.packageSendStartedAt?.toDate?.() || null,
          packageEmailSentAt: v.packageEmailSentAt?.toDate?.() || null,
          packageDeliveryState: v.packageDeliveryState || null,
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

    if (action === "retry_portal_sync") {
      if (typeof leadId !== "string" || !leadId.trim()) {
        return res.status(400).json({ error: "Falta el lead para reintentar la sincronización." });
      }
      const docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
      const doc = await docRef.get();
      if (!doc.exists) return res.status(404).json({ error: "Lead no encontrado." });
      const lead = doc.data()!;
      if (!lead.paid) return res.status(400).json({ error: "El lead todavía no está pagado." });
      if (!lead.pdfBase64) return res.status(400).json({ error: "Este lead todavía no tiene un PDF enviado." });
      const sync = await syncPortalPackageSent(leadId.trim(), !!lead.guidePdfStoragePath, !!lead.finalPackageEmailSentAt);
      const attempts = Math.max(0, Number(lead.portalSyncAttempts || 0)) + 1;
      await docRef.update({
        portalSyncStatus: sync.synced ? "synced" : sync.matched ? "failed" : "unmatched",
        portalSyncAttempts: attempts,
        portalSyncLastAttemptAt: new Date(),
        portalSyncLastError: sync.synced ? "" : (sync.error || "No se pudo sincronizar el portal."),
        packageDeliveryState: sync.synced ? "delivered_synced" : sync.matched ? "email_sent_portal_pending" : "email_sent_portal_unmatched",
      });
      if (!sync.synced) {
        return res.status(502).json({
          success: false,
          synced: false,
          matched: sync.matched,
          portalSyncStatus: sync.matched ? "failed" : "unmatched",
          error: sync.error || "No se pudo sincronizar el portal.",
        });
      }
      return res.json({ success: true, synced: true, matched: true, portalSyncStatus: "synced", retried: true });
    }

    if (action === "deliver_approved") {
      if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el lead aprobado." });
      const approvedLeadRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
      let approvedLead: any = null;
      let finalAlreadySent = false;
      let finalSendInProgress = false;
      let finalSendClaimed = false;
      await firestore.runTransaction(async (transaction) => {
        const snapshot = await transaction.get(approvedLeadRef);
        if (!snapshot.exists) return;
        approvedLead = snapshot.data() || {};
        if (normalizeTier(approvedLead.tier) !== "ascenso" || !approvedLead.paid) return;
        if (approvedLead.finalPackageEmailSentAt) { finalAlreadySent = true; return; }
        const startedAt = typeof approvedLead.finalPackageSendStartedAt?.toMillis === "function" ? approvedLead.finalPackageSendStartedAt.toMillis() : new Date(String(approvedLead.finalPackageSendStartedAt || "")).getTime();
        if (approvedLead.finalPackageSendInProgress && Number.isFinite(startedAt) && Date.now() - startedAt < 20 * 60 * 1000) { finalSendInProgress = true; return; }
        transaction.update(approvedLeadRef, { finalPackageSendInProgress: true, finalPackageSendStartedAt: new Date() });
        finalSendClaimed = true;
      });
      if (finalAlreadySent) return res.json({ success: true, alreadySent: true, finalDelivery: true });
      if (finalSendInProgress || !finalSendClaimed) return res.status(409).json({ success: false, reason: "final_package_send_in_progress" });
      if (!approvedLead?.packageApprovalStatus || approvedLead.packageApprovalStatus !== "approved") {
        await approvedLeadRef.update({ finalPackageSendInProgress: null, finalPackageSendStartedAt: null }).catch(() => undefined);
        return res.status(409).json({ error: "package_not_approved", message: "El cliente debe aprobar el paquete antes de recibir los PDFs finales." });
      }
      if (!approvedLead.pdfBase64 || !approvedLead.place || !approvedLead.package) {
        await approvedLeadRef.update({ finalPackageSendInProgress: null, finalPackageSendStartedAt: null }).catch(() => undefined);
        return res.status(409).json({ error: "package_files_unavailable", message: "El paquete aprobado no tiene sus archivos preparados." });
      }
      const finalZohoPassword = process.env.ZOHO_PASSWORD;
      if (!finalZohoPassword) {
        await approvedLeadRef.update({ finalPackageSendInProgress: null, finalPackageSendStartedAt: null }).catch(() => undefined);
        return res.status(500).json({ error: "ZOHO_PASSWORD no configurado — no se puede enviar." });
      }
      const finalLanguage: "es" | "en" = approvedLead.language === "en" || approvedLead.lang === "en" ? "en" : "es";
      const finalPortalUrl = `${process.env.PORTAL_BASE_URL || "https://polarisweb.studio"}/dashboard`;
      const finalBusinessName = String(approvedLead.place.name || approvedLead.businessName || "tu negocio");
      const finalContactName = approvedLead.contactName || null;
      const finalTransporter = nodemailer.createTransport({ host: "smtp.zoho.com", port: 465, secure: true, auth: { user: "hola@polarisweb.studio", pass: finalZohoPassword } });
      const finalAttachments: any[] = [{ filename: `Local-Lift-${finalBusinessName.replace(/[^a-zA-Z0-9-]+/g, "-")}.pdf`, content: Buffer.from(approvedLead.pdfBase64, "base64"), contentType: "application/pdf" }];
      if (approvedLead.guidePdfStoragePath) {
        const guideBuffer = await readGuidePdfFromStorage(String(approvedLead.guidePdfStoragePath)).catch(() => null);
        if (guideBuffer) finalAttachments.push({ filename: `Guia-Ascenso-${finalBusinessName.replace(/[^a-zA-Z0-9-]+/g, "-")}.pdf`, content: guideBuffer, contentType: "application/pdf" });
      }
      try {
        await finalTransporter.sendMail({
          from: '"Polaris Local Lift" <hola@polarisweb.studio>',
          to: String(approvedLead.email || email || ""),
          subject: finalLanguage === "en" ? `Your Rise package — ${finalBusinessName}` : `Tu paquete Ascenso — ${finalBusinessName}`,
          text: renderPackageEmailText(finalBusinessName, finalContactName, finalLanguage, "ascenso", finalPortalUrl),
          html: renderPackageEmailBody(finalBusinessName, finalContactName, finalLanguage, "ascenso", approvedLead.package, finalPortalUrl),
          attachments: finalAttachments,
        });
      } catch (finalEmailError: any) {
        await approvedLeadRef.update({ finalPackageSendInProgress: null, finalPackageSendStartedAt: null, finalPackageSendLastError: String(finalEmailError?.message || "email_failed").slice(0, 500) }).catch(() => undefined);
        throw finalEmailError;
      }
      const finalSentAt = new Date();
      await approvedLeadRef.update({ status: "sent", finalPackageEmailSentAt: finalSentAt, finalPackageEmailSent: true, packageDeliveryState: "final_email_sent_pending_sync", finalPackageSendInProgress: null, finalPackageSendStartedAt: null, finalPackageSendLastError: "" });
      const finalSync = await syncPortalPackageSent(leadId.trim(), !!approvedLead.guidePdfStoragePath, true);
      await approvedLeadRef.update({
        portalSyncStatus: finalSync.synced ? "synced" : finalSync.matched ? "failed" : "unmatched",
        portalSyncLastAttemptAt: new Date(),
        portalSyncLastError: finalSync.synced ? "" : (finalSync.error || "No se pudo sincronizar la entrega final."),
        packageDeliveryState: finalSync.synced ? "final_delivered_synced" : finalSync.matched ? "final_email_sent_portal_pending" : "final_email_sent_portal_unmatched",
      });
      return res.json({ success: true, finalDelivery: true, portalSynced: finalSync.synced, portalSyncError: finalSync.synced ? undefined : finalSync.error });
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
      let docRef: DocumentReference | null = null;
      let previousPortalSyncAttempts = 0;
      if (typeof leadId === "string" && leadId.trim()) {
        docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
        // Local Lift inicia después del pago y la aceptación del checkout.
        // El portal y la firma posterior ya no bloquean la generación ni el envío.
        let missingLead = false;
        let unpaidLead = false;
        let alreadySent = false;
        let sendInProgress = false;
        let sendClaimed = false;
        await firestore.runTransaction(async (transaction) => {
          const snapshot = await transaction.get(docRef!);
          if (!snapshot.exists) {
            missingLead = true;
            return;
          }
          const leadData = snapshot.data()!;
          if (!leadData.paid) {
            unpaidLead = true;
            return;
          }
          previousPortalSyncAttempts = Math.max(0, Number(leadData.portalSyncAttempts || 0));
          if (leadData.sentAt || leadData.status === "sent" || leadData.packageApprovalStatus === "awaiting_approval" || leadData.finalPackageEmailSentAt) {
            alreadySent = true;
            return;
          }
          const startedAt = typeof leadData.packageSendStartedAt?.toMillis === "function"
            ? leadData.packageSendStartedAt.toMillis()
            : new Date(String(leadData.packageSendStartedAt || "")).getTime();
          const lockIsFresh = Number.isFinite(startedAt) && Date.now() - startedAt < 20 * 60 * 1000;
          if (leadData.packageSendInProgress && lockIsFresh) {
            sendInProgress = true;
            return;
          }
          transaction.update(docRef!, {
            packageSendInProgress: true,
            packageSendStartedAt: new Date(),
          });
          sendClaimed = true;
        });
        if (missingLead) return res.status(404).json({ error: "Lead no encontrado." });
        if (unpaidLead) return res.status(400).json({ error: "Este lead todavía no ha pagado. Envía la propuesta primero (botón 'Enviar propuesta')." });
        if (alreadySent) return res.status(409).json({ success: false, reason: "package_already_sent" });
        if (sendInProgress || !sendClaimed) return res.status(409).json({ success: false, reason: "package_send_in_progress" });
        packageSendLockRef = docRef;
      }
      const zohoPassword = process.env.ZOHO_PASSWORD;
      if (!zohoPassword) {
        if (packageSendLockRef) {
          await packageSendLockRef.update({ packageSendInProgress: null, packageSendStartedAt: null }).catch(() => undefined);
          packageSendLockRef = null;
        }
        return res.status(500).json({ error: "ZOHO_PASSWORD no configurado — no se puede enviar." });
      }
      const transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 465,
        secure: true,
        auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
      });
      const finalTier2 = normalizeTier(docRef ? (await docRef.get()).data()?.tier : tier);
      const isAscensoApproval = finalTier2 === "ascenso" && !!docRef;
      const portalUrl =
        finalTier2 === "ascenso"
          ? `${process.env.PORTAL_BASE_URL || "https://polarisweb.studio"}/dashboard`
          : undefined;
      const tierPriceForPdf = TIER_PRICE[finalTier2] || TIER_PRICE["impulso"];
      const tierLabelForPdf = language === "en" ? tierPriceForPdf.enLabel : tierPriceForPdf.label;
      let pdfBuffer: Buffer | null = null;
      let guidePdfBuffer: Buffer | null = null;
      let guideStoragePath: string | null = null;
      try {
        pdfBuffer = await fetchPackagePdf({
          businessName: givenPlace.name,
          tierLabel: tierLabelForPdf,
          lang: language,
          pkg: givenPackage,
          place: givenPlace,
          documentType: "package",
        });
      } catch (pdfErr) {
        console.error("[local-lift-package] Error generando PDF principal, se envía sin ese adjunto:", pdfErr);
      }
      if (finalTier2 === "ascenso") {
        try {
          guidePdfBuffer = await fetchPackagePdf({
            businessName: givenPlace.name,
            tierLabel: tierLabelForPdf,
            lang: language,
            pkg: givenPackage,
            place: givenPlace,
            documentType: "guide",
          });
        } catch (guideErr) {
          console.error("[local-lift-package] Error generando guía visual Ascenso:", guideErr);
        }
      }
      if (guidePdfBuffer && leadId) {
        try {
          guideStoragePath = await saveGuidePdfToStorage(leadId, guidePdfBuffer);
        } catch (storageErr) {
          console.error("[local-lift-package] No se pudo guardar la guía en Storage:", storageErr);
        }
      }
      const contractState = leadId ? await getLocalLiftContractStatus(leadId.trim()) : null;
      const approvalDueAt = contractState?.deliveryDueAt || null;
      const readyHtml = isAscensoApproval
        ? renderPackageApprovalReadyBody(givenPlace.name, contactName || null, language, givenPackage, portalUrl || `${process.env.PORTAL_BASE_URL || "https://polarisweb.studio"}/dashboard`, approvalDueAt)
        : renderPackageEmailBody(givenPlace.name, contactName || null, language, finalTier2, givenPackage, portalUrl);
      const readyText = isAscensoApproval
        ? renderPackageApprovalReadyText(givenPlace.name, contactName || null, language, portalUrl || `${process.env.PORTAL_BASE_URL || "https://polarisweb.studio"}/dashboard`, approvalDueAt)
        : renderPackageEmailText(givenPlace.name, contactName || null, language, finalTier2, portalUrl);
      await transporter.sendMail({
        from: '"Polaris Local Lift" <hola@polarisweb.studio>',
        to: email,
        subject: isAscensoApproval
          ? (language === "en" ? `Your Rise package is ready to review — ${givenPlace.name}` : `Tu paquete Ascenso está listo para revisar — ${givenPlace.name}`)
          : (language === "en" ? `Your Local Lift content package — ${givenPlace.name}` : `Tu paquete de contenido Local Lift — ${givenPlace.name}`),
        text: readyText,
        html: readyHtml,
        attachments: isAscensoApproval ? [] : [
          ...(pdfBuffer ? [{ filename: `Local-Lift-${givenPlace.name.replace(/[^a-zA-Z0-9-]+/g, "-")}.pdf`, content: pdfBuffer, contentType: "application/pdf" }] : []),
          ...(guidePdfBuffer ? [{ filename: `Guia-Ascenso-${givenPlace.name.replace(/[^a-zA-Z0-9-]+/g, "-")}.pdf`, content: guidePdfBuffer, contentType: "application/pdf" }] : []),
        ],
      });
      packageEmailSent = true;
      let portalSyncResult: { synced: boolean; matched: boolean; error?: string } = { synced: false, matched: false, error: pdfBuffer ? "No se intentó sincronizar el portal." : "No se pudo generar el PDF." };
      if (docRef) {
        await docRef.update({
          ...(isAscensoApproval ? { status: "package_ready_for_approval", packageReadyAt: new Date(), packageApprovalStatus: "awaiting_approval" } : { status: "sent", sentAt: new Date(), packageEmailSentAt: new Date(), packageApprovalStatus: "not_required" }),
          contactName: contactName || null,
          email,
          packageDeliveryState: isAscensoApproval ? "approval_email_sent_pending_sync" : "email_sent_pending_sync",
          portalSyncStatus: pdfBuffer ? "pending" : "failed",
          portalSyncAttempts: previousPortalSyncAttempts,
          portalSyncLastError: pdfBuffer ? "" : "No se pudo generar el PDF; el portal permanece en preparación.",
          ...(pdfBuffer ? {
            pdfBase64: pdfBuffer.toString("base64"),
            packagePdfCacheKey: buildPreviewCacheKey({ businessName: givenPlace.name, tierLabel: tierLabelForPdf, lang: language, pkg: givenPackage, place: givenPlace, documentType: "package" }),
          } : {}),
          ...(guideStoragePath ? { guidePdfStoragePath: guideStoragePath, guidePdfAvailable: true } : {}),
          packageSendInProgress: null,
          packageSendStartedAt: null,
        });
        if (pdfBuffer) {
          const firstSync = await syncPortalPackageSent(leadId!.trim(), !!guideStoragePath, finalTier2 !== "ascenso");
          portalSyncResult = firstSync;
          let syncAttempts = 1;
          if (!firstSync.synced) {
            await new Promise((resolve) => setTimeout(resolve, 350));
            portalSyncResult = await syncPortalPackageSent(leadId!.trim(), !!guideStoragePath, finalTier2 !== "ascenso");
            syncAttempts = 2;
          }
          await docRef.update({
            portalSyncStatus: portalSyncResult.synced ? "synced" : portalSyncResult.matched ? "failed" : "unmatched",
            portalSyncAttempts: previousPortalSyncAttempts + syncAttempts,
            portalSyncLastAttemptAt: new Date(),
            portalSyncLastError: portalSyncResult.synced ? "" : (portalSyncResult.error || "No se pudo sincronizar el portal."),
            packageDeliveryState: portalSyncResult.synced ? "delivered_synced" : portalSyncResult.matched ? "email_sent_portal_pending" : "email_sent_portal_unmatched",
          });
          if (!portalSyncResult.synced) {
            console.error("[local-lift-package] La entrega fue enviada, pero la sincronización del portal quedó pendiente:", portalSyncResult.error);
          }
        }
      }
      return res.json({ success: true, sent: true, approvalRequired: isAscensoApproval, pdfStored: !!pdfBuffer, guidePdfStored: !!guideStoragePath, portalSynced: portalSyncResult.synced, portalSyncError: portalSyncResult.synced ? undefined : portalSyncResult.error });
    }

    if (action === "preview_pdf") {
      // Genera el PDF real con el contenido actual, para que el admin lo vea
      // ANTES de decidir enviarlo -- nunca manda correo ni toca el lead.
      // Si no le gusta, vuelve a "Generar paquete" y pide otra vista previa.
      if (!givenPlace || !givenPackage) {
        return res.status(400).json({ error: "Falta 'place' o 'package' para la vista previa." });
      }
      const finalTierPreview = normalizeTier(typeof leadId === "string" && leadId.trim() ? (await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get()).data()?.tier : tier);
      const tierPriceForPreview = TIER_PRICE[finalTierPreview] || TIER_PRICE["impulso"];
      const tierLabelPreview = language === "en" ? tierPriceForPreview.enLabel : tierPriceForPreview.label;
      const previewParams = {
        businessName: givenPlace.name,
        tierLabel: tierLabelPreview,
        lang: language,
        pkg: givenPackage,
        place: givenPlace,
        documentType: documentType === "guide" ? "guide" as const : "package" as const,
      };
      const previewKey = buildPreviewCacheKey(previewParams);
      let previewPdf = getCachedPreviewPdf(previewKey);
      if (!previewPdf && typeof leadId === "string" && leadId.trim()) {
        const existingLead = await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get();
        const existingData = existingLead.data() || {};
        if (previewParams.documentType === "package" && existingData.packagePdfCacheKey === previewKey && typeof existingData.pdfBase64 === "string") {
          previewPdf = Buffer.from(existingData.pdfBase64, "base64");
        } else if (previewParams.documentType === "guide" && typeof existingData.guidePdfStoragePath === "string") {
          previewPdf = await readGuidePdfFromStorage(existingData.guidePdfStoragePath).catch(() => null);
        }
      }
      if (!previewPdf) {
        try {
          previewPdf = await fetchPackagePdf(previewParams);
          if (previewPdf) cachePreviewPdf(previewKey, previewPdf);
        } catch (pdfErr) {
          console.error("[local-lift-package] Error generando vista previa del PDF:", pdfErr);
        }
      }
      if (!previewPdf) return res.status(500).json({ error: "No pudimos generar la vista previa." });
      res.setHeader("Cache-Control", "private, max-age=0, no-store");
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
        return res.json({ success: true, package: existingPackage, attemptedKeys: [], resolvedKeys: [], remainingFailedKeys: [] });
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

        const resolvedKeys = failedKeys.filter((key) => merged.errors[key] === null);
        const remainingFailedKeys = failedKeys.filter((key) => merged.errors[key] !== null);
        let persisted = true;
        if (typeof leadId === "string" && leadId.trim()) {
          try {
            await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).update({ package: merged });
          } catch (dbErr) {
            persisted = false;
            console.error("[local-lift-package] Error guardando reintento:", dbErr);
          }
        }
        if (!persisted) {
          return res.status(502).json({
            success: false,
            reason: "retry_persistence_pending",
            package: merged,
            attemptedKeys: failedKeys,
            resolvedKeys,
            remainingFailedKeys,
            error: "Las partes se procesaron, pero no pudimos guardar el resultado en el lead. No vuelvas a generar el paquete completo; reintenta la sincronización más tarde.",
          });
        }
        return res.json({ success: true, package: merged, attemptedKeys: failedKeys, resolvedKeys, remainingFailedKeys });
      } catch (retryErr) {
        console.error("[local-lift-package] Error reintentando piezas fallidas:", retryErr);
        return res.status(500).json({ success: false, failedKeys, error: "No pudimos reintentar las partes fallidas. Revisa los mensajes de error del paquete y vuelve a intentarlo." });
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
      const wantsGuide = documentType === "guide";
      const guideStoragePath = wantsGuide ? lead.guidePdfStoragePath : null;
      const requestedPdf = wantsGuide ? null : lead.pdfBase64;
      if (wantsGuide && !guideStoragePath) return res.status(404).json({ error: "La guía Ascenso todavía no está lista para descargar." });
      if (!wantsGuide && !requestedPdf) return res.status(404).json({ error: "Este paquete todavía no tiene un PDF generado." });
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${wantsGuide ? "Guia-Ascenso" : "Local-Lift"}-${(lead.businessName || "paquete").replace(/[^a-zA-Z0-9-]+/g, "-")}.pdf"`);
      const pdf = wantsGuide ? await readGuidePdfFromStorage(guideStoragePath) : Buffer.from(requestedPdf, "base64");
      return res.status(200).send(pdf);
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
          await docRef.update({ place, reviews, package: pkg, tier: requestedTier, status: "package_ready", businessName: place.name, city });
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
          reviews,
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
    // Si SMTP confirmó el envío pero una actualización posterior falló,
    // conservamos el candado para impedir un segundo correo durante la
    // ventana de recuperación. El admin verá el estado pendiente.
    if (packageSendLockRef && packageEmailSent) {
      const recovered = await packageSendLockRef.update({
        status: "sent",
        packageEmailSentAt: new Date(),
        packageDeliveryState: "email_sent_sync_pending",
        packageSendInProgress: null,
        packageSendStartedAt: null,
      }).then(() => true).catch(() => false);
      if (recovered) {
        console.error("[local-lift-package] Correo enviado; estado recuperado como pendiente de sincronización.");
        return res.status(502).json({ success: false, reason: "email_sent_sync_pending", error: "El correo salió, pero falta completar la sincronización. No lo reenviaremos automáticamente." });
      }
    } else if (packageSendLockRef) {
      await packageSendLockRef.update({ packageSendInProgress: null, packageSendStartedAt: null }).catch(() => undefined);
    }
    console.error("[local-lift-package] Error:", error);
    return res.status(500).json({ error: packageEmailSent ? "El correo salió, pero falta completar la sincronización. Revisa el estado del lead antes de reintentar." : (error?.message || "No se pudo generar/enviar el paquete.") });
  }
}
