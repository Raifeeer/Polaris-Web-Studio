import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Confirma pagos directos de Local Lift (cliente compra el paquete pago sin
// pasar antes por el diagnóstico gratis, o paga desde el correo de
// propuesta/teaser) y expone una lectura mínima de un lead para prefilar
// /local-lift/pagar/:leadId. Público a propósito -- ambas acciones las
// dispara el navegador del cliente, nunca requieren sesión admin.
//
// La captura real del pago ocurre client-side vía el SDK de PayPal (mismo
// patrón de confianza ya usado en Tano-Excursions/Checkout.tsx: sin
// verificación server-side del order contra la API de PayPal). Este
// endpoint solo registra el resultado que el cliente ya capturó y dispara
// la alerta interna para que el admin genere/revise el paquete.

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });

const TIER_PRICE: Record<string, number> = { "48h": 29, implementado: 99 };
const TIER_LABEL: Record<string, string> = { "48h": "Impulso", implementado: "Ascenso" };

const LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/polaris-logo-badge-v2.png";
const FONT_DISPLAY = "'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif";
const FONT_BODY = "'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif";
const ACCENT = "#4f46e5";

// Confirmación real al CLIENTE de que su pago se recibió -- antes esto no
// existía: solo se mandaba la alerta interna a Cristian, y el cliente solo
// veía un mensaje en pantalla (LocalLiftPay.tsx) que se pierde si cierra la
// pestaña. Mismo template "Familia A" que local-lift-diagnostic.ts.
function buildPaymentConfirmedHtml(businessName: string, tier: string, contactName: string): string {
  const hasName = !!contactName && contactName.trim().length > 0;
  const firstName = hasName ? contactName.trim().split(/\s+/)[0] : "";
  const label = TIER_LABEL[tier] || "Local Lift";
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
<div style="width:100%;min-height:100vh;background:#f8fafc;padding:48px 16px;box-sizing:border-box;font-family:${FONT_BODY};">
<div style="width:600px;max-width:100%;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
  <div style="padding:40px 40px 0 40px;text-align:center;">
    <img src="${LOGO_URL}" alt="Polaris Web Studio" width="140" style="width:140px;height:auto;display:block;margin:0 auto;">
  </div>
  <div style="padding:32px 40px 0 40px;text-align:center;">
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-bottom:14px;">Pago confirmado</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:28px;line-height:1.2;color:#0f172a;">${hasName ? `¡Gracias, ${firstName}!` : "¡Gracias!"}</div>
    <div style="font-size:14px;color:#64748b;margin-top:8px;">${label} para ${businessName}</div>
  </div>
  <div style="padding:20px 40px 0 40px;text-align:center;">
    <p style="font-size:15px;line-height:1.7;color:#1f2937;margin:0;">Recibimos tu pago. Ya estamos preparando el contenido real de tu paquete Local Lift a partir de tu ficha de Google -- lo vas a recibir por este mismo correo en las próximas horas.</p>
  </div>
  <div style="padding:24px 40px 32px 40px;text-align:center;">
    <a href="https://wa.me/18299200544" target="_blank" style="display:inline-block;background:#ffffff;color:#0f172a;border:1px solid #cbd5e1;font-family:${FONT_DISPLAY};font-weight:700;font-size:13px;padding:11px 24px;border-radius:8px;">¿Dudas? Escríbenos por WhatsApp</a>
  </div>
  <div style="padding:0 40px 40px 40px;">
    <div style="height:1px;background:#e2e8f0;margin-bottom:20px;"></div>
    <div style="font-size:12px;color:#64748b;line-height:1.6;text-align:center;">Polaris Local Lift · República Dominicana · hola@polarisweb.studio</div>
  </div>
</div>
</div>
</body></html>`;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST");

  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { action, leadId, businessName, city, contactName, email, tier, paypalOrderId, paypalPayerEmail } = req.body || {};
  const firestore = getFirestore(firebaseApp, "polaris-web-studio");

  try {
    if (action === "lookup") {
      if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el id." });
      const doc = await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get();
      if (!doc.exists) return res.status(404).json({ error: "No encontramos ese enlace de pago." });
      const d = doc.data()!;
      return res.json({
        success: true,
        businessName: d.businessName || "",
        city: d.city || "",
        tier: d.tier || "48h",
        paid: !!d.paid,
      });
    }

    if (action === "confirm") {
      if (!TIER_PRICE[tier]) return res.status(400).json({ error: "Tier inválido." });
      if (typeof paypalOrderId !== "string" || !paypalOrderId.trim()) {
        return res.status(400).json({ error: "Falta la confirmación de pago." });
      }

      let docRef;
      let data: { businessName: string; city: string; contactName: string; email: string };

      if (typeof leadId === "string" && leadId.trim()) {
        docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
        const existing = await docRef.get();
        if (!existing.exists) return res.status(404).json({ error: "Lead no encontrado." });
        const v = existing.data()!;
        data = { businessName: v.businessName, city: v.city, contactName: v.contactName, email: v.email };
        // "awaiting_generation" -- antes se dejaba el status viejo tal cual
        // (ej. "diagnostic_sent"), así que un lead que pagó desde el botón
        // del correo de diagnóstico gratis seguía apareciendo en el panel
        // como si todavía no hubiera pagado nada. Con esto el panel lo
        // muestra de una como "Pagado -- falta generar" (mismo estado que
        // ya usa una compra directa nueva, ver la rama de abajo).
        await docRef.update({
          paid: true,
          tier,
          status: "awaiting_generation",
          paypalOrderId,
          paypalPayerEmail: paypalPayerEmail || null,
          paidAt: new Date(),
        });
      } else {
        if (typeof businessName !== "string" || !businessName.trim()) return res.status(400).json({ error: "Falta el nombre del negocio." });
        if (typeof city !== "string" || !city.trim()) return res.status(400).json({ error: "Falta la ciudad." });
        if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Correo inválido." });
        if (typeof contactName !== "string" || !contactName.trim()) return res.status(400).json({ error: "Falta tu nombre." });
        data = { businessName: businessName.trim(), city: city.trim(), contactName: contactName.trim(), email };
        docRef = await firestore.collection("localLiftDiagnostics").add({
          ...data,
          source: "direct_paid",
          status: "awaiting_generation",
          paid: true,
          tier,
          paypalOrderId,
          paypalPayerEmail: paypalPayerEmail || null,
          paidAt: new Date(),
          createdAt: new Date(),
        });
      }

      const zohoPassword = process.env.ZOHO_PASSWORD;
      if (zohoPassword) {
        const transporter = nodemailer.createTransport({
          host: "smtp.zoho.com", port: 465, secure: true,
          auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
        });
        try {
          await transporter.sendMail({
            from: '"Local Lift -- Pago confirmado" <hola@polarisweb.studio>',
            to: "hola@polarisweb.studio",
            replyTo: data.email,
            subject: `💰 Pago Local Lift confirmado: ${data.businessName} ($${TIER_PRICE[tier]})`,
            text: `Negocio: ${data.businessName}\nCiudad: ${data.city}\nContacto: ${data.contactName} <${data.email}>\nTier: ${tier}\nPayPal Order: ${paypalOrderId}\n\nGenera y envía el paquete completo desde el panel: https://polarisweb.studio/local-lift/panel?lead=${docRef.id}`,
          });
        } catch (mailErr) {
          console.error("[local-lift-order] Error enviando alerta interna:", mailErr);
        }
        try {
          await transporter.sendMail({
            from: '"Polaris Local Lift" <hola@polarisweb.studio>',
            to: data.email,
            subject: `Pago confirmado — ${data.businessName}`,
            text: `Gracias ${data.contactName || ""}. Recibimos tu pago para ${data.businessName}. Ya estamos preparando tu paquete real, lo recibís por este mismo correo en las próximas horas.`,
            html: buildPaymentConfirmedHtml(data.businessName, tier, data.contactName || ""),
          });
        } catch (mailErr) {
          console.error("[local-lift-order] Error enviando confirmación al cliente:", mailErr);
        }
      }

      return res.json({ success: true, leadId: docRef.id });
    }

    return res.status(400).json({ error: "Acción inválida." });
  } catch (error: any) {
    console.error("[local-lift-order] Error:", error);
    return res.status(500).json({ error: "No pudimos confirmar el pago. Escríbenos por WhatsApp." });
  }
}
