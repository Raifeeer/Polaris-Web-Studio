import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Building2, Check, CheckCircle2, Clock, Eye, Globe, Loader2, Mail, MapPin, Pencil, Phone, RefreshCw, Search, Send, ShieldCheck, Star, User, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";
import ImageLightbox from "../components/ImageLightbox";
import AscensoAdminWorkflowPanel from "../components/AscensoAdminWorkflowPanel";

// Panel interno para generar y enviar el paquete completo del tier
// "Impulso" ($29) / "Ascenso" ($99) -- admin-only, protegido tanto acá
// (redirect si no hay sesión admin) como en el backend (verificación real
// dentro de cada archivo api/local-lift-package.ts / gbp-publish.ts, ver
// el comentario ahí -- el middleware de server.ts NO corre en producción
// para estas rutas). A diferencia de /local-lift (gratis, público), esto
// es el paquete del tier pago -- "Impulso" entrega el contenido para
// que el cliente lo implemente; "Ascenso" además incluye guía, revisiones y
// acompañamiento paso a paso.
//
// Solo aparecen acá leads YA PAGADOS (pedido explícito del usuario, 16 de
// agosto): el correo gratis de diagnóstico ya invita a pagar por su cuenta,
// este panel es únicamente para generar/enviar el contenido de quien ya
// pagó -- un sistema de recordatorios para quien recibió el diagnóstico
// pero no ha pagado todavía queda como pendiente aparte, no vive acá.

interface GooglePost { title: string; body: string; cta: string; }
interface ReviewReply { author: string; rating: number; originalText: string; reply: string; }
interface ReplyTemplate { forRating: number; template: string; }
interface WhatsappMessage { scenario: string; message: string; }
interface ReviewAnalysis {
  headline: string;
  overview: string;
  recurringThemes: { theme: string; evidence: string; impact: string }[];
  strengths: string[];
  frictionPoints: string[];
  bestPractices: { title: string; action: string; why: string }[];
  responseGuidance: string[];
}
interface LocalLiftPackage {
  rewrittenDescription: string | null;
  services: string[] | null;
  googlePosts: GooglePost[] | null;
  reviewReplies: ReviewReply[] | null;
  reviewReplyTemplates: ReplyTemplate[] | null;
  reviewAnalysis: ReviewAnalysis | null;
  reviewAnalysisNote: string | null;
  whatsappMessages: WhatsappMessage[] | null;
  partialFailure: boolean;
  errors: Record<string, string | null>;
}
interface SourceReview {
  author: string;
  rating: number;
  text: string;
  publishTime?: string | null;
  relativePublishTimeDescription?: string | null;
}
interface PlaceInfo {
  name: string;
  address: string | null;
  rating: number | null;
  reviewCount: number;
  websiteUri: string | null;
  hasPhone: boolean;
  phone: string | null;
  hasHours: boolean;
  editorialSummary: string | null;
  mapsUri: string | null;
  primaryType: string | null;
  photoUrls: string[];
}
interface Lead {
  id: string;
  businessName: string;
  city: string;
  contactName: string;
  email: string;
  tier: string;
  status: string;
  paid: boolean;
  source: string;
  place: PlaceInfo | null;
  reviews?: SourceReview[];
  package?: LocalLiftPackage | null;
  createdAt: string | null;
  sentAt: string | null;
  portalSyncStatus?: "pending" | "synced" | "failed" | "unmatched" | null;
  portalSyncAttempts?: number;
  portalSyncLastError?: string;
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_generation: "Pagado, falta generar",
  package_ready: "Paquete generado",
  sent: "Paquete completo enviado",
};

type SnippetKind = "description" | "post" | "reply" | "template" | "whatsapp";
interface EditingSnippet {
  kind: SnippetKind;
  index: number | null; // null solo para "description" -- es única, no vive en un array
  current: any;
}

// Modal para editar/regenerar UNA sola pieza del paquete (una publicación, una
// respuesta, una plantilla, un mensaje, o la descripción) -- pedido explícito
// del usuario: corregir un párrafo puntual sin rehacer todo el paquete ni
// editar el PDF a mano.
function SnippetEditModal({
  token,
  place,
  leadId,
  tier,
  editing,
  onClose,
  onSave,
}: {
  token: string | null;
  place: PlaceInfo;
  leadId: string | null;
  tier: string;
  editing: EditingSnippet;
  onClose: () => void;
  onSave: (newValue: any) => void;
}) {
  const [fields, setFields] = useState<any>(editing.current);
  const [instruction, setInstruction] = useState("");
  const [regenStatus, setRegenStatus] = useState<"idle" | "loading" | "error">("idle");
  const [regenError, setRegenError] = useState("");

  const regenerate = async (withInstruction: boolean) => {
    setRegenStatus("loading");
    setRegenError("");
    try {
      const res = await fetch("/api/local-lift-package", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          action: "regenerate_snippet",
          place,
          leadId,
          tier,
          kind: editing.kind,
          current: fields,
          instruction: withInstruction ? instruction : undefined,
          lang: "es",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegenError(data.error || "No se pudo regenerar.");
        setRegenStatus("error");
        return;
      }
      setFields(data.result);
      setRegenStatus("idle");
    } catch {
      setRegenError("Algo salió mal regenerando. Intenta de nuevo.");
      setRegenStatus("error");
    }
  };

  return (
    <div role="dialog" aria-modal="true" onClick={onClose} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4">
      <div onClick={(e) => e.stopPropagation()} className="w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Editar pieza</h3>
          <button type="button" onClick={onClose} className="rounded-full p-1.5 hover:bg-[var(--color-surface-elevated)]"><X size={18} /></button>
        </div>

        <div className="space-y-3">
          {editing.kind === "description" && (
            <textarea
              value={fields.rewrittenDescription || ""}
              onChange={(e) => setFields({ ...fields, rewrittenDescription: e.target.value })}
              rows={6}
              className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-sm outline-none focus:border-[var(--color-primary-base)]"
            />
          )}

          {editing.kind === "post" && (
            <>
              <input value={fields.title || ""} onChange={(e) => setFields({ ...fields, title: e.target.value })} placeholder="Título" className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-2.5 text-sm outline-none focus:border-[var(--color-primary-base)]" />
              <textarea value={fields.body || ""} onChange={(e) => setFields({ ...fields, body: e.target.value })} rows={5} placeholder="Texto" className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-sm outline-none focus:border-[var(--color-primary-base)]" />
              <select value={fields.cta || "Ninguno"} onChange={(e) => setFields({ ...fields, cta: e.target.value })} className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-2.5 text-sm outline-none focus:border-[var(--color-primary-base)]">
                {["Reservar", "Llamar ahora", "Ver más", "Comprar", "Cómo llegar", "Ninguno"].map((o) => <option key={o} value={o}>{o}</option>)}
              </select>
            </>
          )}

          {editing.kind === "reply" && (
            <>
              <p className="text-xs text-[var(--color-text-tertiary)]">Reseña real de <span className="font-bold">{fields.author}</span> ({fields.rating}/5): "<span className="italic">{fields.originalText}</span>"</p>
              <textarea value={fields.reply || ""} onChange={(e) => setFields({ ...fields, reply: e.target.value })} rows={4} className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-sm outline-none focus:border-[var(--color-primary-base)]" />
            </>
          )}

          {editing.kind === "template" && (
            <>
              <p className="text-xs text-[var(--color-text-tertiary)]">Plantilla para calificación {fields.forRating}/5</p>
              <textarea value={fields.template || ""} onChange={(e) => setFields({ ...fields, template: e.target.value })} rows={4} className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-sm outline-none focus:border-[var(--color-primary-base)]" />
            </>
          )}

          {editing.kind === "whatsapp" && (
            <>
              <input value={fields.scenario || ""} onChange={(e) => setFields({ ...fields, scenario: e.target.value })} placeholder="Escenario" className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-2.5 text-sm outline-none focus:border-[var(--color-primary-base)]" />
              <textarea value={fields.message || ""} onChange={(e) => setFields({ ...fields, message: e.target.value })} rows={4} className="w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-3 text-sm outline-none focus:border-[var(--color-primary-base)]" />
            </>
          )}
        </div>

        <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)] space-y-2">
          <button type="button" onClick={() => regenerate(false)} disabled={regenStatus === "loading"} className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-border-subtle)] px-4 py-2.5 text-xs font-bold text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/40 disabled:opacity-50">
            {regenStatus === "loading" ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />} Regenerar con IA
          </button>
          <div className="flex gap-2">
            <input
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ej: menciona el horario, cambia el tono a más formal…"
              className="flex-1 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-3 py-2 text-xs outline-none focus:border-[var(--color-primary-base)]"
            />
            <button type="button" onClick={() => regenerate(true)} disabled={regenStatus === "loading" || !instruction.trim()} className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary-base)] px-3 py-2 text-xs font-black text-white disabled:opacity-50">
              {regenStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Regenerar con esto
            </button>
          </div>
          {regenStatus === "error" && <p className="text-xs text-red-400">{regenError}</p>}
        </div>

        <div className="mt-4 flex items-center justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg px-4 py-2 text-xs font-bold text-[var(--color-text-tertiary)]">Cancelar</button>
          <button type="button" onClick={() => { onSave(fields); onClose(); }} className="rounded-lg bg-[var(--color-primary-base)] px-4 py-2 text-xs font-black text-white">Guardar cambios</button>
        </div>
      </div>
    </div>
  );
}

function formatDateTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleString("es-DO", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function LocalLiftPanel() {
  const { user, token } = useAuth();
  useDocumentTitle("Panel Local Lift | Polaris", "Local Lift Panel | Polaris", "", "");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadSearch, setLeadSearch] = useState("");
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadPaid, setLeadPaid] = useState(false);
  const [ascensoWorkflowStatus, setAscensoWorkflowStatus] = useState<string | null>(null);
  const [selectedLeadPlace, setSelectedLeadPlace] = useState<PlaceInfo | null>(null);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [tier, setTier] = useState<"impulso" | "ascenso">("impulso");
  const [genStatus, setGenStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [genError, setGenError] = useState("");
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [pkg, setPkg] = useState<LocalLiftPackage | null>(null);
  const [retryingParts, setRetryingParts] = useState(false);

  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [sendStatus, setSendStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [sendError, setSendError] = useState("");
  const [portalSyncStatus, setPortalSyncStatus] = useState<"idle" | "loading" | "synced" | "failed" | "unknown">("idle");
  const [portalSyncError, setPortalSyncError] = useState("");
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [previewError, setPreviewError] = useState("");

  const [editingSnippet, setEditingSnippet] = useState<EditingSnippet | null>(null);

  const handleSaveSnippet = (kind: SnippetKind, index: number | null, newValue: any) => {
    setPkg((prev) => {
      if (!prev) return prev;
      if (kind === "description") return { ...prev, rewrittenDescription: newValue.rewrittenDescription };
      if (kind === "post" && index != null) { const arr = [...(prev.googlePosts || [])]; arr[index] = newValue; return { ...prev, googlePosts: arr }; }
      if (kind === "reply" && index != null) { const arr = [...(prev.reviewReplies || [])]; arr[index] = newValue; return { ...prev, reviewReplies: arr }; }
      if (kind === "template" && index != null) { const arr = [...(prev.reviewReplyTemplates || [])]; arr[index] = newValue; return { ...prev, reviewReplyTemplates: arr }; }
      if (kind === "whatsapp" && index != null) { const arr = [...(prev.whatsappMessages || [])]; arr[index] = newValue; return { ...prev, whatsappMessages: arr }; }
      return prev;
    });
  };

  const loadLeads = () => {
    if (!token) return;
    setLeadsLoading(true);
    fetch("/api/local-lift-package", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: "leads" }),
    })
      .then((r) => r.json())
      .then((data) => setLeads(data.leads || []))
      .finally(() => setLeadsLoading(false));
  };

  useEffect(() => {
    loadLeads();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

  const normalizedLeadSearch = leadSearch.trim().toLocaleLowerCase();
  const sortedLeads = [...leads].sort((a, b) => {
    const aTime = Date.parse(a.createdAt || "");
    const bTime = Date.parse(b.createdAt || "");
    return (Number.isFinite(bTime) ? bTime : 0) - (Number.isFinite(aTime) ? aTime : 0);
  });
  const filteredLeads = sortedLeads.filter((lead) => {
    if (!normalizedLeadSearch) return true;
    const searchable = [
      lead.businessName,
      lead.city,
      lead.contactName,
      lead.email,
      lead.tier,
      lead.place?.primaryType,
    ].filter(Boolean).join(" ").toLocaleLowerCase();
    return searchable.includes(normalizedLeadSearch);
  });
  const pendingLeads = filteredLeads.filter((l) => l.status !== "sent");
  const sentLeads = filteredLeads.filter((l) => l.status === "sent");


  const loadLead = (lead: Lead) => {
    setLeadId(lead.id);
    setLeadPaid(lead.paid);
    setAscensoWorkflowStatus(null);
    setBusinessName(lead.businessName);
    setCity(lead.city);
    setContactName(lead.contactName || "");
    setEmail(lead.email || "");
    setTier(lead.tier === "ascenso" || lead.tier === "implementado" ? "ascenso" : "impulso");
    setSelectedLeadPlace(lead.place || null);
    setPlace(lead.place || null);
    setPkg(lead.package || null);
    setGenStatus(lead.package && lead.place ? "done" : "idle");
    setGenStatus(lead.package && lead.place ? "done" : "idle");
    setSendStatus("idle");
    setPortalSyncStatus(lead.portalSyncStatus === "synced" ? "synced" : lead.portalSyncStatus === "failed" || lead.portalSyncStatus === "unmatched" || lead.portalSyncStatus === "pending" ? "failed" : "unknown");
    setPortalSyncError(lead.portalSyncLastError || "");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !city.trim()) return;
    setGenStatus("loading");
    setGenError("");
    setPkg(null);
    setSendStatus("idle");
    try {
      const res = await fetch("/api/local-lift-package", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ businessName, city, tier, contactName, email, lang: "es", leadId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "No se pudo generar el paquete.");
        setGenStatus("error");
        return;
      }
      setPlace(data.place);
      setSelectedLeadPlace(data.place);
      setPkg(data.package);
      setLeadId(data.leadId || leadId);
      setLeadPaid(!!data.paid);
      setGenStatus("done");
      loadLeads();
      if (data.package?.partialFailure) {
        retryFailedParts(data.package, data.place, data.leadId || leadId);
      }
    } catch {
      setGenError("Algo salió mal. Intenta de nuevo.");
      setGenStatus("error");
    }
  };

  // Reintento automático y silencioso de las piezas que fallaron en la
  // generación original -- pedido explícito del usuario tras ver que el
  // aviso "no se pudieron generar estas partes" salía muy seguido. Corre en
  // una invocación aparte del servidor, con muchas menos piezas en paralelo,
  // así que tiene mucho más margen para reintentar de verdad entre
  // proveedores (ver comentario en el backend). Si vuelve a fallar, se deja
  // el aviso normal para que el admin reintente a mano con "Generar paquete".
  const retryFailedParts = async (currentPkg: LocalLiftPackage, currentPlace: PlaceInfo, currentLeadId: string | null) => {
    setRetryingParts(true);
    try {
      const res = await fetch("/api/local-lift-package", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "retry_failed_parts", place: currentPlace, existingPackage: currentPkg, leadId: currentLeadId, tier, lang: "es" }),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.package) setPkg(data.package);
    } catch {
      // silencioso -- si falla, el admin ve el aviso normal de piezas faltantes
    } finally {
      setRetryingParts(false);
    }
  };

  const handlePreviewPdf = async () => {
    if (!place || !pkg) return;
    setPreviewStatus("loading");
    setPreviewError("");
    try {
      const res = await fetch("/api/local-lift-package", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "preview_pdf", leadId, place, package: pkg, tier, lang: "es" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setPreviewError(data.error || "No se pudo generar la vista previa.");
        setPreviewStatus("error");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, "_blank");
      setPreviewStatus("idle");
    } catch {
      setPreviewError("Algo salió mal generando la vista previa.");
      setPreviewStatus("error");
    }
  };


  const handleSend = async () => {
    if (!place || !pkg || !email.trim()) return;
    setSendStatus("loading");
    setSendError("");
    try {
      const res = await fetch("/api/local-lift-package", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "send", leadId, place, package: pkg, email, contactName, lang: "es" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "No se pudo enviar.");
        setSendStatus("error");
        return;
      }
      setSendStatus("done");
      setPortalSyncStatus(data.portalSynced ? "synced" : "failed");
      setPortalSyncError(data.portalSyncError || "");
      loadLeads();
    } catch {
      setSendError("Algo salió mal al enviar. Intenta de nuevo.");
      setSendStatus("error");
    }
  };

  const handleRetryPortalSync = async () => {
    if (!leadId) return;
    setPortalSyncStatus("loading");
    setPortalSyncError("");
    try {
      const res = await fetch("/api/local-lift-package", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "retry_portal_sync", leadId }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.synced) {
        setPortalSyncStatus("failed");
        setPortalSyncError(data.error || "El portal todavía no confirmó la entrega.");
        return;
      }
      setPortalSyncStatus("synced");
      setPortalSyncError("");
      loadLeads();
    } catch {
      setPortalSyncStatus("failed");
      setPortalSyncError("No se pudo contactar el portal. Puedes reintentarlo de nuevo.");
    }
  };

  const needsPortalSync = leadId && portalSyncStatus !== "synced" && (sendStatus === "done" || leads.some((lead) => lead.id === leadId && lead.status === "sent"));

  const missingParts = pkg
    ? Object.entries(pkg.errors)
        .filter(([, v]) => v !== null)
        .map(([k]) => k)
    : [];

  const renderLeadRow = (l: Lead) => (
    <button
      key={l.id}
      onClick={() => loadLead(l)}
      className={`w-full text-left px-4 py-3.5 text-xs hover:bg-[var(--color-surface-elevated)] transition-colors ${leadId === l.id ? "bg-[var(--color-primary-base)]/10" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-black text-sm">{l.businessName || "(sin nombre)"}</span>
        {l.status === "sent" ? (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-emerald-500">
            <CheckCircle2 size={12} /> Enviado
          </span>
        ) : (
          <span className="shrink-0 inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-amber-500">
            <Clock size={12} /> Por enviar
          </span>
        )}
      </div>
      <div className="mt-2 space-y-1 text-[var(--color-text-tertiary)]">
        <div className="flex items-center gap-1.5"><MapPin size={12} className="shrink-0 text-[var(--color-primary-base)]" /> {l.city}</div>
        {l.place?.primaryType && (
          <div className="flex items-center gap-1.5"><Building2 size={12} className="shrink-0 text-[var(--color-primary-base)]" /> {l.place.primaryType}</div>
        )}
        {l.contactName && (
          <div className="flex items-center gap-1.5"><User size={12} className="shrink-0 text-[var(--color-primary-base)]" /> {l.contactName}</div>
        )}
        {l.email && (
          <div className="flex items-center gap-1.5 break-all"><Mail size={12} className="shrink-0 text-[var(--color-primary-base)]" /> {l.email}</div>
        )}
        <div className="flex items-center gap-1.5"><Clock size={12} className="shrink-0" /> Recibido {formatDateTime(l.createdAt)}</div>
        {l.sentAt && (
          <div className="flex items-center gap-1.5"><Send size={12} className="shrink-0" /> Enviado {formatDateTime(l.sentAt)}</div>
        )}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)] px-4 sm:px-8 py-10 max-w-4xl mx-auto">
      <Link to="/dashboard" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]">← Volver al portal</Link>
      <h1 className="mt-3 text-2xl md:text-4xl font-display font-black tracking-[-0.03em]">Panel Local Lift</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Genera el contenido real del paquete que compró cada cliente (revisa la información de su negocio, previsualiza el PDF) y envíaselo por correo. Solo aparecen acá los leads que ya pagaron.</p>

      <section className="mt-8 space-y-6">
        <div className="max-w-xl">
          <label htmlFor="local-lift-lead-search" className="sr-only">Buscar leads</label>
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
            <input
              id="local-lift-lead-search"
              type="search"
              value={leadSearch}
              onChange={(e) => setLeadSearch(e.target.value)}
              placeholder="Buscar por negocio, ciudad, contacto o correo"
              className="glass-input w-full rounded-xl border border-[var(--color-border-subtle)] py-3 pl-11 pr-10 text-sm outline-none transition-[border-color,box-shadow] focus:border-[var(--color-primary-base)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]/30"
            />
            {leadSearch && (
              <button
                type="button"
                onClick={() => setLeadSearch("")}
                aria-label="Limpiar búsqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[var(--color-text-tertiary)] transition-colors hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-text-primary)]"
              >
                <X size={14} />
              </button>
            )}
          </div>
          <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">
            {normalizedLeadSearch ? `Mostrando ${filteredLeads.length} de ${leads.length} leads` : `${leads.length} leads · los más recientes aparecen primero`}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Por enviar{pendingLeads.length > 0 ? ` (${pendingLeads.length})` : ""}</h2>
          {leadsLoading ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"><Loader2 size={14} className="animate-spin" /> Cargando...</div>
          ) : pendingLeads.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">{normalizedLeadSearch ? "No hay leads que coincidan con la búsqueda." : "Nada pendiente de enviar."}</p>
          ) : (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
              {pendingLeads.map(renderLeadRow)}
            </div>
          )}
        </div>

        {sentLeads.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Ya enviados ({sentLeads.length})</h2>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
              {sentLeads.map(renderLeadRow)}
            </div>
          </div>
        )}
      </section>

      {needsPortalSync && (
        <section className="mt-8 max-w-xl rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-5">
          <div className="flex items-start gap-3">
            <AlertCircle size={18} className="mt-0.5 shrink-0 text-amber-500" />
            <div className="min-w-0">
              <h2 className="text-sm font-black text-amber-500">El portal todavía no confirmó la entrega</h2>
              <p className="mt-1 text-xs leading-relaxed text-[var(--color-text-secondary)]">El correo y el PDF ya pueden haberse enviado. Reintentar aquí solo actualiza el estado del portal; no vuelve a enviar el correo ni genera otro PDF.</p>
              {portalSyncError && <p className="mt-2 break-words text-[11px] text-amber-500/90">{portalSyncError}</p>}
              <button type="button" onClick={handleRetryPortalSync} disabled={portalSyncStatus === "loading"} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-amber-500/40 px-3 py-2 text-xs font-black text-amber-500 transition-colors hover:bg-amber-500/10 disabled:opacity-50">
                {portalSyncStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />} Reintentar sincronización
              </button>
            </div>
          </div>
        </section>
      )}

      {selectedLeadPlace && (
        <div className="mt-8 max-w-xl rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">Información actual del negocio</h2>
          {selectedLeadPlace.photoUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {selectedLeadPlace.photoUrls.slice(0, 6).map((url) => (
                <button key={url} type="button" onClick={() => setLightboxUrl(url)} className="shrink-0 cursor-zoom-in">
                  <img src={url} alt="" className="h-20 w-20 rounded-lg object-cover border border-[var(--color-border-subtle)]" />
                </button>
              ))}
            </div>
          )}
          <div className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
            {selectedLeadPlace.address && (
              <p className="flex items-start gap-1.5"><MapPin size={13} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" /> {selectedLeadPlace.address}</p>
            )}
            {selectedLeadPlace.rating != null && (
              <p className="flex items-center gap-1.5"><Star size={13} className="text-amber-400 fill-amber-400" /> {selectedLeadPlace.rating.toFixed(1)} · {selectedLeadPlace.reviewCount} reseñas</p>
            )}
            {selectedLeadPlace.websiteUri && (
              <p className="flex items-center gap-1.5"><Globe size={13} className="shrink-0 text-[var(--color-primary-base)]" /> <a href={selectedLeadPlace.websiteUri} target="_blank" rel="noreferrer" className="underline text-[var(--color-primary-base)] font-bold">Sitio web</a></p>
            )}
            <p className="flex items-center gap-1.5"><Phone size={13} className={selectedLeadPlace.hasPhone ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-tertiary)]"} /> {selectedLeadPlace.phone || "Sin teléfono público"}</p>
            {selectedLeadPlace.primaryType && <p>Tipo: {selectedLeadPlace.primaryType}</p>}
            {selectedLeadPlace.editorialSummary && <p className="italic">"{selectedLeadPlace.editorialSummary}"</p>}
            {selectedLeadPlace.mapsUri && (
              <a href={selectedLeadPlace.mapsUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 mt-1 text-[var(--color-primary-base)] font-bold">Ver en Google Maps <ArrowRight size={12} /></a>
            )}
          </div>
        </div>
      )}

      <form onSubmit={handleGenerate} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        {leadId && (
          <div className="sm:col-span-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)] rounded-lg px-3 py-2">
            <span>Lead cargado, puedes corregir cualquier campo antes de generar.</span>
            <button type="button" onClick={() => { setLeadId(null); setLeadPaid(false); setBusinessName(""); setCity(""); setContactName(""); setEmail(""); setPlace(null); setPkg(null); setSelectedLeadPlace(null); }} className="font-bold text-[var(--color-primary-base)]">Nuevo</button>
          </div>
        )}
        <input type="text" required placeholder="Nombre del negocio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm sm:col-span-2 border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]" />
        <input type="text" required placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]" />
        <select value={tier} onChange={(e) => setTier(e.target.value as "impulso" | "ascenso")} className="glass-input rounded-xl px-4 py-3 text-sm border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]">
          <option value="impulso">Impulso ($29)</option>
          <option value="ascenso">Ascenso ($99)</option>
        </select>
        <button type="submit" disabled={genStatus === "loading"} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-4 py-3 text-sm font-black text-white disabled:opacity-60">
          {genStatus === "loading" ? (
            <><Loader2 size={16} className="animate-spin" />Generando...</>
          ) : (
            <>
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white shrink-0">
                <img src="/brand/atlas-isotipo-black.svg" alt="" aria-hidden="true" className="h-3.5 w-3.5" />
              </span>
              Generar paquete
            </>
          )}
        </button>
      </form>

      {genStatus === "error" && (
        <div className="mt-4 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5 max-w-xl">
          <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{genError}</span>
        </div>
      )}

      {pkg && place && (
        <div className="mt-10 space-y-8">
          <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
            <Check size={15} /> {place.name} {place.reviewCount ? `· ${place.reviewCount} reseñas` : ""}
          </div>

          {retryingParts && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-lg px-3 py-2.5">
              <Loader2 size={15} className="animate-spin shrink-0" />
              <span>Reintentando automáticamente las partes que fallaron...</span>
            </div>
          )}

          {!retryingParts && missingParts.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>No se pudieron generar estas partes tras reintentar automáticamente (intenta "Generar paquete" de nuevo): {missingParts.join(", ")}</span>
            </div>
          )}

          {pkg.rewrittenDescription && (
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Descripción nueva</h2>
                <button type="button" onClick={() => setEditingSnippet({ kind: "description", index: null, current: { rewrittenDescription: pkg.rewrittenDescription } })} className="inline-flex items-center gap-1 text-[11px] font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]">
                  <Pencil size={12} /> Editar
                </button>
              </div>
              <p className="mt-2 break-words text-sm text-[var(--color-text-secondary)]">{pkg.rewrittenDescription}</p>
              {pkg.services && (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {pkg.services.map((s) => <li key={s} className="text-xs rounded-full border border-[var(--color-border-subtle)] px-3 py-1">{s}</li>)}
                </ul>
              )}
            </section>
          )}

          {pkg.googlePosts && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">{pkg.googlePosts.length} publicaciones para Google</h2>
              <div className="mt-2 grid grid-cols-1 md:grid-cols-2 gap-2">
                {pkg.googlePosts.map((p, i) => (
                  <div key={i} className="min-w-0 rounded-lg border border-[var(--color-border-subtle)] p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 break-words font-black">{p.title}</p>
                      <button type="button" onClick={() => setEditingSnippet({ kind: "post", index: i, current: p })} className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"><Pencil size={12} /></button>
                    </div>
                    <p className="mt-1 break-words text-[var(--color-text-secondary)]">{p.body}</p>
                    <p className="mt-1 break-words font-bold text-[var(--color-primary-base)]">CTA: {p.cta}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pkg.reviewReplies && pkg.reviewReplies.length > 0 && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Respuestas a reseñas reales</h2>
              <div className="mt-2 space-y-2">
                {pkg.reviewReplies.map((r, i) => (
                  <div key={i} className="min-w-0 rounded-lg border border-[var(--color-border-subtle)] p-3 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <p className="min-w-0 break-words font-black">{r.author} ({r.rating}/5)</p>
                      <button type="button" onClick={() => setEditingSnippet({ kind: "reply", index: i, current: r })} className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"><Pencil size={12} /></button>
                    </div>
                    <p className="mt-1 break-words italic text-[var(--color-text-tertiary)]">"{r.originalText}"</p>
                    <label className="mt-2 block text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">Respuesta preparada para tu perfil</label>
                    <textarea value={replyDrafts[`package-${i}`] ?? r.reply} onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [`package-${i}`]: e.target.value }))} rows={3} className="mt-1 w-full rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] px-3 py-2 text-xs leading-relaxed outline-none focus:border-[var(--color-primary-base)]" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {tier === "ascenso" && pkg.reviewAnalysisNote && !pkg.reviewAnalysis && (
            <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.06] p-4 text-xs text-[var(--color-text-secondary)]">
              <p className="font-black text-amber-500">Análisis de reseñas no disponible</p>
              <p className="mt-1">{pkg.reviewAnalysisNote}</p>
            </div>
          )}

          {pkg.reviewAnalysis && (
            <section className="rounded-xl border border-[var(--color-primary-base)]/25 bg-[var(--color-primary-base)]/[0.05] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Análisis de reseñas recientes · Ascenso</h2>
                  <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">Muestra de hasta cinco reseñas disponibles, ordenada por fecha cuando Google lo permite. No representa el historial completo.</p>
                </div>
                <Star size={16} className="shrink-0 text-amber-500" fill="currentColor" />
              </div>
              <h3 className="mt-4 text-base font-black">{pkg.reviewAnalysis.headline}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">{pkg.reviewAnalysis.overview}</p>
              <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-emerald-500">Fortalezas</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">{pkg.reviewAnalysis.strengths.map((item, i) => <li key={i} className="flex items-start gap-2"><Check size={13} className="mt-0.5 shrink-0 text-emerald-500" />{item}</li>)}</ul>
                </div>
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-amber-500">Fricciones a atender</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">{pkg.reviewAnalysis.frictionPoints.map((item, i) => <li key={i} className="flex items-start gap-2"><AlertCircle size={13} className="mt-0.5 shrink-0 text-amber-500" />{item}</li>)}</ul>
                </div>
              </div>
              <div className="mt-5 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Temas encontrados</p>
                {pkg.reviewAnalysis.recurringThemes.map((theme, i) => (
                  <div key={i} className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs">
                    <p className="font-black">{theme.theme}</p>
                    <p className="mt-1 text-[var(--color-text-tertiary)]">{theme.evidence}</p>
                    <p className="mt-1 text-[var(--color-text-secondary)]">{theme.impact}</p>
                  </div>
                ))}
              </div>
              <div className="mt-5 space-y-2">
                <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Buenas prácticas personalizadas</p>
                {pkg.reviewAnalysis.bestPractices.map((practice, i) => (
                  <div key={i} className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-3 text-xs">
                    <p className="font-black">{i + 1}. {practice.title}</p>
                    <p className="mt-1 text-[var(--color-text-secondary)]">{practice.action}</p>
                    <p className="mt-1 italic text-[var(--color-text-tertiary)]">{practice.why}</p>
                  </div>
                ))}
              </div>
              {pkg.reviewAnalysis.responseGuidance.length > 0 && (
                <div className="mt-5">
                  <p className="text-[11px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">Guía para futuras respuestas</p>
                  <ul className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">{pkg.reviewAnalysis.responseGuidance.map((item, i) => <li key={i} className="flex items-start gap-2"><ArrowRight size={13} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" />{item}</li>)}</ul>
                </div>
              )}
            </section>
          )}

          {pkg.reviewReplyTemplates && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Plantillas por calificación</h2>
              <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {pkg.reviewReplyTemplates.map((t, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <p className="min-w-0 break-words"><span className="font-bold text-[var(--color-text-primary)]">{t.forRating}/5:</span> {t.template}</p>
                    <button type="button" onClick={() => setEditingSnippet({ kind: "template", index: i, current: t })} className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"><Pencil size={12} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pkg.whatsappMessages && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">{pkg.whatsappMessages.length} mensajes de WhatsApp</h2>
              <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {pkg.whatsappMessages.map((m, i) => (
                  <div key={i} className="flex items-start justify-between gap-2">
                    <p className="min-w-0 break-words"><span className="font-bold text-[var(--color-text-primary)]">{m.scenario}:</span> {m.message}</p>
                    <button type="button" onClick={() => setEditingSnippet({ kind: "whatsapp", index: i, current: m })} className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"><Pencil size={12} /></button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="rounded-xl bg-[var(--color-surface-elevated)] p-5 max-w-xl">
            <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Enviar al cliente</h2>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input type="text" placeholder="Nombre del cliente" value={contactName} onChange={(e) => setContactName(e.target.value)} className="glass-input rounded-lg px-3 py-2 text-sm border border-[var(--color-border-subtle)] outline-none" />
              <input type="email" placeholder="Correo del cliente" value={email} onChange={(e) => setEmail(e.target.value)} className="glass-input rounded-lg px-3 py-2 text-sm border border-[var(--color-border-subtle)] outline-none" />
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button onClick={handlePreviewPdf} disabled={previewStatus === "loading"} className="inline-flex items-center gap-2 rounded-lg border border-[var(--color-border-subtle)] px-4 py-2.5 text-sm font-bold text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/40 disabled:opacity-50">
                {previewStatus === "loading" ? <><Loader2 size={15} className="animate-spin" />Generando vista previa...</> : <><Eye size={15} />Vista previa PDF</>}
              </button>
              <button onClick={handleSend} disabled={sendStatus === "loading" || !email.trim()} className="inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-base)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
                {sendStatus === "loading" ? <><Loader2 size={15} className="animate-spin" />Enviando...</> : <><Send size={15} />Enviar paquete completo<ArrowRight size={15} /></>}
              </button>
            </div>
            <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">Revisa la vista previa antes de mandarlo. Si no te convence, corrige y vuelve a "Generar paquete": cada vista previa usa el contenido más reciente.</p>
            {previewStatus === "error" && <p className="mt-2 text-xs text-red-400">{previewError}</p>}
            {sendStatus === "done" && <p className="mt-2 text-xs text-emerald-500">Enviado a {email}.</p>}
            {sendStatus === "error" && <p className="mt-2 text-xs text-red-400">{sendError}</p>}
          </section>

          {tier === "ascenso" && leadId && (
            <AscensoAdminWorkflowPanel leadId={leadId} token={token} packageSnapshot={pkg || undefined} onWorkflowChange={(workflow) => setAscensoWorkflowStatus(workflow?.status || null)} />
          )}

          {tier === "ascenso" && (
            <section className="rounded-xl bg-[var(--color-surface-elevated)] p-5 max-w-xl border border-indigo-500/20">
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5"><ShieldCheck size={14} /> Documento detallado de acompañamiento Ascenso</h2>
              <p className="mt-2 text-xs leading-relaxed text-[var(--color-text-secondary)]">El cliente recibe un documento completo para aplicar cada cambio por su cuenta. Incluye dónde hacerlo, qué preparar, instrucciones paso a paso, verificaciones y errores que conviene evitar.</p>
              <div className="mt-3 flex flex-wrap gap-2 text-[10px] font-bold text-[var(--color-text-tertiary)]"><span className="rounded-full bg-[var(--color-surface-base)]/70 px-2.5 py-1">{packageSnapshot?.implementationGuide?.length || 0} secciones detalladas</span><span className="rounded-full bg-[var(--color-surface-base)]/70 px-2.5 py-1">Vista previa incluida arriba</span></div>
              <div className="mt-4 grid gap-2 sm:grid-cols-3">
                <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">1. Preparar</p><p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">Revisa el documento y reúne el material antes de la sesión.</p></div>
                <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">2. Acompañar</p><p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">Guía al cliente mientras aplica cada instrucción; Polaris no publica por él.</p></div>
                <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/50 p-3"><p className="text-[10px] font-black uppercase tracking-wider text-indigo-300">3. Revisar y cerrar</p><p className="mt-1 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">Resuelve dudas, confirma lo aplicado y cierra el acompañamiento.</p></div>
              </div>
              <p className="mt-3 text-[10px] leading-relaxed text-[var(--color-text-tertiary)]">Las solicitudes de cambios se gestionan arriba. Enviar una solicitud consume una ronda; una aclaración sobre la misma revisión no consume otra.</p>
            </section>
          )}
        </div>
      )}
      {lightboxUrl && <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      {editingSnippet && place && (
        <SnippetEditModal
          token={token}
          place={place}
          leadId={leadId}
          tier={tier}
          editing={editingSnippet}
          onClose={() => setEditingSnippet(null)}
          onSave={(newValue) => handleSaveSnippet(editingSnippet.kind, editingSnippet.index, newValue)}
        />
      )}
    </div>
  );
}
