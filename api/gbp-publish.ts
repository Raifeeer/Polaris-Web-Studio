import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createPublicKey, timingSafeEqual, verify as cryptoVerify } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Publicación REAL en Google Business Profile usando los tokens guardados
// por gbp-oauth-callback.ts -- cierra el pendiente explícitamente diferido
// desde que se construyó el flujo de conexión: hasta ahora "conectar la
// cuenta" no hacía nada útil, solo guardaba un token sin usar. Esto es
// también lo que separa de verdad "Impulso" (contenido, el cliente lo
// implementa) de "Ascenso" (Polaris lo implementa directo en su ficha).
//
// LIMITACIÓN REAL DE GOOGLE, documentada acá para que quede claro si algo
// falla: crear publicaciones (Local Posts) y responder reseñas vía API
// están restringidos desde 2023-2024 -- un proyecto de Google Cloud nuevo
// como el de Polaris no tiene acceso automático a esos métodos concretos
// de la API v4 de My Business, hay que pedirle a Google acceso elevado
// (formulario + revisión manual, sin garantía de tiempo). Si las llamadas
// de abajo devuelven 403 PERMISSION_DENIED, es esto -- no un bug acá.
export const config = { maxDuration: 60 };

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });

const ADMIN_EMAIL = "cristian2200299@gmail.com";

// Mismo patrón de verificación manual (RS256 + node:crypto) que
// local-lift-package.ts -- ver el comentario de ahí para el motivo real
// (getAuth().verifyIdToken() rompe la función con ERR_REQUIRE_ESM).
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

// Refresca el access token si venció (los access token de Google duran
// ~1h) usando el refresh token guardado -- antes esto no existía, el
// token guardado en la conexión inicial se hubiera vuelto inútil a la
// hora. El refresh token en sí no vence salvo revocación explícita.
async function getValidAccessToken(firestore: FirebaseFirestore.Firestore, leadId: string): Promise<string | null> {
  const docRef = firestore.collection("localLiftDiagnostics").doc(leadId);
  const doc = await docRef.get();
  if (!doc.exists) return null;
  const gbp = doc.data()!.gbp;
  if (!gbp?.refreshToken) return null;

  if (gbp.accessToken && gbp.expiryDate && Date.now() < gbp.expiryDate - 60_000) {
    return gbp.accessToken as string;
  }

  const clientId = process.env.GBP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GBP_OAUTH_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: gbp.refreshToken,
      grant_type: "refresh_token",
    }),
  });
  const data = await res.json();
  if (!res.ok || !data.access_token) {
    console.error("[gbp-publish] Error refrescando token:", data);
    return null;
  }
  const newExpiry = Date.now() + (data.expires_in || 3600) * 1000;
  await docRef.update({ "gbp.accessToken": data.access_token, "gbp.expiryDate": newExpiry });
  return data.access_token as string;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  if (!(await verifyAdmin(req))) return res.status(403).json({ error: "Acceso denegado." });

  const { action, leadId, locationName, accountLocationPath, post, reviewName, replyText } = req.body || {};
  if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el lead." });
  const firestore = getFirestore(firebaseApp, "polaris-web-studio");

  try {
    const leadDoc = await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get();
    if (!leadDoc.exists) return res.status(404).json({ error: "Lead no encontrado." });
    const leadTier = leadDoc.data()?.tier;
    if (leadTier !== "ascenso" && leadTier !== "implementado") {
      return res.status(403).json({ error: "La implementación directa en Google está incluida únicamente en Ascenso." });
    }
    const accessToken = await getValidAccessToken(firestore, leadId.trim());
    if (!accessToken) return res.status(400).json({ error: "Este lead no tiene una cuenta de Google conectada (o hay que reconectarla)." });
    const authHeader = { Authorization: `Bearer ${accessToken}` };

    // Paso 1: qué cuentas/ubicaciones reales de Business Profile puede
    // administrar este token -- necesario antes de poder publicar nada
    // (el cliente puede tener más de un negocio en su cuenta de Google).
    if (action === "list-locations") {
      const accRes = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", { headers: authHeader });
      const accData = await accRes.json();
      if (!accRes.ok) return res.status(accRes.status).json({ error: "Error listando cuentas de Google", detail: accData });

      const accounts = accData.accounts || [];
      const locations: any[] = [];
      for (const acc of accounts) {
        const locRes = await fetch(
          `https://mybusinessbusinessinformation.googleapis.com/v1/${acc.name}/locations?readMask=name,title&pageSize=20`,
          { headers: authHeader }
        );
        const locData = await locRes.json();
        if (locRes.ok) {
          for (const loc of locData.locations || []) {
            // El nombre de recurso v1 ("locations/123") no sirve para la
            // API v4 legacy de posts/reseñas -- esa necesita
            // "accounts/{accountId}/locations/{locationId}" armado a mano.
            const locationId = String(loc.name).split("/").pop();
            locations.push({
              accountName: acc.name,
              locationName: loc.name,
              accountLocationPath: `${acc.name}/locations/${locationId}`,
              title: loc.title,
            });
          }
        }
      }
      return res.json({ success: true, locations });
    }

    // Paso 2: reseñas reales de esa ubicación (vía la API legacy v4 -- la
    // única que expone reply-to-review hoy). Puede devolver 403 real si el
    // proyecto no tiene acceso elevado, ver nota arriba del archivo.
    if (action === "list-reviews") {
      if (typeof accountLocationPath !== "string") return res.status(400).json({ error: "Falta accountLocationPath." });
      const revRes = await fetch(`https://mybusiness.googleapis.com/v4/${accountLocationPath}/reviews`, { headers: authHeader });
      const revData = await revRes.json();
      if (!revRes.ok) {
        return res.status(revRes.status).json({
          error: "Google rechazó la solicitud de reseñas -- probablemente falta acceso elevado a la API de reseñas (ver nota en el código).",
          detail: revData,
        });
      }
      return res.json({ success: true, reviews: revData.reviews || [] });
    }

    // Paso 3: publicar UN post real -- siempre disparado a mano por el
    // admin (nunca automático), un post real a la vez.
    if (action === "publish-post") {
      if (typeof accountLocationPath !== "string") return res.status(400).json({ error: "Falta accountLocationPath." });
      if (!post || typeof post.body !== "string") return res.status(400).json({ error: "Falta el contenido del post." });
      const cta = post.cta && post.cta !== "Ninguno" ? { actionType: post.cta === "Llamar ahora" ? "CALL" : "LEARN_MORE" } : undefined;
      const postRes = await fetch(`https://mybusiness.googleapis.com/v4/${accountLocationPath}/localPosts`, {
        method: "POST",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({
          languageCode: "es",
          summary: post.body,
          topicType: "STANDARD",
          ...(cta ? { callToAction: cta } : {}),
        }),
      });
      const postData = await postRes.json();
      if (!postRes.ok) {
        return res.status(postRes.status).json({
          error: "Google rechazó la publicación -- probablemente falta acceso elevado a la API de Local Posts (ver nota en el código).",
          detail: postData,
        });
      }
      return res.json({ success: true, post: postData });
    }

    // Paso 4: responder a una reseña real ya existente.
    if (action === "reply-review") {
      if (typeof reviewName !== "string") return res.status(400).json({ error: "Falta reviewName." });
      if (typeof replyText !== "string" || !replyText.trim()) return res.status(400).json({ error: "Falta el texto de la respuesta." });
      const replyRes = await fetch(`https://mybusiness.googleapis.com/v4/${reviewName}/reply`, {
        method: "PUT",
        headers: { ...authHeader, "Content-Type": "application/json" },
        body: JSON.stringify({ comment: replyText }),
      });
      const replyData = await replyRes.json();
      if (!replyRes.ok) {
        return res.status(replyRes.status).json({
          error: "Google rechazó la respuesta -- probablemente falta acceso elevado a la API de reseñas (ver nota en el código).",
          detail: replyData,
        });
      }
      return res.json({ success: true, reply: replyData });
    }

    return res.status(400).json({ error: "Acción inválida." });
  } catch (error: any) {
    console.error("[gbp-publish] Error:", error);
    return res.status(500).json({ error: String(error?.message || error) });
  }
}
