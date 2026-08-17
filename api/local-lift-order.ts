import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { buildEmailFooter } from "./_localLift.js";

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

const TIER_PRICE: Record<string, number> = { "impulso": 29, "ascenso": 99 };
const TIER_LABEL: Record<string, string> = { "impulso": "Impulso", "ascenso": "Ascenso" };

const LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/local-lift-logo-v5.png";
const FONT_DISPLAY = "'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif";
const FONT_BODY = "'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif";
const ACCENT = "#16C8C1"; // teal, color primario real de Local Lift (palabra "LIFT" del logo)

// Confirmación real al CLIENTE de que su pago se recibió -- antes esto no
// existía: solo se mandaba la alerta interna a Cristian, y el cliente solo
// veía un mensaje en pantalla (LocalLiftPay.tsx) que se pierde si cierra la
// pestaña. Mismo template "Familia A" que local-lift-diagnostic.ts.
function buildPaymentConfirmedHtml(businessName: string, tier: string, contactName: string, invoiceNumber?: string, hasInvoicePdf?: boolean): string {
  const hasName = !!contactName && contactName.trim().length > 0;
  const firstName = hasName ? contactName.trim().split(/\s+/)[0] : "";
  const label = TIER_LABEL[tier] || "Local Lift";
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
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-bottom:14px;">Pago confirmado</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:28px;line-height:1.2;color:#0f172a;">${hasName ? `¡Gracias, ${firstName}!` : "¡Gracias!"}</div>
    <div style="font-size:14px;color:#64748b;margin-top:8px;">${label} para ${businessName}</div>
  </div>
  <div style="padding:20px 40px 0 40px;text-align:center;">
    <p style="font-size:15px;line-height:1.7;color:#1f2937;margin:0;">Recibimos tu pago. Ya estamos preparando el contenido real de tu paquete Local Lift a partir de tu ficha de Google — lo vas a recibir por este mismo correo en las próximas horas.</p>
  </div>
  ${hasInvoicePdf && invoiceNumber ? `<div style="padding:20px 40px 0 40px;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;text-align:center;">
      <div style="font-size:13px;color:#1f2937;line-height:1.6;">Adjuntamos tu factura <strong>N° ${invoiceNumber}</strong> en PDF. También queda disponible en tu portal cuando la necesites.</div>
    </div>
  </div>` : ""}
  <div style="padding:24px 40px 32px 40px;text-align:center;">
    <a href="https://wa.me/18299200544" target="_blank" style="display:inline-block;background:#ffffff;color:#0f172a;border:1px solid #cbd5e1;font-family:${FONT_DISPLAY};font-weight:700;font-size:13px;padding:11px 24px;border-radius:8px;">¿Dudas? Escríbenos por WhatsApp</a>
  </div>
  <div style="padding:0 40px 40px 40px;">
    <div style="height:1px;background:#e2e8f0;margin-bottom:20px;"></div>
    ${buildEmailFooter("es", "Recibiste este correo porque compraste un paquete Local Lift.")}
  </div>
</div>
</div>
</body></html>`;
}

const INVOICE_PDF_URL = "https://invoice-pdf-wdvfac6mgq-ue.a.run.app";

// Pide la factura en PDF a la Cloud Function que también usa el portal para
// la descarga -- una sola plantilla, en vez de duplicar el generador de
// jsPDF que vive en ClientDashboard.tsx (y que no corre en Node de todos
// modos, usa DOMParser).
async function fetchInvoicePdf(params: {
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  description: string;
  amount: number;
  paypalOrderId: string;
  exchangeRate?: number;
}): Promise<Buffer | null> {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return null;
  const resp = await fetch(INVOICE_PDF_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${cronSecret}` },
    body: JSON.stringify({
      lang: "es",
      invoiceNumber: params.invoiceNumber,
      status: "paid",
      date: new Date().toISOString(),
      clientName: params.clientName,
      clientEmail: params.clientEmail,
      projectName: params.description,
      description: params.description,
      amount: params.amount,
      paymentLabel: "PayPal",
      paymentDetail: `Ref: ${params.paypalOrderId}`,
      exchangeRate: params.exchangeRate,
    }),
  });
  if (!resp.ok) throw new Error(`invoice-pdf ${resp.status}`);
  return Buffer.from(await resp.arrayBuffer());
}

// Bienvenida al portal, con las credenciales reales. Va como correo APARTE
// del de confirmación de pago (pedido explícito del usuario): son dos cosas
// distintas y mezclarlas en un solo correo hacía que la contraseña se
// perdiera entre el resto del texto.
function buildPortalWelcomeHtml(businessName: string, contactName: string, email: string, tempPassword: string): string {
  const firstName = contactName.trim() ? contactName.trim().split(/\s+/)[0] : "";
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
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
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:13px;letter-spacing:2px;text-transform:uppercase;color:${ACCENT};margin-bottom:14px;">Tu portal de cliente</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:28px;line-height:1.2;color:#0f172a;">${firstName ? `Bienvenido, ${firstName}` : "Bienvenido"}</div>
    <div style="font-size:14px;color:#64748b;margin-top:8px;">${businessName}</div>
  </div>
  <div style="padding:20px 40px 0 40px;text-align:center;">
    <p style="font-size:15px;line-height:1.7;color:#1f2937;margin:0;">Desde tu portal puedes seguir el avance de tu paquete Local Lift y descargar tu factura cuando la necesites.</p>
  </div>
  <div style="padding:24px 40px 0 40px;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:20px;">
      <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;">Correo</div>
      <div style="font-family:${FONT_DISPLAY};font-weight:700;font-size:15px;color:#0f172a;margin-top:4px;">${email}</div>
      <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#64748b;margin-top:16px;">Contraseña temporal</div>
      <div style="font-family:${FONT_DISPLAY};font-weight:700;font-size:15px;color:#0f172a;margin-top:4px;letter-spacing:1px;">${tempPassword}</div>
      <div style="font-size:12px;color:#64748b;margin-top:14px;line-height:1.5;">Por seguridad, te vamos a pedir que la cambies la primera vez que entres.</div>
    </div>
  </div>
  <div style="padding:24px 40px 32px 40px;text-align:center;">
    <a href="https://polarisweb.studio/login" target="_blank" style="display:inline-block;background:${ACCENT};color:#ffffff;font-family:${FONT_DISPLAY};font-weight:700;font-size:14px;padding:13px 32px;border-radius:8px;">Entrar a mi portal</a>
  </div>
  <div style="padding:0 40px 40px 40px;">
    <div style="height:1px;background:#e2e8f0;margin-bottom:20px;"></div>
    ${buildEmailFooter("es", "Recibiste este correo porque se creó tu cuenta del portal de Polaris.")}
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
      const place = d.place || null;
      return res.json({
        success: true,
        businessName: d.businessName || "",
        city: d.city || "",
        tier: d.tier || "impulso",
        paid: !!d.paid,
        address: place?.address || null,
        rating: place?.rating ?? null,
        reviewCount: place?.reviewCount ?? null,
        primaryType: place?.primaryType || null,
        mapsUri: place?.mapsUri || null,
        invoiceNumber: d.invoiceNumber || null,
        portalProvisioned: !!d.portalProvisioned,
      });
    }

    // Descarga de la factura desde la pantalla de pago confirmado, sin
    // sesión. El leadId (id autogenerado de Firestore, no adivinable) hace de
    // credencial implícita -- mismo modelo de confianza que ya usa "lookup",
    // que devuelve nombre, dirección y calificación del negocio. Solo sirve
    // para leads realmente pagados y con factura ya emitida.
    if (action === "invoice") {
      if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el id." });
      const doc = await firestore.collection("localLiftDiagnostics").doc(leadId.trim()).get();
      if (!doc.exists) return res.status(404).json({ error: "No encontramos esa factura." });
      const d = doc.data()!;
      if (!d.paid || !d.invoiceNumber) return res.status(404).json({ error: "Todavía no hay una factura emitida." });

      const pdf = await fetchInvoicePdf({
        invoiceNumber: d.invoiceNumber,
        clientName: d.contactName || d.businessName || "",
        clientEmail: d.email || "",
        description: `Local Lift — ${TIER_LABEL[d.tier] || "Local Lift"} — ${d.businessName || ""}`,
        amount: TIER_PRICE[d.tier] || 0,
        paypalOrderId: d.paypalOrderId || "",
        // La tasa del día en que se emitió, no la de hoy: si no, una factura
        // vieja se descargaría con un monto en pesos distinto al original.
        exchangeRate: typeof d.exchangeRate === "number" ? d.exchangeRate : undefined,
      });
      if (!pdf) return res.status(500).json({ error: "No pudimos generar la factura." });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Factura-${String(d.invoiceNumber).replace(/[^A-Za-z0-9-]/g, "")}.pdf"`);
      return res.status(200).send(pdf);
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

      // Auto-provisionar la cuenta del portal ANTES de mandar los correos --
      // el correo de bienvenida necesita la contraseña temporal real, y el de
      // confirmación de pago necesita el número de factura para adjuntarla.
      // Antes esto corría después y en fire-and-forget, así que el cliente
      // recibía una cuenta cuya contraseña nunca se le decía.
      let portalProvisioned = false;
      let tempPassword = "";
      let invoiceNumber = "";
      let exchangeRate: number | undefined;
      try {
        const portalUrl = process.env.PORTAL_BASE_URL || "https://polarisweb.studio";
        const cronSecret = process.env.CRON_SECRET;
        if (cronSecret && data.email) {
          const provRes = await fetch(`${portalUrl}/api/portal/auto-provision-client`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-cron-secret": cronSecret },
            body: JSON.stringify({
              email: data.email,
              name: data.contactName || data.businessName,
              projectName: data.businessName,
              productType: "local_lift",
              paidAmount: TIER_PRICE[tier],
              tierLabel: TIER_LABEL[tier],
              paypalOrderId,
              language: "es",
            }),
          });
          const prov = await provRes.json().catch(() => null);
          if (provRes.ok && prov?.success) {
            portalProvisioned = true;
            tempPassword = prov.tempPassword || "";
            invoiceNumber = prov.invoiceNumber || "";
            exchangeRate = typeof prov.exchangeRate === "number" ? prov.exchangeRate : undefined;
          } else if (prov?.alreadyExists) {
            // Cliente que ya tenía portal (compró antes): no se le manda
            // bienvenida ni contraseña nueva, su cuenta sigue siendo la misma.
            portalProvisioned = true;
          }
        }
      } catch (provErr) {
        console.error("[local-lift-order] Error auto-provisioning portal:", provErr);
      }

      // Guardado en el lead para que /local-lift/pagar/:leadId pueda ofrecer
      // la descarga de la factura después, sin sesión (ver action "invoice").
      if (invoiceNumber || portalProvisioned) {
        try {
          await docRef.update({
            ...(invoiceNumber ? { invoiceNumber } : {}),
            ...(exchangeRate ? { exchangeRate } : {}),
            portalProvisioned,
          });
        } catch (updErr) {
          console.error("[local-lift-order] Error guardando datos de portal en el lead:", updErr);
        }
      }

      // Factura en PDF real, generada server-side por la misma Cloud Function
      // que usa el portal para descargarla (una sola plantilla, ver
      // cloud-functions/invoice-pdf en Meridian). Si falla, el correo sale
      // igual sin adjunto -- nunca se bloquea la confirmación de un pago real.
      let invoicePdf: Buffer | null = null;
      if (invoiceNumber) {
        try {
          invoicePdf = await fetchInvoicePdf({
            invoiceNumber,
            clientName: data.contactName || data.businessName,
            clientEmail: data.email,
            description: `Local Lift — ${TIER_LABEL[tier]} — ${data.businessName}`,
            amount: TIER_PRICE[tier],
            paypalOrderId,
            exchangeRate,
          });
        } catch (pdfErr) {
          console.error("[local-lift-order] Error generando PDF de factura:", pdfErr);
        }
      }

      const zohoPassword = process.env.ZOHO_PASSWORD;
      if (zohoPassword) {
        const transporter = nodemailer.createTransport({
          host: "smtp.zoho.com", port: 465, secure: true,
          auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
        });
        try {
          await transporter.sendMail({
            from: '"Local Lift — Pago confirmado" <hola@polarisweb.studio>',
            to: "hola@polarisweb.studio",
            replyTo: data.email,
            subject: `💰 Pago Local Lift confirmado: ${data.businessName} ($${TIER_PRICE[tier]})`,
            text: `Negocio: ${data.businessName}\nCiudad: ${data.city}\nContacto: ${data.contactName} <${data.email}>\nTier: ${tier}\nPayPal Order: ${paypalOrderId}\n\nGenera y envía el paquete completo desde el panel: https://polarisweb.studio/local-lift/panel?lead=${docRef.id}`,
          });
        } catch (mailErr) {
          console.error("[local-lift-order] Error enviando alerta interna:", mailErr);
        }
        // 1/2 -- Confirmación de pago, con la factura real adjunta.
        try {
          await transporter.sendMail({
            from: '"Polaris Local Lift" <hola@polarisweb.studio>',
            to: data.email,
            subject: `Pago confirmado — ${data.businessName}`,
            text: `Gracias ${data.contactName || ""}. Recibimos tu pago para ${data.businessName}. Ya estamos preparando tu paquete real, lo recibirás por este mismo correo en las próximas horas.`,
            html: buildPaymentConfirmedHtml(data.businessName, tier, data.contactName || "", invoiceNumber, !!invoicePdf),
            ...(invoicePdf
              ? { attachments: [{ filename: `Factura-${invoiceNumber}.pdf`, content: invoicePdf, contentType: "application/pdf" }] }
              : {}),
          });
        } catch (mailErr) {
          console.error("[local-lift-order] Error enviando confirmación al cliente:", mailErr);
        }

        // 2/2 -- Bienvenida al portal con credenciales. Solo si se acaba de
        // crear la cuenta: un cliente que ya tenía portal conserva su propia
        // contraseña y no debe recibir una temporal nueva.
        if (tempPassword) {
          try {
            await transporter.sendMail({
              from: '"Polaris Web Studio" <hola@polarisweb.studio>',
              to: data.email,
              subject: `Tu acceso al portal — ${data.businessName}`,
              text: `Bienvenido. Entra a https://polarisweb.studio/login con tu correo ${data.email} y la contraseña temporal ${tempPassword}. Te pediremos cambiarla la primera vez.`,
              html: buildPortalWelcomeHtml(data.businessName, data.contactName || "", data.email, tempPassword),
            });
          } catch (mailErr) {
            console.error("[local-lift-order] Error enviando bienvenida al portal:", mailErr);
          }
        }
      }

      return res.json({ success: true, leadId: docRef.id, portalProvisioned });
    }

    return res.status(400).json({ error: "Acción inválida." });
  } catch (error: any) {
    console.error("[local-lift-order] Error:", error);
    return res.status(500).json({ error: "No pudimos confirmar el pago. Escríbenos por WhatsApp." });
  }
}
