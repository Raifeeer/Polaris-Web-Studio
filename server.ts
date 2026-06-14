import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { dbInstance } from "./server-db";

// Load environment variables
dotenv.config();

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

const RDAP_SERVERS: Record<string, string> = {
  com: 'https://rdap.verisign.com/com/v1/domain/',
  net: 'https://rdap.verisign.com/net/v1/domain/',
  org: 'https://rdap.org/domain/',
  io:  'https://rdap.nic.io/domain/',
  co:  'https://rdap.nic.co/domain/',
  app: 'https://rdap.nic.google/domain/',
  dev: 'https://rdap.nic.google/domain/',
  info: 'https://rdap.afilias.net/rdap/info/domain/',
  biz: 'https://rdap.nic.biz/domain/',
  me:  'https://rdap.nic.me/domain/',
};

const DEFAULT_RDAP = 'https://rdap.cloudflare.com/rdap/v1/domain/';

async function checkDomain(domain: string): Promise<boolean> {
  const ext = domain.split('.').pop()?.toLowerCase() || 'com';
  const baseUrl = RDAP_SERVERS[ext] || DEFAULT_RDAP;

  const response = await fetch(`${baseUrl}${encodeURIComponent(domain)}`, {
    headers: { Accept: 'application/rdap+json' },
    signal: AbortSignal.timeout(8000),
  });

  // 404 = no registrado = disponible
  // 200 = registrado = no disponible
  return response.status === 404;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middlewares for local API routes
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

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
      const available = await checkDomain(domain);
      return res.json({ available });

    } catch (err: any) {
      return res.status(502).json({ error: "Could not verify domain availability." });
    }
  });

  // --- Portal Authentication Middleware helper ---

  function authenticateToken(req: any, res: any, next: any) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Debe iniciar sesión para acceder." });

    if (!token.startsWith("user-")) {
      return res.status(403).json({ error: "Token de sesión inválido." });
    }

    const userId = token.replace("user-", "");
    const user = dbInstance.getUsers().find((u) => u.id === userId);
    if (!user) return res.status(404).json({ error: "Usuario para la sesión no encontrado." });

    req.user = user;
    next();
  }

  function requireAdmin(req: any, res: any, next: any) {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "Acceso denegado. Se requiere cuenta de Administrador." });
    }
    next();
  }

  // --- Portal Authentication Endpoints ---

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: "El email y contraseña son obligatorios." });
    }

    const emailClean = email.trim().toLowerCase();
    const user = dbInstance.getUsers().find(
      (u) => u.email.trim().toLowerCase() === emailClean && u.password === password
    );

    if (!user) {
      return res.status(401).json({ success: false, error: "El correo o contraseña ingresados son incorrectos." });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = `user-${user.id}`;
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
      password: password,
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
    const { description } = req.body;
    if (!description) return res.status(400).json({ error: "Falta la descripción del proyecto." });
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
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: "Falta el prompt" });
    try {
      const text = await askAI(prompt);
      res.json({ text });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Express Engine Active] Listening securely on: http://0.0.0.0:${PORT}`);
  });
}

startServer();
