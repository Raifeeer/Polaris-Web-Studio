import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Check, Eye, Globe, Link2, Loader2, MapPin, Phone, Send, Star } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

// Panel interno para generar y enviar el paquete completo del tier
// "Impulso" ($29) / "Ascenso" ($99) -- admin-only, protegido tanto acá
// (redirect si no hay sesión admin) como en el backend (verificación real
// dentro de cada archivo api/local-lift-package.ts / gbp-publish.ts, ver
// el comentario ahí -- el middleware de server.ts NO corre en producción
// para estas rutas). A diferencia de /local-lift (gratis, público), esto
// es el entregable del tier pago -- "Impulso" entrega el contenido para
// que el cliente lo implemente; "Ascenso" además lo publica directo en su
// ficha real (sección "Publicar en Google" más abajo, si el lead conectó
// su cuenta).
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
interface LocalLiftPackage {
  rewrittenDescription: string | null;
  services: string[] | null;
  googlePosts: GooglePost[] | null;
  reviewReplies: ReviewReply[] | null;
  reviewReplyTemplates: ReplyTemplate[] | null;
  whatsappMessages: WhatsappMessage[] | null;
  partialFailure: boolean;
  errors: Record<string, string | null>;
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
  gbpConnected: boolean;
  createdAt: string | null;
  sentAt: string | null;
  place: PlaceInfo | null;
}

const STATUS_LABEL: Record<string, string> = {
  awaiting_generation: "Pagado, falta generar",
  package_ready: "Paquete generado",
  sent: "Paquete completo enviado",
};

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
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadPaid, setLeadPaid] = useState(false);
  const [leadGbpConnected, setLeadGbpConnected] = useState(false);
  const [selectedLeadPlace, setSelectedLeadPlace] = useState<PlaceInfo | null>(null);

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [tier, setTier] = useState<"48h" | "implementado">("48h");
  const [genStatus, setGenStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [genError, setGenError] = useState("");
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [pkg, setPkg] = useState<LocalLiftPackage | null>(null);

  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [sendError, setSendError] = useState("");
  const [previewStatus, setPreviewStatus] = useState<"idle" | "loading" | "error">("idle");
  const [previewError, setPreviewError] = useState("");

  const [gbpLocations, setGbpLocations] = useState<{ accountLocationPath: string; title: string }[] | null>(null);
  const [gbpLocationsStatus, setGbpLocationsStatus] = useState<"idle" | "loading" | "error">("idle");
  const [gbpLocationsError, setGbpLocationsError] = useState("");
  const [gbpPublishingIndex, setGbpPublishingIndex] = useState<number | null>(null);
  const [gbpPublishedIndexes, setGbpPublishedIndexes] = useState<Set<number>>(new Set());
  const [gbpPublishError, setGbpPublishError] = useState("");

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

  const pendingLeads = leads.filter((l) => l.status !== "sent");
  const sentLeads = leads.filter((l) => l.status === "sent");

  const loadLead = (lead: Lead) => {
    setLeadId(lead.id);
    setLeadPaid(lead.paid);
    setLeadGbpConnected(lead.gbpConnected);
    setBusinessName(lead.businessName);
    setCity(lead.city);
    setContactName(lead.contactName || "");
    setEmail(lead.email || "");
    setTier((lead.tier as "48h" | "implementado") || "48h");
    setSelectedLeadPlace(lead.place || null);
    setPlace(null);
    setPkg(null);
    setGenStatus("idle");
    setSendStatus("idle");
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
      setPkg(data.package);
      setLeadId(data.leadId || leadId);
      setLeadPaid(!!data.paid);
      setGenStatus("done");
      loadLeads();
    } catch {
      setGenError("Algo salió mal. Intenta de nuevo.");
      setGenStatus("error");
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

  const loadGbpLocations = async () => {
    if (!leadId) return;
    setGbpLocationsStatus("loading");
    setGbpLocationsError("");
    try {
      const res = await fetch("/api/gbp-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "list-locations", leadId }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setGbpLocationsError(data.error || "No se pudieron listar las ubicaciones.");
        setGbpLocationsStatus("error");
        return;
      }
      setGbpLocations(data.locations || []);
      setGbpLocationsStatus("idle");
    } catch {
      setGbpLocationsError("Algo salió mal consultando Google.");
      setGbpLocationsStatus("error");
    }
  };

  const publishPost = async (accountLocationPath: string, index: number) => {
    if (!pkg?.googlePosts?.[index] || !leadId) return;
    setGbpPublishingIndex(index);
    setGbpPublishError("");
    try {
      const res = await fetch("/api/gbp-publish", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "publish-post", leadId, accountLocationPath, post: pkg.googlePosts[index] }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setGbpPublishError(data.error || "Google rechazó la publicación.");
        setGbpPublishingIndex(null);
        return;
      }
      setGbpPublishedIndexes((prev) => new Set(prev).add(index));
      setGbpPublishingIndex(null);
    } catch {
      setGbpPublishError("Algo salió mal publicando en Google.");
      setGbpPublishingIndex(null);
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
      loadLeads();
    } catch {
      setSendError("Algo salió mal al enviar. Intenta de nuevo.");
      setSendStatus("error");
    }
  };

  const missingParts = pkg
    ? Object.entries(pkg.errors)
        .filter(([, v]) => v !== null)
        .map(([k]) => k)
    : [];

  const renderLeadRow = (l: Lead) => (
    <button
      key={l.id}
      onClick={() => loadLead(l)}
      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--color-surface-elevated)] transition-colors ${leadId === l.id ? "bg-[var(--color-primary-base)]/10" : ""}`}
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-black">{l.businessName || "(sin nombre)"} <span className="font-normal text-[var(--color-text-tertiary)]">· {l.city}</span></span>
        {l.gbpConnected && <span className="inline-flex items-center gap-1 text-indigo-500 font-bold shrink-0"><Link2 size={11} /> Google conectado</span>}
      </div>
      <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 text-[var(--color-text-tertiary)]">
        <span>{l.contactName}</span>
        {l.email && <span>· {l.email}</span>}
        <span>· {STATUS_LABEL[l.status] || l.status}</span>
      </div>
      <div className="mt-0.5 text-[10px] text-[var(--color-text-tertiary)]">
        Recibido {formatDateTime(l.createdAt)}
        {l.sentAt && <> · Enviado {formatDateTime(l.sentAt)}</>}
      </div>
    </button>
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)] px-4 sm:px-8 py-10 max-w-4xl mx-auto">
      <Link to="/dashboard" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]">← Volver al portal</Link>
      <h1 className="mt-3 text-2xl md:text-4xl font-display font-black tracking-[-0.03em]">Panel Local Lift</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Genera el contenido real del paquete que compró cada cliente (revisa la ficha de su negocio, previsualiza el PDF) y envíaselo por correo. Solo aparecen acá los leads que ya pagaron.</p>

      <section className="mt-8 space-y-6">
        <div>
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Por enviar</h2>
          {leadsLoading ? (
            <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"><Loader2 size={14} className="animate-spin" /> Cargando...</div>
          ) : pendingLeads.length === 0 ? (
            <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">Nada pendiente de enviar.</p>
          ) : (
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
              {pendingLeads.map(renderLeadRow)}
            </div>
          )}
        </div>

        {sentLeads.length > 0 && (
          <div>
            <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Ya enviados</h2>
            <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
              {sentLeads.map(renderLeadRow)}
            </div>
          </div>
        )}
      </section>

      {selectedLeadPlace && (
        <div className="mt-8 max-w-xl rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5">
          <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">Ficha real del negocio</h2>
          {selectedLeadPlace.photoUrls.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
              {selectedLeadPlace.photoUrls.slice(0, 6).map((url) => (
                <img key={url} src={url} alt="" className="h-20 w-20 rounded-lg object-cover shrink-0 border border-[var(--color-border-subtle)]" />
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
        <select value={tier} onChange={(e) => setTier(e.target.value as "48h" | "implementado")} className="glass-input rounded-xl px-4 py-3 text-sm border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]">
          <option value="48h">Impulso ($29)</option>
          <option value="implementado">Ascenso ($99)</option>
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
            {leadGbpConnected && <span className="inline-flex items-center gap-1 text-[var(--color-text-tertiary)] font-normal normal-case"><Link2 size={12} /> Google conectado</span>}
          </div>

          {missingParts.length > 0 && (
            <div className="flex items-start gap-2 text-xs text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2.5">
              <AlertCircle size={15} className="mt-0.5 shrink-0" />
              <span>No se pudieron generar estas partes (probá "Generar paquete" de nuevo, solo suele fallar por saturación momentánea del modelo): {missingParts.join(", ")}</span>
            </div>
          )}

          {pkg.rewrittenDescription && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Descripción nueva</h2>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">{pkg.rewrittenDescription}</p>
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
                  <div key={i} className="rounded-lg border border-[var(--color-border-subtle)] p-3 text-xs">
                    <p className="font-black">{p.title}</p>
                    <p className="mt-1 text-[var(--color-text-secondary)]">{p.body}</p>
                    <p className="mt-1 font-bold text-[var(--color-primary-base)]">CTA: {p.cta}</p>
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
                  <div key={i} className="rounded-lg border border-[var(--color-border-subtle)] p-3 text-xs">
                    <p className="font-black">{r.author} ({r.rating}/5)</p>
                    <p className="mt-1 italic text-[var(--color-text-tertiary)]">"{r.originalText}"</p>
                    <p className="mt-1 text-[var(--color-text-secondary)]">→ {r.reply}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {pkg.reviewReplyTemplates && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">Plantillas por calificación</h2>
              <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {pkg.reviewReplyTemplates.map((t, i) => <p key={i}><span className="font-bold text-[var(--color-text-primary)]">{t.forRating}/5:</span> {t.template}</p>)}
              </div>
            </section>
          )}

          {pkg.whatsappMessages && (
            <section>
              <h2 className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)]">{pkg.whatsappMessages.length} mensajes de WhatsApp</h2>
              <div className="mt-2 space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                {pkg.whatsappMessages.map((m, i) => <p key={i}><span className="font-bold text-[var(--color-text-primary)]">{m.scenario}:</span> {m.message}</p>)}
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

          {leadGbpConnected && (
            <section className="rounded-xl bg-[var(--color-surface-elevated)] p-5 max-w-xl border border-indigo-500/20">
              <h2 className="text-sm font-black uppercase tracking-widest text-indigo-400 flex items-center gap-1.5"><Link2 size={14} /> Publicar en Google (Ascenso)</h2>
              <p className="mt-1 text-[11px] text-[var(--color-text-tertiary)]">Este lead conectó su cuenta real de Google. Publicar acá va directo a su ficha pública, revisa cada post antes de mandarlo.</p>

              {!gbpLocations && (
                <button onClick={loadGbpLocations} disabled={gbpLocationsStatus === "loading"} className="mt-3 inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 px-4 py-2 text-xs font-bold text-indigo-400 disabled:opacity-50">
                  {gbpLocationsStatus === "loading" ? <Loader2 size={13} className="animate-spin" /> : null} Ver ubicaciones conectadas
                </button>
              )}
              {gbpLocationsStatus === "error" && <p className="mt-2 text-xs text-red-400">{gbpLocationsError}</p>}

              {gbpLocations && gbpLocations.length === 0 && (
                <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">No encontramos ninguna ubicación real en esta cuenta de Google.</p>
              )}

              {gbpLocations && gbpLocations.length > 0 && pkg?.googlePosts && (
                <div className="mt-4 space-y-3">
                  {gbpLocations.map((loc) => (
                    <div key={loc.accountLocationPath}>
                      <div className="text-xs font-bold text-[var(--color-text-primary)]">{loc.title}</div>
                      <div className="mt-2 space-y-2">
                        {pkg.googlePosts!.map((p, i) => (
                          <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-[var(--color-surface-base)] px-3 py-2">
                            <div className="text-xs">
                              <div className="font-bold text-[var(--color-text-primary)]">{p.title}</div>
                              <div className="text-[var(--color-text-tertiary)] mt-0.5">{p.body.slice(0, 90)}{p.body.length > 90 ? "…" : ""}</div>
                            </div>
                            <button
                              onClick={() => publishPost(loc.accountLocationPath, i)}
                              disabled={gbpPublishingIndex === i || gbpPublishedIndexes.has(i)}
                              className="shrink-0 rounded-lg bg-indigo-500 px-3 py-1.5 text-[11px] font-black text-white disabled:opacity-50"
                            >
                              {gbpPublishedIndexes.has(i) ? "Publicado" : gbpPublishingIndex === i ? "Publicando..." : "Publicar"}
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {gbpPublishError && <p className="mt-3 text-xs text-red-400">{gbpPublishError}</p>}
            </section>
          )}
        </div>
      )}
    </div>
  );
}
