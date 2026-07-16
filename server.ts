import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { dbInstance, hashPassword, verifyPassword } from "./server-db.js";
import generateAddonDescriptionsHandler from "./api/generate-addon-descriptions.js";
import suggestDomainsHandler from "./api/suggest-domains.js";

// Load environment variables
dotenv.config();

// --- Session token signing (HMAC) ---
// Secreto para firmar los tokens de sesión locales. En producción DEBE definirse
// PORTAL_SESSION_SECRET; si falta se genera uno efímero (invalida sesiones al reiniciar).
const SESSION_SECRET =
  process.env.PORTAL_SESSION_SECRET || crypto.randomBytes(32).toString("hex");
if (!process.env.PORTAL_SESSION_SECRET) {
  console.warn(
    "[Auth] PORTAL_SESSION_SECRET no definido: usando secreto efímero. Defínelo en producción para mantener las sesiones."
  );
}
const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 días

// Hash scrypt de un valor aleatorio, usado para igualar el coste de verificación
// cuando el email no existe (evita distinguir usuarios válidos por temporización).
const DUMMY_PASSWORD_HASH = hashPassword(crypto.randomBytes(24).toString("hex"));

// --- Rate limiting en memoria (por IP + clave) ---
// Suficiente para un backend Express de instancia única; frena fuerza bruta de
// login y abuso de los endpoints de IA sin dependencias externas.
const rateBuckets = new Map<string, { count: number; resetAt: number }>();

function rateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(key);
  if (!bucket || now > bucket.resetAt) {
    rateBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (bucket.count >= max) return false;
  bucket.count++;
  return true;
}

// Limpieza periódica de buckets expirados para no crecer sin límite.
setInterval(() => {
  const now = Date.now();
  for (const [k, v] of rateBuckets) {
    if (now > v.resetAt) rateBuckets.delete(k);
  }
}, 10 * 60 * 1000).unref?.();

function clientIp(req: any): string {
  const fwd = (req.headers["x-forwarded-for"] as string) || "";
  return fwd.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

// projectId de Firebase para validar la audiencia/issuer de los ID tokens.
let FIREBASE_PROJECT_ID: string = process.env.FIREBASE_PROJECT_ID || ""; // Preferir variable de entorno
if (!FIREBASE_PROJECT_ID) {
  try {
    const cfgRaw = fs.readFileSync(
      path.join(process.cwd(), "firebase-applet-config.json"),
      "utf-8"
    );
    FIREBASE_PROJECT_ID = JSON.parse(cfgRaw).projectId || "";
  } catch (err: any) {
    console.error(`[Auth] ERROR FATAL: No se pudo leer firebase-applet-config.json o FIREBASE_PROJECT_ID no definido en .env. La verificación de tokens de Firebase es crucial para la seguridad. Error: ${err.message}`);
    process.exit(1); // Salida forzada si la configuración crítica falta
  }
}
if (!FIREBASE_PROJECT_ID) {
  console.error("[Auth] ERROR FATAL: FIREBASE_PROJECT_ID sigue sin definir. La verificación de tokens de Firebase es crucial para la seguridad. El servidor no se iniciará.");
  process.exit(1);
}

/** Crea un token de sesión local firmado con HMAC-SHA256: pst_<payload>.<firma> */
function createSessionToken(user: { id: string; role: string }): string {
  const payload = {
    uid: user.id,
    role: user.role,
    iat: Date.now(),
    exp: Date.now() + SESSION_TTL_MS,
  };
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const sig = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  return `pst_${body}.${sig}`;
}

/** Verifica un token de sesión local. Devuelve el payload o null si es inválido/expirado. */
function verifySessionToken(token: string): { uid: string; role: string } | null {
  if (!token.startsWith("pst_")) return null;
  const [body, sig] = token.slice(4).split(".");
  if (!body || !sig) return null;
  const expected = crypto.createHmac("sha256", SESSION_SECRET).update(body).digest("base64url");
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expected);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8"));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return payload;
  } catch {
    return null;
  }
}

// Cache de certificados públicos de Google para verificar ID tokens de Firebase.
let googleCertsCache: { certs: Record<string, string> | null; exp: number } = {
  certs: null,
  exp: 0,
};
async function getGoogleCerts(): Promise<Record<string, string>> {
  if (googleCertsCache.certs && Date.now() < googleCertsCache.exp) {
    return googleCertsCache.certs;
  }
  const res = await fetch(
    "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com"
  );
  if (!res.ok) throw new Error("No se pudieron obtener los certificados de Google");
  const certs = (await res.json()) as Record<string, string>;
  const cacheControl = res.headers.get("cache-control") || "";
  const maxAge = cacheControl.match(/max-age=(\d+)/);
  const ttl = maxAge ? parseInt(maxAge[1], 10) * 1000 : 3600 * 1000;
  googleCertsCache = { certs, exp: Date.now() + ttl };
  return certs;
}

/**
 * Verifica criptográficamente un ID token de Firebase (RS256) contra las claves
 * públicas de Google y valida audiencia/issuer/expiración. Devuelve el payload o null.
 * Fail-closed: cualquier error de verificación o de red devuelve null (token rechazado).
 */
async function verifyFirebaseToken(token: string): Promise<any | null> {
  if (!FIREBASE_PROJECT_ID) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    const header = JSON.parse(Buffer.from(parts[0], "base64url").toString("utf-8"));
    if (header.alg !== "RS256" || !header.kid) return null;

    const certs = await getGoogleCerts();
    const cert = certs[header.kid];
    if (!cert) return null;

    const publicKey = crypto.createPublicKey(cert);
    const signedData = Buffer.from(`${parts[0]}.${parts[1]}`);
    const signature = Buffer.from(parts[2], "base64url");
    const valid = crypto.verify("RSA-SHA256", signedData, publicKey, signature);
    if (!valid) return null;

    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf-8"));
    const nowSec = Math.floor(Date.now() / 1000);
    if (payload.aud !== FIREBASE_PROJECT_ID) return null;
    if (payload.iss !== `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`) return null;
    if (!payload.exp || nowSec >= payload.exp) return null;
    if (!payload.sub) return null;
    return payload;
  } catch {
    return null;
  }
}

async function askGrok(prompt: string): Promise<string> {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("GROK_API_KEY no configurada");

  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      messages: [{ role: "user", content: prompt }],
      model: "grok-2-latest",
      temperature: 0.7
    })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Error en Grok");
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function askGemini(prompt: string): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY no configurada");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: 300, temperature: 0.7 }
      })
    }
  );
  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || "Error en Gemini");
  return data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
}

async function askAI(prompt: string): Promise<string> {
  try {
    return await askGemini(prompt);
  } catch (error: any) {
    console.warn("Fallo Gemini, intentando Grok...", error?.message);
    return await askGrok(prompt);
  }
}

function paypalApiBase(): string {
  return process.env.PAYPAL_ENV === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

let cachedPayPalToken: { token: string; expiresAt: number } | null = null;

async function getPayPalAccessToken(): Promise<string> {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;
  if (!clientId || !clientSecret) throw new Error("Credenciales de PayPal no configuradas.");

  if (cachedPayPalToken && cachedPayPalToken.expiresAt > Date.now()) {
    return cachedPayPalToken.token;
  }

  const response = await fetch(`${paypalApiBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error_description || "No se pudo autenticar con PayPal.");

  cachedPayPalToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };
  return cachedPayPalToken.token;
}

async function paypalCreateOrder(amount: number, currency: string, invoiceId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/checkout/orders`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      intent: "CAPTURE",
      purchase_units: [
        {
          reference_id: invoiceId,
          amount: { currency_code: currency, value: amount.toFixed(2) },
        },
      ],
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo crear la orden de PayPal.");
  return data;
}

async function paypalCaptureOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}/capture`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo capturar el pago de PayPal.");
  return data;
}

async function paypalGetOrder(orderId: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/checkout/orders/${orderId}`, {
    headers: { "Authorization": `Bearer ${accessToken}` },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo consultar la orden de PayPal.");
  return data;
}

async function paypalRefundCapture(captureId: string, amount: number, currency: string): Promise<any> {
  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v2/payments/captures/${captureId}/refund`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      amount: { value: amount.toFixed(2), currency_code: currency },
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "No se pudo procesar el reembolso de PayPal.");
  return data;
}

async function paypalVerifyWebhookSignature(headers: Record<string, any>, body: any): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID;
  if (!webhookId) throw new Error("PAYPAL_WEBHOOK_ID no configurado.");

  const accessToken = await getPayPalAccessToken();
  const response = await fetch(`${paypalApiBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      auth_algo: headers["paypal-auth-algo"],
      cert_url: headers["paypal-cert-url"],
      transmission_id: headers["paypal-transmission-id"],
      transmission_sig: headers["paypal-transmission-sig"],
      transmission_time: headers["paypal-transmission-time"],
      webhook_id: webhookId,
      webhook_event: body,
    }),
  });
  const data = await response.json();
  if (!response.ok) return false;
  return data.verification_status === "SUCCESS";
}

/**
 * Standard pricing estimates for common TLDs when not returned as premium by Namecheap API
 * (Registration/check API only returns pricing for premium domains by default)
 */
const TLD_PRICES_ESTIMATE: Record<string, number> = {
  com: 13.98,
  net: 12.98,
  org: 14.98,
  info: 17.98,
  biz: 16.98,
  co: 28.98,
  io: 39.98,
  me: 18.98,
  app: 15.98,
  dev: 15.98,
  tech: 42.98,
  online: 32.98,
  store: 29.98,
};

/**
 * Helper to extract an attribute value from a specific XML tag using robust RegExp rules.
 * Keeps parsing lightweight and secure from XML External Entity (XXE) injections.
 */
function getXmlAttribute(xml: string, tag: string, attr: string): string | null {
  const tagRegex = new RegExp(`<${tag}[^>]*>`, "i");
  const tagMatch = xml.match(tagRegex);
  if (!tagMatch) return null;

  const attrRegex = new RegExp(`${attr}\\s*=\\s*["']([^"']*)["']`, "i");
  const attrMatch = tagMatch[0].match(attrRegex);
  return attrMatch ? attrMatch[1] : null;
}

/**
 * Helper to extract standard error messages from XML response structure
 */
function getXmlError(xml: string): string | null {
  const errorMatch = xml.match(/<Error[^>]*>([\s\S]*?)<\/Error>/i);
  return errorMatch ? errorMatch[1].trim() : null;
}

import { checkDomainAvailability } from "./src/lib/domain-utils";

export const app = express();
app.disable("x-powered-by");

// Endurece cabeceras de respuesta (defensa básica sin depender de helmet).
// La CSP usa solo el subconjunto seguro (frame-ancestors/object-src/base-uri/
// form-action): bloquea clickjacking, inyección de <object>/<base> y exfiltración
// por form-action, sin tocar script/style/connect/font (que romperían Firebase,
// Cal.com, PayPal, GA4/Clarity y las fuentes externas).
const CSP_VALUE =
  "frame-ancestors 'none'; object-src 'none'; base-uri 'self'; form-action 'self'";
app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
  res.setHeader("Content-Security-Policy", CSP_VALUE);
  // HSTS solo sobre HTTPS: enviarlo en el dev local (http://localhost) haría que
  // el navegador del desarrollador forzara HTTPS en localhost y rompiera el dev.
  if (req.secure || req.headers["x-forwarded-proto"] === "https") {
    res.setHeader(
      "Strict-Transport-Security",
      "max-age=63072000; includeSubDomains; preload"
    );
  }
  res.removeHeader("X-Powered-By");
  next();
});

const MAX_BODY_BYTES = 100 * 1024; // 100 KB: suficiente para el portal, corta abusos.

// Body parser middlewares for local API routes
app.use((req, res, next) => {
  if (req.path === '/api/webhooks/github') {
    // El webhook necesita el cuerpo crudo para verificar la firma HMAC, pero
    // se acota el tamaño para evitar consumo de memoria no acotado.
    let data = '';
    let aborted = false;
    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      if (aborted) return;
      data += chunk;
      if (data.length > MAX_BODY_BYTES) {
        aborted = true;
        res.status(413).json({ error: "Payload demasiado grande" });
        req.destroy();
      }
    });
    req.on('end', () => {
      if (aborted) return;
      (req as any).rawBody = data;
      try { req.body = JSON.parse(data); } catch { req.body = {}; }
      next();
    });
  } else {
    express.json({ limit: MAX_BODY_BYTES })(req, res, next);
  }
});
app.use(express.urlencoded({ extended: true, limit: MAX_BODY_BYTES }));

const PORT = 3000;

  /**
   * Safe Proxy Endpoint to Check Domain Availability and Pricing using Namecheap API.
   * Format: GET /api/check-domain?domain=example.com
   */
  app.get("/api/check-domain", async (req, res) => {
    let domain = (req.query.domain as string || "").trim().toLowerCase();
    domain = domain.replace(/^(https?:\/\/)?(www\.)?/, "").split("/")[0];

    if (!domain || !domain.includes(".")) {
      return res.status(400).json({ error: "Invalid domain format" });
    }

    try {
      const available = await checkDomainAvailability(domain);
      return res.json({ available });

    } catch (err: any) {
      return res.status(502).json({ error: "Could not verify domain availability." });
    }
  });

  /**
   * Safe Proxy Endpoint to Fetch live exchange rate from USD to DOP
   * Format: GET /api/exchange-rate/usd-dop
   */
  app.get("/api/exchange-rate/usd-dop", async (req, res) => {
    try {
      const response = await fetch("https://open.er-api.com/v6/latest/USD");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data: any = await response.json();
      const dopRate = data?.rates?.DOP;
      if (typeof dopRate === "number") {
        return res.json({ rate: dopRate, source: "Google Finance (ExchangeRate-API)" });
      }
      throw new Error("DOP rate not found in response");
    } catch (err: any) {
      console.error("Failed to fetch exchange rate:", err);
      try {
        const altResponse = await fetch("https://api.exchangerate-api.com/v4/latest/USD");
        if (altResponse.ok) {
          const altData: any = await altResponse.json();
          const altDopRate = altData?.rates?.DOP;
          if (typeof altDopRate === "number") {
            return res.json({ rate: altDopRate, source: "Google Finance (ExchangeRate-API-Alt)" });
          }
        }
      } catch (altErr) {
        console.error("Alternative fetch failed:", altErr);
      }
      // If all else fails, return a reasonable current fallback
      return res.json({ rate: 59.35, source: "Fallback" });
    }
  });

  app.post("/api/generate-addon-descriptions", async (req, res) => {
    try {
      await generateAddonDescriptionsHandler(req as any, res as any);
    } catch (error: any) {
      console.error("Error generating addon descriptions:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  app.post("/api/suggest-domains", async (req, res) => {
    try {
      await suggestDomainsHandler(req as any, res as any);
    } catch (error: any) {
      console.error("Error suggesting domains:", error);
      res.status(500).json({ error: error?.message || "Internal server error" });
    }
  });

  // --- Portal Authentication Middleware helper ---

  async function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Debe iniciar sesión para acceder." });

    // 1. Token de sesión local firmado con HMAC (emitido por /api/auth/login)
    const session = verifySessionToken(token);
    if (session) {
      const user = dbInstance.getUsers().find((u) => u.id === session.uid && !u.deletedAt);
      if (!user) return res.status(404).json({ error: "Usuario para la sesión no encontrado." });
      req.user = user;
      return next();
    }

    // 2. ID token de Firebase (JWT) — verificado criptográficamente contra las
    //    claves públicas de Google (firma RS256 + audiencia + issuer + expiración).
    if (token.split(".").length === 3) {
      const payload = await verifyFirebaseToken(token);
      if (!payload || !payload.email) {
        return res.status(403).json({ error: "Token de sesión inválido o expirado." });
      }
      const emailClean = String(payload.email).trim().toLowerCase();
      const user = dbInstance.getUsers().find(
        (u) => u.email.trim().toLowerCase() === emailClean && !u.deletedAt
      );
      if (!user) {
        return res.status(404).json({ error: "Usuario no registrado en la base de datos local." });
      }
      req.user = user;
      return next();
    }

    return res.status(403).json({ error: "Token de sesión inválido o con formato desconocido." });
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere cuenta de Administrador." });
    }
    next();
  }

  // --- Portal Authentication Endpoints ---

  app.post("/api/auth/login", (req, res) => {
    // Máx. 10 intentos por IP cada 15 min para frenar fuerza bruta de credenciales.
    if (!rateLimit(`login:${clientIp(req)}`, 10, 15 * 60 * 1000)) {
      return res.status(429).json({ success: false, error: "Demasiados intentos. Espera unos minutos e inténtalo de nuevo." });
    }

    const { email, password } = req.body;
    if (!email || !password || typeof email !== "string" || typeof password !== "string") {
      return res.status(400).json({ success: false, error: "El email y contraseña son obligatorios." });
    }

    const emailClean = String(email).trim().toLowerCase();
    const user = dbInstance.getUsers().find(
      (u) => u.email.trim().toLowerCase() === emailClean && !u.deletedAt
    );

    // Verificación de contraseña en tiempo constante. Se verifica siempre contra
    // un hash (real o dummy) para no filtrar por temporización si el email existe.
    const stored = user?.password || DUMMY_PASSWORD_HASH;
    const { valid, legacy } = verifyPassword(
      stored,
      String(password)
    );

    if (!user || !valid) {
      return res.status(401).json({ success: false, error: "El correo o contraseña ingresados son incorrectos." });
    }

    // Migración perezosa: si la contraseña estaba en texto plano heredado,
    // la reescribimos como hash scrypt tras un inicio de sesión exitoso.
    if (legacy) {
      dbInstance.updateUser(user.id, { password: hashPassword(String(password)) });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = createSessionToken(user);
    res.json({ success: true, token, user: userWithoutPassword });
  });

  app.get("/api/auth/me", authenticateToken, (req: any, res) => {
    const { password: _, ...userWithoutPassword } = req.user;
    res.json({ success: true, user: userWithoutPassword });
  });

  // --- Client Portal Core Operations (Multi-role support) ---

  app.get("/api/portal/dashboard", authenticateToken, (req: any, res) => {
    const user = req.user;

    if (user.role === "admin") {
      const allUsers = dbInstance.getUsers();
      const allProjects = dbInstance.getProjects();
      
      const activeClients = allUsers.filter((u) => u.role === "client" && !u.deletedAt);
      const deletedClients = allUsers.filter((u) => u.role === "client" && !!u.deletedAt);
      const activeProjects = allProjects.filter((p) => !p.deletedAt);
      const deletedProjects = allProjects.filter((p) => !!p.deletedAt);
      
      const tasks = dbInstance.getTasks();
      const invoices = dbInstance.getInvoices();
      const meetings = dbInstance.getMeetings();

      res.json({
        success: true,
        role: "admin",
        clients: activeClients,
        deletedClients,
        projects: activeProjects,
        deletedProjects,
        tasks,
        invoices,
        meetings,
        nextProjectDisplayId: dbInstance.peekNextDisplayId(),
      });
    } else {
      const projects = dbInstance.getProjects().filter((p) => p.clientUserId === user.id);
      const projectIds = projects.map((p) => p.id);

      const tasks = dbInstance.getTasks().filter((t) => projectIds.includes(t.projectId));
      const invoices = dbInstance.getInvoices().filter((i) => projectIds.includes(i.projectId));
      const meetings = dbInstance.getMeetings().filter((m) => projectIds.includes(m.projectId));

      res.json({
        success: true,
        role: "client",
        projects,
        tasks,
        invoices,
        meetings,
      });
    }
  });

  // --- Admin actions ---

  // 1. Create a client and their project & deliverables
  app.post("/api/portal/clients", authenticateToken, requireAdmin, (req, res) => {
    const { email, password, name, companyName, projectName, projectDescription } = req.body;

    if (!email || !password || !name || !companyName || !projectName) {
      return res.status(400).json({ error: "Faltan datos obligatorios para crear el cliente." });
    }

    const emailClean = email.trim().toLowerCase();
    const existing = dbInstance.getUsers().find((u) => u.email.trim().toLowerCase() === emailClean);
    if (existing) {
      return res.status(400).json({ error: "Ya existe un usuario registrado con este correo." });
    }

    const clientId = `usr-${Date.now()}`;
    const projectId = `proj-${Date.now()}`;

    dbInstance.addUser({
      id: clientId,
      email: emailClean,
      password: hashPassword(String(password)),
      name,
      role: "client",
      companyName,
    });

    const displayId = dbInstance.consumeNextDisplayId();

    dbInstance.addProject({
      id: projectId,
      displayId,
      clientUserId: clientId,
      name: projectName,
      currentPhase: "Fase 1: Descubrimiento y Requerimientos",
      progress: 25,
      description: projectDescription || "Nueva iniciativa de desarrollo a medida.",
      status: "active",
      phases: [
        {
          name: "Fase 1: Descubrimiento y Requerimientos",
          status: "active",
          detail: "Definiendo propuesta técnica, objetivos de conversión SEO e integraciones API.",
        },
        {
          name: "Fase 2: Diseño de Experiencia de Usuario (UI/UX)",
          status: "pending",
          detail: "Pendiente de inicio. Estructuración en wireframes interactivos.",
        },
        {
          name: "Fase 3: Desarrollo Core Frontend & Backend",
          status: "pending",
          detail: "Construcción en pila tecnológica nativa (TypeScript, Tailwind, React).",
        }
      ]
    });

    dbInstance.addTask({
      id: `task-${Date.now()}`,
      projectId: projectId,
      title: "Revisar Documento de Requerimientos de Software (SRS)",
      description: "Por favor, valide los requerimientos, alcances y plazos iniciales descritos en la ficha de proyecto.",
      status: "pending",
      createdAt: new Date().toISOString(),
    });

    dbInstance.addInvoice({
      id: `inv-${Date.now()}`,
      projectId: projectId,
      invoiceNumber: generateInvoiceNumber(dbInstance.getInvoices()),
      amount: 1500,
      currency: "USD",
      status: "pending",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: "Fase Inicial: Planificación, Descubrimiento y Foco SEO",
    });

    res.json({ success: true, clientId, projectId });
  });

  app.delete("/api/portal/clients/:id", authenticateToken, requireAdmin, (req, res) => {
    dbInstance.deleteUser(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/portal/clients/:id/restore", authenticateToken, requireAdmin, (req, res) => {
    dbInstance.restoreUser(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/portal/projects/:id/restore", authenticateToken, requireAdmin, (req, res) => {
    dbInstance.restoreProject(req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/portal/projects/:id", authenticateToken, requireAdmin, (req, res) => {
    console.log("Deleting project:", req.params.id);
    dbInstance.deleteProject(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/portal/projects/:id", authenticateToken, requireAdmin, (req, res) => {
    const { currentPhase, progress, phases, status } = req.body;
    dbInstance.updateProject(req.params.id, {
      currentPhase,
      progress: Number(progress),
      phases,
      status,
    });
    res.json({ success: true });
  });

  function generateInvoiceNumber(existingInvoices: any[]): string {
    const year = new Date().getFullYear();
    
    // Filtrar facturas del año actual y extraer su secuencia
    const thisYearInvoices = existingInvoices
      .map(inv => {
        const match = inv.invoiceNumber?.match(/^POL-(\d{4})-(\d+)$/);
        return match && parseInt(match[1]) === year ? parseInt(match[2]) : 0;
      })
      .filter(n => n > 0);

    // Siguiente número en secuencia
    const nextNum = thisYearInvoices.length > 0 
      ? Math.max(...thisYearInvoices) + 1 
      : 1;

    // Formato: POL-2026-001
    return `POL-${year}-${String(nextNum).padStart(3, "0")}`;
  }

  app.post("/api/portal/invoices", authenticateToken, requireAdmin, (req, res) => {
    const { projectId, amount, description, items, status, date, dueDate, exchangeRate } = req.body;

    // Varios productos/conceptos en una misma factura (ej: 2 addons separados de un
    // cliente): el total y el concepto-resumen se derivan de la lista, en vez de
    // pedirlos sueltos -- mantiene compatibilidad con el flujo anterior de un solo
    // monto/descripción para llamadas que no manden "items".
    let finalAmount: number;
    let finalDescription: string;
    let finalItems: { description: string; price: number; quantity: number }[] | undefined;
    if (Array.isArray(items) && items.length > 0) {
      finalItems = items
        .filter((it: any) => it?.description && Number(it.price) > 0)
        .map((it: any) => ({
          description: String(it.description).trim(),
          price: Number(it.price),
          quantity: Number(it.quantity) || 1,
        }));
      if (finalItems.length === 0) {
        return res.status(400).json({ error: "Faltan campos obligatorios para la factura." });
      }
      finalAmount = finalItems.reduce((sum, it) => sum + it.price * it.quantity, 0);
      finalDescription = finalItems.map((it) => it.description).join(", ");
    } else {
      if (!amount) return res.status(400).json({ error: "Faltan campos obligatorios para la factura." });
      finalAmount = Number(amount);
      finalDescription = description;
    }
    if (!projectId) {
      return res.status(400).json({ error: "Faltan campos obligatorios para la factura." });
    }

    const allInvoices = dbInstance.getInvoices();
    const invoiceNumber = generateInvoiceNumber(allInvoices);

    dbInstance.addInvoice({
      id: `inv-${Date.now()}`,
      projectId,
      invoiceNumber,
      amount: finalAmount,
      currency: "USD",
      status: status || "pending",
      date: date || new Date().toISOString().split("T")[0],
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description: finalDescription,
      items: finalItems,
      exchangeRate: exchangeRate ? Number(exchangeRate) : undefined,
    });

    res.json({ success: true, invoiceNumber });
  });

  app.put("/api/portal/invoices/:id/status", authenticateToken, requireAdmin, express.json(), async (req, res) => {
    const invoices = dbInstance.getInvoices();
    const foundInvoice = invoices.find(i => i.id === req.params.id);
    if (!foundInvoice) return res.status(404).json({ error: "Factura no encontrada." });

    const { status } = req.body;
    if (!["pending", "paid", "void"].includes(status)) {
      return res.status(400).json({ error: "Invalid status." });
    }

    // Invalidar una factura que ya fue cobrada de verdad por PayPal debe
    // devolver el dinero: si el reembolso falla, no se invalida la factura,
    // para que no quede una factura "invalidada" con el cobro real todavía
    // en manos de la agencia.
    if (status === "void" && foundInvoice.status === "paid" && foundInvoice.paypalCaptureId) {
      try {
        const refund = await paypalRefundCapture(foundInvoice.paypalCaptureId, foundInvoice.amount, foundInvoice.currency);
        const refundedAt = new Date().toISOString();
        dbInstance.updateInvoice(req.params.id, {
          status: "void",
          paypalRefundId: refund.id,
          refundedAt,
          voidedAfterManualPayment: false,
        });
        return res.json({ success: true, status: "void", refunded: true, refundId: refund.id, refundedAt });
      } catch (error: any) {
        console.error("Error reembolsando factura vía PayPal:", error?.message);
        return res.status(502).json({ error: "No se pudo procesar el reembolso con PayPal. La factura no fue invalidada." });
      }
    }

    const manualPayment = status === "void" && foundInvoice.status === "paid" && !foundInvoice.paypalCaptureId;
    // Salir de "void" (reactivar una factura) limpia el rastro de reembolso/aviso
    // anterior, para que no queden etiquetas obsoletas si luego se vuelve a pagar.
    dbInstance.updateInvoice(req.params.id, {
      status,
      voidedAfterManualPayment: manualPayment,
      ...(status !== "void" ? { paypalRefundId: undefined, refundedAt: undefined } : {}),
    });
    res.json({ success: true, status, refunded: false, manualPayment });
  });

  app.post("/api/portal/invoices/:id/toggle-pay", authenticateToken, requireAdmin, (req, res) => {
    const invoices = dbInstance.getInvoices();
    const foundInvoice = invoices.find(i => i.id === req.params.id);
    if (!foundInvoice) return res.status(404).json({ error: "Factura no encontrada." });

    const nextStatus = foundInvoice.status === "paid" ? "pending" : "paid";
    dbInstance.updateInvoice(req.params.id, { status: nextStatus });
    res.json({ success: true, status: nextStatus });
  });

  app.get("/api/portal/paypal/client-id", authenticateToken, (_req, res) => {
    if (!process.env.PAYPAL_CLIENT_ID) {
      return res.status(503).json({ error: "PayPal no está configurado." });
    }
    res.json({ clientId: process.env.PAYPAL_CLIENT_ID });
  });

  function assertInvoiceAccess(req: any, foundInvoice: any, res: any): any {
    const project = dbInstance.getProjects().find((p) => p.id === foundInvoice.projectId);
    if (!project) {
      res.status(404).json({ error: "Proyecto asociado inexistente." });
      return null;
    }
    if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
      res.status(403).json({ error: "Acceso denegado. No tiene permisos sobre esta factura." });
      return null;
    }
    return project;
  }

  app.post("/api/portal/invoices/:id/paypal/create-order", authenticateToken, async (req: any, res) => {
    if (!rateLimit(`paypal-order:${req.user.id}`, 20, 10 * 60 * 1000)) {
      return res.status(429).json({ error: "Demasiados intentos. Intenta de nuevo más tarde." });
    }

    const invoices = dbInstance.getInvoices();
    const foundInvoice = invoices.find(i => i.id === req.params.id);
    if (!foundInvoice) return res.status(404).json({ error: "Factura no encontrada." });
    if (!assertInvoiceAccess(req, foundInvoice, res)) return;

    if (foundInvoice.status === "paid") {
      return res.status(400).json({ error: "Esta factura ya está pagada." });
    }

    try {
      const order = await paypalCreateOrder(foundInvoice.amount, foundInvoice.currency, foundInvoice.id);
      res.json({ success: true, orderId: order.id });
    } catch (error: any) {
      console.error("Error creando orden PayPal:", error?.message);
      res.status(502).json({ error: "No se pudo iniciar el pago con PayPal." });
    }
  });

  app.post("/api/portal/invoices/:id/paypal/capture-order", authenticateToken, async (req: any, res) => {
    if (!rateLimit(`paypal-capture:${req.user.id}`, 20, 10 * 60 * 1000)) {
      return res.status(429).json({ error: "Demasiados intentos. Intenta de nuevo más tarde." });
    }

    const { orderId } = req.body || {};
    if (!orderId) return res.status(400).json({ error: "Falta el ID de la orden de PayPal." });

    const invoices = dbInstance.getInvoices();
    const foundInvoice = invoices.find(i => i.id === req.params.id);
    if (!foundInvoice) return res.status(404).json({ error: "Factura no encontrada." });
    if (!assertInvoiceAccess(req, foundInvoice, res)) return;

    if (foundInvoice.status === "paid") {
      return res.status(400).json({ error: "Esta factura ya está pagada." });
    }

    try {
      const capture = await paypalCaptureOrder(orderId);
      const captureUnit = capture.purchase_units?.[0]?.payments?.captures?.[0];

      if (capture.status !== "COMPLETED" || !captureUnit) {
        return res.status(402).json({ error: "El pago no se completó." });
      }

      const capturedAmount = parseFloat(captureUnit.amount?.value);
      const capturedCurrency = captureUnit.amount?.currency_code;
      if (
        Math.abs(capturedAmount - foundInvoice.amount) > 0.01 ||
        capturedCurrency !== foundInvoice.currency
      ) {
        console.error(
          `Discrepancia de monto PayPal: factura ${foundInvoice.id} esperaba ${foundInvoice.amount} ${foundInvoice.currency}, se capturó ${capturedAmount} ${capturedCurrency}`
        );
        return res.status(402).json({ error: "El monto capturado no coincide con la factura." });
      }

      dbInstance.updateInvoice(req.params.id, {
        status: "paid",
        paypalOrderId: orderId,
        paypalCaptureId: captureUnit.id,
      });
      res.json({ success: true, status: "paid" });
    } catch (error: any) {
      console.error("Error capturando orden PayPal:", error?.message);
      res.status(502).json({ error: "No se pudo confirmar el pago con PayPal." });
    }
  });

  app.delete("/api/portal/invoices/:id", authenticateToken, requireAdmin, (req, res) => {
    dbInstance.deleteInvoice(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/portal/tasks", authenticateToken, requireAdmin, (req, res) => {
    const { projectId, title, description, link } = req.body;
    if (!projectId || !title) {
      return res.status(400).json({ error: "Faltan campos obligatorios para la aprobación." });
    }

    dbInstance.addTask({
      id: `task-${Date.now()}`,
      projectId,
      title,
      description,
      status: "pending",
      link,
      createdAt: new Date().toISOString(),
    });
    res.json({ success: true });
  });

  app.delete("/api/portal/tasks/:id", authenticateToken, requireAdmin, (req, res) => {
    dbInstance.deleteTask(req.params.id);
    res.json({ success: true });
  });

  app.post("/api/portal/tasks/:id/archive", authenticateToken, (req: any, res) => {
    const { archived } = req.body;
    const user = req.user;
    const task = dbInstance.getTasks().find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Entregable no encontrado." });

    if (user.role !== "admin") {
      const clientProjects = dbInstance.getProjects().filter((p) => p.clientUserId === user.id);
      const isMyProject = clientProjects.some((p) => p.id === task.projectId);
      if (!isMyProject) {
        return res.status(403).json({ error: "No tienes permiso para archivar este entregable." });
      }
    }

    dbInstance.updateTask(req.params.id, { archived: archived === true });
    res.json({ success: true });
  });

  app.post("/api/portal/meetings", authenticateToken, requireAdmin, (req, res) => {
    const { projectId, title, date, time, meetLink } = req.body;
    if (!projectId || !title || !date || !time) {
      return res.status(400).json({ error: "Faltan datos de la reunión." });
    }

    dbInstance.addMeeting({
      id: `meet-${Date.now()}`,
      projectId,
      title,
      date,
      time,
      meetLink: meetLink || "https://meet.google.com/abc-defg-hij",
      status: "upcoming",
    });
    res.json({ success: true });
  });

  app.delete("/api/portal/meetings/:id", authenticateToken, requireAdmin, (req, res) => {
    dbInstance.deleteMeeting(req.params.id);
    res.json({ success: true });
  });

  // --- Client-only actions (Respond to active deliverables) ---

  app.post("/api/portal/tasks/:id/respond", authenticateToken, (req: any, res) => {
    const { status, feedback } = req.body;
    if (status !== "approved" && status !== "rejected") {
      return res.status(400).json({ error: "Estado de respuesta inválido." });
    }

    const task = dbInstance.getTasks().find((t) => t.id === req.params.id);
    if (!task) return res.status(404).json({ error: "Entregable para aprobación no encontrado." });

    const project = dbInstance.getProjects().find((p) => p.id === task.projectId);
    if (!project) return res.status(404).json({ error: "Proyecto asociado inexistente." });

    if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
      return res.status(403).json({ error: "Acceso denegado. No tiene permisos sobre este proyecto." });
    }

    dbInstance.updateTask(req.params.id, {
      status,
      feedback: feedback || "",
      respondedAt: new Date().toISOString(),
    });

    res.json({ success: true });
  });

  // --- AI Assistance Endpoints ---

  // IA: Analizar descripción de proyecto pública para el cotizador
  app.post("/api/ai/analyze-project", async (req, res) => {
    // Endpoint público (cotizador): rate limit por IP para evitar abuso/costes de IA.
    if (!rateLimit(`ai-public:${clientIp(req)}`, 20, 10 * 60 * 1000)) {
      return res.status(429).json({ error: "Demasiadas solicitudes. Espera un momento e inténtalo de nuevo." });
    }
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: "Falta la descripción del proyecto." });
    if (typeof description !== "string" || description.length > 2000) {
      return res.status(400).json({ error: "Descripción inválida o demasiado larga." });
    }
    try {
      const text = await askAI(
        `Eres el asistente de cotización de Polaris Web Studio, una agencia de desarrollo web en República Dominicana.
         Tu única tarea es analizar la descripción de un negocio o proyecto web y devolver UN SOLO objeto JSON con las selecciones correctas para el cotizador.
         NUNCA respondas con texto, explicaciones ni markdown. SOLO el objeto JSON.

         PLANES DISPONIBLES (campo "type"):
         - "landing": negocios que solo necesitan presencia online básica, una sola página, emprendedores, profesionales independientes, negocios pequeños sin necesidad de blog ni múltiples secciones. Precio: $299
         - "corporate": empresas que necesitan múltiples páginas, blog, secciones de servicios, equipo, contacto. Restaurantes, clínicas, despachos, constructoras, hoteles, etc. Precio: $699
         - "ecommerce": negocios que quieren vender productos online, aceptar pagos, gestionar inventario, tiendas de cualquier tipo. Precio: $1,299

         ADD-ONS DISPONIBLES (campo "addons", array):
         - "quick-bot": si menciona atención automática, respuestas rápidas, preguntas frecuentes
         - "sales-agent": si menciona ventas automatizadas, agente de ventas, seguimiento de clientes
         - "semantic-search": si menciona buscador, encontrar productos fácilmente (solo para e-commerce)
         - "content-assistant": si menciona blog activo, contenido frecuente, redes sociales
         - "maintenance": si menciona mantenimiento, soporte continuo, tranquilidad post-lanzamiento

         CAMPO "confidence":
         - "high": la descripción es clara y específica
         - "medium": hay ambigüedad pero puedes inferir
         - "low": descripción muy vaga, no hay suficiente info

         CAMPO "reasoning" (máximo 15 palabras en español):
         Explica brevemente por qué elegiste ese plan.

         EJEMPLO DE INPUT:
         "tengo una barbería y quiero que mis clientes puedan reservar citas online"

         EJEMPLO DE OUTPUT:
         {
           "type": "corporate",
           "addons": ["quick-bot"],
           "confidence": "high",
           "reasoning": "Barbería necesita web corporativa con sistema de citas y atención automática"
         }

         INPUT DEL USUARIO:
         "${description.replace(/"/g, '\\"')}"`
      );

      // Limpiar cualquier markdown que Gemini o el fallback de Grok puedan agregar
      const clean = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .replace(/^[^{]*/s, "")  // eliminar antes del primer {
        .replace(/[^}]*$/s, "")  // eliminar después del último }
        .trim();

      const parsed = JSON.parse(clean);
      res.json(parsed);
    } catch (e: any) {
      console.error("Error en /api/ai/analyze-project:", e);
      res.status(500).json({ error: e.message });
    }
  });

  // IA: Generar alcance/descripción de proyecto
  app.post("/api/ai/project-description", authenticateToken, requireAdmin, async (req, res) => {
    const { projectName, companyName, briefDescription } = req.body;
    if (!projectName || !companyName || !briefDescription) return res.status(400).json({ error: "Faltan datos obligatorios" });
    try {
      const text = await askAI(
        `Escribe una descripción ejecutiva y MUY PROFESIONAL en español.
         REGLA ESTRICTA: La descripción debe ser UNA o DOS oraciones máximo.
         Centrada exclusivamente en el propósito técnico o de negocio del proyecto web "${projectName}" para la empresa "${companyName}".
         Básate en esta idea proporcionada por el usuario: "${briefDescription}". 
         Importante: NO menciones agencias, ni Polaris Web Studio, ni a ti mismo. Sin bullets, solo texto corrido.`
      );
      res.json({ text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // IA: Generar descripción de entregable
  app.post("/api/ai/task-description", authenticateToken, requireAdmin, async (req, res) => {
    const { taskTitle, projectName, draft } = req.body;
    if (!taskTitle) return res.status(400).json({ error: "Faltan datos" });
    try {
      const text = await askAI(
        `Eres un project manager de Polaris Web Studio. 
         Escribe una descripción breve en español (máximo 1 o 2 oraciones cortas) para el cliente 
         sobre el entregable "${taskTitle}" del proyecto "${projectName || "web"}". 
         ${draft ? `El usuario ha escrito este borrador: "${draft}". Mejora y formaliza este borrador manteniéndolo conciso.` : `Explica brevemente qué debe revisar el cliente. Tono profesional pero accesible.`}
         REGLA MUY IMPORTANTE: Devuelve SOLO la descripción, DIRECTO AL GRANO. NO incluyas introducciones como "Aquí tienes...", ni texto extra, ni comillas.`
      );
      res.json({ text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // IA: Pulir la glosa de factura que escribió el admin (no inventa datos que el usuario no dio)
  app.post("/api/ai/invoice-description", authenticateToken, requireAdmin, async (req, res) => {
    const { draft } = req.body;
    if (!draft || !String(draft).trim()) return res.status(400).json({ error: "Faltan datos" });
    try {
      const text = await askAI(
        `Eres el área de facturación de Polaris Web Studio.
         Reescribe el siguiente concepto de factura para que suene profesional y prolijo, EN ESPAÑOL,
         sin inventar detalles que no estén en el texto original (no agregues fases, proyectos ni datos
         que el usuario no haya mencionado): "${draft}".
         Debe ser breve, una sola oración corta (máximo ~12 palabras), apta para una línea de factura.
         No incluyas saludos, comillas ni el precio. Devuelve solo el texto final.`
      );
      res.json({ text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // IA: Sugerir avance de fase basado en entregables aprobados
  app.post("/api/ai/suggest-progress", authenticateToken, requireAdmin, async (req, res) => {
    const { projectName, currentPhase, progress, approvedTasks, pendingTasks } = req.body;
    try {
      const text = await askAI(
        `Eres un project manager. El proyecto "${projectName}" está en "${currentPhase}" al ${progress}%.
         Tiene ${approvedTasks} entregables aprobados y ${pendingTasks} pendientes.
         Responde ÚNICAMENTE con un objeto JSON válido, sin markdown, sin bloques de código, sin explicación:
         {"suggestedProgress": 75, "suggestedPhase": "Fase 2: Diseño UI/UX", "phaseIndex": 1, "reason": "texto corto"}`
      );
  
      // Limpiar cualquier markdown que Gemini agregue
      const clean = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .replace(/^[^{]*/s, "")  // eliminar texto antes del primer {
        .replace(/[^}]*$/s, "")  // eliminar texto después del último }
        .trim();
  
      const parsed = JSON.parse(clean);
  
      // Validar que tiene los campos necesarios
      if (typeof parsed.suggestedProgress !== "number") {
        throw new Error("Respuesta de IA inválida");
      }
  
      res.json(parsed);
    } catch (e: any) {
      // Fallback: avanzar 10% sin cambiar fase
      res.json({
        suggestedProgress: Math.min(progress + 10, 100),
        suggestedPhase: currentPhase,
        phaseIndex: 0,
        reason: "Avance incremental aplicado (IA no disponible)"
      });
    }
  });

  app.post("/api/ai/chat", authenticateToken, async (req: any, res) => {
    // Aun autenticado, se limita para que no se use como proxy de IA gratuito.
    if (!rateLimit(`ai-chat:${req.user.id}`, 30, 10 * 60 * 1000)) {
      return res.status(429).json({ error: "Demasiadas solicitudes de IA. Espera un momento." });
    }

    const { projectId, message, action, prompt } = req.body;

    // Acota la entrada del cliente: evita que se use como proxy de IA con
    // prompts enormes (coste) y frena intentos de inyección larguísimos.
    if (message !== undefined && (typeof message !== "string" || message.length > 2000)) {
      return res.status(400).json({ error: "Mensaje inválido o demasiado largo." });
    }

    // Admin can perform arbitrary prompts (like task title optimization)
    if (req.user.role === "admin" && prompt) {
      if (typeof prompt !== "string" || prompt.length > 4000) {
        return res.status(400).json({ error: "Prompt inválido o demasiado largo." });
      }
      try {
        const text = await askAI(prompt);
        return res.json({ text });
      } catch (e: any) {
        return res.status(500).json({ error: e.message });
      }
    }

    // For clients (or admins using client portal actions), require projectId
    if (!projectId) {
      return res.status(400).json({ error: "Falta el projectId" });
    }

    // Fetch and validate project
    const project = dbInstance.getProjects().find(p => p.id === projectId);
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado." });
    }

    // Security check: Clients can only ask about their own projects
    if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
      return res.status(403).json({ error: "No tienes permiso para acceder a este proyecto." });
    }

    try {
      const approved = dbInstance.getTasks().filter(t => t.projectId === project.id && t.status === "approved").length;
      const pending = dbInstance.getTasks().filter(t => t.projectId === project.id && t.status === "pending").length;
      const pendingInvoices = dbInstance.getInvoices().filter(i => i.projectId === project.id && i.status === "pending").length;

      let generatedPrompt = "";

      if (action === "summary" || !message) {
        // Generate AI Client Summary
        const completedPhases = project.phases.filter((p: any) => p.status === "completed").length;
        const totalPhases = project.phases.length;
        const remainingPhases = totalPhases - completedPhases;
        const weeksEstimate = remainingPhases <= 0 ? 0 : remainingPhases * 2;

        generatedPrompt = `Eres el asistente amigable de Polaris Web Studio. Escribe un resumen breve en español 
         (máximo 2 oraciones, tono cercano y positivo, tutéalo) para el cliente dueño del proyecto 
         "${project.name}" que está al ${project.progress}% en la fase "${project.currentPhase}".
         Tiene ${approved} entregables aprobados${pending > 0 ? `, ${pending} pendiente(s) de revisar` : ""}
         ${pendingInvoices > 0 ? ` y ${pendingInvoices} factura(s) por pagar` : ""}.
         ${weeksEstimate > 0 ? `Estima que faltan aproximadamente ${weeksEstimate} semanas para completar.` : "El proyecto está casi terminado."}
         Sé específico con los datos, no genérico.`;
      } else {
        // Chat interaction
        const context = `Contexto: Proyecto "${project.name}" al ${project.progress}% en fase "${project.currentPhase}". Entregables aprobados: ${approved}, pendientes: ${pending}. Facturas pendientes: ${pendingInvoices}. Da los datos de contacto (WhatsApp: +18299200544, correo: soporte@polariswebstudio.com) SOLO si el cliente pregunta cómo contactar o pide ayuda externa. De lo contrario, no los menciones.`;
        
        generatedPrompt = `Eres el asistente de Polaris Web Studio. ${context} El cliente pregunta: "${message}". Responde en español, máximo 3 oraciones, tono cercano.`;
      }

      const text = await askAI(generatedPrompt);
      res.json({ text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // Webhook de GitHub — no requiere autenticación JWT, usa secret propio
  app.post("/api/webhooks/github", async (req, res) => {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    // Verificar que sea un push event
    const event = req.headers["x-github-event"];
    if (event !== "push") {
      return res.status(200).json({ ok: true, skipped: true });
    }

    // Fail-closed: sin secret configurado el webhook queda deshabilitado. De lo
    // contrario cualquiera podría inyectar registros de deploy falsos en la BD.
    if (!secret) {
      console.warn("[Webhook] GITHUB_WEBHOOK_SECRET no configurado: webhook rechazado.");
      return res.status(503).json({ error: "Webhook no configurado" });
    }

    const signature = req.headers["x-hub-signature-256"] as string;
    if (!signature) return res.status(401).json({ error: "No signature" });
    const rawBody = (req as any).rawBody || JSON.stringify(req.body);
    const expected = "sha256=" + crypto.createHmac("sha256", secret).update(rawBody).digest("hex");
    // Comparación en tiempo constante para evitar ataques de temporización sobre la firma.
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return res.status(401).json({ error: "Invalid signature" });
    }

    const repoName = req.body?.repository?.name; // ej: "tano-excursions"
    const commitMessage = req.body?.head_commit?.message || "Actualización del sitio";
    const pusher = req.body?.pusher?.name || "Polaris";
    const branch = req.body?.ref?.replace("refs/heads/", "") || "main";
    console.log(`[Webhook] repo=${repoName} branch=${branch} secret=${!!secret} sig=${!!(req.headers["x-hub-signature-256"])}`);

    // Solo procesar push a main/master
    if (branch !== "main" && branch !== "master") {
      return res.status(200).json({ ok: true, skipped: true });
    }

    if (!repoName) {
      return res.status(200).json({ ok: true, noRepo: true });
    }

    const allProjects = dbInstance.getProjects();
    const project = allProjects.find((p: any) =>
      (p.vercelProjectId && p.vercelProjectId.toLowerCase() === repoName.toLowerCase()) ||
      (p.vercelUrl && p.vercelUrl.toLowerCase().includes(repoName.toLowerCase()))
    );
    console.log(`[Webhook] DB projects: ${allProjects.map((p: any) => `${p.name}(${p.vercelProjectId})`).join(", ")}`);
    console.log(`[Webhook] Match: ${project?.name || "NONE"}`);

    if (!project) {
      console.log(`[GitHub Webhook] No project found for repo: ${repoName}`);
      return res.status(200).json({ ok: true, projectNotFound: true });
    }

    // Traducir commit message con Gemini
    let commitMessageEs = commitMessage;
    try {
      const translated = await askAI(
        `Traduce este mensaje técnico de desarrollo web al español de forma clara y amigable para un cliente no técnico (máximo 1 oración, sin jerga técnica, sin mencionar nombres de archivos ni código): "${commitMessage}"`
      );
      if (translated) commitMessageEs = translated;
    } catch (_) {}

    // Guardar el deploy
    dbInstance.addDeploy({
      id: `dep-${Date.now()}`,
      projectId: project.id,
      vercelDeploymentId: req.body?.after || `gh-${Date.now()}`,
      url: project.vercelUrl || `https://${repoName}.vercel.app`,
      commitMessage,
      commitMessageEs,
      state: "ready",
      createdAt: new Date().toISOString(),
    });

    console.log(`[GitHub Webhook] Push registrado para proyecto ${project.name}`);
    res.status(200).json({ ok: true });
  });

  // Webhook de PayPal — reconcilia el estado real del pago aunque el navegador
  // del cliente se cierre justo después de aprobar (el servidor ya captura y
  // guarda antes de responder, pero esto cubre el caso en que esa escritura
  // nunca llegó a completarse). Fail-closed: sin PAYPAL_WEBHOOK_ID configurado
  // o con firma inválida, se rechaza — de lo contrario cualquiera podría
  // marcar facturas como pagadas enviando eventos falsos.
  app.post("/api/webhooks/paypal", async (req, res) => {
    if (!process.env.PAYPAL_WEBHOOK_ID) {
      console.warn("[Webhook PayPal] PAYPAL_WEBHOOK_ID no configurado: webhook rechazado.");
      return res.status(503).json({ error: "Webhook no configurado" });
    }

    let verified = false;
    try {
      verified = await paypalVerifyWebhookSignature(req.headers as Record<string, any>, req.body);
    } catch (error: any) {
      console.error("[Webhook PayPal] Error verificando firma:", error?.message);
    }
    if (!verified) return res.status(401).json({ error: "Firma inválida" });

    const event = req.body;
    try {
      if (event.event_type === "PAYMENT.CAPTURE.COMPLETED") {
        const captureId = event.resource?.id;
        const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
        if (orderId && captureId) {
          const order = await paypalGetOrder(orderId);
          const invoiceId = order.purchase_units?.[0]?.reference_id;
          const foundInvoice = invoiceId ? dbInstance.getInvoices().find((i) => i.id === invoiceId) : null;
          if (foundInvoice && foundInvoice.status !== "paid") {
            const amount = parseFloat(event.resource.amount?.value);
            const currency = event.resource.amount?.currency_code;
            if (Math.abs(amount - foundInvoice.amount) < 0.01 && currency === foundInvoice.currency) {
              dbInstance.updateInvoice(foundInvoice.id, { status: "paid", paypalOrderId: orderId, paypalCaptureId: captureId });
              console.log(`[Webhook PayPal] Factura ${foundInvoice.id} confirmada como pagada.`);
            } else {
              console.error(`[Webhook PayPal] Monto no coincide para factura ${foundInvoice.id}: esperado ${foundInvoice.amount} ${foundInvoice.currency}, recibido ${amount} ${currency}`);
            }
          }
        }
      } else if (event.event_type === "PAYMENT.CAPTURE.REFUNDED") {
        const upLink = event.resource?.links?.find((l: any) => l.rel === "up")?.href as string | undefined;
        const captureId = upLink ? upLink.split("/").pop() : null;
        const foundInvoice = captureId ? dbInstance.getInvoices().find((i) => i.paypalCaptureId === captureId) : null;
        if (foundInvoice && foundInvoice.status !== "void") {
          dbInstance.updateInvoice(foundInvoice.id, {
            status: "void",
            paypalRefundId: event.resource?.id,
            refundedAt: new Date().toISOString(),
            voidedAfterManualPayment: false,
          });
          console.log(`[Webhook PayPal] Factura ${foundInvoice.id} invalidada (reembolso detectado por webhook).`);
        }
      }
    } catch (error: any) {
      console.error("[Webhook PayPal] Error procesando evento:", error?.message);
    }

    res.status(200).json({ ok: true });
  });

  app.get("/api/portal/deploys/:projectId", authenticateToken, async (req: any, res) => {
    const { projectId } = req.params;

    // Un cliente solo puede ver los deploys de sus propios proyectos (evita IDOR).
    const project = dbInstance.getProjects().find((p) => p.id === projectId);
    if (!project) return res.status(404).json({ error: "Proyecto no encontrado." });
    if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
      return res.status(403).json({ error: "Acceso denegado. No tiene permisos sobre este proyecto." });
    }

    const deploys = dbInstance.getDeploys(projectId);
    res.json(deploys);
  });

  // Registro Manual de Deploys para un proyecto por parte del Administrador
  app.post("/api/portal/projects/:id/deploys", authenticateToken, requireAdmin, async (req: any, res) => {
    const { id } = req.params;
    const { commitMessage, commitMessageEs, url, state } = req.body;

    const project = dbInstance.getProjects().find((p: any) => p.id === id);
    if (!project) {
      return res.status(404).json({ error: "Proyecto no encontrado" });
    }

    let translatedMessage = commitMessageEs;
    if (!translatedMessage && commitMessage) {
      try {
        translatedMessage = await askAI(
          `Traduce este mensaje técnico de desarrollo web al español de forma clara y amigable para un cliente no técnico (máximo 1 oración, sin jerga técnica, sin mencionar nombres de archivos ni código): "${commitMessage}"`
        );
      } catch (_) {
        translatedMessage = commitMessage;
      }
    }

    const newDeploy = {
      id: `dep-${Date.now()}`,
      projectId: id,
      vercelDeploymentId: `manual-${Date.now().toString().slice(-6)}`,
      url: url || project.vercelUrl || "https://nexus-ecommerce.vercel.app",
      commitMessage: commitMessage || "Actualización del sitio realizada manualmente",
      commitMessageEs: translatedMessage || commitMessage || "Actualización de producción",
      state: state || "ready",
      createdAt: new Date().toISOString()
    };

    dbInstance.addDeploy(newDeploy);
    res.json({ success: true, deploy: newDeploy });
  });

  app.put("/api/portal/projects/:id/vercel", authenticateToken, requireAdmin, (req: any, res) => {
    const { id } = req.params;
    const { vercelProjectId, vercelUrl } = req.body;
    dbInstance.updateProject(id, { vercelProjectId, vercelUrl });
    res.json({ success: true });
  });

async function startServer() {
  // Vite integration middleware config
  if (process.env.NODE_ENV !== "production") {
    console.log("[HMR] Mounting Vite middleware for active development environment...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("[Production Mode] Serving optimized physical static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  if (!process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Express Engine Active] Listening securely on: http://0.0.0.0:${PORT}`);
    });
  }
}

startServer();
