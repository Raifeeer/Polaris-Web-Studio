import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { FUNDING, PayPalButtons } from "@paypal/react-paypal-js";
import { AlertCircle, ArrowLeft, Check, Download, KeyRound, Loader2, Mail, MapPin, ShieldCheck, Star, Zap } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PayPalCheckoutProvider } from "../components/PayPalCheckoutProvider";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const TIER_PRICE: Record<string, { amount: string; label: string; enLabel: string }> = {
  impulso: { amount: "29", label: "Impulso", enLabel: "Impulso" },
  ascenso: { amount: "99", label: "Ascenso", enLabel: "Ascenso" },
};

function normalizeLocalLiftTier(value: unknown): "impulso" | "ascenso" {
  return value === "ascenso" || value === "implementado" ? "ascenso" : "impulso";
}

export default function LocalLiftPay() {
  const { leadId } = useParams<{ leadId: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [status, setStatus] = useState<"loading" | "ready" | "paid" | "notfound">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lead, setLead] = useState<{ businessName: string; city: string; tier: string; paid: boolean; address: string | null; rating: number | null; reviewCount: number | null; primaryType: string | null; mapsUri: string | null; invoiceNumber: string | null; portalProvisioned: boolean; sentPortalWelcomeEmail: boolean; paypalOrderId: string | null; paypalPayerEmail: string | null; paidAt: string | null; contactName: string; email: string } | null>(null);
  const [invoiceDownloading, setInvoiceDownloading] = useState(false);
  const [invoiceError, setInvoiceError] = useState("");
  // Tier the user actually wants to pay — starts from URL ?tier param or from lead.tier
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [isSwitchingTier, setIsSwitchingTier] = useState(false);

  useDocumentTitle("Pagar Local Lift | Polaris", "Pay Local Lift | Polaris", "", "");

  const refreshLead = useCallback(async (initialLoad = false) => {
    if (!leadId) {
      if (initialLoad) setStatus("notfound");
      return;
    }
    try {
      const response = await fetch("/api/local-lift-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", leadId }),
      });
      const data = await response.json();
      if (!response.ok || !data.success) {
        if (initialLoad) setStatus("notfound");
        return;
      }
      const normalizedTier = normalizeLocalLiftTier(data.tier);
      setLead({ ...data, tier: normalizedTier, address: data.address || null, rating: data.rating ?? null, reviewCount: data.reviewCount ?? null, primaryType: data.primaryType || null, mapsUri: data.mapsUri || null, invoiceNumber: data.invoiceNumber || null, portalProvisioned: !!data.portalProvisioned, sentPortalWelcomeEmail: !!data.sentPortalWelcomeEmail, paypalOrderId: data.paypalOrderId || null, paypalPayerEmail: data.paypalPayerEmail || null, paidAt: data.paidAt || null, contactName: data.contactName || "", email: data.email || "" });
      const urlTier = searchParams.get("tier");
      let storedTier = "";
      try { storedTier = sessionStorage.getItem(`polaris-local-lift-tier:${leadId}`) || ""; } catch { /* no-op */ }
      if (initialLoad) setSelectedTier(urlTier && TIER_PRICE[urlTier] ? normalizeLocalLiftTier(urlTier) : TIER_PRICE[storedTier] ? normalizeLocalLiftTier(storedTier) : normalizedTier);
      setStatus(data.paid ? "paid" : "ready");
    } catch {
      if (initialLoad) setStatus("notfound");
    }
  }, [leadId, searchParams]);

  useEffect(() => {
    void refreshLead(true);
  }, [refreshLead]);

  // Otra pestaña puede completar el pago mientras esta sigue abierta. Al
  // volver al checkout, el backend es la autoridad y los botones desaparecen.
  useEffect(() => {
    const refreshWhenVisible = () => {
      if (document.visibilityState === "visible") void refreshLead(false);
    };
    window.addEventListener("focus", refreshWhenVisible);
    document.addEventListener("visibilitychange", refreshWhenVisible);
    return () => {
      window.removeEventListener("focus", refreshWhenVisible);
      document.removeEventListener("visibilitychange", refreshWhenVisible);
    };
  }, [refreshLead]);

  const tier = selectedTier || lead?.tier || "impulso";
  const price = TIER_PRICE[tier] || TIER_PRICE["impulso"];
  const otherTier = tier === "impulso" ? "ascenso" : "impulso";
  const otherPrice = TIER_PRICE[otherTier];

  const paymentErrorMessage = (data: any, fallback: string) => {
    if (data?.reason === "order_in_progress") return language === "en" ? "Another checkout tab is already preparing this payment. Wait a moment and try again." : "Otra pestaña ya está preparando este pago. Espera un momento e inténtalo de nuevo.";
    if (data?.reason === "payment_in_progress") return language === "en" ? "This payment is already being confirmed. Wait a moment before trying again." : "Este pago ya se está confirmando. Espera un momento antes de intentarlo otra vez.";
    if (data?.reason === "already_paid" || data?.alreadyPaid) return language === "en" ? "This order has already been paid." : "Esta orden ya fue pagada.";
    if (data?.reason === "tier_conflict") return language === "en" ? "This checkout is already associated with another package. Reload to see the correct option." : "Este checkout ya está asociado a otro paquete. Recarga para ver la opción correcta.";
    return data?.error || fallback;
  };

  const handleTierChange = () => {
    if (isSwitchingTier) return;
    setIsSwitchingTier(true);
    window.setTimeout(() => {
      setSelectedTier(otherTier);
      try { if (leadId) sessionStorage.setItem(`polaris-local-lift-tier:${leadId}`, otherTier); } catch { /* no-op */ }
      setIsSwitchingTier(false);
    }, prefersReducedMotion ? 0 : 420);
  };

  const handleCreateOrder: NonNullable<ComponentProps<typeof PayPalButtons>["createOrder"]> = async () => {
    setErrorMsg("");
    const res = await fetch("/api/local-lift-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create-order", leadId, tier }),
    });
    const data = await res.json().catch(() => ({}));
    if (data?.alreadyPaid) {
      setErrorMsg(paymentErrorMessage(data, language === "en" ? "This order has already been paid." : "Esta orden ya fue pagada."));
      await refreshLead(false);
      throw new Error("already_paid");
    }
    if (!res.ok || !data.success || typeof data.orderId !== "string") {
      const message = paymentErrorMessage(data, language === "en" ? "We couldn't start the payment." : "No se pudo iniciar el pago.");
      setErrorMsg(message);
      throw new Error(message);
    }
    return data.orderId;
  };

  const handlePaymentApproval: NonNullable<ComponentProps<typeof PayPalButtons>["onApprove"]> = async (data) => {
    if (!data.orderID) return;
    try {
      const res = await fetch("/api/local-lift-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "confirm", leadId, tier, paypalOrderId: data.orderID }),
      });
      const result = await res.json().catch(() => ({}));
      if (result?.alreadyPaid) {
        await refreshLead(false);
        return;
      }
      if (!res.ok || !result.success) {
        setErrorMsg(paymentErrorMessage(result, language === "en" ? "We couldn't confirm this payment automatically — write us on WhatsApp." : "No pudimos confirmar este pago automáticamente — escríbenos por WhatsApp."));
        return;
      }
      try { if (leadId) sessionStorage.removeItem(`polaris-local-lift-tier:${leadId}`); } catch { /* no-op */ }
      await refreshLead(false);
    } catch {
      setErrorMsg(language === "en" ? "We couldn't confirm this payment automatically — write us on WhatsApp." : "No pudimos confirmar este pago automáticamente — escríbenos por WhatsApp.");
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 md:py-24">
        {status !== "loading" && (
          <Link
            to="/local-lift"
            className="mb-5 inline-flex items-center gap-2 rounded-lg px-1 py-1 text-xs font-bold text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-primary-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
          >
            <ArrowLeft size={14} />
            <T en="Back to diagnosis">Volver al diagnóstico</T>
          </Link>
        )}
        {status === "loading" && (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-[var(--color-primary-base)]" /></div>
        )}

        {status === "notfound" && (
          <div className="text-center rounded-[var(--radius-bento)] glass-panel p-10 border border-[var(--color-border-subtle)]">
            <AlertCircle size={28} className="mx-auto text-red-400" />
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]"><T en="We couldn't find this payment link. It may have expired — write us on WhatsApp and we'll help you directly.">No pudimos encontrar este enlace de pago. Puede haber vencido — escríbenos por WhatsApp y te ayudamos directo.</T></p>
            <a href="https://wa.me/18299200544" target="_blank" rel="noreferrer" className="mt-6 inline-block rounded-xl bg-[var(--color-primary-base)] px-6 py-3 text-sm font-black text-white">WhatsApp</a>
          </div>
        )}

        {status === "paid" && lead && (
          <div className="rounded-[var(--radius-bento)] glass-panel p-8 border border-emerald-500/20 text-center">
            <div className="mx-auto w-14 h-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-4">
              <Check size={24} className="text-emerald-500" />
            </div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-500 mb-2">
              <T en="Payment confirmed">Pago confirmado</T>
            </p>
            <h1 className="text-2xl font-display font-black tracking-tight">{lead.businessName}</h1>
            <div className="mt-5 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] p-5">
              <Mail size={22} className="mx-auto text-[var(--color-primary-base)] mb-3" />
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                {lead.tier === "ascenso" ? (
                  <T en="Your Ascenso package includes a 1:1 welcome session to review your Google listing and plan the changes we'll implement together. Go to your client portal to schedule your session at a time that works for you.">
                    Tu paquete Ascenso incluye una sesión de bienvenida 1:1 para revisar tu ficha de Google y planificar juntos los cambios que vamos a implementar. Entra a tu portal de cliente para agendar tu sesión en el horario que prefieras.
                  </T>
                ) : (
                  <T en="We're already working on your full Local Lift report. You'll receive it at your email within the next 2 hours. If you don't hear from us, write us on WhatsApp.">
                    Ya estamos trabajando en tu informe completo de Local Lift. Lo recibirás en tu correo en las próximas 2 horas. Si no recibes nada, escríbenos por WhatsApp.
                  </T>
                )}
              </p>
              <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-2">
                <a
                  href="https://wa.me/18299200544"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs font-bold text-white transition-opacity hover:opacity-90"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="currentColor" aria-hidden="true">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.92 0-2.65-1.03-5.14-2.91-7.01A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.55 3.71-8.26 8.27-8.26a8.2 8.2 0 0 1 5.84 2.42 8.19 8.19 0 0 1 2.42 5.83c0 4.56-3.71 8.25-8.27 8.25Zm4.53-6.19c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.07 0 1.23.89 2.41 1.02 2.58.12.16 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z" />
                  </svg>
                  <T en="Chat on WhatsApp">Escribir por WhatsApp</T>
                </a>
                <a
                  href={`mailto:hola@polarisweb.studio?subject=${encodeURIComponent(`Local Lift — ${lead.businessName}`)}`}
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-subtle)] px-5 py-2.5 text-xs font-bold text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/40 transition-colors"
                >
                  <Mail size={14} />
                  <T en="Write us by email">Escribir por correo</T>
                </a>
              </div>
            </div>

            {/* Detalle real del pago -- PayPal, monto, tier, negocio */}
            <div className="mt-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5 text-left">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                <T en="Payment details">Detalle del pago</T>
              </p>
              <dl className="space-y-2 text-xs">
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--color-text-tertiary)]"><T en="Business">Negocio</T></dt>
                  <dd className="font-bold text-[var(--color-text-primary)] text-right">{lead.businessName}</dd>
                </div>
                {lead.city && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--color-text-tertiary)]"><T en="City">Ciudad</T></dt>
                    <dd className="font-bold text-[var(--color-text-primary)] text-right">{lead.city}</dd>
                  </div>
                )}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--color-text-tertiary)]"><T en="Package">Paquete</T></dt>
                  <dd className="font-bold text-[var(--color-text-primary)] text-right">{TIER_PRICE[lead.tier]?.label || lead.tier}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-[var(--color-text-tertiary)]"><T en="Amount">Monto</T></dt>
                  <dd className="font-bold text-emerald-500 text-right">${TIER_PRICE[lead.tier]?.amount || "—"} USD</dd>
                </div>
                {lead.invoiceNumber && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--color-text-tertiary)]"><T en="Polaris payment N°">N.° de pago Polaris</T></dt>
                    <dd className="font-bold text-[var(--color-text-primary)] text-right font-mono">{lead.invoiceNumber}</dd>
                  </div>
                )}
                {lead.paypalOrderId && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--color-text-tertiary)]"><T en="PayPal reference">Referencia PayPal</T></dt>
                    <dd className="font-bold text-[var(--color-text-primary)] text-right font-mono break-all">{lead.paypalOrderId}</dd>
                  </div>
                )}
                {lead.paypalPayerEmail && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--color-text-tertiary)]"><T en="Payer email">Correo del pagador</T></dt>
                    <dd className="font-bold text-[var(--color-text-primary)] text-right break-all">{lead.paypalPayerEmail}</dd>
                  </div>
                )}
                {lead.paidAt && (
                  <div className="flex items-center justify-between gap-3">
                    <dt className="text-[var(--color-text-tertiary)]"><T en="Paid on">Pagado el</T></dt>
                    <dd className="font-bold text-[var(--color-text-primary)] text-right">
                      {new Date(lead.paidAt).toLocaleDateString(language === "en" ? "en-US" : "es-DO", { year: "numeric", month: "long", day: "numeric" })}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Qué incluye el plan comprado -- mismo detalle que la pantalla de checkout */}
            <div className="mt-4 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5 text-left">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                <T en={`What's included in ${TIER_PRICE[lead.tier]?.enLabel || "Local Lift"}`}>{`Qué incluye ${TIER_PRICE[lead.tier]?.label || "tu paquete"}`}</T>
              </p>
              {lead.tier === "ascenso" ? (
                <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                  {[
                    ["Todo lo incluido en Impulso", "Everything in Impulso"],
                    ["Análisis de reseñas recientes y buenas prácticas personalizadas", "Recent review analysis and personalized best practices"],
                    ["Guía paso a paso para aplicar cada cambio", "Step-by-step guide to apply each change"],
                    ["Indicaciones para aplicar textos e imágenes", "Instructions for applying text and images"],
                    ["Hasta tres rondas agrupadas de revisión", "Up to three grouped review rounds"],
                    ["Acompañamiento personalizado 1:1 para avanzar con claridad", "Personalized 1:1 accompaniment to move forward with clarity"],
                  ].map(([es, en]) => (
                    <li key={es} className="flex items-start gap-2">
                      <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                      <T en={en}>{es}</T>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                  {[
                    ["Auditoría completa de tu perfil local", "Complete audit of your local profile"],
                    ["Descripción, servicios y llamadas a la acción optimizados", "Optimized description, services, and CTAs"],
                    ["10 publicaciones listas para aplicar", "10 posts ready to apply"],
                    ["15 respuestas personalizadas para reseñas", "15 personalized review replies"],
                    ["10 mensajes de WhatsApp para seguimiento", "10 WhatsApp follow-up messages"],
                    ["Entrega por correo en 2 horas", "Delivered by email in 2 hours"],
                  ].map(([es, en]) => (
                    <li key={es} className="flex items-start gap-2">
                      <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                      <T en={en}>{es}</T>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Acceso al portal -- las credenciales van por correo aparte, nunca
                se muestran en pantalla (esta URL no exige sesión). */}
            {lead.portalProvisioned && (
              <div className="mt-4 rounded-xl border border-[var(--color-primary-base)]/25 bg-[var(--color-primary-base)]/[0.06] p-5 text-left">
                <div className="flex items-start gap-3">
                  <KeyRound size={18} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" />
                  <div>
                    <p className="text-sm font-black text-[var(--color-text-primary)]">
                      <T en="Your client portal is ready">Tu portal de cliente está listo</T>
                    </p>
                    <p className="mt-1.5 text-xs text-[var(--color-text-secondary)] leading-relaxed">
                      {lead.tier === "ascenso" ? (
                        lead.sentPortalWelcomeEmail ? (
                          <T en="We sent your access credentials to your email. Go to your portal to schedule your welcome session and follow your package's progress.">
                            Te enviamos tus credenciales de acceso por correo. Entra a tu portal para agendar tu sesión de bienvenida y seguir el avance de tu paquete.
                          </T>
                        ) : (
                          <T en="Sign in with your existing account to schedule your welcome session and follow your package's progress.">
                            Entra con tu cuenta de siempre para agendar tu sesión de bienvenida y seguir el avance de tu paquete.
                          </T>
                        )
                      ) : lead.sentPortalWelcomeEmail ? (
                        <T en="We sent your access credentials to your email. From the portal you can follow your package's progress and download your invoice whenever you need it.">
                          Te enviamos tus credenciales de acceso por correo. Desde el portal puedes seguir el avance de tu paquete y descargar tu factura cuando la necesites.
                        </T>
                      ) : (
                        <T en="Sign in with your existing account to follow your package's progress and download your invoice whenever you need it.">
                          Entra con tu cuenta de siempre para seguir el avance de tu paquete y descargar tu factura cuando la necesites.
                        </T>
                      )}
                    </p>
                    <Link
                      to="/login"
                      className="mt-3 inline-flex items-center gap-2 rounded-lg bg-[var(--color-primary-base)] px-4 py-2 text-xs font-black text-white hover:opacity-90 transition-opacity"
                    >
                      {lead.tier === "ascenso" ? (
                        <T en="Schedule my session">Agendar mi sesión</T>
                      ) : (
                        <T en="Go to my portal">Entrar a mi portal</T>
                      )}
                    </Link>
                  </div>
                </div>
              </div>
            )}

            {/* Descarga directa de la factura, sin necesidad de entrar al portal */}
            {lead.invoiceNumber && (
              <button
                type="button"
                disabled={invoiceDownloading}
                onClick={async () => {
                  setInvoiceDownloading(true);
                  setInvoiceError("");
                  try {
                    const res = await fetch("/api/local-lift-order", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ action: "invoice", leadId }),
                    });
                    if (!res.ok) {
                      const payload = await res.json().catch(() => ({}));
                      throw new Error(payload.error || (res.status === 404 ? "invoice_not_ready" : "download_failed"));
                    }
                    const blob = await res.blob();
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `Factura-${lead.invoiceNumber}.pdf`;
                    a.click();
                    URL.revokeObjectURL(url);
                  } catch (error) {
                    const code = error instanceof Error ? error.message : "download_failed";
                    setInvoiceError(code === "invoice_not_ready"
                      ? (language === "en" ? "The invoice is still being prepared. Try again in a moment." : "La factura todavía se está preparando. Intenta de nuevo en un momento.")
                      : (language === "en" ? "We couldn't download the invoice. It is also attached to your confirmation email." : "No pudimos descargar la factura. También está adjunta a tu correo de confirmación."));
                  } finally {
                    setInvoiceDownloading(false);
                  }
                }}
                className="mt-4 w-full inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-subtle)] px-5 py-3 text-xs font-bold text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/40 transition-colors disabled:opacity-60"
              >
                {invoiceDownloading
                  ? <><Loader2 size={14} className="animate-spin" /><T en="Generating…">Generando…</T></>
                  : <><Download size={14} /><T en={`Download invoice N° ${lead.invoiceNumber}`}>{`Descargar factura N° ${lead.invoiceNumber}`}</T></>
                }
              </button>
            )}
            {invoiceError && <p className="mt-2 text-xs text-amber-500 text-left">{invoiceError}</p>}

            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 text-left text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}
          </div>
        )}

        {status === "ready" && lead && (
          <div className="rounded-[var(--radius-bento)] glass-panel p-8 border border-[var(--color-primary-base)]/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]">
              <T en="Local Lift">Local Lift</T>
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-[-0.03em]">{lead.businessName}</h1>

            {/* Ubicación real desde Google Maps (place.address), no la ciudad que el cliente escribió */}
            <div className="mt-1 flex flex-col gap-0.5">
              {lead.address ? (
                <p className="flex items-start gap-1.5 text-sm text-[var(--color-text-tertiary)]">
                  <MapPin size={14} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]/60" />
                  <span>{lead.address}</span>
                </p>
              ) : lead.city ? (
                <p className="text-sm text-[var(--color-text-tertiary)]">{lead.city}</p>
              ) : null}
              {lead.rating != null && (
                <p className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)]">
                  <Star size={12} className="text-amber-400 fill-amber-400" />
                  <span className="font-bold text-[var(--color-text-secondary)]">{lead.rating.toFixed(1)}</span>
                  {lead.reviewCount != null && <span>· {lead.reviewCount} <T en="reviews">reseñas</T></span>}
                  {lead.primaryType && <span>· {lead.primaryType}</span>}
                </p>
              )}
            </div>

            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={tier}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 12, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8, scale: 0.99 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.34, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Detalle de qué incluye el tier elegido */}
                <div className="mt-5 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4">
              <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-3">
                <T en={`What's included in ${price.enLabel}`}>{`Qué incluye ${price.label}`}</T>
              </p>
              {tier === "impulso" ? (
                <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                  {[
                    ["Auditoría completa de tu perfil local", "Complete audit of your local profile"],
                    ["Descripción, servicios y llamadas a la acción optimizados", "Optimized description, services, and CTAs"],
                    ["10 publicaciones listas para aplicar", "10 posts ready to apply"],
                    ["15 respuestas personalizadas para reseñas", "15 personalized review replies"],
                    ["10 mensajes de WhatsApp para seguimiento", "10 WhatsApp follow-up messages"],
                    ["Entrega por correo en 2 horas", "Delivered by email in 2 hours"],
                  ].map(([es, en]) => (
                    <li key={es} className="flex items-start gap-2">
                      <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                      <T en={en}>{es}</T>
                    </li>
                  ))}
                </ul>
              ) : (
                <ul className="space-y-1.5 text-xs text-[var(--color-text-secondary)]">
                  {[
                    ["Todo lo incluido en Impulso", "Everything in Impulso"],
                    ["Análisis de reseñas recientes y buenas prácticas personalizadas", "Recent review analysis and personalized best practices"],
                    ["Guía paso a paso para aplicar cada cambio", "Step-by-step guide to apply each change"],
                    ["Indicaciones para aplicar textos e imágenes", "Instructions for applying text and images"],
                    ["Hasta tres rondas agrupadas de revisión", "Up to three grouped review rounds"],
                    ["Acompañamiento personalizado 1:1 para avanzar con claridad", "Personalized 1:1 accompaniment to move forward with clarity"],
                  ].map(([es, en]) => (
                    <li key={es} className="flex items-start gap-2">
                      <Check size={12} className="mt-0.5 shrink-0 text-emerald-500" />
                      <T en={en}>{es}</T>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="mt-5 flex items-end gap-2">
              <span className="text-4xl font-display font-black text-[var(--color-primary-base)]">${price.amount}</span>
              <span className="pb-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">USD</span>
            </div>

            <div className="mt-5">
              <PayPalCheckoutProvider>
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", color: "gold", label: "pay", height: 48 }}
                  createOrder={handleCreateOrder}
                  onApprove={handlePaymentApproval}
                />
                <PayPalButtons
                  fundingSource={FUNDING.CARD}
                  style={{ layout: "vertical", shape: "rect", color: "silver", label: "pay", height: 48 }}
                  createOrder={handleCreateOrder}
                  onApprove={handlePaymentApproval}
                />
              </PayPalCheckoutProvider>
            </div>
              </motion.div>
            </AnimatePresence>

            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}

            {/* Secondary tier option */}
            <div className="mt-5 rounded-xl border border-dashed border-[var(--color-border-subtle)] px-4 py-3">
              <p className="text-xs text-[var(--color-text-tertiary)] text-center mb-2">
                <T en="Want to continue with another plan?">¿Quieres seguir con otro plan?</T>
              </p>
              <button
                type="button"
                onClick={handleTierChange}
                disabled={isSwitchingTier}
                className="w-full inline-flex items-center justify-center rounded-lg border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/8 px-3 py-2 text-[11px] font-bold leading-none whitespace-nowrap text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/14 disabled:cursor-wait disabled:opacity-70"
              >
                {isSwitchingTier ? (
                  <span className="inline-flex items-center gap-2" aria-live="polite">
                    <Loader2 size={13} className="animate-spin" />
                    <T en="Changing plan…">Cambiando plan…</T>
                  </span>
                ) : (
                  <T en={`Switch to ${otherPrice.enLabel} ($${otherPrice.amount})`}>{`Cambiar a ${otherPrice.label} ($${otherPrice.amount})`}</T>
                )}
              </button>
            </div>

            <p className="mt-5 flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]"><ShieldCheck size={13} /> <T en="Secure payment via PayPal.">Pago seguro vía PayPal.</T></p>
          </div>
        )}

      </main>
      <Footer />
    </div>
  );
}
