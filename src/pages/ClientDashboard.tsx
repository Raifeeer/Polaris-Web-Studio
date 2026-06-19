import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LogOut,
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  Download,
  Plus,
  Trash2,
  Check,
  Copy,
  X,
  ExternalLink,
  PlusCircle,
  TrendingUp,
  Briefcase,
  Users,
  Settings,
  DollarSign,
  AlertCircle,
  CheckCircle,
  HelpCircle,
  MessageCircle,
  RefreshCw,
  Send,
  UserPlus,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  Globe
} from "lucide-react";
import Logo from "../components/Logo";
import { T, useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const { user, logout, token } = useAuth();

  // Redirect if not authenticated
  useEffect(() => {
    if (!user && !localStorage.getItem("portal_token")) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Tab State
  const [activeTab, setActiveTab] = useState<"overview" | "tasks" | "invoices" | "meetings" | "updates" | "admin-clients" | "admin-config">("overview");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const selectTab = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setMobileNavOpen(false);
  };
  const [deploys, setDeploys] = useState<any[]>([]);
  const [editVercelId, setEditVercelId] = useState("");
  const [generatedSecret, setGeneratedSecret] = useState("");
  const [secretCopied, setSecretCopied] = useState(false);

  const generateWebhookSecret = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const array = new Uint8Array(20);
    crypto.getRandomValues(array);
    const random = Array.from(array)
      .map(b => chars[b % chars.length])
      .join("");
    const year = new Date().getFullYear();
    const secret = `pk_polaris_${year}_${random}`;
    setGeneratedSecret(secret);
    setSecretCopied(false);
  };

  const copySecret = async () => {
    if (!generatedSecret) return;
    await navigator.clipboard.writeText(generatedSecret);
    setSecretCopied(true);
    setTimeout(() => setSecretCopied(false), 2000);
  };

  const [urlCopied, setUrlCopied] = useState(false);
  const copyProductionUrl = async (url: string) => {
    await navigator.clipboard.writeText(url);
    setUrlCopied(true);
    setTimeout(() => setUrlCopied(false), 2000);
  };

  // Dashboard Data State
  const [data, setData] = useState<{
    clients?: any[];
    projects: any[];
    tasks: any[];
    invoices: any[];
    meetings: any[];
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Real-time Clock State
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Password Visibility State for client creation
  const [showRegPassword, setShowRegPassword] = useState(false);

  // Pagination States (5 items per page)
  const [tasksPage, setTasksPage] = useState(1);
  const [invoicesPage, setInvoicesPage] = useState(1);
  const [meetingsPage, setMeetingsPage] = useState(1);
  const [projectsPage, setProjectsPage] = useState(1);
  const itemsPerPage = 5;

  // Invoice Checkout Modal States
  const [payingInvoice, setPayingInvoice] = useState<any | null>(null);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [ccNumber, setCcNumber] = useState("");
  const [ccExpiry, setCcExpiry] = useState("");
  const [ccCvc, setCcCvc] = useState("");
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Forms / Management States
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [feedbackTaskId, setFeedbackTaskId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // New Client Form
  const [newClientName, setNewClientName] = useState("");
  const [newClientEmail, setNewClientEmail] = useState("");
  const [newClientPassword, setNewClientPassword] = useState("");
  const [newClientCompany, setNewClientCompany] = useState("");
  const [newClientProjectName, setNewClientProjectName] = useState("");
  const [newClientProjectDesc, setNewClientProjectDesc] = useState("");
  const [aiLoadingProjectDesc, setAiLoadingProjectDesc] = useState(false);

  // New Deliverable Form
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const [newTaskDesc, setNewTaskDesc] = useState("");
  const [newTaskLink, setNewTaskLink] = useState("");
  const [aiLoadingTaskTitle, setAiLoadingTaskTitle] = useState(false);
  const [aiLoadingTaskDesc, setAiLoadingTaskDesc] = useState(false);

  // New Invoice Form
  const [newInvoiceAmount, setNewInvoiceAmount] = useState("");
  const [newInvoiceDesc, setNewInvoiceDesc] = useState("");
  const [aiLoadingInvoiceDesc, setAiLoadingInvoiceDesc] = useState(false);

  // AI Progress form
  const [aiLoadingProgress, setAiLoadingProgress] = useState<string | null>(null);

  // New Meeting Form
  const [newMeetTitle, setNewMeetTitle] = useState("");
  const [newMeetDate, setNewMeetDate] = useState("");
  const [newMeetTime, setNewMeetTime] = useState("");
  const [newMeetLink, setNewMeetLink] = useState("");

  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [aiSummaryLoading, setAiSummaryLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role: "user"|"assistant", text: string}[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Change Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [newPasswordValue, setNewPasswordValue] = useState("");
  const [passwordChangeSuccess, setPasswordChangeSuccess] = useState<string | null>(null);
  const [passwordChangeError, setPasswordChangeError] = useState<string | null>(null);
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  const isAdmin = user?.role === "admin";

  // Auto-hide notifications
  useEffect(() => {
    if (successMsg || errorMsg) {
      const timer = setTimeout(() => {
        setSuccessMsg(null);
        setErrorMsg(null);
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [successMsg, errorMsg]);

  // Compute next project display ID
  const nextProjectDisplayId = React.useMemo(() => {
    return data?.nextProjectDisplayId || "000001";
  }, [data]);

  // Fetch data
  useEffect(() => {
    if (!token) return;
    if (!data) setLoading(true);
    fetch("/api/portal/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el dashboard");
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        // Default select first project for admin tasks
        if (resData.projects && resData.projects.length > 0) {
          setSelectedProjectId((prev) => prev || resData.projects[0].id);
        }
        setLoading(false);
        if (resData.projects && resData.projects.length > 0 && !isAdmin) {
          generateClientSummary(resData.projects[0]);
        }
      })
      .catch((err) => {
        console.error("Dashboard fetch error:", err);
        setLoading(false);
      });
  }, [token, refreshTrigger]);

  // Fetch deploys when selectedProjectId changes
  useEffect(() => {
    if (!token || !selectedProjectId) return;
    fetch(`/api/portal/deploys/${selectedProjectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar los despliegues");
        return res.json();
      })
      .then((d) => {
        if (Array.isArray(d)) {
          setDeploys(d);
        }
      })
      .catch((err) => {
        console.error("Error fetching deploys:", err);
      });
  }, [token, selectedProjectId, refreshTrigger]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPasswordValue || newPasswordValue.length < 6) {
      setPasswordChangeError(language === "es" ? "La contraseña debe tener al menos 6 caracteres." : "Password must be at least 6 characters.");
      return;
    }

    setPasswordChangeLoading(true);
    setPasswordChangeError(null);
    setPasswordChangeSuccess(null);

    try {
      const { auth } = await import("../lib/firebase");
      const currentUser = auth.currentUser;
      if (currentUser) {
        const { updatePassword } = await import("firebase/auth");
        await updatePassword(currentUser, newPasswordValue);
        setPasswordChangeSuccess(language === "es" ? "¡Contraseña actualizada con éxito en Firebase!" : "Password updated successfully in Firebase Auth!");
        setNewPasswordValue("");
        setTimeout(() => {
          setShowPasswordModal(false);
          setPasswordChangeSuccess(null);
        }, 2200);
      } else {
        setPasswordChangeError(
          language === "es" 
            ? "No se pudo cambiar la contraseña. Asegúrate de estar autenticado a través de Firebase Auth." 
            : "Could not change password. Make sure you are authenticated with Firebase Auth."
        );
      }
    } catch (err: any) {
      console.error(err);
      if (err.code === "auth/requires-recent-login") {
        setPasswordChangeError(
          language === "es" 
            ? "Por seguridad, para cambiar su contraseña debe haber iniciado sesión recientemente. Por favor, cierre e inicie sesión de nuevo." 
            : "For security, changing password requires a recent login. Please log out and log back in."
        );
      } else {
        setPasswordChangeError(err.message || "Error al actualizar contraseña.");
      }
    } finally {
      setPasswordChangeLoading(false);
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const callAI = async (endpoint: string, body: object): Promise<string> => {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || `Error ${res.status}`);
    }
    if (!data.text && !data.suggestedProgress) {
      throw new Error("La IA no devolvió respuesta. Verifica que GEMINI_API_KEY esté configurada en los Secrets de AI Studio.");
    }
    return data.text || JSON.stringify(data);
  };

  const askAIFrontend = async (prompt: string): Promise<string> => {
    const geminiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
  
    // Intentar Gemini directo primero
    if (geminiKey) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { maxOutputTokens: 400, temperature: 0.7 }
            })
          }
        );
        const data = await res.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
        if (text) return text;
      } catch (_) {}
    }
  
    // Fallback seguro: pasar por el servidor (tiene Gemini + Grok sin exponer keys)
    const res = await fetch("/api/ai/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Error de IA");
    if (!data.text) throw new Error("Sin respuesta de IA");
    return data.text;
  };

  const generateClientSummary = async (project: any) => {
    if (isAdmin || !project || aiSummary) return;
    setAiSummaryLoading(true);
    try {
      const approved = data?.tasks.filter((t: any) => t.projectId === project.id && t.status === "approved").length || 0;
      const pending = data?.tasks.filter((t: any) => t.projectId === project.id && t.status === "pending").length || 0;
      const pendingInvoices = data?.invoices.filter((i: any) => i.projectId === project.id && i.status === "pending").length || 0;
      const completedPhases = project.phases.filter((p: any) => p.status === "completed").length;
      const totalPhases = project.phases.length;
      const remainingPhases = totalPhases - completedPhases;
  
      const weeksEstimate = remainingPhases <= 0 ? 0 : remainingPhases * 2;
  
      const text = await askAIFrontend(
        `Eres el asistente amigable de Polaris Web Studio. Escribe un resumen breve en español 
         (máximo 2 oraciones, tono cercano y positivo, tutéalo) para el cliente dueño del proyecto 
         "${project.name}" que está al ${project.progress}% en la fase "${project.currentPhase}".
         Tiene ${approved} entregables aprobados${pending > 0 ? `, ${pending} pendiente(s) de revisar` : ""
         }${pendingInvoices > 0 ? ` y ${pendingInvoices} factura(s) por pagar` : ""}.
         ${weeksEstimate > 0 ? `Estima que faltan aproximadamente ${weeksEstimate} semanas para completar.` : "El proyecto está casi terminado."}
         Sé específico con los datos, no genérico.`
      );
      setAiSummary(text);
    } catch (e) {
      setAiSummary(null);
    } finally {
      setAiSummaryLoading(false);
    }
  };

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewClientPassword(password);
    setShowRegPassword(true);
  };

  // ----------------------------------------------------
  // ADMIN MUTATIONS
  // ----------------------------------------------------

  // 1. Create client and initial setup
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName || !newClientEmail || !newClientPassword || !newClientCompany || !newClientProjectName) {
      setErrorMsg(language === "es" ? "Por favor, rellene todos los campos obligatorios." : "Please fill in all required fields.");
      return;
    }

    try {
      const response = await fetch("/api/portal/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: newClientEmail,
          password: newClientPassword,
          name: newClientName,
          companyName: newClientCompany,
          projectName: newClientProjectName,
          projectDescription: newClientProjectDesc,
        }),
      });

      const resData = await response.json();
      if (response.ok) {
        // Register user in Firebase Auth dynamically in background so they have immediate Auth credentials without admin logout
        try {
          const { initializeApp, deleteApp } = await import("firebase/app");
          const { getAuth, createUserWithEmailAndPassword, signOut } = await import("firebase/auth");
          const firebaseConfig = (await import("../../firebase-applet-config.json")).default;

          const tempApp = initializeApp(firebaseConfig, `TempApp-${Date.now()}`);
          const tempAuth = getAuth(tempApp);
          
          await createUserWithEmailAndPassword(tempAuth, newClientEmail.trim().toLowerCase(), newClientPassword);
          await signOut(tempAuth);
          await deleteApp(tempApp);
          console.log("Pre-creación de cuenta Firebase Auth del cliente completada con éxito.");
        } catch (fbCreateErr: any) {
          console.warn("No se pudo pre-crear la cuenta de Firebase del cliente (se creará de forma dinámica en su primer inicio de sesión):", fbCreateErr);
        }

        setSuccessMsg(
          language === "es"
            ? "¡Cliente registrado con éxito! Se ha generado su proyecto de forma automática con fases, entregable y factura de inicio."
            : "Client registered successfully! A project has been automatically generated with phases, deliverable and initial invoice."
        );
        // Clear inputs
        setNewClientName("");
        setNewClientEmail("");
        setNewClientPassword("");
        setNewClientCompany("");
        setNewClientProjectName("");
        setNewClientProjectDesc("");
        // Refresh data
        setRefreshTrigger((prev) => prev + 1);
        setActiveTab("overview");
      } else {
        setErrorMsg(resData.error || (language === "es" ? "No se pudo registrar." : "Could not register."));
      }
    } catch (err) {
      setErrorMsg(language === "es" ? "Ocurrió un error." : "An error occurred.");
    }
  };

  const handleDeleteProject = async (projectId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar este proyecto? Pasará a la papelera por 30 días.")) return;
    try {
      const response = await fetch(`/api/portal/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errorText = await response.text();
        console.error("Delete project failed:", response.status, errorText);
        alert(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error: ${err}`);
    }
  };

  // 2. Delete Client Account
  const handleDeleteClient = async (clientId: string) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta cuenta y proyecto? Pasará a la papelera por 30 días, en donde luego se borrará permanentemente.")) return;
    console.log("Delete client clicked for ID:", clientId);
    try {
      const response = await fetch(`/api/portal/clients/${clientId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Delete client response:", response.status);
      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errorText = await response.text();
        console.error("Delete client failed:", response.status, errorText);
        alert(`Error: ${errorText}`);
      }
    } catch (err) {
      console.error(err);
      alert(`Error: ${err}`);
    }
  };

  const handleRestoreClient = async (clientId: string) => {
    try {
      const response = await fetch(`/api/portal/clients/${clientId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestoreProject = async (projectId: string) => {
    try {
      const response = await fetch(`/api/portal/projects/${projectId}/restore`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        setRefreshTrigger((prev) => prev + 1);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // 3. Update Project Progress
  const handleUpdateProjectProgress = async (projectId: string, progress: number, currentPhase: string, phases: any[]) => {
    try {
      await fetch(`/api/portal/projects/${projectId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          progress,
          currentPhase,
          phases,
        }),
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // Toggle active phase item
  const togglePhaseStatus = (project: any, phaseIndex: number) => {
    const updatedPhases = [...project.phases];
    const currentStatus = updatedPhases[phaseIndex].status;
    let nextStatus: "pending" | "active" | "completed" = "pending";
    if (currentStatus === "pending") nextStatus = "active";
    else if (currentStatus === "active") nextStatus = "completed";
    else nextStatus = "pending";

    updatedPhases[phaseIndex].status = nextStatus;

    // Auto set current active phase description text
    const activePhase = updatedPhases.find(p => p.status === "active") || updatedPhases[updatedPhases.length - 1];
    const progressMap = [25, 65, 100];
    const nextProgress = phaseIndex === 0 && nextStatus === "active" ? 25 : phaseIndex === 1 && nextStatus === "active" ? 65 : phaseIndex === 2 && nextStatus === "active" ? 90 : 100;

    handleUpdateProjectProgress(project.id, nextProgress, activePhase.name, updatedPhases).then(() => {
      const phaseLabels = language === "es"
        ? { completed: "Listo", active: "En Curso", pending: "Pendiente" }
        : { completed: "Done", active: "In Progress", pending: "Pending" };
      setSuccessMsg(`${language === "es" ? "Fase actualizada a:" : "Phase updated to:"} ${phaseLabels[nextStatus as keyof typeof phaseLabels]}`);
    });
  };

  // 4. Create deliverable
  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newTaskTitle) return;

    try {
      const response = await fetch("/api/portal/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: newTaskTitle,
          description: newTaskDesc,
          link: newTaskLink,
        }),
      });
      if (response.ok) {
        setNewTaskTitle("");
        setNewTaskDesc("");
        setNewTaskLink("");
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(language === "es" ? "¡Entregable creado con éxito y notificado!" : "Deliverable created successfully and notified!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!window.confirm("¿Eliminar este entregable?")) return;
    try {
      await fetch(`/api/portal/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // 5. Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newInvoiceAmount) return;

    try {
      const response = await fetch("/api/portal/invoices", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          amount: parseFloat(newInvoiceAmount),
          description: newInvoiceDesc,
        }),
      });
      if (response.ok) {
        const resData = await response.json();
        setNewInvoiceAmount("");
        setNewInvoiceDesc("");
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(`¡Factura ${resData.invoiceNumber} creada y registrada exitosamente!`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleInvoicePaid = async (invoiceId: string) => {
    try {
      await fetch(`/api/portal/invoices/${invoiceId}/toggle-pay`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteInvoice = async (invoiceId: string) => {
    if (!window.confirm("¿Eliminar esta factura?")) return;
    try {
      await fetch(`/api/portal/invoices/${invoiceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // 6. Schedule Meeting
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId || !newMeetTitle || !newMeetDate || !newMeetTime) return;

    try {
      const response = await fetch("/api/portal/meetings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProjectId,
          title: newMeetTitle,
          date: newMeetDate,
          time: newMeetTime,
          meetLink: newMeetLink,
        }),
      });
      if (response.ok) {
        setNewMeetTitle("");
        setNewMeetDate("");
        setNewMeetTime("");
        setNewMeetLink("");
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(language === "es" ? "¡Reunión agendada!" : "Meeting scheduled!");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteMeeting = async (meetingId: string) => {
    if (!window.confirm("¿Eliminar esta reunión de la agenda?")) return;
    try {
      await fetch(`/api/portal/meetings/${meetingId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      setRefreshTrigger((prev) => prev + 1);
    } catch (err) {
      console.error(err);
    }
  };

  // ----------------------------------------------------
  // CLIENT ACTIONS
  // ----------------------------------------------------
  const handleClientRespondTask = async (taskId: string, status: "approved" | "rejected") => {
    try {
      const response = await fetch(`/api/portal/tasks/${taskId}/respond`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          feedback: feedbackText,
        }),
      });

      if (response.ok) {
        setFeedbackTaskId(null);
        setFeedbackText("");
        setRefreshTrigger((prev) => prev + 1);
        setSuccessMsg(
          status === "approved"
            ? (language === "es" 
                ? "¡Entregable aprobado de forma oficial! Tu manager ha sido notificado para avanzar al siguiente módulo."
                : "Deliverable officially approved! Your manager has been notified to advance to the next module.")
            : (language === "es" ? "Feedback registrado. Revisaremos tus observaciones." : "Feedback registered. We will review your observations.")
        );
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Helpers
  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat("es-US", { style: "currency", currency: "USD" }).format(amount);
  };

  if (!user || loading) {
    return (
      <div className="fixed inset-0 bg-[var(--color-surface-base)] flex flex-col items-center justify-center gap-4 z-50">
        <div className="w-12 h-12 rounded-full border-2 border-[var(--color-primary-base)] border-t-transparent animate-spin" />
        <p className="text-xs text-[var(--color-text-secondary)] font-mono tracking-wider">
          <T en="Loading your workspace...">Cargando tu área de trabajo por favor espera...</T>
        </p>
      </div>
    );
  }

  const printInvoice = (inv: any) => {
    const project = data?.projects.find((p: any) => p.id === inv.projectId);
    const printWindow = window.open("", "_blank", "width=800,height=600");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8">
        <title>Factura ${inv.invoiceNumber}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Arial', sans-serif; color: #1e293b; background: #fff; padding: 48px; }
          .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 48px; padding-bottom: 24px; border-bottom: 2px solid #e2e8f0; }
          .brand { display: flex; flex-direction: column; gap: 4px; }
          .brand-name { font-size: 22px; font-weight: 900; letter-spacing: -0.5px; color: #0f172a; }
          .brand-sub { font-size: 10px; font-weight: 700; color: #6366f1; letter-spacing: 3px; text-transform: uppercase; }
          .invoice-meta { text-align: right; }
          .invoice-num { font-size: 20px; font-weight: 900; color: #6366f1; }
          .invoice-label { font-size: 10px; color: #94a3b8; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }
          .status-badge { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 6px; background: ${inv.status === "paid" ? "#dcfce7" : "#fef9c3"}; color: ${inv.status === "paid" ? "#15803d" : "#854d0e"}; }
          .section { margin-bottom: 32px; }
          .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #94a3b8; margin-bottom: 12px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
          .info-item label { font-size: 10px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 3px; }
          .info-item span { font-size: 13px; color: #1e293b; font-weight: 600; }
          .amount-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; text-align: center; margin: 32px 0; }
          .amount-label { font-size: 11px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; margin-bottom: 8px; }
          .amount-value { font-size: 42px; font-weight: 900; color: #0f172a; letter-spacing: -1px; }
          .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; align-items: center; }
          .footer-note { font-size: 11px; color: #94a3b8; }
          .footer-brand { font-size: 11px; font-weight: 700; color: #6366f1; }
          @media print { body { padding: 32px; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">
            <span class="brand-name">Polaris</span>
            <span class="brand-sub">Web Studio</span>
          </div>
          <div class="invoice-meta">
            <div class="invoice-label">Número de Factura</div>
            <div class="invoice-num">${inv.invoiceNumber}</div>
            <div class="status-badge">${inv.status === "paid" ? "Pagada" : "Pendiente"}</div>
          </div>
        </div>
  
        <div class="section">
          <div class="section-title">Detalles de Facturación</div>
          <div class="info-grid">
            <div class="info-item">
              <label>Proyecto</label>
              <span>${project?.name || "—"}</span>
            </div>
            <div class="info-item">
              <label>Cliente</label>
              <span>${user?.name || "—"}</span>
            </div>
            <div class="info-item">
              <label>Fecha de Emisión</label>
              <span>${inv.date}</span>
            </div>
            <div class="info-item">
              <label>Fecha de Vencimiento</label>
              <span>${inv.dueDate}</span>
            </div>
          </div>
        </div>
  
        <div class="section">
          <div class="section-title">Concepto</div>
          <p style="font-size:13px; color:#334155; line-height:1.6;">${inv.description || "Servicios de desarrollo web."}</p>
        </div>
  
        <div class="amount-box">
          <div class="amount-label">Total a Pagar</div>
          <div class="amount-value">$${Number(inv.amount).toFixed(2)} USD</div>
        </div>
  
        <div class="footer">
          <span class="footer-note">Polaris Web Studio · Punta Cana, República Dominicana</span>
          <span class="footer-brand">polarisweb.studio</span>
        </div>
  
        <script>window.onload = () => { window.print(); }</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const clientProject = !isAdmin && data?.projects && data.projects.length > 0 ? data.projects[0] : null;

  const tabMeta: Record<string, { icon: React.ReactNode; label: React.ReactNode }> = {
    overview: { icon: <Clock size={16} />, label: <T en="Overview">Resumen de Avances</T> },
    tasks: { icon: <CheckCircle2 size={16} />, label: <T en="Deliverables & Approvals">Entregables y Aprobación</T> },
    invoices: { icon: <FileText size={16} />, label: <T en="Invoicing">Facturación y Pagos</T> },
    meetings: { icon: <Calendar size={16} />, label: <T en="Meetings Schedule">Agenda de Reuniones</T> },
    updates: { icon: <RefreshCw size={14} />, label: <T en="Updates">Actualizaciones</T> },
    "admin-clients": { icon: <UserPlus size={16} />, label: <T en="Register Clients">Registrar Nuevos Clientes</T> },
    "admin-config": { icon: <Settings size={16} />, label: <T en="System Config">Configuración</T> },
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] flex flex-col lg:flex-row">
      
      {/* Toast Notification HUD */}
      <AnimatePresence>
        {(successMsg || errorMsg) && (
          <motion.div
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 16 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 w-full max-w-md px-4"
          >
            {successMsg && (
              <div className="p-4 rounded-xl glass-panel border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm flex items-start gap-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
                <div className="bg-emerald-500/10 p-1.5 rounded-full text-emerald-500 shrink-0">
                  <CheckCircle size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--color-text-primary)]">Acción Completada</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{successMsg}</p>
                </div>
                <button onClick={() => setSuccessMsg(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all">
                  <X size={16} />
                </button>
              </div>
            )}
            {errorMsg && (
              <div className="p-4 rounded-xl glass-panel border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] text-sm flex items-start gap-4 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] ring-1 ring-black/5">
                <div className="bg-red-500/10 p-1.5 rounded-full text-red-500 shrink-0">
                  <AlertCircle size={18} />
                </div>
                <div className="flex-1">
                  <p className="font-bold text-[var(--color-text-primary)]">Atención</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{errorMsg}</p>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all">
                  <X size={16} />
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar navigation */}
      <aside className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-[var(--color-border-subtle)] glass-panel p-6 flex flex-col gap-4 lg:gap-8 shrink-0">
        <div className="flex items-center justify-between">
          <Logo size={32} showText={true} />
          <div className={`px-2 py-1 flex items-center gap-1 rounded-full text-[9px] uppercase font-black tracking-widest ${
            isAdmin
              ? "bg-indigo-500/10 text-indigo-400"
              : "bg-emerald-500/10 text-emerald-400"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? "bg-indigo-505 bg-indigo-400 animate-pulse" : "bg-emerald-500 animate-pulse"}`} />
            {isAdmin ? "PM / Admin" : <T en="Client">Cliente</T>}
          </div>
        </div>

        {/* Mobile/tablet-only collapsed nav toggle */}
        <button
          type="button"
          onClick={() => setMobileNavOpen((v) => !v)}
          className="lg:hidden w-full flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-primary)] transition-all"
        >
          <span className="flex items-center gap-2">
            {tabMeta[activeTab]?.icon}
            {tabMeta[activeTab]?.label}
          </span>
          <ChevronDown size={16} className={`transition-transform shrink-0 ${mobileNavOpen ? "rotate-180" : ""}`} />
        </button>

        <div className={`${mobileNavOpen ? "flex" : "hidden"} lg:flex flex-col gap-6 lg:gap-8 lg:flex-1 lg:justify-between`}>
        <div className="space-y-6">
          <div className="p-3 bg-[var(--color-surface-highlight)] rounded-xl border border-[var(--color-border-subtle)]/50">
            <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase font-black tracking-wider leading-none mb-1">
              {isAdmin ? "Operador" : <T en="Company">Empresa</T>}
            </p>
            <p className="font-bold text-sm text-[var(--color-text-primary)] truncate">
              {user.name}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] truncate">
              {isAdmin ? "Administrador" : user.companyName}
            </p>
          </div>

          <nav className="space-y-1.5">
            <button
              onClick={() => selectTab("overview")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "overview"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <Clock size={16} />
              <T en="Overview">Resumen de Avances</T>
            </button>

            <button
              onClick={() => selectTab("tasks")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === "tasks"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <CheckCircle2 size={16} />
              <T en="Deliverables & Approvals">Entregables y Aprobación</T>
              {data?.tasks.filter((t) => t.status === "pending").length ? (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-black flex items-center justify-center">
                  {data?.tasks.filter((t) => t.status === "pending").length}
                </span>
              ) : null}
            </button>

            <button
              onClick={() => selectTab("invoices")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all relative ${
                activeTab === "invoices"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <FileText size={16} />
              <T en="Invoicing">Facturación y Pagos</T>
              {data?.invoices.filter((i) => i.status === "pending").length ? (
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-indigo-400" />
              ) : null}
            </button>

            <button
              onClick={() => selectTab("meetings")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "meetings"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <Calendar size={16} />
              <T en="Meetings Schedule">Agenda de Reuniones</T>
            </button>

            <button
              onClick={() => selectTab("updates")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "updates"
                  ? "bg-[var(--color-primary-base)] text-white"
                  : "text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-highlight)]"
              }`}
            >
              <RefreshCw size={14} />
              <T en="Updates">Actualizaciones</T>
            </button>

            {isAdmin && (
              <button
                onClick={() => selectTab("admin-clients")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border border-indigo-500/20 ${
                  activeTab === "admin-clients"
                    ? "bg-indigo-600 text-white border-transparent"
                    : "text-indigo-400 hover:bg-indigo-500/10"
                }`}
              >
                <UserPlus size={16} />
                <T en="Register Clients">Registrar Nuevos Clientes</T>
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => selectTab("admin-config")}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-bold transition-all border border-indigo-500/20 ${
                  activeTab === "admin-config"
                    ? "bg-indigo-600 text-white border-transparent"
                    : "text-indigo-400 hover:bg-indigo-500/10"
                }`}
              >
                <Settings size={16} />
                <T en="System Config">Configuración</T>
              </button>
            )}
          </nav>
        </div>

        <div className="pt-6 border-t border-[var(--color-border-subtle)]/30 space-y-3">
          <button
            onClick={handleRefresh}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-mono transition-all border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-border-subtle)] cursor-pointer"
          >
            <RefreshCw size={12} className="animate-hover-spin" />
            <T en="Refresh Hub">Sincronizar Panel</T>
          </button>

          <button
            onClick={() => {
              setPasswordChangeError(null);
              setPasswordChangeSuccess(null);
              setNewPasswordValue("");
              setShowPasswordModal(true);
            }}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-[var(--color-surface-highlight)] hover:bg-[var(--color-surface-highlight)]/70 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xs font-bold transition-all border border-[var(--color-border-subtle)]/40 hover:border-[var(--color-border-subtle)] cursor-pointer"
          >
            <Settings size={13} />
            <T en="Change Password">Cambiar Contraseña</T>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-red-500/10 text-red-500 text-xs font-bold transition-all cursor-pointer border border-transparent hover:border-red-500/25"
          >
            <LogOut size={14} />
            <T en="Log Out">Cerrar Sesión</T>
          </button>
        </div>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main className="flex-1 p-6 md:p-10 lg:p-12 overflow-y-auto">
        
        {/* Navigation header section */}
        <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-black tracking-tight mb-2">
              {isAdmin ? (
                <T en="Elite Project Operations">Panel de Control</T>
              ) : (
                <>
                  <T en="Your Project">Tu Proyecto</T>
                </>
              )}
            </h1>
            <p className="text-[var(--color-text-secondary)] text-sm">
              {isAdmin ? (
                "Monitorea el progreso, autoriza entregables aprobados y crea cuentas de clientes en vivo."
              ) : (
                <span className="flex items-center gap-1.5">
                  <Briefcase size={20} className="text-indigo-400 shrink-0" />
                  <T en="Here you can see your project progress, review deliverables, and make payments.">
                    Aquí puedes ver el avance de tu proyecto, revisar entregables y realizar pagos.
                  </T>
                </span>
              )}
            </p>
          </div>
          
          <div className="text-xs text-[var(--color-text-tertiary)] font-mono flex items-center gap-2 glass-panel border border-[var(--color-border-subtle)] px-3 py-1.5 rounded-lg self-start">
            <div className="w-2 h-2 rounded-full overflow-hidden bg-emerald-500 animate-[pulse_1.5s_infinite]" />
            <span>
              RD: {new Intl.DateTimeFormat('es-DO', {
                timeZone: 'America/Santo_Domingo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: true
              }).format(currentTime)}
            </span>
          </div>
        </header>

        {/* LOADING STATE */}
        {loading && (
          <div className="py-20 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-2 border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[var(--color-text-tertiary)]">Sincronizando estado...</p>
          </div>
        )}

        {/* RENDER ACTIVE VIEWS */}
        {!loading && data && (
          <div>
            
            {/* ----------------------------------------------------
                TAB 1: OVERVIEW (RESUMEN)
                ---------------------------------------------------- */}
            {activeTab === "overview" && (
              <div className="space-y-8">
                
                {/* Admin Overview Projects List */}
                {isAdmin ? (
                  <div className="space-y-6">
                    {/* Admin Dashboard Stats (Bento Style) */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-3 bento-glow shadow-sm transition-all hover:border-indigo-500/25 will-change-transform transition-all">
                        <div className="flex justify-between items-center text-[var(--color-text-tertiary)]">
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Clientes Totales</span>
                          <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400">
                            <Users size={16} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black text-[var(--color-text-primary)]">{data.projects.length}</p>
                          <p className="text-[10px] text-[var(--color-text-tertiary)] font-semibold uppercase tracking-wider">Cuentas Activas Registradas</p>
                        </div>
                      </div>

                      <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-3 bento-glow shadow-sm transition-all hover:border-amber-500/25 will-change-transform transition-all">
                        <div className="flex justify-between items-center text-[var(--color-text-tertiary)]">
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Balances Pendientes</span>
                          <div className="p-2 rounded-lg bg-amber-500/10 text-amber-500">
                            <DollarSign size={16} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black text-[var(--color-text-primary)]">
                            {formatMoney(data.invoices.filter(i => i.status === "pending").reduce((acc, curr) => acc + curr.amount, 0))}
                          </p>
                          <p className="text-[10px] text-amber-500 font-bold uppercase tracking-wider">
                            {data.invoices.filter(i => i.status === "pending").length} facturas pendientes por cobrar
                          </p>
                        </div>
                      </div>

                      <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-3 bento-glow shadow-sm transition-all hover:border-emerald-500/25 will-change-transform transition-all">
                        <div className="flex justify-between items-center text-[var(--color-text-tertiary)]">
                          <span className="text-[10px] font-black uppercase tracking-widest font-mono">Aprobaciones Pendientes</span>
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <CheckCircle2 size={16} />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <p className="text-3xl font-display font-black text-[var(--color-text-primary)]">
                            {data.tasks.filter(t => t.status === "pending").length}
                          </p>
                          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">Entregables aguardando validación</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30 mt-6">
                      <h2 className="text-lg font-display font-bold flex items-center gap-2">
                        <Briefcase size={18} className="text-indigo-400" />
                        Proyectos Activos de Clientes ({data.projects.length})
                      </h2>
                    </div>

                    {data.projects.length === 0 ? (
                      <div className="p-8 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3">
                        <HelpCircle size={36} className="mx-auto text-[var(--color-text-tertiary)]" />
                        <h3 className="font-bold">No hay clientes con proyectos registrados</h3>
                        <p className="text-xs text-[var(--color-text-secondary)]">Ve a la pestaña "Registrar Nuevos Clientes" para crear el primero.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-6">
                        {data.projects.slice((projectsPage - 1) * itemsPerPage, projectsPage * itemsPerPage).map((project) => {
                          const clientUser = data.clients?.find(u => u.id === project.clientUserId);
                          return (
                            <div
                              key={project.id}
                              className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-6 hover:border-indigo-500/20 transition-all bento-glow shadow-sm will-change-transform transition-all"
                            >
                              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                <div>
                                  <div className="flex items-center gap-2">
                                    <h3 className="font-display font-black text-lg text-[var(--color-text-primary)]">
                                      {project.displayId ? `${project.displayId} - ` : ""}{project.name}
                                    </h3>
                                    <span className="px-2 py-0.5 bg-indigo-500/10 text-indigo-400 text-[10px] rounded border border-indigo-500/20 uppercase font-black tracking-widest">
                                      {clientUser?.companyName || "Empresa"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                    <strong>Contacto / Email:</strong> {clientUser?.name} ({clientUser?.email})
                                  </p>
                                </div>
                                <div className="text-right flex items-center gap-3">
                                  
                                  <button
                                    onClick={() => handleDeleteProject(project.id)}
                                    className="p-2 text-xs text-orange-400 hover:text-orange-300 bg-orange-500/5 hover:bg-orange-500/10 border border-orange-500/15 hover:border-orange-500/30 rounded-lg transition-all flex items-center gap-1.5"
                                    title="Remover Proyecto"
                                  >
                                    <Trash2 size={13} />
                                    <span>Eliminar Proyecto</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteClient(project.clientUserId)}
                                    className="p-2 text-xs text-red-400 hover:text-red-300 bg-red-500/5 hover:bg-red-500/10 border border-red-500/15 hover:border-red-500/30 rounded-lg transition-all flex items-center gap-1.5"
                                    title="Remover Cliente"
                                  >
                                    <Trash2 size={13} />
                                    <span>Eliminar Cuenta</span>
                                  </button>
                                </div>
                              </div>

                              <p className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-highlight)] p-3 rounded-lg border border-[var(--color-border-subtle)]/40">
                                <strong>Descripción del Proyecto:</strong> {project.description}
                              </p>

                              {/* Progress bar and milestone controller */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-3">
                                  <button
                                    type="button"
                                    disabled={!!aiLoadingProgress}
                                    onClick={async () => {
                                      setAiLoadingProgress(project.id);
                                      try {
                                        const approvedTasks = data.tasks.filter(
                                          t => t.projectId === project.id && t.status === "approved"
                                        ).length;
                                        const pendingTasks = data.tasks.filter(
                                          t => t.projectId === project.id && t.status === "pending"
                                        ).length;
                                        const suggestion = await callAI("/api/ai/suggest-progress", {
                                          projectName: project.name,
                                          currentPhase: project.currentPhase,
                                          progress: project.progress,
                                          approvedTasks,
                                          pendingTasks,
                                        });
                                        const parsed = JSON.parse(suggestion);
                                        const updatedPhases = project.phases.map((ph: any, i: number) => ({
                                          ...ph,
                                          status: i < parsed.phaseIndex ? "completed" 
                                                 : i === parsed.phaseIndex ? "active" 
                                                 : "pending"
                                        }));
                                        await handleUpdateProjectProgress(
                                          project.id, 
                                          parsed.suggestedProgress, 
                                          parsed.suggestedPhase,
                                          updatedPhases
                                        );
                                        setSuccessMsg(`IA sugirió: ${parsed.reason}`);
                                      } catch (e) {
                                        setErrorMsg("No se pudo calcular el avance con IA.");
                                      } finally {
                                        setAiLoadingProgress(null);
                                      }
                                    }}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black hover:bg-indigo-500/20 transition disabled:opacity-40 w-fit"
                                  >
                                    {aiLoadingProgress === project.id ? (
                                      <div className="w-3 h-3 border border-indigo-400 border-t-transparent rounded-full animate-spin" />
                                    ) : "🤖"}
                                    Auto-avanzar fase
                                  </button>
                                </div>
                                <div className="flex items-center justify-between text-xs font-bold font-mono">
                                  <span className="text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 px-2 py-1 rounded">
                                    {project.currentPhase}
                                  </span>
                                  <span className="text-[var(--color-text-primary)]">{project.progress}%</span>
                                </div>

                                <div className="h-2.5 w-full bg-[var(--color-surface-highlight)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]/40 shadow-inner">
                                  <div
                                    className="h-full bg-gradient-to-r from-indigo-500 to-[var(--color-primary-base)] shadow-[0_0_10px_var(--color-primary-base)] transition-all duration-500"
                                    style={{ width: `${project.progress}%` }}
                                  />
                                </div>

                                {/* Checklist of Phases for clickable manual updates */}
                                <div className="pt-2">
                                  <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                                    Control del Ciclo de Vida (Haz clic para alternar estado de fase)
                                  </p>
                                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                    {project.phases.map((phase: any, index: number) => (
                                      <button
                                        type="button"
                                        key={phase.name}
                                        onClick={() => togglePhaseStatus(project, index)}
                                        className={`p-3.5 rounded-xl border text-left transition-all ${
                                          phase.status === "completed"
                                            ? "bg-emerald-500/5 border-emerald-500/30 text-emerald-400"
                                            : phase.status === "active"
                                            ? "bg-indigo-500/10 border-indigo-500/40 text-indigo-400 font-bold bento-glow shadow shadow-indigo-500/5"
                                            : "bg-[var(--color-surface-highlight)] border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:border-white/25"
                                        } cursor-pointer`}
                                      >
                                        <div className="flex justify-between items-center mb-1">
                                          <span className="text-[10px] uppercase font-black font-mono tracking-widest">
                                            {phase.status === "completed" ? "✔ Listo" : phase.status === "active" ? "⚡ En Curso" : "⏳ Pendiente"}
                                          </span>
                                        </div>
                                        <p className="text-xs font-bold text-[var(--color-text-primary)] truncate">{phase.name}</p>
                                        <p className="text-[10px] opacity-80 mt-1 line-clamp-1">{phase.detail}</p>
                                      </button>
                                    ))}
                                  </div>
                                </div>

                                {/* Configuración de Proyecto en Vercel */}
                                <div className="pt-4 border-t border-[var(--color-border-subtle)]/20 mt-4 space-y-3">
                                  <h4 className="text-[10px] font-black uppercase tracking-wider text-indigo-400">
                                    CONFIGURACIÓN DE DEPLOY CONTINUO
                                  </h4>
                                  <div className="flex flex-col sm:flex-row gap-3">
                                    <div className="flex-1">
                                      <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">ID del Proyecto (Nombre en GitHub/Vercel)</label>
                                      <input 
                                        type="text"
                                        placeholder="ej: mi-proyecto-web"
                                        defaultValue={project.vercelProjectId || ""}
                                        onBlur={(e) => {
                                          const val = e.target.value.trim();
                                          // Guardar automáticamente al salir de foco
                                          fetch(`/api/portal/projects/${project.id}/vercel`, {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type": "application/json",
                                              Authorization: `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                              vercelProjectId: val,
                                              vercelUrl: project.vercelUrl || ""
                                            })
                                          })
                                            .then(res => {
                                              if (res.ok) {
                                                setSuccessMsg("Configuración de Vercel actualizada");
                                                handleRefresh();
                                              }
                                            });
                                        }}
                                        className="glass-input w-full px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/60 text-xs text-[var(--color-text-primary)] focus:outline-none"
                                      />
                                    </div>
                                    <div className="flex-1">
                                      <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">URL de Producción</label>
                                      <input 
                                        type="text"
                                        placeholder="ej: https://mi-proyecto-web.vercel.app"
                                        defaultValue={project.vercelUrl || ""}
                                        onBlur={(e) => {
                                          const val = e.target.value.trim();
                                          // Guardar automáticamente al salir de foco
                                          fetch(`/api/portal/projects/${project.id}/vercel`, {
                                            method: "PUT",
                                            headers: {
                                              "Content-Type": "application/json",
                                              Authorization: `Bearer ${token}`
                                            },
                                            body: JSON.stringify({
                                              vercelProjectId: project.vercelProjectId || "",
                                              vercelUrl: val
                                            })
                                          })
                                            .then(res => {
                                              if (res.ok) {
                                                setSuccessMsg("Configuración de Vercel actualizada");
                                                handleRefresh();
                                              }
                                            });
                                        }}
                                        className="glass-input w-full px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/60 text-xs text-[var(--color-text-primary)] focus:outline-none"
                                      />
                                    </div>
                                  </div>

                                  {/* Registro manual de despliegues para administradores */}
                                  <div className="pt-3 border-t border-[var(--color-border-subtle)]/10 mt-3 space-y-2">
                                    <label className="block text-[10px] text-zinc-400 font-bold mb-1 uppercase">Registrar actualización manual (producción)</label>
                                    <div className="flex gap-2">
                                      <input 
                                        type="text"
                                        id={`manual-deploy-msg-${project.id}`}
                                        placeholder="ej: Agregamos pasarela de pago y catálogo"
                                        className="glass-input flex-1 px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/60 text-xs text-[var(--color-text-primary)] focus:outline-none placeholder-zinc-500"
                                        onKeyDown={(e) => {
                                          if (e.key === "Enter") {
                                            const inputEl = document.getElementById(`manual-deploy-msg-${project.id}`) as HTMLInputElement;
                                            if (inputEl) {
                                              const msg = inputEl.value.trim();
                                              if (!msg) return;
                                              fetch(`/api/portal/projects/${project.id}/deploys`, {
                                                method: "POST",
                                                headers: {
                                                  "Content-Type": "application/json",
                                                  Authorization: `Bearer ${token}`
                                                },
                                                body: JSON.stringify({ commitMessage: msg })
                                              })
                                                .then(res => {
                                                  if (res.ok) {
                                                    setSuccessMsg("¡Actualización manual registrada con éxito!");
                                                    inputEl.value = "";
                                                    handleRefresh();
                                                  } else {
                                                    setErrorMsg("Error al registrar actualización");
                                                  }
                                                });
                                            }
                                          }
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => {
                                          const inputEl = document.getElementById(`manual-deploy-msg-${project.id}`) as HTMLInputElement;
                                          if (inputEl) {
                                            const msg = inputEl.value.trim();
                                            if (!msg) return;
                                            fetch(`/api/portal/projects/${project.id}/deploys`, {
                                              method: "POST",
                                              headers: {
                                                "Content-Type": "application/json",
                                                Authorization: `Bearer ${token}`
                                              },
                                              body: JSON.stringify({ commitMessage: msg })
                                            })
                                              .then(res => {
                                                if (res.ok) {
                                                  setSuccessMsg("¡Actualización manual registrada con éxito!");
                                                  inputEl.value = "";
                                                  handleRefresh();
                                                } else {
                                                  setErrorMsg("Error al registrar actualización");
                                                }
                                              });
                                          }
                                        }}
                                        className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all cursor-pointer"
                                      >
                                        Publicar
                                      </button>
                                    </div>
                                  </div>

                                  {/* END CONFIGURACIÓN VERCEL */}
                                </div>

                              </div>
                            </div>
                          );
                        })}

                        {/* Pagination Controls */}
                        {data.projects.length > itemsPerPage && (
                          <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                            <button
                              onClick={() => setProjectsPage(p => Math.max(1, p - 1))}
                              disabled={projectsPage === 1}
                              className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                            >
                              Anterior
                            </button>
                            <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                              Pág {projectsPage} de {Math.ceil(data.projects.length / itemsPerPage)}
                            </span>
                            <button
                              onClick={() => setProjectsPage(p => Math.min(Math.ceil(data.projects.length / itemsPerPage), p + 1))}
                              disabled={projectsPage === Math.ceil(data.projects.length / itemsPerPage)}
                              className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                            >
                              Siguiente
                            </button>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Papelera de Reciclaje */}
                    {data.deletedProjects && data.deletedProjects.length > 0 && (
                      <div className="mt-12 pt-6 border-t border-[var(--color-border-subtle)]/30">
                        <div className="flex justify-between items-center pb-4 mb-4">
                          <h2 className="text-lg font-display font-bold flex items-center gap-2 text-[var(--color-text-secondary)]">
                            <Trash2 size={18} className="text-red-400" />
                            Papelera de Reciclaje ({data.deletedProjects.length})
                          </h2>
                          <p className="text-[10px] uppercase font-mono tracking-widest text-[var(--color-text-tertiary)]">Se eliminan auto. en 30 días</p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                          {data.deletedProjects.map((project: any) => {
                            const clientUser = data.deletedClients?.find((u: any) => u.id === project.clientUserId);
                            return (
                              <div
                                key={project.id}
                                className="p-6 rounded-[var(--radius-bento)] glass-panel border border-red-500/20 space-y-4 opacity-70 hover:opacity-100 transition-all shadow-sm will-change-transform transition-all"
                              >
                                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <h3 className="font-display font-black text-lg text-[var(--color-text-primary)]">
                                        {project.displayId ? `${project.displayId} - ` : ""}{project.name}
                                      </h3>
                                      <span className="px-2 py-0.5 bg-red-500/10 text-red-500 text-[10px] rounded border border-red-500/20 uppercase font-black tracking-widest">
                                        Eliminado
                                      </span>
                                    </div>
                                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                      <strong>Contacto / Email:</strong> {clientUser?.name || 'Usuario Eliminado'} ({clientUser?.email || 'N/A'})
                                    </p>
                                  </div>
                                  <div className="text-right flex items-center gap-3">
                                    <button
                                      onClick={() => handleRestoreProject(project.id)}
                                      className="px-3 py-1.5 text-xs text-emerald-400 hover:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg transition-all font-bold"
                                    >
                                      Restaurar Proyecto
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Client Project Overview */
                  <div className="space-y-8">
                    {!clientProject ? (
                      <div className="p-8 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3">
                        <HelpCircle size={36} className="mx-auto text-[var(--color-text-tertiary)]" />
                        <h3 className="font-bold">No hay proyectos activos asignados</h3>
                        <p className="text-xs text-[var(--color-text-secondary)]">Su cuenta no posee iniciativas cargadas. Comuníquese con soporte.</p>
                      </div>
                    ) : (
                      <>
                        {/* Resumen IA */}
                        {(aiSummaryLoading || aiSummary) && (
                          <div className="p-5 rounded-[var(--radius-bento)] bg-[var(--color-primary-base)]/5 border border-[var(--color-primary-base)]/15 flex items-start gap-3">
                            <div className="w-8 h-8 rounded-lg bg-[var(--color-primary-base)]/15 text-[var(--color-primary-base)] flex items-center justify-center shrink-0 mt-0.5">
                              <Sparkles size={16} />
                            </div>
                            <div className="flex-1">
                              <p className="text-[10px] font-black uppercase tracking-wider text-[var(--color-primary-base)] mb-1">
                                Resumen de tu proyecto
                              </p>
                              {aiSummaryLoading ? (
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 border border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin" />
                                  <span className="text-xs text-[var(--color-text-tertiary)]">Generando resumen...</span>
                                </div>
                              ) : (
                                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{aiSummary}</p>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Widget Próxima Acción */}
                        {(() => {
                          const pendingTasks = data.tasks.filter(t => t.status === "pending" && t.projectId === clientProject.id);
                          const pendingInvoices = data.invoices.filter(i => i.status === "pending" && i.projectId === clientProject.id);
                          const hasAction = pendingTasks.length > 0 || pendingInvoices.length > 0;

                          return (
                            <div className={`p-6 rounded-[var(--radius-bento)] border ${hasAction ? 'bg-amber-500/10 border-amber-500/30' : 'bg-emerald-500/10 border-emerald-500/30'} flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-sm`}>
                              <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${hasAction ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                                  {hasAction ? <AlertCircle size={24} /> : <CheckCircle2 size={24} />}
                                </div>
                                <div className="space-y-1">
                                  <h3 className="font-display font-bold text-lg text-[var(--color-text-primary)]">
                                    {hasAction ? "Tu Próxima Acción" : "Todo al día"}
                                  </h3>
                                  <p className="text-sm text-[var(--color-text-secondary)]">
                                    {pendingInvoices.length > 0 
                                      ? `Tienes ${pendingInvoices.length} factura(s) pendiente(s) de pago.`
                                      : pendingTasks.length > 0
                                      ? `Tienes ${pendingTasks.length} entregable(s) esperando tu revisión.`
                                      : "No tienes tareas pendientes por ahora. Nosotros seguimos trabajando en tu proyecto."}
                                  </p>
                                </div>
                              </div>
                              {hasAction && (
                                <button 
                                  onClick={() => setActiveTab(pendingInvoices.length > 0 ? "invoices" : "deliverables")}
                                  className={`px-6 py-2.5 rounded-xl font-bold text-sm shadow-lg whitespace-nowrap transition-all ${pendingInvoices.length > 0 ? 'bg-amber-500 hover:bg-amber-600 text-amber-950 shadow-amber-500/20' : 'bg-[var(--color-primary-base)] hover:opacity-90 text-white shadow-indigo-500/20'}`}
                                >
                                  {pendingInvoices.length > 0 ? "Ir a Pagar" : "Revisar Entregables"}
                                </button>
                              )}
                            </div>
                          );
                        })()}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Interactive Phase Map */}
                        <div className="lg:col-span-2 p-6 md:p-8 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-6 bento-glow">
                          <h2 className="text-lg md:text-xl font-display font-black flex items-center gap-2 border-b border-[var(--color-border-subtle)]/30 pb-4">
                            <TrendingUp size={18} className="text-indigo-400" />
                            Progreso del Desarrollo
                          </h2>

                          <div className="relative pt-4">
                            <div className="absolute top-8 left-4 -translate-x-1/2 w-[2px] h-[calc(100%-48px)] bg-[var(--color-border-subtle)]/60 z-0" />

                            <div className="space-y-6 relative z-10">
                              {clientProject.phases.map((phase: any, index: number) => {
                                const isCompleted = phase.status === "completed";
                                const isActive = phase.status === "active";
                                const isPending = phase.status === "pending";

                                return (
                                  <div key={phase.name} className="flex gap-4">
                                    <div className={`w-6 h-6 ml-1 mt-0.5 rounded-full flex items-center justify-center shrink-0 border-[3px] border-[var(--color-surface-elevated)] relative z-10 ${
                                      isCompleted
                                        ? "bg-emerald-500 text-white"
                                        : isActive
                                        ? "bg-[var(--color-primary-base)] text-white"
                                        : "bg-[var(--color-surface-highlight)] border border-[var(--color-border-strong)] text-[var(--color-text-tertiary)]"
                                    }`}>
                                      {isCompleted ? (
                                        <Check size={10} className="stroke-[3]" />
                                      ) : isActive ? (
                                        <div className="w-1.5 h-1.5 bg-white rounded-full" />
                                      ) : (
                                        <span className="text-[9px] font-mono leading-none">{index + 1}</span>
                                      )}
                                    </div>
                                    <div className="flex-1">
                                      <h3 className={`font-bold text-sm ${isActive ? "text-[var(--color-primary-base)]" : ""}`}>
                                        {phase.name}
                                      </h3>
                                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                                        {phase.detail}
                                      </p>
                                      {isActive && (
                                        <div className="mt-3 h-2 w-full max-w-xs bg-[var(--color-surface-highlight)] rounded-full overflow-hidden border border-[var(--color-border-subtle)]/30">
                                          <div className="h-full bg-gradient-to-r from-indigo-500 to-[var(--color-primary-base)] w-[65%] animate-pulse" />
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Staging Metrics or Live widgets right side */}
                        <div className="flex flex-col gap-6">
                          
                          {/* Alert Deliverable Pending widget */}
                          {data.tasks.some(t => t.status === "pending") ? (
                            <div className="p-6 rounded-[var(--radius-bento)] bg-[var(--color-primary-muted)]/10 border border-[var(--color-primary-base)] space-y-4 shadow-sm bento-glow relative overflow-hidden">
                              <div className="relative z-10 space-y-3">
                                <div className="w-10 h-10 bg-[var(--color-primary-base)] text-white rounded-xl flex items-center justify-center">
                                  <CheckCircle2 size={20} />
                                </div>
                                <h3 className="font-display font-bold text-base text-[var(--color-text-primary)]">
                                  Aprobación Pendiente
                                </h3>
                                <p className="text-xs text-[var(--color-text-secondary)]">
                                  Su equipo posee entregables listos para su revisión y autorización.
                                </p>
                                <button
                                  onClick={() => setActiveTab("tasks")}
                                  className="w-full py-2.5 bg-[var(--color-primary-base)] text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:opacity-90 active:scale-[0.98] transition-all cursor-pointer"
                                >
                                  <span>Revisar Entregables</span>
                                  <ExternalLink size={12} />
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 rounded-[var(--radius-bento)] bg-emerald-500/5 border border-emerald-500/20 space-y-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                                <Check size={16} />
                              </div>
                              <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Dispositivos al Día</h3>
                              <p className="text-xs text-[var(--color-text-secondary)]">
                                No tienes acciones pendientes de revisión. El desarrollo está operando a máxima velocidad sin cuellos de botella.
                              </p>
                            </div>
                          )}

                          {/* Quick Invoicing / Budget box widget */}
                          <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-4">
                            <h3 className="text-xs font-black uppercase tracking-wider text-[var(--color-text-tertiary)] flex justify-between items-center">
                              Facturación Reciente
                              <span className="text-[10px] font-mono lowercase">Fase Inicial</span>
                            </h3>

                            {data.invoices.length > 0 ? (
                              <div className="space-y-3">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                                    {formatMoney(data.invoices[0].amount)}
                                  </span>
                                  <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded ${
                                    data.invoices[0].status === "paid" 
                                      ? "bg-emerald-500/10 text-emerald-400" 
                                      : "bg-amber-500/10 text-amber-500"
                                  }`}>
                                    {data.invoices[0].status === "paid" ? "Pagada" : "Pendiente"}
                                  </span>
                                </div>
                                <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
                                  <p><strong>Descripción:</strong> {data.invoices[0].description}</p>
                                  <p><strong>Factura:</strong> #{data.invoices[0].invoiceNumber}</p>
                                </div>
                                <button
                                  onClick={() => setActiveTab("invoices")}
                                  className="w-full py-2 bg-[var(--color-surface-highlight)] text-[var(--color-text-primary)] font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 hover:bg-[var(--color-border-subtle)] transition"
                                >
                                  <Download size={13} /> Ver Detalle de Facturas
                                </button>
                              </div>
                            ) : (
                              <p className="text-xs text-[var(--color-text-tertiary)]">Sin transacciones registradas.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 2: DELIVERABLES & APPROVALS (TAREAS Y ENTREGABLES)
                ---------------------------------------------------- */}
            {activeTab === "tasks" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-indigo-400" />
                    Entregables por Responder y Aprobados
                  </h2>
                </div>

                {/* MANAGER ONLY: Form to create deliverables for approvals */}
                {isAdmin && (
                  <form onSubmit={handleCreateTask} className="p-6 rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 space-y-4">
                    <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 mb-2">
                      <PlusCircle size={16} />
                      Subir Nuevo Entregable para Revisión
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Proyecto Objetivo</label>
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        >
                          {data.projects.map(p => (
                            <option key={p.id} value={p.id}>{p.displayId ? `${p.displayId} - ` : ""}{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Título del Entregable</label>
                          <button
                            type="button"
                            disabled={!newTaskTitle || aiLoadingTaskTitle}
                            onClick={async () => {
                              setAiLoadingTaskTitle(true);
                              try {
                                const text = await askAIFrontend(
                                  `Mejora este título de entregable para que sea corto, profesional y claro: '${newTaskTitle}'. Devuelve SOLO el título mejorado sin comillas ni texto adicional.`
                                );
                                setNewTaskTitle(text);
                              } catch (e) {
                                setErrorMsg("No se pudo generar con IA.");
                              } finally {
                                setAiLoadingTaskTitle(false);
                              }
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {aiLoadingTaskTitle ? (
                              <div className="w-3 h-3 border border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin" />
                            ) : <Sparkles size={14} />}
                            Generar
                          </button>
                        </div>
                        <textarea
                          required
                          rows={1}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          placeholder="Ej: Mockups de Panel de Control Web"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none resize-none overflow-hidden"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <div className="flex justify-between items-center">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                            Descripción / Instrucciones
                          </label>
                          <button
                            type="button"
                            disabled={!newTaskTitle || aiLoadingTaskDesc}
                            onClick={async () => {
                              setAiLoadingTaskDesc(true);
                              try {
                                const projectName = data?.projects.find(p => p.id === selectedProjectId)?.name || "";
                                const text = await callAI("/api/ai/task-description", {
                                  taskTitle: newTaskTitle,
                                  projectName,
                                });
                                setNewTaskDesc(text);
                              } catch (e) {
                                setErrorMsg("No se pudo generar con IA.");
                              } finally {
                                setAiLoadingTaskDesc(false);
                              }
                            }}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                          >
                            {aiLoadingTaskDesc ? (
                              <div className="w-3 h-3 border border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin" />
                            ) : <Sparkles size={14} />}
                            Generar
                          </button>
                        </div>
                        <textarea
                          rows={1}
                          ref={(el) => {
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${el.scrollHeight}px`;
                            }
                          }}
                          placeholder="Breve reseña de qué revisar..."
                          value={newTaskDesc}
                          onChange={(e) => setNewTaskDesc(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none resize-none overflow-hidden"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Enlace Externo (Opcional)</label>
                        <input
                          type="url"
                          placeholder="https://..."
                          value={newTaskLink}
                          onChange={(e) => setNewTaskLink(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full px-6 py-3 mt-2 rounded-xl bg-[var(--color-primary-base)] text-white text-xs font-bold font-mono tracking-wider hover:opacity-95 cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <Send size={15} />
                      ENVIAR PARA APROBACIÓN
                    </button>
                  </form>
                )}

                {/* List dynamic deliverables */}
                {data.tasks.length === 0 ? (
                  <div className="p-10 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3 max-w-lg mx-auto my-4 shadow-sm animate-fade-in w-full">
                    <CheckCircle2 size={36} className="mx-auto text-indigo-400/80 animate-pulse" />
                    <h3 className="font-display font-medium text-sm text-[var(--color-text-primary)]">¡Todo en Orden!</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      No hay entregables o requerimientos pendientes de revisión asignados a sus proyectos.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 animate-fade-in">
                    {data.tasks.slice((tasksPage - 1) * itemsPerPage, tasksPage * itemsPerPage).map((task) => {
                      const associatedProj = data.projects.find(p => p.id === task.projectId);
                      return (
                        <div
                          key={task.id}
                          className={`p-5 rounded-xl border flex flex-col md:flex-row justify-between md:items-center gap-4 transition-all ${
                            task.status === "approved"
                              ? "bg-emerald-500/5 border-emerald-500/15"
                              : task.status === "rejected"
                              ? "bg-red-500/5 border-red-500/15"
                              : "glass-panel border-[var(--color-border-subtle)]"
                          }`}
                        >
                          <div className="space-y-1 md:max-w-2xl">
                            <div className="flex items-center gap-2 flex-wrap mb-2">
                              {task.createdAt && (
                                <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1 font-mono">
                                  <Clock size={10} />
                                  <span>Enviado: {new Date(task.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </span>
                              )}
                              {task.respondedAt && (
                                <span className="text-[9px] uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1 font-mono">
                                  <Check size={10} />
                                  <span>Respondido: {new Date(task.respondedAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="px-2 py-0.5 bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[10px] text-[var(--color-text-secondary)] font-mono rounded">
                                {associatedProj ? (associatedProj.displayId ? `${associatedProj.displayId} - ${associatedProj.name}` : associatedProj.name) : "Proyecto"}
                              </span>
                              
                              {task.status === "approved" && (
                                <span className="glass-badge text-[10px] uppercase font-bold tracking-wider text-emerald-400 px-2 py-0.5 rounded">
                                  ✔ Aprobado Oficialmente
                                </span>
                              )}
                              {task.status === "rejected" && (
                                <span className="text-[10px] uppercase font-bold tracking-wider text-red-400 bg-red-500/10 px-2 py-0.5 rounded">
                                  ❌ Observado (Requiere Cambios)
                                </span>
                              )}
                              {task.status === "pending" && (
                                <span className="glass-badge text-[10px] uppercase font-bold tracking-wider text-blue-400 px-2 py-0.5 rounded animate-pulse">
                                  ⏳ {isAdmin ? "Esperando Aprobación del Cliente" : "Esperando Tu Aprobación"}
                                </span>
                              )}
                            </div>

                            <p className="font-bold text-sm text-[var(--color-text-primary)] mt-1">{task.title}</p>
                            <p className="text-xs text-[var(--color-text-secondary)]">{task.description}</p>
                            
                            {task.feedback && (
                              <div className="mt-2 text-xs bg-red-500/5 border border-red-500/10 p-2.5 rounded-lg text-red-300">
                                <strong>Correcciones solicitadas:</strong> {task.feedback}
                              </div>
                            )}

                            {task.link && (
                              <a
                                href={task.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-xs text-[var(--color-primary-base)] hover:underline pt-1.5"
                              >
                                <span>Ver entregable técnico</span>
                                <ExternalLink size={12} />
                              </a>
                            )}
                          </div>

                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                            {isAdmin ? (
                              <button
                                onClick={() => handleDeleteTask(task.id)}
                                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all"
                                title="Remover"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              task.status === "pending" && (
                                <div className="space-y-2 text-right w-full sm:w-auto">
                                  {feedbackTaskId === task.id ? (
                                    <div className="space-y-2">
                                      <textarea
                                        value={feedbackText}
                                        onChange={(e) => setFeedbackText(e.target.value)}
                                        placeholder="Agrega tus comentarios para realizar ajustes..."
                                        className="glass-input w-full min-w-[200px] p-2 rounded bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)]"
                                        rows={2}
                                      />
                                      <div className="flex gap-2 justify-end">
                                        <button
                                          onClick={() => setFeedbackTaskId(null)}
                                          className="px-2.5 py-1 text-[11px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                                        >
                                          Cancelar
                                        </button>
                                        <button
                                          onClick={() => handleClientRespondTask(task.id, "rejected")}
                                          className="px-3 py-1 text-[11px] font-bold rounded bg-red-500 text-white hover:bg-red-600"
                                        >
                                          Confirmar Ajustes
                                        </button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap justify-end">
                                      <button
                                        onClick={() => setFeedbackTaskId(task.id)}
                                        className="px-3 py-1.5 text-xs font-bold border border-red-500/20 text-red-400 hover:bg-red-500/10 rounded-lg transition whitespace-nowrap"
                                      >
                                        Pedir Ajustes
                                      </button>
                                      <button
                                        onClick={() => handleClientRespondTask(task.id, "approved")}
                                        className="px-4 py-1.5 text-xs font-bold bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition shadow-lg shadow-emerald-500/10 flex items-center gap-1 cursor-pointer whitespace-nowrap"
                                      >
                                        <Check size={12} className="stroke-[3]" />
                                        Aprobar
                                      </button>
                                    </div>
                                  )}
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {data.tasks.length > itemsPerPage && (
                      <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                        <button
                          onClick={() => setTasksPage(p => Math.max(1, p - 1))}
                          disabled={tasksPage === 1}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                          Pág {tasksPage} de {Math.ceil(data.tasks.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setTasksPage(p => Math.min(Math.ceil(data.tasks.length / itemsPerPage), p + 1))}
                          disabled={tasksPage === Math.ceil(data.tasks.length / itemsPerPage)}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 3: INVOICING & PAYMENTS (FACTURACIÓN)
                ---------------------------------------------------- */}
            {activeTab === "invoices" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <FileText size={18} className="text-indigo-400" />
                    Estado de Cuentas y Facturación
                  </h2>
                </div>

                {/* MANAGER ONLY: Form to create invoices */}
                {isAdmin && (
                  <form onSubmit={handleCreateInvoice} className="p-6 rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 space-y-4">
                    <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 mb-2">
                      <PlusCircle size={16} />
                      Añadir Registro de Factura
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Proyecto Relacionado</label>
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        >
                          {data.projects.map(p => (
                            <option key={p.id} value={p.id}>{p.displayId ? `${p.displayId} - ` : ""}{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Número de Factura
                        </label>
                        <div className="px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)]/50 border-dashed flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-[var(--color-primary-base)]">
                            POL-{new Date().getFullYear()}-###
                          </span>
                          <span className="text-[10px] text-[var(--color-text-tertiary)]">
                            — generado automáticamente en secuencia
                          </span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text(--color-text-tertiary)">Monto (USD)</label>
                        <input
                          type="number"
                          required
                          placeholder="Ej: 1500"
                          value={newInvoiceAmount}
                          onChange={(e) => setNewInvoiceAmount(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                          Glosa / Concepto Detallado
                        </label>
                        <button
                          type="button"
                          disabled={!newInvoiceAmount || aiLoadingInvoiceDesc}
                          onClick={async () => {
                            setAiLoadingInvoiceDesc(true);
                            try {
                              const project = data?.projects.find(p => p.id === selectedProjectId);
                              const text = await callAI("/api/ai/invoice-description", {
                                projectName: project?.name || "",
                                amount: newInvoiceAmount,
                                phase: project?.currentPhase || "",
                              });
                              setNewInvoiceDesc(text);
                            } catch (e) {
                              setErrorMsg("No se pudo generar con IA.");
                            } finally {
                              setAiLoadingInvoiceDesc(false);
                            }
                          }}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {aiLoadingInvoiceDesc ? (
                            <div className="w-3 h-3 border border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin" />
                          ) : <Sparkles size={14} />}
                          Generar
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Ej: Cobro correspondiente a la etapa 2 del desarrollo frontend."
                        value={newInvoiceDesc}
                        onChange={(e) => setNewInvoiceDesc(e.target.value)}
                        className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-white text-xs font-bold font-mono tracking-wider float-right hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Plus size={12} />
                      EMITIR FACTURA
                    </button>
                    <div className="clear-both" />
                  </form>
                )}

                {/* Invoices List */}
                {data.invoices.length === 0 ? (
                  <div className="p-10 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3 max-w-lg mx-auto my-4 shadow-sm">
                    <DollarSign size={36} className="mx-auto text-indigo-400/80 animate-pulse" />
                    <h3 className="font-display font-medium text-sm text-[var(--color-text-primary)]">Sin Transacciones Pendientes</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      No se han emitido facturas de cobro ni transacciones para sus desarrollos activos en este periodo.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {data.invoices.slice((invoicesPage - 1) * itemsPerPage, invoicesPage * itemsPerPage).map((inv) => {
                      const project = data.projects.find(p => p.id === inv.projectId);
                      return (
                        <div
                          key={inv.id}
                          className="p-5 rounded-xl glass-panel border border-[var(--color-border-subtle)] flex flex-col md:flex-row justify-between md:items-center gap-4 hover:border-indigo-500/10 transition-all will-change-transform transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-[var(--color-text-primary)]">Factura {inv.invoiceNumber}</span>
                              <span className="px-2 py-0.5 bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[9px] text-[var(--color-text-tertiary)] rounded font-mono">
                                {project ? (project.displayId ? `${project.displayId} - ${project.name}` : project.name) : "Proyecto"}
                              </span>
                            </div>
                            <p className="text-xs text-[var(--color-text-secondary)] font-medium mt-1">{inv.description}</p>
                            <p className="text-[10px] text-[var(--color-text-tertiary)]">
                              Fecha de Emisión: <strong>{inv.date}</strong> | Expiración: <strong>{inv.dueDate}</strong>
                            </p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-4 text-left md:text-right w-full md:w-auto shrink-0 mt-2 md:mt-0">
                            <div>
                              <p className="text-lg font-display font-black text-[var(--color-text-primary)]">{formatMoney(inv.amount)}</p>
                              
                              <button
                                type="button"
                                disabled={!isAdmin}
                                onClick={() => handleToggleInvoicePaid(inv.id)}
                                className={`text-[9px] uppercase font-bold tracking-widest px-2 py-0.5 rounded cursor-pointer ${
                                  inv.status === "paid"
                                    ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                    : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                                }`}
                              >
                                {inv.status === "paid" ? "Pagada Oficial" : "Pendiente"}
                                {isAdmin && " (Alternar)"}
                              </button>
                            </div>

                            <div className="flex items-center gap-2">
                            {isAdmin ? (
                              <>
                                <button
                                  onClick={() => printInvoice(inv)}
                                  className="p-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/10 rounded transition font-mono"
                                  title="Imprimir / Guardar PDF"
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  onClick={() => handleDeleteInvoice(inv.id)}
                                  className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition font-mono"
                                >
                                  <Trash2 size={14} />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  onClick={() => printInvoice(inv)}
                                  className="p-1.5 mr-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/10 rounded transition tracking-widest font-mono"
                                  title="Imprimir / Guardar PDF"
                                >
                                  <Download size={18} />
                                </button>
                                {inv.status === "pending" && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setCcNumber("");
                                      setCcExpiry("");
                                      setCcCvc("");
                                      setPaymentSuccess(false);
                                      setPayingInvoice(inv);
                                    }}
                                    className="p-2 bg-[var(--color-primary-base)] text-white text-xs font-bold rounded-xl flex items-center gap-1 hover:opacity-90 transition cursor-pointer font-mono"
                                  >
                                    <span>Pagar</span>
                                    <ExternalLink size={10} />
                                  </button>
                                )}
                              </>
                            )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {/* Pagination Controls */}
                    {data.invoices.length > itemsPerPage && (
                      <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                        <button
                          onClick={() => setInvoicesPage(p => Math.max(1, p - 1))}
                          disabled={invoicesPage === 1}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                          Pág {invoicesPage} de {Math.ceil(data.invoices.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setInvoicesPage(p => Math.min(Math.ceil(data.invoices.length / itemsPerPage), p + 1))}
                          disabled={invoicesPage === Math.ceil(data.invoices.length / itemsPerPage)}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer will-change-transform transition-all"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 4: MEETINGS (REUNIONES)
                ---------------------------------------------------- */}
            {activeTab === "meetings" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <Calendar size={18} className="text-indigo-400" />
                    Agenda de Reuniones y Syncs
                  </h2>
                </div>

                {/* MANAGER ONLY: Form to schedule meetings */}
                {isAdmin && (
                  <form onSubmit={handleCreateMeeting} className="p-6 rounded-[var(--radius-bento)] glass-panel border border-indigo-500/10 space-y-4">
                    <h3 className="text-sm font-bold text-indigo-400 flex items-center gap-1.5 mb-2">
                      <PlusCircle size={16} />
                      Agendar Videollamada Técnica (Google Meet)
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Proyecto</label>
                        <select
                          value={selectedProjectId}
                          onChange={(e) => setSelectedProjectId(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        >
                          {data.projects.map(p => (
                            <option key={p.id} value={p.id}>{p.displayId ? `${p.displayId} - ` : ""}{p.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Tema / Título</label>
                        <input
                          type="text"
                          required
                          placeholder="Ej: Demo Avances Sprint 2"
                          value={newMeetTitle}
                          onChange={(e) => setNewMeetTitle(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Fecha</label>
                        <input
                          type="date"
                          required
                          value={newMeetDate}
                          onChange={(e) => setNewMeetDate(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Hora</label>
                        <input
                          type="time"
                          required
                          value={newMeetTime}
                          onChange={(e) => setNewMeetTime(e.target.value)}
                          className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Enlace Google Meet</label>
                      <input
                        type="url"
                        placeholder="https://meet.google.com/..."
                        value={newMeetLink}
                        onChange={(e) => setNewMeetLink(e.target.value)}
                        className="glass-input w-full px-4 py-2.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-white text-xs font-bold font-mono tracking-wider float-right hover:opacity-95 cursor-pointer flex items-center gap-1.5"
                    >
                      <Calendar size={12} />
                      CREAR EVENTO
                    </button>
                    <div className="clear-both" />
                  </form>
                )}

                {/* Meetings List */}
                {data.meetings.length === 0 ? (
                  <div className="p-10 rounded-[var(--radius-bento)] glass-panel border border-dashed border-[var(--color-border-subtle)] text-center space-y-3 max-w-lg mx-auto my-4 shadow-sm">
                    <Calendar size={36} className="mx-auto text-indigo-400/80 animate-pulse" />
                    <h3 className="font-display font-medium text-sm text-[var(--color-text-primary)]">Calendario Despejado</h3>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      No tiene sincronizaciones programadas. Las reuniones del equipo técnico se agendarán y reflejarán aquí.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {data.meetings.slice((meetingsPage - 1) * itemsPerPage, meetingsPage * itemsPerPage).map((meet) => (
                        <div
                          key={meet.id}
                          className="p-5 rounded-xl glass-panel border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-4 hover:border-indigo-500/10 transition-all shadow-sm will-change-transform transition-all"
                        >
                          <div className="space-y-1">
                            <div className="flex justify-between items-start gap-2">
                              <span className="text-[10px] uppercase font-black tracking-widest text-[var(--color-primary-base)] font-mono bg-[var(--color-primary-base)]/10 px-2 py-0.5 rounded">
                                Upcoming Sync
                              </span>
                              {isAdmin && (
                                <button
                                  onClick={() => handleDeleteMeeting(meet.id)}
                                  className="p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded transition"
                                >
                                  <Trash2 size={13} />
                                </button>
                              )}
                            </div>
                            <h3 className="font-bold text-sm text-[var(--color-text-primary)] pt-1">{meet.title}</h3>
                            <div className="space-y-1 pt-1 text-xs text-[var(--color-text-secondary)]">
                              <p className="flex items-center gap-1.5">
                                <Calendar size={12} className="text-[var(--color-text-secondary)]" />
                                {meet.date} a las {meet.time}
                              </p>
                            </div>
                          </div>

                          <a
                            href={meet.meetLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="w-full py-2.5 rounded-xl bg-orange-600/15 border border-orange-500/20 text-orange-400 font-bold text-xs flex items-center justify-center gap-1.5 hover:bg-orange-600/25 hover:text-orange-300 transition-all font-mono"
                          >
                            <CheckCircle2 size={13} />
                            Acceder a Google Meet
                          </a>
                        </div>
                      ))}
                    </div>

                    {/* Pagination Controls */}
                    {data.meetings.length > itemsPerPage && (
                      <div className="flex justify-center items-center gap-2 mt-6 pt-4 border-t border-[var(--color-border-subtle)]/30">
                        <button
                          onClick={() => setMeetingsPage(p => Math.max(1, p - 1))}
                          disabled={meetingsPage === 1}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer animate-fade-in will-change-transform transition-all"
                        >
                          Anterior
                        </button>
                        <span className="text-xs text-[var(--color-text-tertiary)] font-mono">
                          Pág {meetingsPage} de {Math.ceil(data.meetings.length / itemsPerPage)}
                        </span>
                        <button
                          onClick={() => setMeetingsPage(p => Math.min(Math.ceil(data.meetings.length / itemsPerPage), p + 1))}
                          disabled={meetingsPage === Math.ceil(data.meetings.length / itemsPerPage)}
                          className="px-3 py-1.5 rounded-lg glass-panel border border-[var(--color-border-subtle)] text-xs font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 transition-all cursor-pointer animate-fade-in will-change-transform transition-all"
                        >
                          Siguiente
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ----------------------------------------------------
                TAB: UPDATES (ACTUALIZACIONES EN VIVO)
                ---------------------------------------------------- */}
            {activeTab === "updates" && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <RefreshCw size={18} className="text-emerald-400 animate-spin-slow" />
                    Actualizaciones en Vivo (Historial de Deploys)
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* URL en vivo del sitio */}
                  <div className="lg:col-span-1 space-y-6">
                    <div className="relative overflow-hidden p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-4 bento-glow shadow-sm">
                      {data?.projects?.[0]?.vercelUrl && (
                        <div className="absolute -top-12 -right-12 w-36 h-36 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />
                      )}

                      <div className="relative z-10 flex items-center justify-between">
                        <h3 className="font-bold text-sm tracking-wide text-zinc-300 flex items-center gap-2">
                          <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                            <Globe size={14} />
                          </span>
                          Sitio en Producción
                        </h3>
                        {data?.projects?.[0]?.vercelUrl && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-emerald-400">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 animate-ping" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                            </span>
                            En Línea
                          </span>
                        )}
                      </div>

                      {data?.projects?.[0]?.vercelUrl ? (
                        <div className="relative z-10 space-y-3">
                          <p className="text-xs text-zinc-400">Tu proyecto tiene una dirección activa e integrada con nuestro servidor de compilación continua.</p>

                          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-zinc-900/60 border border-[var(--color-border-subtle)]/40">
                            <span
                              className="flex-1 min-w-0 truncate text-[11px] font-mono text-zinc-300"
                              title={data.projects[0].vercelUrl}
                            >
                              {data.projects[0].vercelUrl.replace(/^https?:\/\//, "")}
                            </span>
                            <button
                              type="button"
                              onClick={() => copyProductionUrl(data.projects[0].vercelUrl)}
                              className="shrink-0 text-zinc-500 hover:text-zinc-200 transition-all cursor-pointer"
                              title="Copiar URL"
                            >
                              {urlCopied ? <Check size={13} className="text-emerald-400" /> : <Copy size={13} />}
                            </button>
                          </div>

                          <a
                            href={data.projects[0].vercelUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="group inline-flex items-center gap-2 px-4 py-2.5 text-xs font-bold rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white transition-all w-full justify-center shadow-[0_8px_20px_-8px_rgba(16,185,129,0.55)]"
                          >
                            <ExternalLink size={14} className="transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                            Ver Sitio Web
                          </a>
                        </div>
                      ) : (
                        <div className="relative z-10 flex flex-col items-center gap-2 text-zinc-500 text-xs py-4 text-center">
                          <Globe size={20} className="text-zinc-600" />
                          Aún no hay URL de producción vinculada. Nuestro equipo está preparando tu entorno de despliegue.
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Historial de deploys */}
                  <div className="lg:col-span-2 space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                        <T en="Update history">Historial de actualizaciones</T>
                      </p>
                      <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <T en="Live">En vivo</T>
                      </span>
                    </div>

                    {deploys.length === 0 ? (
                      <div className="flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border border-dashed border-[var(--color-border-subtle)]">
                        <div className="w-10 h-10 rounded-full bg-[var(--color-surface-highlight)] flex items-center justify-center">
                          <RefreshCw size={16} className="text-[var(--color-text-tertiary)]" />
                        </div>
                        <p className="text-sm font-bold text-[var(--color-text-secondary)]">
                          <T en="No updates yet">Sin actualizaciones aún</T>
                        </p>
                        <p className="text-xs text-[var(--color-text-tertiary)] text-center max-w-xs leading-relaxed">
                          <T en="Updates will appear here automatically after each deployment.">
                            Las actualizaciones aparecerán aquí automáticamente después de cada despliegue.
                          </T>
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {deploys.map((dep, idx) => (
                          <div
                            key={dep.id}
                            className="group relative p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] transition-all duration-200"
                          >
                            {/* Línea de tiempo vertical */}
                            {idx < deploys.length - 1 && (
                              <div className="absolute left-[27px] top-full h-3 w-px bg-[var(--color-border-subtle)]" />
                            )}

                            <div className="flex items-start gap-3">
                              {/* Indicador de estado */}
                              <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${
                                dep.state === 'ready'
                                  ? 'bg-emerald-500/15 border border-emerald-500/30'
                                  : dep.state === 'building'
                                  ? 'bg-amber-500/15 border border-amber-500/30'
                                  : 'bg-red-500/15 border border-red-500/30'
                              }`}>
                                <span className={`w-2 h-2 rounded-full ${
                                  dep.state === 'ready'
                                    ? 'bg-emerald-400'
                                    : dep.state === 'building'
                                    ? 'bg-amber-400 animate-pulse'
                                    : 'bg-red-400'
                                }`} />
                              </div>

                              {/* Contenido */}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-snug mb-1">
                                  {language === "es"
                                    ? (dep.commitMessageEs || dep.commitMessageES || dep.commitMessage)
                                    : dep.commitMessage}
                                </p>
                                <div className="flex items-center gap-3 flex-wrap">
                                  <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                    dep.state === 'ready'
                                      ? 'bg-emerald-500/10 text-emerald-400'
                                      : dep.state === 'building'
                                      ? 'bg-amber-500/10 text-amber-400'
                                      : 'bg-red-500/10 text-red-400'
                                  }`}>
                                    {dep.state === 'ready'
                                      ? (language === 'es' ? 'Publicado' : 'Published')
                                      : dep.state === 'building'
                                      ? (language === 'es' ? 'Compilando' : 'Building')
                                      : (language === 'es' ? 'Error' : 'Error')}
                                  </span>
                                  <span className="text-[10px] text-[var(--color-text-tertiary)]">
                                    {new Date(dep.createdAt).toLocaleDateString(
                                      language === 'es' ? 'es-DO' : 'en-US',
                                      { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Botón ver sitio */}
                              {dep.state === 'ready' && dep.url && (
                                <a
                                  href={dep.url}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] hover:border-[var(--color-primary-base)]/40 transition-all opacity-0 group-hover:opacity-100"
                                >
                                  <ExternalLink size={11} />
                                  <T en="View">Ver</T>
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ----------------------------------------------------
                TAB 5: REGISTER CLIENTS (ADMIN ONLY - REGISTRAR CLIENTES)
                ---------------------------------------------------- */}
            {activeTab === "admin-clients" && isAdmin && (
              <div className="space-y-8">
                <div className="flex justify-between items-center pb-4 border-b border-[var(--color-border-subtle)]/30">
                  <h2 className="text-lg font-display font-bold flex items-center gap-2">
                    <UserPlus size={18} className="text-indigo-400" />
                    Registrar Cuenta de Cliente y Proyecto Core
                  </h2>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Register Form Column */}
                  <div className="lg:col-span-2 p-6 md:p-8 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-6">
                    <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      Completa este formulario oficial de iniciación. Al guardarlo, se crea la cuenta del cliente y una plantilla de proyecto, la cual incluye su fase inicial al 25%, una factura de fase inicial y su primer entregable de validación para firmar de forma interactiva.
                    </p>

                    <form onSubmit={handleCreateClient} className="space-y-4">
                      {/* Section A: Contact Credentials */}
                      <div>
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 pb-1.5 border-b border-[var(--color-border-subtle)]/30 mb-3">
                          1. Credenciales de la Cuenta del Cliente
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Nombre Completo del Contacto</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Sofía Martínez"
                              value={newClientName}
                              onChange={(e) => setNewClientName(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>
                          
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Correo de Log-in</label>
                            <input
                              type="email"
                              required
                              placeholder="Ej: sofia@empresa.com"
                              value={newClientEmail}
                              onChange={(e) => setNewClientEmail(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Contraseña Inicial</label>
                              <button
                                type="button"
                                onClick={generatePassword}
                                className="flex items-center gap-1.5 px-2 py-1 rounded border border-[var(--color-border-subtle)] bg-[var(--color-surface-hover)] text-[10px] font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-text-tertiary)] transition-all cursor-pointer"
                              >
                                <RefreshCw size={10} />
                                Generar Segura
                              </button>
                            </div>
                            <div className="relative">
                              <input
                                type={showRegPassword ? "text" : "password"}
                                required
                                placeholder="Ej: ••••••••"
                                value={newClientPassword}
                                onChange={(e) => setNewClientPassword(e.target.value)}
                                className="glass-input w-full pl-3.5 pr-10 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none font-mono"
                              />
                              <button
                                type="button"
                                onClick={() => setShowRegPassword(!showRegPassword)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer"
                                title={showRegPassword ? "Ocultar Contraseña" : "Mostrar Contraseña"}
                              >
                                {showRegPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section B: Project Specifications */}
                      <div className="pt-2">
                        <h3 className="text-xs font-black uppercase tracking-widest text-indigo-400 pb-1.5 border-b border-[var(--color-border-subtle)]/30 mb-3">
                          2. Especificaciones Corporativas y de Iniciativa
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)] font-mono">Nombre de la Empresa</label>
                            <input
                              type="text"
                              required
                              placeholder="Ej: Acme Corp"
                              value={newClientCompany}
                              onChange={(e) => setNewClientCompany(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between items-center">
                              <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Título Comercial de la Iniciativa</label>
                              <span className="text-[9px] font-mono font-bold text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 px-1.5 py-0.5 rounded">ID: {nextProjectDisplayId}</span>
                            </div>
                            <div className="flex bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] rounded-xl overflow-hidden focus-within:border-[var(--color-primary-base)] transition-colors">
                              <div className="pl-3.5 pr-2 py-2.5 bg-black/5 dark:bg-white/5 text-xs font-bold text-[var(--color-text-secondary)] font-mono flex items-center shrink-0 border-r border-[var(--color-border-subtle)]/50">
                                {nextProjectDisplayId} -
                              </div>
                              <input
                                type="text"
                                required
                                placeholder="Ej: Acme Portal SaaS"
                                value={newClientProjectName}
                                onChange={(e) => setNewClientProjectName(e.target.value)}
                                className="glass-input w-full px-3.5 py-2.5 text-xs text-[var(--color-text-primary)] focus:outline-none"
                              />
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 space-y-1">
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                              Descripción del Proyecto
                            </label>
                            <button
                              type="button"
                              disabled={!newClientProjectName || !newClientCompany || !newClientProjectDesc || aiLoadingProjectDesc}
                              onClick={async () => {
                                setAiLoadingProjectDesc(true);
                                try {
                                  const text = await callAI("/api/ai/project-description", {
                                    projectName: newClientProjectName,
                                    companyName: newClientCompany,
                                    briefDescription: newClientProjectDesc
                                  });
                                  setNewClientProjectDesc(text);
                                } catch (e) {
                                  setErrorMsg("No se pudo generar con IA. Intenta de nuevo.");
                                } finally {
                                  setAiLoadingProjectDesc(false);
                                }
                              }}
                              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition disabled:opacity-40 disabled:cursor-not-allowed"
                            >
                              {aiLoadingProjectDesc ? (
                                <div className="w-3 h-3 border border-[var(--color-primary-base)] border-t-transparent rounded-full animate-spin" />
                              ) : <Sparkles size={14} />}
                              Generar con IA
                            </button>
                          </div>
                          <div className="relative">
                            <textarea
                              rows={3}
                              placeholder="Escribe una breve idea del proyecto y presiona Generar con IA..."
                              value={newClientProjectDesc}
                              onChange={(e) => setNewClientProjectDesc(e.target.value)}
                              className="glass-input w-full px-3.5 py-2.5 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <button
                        type="submit"
                        className="w-full px-4 py-4 rounded-xl bg-[var(--color-primary-base)] text-white text-[10px] sm:text-xs font-black uppercase tracking-wider hover:scale-[1.01] active:scale-[0.99] transition shadow-lg cursor-pointer flex items-center justify-center gap-2 sm:gap-3"
                      >
                        <UserPlus size={18} className="shrink-0" />
                        <span className="text-center">CREAR CUENTA REGISTRADA E INTEGRAR EN COLA</span>
                      </button>
                    </form>
                  </div>

                  {/* Right side help block explaining auto setup */}
                  <div className="space-y-6">
                    <div className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] space-y-4">
                      <div className="w-10 h-10 rounded-full bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <CheckCircle size={20} />
                      </div>
                      <h3 className="font-bold text-sm text-[var(--color-text-primary)]">Generación Automática</h3>
                      <ul className="space-y-2 text-xs text-[var(--color-text-secondary)] list-disc pl-4 leading-relaxed">
                        <li><strong>Credenciales Inmediatas</strong>: El cliente podrá loguearse de inmediato usando el correo y contraseña especificados.</li>
                        <li><strong>Iniciativa al 25%</strong>: Provee al cliente un kickoff claro describiendo la "Fase 1: Descubrimiento y Requerimientos" inicial.</li>
                        <li><strong>Entregable de Bienvenida</strong>: Genera una fase donde el cliente leerá el Documento de Alcances y podrá aprobarlo para validar el inicio.</li>
                        <li><strong>Estado de Cobro Planificado</strong>: Se crea una factura inicial de prueba por $1,500 USD con estado pendiente.</li>
                      </ul>
                    </div>

                    <div className="p-6 rounded-[var(--radius-bento)] bg-orange-600/5 border border-orange-500/15 space-y-3">
                      <div className="w-8 h-8 rounded-full bg-orange-500/10 text-orange-400 flex items-center justify-center">
                        <AlertCircle size={16} />
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium leading-relaxed">
                        <strong>Prueba Cruzada</strong>: Crea una cuenta de demostración aquí, cierra sesión en la consola, introduce los nuevos datos en el portal de clientes y experimenta el pipeline exacto que verá tu nuevo usuario en tiempo real.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "admin-config" && isAdmin && (
              <div className="space-y-6 max-w-xl">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  Configuración del Sistema
                </p>

                {/* Webhook URL */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-3">
                  <div>
                    <p className="text-xs font-black text-[var(--color-text-primary)] mb-1">
                      URL del Webhook
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">
                      Usa esta URL en GitHub → Settings → Webhooks de cada repo de cliente.
                    </p>
                    <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                      <code className="flex-1 text-[11px] font-mono text-[var(--color-text-secondary)] break-all">
                        {window.location.origin}/api/webhooks/github
                      </code>
                      <button
                        type="button"
                        onClick={async () => {
                          await navigator.clipboard.writeText(`${window.location.origin}/api/webhooks/github`);
                          setSuccessMsg("URL copiada");
                        }}
                        className="shrink-0 flex items-center gap-1 px-2 py-1 rounded bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-[10px] font-black text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/40 transition cursor-pointer"
                      >
                        <Copy size={10} /> Copiar
                      </button>
                    </div>
                  </div>
                </div>

                {/* Secret Generator */}
                <div className="p-5 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-3">
                  <div>
                    <p className="text-xs font-black text-[var(--color-text-primary)] mb-1">
                      GitHub Webhook Secret
                    </p>
                    <p className="text-[11px] text-[var(--color-text-tertiary)] mb-3">
                      Genera un secret seguro. Es el mismo para todos los repos de clientes — solo necesitas generarlo una vez.
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                      Secret
                    </span>
                    <button
                      type="button"
                      onClick={generateWebhookSecret}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)] text-[10px] font-black hover:bg-[var(--color-primary-base)]/20 transition cursor-pointer"
                    >
                      <RefreshCw size={10} />
                      {generatedSecret ? "Regenerar" : "Generar"}
                    </button>
                  </div>

                  {generatedSecret ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 p-3 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                        <code className="flex-1 text-[11px] font-mono text-[var(--color-text-secondary)] break-all leading-relaxed">
                          {generatedSecret}
                        </code>
                        <button
                          type="button"
                          onClick={copySecret}
                          className={`shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[10px] font-black transition-all cursor-pointer ${
                            secretCopied
                              ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/20"
                              : "bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/40"
                          }`}
                        >
                          {secretCopied ? <><Check size={10} /> Copiado</> : <><Copy size={10} /> Copiar</>}
                        </button>
                      </div>
                      <div className="p-3 rounded-lg bg-amber-500/5 border border-amber-500/15 space-y-1.5">
                        <p className="text-[10px] text-amber-600 dark:text-amber-400 font-black">
                          ⚠️ Copia este secret ahora y pégalo en:
                        </p>
                        <ol className="text-[10px] text-amber-600/80 dark:text-amber-400/80 space-y-1 list-decimal list-inside">
                          <li>GitHub → cada repo cliente → Settings → Webhooks → Secret</li>
                          <li>Vercel → proyecto Polaris → Settings → Env Variables → <code className="font-mono">GITHUB_WEBHOOK_SECRET</code></li>
                        </ol>
                      </div>
                    </div>
                  ) : (
                    <p className="text-[11px] text-[var(--color-text-tertiary)]">
                      Genera un secret seguro para autenticar los webhooks de GitHub.
                    </p>
                  )}
                </div>
              </div>
            )}

          </div>
        )}

        {/* --- INVOICE CHECKOUT MODAL --- */}
        <AnimatePresence>
          {payingInvoice && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[var(--color-bg-base)]/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ y: 20, scale: 0.95 }}
                animate={{ y: 0, scale: 1 }}
                exit={{ y: 20, scale: 0.95 }}
                className="w-full max-w-md glass-panel border border-[var(--color-border-subtle)] p-6 rounded-2xl shadow-2xl relative"
              >
                <button
                  onClick={() => setPayingInvoice(null)}
                  className="absolute top-4 right-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={20} />
                </button>

                {paymentSuccess ? (
                  <div className="text-center space-y-4 py-8">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Check size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-[var(--color-text-primary)]">¡Pago Procesado con Éxito!</h2>
                    <p className="text-sm text-[var(--color-text-secondary)]">La factura {payingInvoice.number} ha sido marcada como pagada.</p>
                    <button
                      onClick={() => setPayingInvoice(null)}
                      className="mt-6 px-6 py-2.5 bg-[var(--color-primary-base)] text-white font-bold text-sm rounded-xl hover:opacity-90 transition-all w-full"
                    >
                      Cerrar y Actualizar
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                        <DollarSign size={20} />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Procesar Pago</h2>
                        <p className="text-xs text-[var(--color-text-secondary)]">Factura {payingInvoice.number}</p>
                      </div>
                    </div>

                    <div className="bg-[var(--color-surface-highlight)] p-4 rounded-xl mb-6 flex justify-between items-center border border-[var(--color-border-subtle)]">
                      <div>
                        <p className="text-[10px] uppercase font-bold text-[var(--color-text-tertiary)]">Importe a pagar</p>
                        <p className="text-xs text-[var(--color-text-secondary)]">{payingInvoice.description}</p>
                      </div>
                      <span className="text-2xl font-black text-emerald-400 font-mono">
                        ${payingInvoice.amount.toLocaleString("en-US")}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Número de Tarjeta</label>
                        <input
                          type="text"
                          placeholder="0000 0000 0000 0000"
                          value={ccNumber}
                          onChange={(e) => setCcNumber(e.target.value)}
                          className="glass-input w-full px-4 py-3 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Vencimiento</label>
                          <input
                            type="text"
                            placeholder="MM/YY"
                            value={ccExpiry}
                            onChange={(e) => setCcExpiry(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">CVC</label>
                          <input
                            type="text"
                            placeholder="123"
                            value={ccCvc}
                            onChange={(e) => setCcCvc(e.target.value)}
                            className="glass-input w-full px-4 py-3 rounded-xl bg-[var(--color-bg-base)] border border-[var(--color-border-subtle)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-indigo-500 transition-colors font-mono"
                          />
                        </div>
                      </div>
                      
                      {errorMsg && (
                        <div className="p-3 rounded border border-red-500/20 bg-red-500/10 text-red-500 text-xs font-bold font-mono">
                          {errorMsg}
                        </div>
                      )}

                      <button
                        onClick={async () => {
                          if (!ccNumber || (!ccExpiry && !ccCvc)) {
                            setErrorMsg("Por favor, ingrese detalles de tarjeta (simulados) para continuar.");
                            return;
                          }
                          setPaymentProcessing(true);
                          setErrorMsg(null);
                          // Simulate payment processing delay
                          await new Promise(r => setTimeout(r, 1500));
                          
                          try {
                            const res = await fetch(`/api/portal/invoices/${payingInvoice.id}/pay`, {
                              method: "POST",
                              headers: { Authorization: `Bearer ${token}` }
                            });
                            if (!res.ok) throw new Error("Payment failed on server");
                            setPaymentSuccess(true);
                            setRefreshTrigger(p => p + 1);
                          } catch (err) {
                            setErrorMsg("Fallo al procesar pago en el servidor.");
                          } finally {
                            setPaymentProcessing(false);
                          }
                        }}
                        disabled={paymentProcessing}
                        className="w-full py-3 mt-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {paymentProcessing ? (
                          <RefreshCw size={18} className="animate-spin" />
                        ) : (
                          <>
                            <CheckCircle2 size={18} />
                            PAGAR AHORA
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Chat lateral — solo para clientes */}
      {!isAdmin && (
        <>
          {/* Fondo oscuro en móvil */}
          <AnimatePresence>
            {chatOpen && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/20 z-40 backdrop-blur-sm sm:hidden"
                onClick={() => setChatOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Botón Pestaña lateral */}
          <button
            onClick={() => setChatOpen(true)}
            className={`fixed top-1/2 -translate-y-1/2 right-0 z-40 bg-white shadow-[-4px_0_15px_rgba(0,0,0,0.15)] rounded-l-xl py-4 px-2 flex flex-col items-center gap-2 transition-transform duration-300 hover:pr-3 group ${chatOpen ? "translate-x-full" : "translate-x-0"}`}
          >
            <span className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-base)] opacity-70 group-hover:opacity-100 transition-opacity" style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}>
              Atlas AI
            </span>
          </button>
      
          {/* Panel del chat */}
          <AnimatePresence>
          {chatOpen && (
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 z-50 h-[100dvh] w-full sm:w-[380px] flex flex-col glass-panel border-l border-[var(--color-border-subtle)] shadow-2xl"
            >
              
              {/* Header */}
              <div className="px-5 py-4 bg-[var(--color-primary-base)] flex items-center justify-between shadow-md z-10 shrink-0">
                <div className="flex items-center gap-3">
                  {/* Isotipo SVG inline */}
                  <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-5 h-5">
                      <defs>
                        <linearGradient id="chat-logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#4f46e5" />
                          <stop offset="100%" stopColor="#818cf8" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 16 2 L 17.5 13.5 L 21.5 10.5 L 18.5 14.5 L 30 16 L 18.5 17.5 L 21.5 21.5 L 17.5 18.5 L 16 30 L 14.5 18.5 L 10.5 21.5 L 13.5 17.5 L 2 16 L 13.5 14.5 L 10.5 10.5 L 14.5 13.5 Z"
                        fill="url(#chat-logo-gradient)"
                      />
                      <circle cx="16" cy="16" r="1.5" fill="#4f46e5" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-white font-black text-sm tracking-tight">Atlas AI Assistant</p>
                    <p className="text-white/60 text-[10px]">by Polaris Web Studio</p>
                  </div>
                </div>
                <button
                  onClick={() => setChatOpen(false)}
                  className="text-white/50 hover:text-white transition p-1"
                >
                  <X size={16} />
                </button>
              </div>
      
              {/* Mensajes */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
                {chatMessages.length === 0 && (
                  <div className="flex-1 flex flex-col justify-center items-center text-center py-6 space-y-2">
                    <div className="flex items-center justify-center shrink-0 mb-4 drop-shadow-md">
                      <svg viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-28 h-28">
                        <defs>
                          <linearGradient id="chat-logo-gradient-large" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#4f46e5" />
                            <stop offset="100%" stopColor="#818cf8" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 16 2 L 17.5 13.5 L 21.5 10.5 L 18.5 14.5 L 30 16 L 18.5 17.5 L 21.5 21.5 L 17.5 18.5 L 16 30 L 14.5 18.5 L 10.5 21.5 L 13.5 17.5 L 2 16 L 13.5 14.5 L 10.5 10.5 L 14.5 13.5 Z"
                          fill="url(#chat-logo-gradient-large)"
                        />
                        <circle cx="16" cy="16" r="1.5" fill="#ffffff" />
                      </svg>
                    </div>
                    <p className="text-xs text-[var(--color-text-secondary)]">
                      Hola {user?.name?.split(" ")[0]}! Puedo responderte preguntas sobre el estado de tu proyecto, entregables o facturas.
                    </p>
                    <div className="flex flex-wrap gap-1.5 justify-center pt-2 mt-4">
                      {[
                        "¿Cuándo estará listo?", 
                        "¿Qué falta por hacer?", 
                        "¿Tengo pagos pendientes?",
                        "¿Cuál es el progreso actual?",
                        "¿Cómo me comunico con soporte?"
                      ].map(q => (
                        <button
                          key={q}
                          onClick={async () => {
                            if (chatLoading) return;
                            const userMsg = q;
                            setChatMessages(prev => [...prev, {role: "user", text: userMsg}]);
                            setChatLoading(true);
                            try {
                              const project = clientProject;
                              const approved = data?.tasks.filter(t => t.projectId === project?.id && t.status === "approved").length || 0;
                              const pending = data?.tasks.filter(t => t.projectId === project?.id && t.status === "pending").length || 0;
                              const pendingInvoices = data?.invoices.filter(i => i.projectId === project?.id && i.status === "pending") || [];
                              const context = `Contexto: Proyecto "${project?.name}" al ${project?.progress}% en fase "${project?.currentPhase}". Entregables aprobados: ${approved}, pendientes: ${pending}. Facturas pendientes: ${pendingInvoices.length}. Da los datos de contacto (WhatsApp: +18299200544, correo: soporte@polariswebstudio.com) SOLO si el cliente pregunta cómo contactar o pide ayuda externa. De lo contrario, no los menciones.`;
                              const reply = await askAIFrontend(
                                `Eres el asistente de Polaris Web Studio. ${context} El cliente pregunta: "${userMsg}". Responde en español, máximo 3 oraciones, tono cercano.`
                              );
                              setChatMessages(prev => [...prev, {role: "assistant", text: reply}]);
                            } catch (e) {
                              setChatMessages(prev => [...prev, {role: "assistant", text: "No pude procesar tu pregunta. Contáctanos directamente."}]);
                            } finally {
                              setChatLoading(false);
                            }
                          }}
                          className="text-[10px] px-2.5 py-1 rounded-full bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] border border-[var(--color-primary-base)]/20 hover:bg-[var(--color-primary-base)]/20 transition"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[80%] px-3 py-2 rounded-xl text-xs leading-relaxed ${
                      msg.role === "user"
                        ? "bg-[var(--color-primary-base)] text-white rounded-br-none"
                        : "bg-[var(--color-surface-highlight)] text-[var(--color-text-primary)] rounded-bl-none border border-[var(--color-border-subtle)]"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                ))}
                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] px-3 py-2 rounded-xl rounded-bl-none flex gap-1">
                      {[0,1,2].map(i => (
                        <div key={i} className="w-1.5 h-1.5 rounded-full bg-[var(--color-text-tertiary)] animate-bounce" style={{animationDelay: `${i*150}ms`}} />
                      ))}
                    </div>
                  </div>
                )}
              </div>
      
              {/* Soporte WhatsApp */}
              <div className="px-3 pt-3 pb-3">
                <a
                  href={`https://wa.me/18299200544?text=${encodeURIComponent(`Hola, soy ${user?.name} y tengo una consulta sobre mi proyecto ${clientProject?.name}.`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 text-[11px] font-bold hover:bg-emerald-500/20 transition"
                >
                  <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>
                  Hablar con un agente por WhatsApp
                </a>
              </div>
      
              {/* Input */}
              <div className="p-3 border-t border-[var(--color-border-subtle)] flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  onKeyDown={async e => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      document.getElementById("send-chat-btn")?.click();
                    }
                  }}
                  className="glass-input chat-input flex-1 px-3 py-2 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] text-xs text-[var(--color-text-primary)] focus:outline-none"
                  placeholder="Escribe tu pregunta..."
                  autoCapitalize="none"
                />
                <button
                  id="send-chat-btn"
                  onClick={async () => {
                    if (!chatInput.trim() || chatLoading) return;
                    const userMsg = chatInput.trim();
                    setChatInput("");
                    setChatMessages(prev => [...prev, {role: "user", text: userMsg}]);
                    setChatLoading(true);
                    try {
                      const project = clientProject;
                      const approved = data?.tasks.filter(t => t.projectId === project?.id && t.status === "approved").length || 0;
                      const pending = data?.tasks.filter(t => t.projectId === project?.id && t.status === "pending").length || 0;
                      const pendingInvoices = data?.invoices.filter(i => i.projectId === project?.id && i.status === "pending") || [];
                      const context = `Contexto: Proyecto "${project?.name}" al ${project?.progress}% en fase "${project?.currentPhase}". Entregables aprobados: ${approved}, pendientes: ${pending}. Facturas pendientes: ${pendingInvoices.length}. Da los datos de contacto (WhatsApp: +18299200544, correo: soporte@polariswebstudio.com) SOLO si el cliente pregunta cómo contactar o pide ayuda externa. De lo contrario, no los menciones.`;
                      const reply = await askAIFrontend(
                        `Eres el asistente de Polaris Web Studio. ${context} El cliente pregunta: "${userMsg}". Responde en español, máximo 3 oraciones, tono cercano.`
                      );
                      setChatMessages(prev => [...prev, {role: "assistant", text: reply}]);
                    } catch (e) {
                      setChatMessages(prev => [...prev, {role: "assistant", text: "No pude procesar tu pregunta. Contáctanos directamente."}]);
                    } finally {
                      setChatLoading(false);
                    }
                  }}
                  className="w-8 h-8 rounded-xl bg-[var(--color-primary-base)] text-white flex items-center justify-center hover:opacity-90 transition shrink-0"
                >
                  <Send size={14} />
                </button>
              </div>
            </motion.div>
          )}
          </AnimatePresence>

          {/* Change Password Modal */}
          <AnimatePresence>
            {showPasswordModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowPasswordModal(false)}
                  className="absolute inset-0 bg-black/60 backdrop-blur-xl"
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 15 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 15 }}
                  className="relative w-full max-w-md p-6 bg-[var(--color-surface-base)] rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bento-shadow overflow-hidden"
                >
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-[var(--color-border-subtle)]/30">
                    <h3 className="text-lg font-display font-black flex items-center gap-2 text-[var(--color-text-primary)]">
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-[var(--color-primary-base)]"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                      <T en="Change Password">Cambiar Contraseña</T>
                    </h3>
                    <button
                      onClick={() => setShowPasswordModal(false)}
                      className="p-1 rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors"
                      aria-label="Close"
                    >
                      <X size={18} />
                    </button>
                  </div>

                  {passwordChangeError && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs">
                      {passwordChangeError}
                    </div>
                  )}

                  {passwordChangeSuccess && (
                    <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-500 text-xs">
                      {passwordChangeSuccess}
                    </div>
                  )}

                  <form onSubmit={handleChangePassword} className="space-y-4">
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-[var(--color-text-secondary)]">
                        <T en="New Password">Nueva Contraseña</T>
                      </label>
                      <input
                        type="password"
                        required
                        value={newPasswordValue}
                        onChange={(e) => setNewPasswordValue(e.target.value)}
                        placeholder={language === "es" ? "Mínimo 6 caracteres" : "At least 6 characters"}
                        className="glass-input w-full px-4 py-3 rounded-xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)] focus:outline-none transition-colors text-sm text-[var(--color-text-primary)]"
                      />
                    </div>

                    <div className="flex gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowPasswordModal(false)}
                        className="flex-1 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-highlight)] transition-colors text-xs font-bold"
                      >
                        <T en="Cancel">Cancelar</T>
                      </button>
                      <button
                        type="submit"
                        disabled={passwordChangeLoading}
                        className="flex-1 py-3 rounded-xl bg-[var(--color-primary-base)] hover:opacity-90 text-white font-black transition-all disabled:opacity-50 text-xs flex justify-center items-center gap-1.5 cursor-pointer"
                      >
                        {passwordChangeLoading ? (
                          <T en="Updating...">Actualizando...</T>
                        ) : (
                          <>
                            <T en="Update Password">Actualizar</T>
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </>
      )}

    </div>
  );
}
