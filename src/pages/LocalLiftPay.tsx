import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { AlertCircle, Check, Copy, Loader2, Mail, RefreshCw, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AISparkleIcon from "../components/AISparkleIcon";
import { PayPalCheckoutProvider } from "../components/PayPalCheckoutProvider";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

const TIER_PRICE: Record<string, { amount: string; label: string; enLabel: string }> = {
  impulso: { amount: "29", label: "Impulso", enLabel: "Impulso" },
  ascenso: { amount: "99", label: "Ascenso", enLabel: "Ascenso" },
};

function PopularLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <img
      src="/brand/banco-popular-horizontal-transparent.png"
      alt="Banco Popular"
      className={`${className} object-contain`}
    />
  );
}

function BhdLogo({ className = "h-6 w-auto" }: { className?: string }) {
  return (
    <img
      src="/brand/banco-bhd-horizontal.svg"
      alt="Banco BHD"
      className={`${className} object-contain`}
    />
  );
}

function QikLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <img
      src="/brand/qik-logo-light.svg"
      alt="Qik Banco Digital"
      className={`${className} object-contain`}
    />
  );
}

const BANK_ACCOUNTS = {
  popular: {
    name: "Banco Popular",
    color: "#002B49",
    LogoComponent: PopularLogo,
    holder: "Cristian Dicen",
    account: "821234051",
    idDoc: "40237676560",
    email: "cristian2200299@gmail.com",
  },
  bhd: {
    name: "Banco BHD",
    color: "#008037",
    LogoComponent: BhdLogo,
    holder: "Cristian Dicen",
    account: "26841430016",
    idDoc: "40237676560",
    email: "cristian2200299@gmail.com",
  },
  qik: {
    name: "Qik Banco Digital",
    color: "#4B1278",
    LogoComponent: QikLogo,
    holder: "Cristian Dicen",
    account: "1001984493",
    idDoc: "40237676560",
    email: "cristian2200299@gmail.com",
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

  // Live Exchange Rate (Google Finance / Market reference)
  const [exchangeRate, setExchangeRate] = useState<number>(58.75);
  const [isUpdatingRate, setIsUpdatingRate] = useState<boolean>(false);

  useDocumentTitle("Pagar Local Lift | Polaris", "Pay Local Lift | Polaris", "", "");

  const refreshExchangeRate = async () => {
    setIsUpdatingRate(true);
    try {
      const res = await fetch("https://open.er-api.com/v6/latest/USD");
      const data = await res.json();
      if (data && data.rates && typeof data.rates.DOP === "number") {
        setExchangeRate(data.rates.DOP);
      }
    } catch {
      setExchangeRate(58.75);
    } finally {
      setIsUpdatingRate(false);
    }
  };

  useEffect(() => {
    refreshExchangeRate();
  }, []);

  useEffect(() => {
    if (!leadId) {
      setStatus("notfound");
      return;
    }
    if (leadId === "demo" || leadId === "test" || leadId === "ejemplo") {
      const urlTier = searchParams.get("tier");
      const activeTier = urlTier && TIER_PRICE[urlTier] ? urlTier : "impulso";
      setLead({
        businessName: "Restaurante & Grill El Criollo",
        city: "Punta Cana, RD",
        tier: activeTier,
        paid: false,
      });
      setSelectedTier(activeTier);
      setStatus("ready");
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

  const exactDopAmount = Math.round(Number(price.amount) * exchangeRate).toLocaleString();

  const handleCopy = (text: string, fieldName: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2500);
  };

  const whatsappMessage = encodeURIComponent(
    language === "en"
      ? `Hello Cristian, I made the transfer for Local Lift (${lead?.businessName || "My business"} - Plan ${price.enLabel} - $${price.amount} USD / RD$ ${exactDopAmount}). Bank: ${activeBank.name}. Order ID: ${leadId}. Attaching receipt:`
      : `Hola Cristian, realicé la transferencia para Local Lift (${lead?.businessName || "Mi negocio"} - Plan ${price.label} - $${price.amount} USD / RD$ ${exactDopAmount}). Banco: ${activeBank.name}. ID de orden: ${leadId}. Adjunto comprobante:`
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
              <span className="text-xs font-bold text-[#0faaa4] dark:text-[#5ee7df] bg-[#16C8C1]/10 px-3 py-1 rounded-full ml-auto font-bold tracking-tight shadow-xs tabular-nums">
                RD$ {exactDopAmount}
              </span>
            </div>

            {/* Live Exchange Rate Subtext with Refresh button */}
            <div className="mt-1 flex items-center justify-end gap-1.5 text-[10px] text-[var(--color-text-tertiary)]">
              <span>
                <T en="Live exchange rate: 1 USD = RD$">Tasa en vivo: 1 USD = RD$</T> {exchangeRate.toFixed(2)}
              </span>
              <button
                type="button"
                onClick={refreshExchangeRate}
                className="p-1 rounded hover:text-[var(--color-text-primary)] transition-colors"
                title={language === "en" ? "Refresh live rate" : "Actualizar tasa en vivo"}
              >
                <RefreshCw size={10} className={isUpdatingRate ? "animate-spin text-[#16C8C1]" : ""} />
              </button>
            </div>

            {/* Payment Method Switcher */}
            <div className="mt-6 flex rounded-xl bg-[var(--color-surface-elevated)] p-1 border border-[var(--color-border-subtle)]">
              <button
                type="button"
                onClick={() => setPaymentMethod("paypal")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === "paypal"
                    ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-subtle)]"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <T en="PayPal / Card">PayPal / Tarjeta</T>
              </button>
              <button
                type="button"
                onClick={() => setPaymentMethod("transfer")}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  paymentMethod === "transfer"
                    ? "bg-[var(--color-surface-base)] text-[var(--color-text-primary)] shadow-sm border border-[var(--color-border-subtle)]"
                    : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <T en="Bank Transfer">Transferencia Bancaria</T>
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
                {/* Bank Tabs with Logos and interactive hover animation */}
                <div className="grid grid-cols-3 gap-2.5">
                  {(["popular", "bhd", "qik"] as const).map((bKey) => {
                    const b = BANK_ACCOUNTS[bKey];
                    const isSelected = selectedBank === bKey;
                    const Logo = b.LogoComponent;
                    return (
                      <button
                        key={bKey}
                        type="button"
                        onClick={() => setSelectedBank(bKey)}
                        className={`group relative p-3 sm:p-3.5 rounded-2xl border flex flex-col items-center justify-center gap-2 transition-all duration-300 ease-out cursor-pointer ${
                          isSelected
                            ? "border-[#16C8C1] bg-gradient-to-b from-[#16C8C1]/15 via-[#16C8C1]/[0.06] to-transparent shadow-lg shadow-[#16C8C1]/10 ring-2 ring-[#16C8C1]/40 -translate-y-0.5"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] hover:-translate-y-1 hover:border-[#16C8C1]/40 hover:shadow-md hover:shadow-[#16C8C1]/10 active:translate-y-0 active:scale-[0.98]"
                        }`}
                      >
                        {/* Subtle selected indicator dot */}
                        {isSelected && (
                          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#16C8C1] shadow-xs shadow-[#16C8C1]" />
                        )}
                        <div className="h-9 w-full px-2 py-1 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-[1.03]">
                          <Logo className="h-6 w-auto max-w-[85px] object-contain" />
                        </div>
                        <p className={`text-[11px] font-bold tracking-tight transition-colors leading-tight ${
                          isSelected ? "text-[#0faaa4] dark:text-[#5ee7df]" : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                        }`}>
                          {b.name}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Bank Account Details Card - Elegant & modern without monospace */}
                <div className="rounded-2xl border border-[var(--color-border-subtle)] bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface-base)]/60 backdrop-blur-md p-4 sm:p-5 text-left space-y-3 shadow-xl">
                  <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2.5">
                      <div className="h-8 px-2.5 py-1 rounded-xl bg-white border border-slate-200/80 flex items-center justify-center shadow-xs">
                        <activeBank.LogoComponent className="h-5 w-auto object-contain" />
                      </div>
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">
                        {activeBank.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-3 py-1 rounded-full bg-[#16C8C1]/12 text-[#0faaa4] dark:text-[#5ee7df] border border-[#16C8C1]/30">
                      <T en="Savings Account in RD$">Cuenta de Ahorros en RD$</T>
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="group/row flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] hover:border-[#16C8C1]/30 transition-all duration-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Account Number">No. de Cuenta</T>
                      </p>
                      <p className="text-sm sm:text-base font-bold tracking-tight text-[var(--color-text-primary)] tabular-nums select-all">
                        {activeBank.account}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.account, "account")}
                      className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                        copiedField === "account"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 dark:text-emerald-400"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 hover:bg-[#16C8C1]/5"
                      }`}
                      title={language === "en" ? "Copy account number" : "Copiar número de cuenta"}
                    >
                      {copiedField === "account" ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-[11px]"><T en="Copied!">¡Copiado!</T></span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]"><T en="Copy">Copiar</T></span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Beneficiary Name */}
                  <div className="group/row flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] hover:border-[#16C8C1]/30 transition-all duration-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Beneficiary Name">Titular</T>
                      </p>
                      <p className="text-xs sm:text-sm font-bold tracking-tight text-[var(--color-text-primary)] select-all">
                        {activeBank.holder}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.holder, "holder")}
                      className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                        copiedField === "holder"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 dark:text-emerald-400"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 hover:bg-[#16C8C1]/5"
                      }`}
                      title={language === "en" ? "Copy beneficiary name" : "Copiar titular"}
                    >
                      {copiedField === "holder" ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-[11px]"><T en="Copied!">¡Copiado!</T></span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]"><T en="Copy">Copiar</T></span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* ID / Cédula */}
                  <div className="group/row flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] hover:border-[#16C8C1]/30 transition-all duration-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Identity Document">Cédula</T>
                      </p>
                      <p className="text-xs sm:text-sm font-bold tracking-tight text-[var(--color-text-primary)] tabular-nums select-all">
                        {activeBank.idDoc}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.idDoc, "idDoc")}
                      className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                        copiedField === "idDoc"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 dark:text-emerald-400"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 hover:bg-[#16C8C1]/5"
                      }`}
                      title={language === "en" ? "Copy ID document" : "Copiar cédula"}
                    >
                      {copiedField === "idDoc" ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-[11px]"><T en="Copied!">¡Copiado!</T></span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]"><T en="Copy">Copiar</T></span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Email */}
                  <div className="group/row flex items-center justify-between gap-3 p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] hover:border-[#16C8C1]/30 transition-all duration-200">
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Email">Correo electrónico</T>
                      </p>
                      <p className="text-xs sm:text-sm font-semibold tracking-tight text-[var(--color-text-primary)] select-all truncate">
                        {activeBank.email}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.email, "email")}
                      className={`shrink-0 px-3 py-1.5 rounded-lg border text-xs font-bold transition-all duration-200 flex items-center gap-1.5 active:scale-95 cursor-pointer ${
                        copiedField === "email"
                          ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-500 dark:text-emerald-400"
                          : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 hover:bg-[#16C8C1]/5"
                      }`}
                      title={language === "en" ? "Copy email" : "Copiar correo"}
                    >
                      {copiedField === "email" ? (
                        <>
                          <Check size={13} className="text-emerald-500" />
                          <span className="text-[11px]"><T en="Copied!">¡Copiado!</T></span>
                        </>
                      ) : (
                        <>
                          <Copy size={13} />
                          <span className="text-[11px]"><T en="Copy">Copiar</T></span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* WhatsApp Confirmation Button with vibrant gradient, physics and animated icon */}
                <a
                  href={`https://wa.me/18299200544?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="group relative w-full overflow-hidden inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-[#16C8C1] via-[#14bdb6] to-[#0faaa4] hover:from-[#1cded6] hover:to-[#12b3ac] px-6 py-4 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#16C8C1]/20 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-[#16C8C1]/30 active:translate-y-0 active:scale-[0.99] cursor-pointer"
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true" className="transition-transform duration-300 group-hover:scale-110 group-hover:rotate-6 shrink-0">
                    <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.92 0-2.65-1.03-5.14-2.91-7.01A9.85 9.85 0 0 0 12.04 2Zm0 18.15h-.01a8.24 8.24 0 0 1-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.22 8.22 0 0 1-1.26-4.38c0-4.55 3.71-8.26 8.27-8.26a8.2 8.2 0 0 1 5.84 2.42 8.19 8.19 0 0 1 2.42 5.83c0 4.56-3.71 8.25-8.27 8.25Zm4.53-6.19c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.13-.17.24-.64.81-.79.97-.14.17-.29.19-.54.06-.25-.12-1.04-.38-1.99-1.22-.73-.66-1.23-1.46-1.37-1.71-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.15.16-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.34-.77-1.84-.2-.48-.41-.42-.56-.42-.14-.01-.31-.01-.48-.01a.92.92 0 0 0-.67.31c-.23.25-.87.85-.87 2.07 0 1.23.89 2.41 1.02 2.58.12.16 1.75 2.67 4.24 3.74.59.26 1.06.41 1.42.52.6.19 1.14.16 1.57.1.48-.07 1.47-.6 1.68-1.18.2-.58.2-1.08.14-1.18-.06-.1-.22-.16-.47-.28Z" />
                  </svg>
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
                className="w-full inline-flex items-center justify-center gap-2 rounded-lg border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/8 px-4 py-2 text-xs font-bold text-[var(--color-primary-base)] hover:bg-[var(--color-primary-base)]/14 transition-colors cursor-pointer"
              >
                <AISparkleIcon size={13} className="shrink-0" />
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
