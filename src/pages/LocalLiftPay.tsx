import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { AlertCircle, Check, Copy, Loader2, Mail, MessageCircle, ShieldCheck, Sparkles } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PayPalCheckoutProvider } from "../components/PayPalCheckoutProvider";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const TIER_PRICE: Record<string, { amount: string; label: string; enLabel: string; dopAmount: string }> = {
  impulso: { amount: "29", label: "Impulso", enLabel: "Impulso", dopAmount: "1,750" },
  ascenso: { amount: "99", label: "Ascenso", enLabel: "Ascenso", dopAmount: "5,950" },
};

const BANK_ACCOUNTS = {
  popular: {
    name: "Banco Popular",
    color: "#002B49",
    holder: "Cristian Raifer Dicen",
    account: "821234051",
    type: "Cuenta de Ahorros",
    idDoc: "402-3767656-0",
    email: null,
  },
  bhd: {
    name: "Banco BHD",
    color: "#008037",
    holder: "CRISTIAN DICEN",
    account: "26841430016",
    type: "Cuenta de Ahorros RD$",
    idDoc: "40237676560",
    email: "cristian2200299@gmail.com",
  },
  qik: {
    name: "Qik Banco Digital",
    color: "#4B1278",
    holder: "Cristian Raifer Dicen",
    account: "1001984493",
    type: "Cuenta de Ahorro",
    idDoc: "40237676560",
    email: null,
  },
};

export default function LocalLiftPay() {
  const { leadId } = useParams<{ leadId: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [status, setStatus] = useState<"loading" | "ready" | "paid" | "notfound">("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [lead, setLead] = useState<{ businessName: string; city: string; tier: string; paid: boolean } | null>(null);
  const [selectedTier, setSelectedTier] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"paypal" | "transfer">("paypal");
  const [selectedBank, setSelectedBank] = useState<"popular" | "bhd" | "qik">("popular");
  const [copiedField, setCopiedField] = useState<string | null>(null);

  useDocumentTitle("Pagar Local Lift | Polaris", "Pay Local Lift | Polaris", "", "");

  useEffect(() => {
    if (!leadId) {
      setStatus("notfound");
      return;
    }
    fetch(`/api/local-lift-order?leadId=${encodeURIComponent(leadId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) {
          setStatus("notfound");
          return;
        }
        setLead(data);
        const urlTier = searchParams.get("tier");
        const activeTier = urlTier && TIER_PRICE[urlTier] ? urlTier : (data.tier || "impulso");
        setSelectedTier(activeTier);
        setStatus(data.paid ? "paid" : "ready");

        try {
          localStorage.setItem(
            "local_lift_active_order",
            JSON.stringify({ leadId, tier: activeTier, businessName: data.businessName, city: data.city })
          );
        } catch {}
      })
      .catch(() => setStatus("notfound"));
  }, [leadId, searchParams]);

  const tier = selectedTier || lead?.tier || "impulso";
  const price = TIER_PRICE[tier] || TIER_PRICE["impulso"];
  const otherTier = tier === "impulso" ? "ascenso" : "impulso";
  const otherPrice = TIER_PRICE[otherTier];
  const activeBank = BANK_ACCOUNTS[selectedBank];

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    language === "en"
      ? `Hello Cristian, I made the transfer for Local Lift (${lead?.businessName || "My business"} - Plan ${price.enLabel} - $${price.amount} USD / RD$ ${price.dopAmount}). Bank: ${activeBank.name}. Order ID: ${leadId}. Attaching receipt:`
      : `Hola Cristian, realicé la transferencia para Local Lift (${lead?.businessName || "Mi negocio"} - Plan ${price.label} - $${price.amount} USD / RD$ ${price.dopAmount}). Banco: ${activeBank.name}. ID de orden: ${leadId}. Adjunto comprobante:`
  );

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="max-w-xl mx-auto px-6 pt-32 pb-24">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center py-20 text-[var(--color-text-tertiary)]">
            <Loader2 className="animate-spin mb-3" size={32} />
            <p className="text-sm"><T en="Loading your proposal...">Cargando tu propuesta...</T></p>
          </div>
        )}

        {status === "notfound" && (
          <div className="rounded-[var(--radius-bento)] glass-panel p-8 text-center border border-red-500/20">
            <AlertCircle size={32} className="mx-auto text-red-400 mb-3" />
            <h1 className="text-xl font-display font-black tracking-tight"><T en="Proposal not found">Propuesta no encontrada</T></h1>
            <p className="mt-2 text-sm text-[var(--color-text-secondary)] leading-relaxed">
              <T en="This payment link has expired or doesn't exist. Run a new free diagnosis to generate one.">
                Este enlace de pago expiró o no existe. Corre un nuevo diagnóstico gratuito para generar uno.
              </T>
            </p>
            <Link to="/local-lift" className="mt-5 inline-block text-xs font-black text-[var(--color-primary-base)] underline">
              <T en="Go to Local Lift">Ir a Local Lift</T>
            </Link>
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
                <T en="We're already preparing your full Local Lift package. You'll receive it at your email within the next 2 hours. If you don't hear from us, write us on WhatsApp.">
                  Ya estamos preparando tu paquete completo de Local Lift. Lo recibirás en tu correo en las próximas 2 horas. Si no recibes nada, escríbenos por WhatsApp.
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
          <div className="rounded-[var(--radius-bento)] glass-panel p-6 sm:p-8 border border-[var(--color-primary-base)]/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]">
              <T en={`Local Lift · ${price.enLabel}`}>{`Local Lift · ${price.label}`}</T>
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-[-0.03em]">{lead.businessName}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{lead.city}</p>

            <div className="mt-4 flex flex-wrap items-baseline gap-2">
              <span className="text-4xl font-display font-black tracking-tight">${price.amount}</span>
              <span className="pb-1.5 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">USD</span>
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md ml-auto">
                ≈ RD$ {price.dopAmount}
              </span>
            </div>

            {/* Payment Method Switcher */}
            <div className="mt-6 flex rounded-xl bg-[var(--color-surface-elevated)] p-1 border border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentMethod === "paypal"
                    ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-subtle)]"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                PayPal / Tarjeta
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  paymentMethod === "transfer"
                    ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-subtle)]"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                Transferencia RD 🇩🇴
              </button>
            </div>

            {/* PayPal Block */}
            {paymentMethod === "paypal" && (
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
                <p className="mt-4 flex items-center gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
                  <ShieldCheck size={13} /> <T en="Secure payment via PayPal.">Pago seguro vía PayPal.</T>
                </p>
              </div>
            )}

            {/* Local Bank Transfer Block */}
            {paymentMethod === "transfer" && (
              <div className="mt-6 space-y-4">
                {/* Bank Tabs */}
                <div className="grid grid-cols-3 gap-2">
                  {(["popular", "bhd", "qik"] as const).map((bKey) => {
                    const b = BANK_ACCOUNTS[bKey];
                    const isSelected = selectedBank === bKey;
                    return (
                      <button
                        key={bKey}
                        type="button"
                        onClick={() => setSelectedBank(bKey)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]/[0.08] shadow-sm font-black"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] opacity-70 hover:opacity-100"
                        }`}
                      >
                        <p className="text-[11px] font-bold text-[var(--color-text-primary)] leading-tight">{b.name}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Bank Account Details Card */}
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4 sm:p-5 text-left space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                    <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">
                      {activeBank.name}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]">
                      {activeBank.type}
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Account Number">No. de Cuenta</T>
                      </p>
                      <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">{activeBank.account}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.account, "account")}
                      className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] hover:border-[var(--color-primary-base)]/40 transition-colors"
                      title="Copiar número"
                    >
                      {copiedField === "account" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Account Holder */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Beneficiary Name">Titular</T>
                      </p>
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">{activeBank.holder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.holder, "holder")}
                      className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] hover:border-[var(--color-primary-base)]/40 transition-colors"
                      title="Copiar titular"
                    >
                      {copiedField === "holder" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* ID / Cédula */}
                  <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Identity Document">Cédula</T>
                      </p>
                      <p className="font-mono text-xs font-bold text-[var(--color-text-primary)]">{activeBank.idDoc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.idDoc, "idDoc")}
                      className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] hover:border-[var(--color-primary-base)]/40 transition-colors"
                      title="Copiar cédula"
                    >
                      {copiedField === "idDoc" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Email if available */}
                  {activeBank.email && (
                    <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                      <div>
                        <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                          <T en="Interbank Email">Correo interbancario</T>
                        </p>
                        <p className="font-mono text-xs text-[var(--color-text-primary)]">{activeBank.email}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(activeBank.email!, "email")}
                        className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] hover:border-[var(--color-primary-base)]/40 transition-colors"
                        title="Copiar correo"
                      >
                        {copiedField === "email" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                      </button>
                    </div>
                  )}
                </div>

                {/* WhatsApp Confirmation Button */}
                <a
                  href={`https://wa.me/18299200544?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-600/20 transition-all hover:-translate-y-0.5"
                >
                  <MessageCircle size={16} />
                  <T en="Send transfer receipt on WhatsApp">Enviar comprobante por WhatsApp</T>
                </a>
                <p className="text-[11px] text-center text-[var(--color-text-tertiary)]">
                  <T en="Your order link is saved in your chat history so you can resume anytime.">
                    El enlace a tu orden queda guardado en tu chat para que puedas reanudar cuando quieras.
                  </T>
                </p>
              </div>
            )}

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
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
