import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import { AlertCircle, Check, Copy, Loader2, Mail, MessageCircle, RefreshCw, ShieldCheck } from "lucide-react";
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

function PopularLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 36" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="popGrad" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="#00357A" />
          <stop offset="50%" stopColor="#0052A5" />
          <stop offset="100%" stopColor="#0080D2" />
        </linearGradient>
      </defs>
      <rect width="36" height="36" rx="6" fill="url(#popGrad)" />
      <g fill="#FFFFFF">
        <path d="M 18 18 L 25.5 18 L 32 19 A 14 14 0 0 1 16.05 31.86 L 16.99 25.13 A 7.2 7.2 0 0 0 18 18 Z" />
        <path d="M 16.12 25.07 L 14.30 31.75 A 14 14 0 0 1 8.10 29.56 L 12.92 23.94 A 7.2 7.2 0 0 0 16.12 25.07 Z" />
        <path d="M 12.56 23.68 L 7.42 29.05 A 14 14 0 0 1 4.54 26.01 L 11.08 22.09 A 7.2 7.2 0 0 0 12.56 23.68 Z" />
        <path d="M 10.74 21.84 L 3.89 25.57 A 14 14 0 0 1 4.02 21.89 L 10.81 19.98 A 7.2 7.2 0 0 0 10.74 21.84 Z" />
        <path d="M 10.82 19.67 L 4.04 21.28 A 14 14 0 0 1 4.22 17.58 L 10.91 17.78 A 7.2 7.2 0 0 0 10.82 19.67 Z" />
        <path d="M 10.93 17.47 L 4.25 16.96 A 14 14 0 0 1 4.88 13.37 L 11.27 15.63 A 7.2 7.2 0 0 0 10.93 17.47 Z" />
        <path d="M 11.37 15.34 L 5.05 12.83 A 14 14 0 0 1 6.13 9.77 L 11.92 13.73 A 7.2 7.2 0 0 0 11.37 15.34 Z" />
        <path d="M 12.06 13.48 L 6.40 9.29 A 14 14 0 0 1 8.01 6.77 L 12.89 12.19 A 7.2 7.2 0 0 0 12.06 13.48 Z" />
        <path d="M 13.06 11.99 L 8.41 6.37 A 14 14 0 0 1 10.51 4.50 L 14.17 11.03 A 7.2 7.2 0 0 0 13.06 11.99 Z" />
        <path d="M 14.39 10.90 L 11.05 4.26 A 14 14 0 0 1 13.44 3.03 L 15.68 10.27 A 7.2 7.2 0 0 0 14.39 10.90 Z" />
        <path d="M 15.93 10.20 L 14.09 2.82 A 14 14 0 0 1 16.71 2.21 L 17.34 9.88 A 7.2 7.2 0 0 0 15.93 10.20 Z" />
        <path d="M 17.60 9.89 L 17.45 2.12 A 14 14 0 0 1 20.08 2.18 L 18.99 9.93 A 7.2 7.2 0 0 0 17.60 9.89 Z" />
        <path d="M 19.23 9.99 L 20.78 2.30 A 14 14 0 0 1 23.36 3.12 L 20.68 10.41 A 7.2 7.2 0 0 0 19.23 9.99 Z" />
        <path d="M 20.89 10.52 L 23.96 3.39 A 14 14 0 0 1 26.23 4.88 L 22.06 11.28 A 7.2 7.2 0 0 0 20.89 10.52 Z" />
        <path d="M 22.23 11.43 L 26.70 5.23 A 14 14 0 0 1 28.53 7.37 L 23.18 12.53 A 7.2 7.2 0 0 0 22.23 11.43 Z" />
        <path d="M 23.30 12.71 L 28.85 7.82 A 14 14 0 0 1 30.12 10.50 L 23.95 14.23 A 7.2 7.2 0 0 0 23.30 12.71 Z" />
        <path d="M 24.03 14.43 L 30.34 11.00 A 14 14 0 0 1 31.06 14.07 L 24.40 16.27 A 7.2 7.2 0 0 0 24.03 14.43 Z" />
        <path d="M 24.43 16.48 L 31.20 14.61 A 14 14 0 0 1 31.39 17.84 L 24.50 17.89 A 7.2 7.2 0 0 0 24.43 16.48 Z" />
      </g>
      <text x="46" y="24" fontFamily="'Cabinet Grotesk', system-ui, sans-serif" fontSize="18" fontWeight="900" fill="currentColor" letterSpacing="-0.3">Popular</text>
    </svg>
  );
}

function BhdLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 140 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="16" cy="20" r="14" fill="#008037" />
      <path d="M10 20C10 16.6863 12.6863 14 16 14C19.3137 14 22 16.6863 22 20C22 23.3137 19.3137 26 16 26" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="20" r="2.5" fill="#FFFFFF" />
      <text x="36" y="27" fontFamily="'Cabinet Grotesk', system-ui, sans-serif" fontSize="22" fontWeight="900" fill="#008037" letterSpacing="0.5">BHD</text>
    </svg>
  );
}

function QikLogo({ className = "h-5 w-auto" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 130 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <text x="0" y="28" fontFamily="'Cabinet Grotesk', system-ui, sans-serif" fontSize="28" fontWeight="900" fill="#4B1278" letterSpacing="-1">qik</text>
      <circle cx="27" cy="9" r="3.5" fill="#00E5FF" />
      <text x="50" y="27" fontFamily="'Cabinet Grotesk', system-ui, sans-serif" fontSize="13" fontWeight="800" fill="#4B1278" letterSpacing="0.5">BANCO</text>
    </svg>
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
              <span className="text-xs font-bold text-[#0faaa4] dark:text-[#5ee7df] bg-[#16C8C1]/10 px-2.5 py-1 rounded-md ml-auto font-mono">
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
                {/* Bank Tabs with Logos */}
                <div className="grid grid-cols-3 gap-2">
                  {(["popular", "bhd", "qik"] as const).map((bKey) => {
                    const b = BANK_ACCOUNTS[bKey];
                    const isSelected = selectedBank === bKey;
                    const Logo = b.LogoComponent;
                    return (
                      <button
                        key={bKey}
                        type="button"
                        onClick={() => setSelectedBank(bKey)}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          isSelected
                            ? "border-[#16C8C1] bg-[#16C8C1]/[0.08] shadow-sm font-black ring-1 ring-[#16C8C1]/30"
                            : "border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] opacity-75 hover:opacity-100"
                        }`}
                      >
                        <div className="h-6 flex items-center justify-center">
                          <Logo className="h-5 w-auto max-w-[90px] object-contain" />
                        </div>
                        <p className="text-[10px] font-bold text-[var(--color-text-primary)] leading-tight">{b.name}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Bank Account Details Card */}
                <div className="rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-4 sm:p-5 text-left space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-[var(--color-border-subtle)]">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-[var(--color-text-primary)]">
                        {activeBank.name}
                      </span>
                    </div>
                    <span className="text-[10px] font-bold px-2.5 py-1 rounded-md bg-[#16C8C1]/15 text-[#0faaa4] dark:text-[#5ee7df] border border-[#16C8C1]/30">
                      <T en="Savings Account in RD$">Cuenta de Ahorro en RD$</T>
                    </span>
                  </div>

                  {/* Account Number */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Account Number">No. de Cuenta</T>
                      </p>
                      <p className="font-mono text-sm font-bold text-[var(--color-text-primary)]">{activeBank.account}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.account, "account")}
                      className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 transition-colors"
                      title={language === "en" ? "Copy account number" : "Copiar número de cuenta"}
                    >
                      {copiedField === "account" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Account Holder */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Beneficiary Name">Titular</T>
                      </p>
                      <p className="text-xs font-bold text-[var(--color-text-primary)]">{activeBank.holder}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.holder, "holder")}
                      className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 transition-colors"
                      title={language === "en" ? "Copy beneficiary name" : "Copiar titular"}
                    >
                      {copiedField === "holder" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* ID / Cédula (Sin guiones) */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Identity Document">Cédula</T>
                      </p>
                      <p className="font-mono text-xs font-bold text-[var(--color-text-primary)]">{activeBank.idDoc}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.idDoc, "idDoc")}
                      className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 transition-colors"
                      title={language === "en" ? "Copy ID document" : "Copiar cédula"}
                    >
                      {copiedField === "idDoc" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Email */}
                  <div className="flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <div>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] uppercase tracking-wider font-bold">
                        <T en="Email">Correo electrónico</T>
                      </p>
                      <p className="font-mono text-xs text-[var(--color-text-primary)]">{activeBank.email}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCopy(activeBank.email, "email")}
                      className="shrink-0 p-2 rounded-lg border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[#0faaa4] hover:border-[#16C8C1]/40 transition-colors"
                      title={language === "en" ? "Copy email" : "Copiar correo"}
                    >
                      {copiedField === "email" ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
                    </button>
                  </div>
                </div>

                {/* WhatsApp Confirmation Button with True Local Lift Teal */}
                <a
                  href={`https://wa.me/18299200544?text=${whatsappMessage}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#16C8C1] hover:bg-[#13b5ae] px-5 py-3.5 text-xs font-black uppercase tracking-wider text-slate-950 shadow-lg shadow-[#16C8C1]/20 transition-all hover:-translate-y-0.5"
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
