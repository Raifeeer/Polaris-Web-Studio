import { useState } from "react";
import { Navigate, Link } from "react-router-dom";
import { AlertCircle, ArrowRight, Check, Loader2, Send, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

// Panel interno para generar y enviar el paquete completo del tier
// "Local Lift 48H" ($99) / "Implementado" ($179) -- admin-only, protegido
// tanto acá (redirect si no hay sesión admin) como en el backend
// (authenticateToken + requireAdmin en server.ts, la protección real).
// A diferencia de /local-lift (gratis, público), esto es el entregable
// del tier pago: la "implementación" real en la ficha del cliente sigue
// siendo trabajo manual -- este panel solo genera y manda el contenido.

interface GooglePost {
  title: string;
  body: string;
  cta: string;
}
interface ReviewReply {
  author: string;
  rating: number;
  originalText: string;
  reply: string;
}
interface ReplyTemplate {
  forRating: number;
  template: string;
}
interface WhatsappMessage {
  scenario: string;
  message: string;
}
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
  rating: number | null;
  reviewCount: number;
  mapsUri: string | null;
}

export default function LocalLiftPanel() {
  const { user, token } = useAuth();
  useDocumentTitle("Panel Local Lift | Polaris", "Local Lift Panel | Polaris", "", "");

  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [genStatus, setGenStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [genError, setGenError] = useState("");
  const [place, setPlace] = useState<PlaceInfo | null>(null);
  const [pkg, setPkg] = useState<LocalLiftPackage | null>(null);

  const [email, setEmail] = useState("");
  const [contactName, setContactName] = useState("");
  const [sendStatus, setSendStatus] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [sendError, setSendError] = useState("");

  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/dashboard" replace />;

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
        body: JSON.stringify({ businessName, city, lang: "es" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setGenError(data.error || "No se pudo generar el paquete.");
        setGenStatus("error");
        return;
      }
      setPlace(data.place);
      setPkg(data.package);
      setGenStatus("done");
    } catch {
      setGenError("Algo salió mal. Intenta de nuevo.");
      setGenStatus("error");
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
        body: JSON.stringify({ action: "send", place, package: pkg, email, contactName, lang: "es" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "No se pudo enviar.");
        setSendStatus("error");
        return;
      }
      setSendStatus("done");
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
      <h1 className="mt-3 text-2xl md:text-4xl font-display font-black tracking-[-0.03em]">Panel Local Lift -- Paquete 48H</h1>
      <p className="mt-2 text-sm text-[var(--color-text-secondary)]">Genera el contenido completo del tier pago (descripción, 10 publicaciones, respuestas a reseñas reales, plantillas, y 10 mensajes de WhatsApp) y envíalo por correo al cliente. La implementación en su ficha real sigue siendo manual.</p>

      <form onSubmit={handleGenerate} className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl">
        <input type="text" required placeholder="Nombre del negocio" value={businessName} onChange={(e) => setBusinessName(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm sm:col-span-2 border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]" />
        <input type="text" required placeholder="Ciudad" value={city} onChange={(e) => setCity(e.target.value)} className="glass-input rounded-xl px-4 py-3 text-sm border border-[var(--color-border-subtle)] outline-none focus:border-[var(--color-primary-base)]" />
        <button type="submit" disabled={genStatus === "loading"} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-4 py-3 text-sm font-black text-white disabled:opacity-60">
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
            <button onClick={handleSend} disabled={sendStatus === "loading" || !email.trim()} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-base)] px-4 py-2.5 text-sm font-black text-white disabled:opacity-50">
              {sendStatus === "loading" ? <><Loader2 size={15} className="animate-spin" />Enviando...</> : <><Send size={15} />Enviar por correo<ArrowRight size={15} /></>}
            </button>
            {sendStatus === "done" && <p className="mt-2 text-xs text-emerald-500">Enviado a {email}.</p>}
            {sendStatus === "error" && <p className="mt-2 text-xs text-red-400">{sendError}</p>}
          </section>
        </div>
      )}
    </div>
  );
}
