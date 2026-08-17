import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";
import { buildEmailFooter } from "./_localLift.js";

// Seguimiento real a quien recibió el diagnóstico gratis y nunca pagó --
// antes no existía ningún recordatorio (a diferencia del cotizador general
// de la agencia, que sí tiene lead-drip-send). Sin esto, un diagnóstico
// gratis que nadie convierte en 2-3 días se pierde para siempre.
//
// Protegido por CRON_SECRET, pensado para dispararse una vez al día vía
// Cloud Scheduler (mismo patrón que el resto de los jobs recurrentes de la
// cuenta, ver Meridian/CLAUDE.md) -- no vía Vercel Cron, para no depender
// de los límites propios del plan Hobby.
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

const LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/local-lift-logo-v7.png";
const FONT_DISPLAY = "'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif";
const FONT_BODY = "'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif";
const ACCENT = "#16C8C1"; // teal, color primario real de Local Lift (palabra "LIFT" del logo)

function buildFollowupHtml(businessName: string, contactName: string, problemTitle: string, leadId: string): string {
  const hasName = !!contactName && contactName.trim().length > 0;
  const firstName = hasName ? contactName.trim().split(/\s+/)[0] : "";
  const payUrl = `https://polarisweb.studio/local-lift/pagar/${leadId}`;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,500&f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
<style>body{margin:0;}a{text-decoration:none;color:${ACCENT};}</style>
</head>
<body>
<div style="width:100%;min-height:100vh;background:#f8fafc;padding:48px 16px;box-sizing:border-box;font-family:${FONT_BODY};">
<div style="width:600px;max-width:100%;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <div style="padding:32px 40px 0 40px;text-align:center;">
    <img src="${LOGO_URL}" alt="Local Lift by Polaris Web Studio" width="160" style="width:160px;max-width:80%;height:auto;display:block;margin:0 auto;">
  </div>
  <div style="padding:32px 40px 0 40px;text-align:center;">
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-bottom:14px;">Local Lift</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:26px;line-height:1.25;color:#0f172a;">${hasName ? `${firstName}, tu diagnóstico sigue esperando` : "Tu diagnóstico sigue esperando"}</div>
  </div>
  <div style="padding:16px 40px 0 40px;text-align:center;">
    <p style="font-size:15px;line-height:1.7;color:#1f2937;margin:0;">Hace unos días te enviamos el diagnóstico real de <strong>${businessName}</strong>. El primero de los problemas que encontramos:</p>
    <p style="font-size:15px;line-height:1.7;color:${ACCENT};font-weight:700;margin:10px 0 0 0;">${problemTitle}</p>
    <p style="font-size:15px;line-height:1.7;color:#1f2937;margin:14px 0 0 0;">Por $29 lo implementamos por ti — descripción reescrita, publicaciones listas, respuestas a tus reseñas reales y mensajes de WhatsApp de seguimiento.</p>
  </div>
  <div style="padding:24px 40px 32px 40px;text-align:center;">
    <a href="${payUrl}" target="_blank" style="display:inline-block;background:${ACCENT};color:#ffffff;font-family:${FONT_DISPLAY};font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">Activar Impulso — $29</a>
  </div>
  <div style="padding:0 40px 40px 40px;">
    <div style="height:1px;background:#e2e8f0;margin-bottom:20px;"></div>
    ${buildEmailFooter("es", "Recibiste este correo porque solicitaste un diagnóstico gratuito de Local Lift.")}
  </div>
</div>
</div>
</body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return res.status(403).json({ error: "forbidden" });

  const zohoPassword = process.env.ZOHO_PASSWORD;
  if (!zohoPassword) return res.status(500).json({ error: "ZOHO_PASSWORD no configurado" });

  const firestore = getFirestore(firebaseApp, "polaris-web-studio");
  const now = Date.now();
  const cutoffStart = Timestamp.fromMillis(now - 5 * 24 * 60 * 60 * 1000); // no más viejo que 5 días
  const cutoffEnd = Timestamp.fromMillis(now - 2 * 24 * 60 * 60 * 1000); // al menos 2 días de antigüedad

  try {
    const snap = await firestore
      .collection("localLiftDiagnostics")
      .where("source", "==", "free_diagnostic")
      .where("paid", "==", false)
      .where("createdAt", ">=", cutoffStart)
      .where("createdAt", "<=", cutoffEnd)
      .get();

    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com", port: 465, secure: true,
      auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
    });

    let sent = 0;
    const errors: string[] = [];

    for (const doc of snap.docs) {
      const v = doc.data();
      if (v.followUpSentAt) continue; // idempotencia -- nunca dos veces al mismo lead
      if (!v.email || !v.diagnostic?.problems?.[0]?.title) continue;

      try {
        await transporter.sendMail({
          from: '"Polaris Local Lift" <hola@polarisweb.studio>',
          to: v.email,
          subject: `${v.businessName || "Tu negocio"} — tu diagnóstico Local Lift sigue esperando`,
          html: buildFollowupHtml(v.businessName || "", v.contactName || "", v.diagnostic.problems[0].title, doc.id),
        });
        await doc.ref.update({ followUpSentAt: new Date() });
        sent++;
      } catch (mailErr: any) {
        errors.push(`${doc.id}: ${String(mailErr?.message || mailErr)}`);
      }
    }

    return res.json({ success: true, checked: snap.docs.length, sent, errors });
  } catch (error: any) {
    console.error("[local-lift-followup] Error:", error);
    return res.status(500).json({ error: String(error?.message || error) });
  }
}
