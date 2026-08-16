import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { AlertCircle, Check, Loader2, Mail, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PayPalCheckoutProvider } from "../components/PayPalCheckoutProvider";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const TIER_PRICE: Record<string, { amount: string; label: string; enLabel: string }> = {
  impulso: { amount: "29", label: "Impulso", enLabel: "Impulso" },
  ascenso: { amount: "99", label: "Ascenso", enLabel: "Ascenso" },
};

export default function LocalLiftPay() {
  const { leadId } = useParams<{ leadId: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [status, setStatus] = useState<"loading" | "ready" | "paid" | "notfound">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lead, setLead] = useState<{ businessName: string; city: string; tier: string; paid: boolean } | null>(null);
  // Tier the user actually wants to pay — starts from URL ?tier param or from lead.tier
  const [selectedTier, setSelectedTier] = useState<string | null>(null);

  useDocumentTitle("Pagar Local Lift | Polaris", "Pay Local Lift | Polaris", "", "");

  useEffect(() => {
    if (!leadId) {
      setStatus("notfound");
      return;
    }
    fetch("/api/local-lift-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lookup", leadId }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setStatus("notfound");
          return;
        }
        setLead(data);
        // URL ?tier param overrides Firestore tier (so CTAs from the diagnosis page work correctly)
        const urlTier = searchParams.get("tier");
        setSelectedTier(urlTier && TIER_PRICE[urlTier] ? urlTier : (data.tier || "impulso"));
        setStatus(data.paid ? "paid" : "ready");
      })
      .catch(() => setStatus("notfound"));
  }, [leadId, searchParams]);

  const tier = selectedTier || lead?.tier || "impulso";
  const price = TIER_PRICE[tier] || TIER_PRICE["impulso"];
  const otherTier = tier === "impulso" ? "ascenso" : "impulso";
  const otherPrice = TIER_PRICE[otherTier];

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 md:py-24">
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
                <T en="We're already working on your full Local Lift report. You'll receive it at your email within the next 2 hours. If you don't hear from us, write us on WhatsApp.">
                  Ya estamos trabajando en tu informe completo de Local Lift. Lo recibirás en tu correo en las próximas 2 horas. Si no recibes nada, escríbenos por WhatsApp.
                </T>
              </p>
              <a
                href="https://wa.me/18299200544"
                target="_blank"
                rel="noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[var(--color-border-subtle)] px-5 py-2.5 text-xs font-bold text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/40 transition-colors"
              >
                <T en="Any questions? Write us">¿Alguna duda? Escríbenos</T>
              </a>
            </div>
          </div>
        )}

        {status === "ready" && lead && (
          <div className="rounded-[var(--radius-bento)] glass-panel p-8 border border-[var(--color-primary-base)]/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]">
              <T en={`Local Lift · ${price.enLabel}`}>{`Local Lift · ${price.label}`}</T>
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-[-0.03em]">{lead.businessName}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{lead.city}</p>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-display font-black text-[var(--color-primary-base)]">${price.amount}</span>
              <span className="pb-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">USD</span>
            </div>

            <div className="mt-6">
              <PayPalCheckoutProvider>
                <PayPalButtons
                  style={{ layout: "vertical", shape: "rect", color: "gold", label: "pay", height: 48 }}
                  createOrder={(_data, actions) =>
                    actions.order.create({
                      intent: "CAPTURE",
                      purchase_units: [{ amount: { value: price.amount, currency_code: "USD" }, description: `Polaris Local Lift — ${price.label} — ${lead.businessName}` }],
                    })
                  }
                  onApprove={async (_data, actions) => {
                    if (!actions.order) return;
                    const details = await actions.order.capture();
                    try {
                      const res = await fetch("/api/local-lift-order", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          action: "confirm",
                          leadId,
                          tier,
                          paypalOrderId: details.id,
                          paypalPayerEmail: details.payer?.email_address || null,
                        }),
                      });
                      const data = await res.json();
                      if (!res.ok || !data.success) {
                        setErrorMsg(language === "en" ? "Payment went through, but we couldn't confirm it automatically — write us on WhatsApp." : "El pago pasó, pero no pudimos confirmarlo automáticamente — escríbenos por WhatsApp.");
                        return;
                      }
                      setStatus("paid");
                    } catch {
                      setErrorMsg(language === "en" ? "Payment went through, but something failed on our end — write us on WhatsApp." : "El pago pasó, pero algo falló de nuestro lado — escríbenos por WhatsApp.");
                    }
                  }}
                />
              </PayPalCheckoutProvider>
            </div>

            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}

            {/* Secondary tier option */}
            <div className="mt-5 rounded-xl border border-dashed border-[var(--color-border-subtle)] px-4 py-3">
              <p className="text-xs text-[var(--color-text-tertiary)] text-center mb-2">
                <T en={`Or switch to ${otherPrice.enLabel} ($${otherPrice.amount})`}>{`¿Prefieres ${otherPrice.label} ($${otherPrice.amount})?`}</T>
              </p>
              <button
                type="button"
                onClick={() => setSelectedTier(otherTier)}
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/8 px-4 py-2 text-xs font-bold text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/14 transition-colors"
              >
                <Sparkles size={13} />
                {otherTier === "impulso"
                  ? <T en="Switch to Impulso ($29) — quick wins">Cambiar a Impulso ($29) — mejoras rápidas</T>
                  : <T en="Switch to Ascenso ($99) — full implementation">Cambiar a Ascenso ($99) — implementación completa</T>
                }
              </button>
            </div>

            <p className="mt-5 flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]"><ShieldCheck size={13} /> <T en="Secure payment via PayPal.">Pago seguro vía PayPal.</T></p>
          </div>
        )}

        <div className="mt-8 text-center"><Link to="/local-lift" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"><T en="Back to Local Lift">Volver a Local Lift</T></Link></div>
      </main>
      <Footer />
    </div>
  );
}
