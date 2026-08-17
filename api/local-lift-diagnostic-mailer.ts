import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { generateWithFallback, placeDataSummary , buildEmailFooter } from "./_localLift.js";
import { claimEmailDelivery, commitEmailDelivery, hasSentDiagnostic, releaseEmailDelivery } from "./_localLiftEmailGuard.js";

// Manda de verdad los correos de diagnóstico gratis que quedaron
// "programados" con una demora real de 5-10 min (ver
// api/local-lift-diagnostic.ts) -- antes esa demora era pura ficción de
// UI, el correo real salía siempre de inmediato en el mismo request que
// generaba el diagnóstico. Corre cada 2 min vía Cloud Scheduler
// (local-lift-diagnostic-mailer-job) -- ventana de 5-10 min con chequeo
// cada 2 min da precisión de sobra sin exigir un cron por-segundo.
//
// También corre la generación real con IA acá (no solo el envío) -- desde
// que se difirió la generación misma hasta "Atlas ahora" o este job (16 de
// agosto), un lead que nunca toca el botón llega acá sin diagnóstico
// todavía. Por eso el batch por corrida es chico (5, no 25): cada item
// puede tardar 15-45s reales de generación, y la función tiene 60s de
// presupuesto total.
export const config = { maxDuration: 60 };

// Mismo schema que api/local-lift-diagnostic.ts -- duplicado a propósito,
// mismo patrón ya aceptado en la cuenta (ver PACKAGES/ADDONS en Meridian),
// este job corre aparte y no vale la pena una dependencia cruzada solo
// para esto.
const diagnosticSchema = z.object({
  businessIntro: z.string().describe("1-2 frases presentando qué es y a qué se dedica el negocio (rubro/categoría, tipo de servicio) — grounded en su nombre, categoría real y descripción de Google si la tiene. Nunca inventes datos que no estén en la ficha (ni cantidad de sucursales, años en el mercado, premios, etc.) — si hay poca info, quedate en algo genérico pero real (ej. 'agencia de viajes en Punta Cana')."),
  summary: z.string().describe("1-2 frases, en español, honestas pero alentadoras, resumiendo el estado general del negocio en Google — sin prometer posiciones ni resultados."),
  problems: z
    .array(
      z.object({
        title: z.string().describe("Nombre corto del problema (máximo 8 palabras)."),
        why: z.string().describe("Por qué importa este problema para conseguir más llamadas/mensajes/reservas — 1-2 frases."),
        fix: z.string().describe("Acción concreta y específica para resolverlo — 1 frase, accionable ya."),
      })
    )
    .length(5),
  sevenDayPlan: z.array(z.object({ day: z.number().int().min(1).max(7), action: z.string() })).length(7),
});

async function generateDiagnostic(place: any, lang: "es" | "en") {
  const prompt = `Sos un consultor de Polaris Local Lift analizando la ficha real de Google de este negocio (Punta Cana / República Dominicana o similar). Estos son los datos REALES de su ficha de Google, obtenidos vía Google Places API -- no inventes ningún dato adicional, cifra, reseña ni promesa de ranking:

${placeDataSummary(place)}

Con base ÚNICAMENTE en estos datos reales, generá primero una breve introducción de qué es el negocio (businessIntro), y luego exactamente 5 problemas prioritarios (ordenados de mayor a menor impacto en conseguir más llamadas/mensajes/reservas) y un plan de acción de 7 días. Tono profesional, directo, sin exagerar ni prometer resultados garantizados. Si el negocio ya tiene buena calificación/reseñas, decilo -- no inventes problemas que no existen; en ese caso enfocate en optimización fina (fotos, descripción, horario, respuestas a reseñas, etc.). Todo en ${lang === "en" ? "inglés" : "español neutro, sin voseo"}. Nunca uses dos guiones seguidos ("--") como signo de puntuación: usa una raya (—), una coma o punto y aparte según corresponda.`;
  // Mismo bug real que local-lift-diagnostic.ts: generateFast() tiene un
  // timeout fijo de 9.2s (pensado para los llamados chicos de
  // local-lift-package.ts), insuficiente para esta generación más grande
  // (5 problemas + plan de 7 días) -- los 3 proveedores lo agotaban
  // consistentemente. generateWithFallback (25s por intento) es correcto acá.
  return generateWithFallback(diagnosticSchema, prompt, 0.5);
}

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });

const LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/local-lift-logo-v2.png";
const FONT_DISPLAY = "'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif";
const FONT_BODY = "'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif";
const ACCENT = "#16C8C1"; // teal, color primario real de Local Lift (palabra "LIFT" del logo)
const DEEP = "#111936"; // navy de Local Lift

function renderDiagnosticText(diagnostic: any, lang: "es" | "en"): string {
  const problemsLabel = lang === "en" ? "Priority issues" : "Problemas prioritarios";
  const planLabel = lang === "en" ? "7-day action plan" : "Plan de acción de 7 días";
  const dayLabel = lang === "en" ? "Day" : "Día";
  const problemsText = diagnostic.problems.map((p: any, i: number) => `${i + 1}. ${p.title}\n   ${p.why}\n   → ${p.fix}`).join("\n\n");
  const planText = diagnostic.sevenDayPlan.map((d: any) => `${dayLabel} ${d.day}: ${d.action}`).join("\n");
  return `${diagnostic.businessIntro}\n\n${diagnostic.summary}\n\n${problemsLabel}:\n\n${problemsText}\n\n${planLabel}:\n\n${planText}`;
}

// Réplica exacta de buildDiagnosticHtml en local-lift-diagnostic.ts --
// duplicado a propósito, mismo patrón ya aceptado en la cuenta para
// constantes/plantillas compartidas entre Cloud Functions (ver
// PACKAGES/ADDONS en Meridian) -- este archivo es un job aparte, no vale
// la pena una dependencia cruzada para esto solo.
function buildDiagnosticHtml(diagnostic: any, place: any, contactName: string, lang: "es" | "en", leadId: string): string {
  const hasName = !!contactName && contactName.trim().length > 0;
  const firstName = hasName ? contactName.trim().split(/\s+/)[0] : "";
  const payUrl = `https://polarisweb.studio/local-lift/pagar/${leadId}`;
  const copy = lang === "en"
    ? {
        preheader: `Your Local Lift diagnosis for ${place.name} is ready.`,
        eyebrow: "Free diagnosis",
        title: hasName ? `Here's your diagnosis, ${firstName}!` : "Here's your diagnosis!",
        problemsLabel: "Priority issues",
        planLabel: "7-day action plan",
        dayLabel: "Day",
        ctaPrimary: "I want you to implement this",
        ctaSecondaryTop: "Questions?",
        ctaSecondaryBottom: "Reply to this email",
        footerLine1: "Polaris Local Lift · Dominican Republic · hola@polarisweb.studio",
        footerLine2: "You requested this diagnosis from our website.",
      }
    : {
        preheader: `Tu diagnóstico Local Lift de ${place.name} está listo.`,
        eyebrow: "Diagnóstico gratis",
        title: hasName ? `¡Aquí está tu diagnóstico, ${firstName}!` : "¡Aquí está tu diagnóstico!",
        problemsLabel: "Problemas prioritarios",
        planLabel: "Plan de acción de 7 días",
        dayLabel: "Día",
        ctaPrimary: "Quiero que lo implementen",
        ctaSecondaryTop: "¿Dudas?",
        ctaSecondaryBottom: "Responde este correo",
        footerLine1: "Polaris Local Lift · República Dominicana · hola@polarisweb.studio",
        footerLine2: "Solicitaste este diagnóstico desde nuestro sitio.",
      };

  const problemRows = diagnostic.problems
    .map(
      (p: any, i: number) => `
      <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:0 0 14px 0;">
        <tr>
          <td width="28" valign="top" style="padding:2px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0"><tr>
              <td width="22" height="22" align="center" valign="middle" style="width:22px;height:22px;border-radius:50%;background:${ACCENT};font-family:${FONT_DISPLAY};font-weight:700;font-size:11px;color:#ffffff;mso-line-height-rule:exactly;">${i + 1}</td>
            </tr></table>
          </td>
          <td valign="top" style="padding:0 0 0 4px;">
            <div style="font-family:${FONT_DISPLAY};font-weight:700;font-size:14px;color:#0f172a;">${p.title}</div>
            <div style="font-size:13px;line-height:1.5;color:#475569;margin-top:3px;">${p.why}</div>
            <div style="font-size:13px;line-height:1.5;color:${ACCENT};margin-top:4px;">→ ${p.fix}</div>
          </td>
        </tr>
      </table>`
    )
    .join("");

  const planRows = diagnostic.sevenDayPlan
    .map(
      (d: any) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 0;font-family:${FONT_DISPLAY};font-weight:700;font-size:12px;color:${ACCENT};width:60px;border-bottom:1px solid #e2e8f0;">${copy.dayLabel} ${d.day}</td>
        <td style="padding:8px 0;font-size:13px;color:#1f2937;border-bottom:1px solid #e2e8f0;">${d.action}</td>
      </tr>`
    )
    .join("");

  const contactMailto = `mailto:hola@polarisweb.studio?subject=${encodeURIComponent(`Local Lift — ${place.name}`)}`;

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
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f8fafc;opacity:0;">${copy.preheader}</div>
<div style="width:100%;min-height:100vh;background:#f8fafc;padding:48px 16px;box-sizing:border-box;font-family:${FONT_BODY};">
<div style="width:600px;max-width:100%;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">

  <div style="padding:32px 40px 8px 40px;text-align:center;">
    <img src="${LOGO_URL}" alt="Local Lift by Polaris Web Studio" width="160" style="width:160px;max-width:80%;height:auto;display:block;margin:0 auto;">
  </div>

  <div style="padding:20px 40px 8px 40px;text-align:center;">
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-bottom:14px;">${copy.eyebrow}</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:30px;line-height:1.2;color:#0f172a;">${copy.title}</div>
  </div>

  <div style="padding:14px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="#f2ffff" style="border:1px solid #bdeee9;border-radius:12px;background:#f2ffff;overflow:hidden;">
      <tr><td style="padding:20px 22px;">
        <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:22px;line-height:1.2;color:${DEEP};">${place.name}</div>
        ${place.address ? `<div style="font-size:13px;line-height:1.5;color:#475569;margin-top:10px;"><span style="font-weight:700;color:${DEEP};">${lang === "en" ? "Location:" : "Ubicación:"}</span>&nbsp; ${place.address}</div>` : ""}
      </td></tr>
    </table>
  </div>

  <div style="padding:16px 40px 0 40px;text-align:center;">
    <p style="font-size:14px;line-height:1.65;color:#475569;margin:0;font-style:italic;">${diagnostic.businessIntro}</p>
  </div>

  <div style="padding:14px 40px 0 40px;text-align:center;">
    <p style="font-size:15px;line-height:1.7;color:#1f2937;margin:0;">${diagnostic.summary}</p>
  </div>

  <div style="padding:28px 40px 0 40px;">
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:24px;">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin-bottom:14px;">${copy.problemsLabel}</div>
      ${problemRows}
    </div>
  </div>

  <div style="padding:20px 40px 0 40px;">
    <div style="border:1px solid #e2e8f0;border-radius:10px;padding:24px;">
      <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#64748b;margin-bottom:12px;">${copy.planLabel}</div>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${planRows}</table>
    </div>
  </div>

  <div style="padding:28px 40px 0 40px;text-align:center;">
    <a href="${payUrl}" target="_blank" style="display:inline-block;background:${ACCENT};color:#ffffff;font-family:${FONT_DISPLAY};font-weight:700;font-size:15px;padding:14px 32px;border-radius:8px;">${copy.ctaPrimary}</a>
  </div>
  <div style="padding:14px 40px 0 40px;text-align:center;">
    <a href="${contactMailto}" style="display:inline-block;background:#ffffff;color:#0f172a;border:1px solid #cbd5e1;font-family:${FONT_DISPLAY};font-weight:700;padding:11px 32px;border-radius:8px;line-height:1.4;">
      <span style="display:block;font-size:12px;font-weight:700;color:#0f172a;">${copy.ctaSecondaryTop}</span>
      <span style="display:block;font-size:15px;">${copy.ctaSecondaryBottom}</span>
    </a>
  </div>

  <div style="padding:40px 40px 0 40px;">
    <div style="height:1px;background:#e2e8f0;"></div>
  </div>

  <div style="padding:24px 40px 40px 40px;">
    ${buildEmailFooter(lang === "en" ? "en" : "es", copy.footerLine2)}
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

  try {
    const snap = await firestore
      .collection("localLiftDiagnostics")
      .where("emailSent", "==", false)
      .where("emailScheduledAt", "<=", now)
      .limit(5)
      .get();

      const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
      connectionTimeout: 8000,
      greetingTimeout: 8000,
      socketTimeout: 10000,
    });

    let sent = 0;
    const errors: string[] = [];

    for (const doc of snap.docs) {
      const v = doc.data();
      if (!v.email || !v.placeData || v.status === "email_blocked") continue;
      const lang: "es" | "en" = v.lang === "en" ? "en" : "es";
      try {
        if (v.emailSent) continue;
        if (await hasSentDiagnostic(firestore, v.email)) {
          await doc.ref.update({ status: "email_blocked", emailScheduledAt: null });
          continue;
        }
        const deliveryClaim = await claimEmailDelivery(firestore, doc.ref, v.email);
        if (deliveryClaim !== "claimed") continue;
        // Si nadie pidió "Atlas ahora" antes de que se cumpliera la
        // demora, el diagnóstico todavía no existe -- se genera acá recién
        // ahora, con IA (mismo motivo que reveal-now en
        // local-lift-diagnostic.ts, no duplicado ahí porque este job corre
        // aparte).
        let diagnostic = v.diagnostic;
        if (!diagnostic) {
          diagnostic = await generateDiagnostic(v.placeData, lang);
          await doc.ref.update({ diagnostic, status: "diagnostic_sent" });
        }
        await transporter.sendMail({
          from: '"Polaris Local Lift" <hola@polarisweb.studio>',
          to: v.email,
          subject: lang === "en" ? `Your Local Lift diagnosis for ${v.businessName}` : `Tu diagnóstico Local Lift de ${v.businessName}`,
          text: renderDiagnosticText(diagnostic, lang),
          html: buildDiagnosticHtml(diagnostic, v.placeData, v.contactName || "", lang, doc.id),
        });
        await commitEmailDelivery(firestore, doc.ref, v.email, { leadId: doc.id, via: "scheduled" });
        sent++;
      } catch (mailErr: any) {
        await releaseEmailDelivery(firestore, doc.ref).catch(() => undefined);
        errors.push(`${doc.id}: ${String(mailErr?.message || mailErr)}`);
      }
    }

    return res.json({ success: true, checked: snap.docs.length, sent, errors });
  } catch (error: any) {
    console.error("[local-lift-diagnostic-mailer] Error:", error);
    return res.status(500).json({ error: String(error?.message || error) });
  }
}
