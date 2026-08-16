import type { VercelRequest, VercelResponse } from "@vercel/node";
import { z } from "zod";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { findPlaceCandidates, generateWithFallback, placeDataSummary, type PlaceData } from "./_localLift.js";

// Node en Vercel Hobby soporta hasta 60s reales por función (config
// maxDuration explícito) -- no el techo duro de 10s que asumía la versión
// anterior de este archivo. Bug real encontrado en vivo (15 de agosto): con
// un solo intento a DeepSeek y un timeout de 9.2s, la llamada real medía
// 10-15s (DeepSeek/Grok son modelos con razonamiento, no instantáneos) y
// fallaba con 500 en la enorme mayoría de los casos. Con maxDuration:60 la
// cadena completa DeepSeek -> Grok -> Gemini (25s cada intento) cabe cómoda.
export const config = { maxDuration: 60 };

// Endpoint real detrás de "Diagnóstico Express" de Polaris Local Lift
// (/local-lift): a diferencia de la venta manual por WhatsApp que existía
// hasta ahora, esto trae datos REALES del negocio vía Google Places API
// (New) y le pide a un modelo que redacte los 5 problemas prioritarios +
// el plan de 7 días GROUNDED en esos datos -- nunca inventa cifras
// (reseñas, si tiene web, teléfono, fotos, horario, etc. salen de Places,
// no del modelo). Mismo patrón de fallback DeepSeek -> Grok -> Gemini que
// quotebot-chat.ts, y misma cuenta de Firestore ("polaris-web-studio") que
// server-db.ts. Este es el tier gratis (gancho); el paquete pago completo
// del tier 48H vive en local-lift-package.ts, admin-only.

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
  businessIntro: z.string().describe("1-2 frases presentando qué es y a qué se dedica el negocio (rubro/categoría, tipo de servicio) -- grounded en su nombre, categoría real y descripción de Google si la tiene. Nunca inventes datos que no estén en la ficha (ni cantidad de sucursales, años en el mercado, premios, etc.) -- si hay poca info, quedate en algo genérico pero real (ej. 'agencia de viajes en Punta Cana')."),
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

async function generateDiagnostic(place: PlaceData, lang: "es" | "en"): Promise<Diagnostic> {
  const prompt = `Sos un consultor de Polaris Local Lift analizando la ficha real de Google de este negocio (Punta Cana / República Dominicana o similar). Estos son los datos REALES de su ficha de Google, obtenidos vía Google Places API -- no inventes ningún dato adicional, cifra, reseña ni promesa de ranking:

${placeDataSummary(place)}

Con base ÚNICAMENTE en estos datos reales, generá primero una breve introducción de qué es el negocio (businessIntro), y luego exactamente 5 problemas prioritarios (ordenados de mayor a menor impacto en conseguir más llamadas/mensajes/reservas) y un plan de acción de 7 días. Tono profesional, directo, sin exagerar ni prometer resultados garantizados. Si el negocio ya tiene buena calificación/reseñas, decilo -- no inventes problemas que no existen; en ese caso enfocate en optimización fina (fotos, descripción, horario, respuestas a reseñas, etc.). Todo en ${lang === "en" ? "inglés" : "español neutro, sin voseo"}.`;

  return generateWithFallback(diagnosticSchema, prompt);
}

function renderDiagnosticText(diagnostic: Diagnostic, lang: "es" | "en"): string {
  const problemsLabel = lang === "en" ? "Priority issues" : "Problemas prioritarios";
  const planLabel = lang === "en" ? "7-day action plan" : "Plan de acción de 7 días";
  const dayLabel = lang === "en" ? "Day" : "Día";

  const problemsText = diagnostic.problems
    .map((p, i) => `${i + 1}. ${p.title}\n   ${p.why}\n   → ${p.fix}`)
    .join("\n\n");
  const planText = diagnostic.sevenDayPlan.map((d) => `${dayLabel} ${d.day}: ${d.action}`).join("\n");

  return `${diagnostic.businessIntro}\n\n${diagnostic.summary}\n\n${problemsLabel}:\n\n${problemsText}\n\n${planLabel}:\n\n${planText}`;
}

// Plantilla HTML real (Familia A de Polaris, misma que usa
// quote-confirmation-send en Meridian: logo real, tipografía Cabinet
// Grotesk/Satoshi, tarjeta blanca sobre fondo gris) -- reemplaza el correo
// de texto plano que salía antes. Pedido explícito del usuario (15 de
// agosto) tras recibir el diagnóstico y notar que no seguía la plantilla
// de marca ya usada en el resto de los correos de Polaris.
const LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/polaris-logo-badge-v2.png";
const FONT_DISPLAY = "'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif";
const FONT_BODY = "'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif";
const ACCENT = "#4f46e5"; // mismo indigo que "Impulso", color primario de marca

function buildDiagnosticHtml(diagnostic: Diagnostic, place: PlaceData, contactName: string, lang: "es" | "en", leadId: string): string {
  const hasName = !!contactName && contactName.trim().length > 0;
  const firstName = hasName ? contactName.trim().split(/\s+/)[0] : "";
  // Tier "Impulso" ($29) -- mismo tier con el que se crea el lead del
  // diagnóstico gratis (ver TIER_PRICE de local-lift-order.ts/LocalLift.tsx).
  const payUrl = `https://polarisweb.studio/local-lift/pagar/${leadId}`;

  const copy = lang === "en"
    ? {
        preheader: `Your Local Lift diagnosis for ${place.name} is ready.`,
        eyebrow: "Free diagnosis",
        title: hasName ? `Here's your diagnosis, ${firstName}!` : "Here's your diagnosis!",
        problemsLabel: "Priority issues",
        planLabel: "7-day action plan",
        dayLabel: "Day",
        ctaPrimary: "I want you to implement this — $29",
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
        ctaPrimary: "Quiero que lo implementen — $29",
        ctaSecondaryTop: "¿Dudas?",
        ctaSecondaryBottom: "Responde este correo",
        footerLine1: "Polaris Local Lift · República Dominicana · hola@polarisweb.studio",
        footerLine2: "Solicitaste este diagnóstico desde nuestro sitio.",
      };

  const problemRows = diagnostic.problems
    .map(
      (p, i) => `
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
      (d) => `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:8px 0;font-family:${FONT_DISPLAY};font-weight:700;font-size:12px;color:${ACCENT};width:60px;border-bottom:1px solid #e2e8f0;">${copy.dayLabel} ${d.day}</td>
        <td style="padding:8px 0;font-size:13px;color:#1f2937;border-bottom:1px solid #e2e8f0;">${d.action}</td>
      </tr>`
    )
    .join("");

  const contactMailto = `mailto:hola@polarisweb.studio?subject=${encodeURIComponent(`Local Lift -- ${place.name}`)}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,500&f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
<style>body{margin:0;}a{text-decoration:none;color:${ACCENT};}</style>
</head>
<body>
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f8fafc;opacity:0;">${copy.preheader}</div>
<div style="width:100%;min-height:100vh;background:#f8fafc;padding:48px 16px;box-sizing:border-box;font-family:${FONT_BODY};">
<div style="width:600px;max-width:100%;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">

  <div style="padding:40px 40px 0 40px;text-align:center;">
    <img src="${LOGO_URL}" alt="Polaris Web Studio" width="140" style="width:140px;height:auto;display:block;margin:0 auto;">
  </div>

  <div style="padding:32px 40px 8px 40px;text-align:center;">
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-bottom:14px;">${copy.eyebrow}</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:30px;line-height:1.2;color:#0f172a;">${copy.title}</div>
    <div style="font-size:14px;color:#64748b;margin-top:8px;">${place.name}${place.address ? ` · ${place.address}` : ""}</div>
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
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:320px;margin:0 auto 16px auto;">
      <tr>
        <td width="33%" style="text-align:left;white-space:nowrap;"><a href="https://www.polarisweb.studio" target="_blank" style="font-size:13px;color:#1f2937;">${lang === "en" ? "Website" : "Sitio web"}</a></td>
        <td width="33%" style="text-align:right;white-space:nowrap;"><a href="mailto:hola@polarisweb.studio" style="font-size:13px;color:#1f2937;">${lang === "en" ? "Contact" : "Contacto"}</a></td>
      </tr>
    </table>
    <div style="font-size:12px;color:#64748b;line-height:1.6;text-align:center;">${copy.footerLine1}<br>${copy.footerLine2}</div>
  </div>

</div>
</div>
</body></html>`;
}

// Aviso interno a Cristian -- misma "Familia A" que buildInternalAlertHtml
// de quote-confirmation-send (Meridian), franja superior de color + tabla
// de datos + CTA de contacto directo con el lead. `diagnostic` es opcional
// a propósito: este aviso sale de inmediato al llegar el lead (la ficha de
// Google ya se validó, pero el diagnóstico con IA todavía no se generó --
// eso se difiere hasta que el cliente pida "Atlas ahora" o hasta el envío
// programado, ver el flujo real en el handler más abajo), así que la
// sección de problemas detectados se omite si todavía no existe.
function buildInternalAlertHtml(diagnostic: Diagnostic | null, place: PlaceData, city: string, contactName: string, email: string): string {
  const row = (label: string, value: string) => `
      <tr style="border-bottom:1px solid #e2e8f0;"><td style="padding:9px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:110px;border-bottom:1px solid #e2e8f0;">${label}</td><td style="padding:9px 0;font-size:13px;font-family:'Courier New',Courier,monospace;color:#0f172a;border-bottom:1px solid #e2e8f0;">${value}</td></tr>`;

  const problemsList = diagnostic
    ? diagnostic.problems
        .map((p, i) => `<div style="font-size:13px;line-height:1.6;color:#1f2937;margin-bottom:6px;"><strong>${i + 1}. ${p.title}</strong><br>${p.why} → ${p.fix}</div>`)
        .join("")
    : `<div style="font-size:13px;color:#94a3b8;">Todavía no se generó -- se genera cuando el cliente pide "Atlas ahora" o con el envío programado (5-10 min).</div>`;

  const mailtoUrl = `mailto:${email}?subject=${encodeURIComponent(`Tu diagnóstico Local Lift de ${place.name}`)}&body=${encodeURIComponent(`Hola ${contactName || ""},\n\nSoy Cristian de Polaris Web Studio, vi tu diagnóstico de Local Lift.`.trim())}`;

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://api.fontshare.com/v2/css?f[]=cabinet-grotesk@700,800,500&f[]=satoshi@400,500,700&display=swap" rel="stylesheet">
<style>body{margin:0;}a{text-decoration:none;color:${ACCENT};}</style>
</head>
<body>
<div style="width:100%;min-height:100vh;background:#f1f5f9;padding:40px 16px;box-sizing:border-box;font-family:${FONT_BODY};">
<div style="width:520px;max-width:100%;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td height="6" style="font-size:0;line-height:0;background:${ACCENT};" bgcolor="${ACCENT}">&nbsp;</td>
  </tr></table>
  <div style="padding:24px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle" style="font-family:${FONT_DISPLAY};font-weight:700;font-size:13px;color:#0f172a;">Local Lift · Alerta interna</td>
      <td valign="middle" align="right" style="font-family:'Courier New',Courier,monospace;font-size:11px;color:#94a3b8;">${place.reviewCount} reseñas</td>
    </tr></table>
  </div>
  <div style="padding:20px 32px 4px 32px;">
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:22px;color:#0f172a;">Nuevo diagnóstico Local Lift</div>
    <div style="font-size:13px;color:#64748b;margin-top:4px;">${place.name}</div>
  </div>
  <div style="padding:20px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
      ${row("Contacto", contactName || "(sin nombre)")}
      ${row("Email", email)}
      ${row("Ciudad", city)}
      ${row("Ficha", place.mapsUri ? `<a href="${place.mapsUri}" target="_blank">Ver en Google Maps</a>` : "no disponible")}
      ${row("Calificación", place.rating !== null ? `${place.rating}/5` : "sin calificación")}
    </table>
  </div>
  <div style="padding:16px 32px 0 32px;">
    <div style="font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Problemas detectados</div>
    ${problemsList}
  </div>
  <div style="padding:24px 32px 32px 32px;text-align:center;">
    <a href="${mailtoUrl}" target="_blank" style="display:inline-block;background:${ACCENT};color:#ffffff;font-family:${FONT_DISPLAY};font-weight:700;font-size:15px;padding:13px 28px;border-radius:8px;">Responder a ${contactName || "el lead"}</a>
  </div>
</div>
</div>
</body>
</html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // "Que Atlas te lo genere al instante": pedido explícito del usuario (16
  // de agosto) -- antes esto solo cambiaba lo que se veía en pantalla, el
  // diagnóstico YA estaba generado (la parte lenta, 30-45s con IA, corría
  // siempre en el submit inicial) y el correo ya se había mandado de una.
  // Ahora la generación real con IA se DIFIERE hasta acá (o hasta el envío
  // programado, ver el job) -- este botón dispara la generación real
  // (findPlace ya se hizo en el submit, rápido; esto es solo la parte
  // lenta) y el envío inmediato del correo, marcando emailSent para que
  // local-lift-diagnostic-mailer.ts no lo vuelva a mandar.
  if (req.body?.action === "reveal-now") {
    const { leadId } = req.body || {};
    if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el lead." });
    const firestore = getFirestore(firebaseApp, "polaris-web-studio");
    const docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
    const doc = await docRef.get();
    if (!doc.exists) return res.status(404).json({ error: "No encontramos ese diagnóstico." });
    let v = doc.data()!;
    const lang2: "es" | "en" = v.lang === "en" ? "en" : "es";

    try {
      let diagnostic: Diagnostic = v.diagnostic;
      if (!diagnostic) {
        diagnostic = await generateDiagnostic(v.placeData, lang2);
        await docRef.update({ diagnostic, status: "diagnostic_sent" });
      }

      if (!v.emailSent) {
        const zohoPassword = process.env.ZOHO_PASSWORD;
        if (!zohoPassword) return res.status(500).json({ error: "ZOHO_PASSWORD no configurado." });
        const transporter = nodemailer.createTransport({
          host: "smtp.zoho.com", port: 465, secure: true,
          auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
        });
        await transporter.sendMail({
          from: '"Polaris Local Lift" <hola@polarisweb.studio>',
          to: v.email,
          subject: lang2 === "en" ? `Your Local Lift diagnosis for ${v.businessName}` : `Tu diagnóstico Local Lift de ${v.businessName}`,
          text: renderDiagnosticText(diagnostic, lang2),
          html: buildDiagnosticHtml(diagnostic, v.placeData, v.contactName, lang2, leadId.trim()),
        });
        await docRef.update({ emailSent: true, emailSentAt: new Date(), emailSentVia: "reveal-now" });
      }

      return res.json({ success: true, diagnostic, place: v.placeData });
    } catch (err: any) {
      console.error("[local-lift-diagnostic] Error en reveal-now:", err);
      return res.status(500).json({ error: "No pudimos generar tu diagnóstico en este momento. Intenta de nuevo en un momento." });
    }
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
    // La búsqueda en Google (findPlace) se queda síncrona acá -- es rápida
    // (~1-2s) y necesaria para poder avisarle YA al cliente si no
    // encontramos su ficha exacta. Lo que se DIFIERE (pedido explícito del
    // usuario, 16 de agosto) es la parte lenta: generar el diagnóstico con
    // IA (30-45s reales) ya no corre acá -- corre recién cuando el cliente
    // pide "Atlas ahora" (action=reveal-now, más arriba) o con el envío
    // programado (local-lift-diagnostic-mailer.ts). Antes esa demora de
    // "5-10 minutos" que mostraba la pantalla era pura ficción: el
    // diagnóstico ya estaba generado y el correo ya había salido en este
    // mismo request, sin importar qué mostrara la UI.
    const candidates = await findPlaceCandidates(businessName.trim(), city.trim());
    if (!candidates.length) {
      return res.status(404).json({
        error:
          language === "en"
            ? "We couldn't find that exact listing on Google. Double-check the business name and city, or share the Google Maps link directly with us on WhatsApp."
            : "No pudimos encontrar esa ficha exacta en Google. Revisa el nombre del negocio y la ciudad, o compártenos el link de Google Maps directo por WhatsApp.",
      });
    }

    // Si hay un solo candidato, el cliente confirma directamente.
    // Si hay varios, el cliente elige en la UI antes de que guardemos.
    // En ambos casos devolvemos el array completo para que la UI decida.
    const place = candidates[0];

    const emailScheduledAt = Date.now() + (5 + Math.random() * 5) * 60 * 1000;

    let leadId: string | null = null;
    try {
      const firestore = getFirestore(firebaseApp, "polaris-web-studio");
      const docRef = await firestore.collection("localLiftDiagnostics").add({
        businessName: place.name,
        city,
        contactName,
        email,
        placeData: place,
        diagnostic: null,
        lang: language,
        source: "free_diagnostic",
        status: "place_found_pending_diagnostic",
        paid: false,
        tier: "impulso",
        emailSent: false,
        emailScheduledAt,
        createdAt: new Date(),
      });
      leadId = docRef.id;
    } catch (dbErr) {
      console.error("[local-lift-diagnostic] Error guardando en Firestore:", dbErr);
    }

    // El aviso INTERNO a Cristian sí sale de inmediato con lo que ya
    // tenemos (la ficha real ya está validada) -- no tiene sentido
    // demorarle a él la notificación de un lead nuevo solo porque el
    // diagnóstico con IA todavía no corrió.
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
          from: '"Local Lift -- Diagnóstico nuevo" <hola@polarisweb.studio>',
          to: "hola@polarisweb.studio",
          replyTo: email,
          subject: `Nuevo diagnóstico Local Lift: ${place.name} (${contactName})`,
          text: `Negocio: ${place.name}\nCiudad: ${city}\nContacto: ${contactName} <${email}>\nFicha: ${place.mapsUri || "no disponible"}\nReseñas: ${place.reviewCount} (${place.rating ?? "s/calificación"})\nCandidatos encontrados: ${candidates.length}\n\n(El diagnóstico con IA todavía no se generó -- se genera cuando el cliente pide "Atlas ahora" o con el envío programado.)`,
          html: buildInternalAlertHtml(null, place, city, contactName, email),
        });
      } catch (mailErr) {
        console.error("[local-lift-diagnostic] Error enviando alerta interna:", mailErr);
      }
    }

    return res.json({ success: true, candidates, place, leadId });
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
