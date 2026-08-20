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
  phone: string | null;
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
  publishTime: string | null;
  relativePublishTimeDescription: string | null;
}

export interface PlaceCandidatesPage {
  candidates: PlaceData[];
  nextPageToken: string | null;
}

const MAX_STORED_PLACE_PHOTOS = 6;

function buildPlaceData(place: any, apiKey: string, fallbackName: string): PlaceData {
  const allPhotos = Array.isArray(place.photos) ? place.photos : [];
  // Solo conservamos las primeras seis referencias: el panel admin muestra
  // hasta seis y el PDF usa cuatro. Guardar todas las referencias de Google
  // hacía que el frontend pudiera precargar cientos de fotos innecesarias.
  const photos = allPhotos.slice(0, MAX_STORED_PLACE_PHOTOS);
  // Vía el proxy propio (api/local-lift-photo.ts) en vez de la URL cruda de
  // Google -- esa URL llevaba la API key real en el query string, expuesta
  // directo en el HTML/PDF, y además fallaba con 403 al cargarse desde el
  // navegador del cliente por las restricciones reales de esa key (pensada
  // para tráfico server-to-server, no para un <img> del navegador).
  const photoUrls = photos
    .map((p: any) => (p?.name ? `https://polarisweb.studio/api/local-lift-photo?ref=${encodeURIComponent(p.name)}` : null))
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
    phone: place.nationalPhoneNumber || null,
    hasHours: !!place.currentOpeningHours,
    photoCount: allPhotos.length,
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

function extractPlaceLabels(rawUrl: string): string[] {
  const url = new URL(rawUrl);
  const labels: string[] = [];
  const addLabel = (value: string | null) => {
    const normalized = value?.replace(/\+/g, " ").replace(/\s+/g, " ").trim();
    if (!normalized) return;
    const withoutPlusCode = normalized.replace(/^[A-Z0-9]{4,8}\s+[A-Z0-9]{2,}\s+/i, "").trim();
    for (const candidate of [withoutPlusCode, normalized]) {
      if (candidate && !labels.includes(candidate) && !isCoordinateOnlyLabel(candidate)) labels.push(candidate);
    }
  };

  const segments = url.pathname.split("/").filter(Boolean);
  const placeIndex = segments.findIndex((segment) => segment === "place");
  if (placeIndex !== -1 && segments[placeIndex + 1]) {
    addLabel(decodeURIComponent(segments[placeIndex + 1]));
    return labels;
  }

  for (const key of ["query", "destination", "q", "daddr"]) {
    addLabel(url.searchParams.get(key));
  }
  return labels;
}

async function searchPlaces(textQuery: string, apiKey: string, pageToken?: string): Promise<{ places: any[]; nextPageToken: string | null }> {
  const res = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": apiKey,
        "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.addressComponents,places.rating,places.userRatingCount,places.websiteUri,places.nationalPhoneNumber,places.currentOpeningHours,places.photos,places.editorialSummary,places.businessStatus,places.googleMapsUri,places.primaryType,places.primaryTypeDisplayName",
    },
    body: JSON.stringify({
      textQuery,
      languageCode: "es",
      regionCode: "DO",
      locationBias: {
        rectangle: {
          low: { latitude: 17.45, longitude: -72.05 },
          high: { latitude: 19.95, longitude: -68.20 },
        },
      },
      pageSize: 20,
      ...(pageToken ? { pageToken } : {}),
    }),
    signal: AbortSignal.timeout(8000),
  });

  if (!res.ok) {
    console.error("[_localLift] Places API error:", res.status, await res.text().catch(() => ""));
    return { places: [], nextPageToken: null };
  }

  const data = await res.json();
  return {
    places: Array.isArray(data?.places) ? data.places : [],
    nextPageToken: typeof data?.nextPageToken === "string" ? data.nextPageToken : null,
  };
}

// Devuelve una página amplia de candidatos y conserva el token para mostrar más resultados después.
export async function findPlaceCandidatePage(
  businessName: string,
  city: string,
  pageToken?: string,
): Promise<PlaceCandidatesPage> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) throw new Error("GOOGLE_PLACES_API_KEY no configurada");

  const searchResult = await searchPlaces(`${businessName} ${city}`, apiKey, pageToken);
  const candidates = searchResult.places
    .filter(isLikelyBusinessPlace)
    .slice(0, 20)
    .map((p) => buildPlaceData(p, apiKey, businessName));
  return { candidates, nextPageToken: searchResult.nextPageToken };
}

export async function findPlaceCandidates(businessName: string, city: string): Promise<PlaceData[]> {
  // La primera respuesta solo necesita una página: la UI muestra tres fichas
  // inicialmente y permite ampliar la lista con los candidatos ya recibidos.
  // Recuperar hasta 60 fichas antes de que el usuario pida ver más añadía
  // latencia, referencias de fotos y payload sin aportar valor al primer paso.
  const firstPage = await findPlaceCandidatePage(businessName, city);
  return firstPage.candidates;
}

export async function findPlace(businessName: string, city: string): Promise<PlaceData | null> {
  const candidates = await findPlaceCandidates(businessName, city);
  return candidates[0] ?? null;
}

const PLACE_DETAILS_FIELD_MASK = "id,displayName,formattedAddress,addressComponents,rating,userRatingCount,websiteUri,nationalPhoneNumber,currentOpeningHours,photos,editorialSummary,businessStatus,googleMapsUri,primaryType,primaryTypeDisplayName";

async function resolveGoogleMapsRedirect(rawUrl: string): Promise<string> {
  let currentUrl = rawUrl;
  for (let hop = 0; hop < 5; hop += 1) {
    const response = await fetch(currentUrl, {
      method: "GET",
      redirect: "manual",
      headers: { "User-Agent": "Mozilla/5.0 Polaris Local Lift" },
      signal: AbortSignal.timeout(4000),
    });
    const location = response.headers.get("location");
    if (response.body) void response.body.cancel().catch(() => undefined);
    if (response.status >= 300 && response.status < 400 && location) {
      currentUrl = new URL(location, currentUrl).toString();
      continue;
    }
    return currentUrl;
  }
  return currentUrl;
}

export async function findPlaceById(placeId: string, apiKey: string): Promise<PlaceData | null> {
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
      resolvedUrl = await resolveGoogleMapsRedirect(mapsUrl);
      placeId = extractPlaceId(resolvedUrl);
    } catch (error) {
      console.warn("[_localLift] No se pudo resolver el enlace corto de Maps:", error);
    }
  }

  if (placeId) return findPlaceById(placeId, apiKey);
  const labels = extractPlaceLabels(resolvedUrl);
  for (const label of labels) {
    const candidates = (await searchPlaces(label, apiKey)).places.filter(isLikelyBusinessPlace);
    if (candidates[0]) return buildPlaceData(candidates[0], apiKey, label);
  }
  return null;
}

// Google Places API (New) solo devuelve hasta 5 reseñas por ficha,
// sin importar cuántas tenga el negocio en total. El parámetro reviews_sort
// permite solicitar la muestra más reciente; si el endpoint o la cuenta no lo
// acepta, se conserva un fallback a la respuesta estándar de Google para no
// romper la generación del paquete.
export async function findPlaceReviews(
  placeId: string,
  lang: "es" | "en",
  options: { newest?: boolean } = {},
): Promise<RealReview[]> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return [];

  const baseUrl = `https://places.googleapis.com/v1/places/${placeId}`;
  const headers = { "X-Goog-Api-Key": apiKey, "X-Goog-FieldMask": "reviews" };
  const fetchReviews = async (newest: boolean): Promise<any[] | null> => {
    const url = new URL(baseUrl);
    url.searchParams.set("languageCode", lang);
    if (newest) url.searchParams.set("reviews_sort", "newest");
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const data = await res.json();
    return Array.isArray(data?.reviews) ? data.reviews : [];
  };

  const rawReviews = await fetchReviews(Boolean(options.newest)) ?? (options.newest ? await fetchReviews(false) : null) ?? [];
  return rawReviews
    .filter((r: any) => r?.text?.text)
    .map((r: any) => ({
      author: r.authorAttribution?.displayName || "Cliente",
      rating: typeof r.rating === "number" ? r.rating : 0,
      text: String(r.text.text).slice(0, 800),
      publishTime: typeof r.publishTime === "string" ? r.publishTime : null,
      relativePublishTimeDescription: typeof r.relativePublishTimeDescription === "string" ? r.relativePublishTimeDescription : null,
    }))
    .sort((a, b) => {
      if (!a.publishTime || !b.publishTime) return 0;
      return new Date(b.publishTime).getTime() - new Date(a.publishTime).getTime();
    });
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

// Versión corta del sitio web real (sin query string/UTMs ni hash) -- el
// sitio web real de un negocio suele venir con parámetros de tracking
// larguísimos (ej. "?src=corp_lclb_google_seo_drecc&utm_source=google&...")
// que, pegados tal cual en un mensaje de WhatsApp, se ven rotos y espantan
// al cliente. El modelo recibe esta versión limpia para usar cuando de
// verdad hace falta un link clickeable (encontrado en vivo, 16 de agosto).
export function shortWebsiteUri(websiteUri: string | null): string | null {
  if (!websiteUri) return null;
  try {
    const u = new URL(websiteUri);
    const path = u.pathname === "/" ? "" : u.pathname.replace(/\/$/, "");
    return `${u.origin}${path}`;
  } catch {
    return websiteUri;
  }
}

export function placeDataSummary(place: PlaceData): string {
  const shortUrl = shortWebsiteUri(place.websiteUri);
  return `
Nombre real: ${place.name}
Dirección: ${place.address || "no disponible"}
Categoría: ${place.primaryType || "no especificada"}
Calificación: ${place.rating !== null ? `${place.rating}/5` : "sin calificación"}
Cantidad de reseñas: ${place.reviewCount}
Tiene sitio web: ${place.hasWebsite ? `sí (link corto para usar si hace falta: ${shortUrl})` : "no"}
Tiene teléfono visible: ${place.hasPhone ? "sí" : "no"}
Tiene horario cargado: ${place.hasHours ? "sí" : "no"}
Cantidad de fotos: ${place.photoCount} (${place.photoUrls.length} disponibles para mostrar)
Descripción actual: ${place.editorialSummary || "sin descripción"}
Estado: ${place.isOperational ? "operativo" : "cerrado o no operativo según Google"}
`.trim();
}

// Pie legal compartido de los correos de Local Lift. Ninguno de los correos
// de esta familia lo tenía (ni el diagnóstico, ni el seguimiento, ni los de
// pago), a diferencia del resto de los correos de la cuenta -- ver
// monthly-traffic-report-send en Meridian, que es el patrón que se replica
// acá: sitio web / contacto, después privacidad / términos, y al final la
// línea de identificación más el motivo por el que la persona lo recibe.
export function buildEmailFooter(lang: "es" | "en", reasonLine: string): string {
  const en = lang === "en";
  const linkWeb = en ? "Website" : "Sitio web";
  const linkContact = en ? "Contact" : "Contacto";
  const linkPrivacy = en ? "Privacy" : "Privacidad";
  const linkTerms = en ? "Terms and conditions" : "Términos y condiciones";
  const identity = en
    ? "Polaris Local Lift · Dominican Republic · hola@polarisweb.studio"
    : "Polaris Local Lift · República Dominicana · hola@polarisweb.studio";
  const socialBase = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets";
  return `
    <div style="text-align:center;padding:0 0 24px;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
        <td style="padding:0 10px;"><a href="https://www.instagram.com/polariswebstudio/" target="_blank" rel="noopener noreferrer"><img src="${socialBase}/social-instagram.png" width="22" height="22" alt="Instagram" style="width:22px;height:22px;display:block;"></a></td>
        <td style="padding:0 10px;"><img src="${socialBase}/social-facebook.png" width="22" height="22" alt="Facebook" style="width:22px;height:22px;display:block;"></td>
        <td style="padding:0 10px;"><img src="${socialBase}/social-x.png" width="22" height="22" alt="X" style="width:22px;height:22px;display:block;"></td>
        <td style="padding:0 10px;"><img src="${socialBase}/social-linkedin.png" width="22" height="22" alt="LinkedIn" style="width:22px;height:22px;display:block;"></td>
      </tr></table>
    </div>
    <div style="height:1px;background:#e2e8f0;margin-bottom:24px;"></div>
    <div style="text-align:center;margin-bottom:16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:320px;margin:0 auto;"><tr>
        <td width="33%" style="text-align:left;white-space:nowrap;"><a href="https://www.polarisweb.studio" target="_blank" style="font-size:13px;color:#1f2937;">${linkWeb}</a></td>
        <td width="50%" style="text-align:right;white-space:nowrap;"><a href="mailto:hola@polarisweb.studio" style="font-size:13px;color:#1f2937;">${linkContact}</a></td>
      </tr></table>
    </div>
    <div style="text-align:center;margin-bottom:16px;"><a href="https://www.polarisweb.studio/privacidad" target="_blank" style="font-size:12px;color:#64748b;">${linkPrivacy}</a><span style="font-size:12px;color:#64748b;">&nbsp;·&nbsp;</span><a href="https://www.polarisweb.studio/terminos" target="_blank" style="font-size:12px;color:#64748b;">${linkTerms}</a></div>
    <div style="font-size:12px;color:#64748b;line-height:1.6;text-align:center;">${identity}<br>${reasonLine}</div>`;
}
