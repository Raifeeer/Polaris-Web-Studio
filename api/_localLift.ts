// Helpers compartidos entre local-lift-diagnostic.ts (diagnóstico gratis,
// público) y local-lift-package.ts (paquete completo del tier 48H, admin-only)
// -- Places API (New) + fallback de modelo DeepSeek -> Grok -> Gemini, mismo
// patrón ya usado en quotebot-chat.ts.

import { generateObject } from "ai";
import { createDeepSeek } from "@ai-sdk/deepseek";
import { createXai } from "@ai-sdk/xai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { z } from "zod";

export interface PlaceData {
  id: string;
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
  editorialSummary: string | null;
  isOperational: boolean;
  mapsUri: string | null;
  primaryType: string | null;
}

export interface RealReview {
  author: string;
  rating: number;
  text: string;
}

export async function findPlace(businessName: string, city: string): Promise<PlaceData | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.currentOpeningHours,places.photos,places.editorialSummary,places.businessStatus,places.googleMapsUri,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({ textQuery: `${businessName} ${city}`, languageCode: "es" }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("[_localLift] Places API error:", res.status, await res.text().catch(() => ""));
    return null;
  }

  const data = await res.json();
  const place = data?.places?.[0];
  if (!place) return null;

  return {
    id: place.id,
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
    editorialSummary: place.editorialSummary?.text || null,
    isOperational: place.businessStatus ? place.businessStatus === "OPERATIONAL" : true,
    mapsUri: place.googleMapsUri || null,
    primaryType: place.primaryTypeDisplayName?.text || null,
  };
}

// Google Places API (New) solo devuelve hasta 5 reseñas reales por ficha,
// sin importar cuántas tenga el negocio en total -- límite real de la API,
// no un recorte nuestro. Documentado en el endpoint que lo consume para que
// no se prometa "15 respuestas a reseñas reales".
export async function findPlaceReviews(placeId: string, lang: "es" | "en"): Promise<RealReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const res = await fetch(
    `https://places.googleapis.com/v1/places/${placeId}?languageCode=${lang}`,
    {
      headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "reviews" },
      signal: AbortSignal.timeout(8000),
    }
  );
  if (!res.ok) return [];
  const data = await res.json();
  const reviews = Array.isArray(data.reviews) ? data.reviews : [];
  return reviews
    .filter((r: any) => r?.text?.text)
    .map((r: any) => ({
      author: r.authorAttribution?.displayName || "Cliente",
      rating: r.rating || 0,
      text: String(r.text.text).slice(0, 800),
    }));
}

export async function generateWithFallback<S extends z.ZodTypeAny>(
  schema: S,
  prompt: string,
  temperature = 0.5
): Promise<z.infer<S>> {
  const attempts: Array<() => Promise<z.infer<S>>> = [
    async () =>
      (
        await generateObject({
          model: createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })("deepseek-v4-flash"),
          schema,
          prompt,
          temperature,
          abortSignal: AbortSignal.timeout(25000),
        } as any)
      ).object,
    async () =>
      (
        await generateObject({
          model: createXai({ apiKey: process.env.GROK_API_KEY })("grok-4.20-non-reasoning"),
          schema,
          prompt,
          temperature,
          abortSignal: AbortSignal.timeout(25000),
        } as any)
      ).object,
    async () =>
      (
        await generateObject({
          model: createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })("gemini-3.5-flash"),
          schema,
          prompt,
          temperature,
          abortSignal: AbortSignal.timeout(25000),
        } as any)
      ).object,
  ];

  let lastError: unknown;
  for (const attempt of attempts) {
    try {
      return await attempt();
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error("Los 3 modelos fallaron");
}

export function placeDataSummary(place: PlaceData): string {
  return `
Nombre real: ${place.name}
Dirección: ${place.address || "no disponible"}
Categoría: ${place.primaryType || "no especificada"}
Calificación: ${place.rating !== null ? `${place.rating}/5` : "sin calificación"}
Cantidad de reseñas: ${place.reviewCount}
Tiene sitio web: ${place.hasWebsite ? `sí (${place.websiteUri})` : "no"}
Tiene teléfono visible: ${place.hasPhone ? "sí" : "no"}
Tiene horario cargado: ${place.hasHours ? "sí" : "no"}
Cantidad de fotos: ${place.photoCount}
Descripción actual: ${place.editorialSummary || "sin descripción"}
Estado: ${place.isOperational ? "operativo" : "cerrado o no operativo según Google"}
`.trim();
}
