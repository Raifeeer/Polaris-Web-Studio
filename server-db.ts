import fs from "fs";
import path from "path";

// Define TypeScript structures for our localized database
export interface DbUser {
  id: string;
  email: string;
  password?: string; // Stored securely
  name: string;
  role: "admin" | "client";
  companyName?: string;
  deletedAt?: string;
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
}

export interface DbInvoice {
  id: string;
  projectId: string;
  invoiceNumber: string;
  amount: number;
  currency: string;
  status: "paid" | "pending" | "overdue";
  date: string;
  dueDate: string;
  description: string;
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

export interface DatabaseSchema {
  users: DbUser[];
  projects: DbProject[];
  tasks: DbTask[];
  invoices: DbInvoice[];
  meetings: DbMeeting[];
  projectDisplayCounter: number;
}

const DB_FILE_PATH = path.join(process.cwd(), "portalDb.json");

// Default initial state for self-seeding
const getInitialSeededData = (): DatabaseSchema => {
  return {
    projectDisplayCounter: 1,
    users: [
      {
        id: "usr-admin-1",
        email: "cristian2200299@gmail.com",
        password: "admin123",
        name: "Cristian Dicen",
        role: "admin",
      },
      {
        id: "usr-admin-2",
        email: "admin@agencia.com",
        password: "admin123",
        name: "Director de Proyectos",
        role: "admin",
      },
      {
        id: "usr-client-1",
        email: "nexus@client.com",
        password: "client123",
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
  };
};

class PortalDatabase {
  private cache: DatabaseSchema | null = null;

  constructor() {
    this.ensureInitialized();
  }

  private ensureInitialized() {
    if (this.cache) return;

    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const raw = fs.readFileSync(DB_FILE_PATH, "utf-8");
        this.cache = JSON.parse(raw);
        
        // Safety check to ensure crucial fields are arrays
        const c = this.cache!;
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
      } else {
        this.cache = getInitialSeededData();
        this.save();
        console.log(`[Database Seeded] Generated persistent JSON database at ${DB_FILE_PATH}`);
      }
    } catch (err) {
      console.error("Failed to initialize database, falling back to in-memory fallback", err);
      this.cache = getInitialSeededData();
    }
  }

  private save() {
    if (!this.cache) return;
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.cache, null, 2), "utf-8");
    } catch (err) {
      console.error("Error writing to persistent JSON db:", err);
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
