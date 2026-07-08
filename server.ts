import express from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { dbInstance, hashPassword, verifyPassword } from "./server-db.js";
import generateAddonDescriptionsHandler from "./api/generate-addon-descriptions.js";

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
let FIREBASE_PROJECT_ID = "";
try {
  const cfgRaw = fs.readFileSync(
    path.join(process.cwd(), "firebase-applet-config.json"),
    "utf-8"
  );
  FIREBASE_PROJECT_ID = JSON.parse(cfgRaw).projectId || "";
} catch {
  console.warn("[Auth] No se pudo leer firebase-applet-config.json; verificación de tokens Firebase deshabilitada.");
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
// No se fija una CSP estricta para no romper Firebase/Cal.com/estilos inline.
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "geolocation=(), microphone=(), camera=()");
  res.setHeader("X-DNS-Prefetch-Control", "off");
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

  app.post("/api/generate-addon-descriptions", async (req, res) => {
    try {
      await generateAddonDescriptionsHandler(req as any, res as any);
    } catch (error: any) {
      console.error("Error generating addon descriptions:", error);
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
    const { projectId, amount, description, status, date, dueDate } = req.body;
    if (!projectId || !amount) {
      return res.status(400).json({ error: "Faltan campos obligatorios para la factura." });
    }

    const allInvoices = dbInstance.getInvoices();
    const invoiceNumber = generateInvoiceNumber(allInvoices);

    dbInstance.addInvoice({
      id: `inv-${Date.now()}`,
      projectId,
      invoiceNumber,
      amount: Number(amount),
      currency: "USD",
      status: status || "pending",
      date: date || new Date().toISOString().split("T")[0],
      dueDate: dueDate || new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      description,
    });

    res.json({ success: true, invoiceNumber });
  });

  app.post("/api/portal/invoices/:id/toggle-pay", authenticateToken, requireAdmin, (req, res) => {
    const invoices = dbInstance.getInvoices();
    const foundInvoice = invoices.find(i => i.id === req.params.id);
    if (!foundInvoice) return res.status(404).json({ error: "Factura no encontrada." });

    const nextStatus = foundInvoice.status === "paid" ? "pending" : "paid";
    dbInstance.updateInvoice(req.params.id, { status: nextStatus });
    res.json({ success: true, status: nextStatus });
  });

  app.post("/api/portal/invoices/:id/pay", authenticateToken, (req: any, res) => {
    const invoices = dbInstance.getInvoices();
    const foundInvoice = invoices.find(i => i.id === req.params.id);
    if (!foundInvoice) return res.status(404).json({ error: "Factura no encontrada." });

    const project = dbInstance.getProjects().find((p) => p.id === foundInvoice.projectId);
    if (!project) return res.status(404).json({ error: "Proyecto asociado inexistente." });

    if (req.user.role !== "admin" && project.clientUserId !== req.user.id) {
      return res.status(403).json({ error: "Acceso denegado. No tiene permisos sobre esta factura." });
    }

    dbInstance.updateInvoice(req.params.id, { status: "paid" });
    res.json({ success: true, status: "paid" });
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
    const { taskTitle, projectName } = req.body;
    if (!taskTitle) return res.status(400).json({ error: "Faltan datos" });
    try {
      const text = await askAI(
        `Eres un project manager de Polaris Web Studio. 
         Escribe una descripción breve en español (máximo 1 o 2 oraciones cortas) para el cliente 
         sobre el entregable "${taskTitle}" del proyecto "${projectName || "web"}". 
         Explica brevemente qué debe revisar el cliente. Tono profesional pero accesible.
         REGLA MUY IMPORTANTE: Devuelve SOLO la descripción, DIRECTO AL GRANO. NO incluyas introducciones como "Aquí tienes...", ni texto extra.`
      );
      res.json({ text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  // IA: Generar glosa de factura
  app.post("/api/ai/invoice-description", authenticateToken, requireAdmin, async (req, res) => {
    const { projectName, amount, phase } = req.body;
    if (!amount) return res.status(400).json({ error: "Faltan datos" });
    try {
      const text = await askAI(
        `Eres el área de facturación de Polaris Web Studio. 
         Escribe una glosa formal en español (máximo 1 oración) para una factura de $${amount} USD 
         del proyecto "${projectName}"${phase ? ` correspondiente a "${phase}"` : ""}. 
         Formato: "Servicios de desarrollo web correspondientes a [concepto específico]..."`
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
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== "string") return res.status(400).json({ error: "Falta el prompt" });
    if (prompt.length > 4000) return res.status(400).json({ error: "El prompt es demasiado largo." });
    try {
      const text = await askAI(prompt);
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
