import type { VercelRequest, VercelResponse } from "@vercel/node";
import nodemailer from "nodemailer";

// Endpoint temporal, admin-only por CRON_SECRET, para probar previews de
// rediseño de correo mandando un envío real de prueba. Se retira apenas
// termine la ronda de pruebas del rediseño de Local Lift (15 de agosto) --
// no queda como parte permanente de la superficie pública.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });
  const auth = req.headers.authorization || "";
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) return res.status(403).json({ error: "forbidden" });

  const { to, subject, html } = req.body || {};
  if (typeof to !== "string" || typeof subject !== "string" || typeof html !== "string") {
    return res.status(400).json({ error: "Falta to/subject/html" });
  }

  const zohoPassword = process.env.ZOHO_PASSWORD;
  if (!zohoPassword) return res.status(500).json({ error: "ZOHO_PASSWORD no configurado" });

  try {
    const transporter = nodemailer.createTransport({
      host: "smtp.zoho.com",
      port: 465,
      secure: true,
      auth: { user: "hola@polarisweb.studio", pass: zohoPassword },
    });
    await transporter.sendMail({
      from: '"Polaris Local Lift (PRUEBA rediseño)" <hola@polarisweb.studio>',
      to,
      subject,
      html,
    });
    return res.json({ success: true });
  } catch (err: any) {
    console.error("[test-send-email-temp] Error:", err);
    return res.status(500).json({ error: String(err?.message || err) });
  }
}
