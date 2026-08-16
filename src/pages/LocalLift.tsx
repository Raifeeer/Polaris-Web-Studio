import { useState } from "react";
import { Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
  Zap as ZapFast,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PayPalCheckoutProvider } from "../components/PayPalCheckoutProvider";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle, useJsonLd } from "../hooks/useDocumentTitle";

const TIER_PRICE: Record<string, string> = { "48h": "29", implementado: "99" };

const WHATSAPP_NUMBER = "18299200544";
const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const tiers = [
  {
    name: "Diagnóstico Express",
    enName: "Express Audit",
    price: "29",
    rdPrice: "RD$1,800",
    time: "24 horas",
    enTime: "24 hours",
    accent: "amber",
    tierKey: undefined as string | undefined,
    description: "Un mapa claro de lo que está frenando tus llamadas, mensajes o reservas.",
    enDescription: "A clear map of what is blocking calls, messages, or bookings.",
    items: [
      ["Revisión visual de Google/Maps y WhatsApp", "Google/Maps and WhatsApp review"],
      ["Cinco problemas prioritarios", "Five priority issues"],
      ["Plan de acción para los próximos 7 días", "A 7-day action plan"],
    ],
  },
  {
    name: "Impulso",
    enName: "Impulso",
    price: "29",
    rdPrice: "RD$1,800",
    time: "48 horas",
    enTime: "48 hours",
    accent: "indigo",
    featured: true,
    tierKey: "48h",
    description: "La presencia local lista para que tus clientes entiendan, confíen y contacten.",
    enDescription: "A local presence ready to help customers understand, trust, and contact you.",
    items: [
      ["Auditoría completa de tu perfil local", "Complete local profile audit"],
      ["Descripción, servicios y llamadas a la acción", "Description, services, and calls to action"],
      ["10 publicaciones listas para adaptar", "10 posts ready to adapt"],
      ["15 respuestas personalizadas para reseñas", "15 personalized review replies"],
      ["10 mensajes de WhatsApp para seguimiento", "10 WhatsApp follow-up messages"],
    ],
  },
  {
    name: "Ascenso",
    enName: "Ascenso",
    price: "99",
    rdPrice: "RD$5,900",
    time: "3–5 días",
    enTime: "3–5 days",
    accent: "violet",
    tierKey: "implementado",
    description: "Todo el sistema preparado y aplicado contigo, sin pedirte contraseñas.",
    enDescription: "The complete system prepared and applied with you, without requesting passwords.",
    items: [
      ["Todo lo incluido en Impulso", "Everything in Impulso"],
      ["Implementación asistida de cambios autorizados", "Assisted implementation of authorized changes"],
      ["Carga de textos e imágenes proporcionados", "Upload of supplied text and images"],
      ["Una ronda de revisión", "One revision round"],
    ],
  },
];

interface DiagnosticProblem {
  title: string;
  why: string;
  fix: string;
}
interface DiagnosticPlanDay {
  day: number;
  action: string;
}
interface DiagnosticResult {
  summary: string;
  problems: DiagnosticProblem[];
  sevenDayPlan: DiagnosticPlanDay[];
}
interface PlaceResult {
  name: string;
  rating: number | null;
  reviewCount: number;
  mapsUri: string | null;
}

export default function LocalLift() {
  const { language } = useLanguage();
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  // "queued": el correo ya está en camino (o ya se mandó), pero no se
  // revela en pantalla -- se ve como si un humano lo estuviera preparando.
  // "success": el diagnóstico se muestra en pantalla (revelado por Atlas,
  // instantáneo, o porque el cliente ya esperó). Pedido explícito del
  // usuario: que no se sienta "generado por IA al toque" por default.
  const [status, setStatus] = useState<"idle" | "loading" | "queued" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [revealedByAtlas, setRevealedByAtlas] = useState(false);
  const [diagnosticLeadId, setDiagnosticLeadId] = useState<string | null>(null);
  const [revealNowLoading, setRevealNowLoading] = useState(false);

  const handleDiagnosticSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName.trim() || !city.trim() || !contactName.trim() || !email.trim()) return;
    setStatus("loading");
    setErrorMsg("");
    try {
      const res = await fetch("/api/local-lift-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessName, city, contactName, email, lang: language === "en" ? "en" : "es" }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (language === "en" ? "Something went wrong." : "Algo salió mal."));
        setStatus("error");
        return;
      }
      setDiagnostic(data.diagnostic);
      setPlace(data.place);
      setDiagnosticLeadId(data.leadId || null);
      setStatus("queued");
    } catch {
      setErrorMsg(language === "en" ? "Something went wrong. Please try again." : "Algo salió mal. Intenta de nuevo.");
      setStatus("error");
    }
  };

  // Dispara el envío real e inmediato del correo (antes este botón solo
  // cambiaba lo que se veía en pantalla, el correo real ya había salido
  // en el mismo request que generó el diagnóstico -- ver
  // api/local-lift-diagnostic.ts). Si algo falla, igual revela en
  // pantalla (ya tenemos el diagnóstico acá) -- el job programado
  // (local-lift-diagnostic-mailer.ts) lo manda igual más tarde como red
  // de seguridad real.
  const handleRevealNow = async () => {
    if (!diagnosticLeadId) {
      setRevealedByAtlas(true);
      setStatus("success");
      return;
    }
    setRevealNowLoading(true);
    try {
      await fetch("/api/local-lift-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reveal-now", leadId: diagnosticLeadId }),
      });
    } catch {
      // best-effort -- el job programado es la red de seguridad real
    }
    setRevealNowLoading(false);
    setRevealedByAtlas(true);
    setStatus("success");
  };

  // Direct-to-paid: comprar un tier ($99/$179) sin pasar por el diagnóstico
  // gratis. Formulario chico + PayPal, se abre inline en la tarjeta del tier.
  const [buyOpenTier, setBuyOpenTier] = useState<string | null>(null);
  const [buyForm, setBuyForm] = useState({ businessName: "", city: "", contactName: "", email: "" });
  const [buyStatus, setBuyStatus] = useState<"idle" | "paid" | "error">("idle");
  const [buyError, setBuyError] = useState("");
  const buyFormValid = buyForm.businessName.trim() && buyForm.city.trim() && buyForm.contactName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyForm.email);

  useDocumentTitle(
    "Polaris Local Lift | Más visibilidad y conversaciones en 48 horas",
    "Polaris Local Lift | More local visibility and conversations in 48 hours",
    "Optimización de Google Business Profile, Google Maps y WhatsApp para negocios de República Dominicana y clientes internacionales.",
    "Google Business Profile, Google Maps, and WhatsApp optimization for businesses in the Dominican Republic and worldwide.",
  );

  useJsonLd("jsonld-local-lift", {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Polaris Local Lift",
    provider: {
      "@type": "Organization",
      name: "Polaris Web Studio",
      url: "https://polarisweb.studio",
    },
    areaServed: ["Dominican Republic", "Worldwide"],
    description:
      "Local visibility and WhatsApp conversion optimization delivered in 48 hours.",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: "99",
      availability: "https://schema.org/InStock",
    },
  });

  const defaultMessage = "Hola Polaris, quiero solicitar el diagnóstico de Polaris Local Lift para mi negocio.";

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        <section className="relative overflow-hidden rounded-[var(--radius-bento)] glass-panel px-6 py-12 md:px-14 md:py-20 border border-[var(--color-primary-base)]/20">
          <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-36 -left-24 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary-base)]">
              <Sparkles size={13} />
              <T en="Local visibility sprint · Dominican Republic">Sprint de visibilidad local · República Dominicana</T>
            </div>
            <h1 className="mt-6 text-4xl md:text-7xl font-display font-black tracking-[-0.05em] leading-[0.98]">
              <T en="Your customers are already looking for you. Make sure they find the right information.">
                Tus clientes ya te están buscando. Haz que encuentren la información correcta.
              </T>
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-xl leading-relaxed text-[var(--color-text-secondary)]">
              <T en="Polaris Local Lift organizes your Google and WhatsApp presence within 48 hours so customers can understand what you offer, where you are, and how to contact you.">
                Polaris Local Lift organiza tu presencia en Google y WhatsApp en 48 horas para que tus clientes entiendan qué ofreces, dónde estás y cómo contactarte.
              </T>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#diagnostico"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
              >
                <Sparkles size={18} />
                <T en="Get my audit now">Quiero mi diagnóstico ahora</T>
                <ArrowRight size={17} />
              </a>
              <a
                href="#paquetes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] px-6 py-4 text-sm font-black transition-colors hover:border-[var(--color-primary-base)]"
              >
                <T en="See packages">Ver paquetes</T>
                <ChevronRight size={17} />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
              <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> <T en="Fast delivery">Entrega rápida</T></span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> <T en="Based in the Dominican Republic">Desde República Dominicana</T></span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> <T en="No ranking promises">Sin promesas de ranking</T></span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[
            [Eye, "Que te entiendan", "Make your offer clear", "Descripción, servicios y datos sin contradicciones."],
            [Search, "Que te encuentren", "Help customers find you", "Perfil local más completo, útil y fácil de revisar."],
            [MessageCircle, "Que te contacten", "Make contact simple", "Rutas directas hacia WhatsApp, llamadas o reservas."],
          ].map(([Icon, title, enTitle, description]) => {
            const IconComponent = Icon as typeof Eye;
            return (
              <div key={title as string} className="rounded-[var(--radius-bento)] glass-panel p-6 border border-[var(--color-border-subtle)]">
                <IconComponent size={22} className="text-[var(--color-primary-base)]" />
                <h2 className="mt-5 text-xl font-display font-black"><T en={enTitle as string}>{title as string}</T></h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={description as string}>{description as string}</T></p>
              </div>
            );
          })}
        </section>

        <section id="paquetes" className="pt-24">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Choose your starting point">Elige tu punto de partida</T></p>
            <h2 className="mt-3 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="A faster way to improve your digital presence.">Una forma más rápida de mejorar tu presencia digital.</T></h2>
            <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed"><T en="Start with a diagnosis or have us prepare the full system with you. No long contracts, no fabricated reviews, and no guarantees we cannot prove.">Empieza con un diagnóstico o deja que preparemos el sistema contigo. Sin contratos largos, reseñas inventadas ni garantías que no podamos demostrar.</T></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-10">
            {tiers.map((tier) => (
              <article key={tier.name} className={`relative flex flex-col rounded-[var(--radius-bento)] p-7 border ${tier.featured ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]/8 shadow-xl shadow-indigo-500/10" : "border-[var(--color-border-subtle)] glass-panel"}`}>
                {tier.featured && <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-base)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"><Star size={12} fill="currentColor" /> <T en="Recommended">Recomendado</T></div>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-display font-black"> <T en={tier.enName}>{tier.name}</T></h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={tier.enDescription}>{tier.description}</T></p>
                  </div>
                  <Zap size={20} className="shrink-0 text-[var(--color-primary-base)]" />
                </div>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-display font-black text-[var(--color-primary-base)]">${tier.price}</span>
                  <span className="pb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">USD</span>
                </div>
                <p className="mt-1 text-xs font-bold text-[var(--color-text-tertiary)]">{tier.rdPrice} · <T en={tier.enTime}>{tier.time}</T></p>
                <div className="mt-7 space-y-3 flex-1">
                  {tier.items.map(([es, en]) => (
                    <div key={es} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span><T en={en}>{es}</T></span>
                    </div>
                  ))}
                </div>
                <a href={whatsappLink(`Hola Polaris, me interesa el paquete ${tier.name}. Quiero saber qué necesitas para comenzar.`)} target="_blank" rel="noreferrer" className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-transform hover:-translate-y-0.5 ${tier.featured ? "bg-[var(--color-primary-base)] text-white" : "border border-[var(--color-border-strong)] hover:border-[var(--color-primary-base)]"}`}>
                  <MessageCircle size={16} />
                  <T en="Start on WhatsApp">Empezar por WhatsApp</T>
                </a>

                {tier.tierKey && (
                  <>
                    <button
                      type="button"
                      onClick={() => {
                        setBuyStatus("idle");
                        setBuyError("");
                        setBuyOpenTier(buyOpenTier === tier.tierKey ? null : tier.tierKey!);
                      }}
                      className="mt-2 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black border border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)] transition-colors"
                    >
                      <Zap size={16} className="text-[var(--color-primary-base)]" />
                      <T en="Buy now with PayPal">Comprar ahora con PayPal</T>
                    </button>

                    {buyOpenTier === tier.tierKey && (
                      <div className="mt-4 rounded-xl bg-[var(--color-surface-elevated)] p-4">
                        {buyStatus === "paid" ? (
                          <div className="flex items-start gap-2 text-emerald-500 text-xs font-black">
                            <Check size={16} className="mt-0.5 shrink-0" />
                            <span><T en="Payment received. Your package will be prepared and sent to your email within 48 hours.">Pago recibido. Tu paquete se prepara y te llega a tu correo en las próximas 48 horas.</T></span>
                          </div>
                        ) : (
                          <>
                            <div className="grid grid-cols-1 gap-2">
                              <input type="text" placeholder={language === "en" ? "Business name" : "Nombre del negocio"} value={buyForm.businessName} onChange={(e) => setBuyForm({ ...buyForm, businessName: e.target.value })} className="glass-input rounded-lg px-3 py-2.5 text-sm border border-[var(--color-border-subtle)] outline-none" />
                              <input type="text" placeholder={language === "en" ? "City" : "Ciudad"} value={buyForm.city} onChange={(e) => setBuyForm({ ...buyForm, city: e.target.value })} className="glass-input rounded-lg px-3 py-2.5 text-sm border border-[var(--color-border-subtle)] outline-none" />
                              <input type="text" placeholder={language === "en" ? "Your name" : "Tu nombre"} value={buyForm.contactName} onChange={(e) => setBuyForm({ ...buyForm, contactName: e.target.value })} className="glass-input rounded-lg px-3 py-2.5 text-sm border border-[var(--color-border-subtle)] outline-none" />
                              <input type="email" placeholder={language === "en" ? "Your email" : "Tu correo"} value={buyForm.email} onChange={(e) => setBuyForm({ ...buyForm, email: e.target.value })} className="glass-input rounded-lg px-3 py-2.5 text-sm border border-[var(--color-border-subtle)] outline-none" />
                            </div>
                            {buyFormValid ? (
                              <div className="mt-3">
                                <PayPalCheckoutProvider>
                                  <PayPalButtons
                                    style={{ layout: "vertical", shape: "rect", color: "gold", label: "pay", height: 45 }}
                                    createOrder={(_data, actions) =>
                                      actions.order.create({
                                        intent: "CAPTURE",
                                        purchase_units: [{ amount: { value: TIER_PRICE[tier.tierKey!], currency_code: "USD" }, description: `Polaris Local Lift — ${tier.name} — ${buyForm.businessName}` }],
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
                                            ...buyForm,
                                            tier: tier.tierKey,
                                            paypalOrderId: details.id,
                                            paypalPayerEmail: details.payer?.email_address || null,
                                          }),
                                        });
                                        const data = await res.json();
                                        if (!res.ok || !data.success) {
                                          setBuyError(language === "en" ? "Payment went through, but we couldn't confirm it — write us on WhatsApp." : "El pago pasó, pero no pudimos confirmarlo — escríbenos por WhatsApp.");
                                          setBuyStatus("error");
                                          return;
                                        }
                                        setBuyStatus("paid");
                                      } catch {
                                        setBuyError(language === "en" ? "Payment went through, but something failed — write us on WhatsApp." : "El pago pasó, pero algo falló — escríbenos por WhatsApp.");
                                        setBuyStatus("error");
                                      }
                                    }}
                                  />
                                </PayPalCheckoutProvider>
                              </div>
                            ) : (
                              <p className="mt-3 text-[11px] text-[var(--color-text-tertiary)]"><T en="Fill in all fields to enable payment.">Completa todos los campos para habilitar el pago.</T></p>
                            )}
                            {buyStatus === "error" && (
                              <div className="mt-2 flex items-start gap-2 text-xs text-red-400"><AlertCircle size={14} className="mt-0.5 shrink-0" /><span>{buyError}</span></div>
                            )}
                          </>
                        )}
                      </div>
                    )}
                  </>
                )}
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-24">
          <div className="rounded-[var(--radius-bento)] glass-panel p-7 md:p-10 border border-[var(--color-border-subtle)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="The process">El proceso</T></p>
            <h2 className="mt-3 text-3xl font-display font-black"><T en="Small scope. Visible progress.">Alcance pequeño. Progreso visible.</T></h2>
            <div className="mt-8 space-y-6">
              {[
                ["01", "Send your link", "Envíanos tu enlace y el objetivo principal del negocio."],
                ["02", "Receive priorities", "Recibes un diagnóstico con acciones ordenadas por impacto y esfuerzo."],
                ["03", "Implement with confidence", "Aplicamos solo los cambios autorizados y te entregamos todo documentado."],
              ].map(([number, enTitle, esDescription]) => (
                <div key={number} className="flex gap-4">
                  <span className="text-xs font-black font-mono text-[var(--color-primary-base)]">{number}</span>
                  <div><h3 className="font-black"><T en={enTitle}>{enTitle === "Send your link" ? "Envíanos tu enlace" : enTitle === "Receive priorities" ? "Recibe prioridades" : "Implementa con confianza"}</T></h3><p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{esDescription}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] p-7 md:p-10 border border-[var(--color-primary-base)]/20">
            <div className="flex items-center gap-2 text-[var(--color-primary-base)]"><ShieldCheck size={20} /><span className="text-xs font-black uppercase tracking-[0.2em]"><T en="Built on trust">Basado en confianza</T></span></div>
            <h2 className="mt-4 text-3xl font-display font-black"><T en="Useful, honest, and ready to act.">Útil, honesto y listo para actuar.</T></h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en="We work with the information you approve. We do not create fake reviews, invent business details, request passwords, or promise first place on Google.">Trabajamos con la información que tú apruebas. No creamos reseñas falsas, no inventamos datos del negocio, no pedimos contraseñas y no prometemos el primer lugar en Google.</T></p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-[var(--color-text-tertiary)]"><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2">PayPal</span><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2"><T en="Bank transfer">Transferencia</T></span><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2"><T en="Cash in DR">Efectivo en RD</T></span></div>
          </div>
        </section>

        <section id="diagnostico" className="mt-24 rounded-[var(--radius-bento)] glass-panel p-7 md:p-12 border border-[var(--color-primary-base)]/20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Ready to be easier to find?">¿Listo para que te encuentren más fácilmente?</T></p>
            <h2 className="mt-4 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="Get your diagnosis now.">Genera tu diagnóstico ahora.</T></h2>
            <p className="mt-4 text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]"><T en="Tell us your business name and city — we'll pull your real Google listing and email your priority issues in under a minute.">Dinos el nombre de tu negocio y ciudad — traemos tu ficha real de Google y te enviamos por correo tus problemas prioritarios en menos de un minuto.</T></p>
          </div>

          {status !== "success" && status !== "queued" && (
            <form onSubmit={handleDiagnosticSubmit} className="mt-8 max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              <input
                type="text"
                required
                maxLength={200}
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={language === "en" ? "Business name" : "Nombre del negocio"}
                className="glass-input rounded-xl px-4 py-3 text-sm sm:col-span-2 outline-none border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)]"
              />
              <input
                type="text"
                required
                maxLength={100}
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder={language === "en" ? "City" : "Ciudad"}
                className="glass-input rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)]"
              />
              <input
                type="text"
                required
                maxLength={200}
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={language === "en" ? "Your name" : "Tu nombre"}
                className="glass-input rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)]"
              />
              <input
                type="email"
                required
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "en" ? "Your email" : "Tu correo"}
                className="glass-input rounded-xl px-4 py-3 text-sm sm:col-span-2 outline-none border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)]"
              />

              {status === "error" && (
                <div className="sm:col-span-2 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-7 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5 disabled:opacity-60 disabled:pointer-events-none"
              >
                {status === "loading" ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <T en="Analyzing your listing...">Analizando tu ficha...</T>
                  </>
                ) : (
                  <>
                    <Sparkles size={18} />
                    <T en="Generate my diagnosis">Generar mi diagnóstico</T>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>
          )}

          {status === "queued" && (
            <div className="mt-8 max-w-xl mx-auto text-center rounded-xl bg-[var(--color-surface-elevated)] p-8">
              <Mail size={28} className="mx-auto text-[var(--color-primary-base)]" />
              <h3 className="mt-4 text-lg font-display font-black"><T en="We're preparing your diagnosis.">Estamos preparando tu diagnóstico.</T></h3>
              <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                <T en={`It will arrive at ${email} within the next 5-10 minutes.`}>{`Te llegará a ${email} dentro de los próximos 5 a 10 minutos.`}</T>
              </p>
              <button
                type="button"
                onClick={handleRevealNow}
                disabled={revealNowLoading}
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-base)]/40 bg-[var(--color-primary-base)]/10 px-5 py-3 text-xs font-black text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/15 disabled:opacity-60"
              >
                {revealNowLoading ? <Loader2 size={14} className="animate-spin" /> : <ZapFast size={14} />}
                <T en="Prefer it right now? Let Atlas generate it instantly">¿Lo prefieres ya? Que Atlas te lo genere al instante</T>
              </button>
            </div>
          )}

          {status === "success" && diagnostic && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
                <Check size={15} />
                <T en={`Sent to ${email}`}>{`Enviado a ${email}`}</T>
                {place && <span className="text-[var(--color-text-tertiary)] font-semibold normal-case">· {place.name}{place.reviewCount ? ` · ${place.reviewCount} ${language === "en" ? "reviews" : "reseñas"}` : ""}</span>}
              </div>
              {revealedByAtlas && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">
                  <Sparkles size={11} />
                  <T en="Generated instantly by Atlas AI">Generado al instante por Atlas IA</T>
                </div>
              )}
              <p className="mt-4 text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]">{diagnostic.summary}</p>

              <div className="mt-6 space-y-3">
                {diagnostic.problems.map((p, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-border-subtle)] p-4">
                    <p className="font-black text-sm">{i + 1}. {p.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)]">{p.why}</p>
                    <p className="mt-2 text-xs font-bold text-[var(--color-primary-base)]">→ {p.fix}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 rounded-xl bg-[var(--color-surface-elevated)] p-4">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] mb-3"><T en="7-day plan">Plan de 7 días</T></p>
                <div className="space-y-1.5">
                  {diagnostic.sevenDayPlan.map((d) => (
                    <p key={d.day} className="text-xs text-[var(--color-text-secondary)]"><span className="font-bold text-[var(--color-text-primary)]">{language === "en" ? "Day" : "Día"} {d.day}:</span> {d.action}</p>
                  ))}
                </div>
              </div>

              <a
                href={whatsappLink(`Hola Polaris, recibí mi diagnóstico de Local Lift para ${businessName} y quiero que implementen los cambios.`)}
                target="_blank"
                rel="noreferrer"
                className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5 w-full"
              >
                <MessageCircle size={18} />
                <T en="Have Polaris implement this">Que Polaris implemente esto</T>
                <ArrowRight size={17} />
              </a>
            </div>
          )}

          <p className="mt-6 text-center text-xs text-[var(--color-text-tertiary)]"><T en="Prefer WhatsApp? Write us directly.">¿Prefieres WhatsApp? Escríbenos directo.</T> <a href={whatsappLink(defaultMessage)} target="_blank" rel="noreferrer" className="underline hover:text-[var(--color-primary-base)]"><T en="Chat now">Chatear ahora</T></a></p>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-tertiary)]">
          <Link to="/" className="hover:text-[var(--color-primary-base)]"><T en="Back to Polaris Web Studio">Volver a Polaris Web Studio</T></Link>
          <span aria-hidden="true">·</span>
          <Link to="/terminos" className="hover:text-[var(--color-primary-base)]"><T en="Terms">Términos</T></Link>
          <span aria-hidden="true">·</span>
          <Link to="/privacidad" className="hover:text-[var(--color-primary-base)]"><T en="Privacy">Privacidad</T></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
