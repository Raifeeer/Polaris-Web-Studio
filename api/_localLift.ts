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
  photoUrls: string[];
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

function buildPlaceData(place: any, apiKey: string, fallbackName: string): PlaceData {
  const photos = Array.isArray(place.photos) ? place.photos : [];
  const photoUrls = photos
    .slice(0, 3)
    .map((p: any) =>
      p?.name
        ? `https://places.googleapis.com/v1/${p.name}/media?maxWidthPx=600&key=${apiKey}`
        : null
    )
    .filter(Boolean) as string[];

  return {
    id: place.id,
    name: place.displayName?.text || fallbackName,
    address: place.formattedAddress || null,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviewCount: place.userRatingCount || 0,
    hasWebsite: !!place.websiteUri,
    websiteUri: place.websiteUri || null,
    hasPhone: !!place.nationalPhoneNumber,
    hasHours: !!place.currentOpeningHours,
    photoCount: photos.length,
    photoUrls,
    hasDescription: !!place.editorialSummary?.text,
    editorialSummary: place.editorialSummary?.text || null,
    isOperational: place.businessStatus ? place.businessStatus === "OPERATIONAL" : true,
    mapsUri: place.googleMapsUri || null,
    primaryType: place.primaryTypeDisplayName?.text || place.primaryType || null,
  };
}

const NON_BUSINESS_PLACE_TYPES = new Set([
  "administrative_area_level_1",
  "administrative_area_level_2",
  "administrative_area_level_3",
  "administrative_area_level_4",
  "administrative_area_level_5",
  "country",
  "geocode",
  "locality",
  "neighborhood",
  "postal_code",
  "route",
  "street_address",
  "sublocality",
  "sublocality_level_1",
]);

export function isDominicanRepublicPlace(place: any): boolean {
  const components = Array.isArray(place?.addressComponents) ? place.addressComponents : [];
  const country = components.find((component: any) => Array.isArray(component?.types) && component.types.includes("country"));
  const shortText = String(country?.shortText || country?.short_name || "").toUpperCase();
  const longText = String(country?.longText || country?.long_name || "").toLowerCase();
  if (shortText || longText) {
    return shortText === "DO" || longText.includes("dominican republic") || longText.includes("república dominicana") || longText.includes("republica dominicana");
  }

  const address = String(place?.formattedAddress || place?.shortFormattedAddress || "").toLowerCase();
  return address.includes("dominican republic") || address.includes("república dominicana") || address.includes("republica dominicana") || /(^|[ ,])do($|[ ,])/i.test(address);
}

function isLikelyBusinessPlace(place: any): boolean {
  const primaryType = typeof place.primaryType === "string" ? place.primaryType.toLowerCase() : "";
  return !NON_BUSINESS_PLACE_TYPES.has(primaryType) && isDominicanRepublicPlace(place);
}

function isCoordinateOnlyLabel(label: string): boolean {
  return /^[+]?\d{1,3}(?:\.\d+)?\s*,\s*[+-]?\d{1,3}(?:\.\d+)?(?:\s*,\s*[+-]?\d+(?:\.\d+)?)?$/.test(label.trim());
}

function isAllowedMapsHost(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/^www\./, "");
  return host === "google.com" || host.endsWith(".google.com") || host === "maps.app.goo.gl" || host === "goo.gl";
}

export function isGoogleMapsUrl(rawUrl: string): boolean {
  try {
    const url = new URL(rawUrl);
    return url.protocol === "https:" && isAllowedMapsHost(url.hostname);
  } catch {
    return false;
  }
}

function extractPlaceId(rawUrl: string): string | null {
  const decoded = decodeURIComponent(rawUrl);
  const url = new URL(rawUrl);
  const queryPlaceId = [
    url.searchParams.get("query_place_id"),
    url.searchParams.get("place_id"),
    url.searchParams.get("destination_place_id"),
  ].find((candidate) => candidate?.startsWith("ChIJ"));
  if (queryPlaceId) return queryPlaceId;
  const embeddedPlaceId = decoded.match(/(?:!1s|place_id=|query_place_id=)(ChIJ[A-Za-z0-9_-]+)/)?.[1];
  return embeddedPlaceId || decoded.match(/(ChIJ[A-Za-z0-9_-]{10,})/)?.[1] || null;
}

function extractPlaceLabel(rawUrl: string): string | null {
  const url = new URL(rawUrl);
  const segments = url.pathname.split("/").filter(Boolean);
  const placeIndex = segments.findIndex((segment) => segment === "place");
  if (placeIndex !== -1 && segments[placeIndex + 1]) {
    return decodeURIComponent(segments[placeIndex + 1]).replace(/\+/g, " ").trim() || null;
  }
  for (const key of ["query", "destination", "q", "daddr"]) {
    const value = url.searchParams.get(key);
    if (value?.trim()) return value.replace(/\+/g, " ").trim();
  }
  return null;
}

async function searchPlaces(textQuery: string, apiKey: string): Promise<any[]> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.currentOpeningHours,places.photos,places.editorialSummary,places.businessStatus,places.googleMapsUri,places.primaryType,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({ textQuery, languageCode: "es", includedRegionCodes: ["do"], pageSize: 5 }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("[_localLift] Places API error:", res.status, await res.text().catch(() => ""));
    return [];
  }

  const data = await res.json();
  return Array.isArray(data?.places) ? data.places : [];
}

// Devuelve hasta 3 candidatos para que el cliente elija si hay varias sucursales.
export async function findPlaceCandidates(businessName: string, city: string): Promise<PlaceData[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  const places = await searchPlaces(`${businessName} ${city}`, apiKey);
  if (!places.length) return [];

  return places.filter(isLikelyBusinessPlace).slice(0, 3).map((p) => buildPlaceData(p, apiKey, businessName));
}

export async function findPlace(businessName: string, city: string): Promise<PlaceData | null> {
  const candidates = await findPlaceCandidates(businessName, city);
  return candidates[0] ?? null;
}

const PLACE_DETAILS_FIELD_MASK = "id,displayName,formattedAddress,addressComponents,rating,userRatingCount,websiteUri,nationalPhoneNumber,currentOpeningHours,photos,editorialSummary,businessStatus,googleMapsUri,primaryType,primaryTypeDisplayName";

async function findPlaceById(placeId: string, apiKey: string): Promise<PlaceData | null> {
  const res = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=es`, {
    headers: { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": PLACE_DETAILS_FIELD_MASK },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) return null;
  const place = await res.json();
  return place?.id && isLikelyBusinessPlace(place) ? buildPlaceData(place, apiKey, "Ficha de Google") : null;
}

export async function findPlaceByMapsUrl(mapsUrl: string): Promise<PlaceData | null> {
  if (!isGoogleMapsUrl(mapsUrl)) return null;
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  let resolvedUrl = mapsUrl;
  let placeId = extractPlaceId(resolvedUrl);
  const mapsHost = new URL(mapsUrl).hostname.toLowerCase().replace(/^www\./, "");
  if (!placeId && (mapsHost === "maps.app.goo.gl" || mapsHost === "goo.gl")) {
    try {
      const redirect = await fetch(mapsUrl, { redirect: "follow", signal: AbortSignal.timeout(5000) });
      resolvedUrl = redirect.url || mapsUrl;
      placeId = extractPlaceId(resolvedUrl);
    } catch (error) {
      console.warn("[_localLift] No se pudo resolver el enlace corto de Maps:", error);
    }
  }

  if (placeId) return findPlaceById(placeId, apiKey);
  const label = extractPlaceLabel(resolvedUrl);
  if (!label || isCoordinateOnlyLabel(label)) return null;
  const candidates = (await searchPlaces(label, apiKey)).filter(isLikelyBusinessPlace);
  return candidates[0] ? buildPlaceData(candidates[0], apiKey, label) : null;
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

// Variante de un solo intento (sin cadena de fallback), pensada para
// endpoints que corren en Vercel Hobby -- límite DURO de 10s por función
// serverless, no configurable (a diferencia de Pro). Correr 2-3 llamados
// de esta función EN PARALELO (Promise.allSettled) dentro del mismo
// handler cabe en ese presupuesto; encadenar 3 proveedores en serie con
// generateWithFallback (hasta 25s cada intento) no cabe nunca.
export type FastProvider = "deepseek" | "grok" | "gemini";

function fastModel(provider: FastProvider) {
  if (provider === "grok") return createXai({ apiKey: process.env.GROK_API_KEY })("grok-4.20-non-reasoning");
  if (provider === "gemini") return createGoogleGenerativeAI({ apiKey: process.env.GEMINI_API_KEY })("gemini-3.5-flash");
  return createDeepSeek({ apiKey: process.env.DEEPSEEK_API_KEY })("deepseek-v4-flash");
}

// `provider` es elegible por el caller a propósito: cuando varios llamados
// de generateFast corren EN PARALELO (ver local-lift-package.ts), mandarlos
// todos al mismo proveedor los hace competir por el mismo rate limit de esa
// cuenta -- probado en vivo, 5 llamados simultáneos a DeepSeek solo dejaron
// completar el más chico de los 5 antes del timeout. Repartir entre
// DeepSeek/Grok/Gemini baja la concurrencia real por proveedor.
export async function generateFast<S extends z.ZodTypeAny>(
  schema: S,
  prompt: string,
  temperature = 0.5,
  provider: FastProvider = "deepseek"
): Promise<z.infer<S>> {
  const result = await generateObject({
    model: fastModel(provider),
    schema,
    prompt,
    temperature,
    abortSignal: AbortSignal.timeout(9200),
  } as any);
  return result.object;
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
Cantidad de fotos: ${place.photoCount} (${place.photoUrls.length} disponibles para mostrar)
Descripción actual: ${place.editorialSummary || "sin descripción"}
Estado: ${place.isOperational ? "operativo" : "cerrado o no operativo según Google"}
`.trim();
}
