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

const TIER_PRICE: Record<string, number> = { "48h": 99, implementado: 179 };

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
        await docRef.update({
          paid: true,
          tier,
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
        try {
          const transporter = nodemailer.createTransport({
            host: "smtp.zoho.com", port: 465, secure: true,
            auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
          });
          await transporter.sendMail({
            from: '"Local Lift -- Pago confirmado" <hola@polarisweb.studio>',
            to: "hola@polarisweb.studio",
            replyTo: data.email,
            subject: `💰 Pago Local Lift confirmado: ${data.businessName} ($${TIER_PRICE[tier]})`,
            text: `Negocio: ${data.businessName}\nCiudad: ${data.city}\nContacto: ${data.contactName} <${data.email}>\nTier: ${tier}\nPayPal Order: ${paypalOrderId}\n\nGenera y envía el paquete completo desde el panel: https://polarisweb.studio/local-lift/panel?lead=${docRef.id}`,
          });
        } catch (mailErr) {
          console.error("[local-lift-order] Error enviando alerta:", mailErr);
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
