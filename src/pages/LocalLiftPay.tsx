import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { AlertCircle, Check, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PayPalCheckoutProvider } from "../components/PayPalCheckoutProvider";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const TIER_PRICE: Record<string, { amount: string; label: string; enLabel: string }> = {
  "48h": { amount: "99", label: "Local Lift 48H", enLabel: "Local Lift 48H" },
  implementado: { amount: "179", label: "Implementado", enLabel: "Implemented" },
};

// Página de pago dedicada: llega tanto de la compra directa (link "Comprar
// ahora" en /local-lift) como del botón de pago del correo de propuesta
// (teaser) que manda el admin desde el panel. En ambos casos el flujo real
// es el mismo: capturar el pago client-side con el SDK de PayPal (mismo
// patrón de confianza que Tano-Excursions/Checkout.tsx) y confirmarlo
// contra /api/local-lift-order.
export default function LocalLiftPay() {
  const { leadId } = useParams<{ leadId: string }>();
  const { language } = useLanguage();
  const [status, setStatus] = useState<"loading" | "ready" | "paid" | "notfound">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lead, setLead] = useState<{ businessName: string; city: string; tier: string; paid: boolean } | null>(null);

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
        setStatus(data.paid ? "paid" : "ready");
      })
      .catch(() => setStatus("notfound"));
  }, [leadId]);

  const price = lead ? TIER_PRICE[lead.tier] || TIER_PRICE["48h"] : TIER_PRICE["48h"];

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

        {(status === "ready" || status === "paid") && lead && (
          <div className="rounded-[var(--radius-bento)] glass-panel p-8 border border-[var(--color-primary-base)]/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en={price.enLabel}>{price.label}</T></p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-[-0.03em]">{lead.businessName}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{lead.city}</p>

            <div className="mt-6 flex items-end gap-2">
              <span className="text-4xl font-display font-black text-[var(--color-primary-base)]">${price.amount}</span>
              <span className="pb-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">USD</span>
            </div>

            {status === "paid" ? (
              <div className="mt-8 flex items-center gap-2 text-emerald-500 text-sm font-black">
                <Check size={18} /> <T en="Already paid — your full package will arrive by email shortly.">Ya está pagado — tu paquete completo te llega por correo en breve.</T>
              </div>
            ) : (
              <div className="mt-8">
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
                            tier: lead.tier,
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
            )}

            {errorMsg && (
              <div className="mt-4 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{errorMsg}</span>
              </div>
            )}

            <p className="mt-6 flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]"><ShieldCheck size={13} /> <T en="Secure payment via PayPal.">Pago seguro vía PayPal.</T></p>
          </div>
        )}

        <div className="mt-8 text-center"><Link to="/local-lift" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"><T en="Back to Local Lift">Volver a Local Lift</T></Link></div>
      </main>
      <Footer />
    </div>
  );
}
