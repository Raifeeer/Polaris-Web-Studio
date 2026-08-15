import type { VercelRequest, VercelResponse } from "@vercel/node";
import { generateObject } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Endpoint real detrás de "Diagnóstico Express" de Polaris Local Lift
// (/local-lift): a diferencia de la venta manual por WhatsApp que existía
// hasta ahora, esto trae datos REALES del negocio vía Google Places API
// (New) y le pide a un modelo que redacte los 5 problemas prioritarios +
// el plan de 7 días GROUNDED en esos datos -- nunca inventa cifras
// (reseñas, si tiene web, teléfono, fotos, horario, etc. salen de Places,
// no del modelo). Mismo patrón de fallback DeepSeek -> Grok -> Gemini que
// quotebot-chat.ts, y misma cuenta de Firestore ("polaris-web-studio") que
// server-db.ts.

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });

const diagnosticSchema = z.object({
  summary: z.string().describe("1-2 frases, en español, honestas pero alentadoras, resumiendo el estado general del negocio en Google -- sin prometer posiciones ni resultados."),
  problems: z
    .array(
      z.object({
        title: z.string().describe("Nombre corto del problema (máximo 8 palabras)."),
        why: z.string().describe("Por qué importa este problema para conseguir más llamadas/mensajes/reservas -- 1-2 frases."),
        fix: z.string().describe("Acción concreta y específica para resolverlo -- 1 frase, accionable ya."),
      })
    )
    .length(5)
    .describe("Exactamente 5 problemas, ordenados del de mayor impacto al de menor impacto."),
  sevenDayPlan: z
    .array(
      z.object({
        day: z.number().int().min(1).max(7),
        action: z.string().describe("Una acción concreta para ese día, breve."),
      })
    )
    .length(7),
});

type Diagnostic = z.infer<typeof diagnosticSchema>;

interface PlaceData {
  name: string;
  address: string | null;
  rating: number | null;
  reviewCount: number;
  hasWebsite: boolean;
  websiteUri: string | null;
  hasPhone: boolean;
  hasHours: boolean;
  photoCount: number;
  hasDescription: boolean;
  isOperational: boolean;
  mapsUri: string | null;
  primaryType: string | null;
}

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

async function findPlace(businessName: string, city: string): Promise<PlaceData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.currentOpeningHours,places.photos,places.editorialSummary,places.businessStatus,places.googleMapsUri,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({ textQuery: `${businessName} ${city}`, languageCode: "es" }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("[local-lift-diagnostic] Places API error:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = await res.json();
  const place = data?.places?.[0];
  if (!place) return null;

  return {
    name: place.displayName?.text || businessName,
    address: place.formattedAddress || null,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviewCount: place.userRatingCount || 0,
    hasWebsite: !!place.websiteUri,
    websiteUri: place.websiteUri || null,
    hasPhone: !!place.nationalPhoneNumber,
    hasHours: !!place.currentOpeningHours,
    photoCount: Array.isArray(place.photos) ? place.photos.length : 0,
    hasDescription: !!place.editorialSummary?.text,
    isOperational: place.businessStatus ? place.businessStatus === "OPERATIONAL" : true,
    mapsUri: place.googleMapsUri || null,
    primaryType: place.primaryTypeDisplayName?.text || null,
  };
}

async function generateDiagnostic(place: PlaceData, lang: "es" | "en"): Promise<Diagnostic> {
  const dataSummary = `
Nombre real: ${place.name}
Dirección: ${place.address || "no disponible en la ficha"}
Categoría: ${place.primaryType || "no especificada"}
Calificación: ${place.rating !== null ? `${place.rating}/5` : "sin calificación"}
Cantidad de reseñas: ${place.reviewCount}
Tiene sitio web enlazado en Google: ${place.hasWebsite ? `sí (${place.websiteUri})` : "no"}
Tiene teléfono visible: ${place.hasPhone ? "sí" : "no"}
Tiene horario de atención cargado: ${place.hasHours ? "sí" : "no"}
Cantidad de fotos en la ficha: ${place.photoCount}
Tiene descripción/resumen: ${place.hasDescription ? "sí" : "no"}
Estado del negocio: ${place.isOperational ? "operativo" : "cerrado o no operativo según Google"}
`.trim();

  const prompt = `Sos un consultor de Polaris Local Lift analizando la ficha real de Google de este negocio (Punta Cana / República Dominicana o similar). Estos son los datos REALES de su ficha de Google, obtenidos vía Google Places API -- no inventes ningún dato adicional, cifra, reseña ni promesa de ranking:

${dataSummary}

Con base ÚNICAMENTE en estos datos reales, generá exactamente 5 problemas prioritarios (ordenados de mayor a menor impacto en conseguir más llamadas/mensajes/reservas) y un plan de acción de 7 días. Tono profesional, directo, sin exagerar ni prometer resultados garantizados. Si el negocio ya tiene buena calificación/reseñas, decilo -- no inventes problemas que no existen; en ese caso enfocate en optimización fina (fotos, descripción, horario, respuestas a reseñas, etc.). Todo en ${lang === "en" ? "inglés" : "español neutro, sin voseo"}.`;

  const attempts: Array<() => ReturnType<typeof generateObject<typeof diagnosticSchema>>> = [
    () =>
      generateObject({
        model: createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })("deepseek-v4-flash"),
        schema: diagnosticSchema,
        prompt,
        temperature: 0.5,
        abortSignal: AbortSignal.timeout(20000),
      }),
    () =>
      generateObject({
        model: createXai({ apiKey: process.env.GROK_API_KEY })("grok-4.20-non-reasoning"),
        schema: diagnosticSchema,
        prompt,
        temperature: 0.5,
        abortSignal: AbortSignal.timeout(20000),
      }),
    () =>
      generateObject({
        model: createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })("gemini-3.5-flash"),
        schema: diagnosticSchema,
        prompt,
        temperature: 0.5,
        abortSignal: AbortSignal.timeout(20000),
      }),
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      const result = await attempt();
      return result.object;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Los 3 modelos fallaron");
}

function renderDiagnosticText(place: PlaceData, diagnostic: Diagnostic, lang: "es" | "en"): string {
  const problemsLabel = lang === "en" ? "Priority issues" : "Problemas prioritarios";
  const planLabel = lang === "en" ? "7-day action plan" : "Plan de acción de 7 días";
  const dayLabel = lang === "en" ? "Day" : "Día";

  const problemsText = diagnostic.problems
    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.why}\n   → ${p.fix}`)
    .join("\n\n");
  const planText = diagnostic.sevenDayPlan.map((d) => `${dayLabel} ${d.day}: ${d.action}`).join("\n");

  return `${diagnostic.summary}\n\n${problemsLabel}:\n\n${problemsText}\n\n${planLabel}:\n\n${planText}`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const ip = ((req.headers["x-forwarded-for"] as string) || "").split(",")[0].trim() || "unknown";
  if (rateLimited(ip, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." });
  }

  const { businessName, city, email, contactName, lang } = req.body || {};

  if (typeof businessName !== "string" || !businessName.trim() || businessName.length > 200) {
    return res.status(400).json({ error: "Falta el nombre del negocio." });
  }
  if (typeof city !== "string" || !city.trim() || city.length > 100) {
    return res.status(400).json({ error: "Falta la ciudad." });
  }
  if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) {
    return res.status(400).json({ error: "El correo no es válido." });
  }
  if (typeof contactName !== "string" || !contactName.trim() || contactName.length > 200) {
    return res.status(400).json({ error: "Falta tu nombre." });
  }
  const language: "es" | "en" = lang === "en" ? "en" : "es";

  try {
    const place = await findPlace(businessName.trim(), city.trim());
    if (!place) {
      return res.status(404).json({
        error:
          language === "en"
            ? "We couldn't find that exact listing on Google. Double-check the business name and city, or share the Google Maps link directly with us on WhatsApp."
            : "No pudimos encontrar esa ficha exacta en Google. Revisa el nombre del negocio y la ciudad, o compartinos el link de Google Maps directo por WhatsApp.",
      });
    }

    const diagnostic = await generateDiagnostic(place, language);
    const diagnosticText = renderDiagnosticText(place, diagnostic, language);

    // Envío de correos y registro en Firestore -- best-effort, nunca deben
    // tumbar la respuesta al cliente si fallan (ya generamos el diagnóstico
    // real, mostrarlo en pantalla es lo mínimo garantizado).
    const zohoPassword = process.env.ZOHO_PASSWORD;
    if (zohoPassword) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.zoho.com",
          port: 465,
          secure: true,
          auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
        });

        await transporter.sendMail({
          from: '"Polaris Local Lift" <hola@polarisweb.studio>',
          to: email,
          subject:
            language === "en"
              ? `Your Local Lift diagnosis for ${place.name}`
              : `Tu diagnóstico Local Lift de ${place.name}`,
          text: `${language === "en" ? "Hi" : "Hola"} ${contactName},\n\n${diagnosticText}\n\n${
            language === "en"
              ? "Want us to implement these fixes for you? Reply to this email or write us on WhatsApp: https://wa.me/18299200544"
              : "¿Querés que implementemos estos cambios por vos? Respondé este correo o escribinos por WhatsApp: https://wa.me/18299200544"
          }`,
        });

        await transporter.sendMail({
          from: '"Local Lift -- Diagnóstico nuevo" <hola@polarisweb.studio>',
          to: "hola@polarisweb.studio",
          replyTo: email,
          subject: `Nuevo diagnóstico Local Lift: ${place.name} (${contactName})`,
          text: `Negocio: ${place.name}\nCiudad: ${city}\nContacto: ${contactName} <${email}>\nFicha: ${place.mapsUri || "no disponible"}\nReseñas: ${place.reviewCount} (${place.rating ?? "s/calificación"})\n\n${diagnosticText}`,
        });
      } catch (mailErr) {
        console.error("[local-lift-diagnostic] Error enviando correos:", mailErr);
      }
    }

    try {
      const firestore = getFirestore(firebaseApp, "polaris-web-studio");
      await firestore.collection("localLiftDiagnostics").add({
        businessName: place.name,
        city,
        contactName,
        email,
        placeData: place,
        diagnostic,
        lang: language,
        createdAt: new Date(),
      });
    } catch (dbErr) {
      console.error("[local-lift-diagnostic] Error guardando en Firestore:", dbErr);
    }

    return res.json({ success: true, place, diagnostic });
  } catch (error: any) {
    console.error("[local-lift-diagnostic] Error:", error);
    return res.status(500).json({
      error:
        language === "en"
          ? "We couldn't generate the diagnosis right now. Please try again in a moment."
          : "No pudimos generar el diagnóstico en este momento. Intenta de nuevo en un momento.",
    });
  }
}
