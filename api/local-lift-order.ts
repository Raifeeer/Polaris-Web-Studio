import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { getStorage } from "firebase-admin/storage";
import { buildEmailFooter } from "./_localLift.js";
import { paypalCaptureId, paypalCaptureOrder, paypalCreateOrder, paypalGetOrder, paypalOrderAmount, paypalPayerEmail as getPayPalPayerEmail, paypalReferenceId, paypalRefundCapture } from "./_paypal.js";

// Confirma pagos directos de Local Lift (cliente compra el paquete pago sin
// pasar antes por el diagnóstico gratis, o paga desde el correo de
// propuesta/teaser) y expone una lectura mínima de un lead para prefilar
// /local-lift/pagar/:leadId. Público a propósito -- ambas acciones las
// dispara el navegador del cliente, nunca requieren sesión admin.
//
// La orden se crea y se captura a través de PayPal server-side. El navegador
// solo solicita la orden y notifica la aprobación; este endpoint verifica el
// estado, monto, moneda y referencia antes de confirmar el lead. Firestore
// funciona como candado idempotente para que dos pestañas no puedan confirmar
// dos pagos ni repetir los efectos secundarios del primer pago.

const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`,
    });

const TIER_PRICE: Record<string, number> = { "impulso": 29, "ascenso": 99 };
const TIER_LABEL: Record<string, string> = { "impulso": "Impulso", "ascenso": "Ascenso" };
const LOCAL_LIFT_CHECKOUT_TERMS_VERSION = "local-lift-2026-08-20";

const LOGO_URL = "https://storage.googleapis.com/gen-lang-client-0746441136.firebasestorage.app/email-assets/local-lift-logo-v7.png";
const FONT_DISPLAY = "'Cabinet Grotesk','Century Gothic','Futura',Avenir,'Helvetica Neue',Arial,sans-serif";
const FONT_BODY = "'Satoshi','Helvetica Neue',Helvetica,Arial,sans-serif";
const ACCENT = "#16C8C1"; // teal, color primario real de Local Lift (palabra "LIFT" del logo)
const INVOICE_STORAGE_BUCKET = process.env.FIREBASE_STORAGE_BUCKET || process.env.GCLOUD_STORAGE_BUCKET || `${process.env.FIREBASE_PROJECT_ID}.firebasestorage.app`;

async function saveInvoicePdfToStorage(leadId: string, buffer: Buffer): Promise<string> {
  const objectPath = `local-lift-invoices/${leadId.trim()}.pdf`;
  const file = getStorage(firebaseApp).bucket(INVOICE_STORAGE_BUCKET).file(objectPath);
  await file.save(buffer, { resumable: false, contentType: "application/pdf", metadata: { cacheControl: "private, max-age=0, no-store" } });
  return objectPath;
}

async function readInvoicePdfFromStorage(objectPath: string): Promise<Buffer> {
  const [buffer] = await getStorage(firebaseApp).bucket(INVOICE_STORAGE_BUCKET).file(objectPath).download();
  return buffer;
}

type LocalLiftTier = "impulso" | "ascenso";
function isLocalLiftTier(value: unknown): value is LocalLiftTier {
  return value === "impulso" || value === "ascenso";
}

function pendingOrderIsFresh(value: unknown, maxAgeMs = 15 * 60 * 1000): boolean {
  const millis = typeof (value as any)?.toMillis === "function" ? (value as any).toMillis() : new Date(String(value || "")).getTime();
  return Number.isFinite(millis) && Date.now() - millis < maxAgeMs;
}

function paymentAlreadyCompletedResponse(res: VercelResponse, leadId: string) {
  return res.status(409).json({ success: false, alreadyPaid: true, reason: "already_paid", leadId });
}

async function refundCompletedOrderIfNeeded(orderId: string, expectedReference: string, submittedPayerEmail?: string | null): Promise<boolean> {
  const order = await paypalGetOrder(orderId).catch(() => null);
  if (order?.status !== "COMPLETED") return false;
  const reference = paypalReferenceId(order);
  const orderPayerEmail = getPayPalPayerEmail(order);
  const legacyMatches = !reference && !!submittedPayerEmail && !!orderPayerEmail && orderPayerEmail === submittedPayerEmail.trim().toLowerCase();
  if ((reference && reference !== expectedReference) || (!reference && !legacyMatches)) return false;
  const captureId = paypalCaptureId(order);
  if (!captureId) return false;
  await paypalRefundCapture(captureId);
  return true;
}

// Confirmación real al CLIENTE de que su pago se recibió. Antes usaba el
// mismo template "Familia A" (logo grande centrado) que el diagnóstico y la
// bienvenida al portal -- pedido explícito del usuario: que este correo se
// vea distinto a esos, siguiendo en cambio la "Familia de facturas" real de
// Polaris (ver invoice-notify-send en Meridian -- franja de color arriba,
// logo chico + fecha en la misma fila, tabla de detalle del pago). Mismo
// esqueleto, colores de Local Lift.
function buildPaymentConfirmedHtml(params: {
  businessName: string;
  city: string;
  tier: string;
  contactName: string;
  amount: number;
  paypalOrderId: string;
  paypalPayerEmail: string;
  paidAt: Date;
  invoiceNumber?: string;
  hasInvoicePdf?: boolean;
  sentPortalWelcomeEmail?: boolean;
}): string {
  const { businessName, city, tier, contactName, amount, paypalOrderId, paypalPayerEmail, paidAt, invoiceNumber, hasInvoicePdf, sentPortalWelcomeEmail } = params;
  const hasName = !!contactName && contactName.trim().length > 0;
  const firstName = hasName ? contactName.trim().split(/\s+/)[0] : "";
  const label = TIER_LABEL[tier] || "Local Lift";
  const dateLabel = paidAt.toLocaleDateString("es-DO", { year: "numeric", month: "long", day: "numeric" });

  const row = (label: string, value: string, strong?: boolean) => `
    <tr><td style="padding:10px 0;font-size:11px;color:#94a3b8;text-transform:uppercase;letter-spacing:0.5px;width:130px;border-bottom:1px solid #e2e8f0;">${label}</td><td style="padding:10px 0;text-align:right;font-size:${strong ? "16px" : "13px"};font-family:'Courier New',Courier,monospace;color:${strong ? "#16a34a" : "#0f172a"};font-weight:700;border-bottom:1px solid #e2e8f0;">${value}</td></tr>`;

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
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:#f8fafc;opacity:0;">Confirmamos tu pago de $${amount} para ${businessName}. Esto es lo que sigue.</div>
<div style="width:100%;min-height:100vh;background:#f8fafc;padding:48px 16px;box-sizing:border-box;font-family:${FONT_BODY};">
<div style="width:600px;max-width:100%;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
    <td height="6" style="font-size:0;line-height:0;background:#16a34a;" bgcolor="#16a34a">&nbsp;</td>
  </tr></table>

  <div style="padding:28px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
      <td valign="middle"><img src="${LOGO_URL}" alt="Local Lift by Polaris Web Studio" width="48" style="width:48px;height:auto;display:block;border-radius:10px;"></td>
      <td valign="middle" align="right" style="font-family:'Courier New',Courier,monospace;font-size:11px;letter-spacing:0.5px;color:#94a3b8;">Pagado el: ${dateLabel}</td>
    </tr></table>
  </div>

  <div style="padding:20px 32px 0 32px;">
    <div style="font-family:${FONT_DISPLAY};font-weight:500;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#16a34a;margin-bottom:8px;">Pago confirmado</div>
    <div style="font-family:${FONT_DISPLAY};font-weight:800;font-size:24px;line-height:1.25;color:#0f172a;">${hasName ? `¡Gracias, ${firstName}!` : "¡Gracias!"}</div>
  </div>

  <div style="padding:12px 32px 0 32px;">
    <p style="font-size:14px;line-height:1.6;color:#475569;margin:0;">${
        tier === "ascenso"
        ? `Recibimos y confirmamos tu pago. Ya comenzamos a preparar tu paquete Ascenso y te avisaremos cuando esté listo para revisarlo en el portal. La entrega preparada se estima dentro de cinco horas corridas desde el pago. Incluye una lectura de hasta cinco reseñas recientes disponibles, buenas prácticas personalizadas, guía paso a paso y hasta tres rondas agrupadas de revisión.${sentPortalWelcomeEmail ? " Te enviamos por separado las credenciales de acceso a ese portal, pero no necesitas entrar para que comencemos." : ""}`
        : `Recibimos y confirmamos tu pago. Ya comenzamos a preparar tu paquete Impulso y lo recibirás por correo dentro de las próximas dos horas. Tu portal queda disponible para consultar el avance y la factura cuando quieras.${sentPortalWelcomeEmail ? " Te enviamos por separado las credenciales de acceso a tu portal, pero no necesitas entrar para que comencemos." : ""}`
    }</p>
  </div>

  <div style="padding:24px 32px 0 32px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e2e8f0;">
      ${row("Negocio", businessName)}
      ${row("Ciudad", city || "N/D")}
      ${row("Paquete", label)}
      ${row("Monto", `$${amount.toFixed(2)}`, true)}
      ${row("N.° de pago Polaris", invoiceNumber || "N/D")}
      ${row("Referencia PayPal", paypalOrderId || "N/D")}
      ${paypalPayerEmail ? row("Correo del pagador", paypalPayerEmail) : ""}
    </table>
  </div>

  ${hasInvoicePdf && invoiceNumber ? `<div style="padding:20px 32px 0 32px;">
    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;text-align:center;">
      <div style="font-size:13px;color:#1f2937;line-height:1.6;">Adjuntamos tu factura <strong>N° ${invoiceNumber}</strong> en PDF. También queda disponible en tu portal cuando la necesites.</div>
    </div>
  </div>` : ""}

  <div style="padding:32px 40px 0 40px;">
    <div style="height:1px;background:#e2e8f0;"></div>
  </div>

  <div style="padding:24px 40px 40px 40px;">
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

  const { action, leadId, businessName, city, contactName, email, tier, paypalOrderId, paypalPayerEmail, termsAccepted, termsVersion } = req.body || {};
  const firestore = getFirestore(firebaseApp, "polaris-web-studio");

  try {
    if (action === "create-order") {
      if (typeof leadId !== "string" || !leadId.trim()) return res.status(400).json({ error: "Falta el id." });
      if (!isLocalLiftTier(tier)) return res.status(400).json({ error: "Tier inválido." });
      const docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
      let reusableOrderId: string | null = null;
      let creatingInProgress = false;
      let alreadyPaid = false;
      let canCreate = false;
      await firestore.runTransaction(async (transaction) => {
        const currentSnapshot = await transaction.get(docRef);
        if (!currentSnapshot.exists) throw new Error("Lead no encontrado.");
        const current = currentSnapshot.data() || {};
        if (current.paid) {
          alreadyPaid = true;
          return;
        }
        if (typeof current.paypalOrderId === "string" && pendingOrderIsFresh(current.paypalOrderCreatedAt)) {
          if (current.paypalPendingTier === tier) reusableOrderId = current.paypalOrderId;
          else creatingInProgress = true;
          return;
        }
        if (pendingOrderIsFresh(current.paypalOrderCreatingAt, 2 * 60 * 1000)) {
          creatingInProgress = true;
          return;
        }
        transaction.update(docRef, {
          paypalPendingTier: tier,
          paypalOrderCreatingAt: new Date(),
        });
        canCreate = true;
      });
      if (alreadyPaid) return paymentAlreadyCompletedResponse(res, docRef.id);
      if (reusableOrderId) return res.json({ success: true, orderId: reusableOrderId, reused: true });
      if (creatingInProgress || !canCreate) return res.status(409).json({ success: false, reason: "order_in_progress" });

      try {
        const current = (await docRef.get()).data() || {};
        const order = await paypalCreateOrder({
          amount: TIER_PRICE[tier],
          referenceId: `local-lift:${docRef.id}`,
          description: `Polaris Local Lift — ${TIER_LABEL[tier]} — ${String(current.businessName || "Local Lift")}`,
        });
        await docRef.update({
          paypalOrderId: order.id,
          paypalPendingTier: tier,
          paypalOrderCreatedAt: new Date(),
          paypalOrderCreatingAt: null,
        });
        return res.json({ success: true, orderId: order.id, reused: false });
      } catch (error) {
        await docRef.update({ paypalOrderCreatingAt: null }).catch(() => undefined);
        throw error;
      }
    }

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
        sentPortalWelcomeEmail: !!d.sentPortalWelcomeEmail,
        // Detalle real del pago -- para que la pantalla de confirmación
        // (LocalLiftPay.tsx) pueda mostrar más que un mensaje genérico:
        // referencia real de PayPal, correo del pagador y fecha real.
        paypalOrderId: d.paypalOrderId || null,
        paypalPayerEmail: d.paypalPayerEmail || null,
        paidAt: d.paidAt?.toDate?.()?.toISOString?.() || null,
        contactName: d.contactName || "",
        email: d.email || "",
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

      let pdf: Buffer | null = null;
      if (typeof d.invoicePdfStoragePath === "string" && d.invoicePdfStoragePath) {
        pdf = await readInvoicePdfFromStorage(d.invoicePdfStoragePath).catch(() => null);
      }
      if (!pdf) {
        pdf = await fetchInvoicePdf({
          invoiceNumber: d.invoiceNumber,
          clientName: d.contactName || d.businessName || "",
          clientEmail: d.email || "",
          description: `Local Lift: ${TIER_LABEL[d.tier] || "Local Lift"}, ${d.businessName || ""}`,
          amount: TIER_PRICE[d.tier] || 0,
          paypalOrderId: d.paypalOrderId || "",
          // La tasa del día en que se emitió, no la de hoy: si no, una factura
          // vieja se descargaría con un monto en pesos distinto al original.
          exchangeRate: typeof d.exchangeRate === "number" ? d.exchangeRate : undefined,
        });
        if (pdf) {
          const storagePath = await saveInvoicePdfToStorage(leadId.trim(), pdf).catch(() => null);
          if (storagePath) await doc.ref.update({ invoicePdfStoragePath: storagePath }).catch(() => undefined);
        }
      }
      if (!pdf) return res.status(500).json({ error: "No pudimos generar la factura." });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="Factura-${String(d.invoiceNumber).replace(/[^A-Za-z0-9-]/g, "")}.pdf"`);
      return res.status(200).send(pdf);
    }

    if (action === "confirm") {
      if (!isLocalLiftTier(tier)) return res.status(400).json({ error: "Tier inválido." });
      if (termsAccepted !== true || termsVersion !== LOCAL_LIFT_CHECKOUT_TERMS_VERSION) {
        return res.status(400).json({ error: "service_terms_required", message: "Debes aceptar las condiciones del servicio antes de pagar." });
      }
      if (typeof paypalOrderId !== "string" || !paypalOrderId.trim()) {
        return res.status(400).json({ error: "Falta la confirmación de pago." });
      }
      if (typeof leadId !== "string" || !leadId.trim()) {
        return res.status(400).json({ error: "Falta el lead del checkout." });
      }

      const docRef = firestore.collection("localLiftDiagnostics").doc(leadId.trim());
      const existing = await docRef.get();
      if (!existing.exists) return res.status(404).json({ error: "Lead no encontrado." });
      const initial = existing.data() || {};
      if (initial.paid) {
        if (initial.paypalOrderId !== paypalOrderId) {
          await refundCompletedOrderIfNeeded(paypalOrderId, `local-lift:${docRef.id}`, paypalPayerEmail).catch((refundError) => console.error("[local-lift-order] No se pudo compensar una captura duplicada:", refundError));
        }
        return paymentAlreadyCompletedResponse(res, docRef.id);
      }

      const expectedAmount = TIER_PRICE[tier];
      const expectedReference = `local-lift:${docRef.id}`;
      const submittedPayerEmail = typeof paypalPayerEmail === "string" && paypalPayerEmail.trim() ? paypalPayerEmail.trim().toLowerCase() : null;
      const orderBeforeCapture = await paypalGetOrder(paypalOrderId);
      const orderReference = paypalReferenceId(orderBeforeCapture);
      const isLegacyOrder = !orderReference;
      if (!isLegacyOrder && orderReference !== expectedReference) {
        return res.status(400).json({ error: "La orden de PayPal no pertenece a este checkout." });
      }
      if (isLegacyOrder) {
        const orderPayerEmail = getPayPalPayerEmail(orderBeforeCapture);
        if (orderBeforeCapture.status !== "COMPLETED" || !submittedPayerEmail || !orderPayerEmail || orderPayerEmail !== submittedPayerEmail) {
          return res.status(400).json({ error: "No pudimos verificar esta orden antigua de PayPal. Recarga el checkout e inténtalo de nuevo." });
        }
      }
      const orderAmount = paypalOrderAmount(orderBeforeCapture);
      if (!orderAmount || orderAmount.currency !== "USD" || Math.abs(orderAmount.value - expectedAmount) > 0.01) {
        return res.status(402).json({ error: "El monto de PayPal no coincide con el paquete seleccionado." });
      }

      let captureAlreadyPaid = false;
      let duplicateCaptureBlocked = false;
      let captureInProgress = false;
      let captureClaimed = false;
      await firestore.runTransaction(async (transaction) => {
        const latest = await transaction.get(docRef);
        if (!latest.exists) throw new Error("Lead no encontrado.");
        const v = latest.data() || {};
        if (v.paid) {
          captureAlreadyPaid = true;
          duplicateCaptureBlocked = v.paypalOrderId !== paypalOrderId;
          return;
        }
        if (v.paypalOrderId && v.paypalOrderId !== paypalOrderId) {
          captureInProgress = true;
          duplicateCaptureBlocked = true;
          return;
        }
        if (v.paypalCaptureInProgress && pendingOrderIsFresh(v.paypalCaptureStartedAt, 2 * 60 * 1000)) {
          captureInProgress = true;
          return;
        }
        transaction.update(docRef, {
          paypalOrderId,
          paypalPendingTier: tier,
          paypalCaptureInProgress: true,
          paypalCaptureStartedAt: new Date(),
        });
        captureClaimed = true;
      });
      if (captureAlreadyPaid) {
        if (duplicateCaptureBlocked) {
          await refundCompletedOrderIfNeeded(paypalOrderId, `local-lift:${docRef.id}`, paypalPayerEmail).catch((refundError) => console.error("[local-lift-order] No se pudo compensar una captura duplicada:", refundError));
        }
        return paymentAlreadyCompletedResponse(res, docRef.id);
      }
      if (captureInProgress || !captureClaimed) {
        if (duplicateCaptureBlocked) {
          await refundCompletedOrderIfNeeded(paypalOrderId, `local-lift:${docRef.id}`, paypalPayerEmail).catch((refundError) => console.error("[local-lift-order] No se pudo compensar una captura duplicada:", refundError));
        }
        return res.status(409).json({ success: false, reason: "payment_in_progress" });
      }

      let capture: any;
      try {
        capture = orderBeforeCapture.status === "COMPLETED"
          ? orderBeforeCapture
          : await paypalCaptureOrder(paypalOrderId);
      } catch (captureError) {
        // Si dos callbacks alcanzan PayPal a la vez, el segundo puede recibir
        // un error aunque la primera captura ya haya terminado. Releer la
        // orden convierte ese caso en un retry idempotente.
        const recovered = await paypalGetOrder(paypalOrderId).catch(() => null);
        if (recovered?.status === "COMPLETED") capture = recovered;
        else {
          await docRef.update({ paypalCaptureInProgress: null, paypalCaptureStartedAt: null }).catch(() => undefined);
          throw captureError;
        }
      }
      const captureAmount = paypalOrderAmount(capture);
      const captureId = paypalCaptureId(capture);
      if (capture.status !== "COMPLETED" || !captureId || !captureAmount || captureAmount.currency !== "USD" || Math.abs(captureAmount.value - expectedAmount) > 0.01) {
        await docRef.update({ paypalCaptureInProgress: null, paypalCaptureStartedAt: null }).catch(() => undefined);
        return res.status(402).json({ error: "El pago no se completó o el monto no coincide." });
      }
      if (!isLegacyOrder && paypalReferenceId(capture) !== expectedReference) {
        await docRef.update({ paypalCaptureInProgress: null, paypalCaptureStartedAt: null }).catch(() => undefined);
        return res.status(400).json({ error: "La captura de PayPal no pertenece a este checkout." });
      }

      let data: { businessName: string; city: string; contactName: string; email: string };
      let paymentClaimed = false;
      let paymentAlreadyPaid = false;
      let paymentAlreadyPaidOrderId = "";
      const payerEmail = getPayPalPayerEmail(capture) || getPayPalPayerEmail(orderBeforeCapture) || submittedPayerEmail || null;
      await firestore.runTransaction(async (transaction) => {
        const latest = await transaction.get(docRef);
        if (!latest.exists) throw new Error("Lead no encontrado.");
        const v = latest.data() || {};
        if (v.paid) {
          paymentAlreadyPaid = true;
          paymentAlreadyPaidOrderId = String(v.paypalOrderId || "");
          return;
        }
        data = { businessName: String(v.businessName || ""), city: String(v.city || ""), contactName: String(v.contactName || ""), email: String(v.email || "") };
        transaction.update(docRef, {
          paid: true,
          tier,
          status: "awaiting_generation",
          paypalOrderId,
          paypalCaptureId: captureId,
          paypalPayerEmail: payerEmail,
          paidAt: new Date(),
          paypalPendingTier: null,
          paypalOrderCreatedAt: null,
          paypalOrderCreatingAt: null,
          paypalCaptureInProgress: null,
          paypalCaptureStartedAt: null,
          serviceTermsAcceptedAt: new Date(),
          serviceTermsAcceptedVersion: LOCAL_LIFT_CHECKOUT_TERMS_VERSION,
          serviceTermsAcceptedTier: tier,
        });
        paymentClaimed = true;
      });
      if (paymentAlreadyPaid || !paymentClaimed) {
        if (paymentAlreadyPaid && paymentAlreadyPaidOrderId !== paypalOrderId) {
          await refundCompletedOrderIfNeeded(paypalOrderId, expectedReference, submittedPayerEmail).catch((refundError) => console.error("[local-lift-order] No se pudo compensar una captura duplicada:", refundError));
        }
        return paymentAlreadyCompletedResponse(res, docRef.id);
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
              localLiftLeadId: docRef.id,
              serviceTermsAcceptedAt: new Date().toISOString(),
              serviceTermsAcceptedVersion: LOCAL_LIFT_CHECKOUT_TERMS_VERSION,
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
            sentPortalWelcomeEmail: !!tempPassword,
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
      let invoicePdfStoragePath: string | null = null;
      if (invoiceNumber) {
        try {
          invoicePdf = await fetchInvoicePdf({
            invoiceNumber,
            clientName: data.contactName || data.businessName,
            clientEmail: data.email,
            description: `Local Lift: ${TIER_LABEL[tier]}, ${data.businessName}`,
            amount: TIER_PRICE[tier],
            paypalOrderId,
            exchangeRate,
          });
        } catch (pdfErr) {
          console.error("[local-lift-order] Error generando PDF de factura:", pdfErr);
        }
        if (invoicePdf) {
          invoicePdfStoragePath = await saveInvoicePdfToStorage(docRef.id, invoicePdf).catch((storageErr) => {
            console.error("[local-lift-order] Error guardando factura en Storage:", storageErr);
            return null;
          });
          if (invoicePdfStoragePath) await docRef.update({ invoicePdfStoragePath }).catch((storageErr) => console.error("[local-lift-order] Error guardando ruta de factura:", storageErr));
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
            from: '"Local Lift: Pago confirmado" <hola@polarisweb.studio>',
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
            subject: `Pago confirmado: ${data.businessName}`,
            text: `Gracias ${data.contactName || ""}. Recibimos tu pago para ${data.businessName} y ya comenzamos a preparar tu servicio. ${tier === "ascenso" ? "Tu paquete estará listo dentro de cinco horas corridas; entra al portal cuando quieras para seguir el avance y revisarlo." : "Tu paquete se preparará y llegará por correo dentro de dos horas."}`,
            html: buildPaymentConfirmedHtml({
              businessName: data.businessName,
              city: data.city,
              tier,
              contactName: data.contactName || "",
              amount: TIER_PRICE[tier],
              paypalOrderId,
              paypalPayerEmail: paypalPayerEmail || "",
              paidAt: new Date(),
              invoiceNumber,
              hasInvoicePdf: !!invoicePdf,
              sentPortalWelcomeEmail: !!tempPassword,
            }),
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
              subject: `Tu acceso al portal: ${data.businessName}`,
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
