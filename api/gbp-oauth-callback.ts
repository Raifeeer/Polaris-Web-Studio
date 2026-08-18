import type { VercelRequest, VercelResponse } from "@vercel/node";
import { createHmac, timingSafeEqual } from "node:crypto";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Flujo real de conexión OAuth de Google Business Profile para Local Lift.
// Un solo archivo/ruta a propósito (límite real de 12 funciones del plan
// Hobby de Vercel, ver Meridian/CLAUDE.md pendiente #13) -- distingue entre
// "arrancar el flujo" (?action=start) y "el redirect real que manda Google"
// (?code=...&state=...) por la presencia de esos query params.
//
// La ruta exacta (/api/gbp-oauth-callback) está registrada tal cual como
// redirect URI en el OAuth Client de Google Cloud -- no se puede mover sin
// actualizar también ahí.
//
// El cliente (dueño real del negocio, no el admin de Polaris) es quien
// autoriza -- Local Lift nunca ve ni pide su contraseña de Google, solo el
// token de OAuth que Google emite tras su consentimiento explícito.

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });

const REDIRECT_URI = "https://polarisweb.studio/api/gbp-oauth-callback";
const SCOPE = "https://www.googleapis.com/auth/business.manage";

function signState(leadId: string): string {
  const secret = process.env.CRON_SECRET || "";
  const sig = createHmac("sha256", secret).update(leadId).digest("hex").slice(0, 24);
  return `${leadId}.${sig}`;
}

function verifyState(state: string): string | null {
  const [leadId, sig] = String(state || "").split(".");
  if (!leadId || !sig) return null;
  const expected = signState(leadId).split(".")[1];
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  return leadId;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const firestore = getFirestore(firebaseApp, "polaris-web-studio");
  const { action, leadId, code, state, error: oauthError } = req.query as Record<string, string | undefined>;

  const clientId = process.env.GBP_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GBP_OAUTH_CLIENT_SECRET;

  try {
    // Paso 1: arrancar el flujo -- devuelve la URL real de consentimiento de Google.
    if (action === "start") {
      return res.status(410).json({ error: "La conexión externa no forma parte del Ascenso actual. Usa la guía y el acompañamiento del portal." });
      if (!clientId) return res.status(500).json({ error: "GBP_OAUTH_CLIENT_ID no configurado." });
      if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el lead." });
      const doc = await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get();
      if (!doc.exists) return res.status(404).json({ error: "No encontramos ese lead." });
      const leadTier = doc.data()?.tier;
      if (leadTier !== "ascenso" && leadTier !== "implementado") {
        return res.status(410).json({ error: "La ejecución directa en Google no forma parte de la oferta actual de Local Lift." });
      }

      const params = new URLSearchParams({
        client_id: clientId,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPE,
        access_type: "offline",
        prompt: "consent",
        state: signState(leadId.trim()),
      });
      return res.json({ success: true, url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
    }

    // Paso 2: estado actual de la conexión de un lead.
    if (action === "status") {
      if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el lead." });
      const doc = await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get();
      if (!doc.exists) return res.status(404).json({ error: "No encontramos ese lead." });
      const data = doc.data()!;
      const gbp = data.gbp;
      return res.json({ success: true, tier: data.tier || "impulso", connected: !!gbp?.refreshToken, connectedAt: gbp?.connectedAt || null });
    }

    // Desconectar: revoca el token real en Google (no solo lo borra acá --
    // si solo lo borráramos de Firestore, el refresh token seguiría activo
    // del lado de Google, dándole a Local Lift acceso silencioso e
    // indefinido) y limpia el campo gbp del lead. POST únicamente, lo
    // dispara el propio cliente desde /local-lift/conectar/:leadId.
    if (req.method === "POST" && action === "disconnect") {
      const body = req.body || {};
      const targetLeadId = typeof body.leadId === "string" ? body.leadId.trim() : "";
      if (!targetLeadId) return res.status(400).json({ error: "Falta el lead." });
      const doc = await firestore.collection("localLiftDiagnostics").doc(targetLeadId).get();
      if (!doc.exists) return res.status(404).json({ error: "No encontramos ese lead." });
      const gbp = doc.data()!.gbp;
      if (gbp?.refreshToken) {
        try {
          await fetch("https://oauth2.googleapis.com/revoke", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ token: gbp.refreshToken }),
          });
        } catch (revokeErr) {
          console.error("[gbp-oauth-callback] Error revocando token en Google:", revokeErr);
        }
      }
      await firestore.collection("localLiftDiagnostics").doc(targetLeadId).update({ gbp: null });
      return res.json({ success: true });
    }

    // Paso 3: el redirect real que manda Google con ?code=&state= tras el consentimiento.
    if (code && state) {
      const verifiedLeadId = verifyState(state);
      if (!verifiedLeadId) {
        return res.redirect(302, "https://polarisweb.studio/local-lift?gbp=invalid_state");
      }
      if (!clientId || !clientSecret) {
        return res.redirect(302, "https://polarisweb.studio/local-lift?gbp=not_configured");
      }
      const leadDoc = await firestore.collection("localLiftDiagnostics").doc(verifiedLeadId).get();
      const leadTier = leadDoc.data()?.tier;
      if (!leadDoc.exists || (leadTier !== "ascenso" && leadTier !== "implementado")) {
        return res.redirect(302, "https://polarisweb.studio/local-lift?gbp=not_included");
      }

      const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: REDIRECT_URI,
          grant_type: "authorization_code",
        }),
      });
      const tokenData = await tokenRes.json();
      if (!tokenRes.ok || !tokenData.refresh_token) {
        console.error("[gbp-oauth-callback] Error canjeando el código:", tokenData);
        return res.redirect(302, `https://polarisweb.studio/local-lift/conectar/${verifiedLeadId}?gbp=error`);
      }

      await firestore.collection("localLiftDiagnostics").doc(verifiedLeadId).set(
        {
          gbp: {
            accessToken: tokenData.access_token,
            refreshToken: tokenData.refresh_token,
            expiryDate: Date.now() + (tokenData.expires_in || 3600) * 1000,
            connectedAt: new Date(),
          },
        },
        { merge: true }
      );

      // Aviso real al admin -- antes esto pasaba en silencio, sin ninguna
      // notificación, así que solo se sabía que un cliente conectó su
      // cuenta si alguien entraba al panel a revisar Firestore a mano.
      const zohoPassword = process.env.ZOHO_PASSWORD;
      if (zohoPassword) {
        try {
          const leadDoc = await firestore.collection("localLiftDiagnostics").doc(verifiedLeadId).get();
          const leadData = leadDoc.data() || {};
          const transporter = nodemailer.createTransport({
            host: "smtp.zoho.com", port: 465, secure: true,
            auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
          });
          await transporter.sendMail({
            from: '"Local Lift -- conexión heredada detectada" <hola@polarisweb.studio>',
            to: "hola@polarisweb.studio",
            subject: `Conexión heredada de Google detectada · ${leadData.businessName || "Un cliente"}`,
            text: `Se detectó una conexión heredada de Google para ${leadData.businessName || "(sin nombre)"}.\n\nContacto: ${leadData.contactName || ""} <${leadData.email || ""}>\nPanel: https://polarisweb.studio/local-lift/panel\n\nEl Ascenso actual funciona con guía y acompañamiento; revisa este registro solo si necesitas revocar un acceso anterior.`,
          });
        } catch (mailErr) {
          console.error("[gbp-oauth-callback] Error enviando aviso de conexión:", mailErr);
        }
      }

      return res.redirect(302, `https://polarisweb.studio/local-lift/conectar/${verifiedLeadId}?gbp=ok`);
    }

    if (oauthError) {
      // El cliente canceló el consentimiento en la pantalla de Google.
      const stateLeadId = state ? verifyState(state) : null;
      return res.redirect(302, `https://polarisweb.studio/local-lift/conectar/${stateLeadId || ""}?gbp=denied`);
    }

    return res.status(400).json({ error: "Solicitud inválida." });
  } catch (err: any) {
    console.error("[gbp-oauth-callback] Error:", err);
    return res.status(500).json({ error: err?.message || "Error interno." });
  }
}
