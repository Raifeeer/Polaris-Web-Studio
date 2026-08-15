import { useEffect, useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Check, CreditCard, Loader2, Mail, Send, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

// Panel interno para generar y enviar el paquete completo del tier
// "Local Lift 48H" ($99) / "Implementado" ($179) -- admin-only, protegido
// tanto acá (redirect si no hay sesión admin) como en el backend
// (authenticateToken + requireAdmin en server.ts, la protección real).
// A diferencia de /local-lift (gratis, público), esto es el entregable
// del tier pago: la "implementación" real en la ficha del cliente sigue
// siendo trabajo manual -- este panel solo genera y manda el contenido.
//
// Cada generación queda rastreada como un "lead" en Firestore (mismo doc
// tanto si vino del diagnóstico gratis, de un pago directo, o de una
// búsqueda manual acá). El botón de envío correcto (propuesta con pago vs.
// paquete completo) depende de si ese lead ya pagó -- gateado server-side,
// no solo en la UI.

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
interface PlaceInfo { name: string; rating: number | null; reviewCount: number; mapsUri: string | null; }
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
  createdAt: string | null;
}

const STATUS_LABEL: Record<string, string> = {
  diagnostic_sent: "Diagnóstico gratis enviado",
  awaiting_generation: "Pagado — falta generar",
  package_ready: "Paquete generado",
  teaser_sent: "Propuesta enviada",
  sent: "Paquete completo enviado",
};

export default function LocalLiftPanel() {
  const { user, token } = useAuth();
  useDocumentTitle("Panel Local Lift | Polaris", "Local Lift Panel | Polaris", "", "");

  const [leads, setLeads] = useState<Lead[]>([]);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadId, setLeadId] = useState<string | null>(null);
  const [leadPaid, setLeadPaid] = useState(false);

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
  const [teaserStatus, setTeaserStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [teaserError, setTeaserError] = useState("");

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

  const loadLead = (lead: Lead) => {
    setLeadId(lead.id);
    setLeadPaid(lead.paid);
    setBusinessName(lead.businessName);
    setCity(lead.city);
    setContactName(lead.contactName || "");
    setEmail(lead.email || "");
    setTier((lead.tier as "48h" | "implementado") || "48h");
    setPlace(null);
    setPkg(null);
    setGenStatus("idle");
    setSendStatus("idle");
    setTeaserStatus("idle");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !city.trim()) return;
    setGenStatus("loading");
    setGenError("");
    setPkg(null);
    setSendStatus("idle");
    setTeaserStatus("idle");
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

  const handleSendTeaser = async () => {
    if (!leadId) return;
    setTeaserStatus("loading");
    setTeaserError("");
    try {
      const res = await fetch("/api/local-lift-package", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action: "send_teaser", leadId, email, contactName, tier, lang: "es" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTeaserError(data.error || "No se pudo enviar la propuesta.");
        setTeaserStatus("error");
        return;
      }
      setTeaserStatus("done");
      loadLeads();
    } catch {
      setTeaserError("Algo salió mal al enviar. Intenta de nuevo.");
      setTeaserStatus("error");
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

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)] px-4 sm:px-8 py-10 max-w-4xl mx-auto">
      <Link to="/dashboard" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]">← Volver al portal</Link>
      <h1 className="mt-3 text-2xl md:text-4xl font-display font-black tracking-[-0.03em]">Panel Local Lift</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Genera el contenido del tier pago y envíalo — primero como propuesta (sin el contenido exacto, con botón de pago) si el cliente todavía no pagó, o directo como paquete completo si ya pagó.</p>

      <section className="mt-8">
        <h2 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">Leads recientes</h2>
        {leadsLoading ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]"><Loader2 size={14} className="animate-spin" /> Cargando...</div>
        ) : leads.length === 0 ? (
          <p className="mt-3 text-xs text-[var(--color-text-tertiary)]">Sin leads todavía.</p>
        ) : (
          <div className="mt-3 max-h-64 overflow-y-auto rounded-xl border border-[var(--color-border-subtle)] divide-y divide-[var(--color-border-subtle)]">
            {leads.map((l) => (
              <button
                key={l.id}
                onClick={() => loadLead(l)}
                className={`w-full text-left px-4 py-2.5 text-xs hover:bg-[var(--color-surface-elevated)] transition-colors ${leadId === l.id ? "bg-[var(--color-primary-base)]/10" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-black">{l.businessName || "(sin nombre)"} <span className="font-normal text-[var(--color-text-tertiary)]">· {l.city}</span></span>
                  {l.paid && <span className="inline-flex items-center gap-1 text-emerald-500 font-bold"><CreditCard size={11} /> Pagado</span>}
                </div>
                <div className="mt-0.5 text-[var(--color-text-tertiary)]">{l.contactName} {l.email && `· ${l.email}`} · {STATUS_LABEL[l.status] || l.status}</div>
              </button>
            ))}
          </div>
        )}
      </section>

      <form onSubmit={handleGenerate} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        {leadId && (
          <div className="sm:col-span-2 flex items-center justify-between text-xs text-[var(--color-text-tertiary)] bg-[var(--color-surface-elevated)] rounded-lg px-3 py-2">
            <span>Lead cargado — puedes corregir cualquier campo antes de generar.</span>
            <button type="button" onClick={() => { setLeadId(null); setLeadPaid(false); setBusinessName(""); setCity(""); setContactName(""); setEmail(""); setPlace(null); setPkg(null); }} className="font-bold text-[var(--color-primary-base)]">Nuevo</button>
          </div>
        )}
        <input type="text" required placeholder="Nombre del negocio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm sm:col-span-2 border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]" />
        <input type="text" required placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]" />
        <select value={tier} onChange={(e) => setTier(e.target.value as "48h" | "implementado")} className="glass-input rounded-xl px-4 py-3 text-sm border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]">
          <option value="48h">Local Lift 48H ($99)</option>
          <option value="implementado">Implementado ($179)</option>
        </select>
        <button type="submit" disabled={genStatus === "loading"} className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-4 py-3 text-sm font-black text-white disabled:opacity-60">
          {genStatus === "loading" ? <><Loader2 size={16} className="animate-spin" />Generando...</> : <><Sparkles size={16} />Generar paquete</>}
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
            {leadPaid && <span className="inline-flex items-center gap-1 text-[var(--color-text-tertiary)] font-normal normal-case"><CreditCard size={12} /> Ya pagado</span>}
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

            {!leadPaid ? (
              <>
                <button onClick={handleSendTeaser} disabled={teaserStatus === "loading" || !email.trim() || !leadId} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-base)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
                  {teaserStatus === "loading" ? <><Loader2 size={15} className="animate-spin" />Enviando propuesta...</> : <><Mail size={15} />Enviar propuesta (con botón de pago)<ArrowRight size={15} /></>}
                </button>
                <p className="mt-2 text-[11px] text-[var(--color-text-tertiary)]">El cliente recibe los highlights del paquete y un enlace de pago — el contenido exacto solo se manda después de que pague.</p>
                {teaserStatus === "done" && <p className="mt-2 text-xs text-emerald-500">Propuesta enviada a {email}.</p>}
                {teaserStatus === "error" && <p className="mt-2 text-xs text-red-400">{teaserError}</p>}
              </>
            ) : (
              <>
                <button onClick={handleSend} disabled={sendStatus === "loading" || !email.trim()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-base)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
                  {sendStatus === "loading" ? <><Loader2 size={15} className="animate-spin" />Enviando...</> : <><Send size={15} />Enviar paquete completo<ArrowRight size={15} /></>}
                </button>
                {sendStatus === "done" && <p className="mt-2 text-xs text-emerald-500">Enviado a {email}.</p>}
                {sendStatus === "error" && <p className="mt-2 text-xs text-red-400">{sendError}</p>}
              </>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
