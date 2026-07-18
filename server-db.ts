import crypto from "crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Define TypeScript structures for our localized database
export interface DbUser {
  id: string;
  email: string;
  password?: string; // Almacenada como hash scrypt (ver hashPassword). Nunca en texto plano.
  name: string;
  role: "admin" | "client";
  companyName?: string;
  deletedAt?: string;
  mustChangePassword?: boolean; // true tras el alta automática con contraseña temporal (ver auto-provision-client)
}

// --- Password hashing (scrypt, sin dependencias externas) ---
// Formato del hash almacenado:  scrypt$<saltHex>$<derivedKeyHex>
const SCRYPT_KEYLEN = 64;

/** Genera un hash scrypt con salt aleatorio para almacenar una contraseña. */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16);
  const derived = crypto.scryptSync(password, salt, SCRYPT_KEYLEN);
  return `scrypt$${salt.toString("hex")}$${derived.toString("hex")}`;
}

/** Indica si un valor almacenado ya está en formato hash scrypt. */
export function isHashedPassword(stored: string | undefined): boolean {
  return !!stored && stored.startsWith("scrypt$");
}

/**
 * Verifica una contraseña contra el valor almacenado en tiempo constante.
 * Acepta hashes scrypt y, por compatibilidad con datos heredados, también
 * contraseñas en texto plano (para poder migrarlas de forma perezosa al
 * primer inicio de sesión). Devuelve además si el valor era heredado.
 */
export function verifyPassword(
  stored: string | undefined,
  provided: string
): { valid: boolean; legacy: boolean } {
  if (!stored) return { valid: false, legacy: false };

  if (isHashedPassword(stored)) {
    const [, saltHex, hashHex] = stored.split("$");
    if (!saltHex || !hashHex) return { valid: false, legacy: false };
    try {
      const salt = Buffer.from(saltHex, "hex");
      const expected = Buffer.from(hashHex, "hex");
      const derived = crypto.scryptSync(provided, salt, expected.length);
      const valid =
        expected.length === derived.length &&
        crypto.timingSafeEqual(expected, derived);
      return { valid, legacy: false };
    } catch {
      return { valid: false, legacy: false };
    }
  }

  // Valor heredado en texto plano: comparación en tiempo constante.
  const a = Buffer.from(stored);
  const b = Buffer.from(provided);
  const valid = a.length === b.length && crypto.timingSafeEqual(a, b);
  return { valid, legacy: true };
}

export interface DbProjectPhase {
  name: string;
  status: "completed" | "active" | "pending";
  detail: string;
  eta?: string;
}

export interface DbProject {
  id: string;
  displayId: string;
  clientUserId: string;
  name: string;
  currentPhase: string;
  progress: number;
  description: string;
  status: "active" | "completed" | "on_hold";
  phases: DbProjectPhase[];
  deletedAt?: string;
  vercelProjectId?: string;  // nombre del proyecto en Vercel ej: "tano-excursions"
  vercelUrl?: string;        // URL de preview/staging ej: "https://tano-excursions.vercel.app" -- para que el cliente vea avances antes del dominio real
  customDomain?: string;     // dominio real de producción, distinto del preview de Vercel -- dispara el correo de Lanzamiento Oficial al conectarse por primera vez
  reviewUrl?: string;        // link real de reseña (Google Maps u otro) del negocio del cliente, para pedirla en el correo de lanzamiento -- se omite el CTA si no está cargado, nunca se inventa
  launchedAt?: string;       // fecha real en que se conectó customDomain por primera vez
}

export interface DbTask {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: "pending" | "approved" | "rejected";
  feedback?: string;
  link?: string;
  createdAt?: string;
  respondedAt?: string;
  archived?: boolean;
}

export interface DbInvoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue" | "void";
  date: string;
  dueDate: string;
  description: string;
  items?: { description: string; price: number; quantity: number }[]; // Varios productos/conceptos en una misma factura (ej: 2 addons separados); si está presente, "amount"/"description" son el total/resumen derivados de esta lista.
  exchangeRate?: number; // Tasa USD→DOP al momento de crear la factura, para mostrar el equivalente en RD en la impresión.
  paypalOrderId?: string;
  paypalCaptureId?: string;
  paypalRefundId?: string;
  refundedAt?: string;
  voidedAfterManualPayment?: boolean;
}

export interface DbMeeting {
  id: string;
  projectId: string;
  title: string;
  date: string;
  time: string;
  meetLink: string;
  status: "upcoming" | "completed" | "canceled";
}

export interface DbDeploy {
  id: string;
  projectId: string;
  vercelDeploymentId: string;
  url: string;
  commitMessage: string;
  commitMessageEs?: string; // traducido por Gemini
  state: "ready" | "error" | "building";
  createdAt: string;
}

export interface DatabaseSchema {
  users: DbUser[];
  projects: DbProject[];
  tasks: DbTask[];
  invoices: DbInvoice[];
  meetings: DbMeeting[];
  deploys: DbDeploy[];
  projectDisplayCounter: number;
}

// La persistencia real vive en Firestore (colección "portal_state", un solo
// documento "main" con todo el blob) — no en un archivo local. Vercel corre
// las funciones serverless sobre un filesystem de solo lectura (/var/task),
// así que escribir a un archivo ahí falla silenciosamente (EROFS) y cualquier
// cambio se pierde en el próximo cold start. Bug real encontrado en vivo el
// 17 de julio: portalDb.json nunca persistía en producción, aunque el código
// reportaba éxito (el error se registraba pero no se propagaba al caller).
const firebaseApp = getApps().length
  ? getApps()[0]
  : initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/^["']|["']$/g, "").replace(/\\n/g, "\n"),
      }),
    });
const firestore = getFirestore(firebaseApp, "polaris-web-studio");
const STATE_DOC = firestore.collection("portal_state").doc("main");

// Default initial state for self-seeding
const getInitialSeededData = (): DatabaseSchema => {
  return {
    projectDisplayCounter: 1,
    users: [
      {
        id: "usr-admin-1",
        email: "cristian2200299@gmail.com",
        // Hash scrypt de la contraseña por defecto. Cámbiala tras el primer acceso.
        password: "scrypt$c43f7c6c320c4604a9f7965c8369559c$ea715a1884e7764e9ec68fa17ae590b910a5f9152d27328476ab6c61bdc39849ce5e973746466b4a25794947182e1ab65fbbc1eb9c725e1f3b4906caae21fd97",
        name: "Cristian Dicen",
        role: "admin",
      },
      {
        id: "usr-admin-2",
        email: "admin@agencia.com",
        password: "scrypt$eba78592b92220f46489e0d30c690804$11fedf38b0d872b151ee3bb95d2ea75c32707d9096db53e93028fcce506a1fe11b6ffacc65cf19c1d86a3dd703d3fb284e92226e2d3cc2679888a7363ef27514",
        name: "Director de Proyectos",
        role: "admin",
      },
      {
        id: "usr-client-1",
        email: "nexus@client.com",
        password: "scrypt$7205c6e4520049eea25892f1a4c20577$ad4a245e141e1ea623d88f7194ad1edcaf04fdc6828beffd118159b1bd0b2ad68b252f248cbfd6d678373fe0c996aa840f912912782e1b1f63390dcbc32ce413",
        name: "Juan Pérez",
        role: "client",
        companyName: "Nexus Inc.",
      },
    ],
    projects: [
      {
        id: "proj-1",
        displayId: "001",
        clientUserId: "usr-client-1",
        name: "Nexus E-commerce",
        currentPhase: "Fase 2: Desarrollo Frontend",
        progress: 65,
        description: "Desarrollo a medida de plataforma de e-commerce de alto rendimiento con React y Node.js.",
        status: "active",
        phases: [
          {
            name: "Fase 1: Descubrimiento y UI",
            status: "completed",
            detail: "Completado el 15 de Octubre.",
          },
          {
            name: "Fase 2: Desarrollo Frontend",
            status: "active",
            detail: "En progreso. Estamos codificando los componentes de React.",
          },
          {
            name: "Fase 3: Integración Backend & QA",
            status: "pending",
            detail: "Estimado: 10 de Noviembre.",
          },
        ],
        vercelProjectId: "polaris-web-studio",
        vercelUrl: "https://polaris-web-studio-eta.vercel.app"
      },
    ],
    tasks: [
      {
        id: "task-1",
        projectId: "proj-1",
        title: "Revisar Diseños de Interfaz (Landing Page)",
        description: "Revisar los últimos mockups subidos y confirmar aprobación de la UI de escritorio.",
        status: "pending",
        link: "https://figma.com/sample-spec",
      },
    ],
    invoices: [
      {
        id: "inv-1",
        projectId: "proj-1",
        invoiceNumber: "INV-2023-089",
        amount: 649.5,
        currency: "USD",
        status: "paid",
        date: "2023-10-15",
        dueDate: "2023-10-30",
        description: "Fase de inicio y descubrimiento",
      },
    ],
    meetings: [
      {
        id: "meet-1",
        projectId: "proj-1",
        title: "Reunión de Sincronización Regular",
        date: "2026-06-15",
        time: "10:00 AM",
        meetLink: "https://meet.google.com/abc-defg-hij",
        status: "upcoming",
      },
    ],
    deploys: [],
  };
};

class PortalDatabase {
  private cache: DatabaseSchema | null = null;
  private readyPromise: Promise<void>;

  constructor() {
    this.readyPromise = this.load();
  }

  /**
   * Todas las rutas de server.ts que usan dbInstance deben esperar esto antes
   * de llamar a cualquier método (ver el middleware en server.ts) — los
   * métodos de abajo siguen siendo síncronos porque asumen que `cache` ya
   * está poblado en memoria para no tener que tocar decenas de call sites.
   */
  async waitUntilReady(): Promise<void> {
    await this.readyPromise;
  }

  // save() es fire-and-forget a propósito (para no bloquear cada mutación
  // síncrona con un round-trip a Firestore) -- pero eso es un problema real
  // en endpoints serverless de Vercel: si el handler responde con res.json()
  // antes de que la escritura asíncrona termine, el runtime puede congelar/
  // matar el proceso a mitad de la escritura, perdiendo la mutación en
  // silencio. Bug real encontrado en vivo (18 de julio): auto-provision-client
  // creaba el usuario pero el proyecto/tarea/factura desaparecían al azar.
  // Los handlers que encadenan varias mutaciones y luego responden deben
  // llamar a este flush() y esperarlo antes de mandar la respuesta.
  async flush(): Promise<void> {
    await this.saveAsync();
  }

  private async load(): Promise<void> {
    try {
      const snap = await STATE_DOC.get();
      if (snap.exists) {
        const c = snap.data() as DatabaseSchema;
        if (typeof c.projectDisplayCounter !== "number") {
          let maxNum = 0;
          if (Array.isArray(c.projects)) {
            for (const p of c.projects) {
              if (p.displayId) {
                const num = parseInt(p.displayId, 10);
                if (!isNaN(num) && num > maxNum) maxNum = num;
              }
            }
          }
          c.projectDisplayCounter = maxNum > 0 ? maxNum : 1;
        }
        if (!Array.isArray(c.users)) c.users = [];
        if (!Array.isArray(c.projects)) c.projects = [];
        if (!Array.isArray(c.tasks)) c.tasks = [];
        if (!Array.isArray(c.invoices)) c.invoices = [];
        if (!Array.isArray(c.meetings)) c.meetings = [];
        if (!Array.isArray(c.deploys)) c.deploys = [];
        this.cache = c;
      } else {
        this.cache = getInitialSeededData();
        await this.saveAsync();
        console.log("[Database Seeded] Generated persistent Firestore state at portal_state/main");
      }
    } catch (err) {
      console.error("Failed to initialize database from Firestore, falling back to in-memory fallback", err);
      this.cache = getInitialSeededData();
    }
  }

  private ensureInitialized() {
    if (!this.cache) {
      throw new Error("PortalDatabase used before waitUntilReady() resolved");
    }
  }

  private isWriting = false;
  private pendingWritePromise: Promise<void> | null = null;
  private needsWriteAgain = false;

  private save() {
    this.saveAsync().catch(err => {
      console.error("Async save failed:", err);
    });
  }

  private async saveAsync(): Promise<void> {
    if (!this.cache) return;
    if (this.isWriting) {
      this.needsWriteAgain = true;
      if (!this.pendingWritePromise) {
        this.pendingWritePromise = new Promise<void>((resolve) => {
          const check = setInterval(() => {
            if (!this.isWriting) {
              clearInterval(check);
              this.pendingWritePromise = null;
              resolve(this.saveAsync());
            }
          }, 10);
        });
      }
      return this.pendingWritePromise;
    }

    this.isWriting = true;
    this.needsWriteAgain = false;
    try {
      // JSON round-trip: Firestore rechaza `undefined` en campos de documento
      // (a diferencia de un archivo JSON, donde simplemente se omitían).
      await STATE_DOC.set(JSON.parse(JSON.stringify(this.cache)));
    } catch (err) {
      console.error("Error writing to persistent Firestore state asynchronously:", err);
    } finally {
      this.isWriting = false;
      if (this.needsWriteAgain) {
        this.needsWriteAgain = false;
        await this.saveAsync();
      }
    }
  }

  private cleanupSoftDeleted() {
    if (!this.cache) return;
    const now = Date.now();
    const ThirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
    
    // Find users to hard delete
    const usersToHardDelete = this.cache.users.filter(u => 
      u.deletedAt && now - new Date(u.deletedAt).getTime() > ThirtyDaysMs
    );
    
    if (usersToHardDelete.length > 0) {
      usersToHardDelete.forEach(u => this.hardDeleteUser(u.id));
    }
    
    // Find projects to hard delete
    const projectsToHardDelete = this.cache.projects.filter(p => 
      p.deletedAt && now - new Date(p.deletedAt).getTime() > ThirtyDaysMs
    );
    
    if (projectsToHardDelete.length > 0) {
      projectsToHardDelete.forEach(p => this.hardDeleteProject(p.id));
    }
  }

  // ID Generator Methods
  peekNextDisplayId(): string {
    this.ensureInitialized();
    return (this.cache!.projectDisplayCounter + 1).toString().padStart(6, "0");
  }

  consumeNextDisplayId(): string {
    this.ensureInitialized();
    this.cache!.projectDisplayCounter++;
    const nextId = this.cache!.projectDisplayCounter.toString().padStart(6, "0");
    this.save();
    return nextId;
  }

  // Query Methods
  getUsers(): DbUser[] {
    this.ensureInitialized();
    this.cleanupSoftDeleted();
    return this.cache!.users;
  }

  getProjects(): DbProject[] {
    this.ensureInitialized();
    this.cleanupSoftDeleted();
    return this.cache!.projects;
  }

  getTasks(): DbTask[] {
    this.ensureInitialized();
    return this.cache!.tasks;
  }

  getInvoices(): DbInvoice[] {
    this.ensureInitialized();
    return this.cache!.invoices;
  }

  getMeetings(): DbMeeting[] {
    this.ensureInitialized();
    return this.cache!.meetings;
  }

  // Mutation Methods
  addUser(user: DbUser) {
    this.ensureInitialized();
    this.cache!.users.push(user);
    this.save();
  }

  updateUser(userId: string, updates: Partial<DbUser>) {
    this.ensureInitialized();
    this.cache!.users = this.cache!.users.map((u) => {
      if (u.id === userId) {
        return { ...u, ...updates };
      }
      return u;
    });
    this.save();
  }

  deleteUser(userId: string) {
    this.ensureInitialized();
    // Soft delete
    this.updateUser(userId, { deletedAt: new Date().toISOString() });
    
    // Cascadely soft delete projects
    const clientProjects = this.cache!.projects.filter((p) => p.clientUserId === userId);
    clientProjects.forEach((p) => {
      this.updateProject(p.id, { deletedAt: new Date().toISOString() });
    });
    this.save();
  }

  restoreUser(userId: string) {
    this.ensureInitialized();
    this.cache!.users = this.cache!.users.map(u => {
      if (u.id === userId) {
        const { deletedAt, ...rest } = u;
        return rest;
      }
      return u;
    });
    
    const clientProjects = this.cache!.projects.filter((p) => p.clientUserId === userId);
    clientProjects.forEach((p) => {
      this.cache!.projects = this.cache!.projects.map(proj => {
        if (proj.id === p.id) {
          const { deletedAt, ...rest } = proj;
          return rest;
        }
        return proj;
      });
    });
    this.save();
  }

  hardDeleteUser(userId: string) {
    this.ensureInitialized();
    this.cache!.users = this.cache!.users.filter((u) => u.id !== userId);
    const clientProjects = this.cache!.projects.filter((p) => p.clientUserId === userId);
    clientProjects.forEach((p) => {
      this.hardDeleteProject(p.id);
    });
    this.save();
  }

  addProject(project: DbProject) {
    this.ensureInitialized();
    this.cache!.projects.push(project);
    this.save();
  }

  updateProject(projectId: string, updates: Partial<DbProject>) {
    this.ensureInitialized();
    this.cache!.projects = this.cache!.projects.map((p) => {
      if (p.id === projectId) {
        return { ...p, ...updates };
      }
      return p;
    });
    this.save();
  }

  deleteProject(projectId: string) {
    this.ensureInitialized();
    console.log(`Soft deleting project: ${projectId}`);
    this.updateProject(projectId, { deletedAt: new Date().toISOString() });
  }

  restoreProject(projectId: string) {
    this.ensureInitialized();
    this.cache!.projects = this.cache!.projects.map(p => {
      if (p.id === projectId) {
        const { deletedAt, ...rest } = p;
        return rest;
      }
      return p;
    });
    this.save();
  }

  hardDeleteProject(projectId: string) {
    this.ensureInitialized();
    this.cache!.projects = this.cache!.projects.filter((p) => p.id !== projectId);
    this.cache!.tasks = this.cache!.tasks.filter((t) => t.projectId !== projectId);
    this.cache!.invoices = this.cache!.invoices.filter((i) => i.projectId !== projectId);
    this.cache!.meetings = this.cache!.meetings.filter((m) => m.projectId !== projectId);
    this.save();
  }

  addTask(task: DbTask) {
    this.ensureInitialized();
    this.cache!.tasks.push(task);
    this.save();
  }

  updateTask(taskId: string, updates: Partial<DbTask>) {
    this.ensureInitialized();
    this.cache!.tasks = this.cache!.tasks.map((t) => {
      if (t.id === taskId) {
        return { ...t, ...updates };
      }
      return t;
    });
    this.save();
  }

  deleteTask(taskId: string) {
    this.ensureInitialized();
    this.cache!.tasks = this.cache!.tasks.filter((t) => t.id !== taskId);
    this.save();
  }

  addInvoice(invoice: DbInvoice) {
    this.ensureInitialized();
    this.cache!.invoices.push(invoice);
    this.save();
  }

  updateInvoice(invoiceId: string, updates: Partial<DbInvoice>) {
    this.ensureInitialized();
    this.cache!.invoices = this.cache!.invoices.map((i) => {
      if (i.id === invoiceId) {
        return { ...i, ...updates };
      }
      return i;
    });
    this.save();
  }

  deleteInvoice(invoiceId: string) {
    this.ensureInitialized();
    this.cache!.invoices = this.cache!.invoices.filter((i) => i.id !== invoiceId);
    this.save();
  }

  getDeploys(projectId?: string): DbDeploy[] {
    this.ensureInitialized();
    const all = this.cache!.deploys || [];
    return projectId ? all.filter(d => d.projectId === projectId) : all;
  }

  addDeploy(deploy: DbDeploy) {
    this.ensureInitialized();
    if (!this.cache!.deploys) this.cache!.deploys = [];
    this.cache!.deploys.unshift(deploy); // más reciente primero
    // Mantener solo los últimos 20 deploys por proyecto
    const projectDeploys = this.cache!.deploys.filter(d => d.projectId === deploy.projectId);
    if (projectDeploys.length > 20) {
      const toRemove = projectDeploys.slice(20).map(d => d.id);
      this.cache!.deploys = this.cache!.deploys.filter(d => !toRemove.includes(d.id));
    }
    this.save();
  }

  addMeeting(meeting: DbMeeting) {
    this.ensureInitialized();
    this.cache!.meetings.push(meeting);
    this.save();
  }

  updateMeeting(meetingId: string, updates: Partial<DbMeeting>) {
    this.ensureInitialized();
    this.cache!.meetings = this.cache!.meetings.map((m) => {
      if (m.id === meetingId) {
        return { ...m, ...updates };
      }
      return m;
    });
    this.save();
  }

  deleteMeeting(meetingId: string) {
    this.ensureInitialized();
    this.cache!.meetings = this.cache!.meetings.filter((m) => m.id !== meetingId);
    this.save();
  }
}

export const dbInstance = new PortalDatabase();
