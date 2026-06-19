import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getFirestore, FieldValue, type Firestore } from "firebase-admin/firestore";

// Mismo proyecto/base de datos de Firestore que usa el cliente (src/lib/firebase.ts).
// No es información sensible: ya viaja embebida en el bundle del navegador.
const FIRESTORE_DATABASE_ID = "ai-studio-8ddcd590-1853-43f8-9f2b-5252f1d50a75";

// Define TypeScript structures for our portal database
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
  vercelProjectId?: string;  // nombre del proyecto en Vercel ej: "tano-excursions"
  vercelUrl?: string;        // URL de producción ej: "https://tano-excursions.vercel.app"
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

interface DatabaseSchema {
  users: DbUser[];
  projects: DbProject[];
  tasks: DbTask[];
  invoices: DbInvoice[];
  meetings: DbMeeting[];
  deploys: DbDeploy[];
  projectDisplayCounter: number;
}

const COLLECTIONS = {
  users: "portal_users",
  projects: "portal_projects",
  tasks: "portal_tasks",
  invoices: "portal_invoices",
  meetings: "portal_meetings",
  deploys: "portal_deploys",
  meta: "portal_meta",
} as const;

// Default initial state used to seed Firestore the very first time it's empty
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
        displayId: "000001",
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

let firestoreDb: Firestore | null = null;

function getDb(): Firestore {
  if (firestoreDb) return firestoreDb;

  if (!getApps().length) {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

    if (!projectId || !clientEmail || !privateKey) {
      throw new Error(
        "Faltan credenciales de Firebase Admin. Configura FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL y FIREBASE_PRIVATE_KEY en las variables de entorno."
      );
    }

    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }

  firestoreDb = getFirestore(getApps()[0], FIRESTORE_DATABASE_ID);
  return firestoreDb;
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

class PortalDatabase {
  private seeded = false;

  // Ensures Firestore has at least the initial seed data the very first time it's used.
  private async ensureSeeded() {
    if (this.seeded) return;

    const db = getDb();
    const snap = await db.collection(COLLECTIONS.users).limit(1).get();
    if (snap.empty) {
      const data = getInitialSeededData();
      const batch = db.batch();
      data.users.forEach((u) => batch.set(db.collection(COLLECTIONS.users).doc(u.id), u));
      data.projects.forEach((p) => batch.set(db.collection(COLLECTIONS.projects).doc(p.id), p));
      data.tasks.forEach((t) => batch.set(db.collection(COLLECTIONS.tasks).doc(t.id), t));
      data.invoices.forEach((i) => batch.set(db.collection(COLLECTIONS.invoices).doc(i.id), i));
      data.meetings.forEach((m) => batch.set(db.collection(COLLECTIONS.meetings).doc(m.id), m));
      batch.set(db.collection(COLLECTIONS.meta).doc("counters"), {
        projectDisplayCounter: data.projectDisplayCounter,
      });
      await batch.commit();
      console.log("[Firestore Seeded] Datos iniciales del portal creados.");
    }

    this.seeded = true;
  }

  // ID Generator Methods
  async peekNextDisplayId(): Promise<string> {
    await this.ensureSeeded();
    const snap = await getDb().collection(COLLECTIONS.meta).doc("counters").get();
    const current = snap.exists ? (snap.data()!.projectDisplayCounter as number) : 0;
    return (current + 1).toString().padStart(6, "0");
  }

  async consumeNextDisplayId(): Promise<string> {
    await this.ensureSeeded();
    const ref = getDb().collection(COLLECTIONS.meta).doc("counters");
    const next = await getDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const current = snap.exists ? (snap.data()!.projectDisplayCounter as number) : 0;
      const value = current + 1;
      tx.set(ref, { projectDisplayCounter: value }, { merge: true });
      return value;
    });
    return next.toString().padStart(6, "0");
  }

  // Query Methods
  async getUsers(): Promise<DbUser[]> {
    await this.ensureSeeded();
    const snap = await getDb().collection(COLLECTIONS.users).get();
    let users = snap.docs.map((d) => d.data() as DbUser);

    const now = Date.now();
    const expired = users.filter((u) => u.deletedAt && now - new Date(u.deletedAt).getTime() > THIRTY_DAYS_MS);
    if (expired.length) {
      await Promise.all(expired.map((u) => this.hardDeleteUser(u.id)));
      const expiredIds = new Set(expired.map((u) => u.id));
      users = users.filter((u) => !expiredIds.has(u.id));
    }

    return users;
  }

  async getProjects(): Promise<DbProject[]> {
    await this.ensureSeeded();
    const snap = await getDb().collection(COLLECTIONS.projects).get();
    let projects = snap.docs.map((d) => d.data() as DbProject);

    const now = Date.now();
    const expired = projects.filter((p) => p.deletedAt && now - new Date(p.deletedAt).getTime() > THIRTY_DAYS_MS);
    if (expired.length) {
      await Promise.all(expired.map((p) => this.hardDeleteProject(p.id)));
      const expiredIds = new Set(expired.map((p) => p.id));
      projects = projects.filter((p) => !expiredIds.has(p.id));
    }

    return projects;
  }

  async getTasks(): Promise<DbTask[]> {
    await this.ensureSeeded();
    const snap = await getDb().collection(COLLECTIONS.tasks).get();
    return snap.docs.map((d) => d.data() as DbTask);
  }

  async getInvoices(): Promise<DbInvoice[]> {
    await this.ensureSeeded();
    const snap = await getDb().collection(COLLECTIONS.invoices).get();
    return snap.docs.map((d) => d.data() as DbInvoice);
  }

  async getMeetings(): Promise<DbMeeting[]> {
    await this.ensureSeeded();
    const snap = await getDb().collection(COLLECTIONS.meetings).get();
    return snap.docs.map((d) => d.data() as DbMeeting);
  }

  // Mutation Methods
  async addUser(user: DbUser) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.users).doc(user.id).set(user);
  }

  async updateUser(userId: string, updates: Partial<DbUser>) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.users).doc(userId).set(updates, { merge: true });
  }

  async deleteUser(userId: string) {
    await this.ensureSeeded();
    // Soft delete
    await this.updateUser(userId, { deletedAt: new Date().toISOString() });

    // Cascade soft delete to the client's projects
    const db = getDb();
    const projectsSnap = await db.collection(COLLECTIONS.projects).where("clientUserId", "==", userId).get();
    await Promise.all(
      projectsSnap.docs.map((d) => this.updateProject(d.id, { deletedAt: new Date().toISOString() }))
    );
  }

  async restoreUser(userId: string) {
    await this.ensureSeeded();
    const db = getDb();
    await db.collection(COLLECTIONS.users).doc(userId).update({ deletedAt: FieldValue.delete() });

    const projectsSnap = await db.collection(COLLECTIONS.projects).where("clientUserId", "==", userId).get();
    await Promise.all(
      projectsSnap.docs.map((d) => d.ref.update({ deletedAt: FieldValue.delete() }))
    );
  }

  async hardDeleteUser(userId: string) {
    await this.ensureSeeded();
    const db = getDb();
    const projectsSnap = await db.collection(COLLECTIONS.projects).where("clientUserId", "==", userId).get();
    await Promise.all(projectsSnap.docs.map((d) => this.hardDeleteProject(d.id)));
    await db.collection(COLLECTIONS.users).doc(userId).delete();
  }

  async addProject(project: DbProject) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.projects).doc(project.id).set(project);
  }

  async updateProject(projectId: string, updates: Partial<DbProject>) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.projects).doc(projectId).set(updates, { merge: true });
  }

  async deleteProject(projectId: string) {
    await this.ensureSeeded();
    console.log(`Soft deleting project: ${projectId}`);
    await this.updateProject(projectId, { deletedAt: new Date().toISOString() });
  }

  async restoreProject(projectId: string) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.projects).doc(projectId).update({ deletedAt: FieldValue.delete() });
  }

  async hardDeleteProject(projectId: string) {
    await this.ensureSeeded();
    const db = getDb();
    const [tasksSnap, invoicesSnap, meetingsSnap] = await Promise.all([
      db.collection(COLLECTIONS.tasks).where("projectId", "==", projectId).get(),
      db.collection(COLLECTIONS.invoices).where("projectId", "==", projectId).get(),
      db.collection(COLLECTIONS.meetings).where("projectId", "==", projectId).get(),
    ]);
    await Promise.all([
      ...tasksSnap.docs.map((d) => d.ref.delete()),
      ...invoicesSnap.docs.map((d) => d.ref.delete()),
      ...meetingsSnap.docs.map((d) => d.ref.delete()),
      db.collection(COLLECTIONS.projects).doc(projectId).delete(),
    ]);
  }

  async addTask(task: DbTask) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.tasks).doc(task.id).set(task);
  }

  async updateTask(taskId: string, updates: Partial<DbTask>) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.tasks).doc(taskId).set(updates, { merge: true });
  }

  async deleteTask(taskId: string) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.tasks).doc(taskId).delete();
  }

  async addInvoice(invoice: DbInvoice) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.invoices).doc(invoice.id).set(invoice);
  }

  async updateInvoice(invoiceId: string, updates: Partial<DbInvoice>) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.invoices).doc(invoiceId).set(updates, { merge: true });
  }

  async deleteInvoice(invoiceId: string) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.invoices).doc(invoiceId).delete();
  }

  async getDeploys(projectId?: string): Promise<DbDeploy[]> {
    await this.ensureSeeded();
    const db = getDb();
    const query = projectId
      ? db.collection(COLLECTIONS.deploys).where("projectId", "==", projectId)
      : db.collection(COLLECTIONS.deploys);
    const snap = await query.get();
    const deploys = snap.docs.map((d) => d.data() as DbDeploy);
    return deploys.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  async addDeploy(deploy: DbDeploy) {
    await this.ensureSeeded();
    const db = getDb();
    await db.collection(COLLECTIONS.deploys).doc(deploy.id).set(deploy);

    // Mantener solo los últimos 20 deploys por proyecto
    const projectDeploys = await this.getDeploys(deploy.projectId);
    if (projectDeploys.length > 20) {
      const toRemove = projectDeploys.slice(20);
      await Promise.all(toRemove.map((d) => db.collection(COLLECTIONS.deploys).doc(d.id).delete()));
    }
  }

  async addMeeting(meeting: DbMeeting) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.meetings).doc(meeting.id).set(meeting);
  }

  async updateMeeting(meetingId: string, updates: Partial<DbMeeting>) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.meetings).doc(meetingId).set(updates, { merge: true });
  }

  async deleteMeeting(meetingId: string) {
    await this.ensureSeeded();
    await getDb().collection(COLLECTIONS.meetings).doc(meetingId).delete();
  }
}

export const dbInstance = new PortalDatabase();
