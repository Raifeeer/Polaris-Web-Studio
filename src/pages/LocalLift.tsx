import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PayPalButtons } from "@paypal/react-paypal-js";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Star,
  TrendingUp,
  Zap,
  Zap as ZapFast,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { PayPalCheckoutProvider } from "../components/PayPalCheckoutProvider";
import { T, useLanguage } from "../context/LanguageContext";
import { ThinkingOrb } from "thinking-orbs";
import { useDocumentTitle, useJsonLd } from "../hooks/useDocumentTitle";

// Efecto shimmer de reflejo para frases de carga -- mismo mecanismo que
// ThinkingText del chat de Atlas (dos capas superpuestas + máscara en movimiento).
function ShimmerPhrase({ es, en, lang }: { es: string; en: string; lang: string }) {
  const text = lang === "en" ? en : es;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.4 }}
        className="relative inline-block text-sm font-bold"
      >
        <span className="text-[var(--color-text-tertiary)]">{text}</span>
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 text-[var(--color-text-primary)]"
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 50%, transparent 100%)",
            maskImage: "linear-gradient(90deg, transparent 0%, black 50%, transparent 100%)",
            WebkitMaskSize: "200% 100%",
            maskSize: "200% 100%",
          }}
          animate={{ WebkitMaskPosition: ["150% 0%", "-50% 0%"], maskPosition: ["150% 0%", "-50% 0%"] } as any}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        >
          {text}
        </motion.span>
      </motion.span>
    </AnimatePresence>
  );
}

const WISE_PHRASES = [
  { es: "Tus clientes deciden con la información que encuentran.", en: "Customers decide with the information they find." },
  { es: "Una ficha clara responde preguntas antes del primer mensaje.", en: "A clear listing answers questions before the first message." },
  { es: "Las fotos reales ayudan a mostrar qué puede esperar un cliente.", en: "Real photos help show customers what to expect." },
  { es: "Responder reseñas mantiene abierta la conversación.", en: "Replying to reviews keeps the conversation open." },
  { es: "Horarios y servicios claros evitan pasos innecesarios.", en: "Clear hours and services remove unnecessary steps." },
  { es: "Tu ficha debe llevar a las personas al siguiente paso.", en: "Your listing should lead people to the next step." },
];

function WisePhrase({ lang }: { lang: string }) {
  const [idx, setIdx] = useState(() => Math.floor(Math.random() * WISE_PHRASES.length));
  useEffect(() => {
    const t = setInterval(() => setIdx((i) => (i + 1) % WISE_PHRASES.length), 7000);
    return () => clearInterval(t);
  }, []);
  const phrase = WISE_PHRASES[idx];
  // Contenedor de altura fija (2 líneas a text-xs ≈ 32px) para que el layout
  // no salte cuando una frase es más corta o más larga que la anterior.
  return (
    <div className="mt-6 h-8 relative overflow-hidden flex items-center justify-center">
      <AnimatePresence mode="wait">
        <motion.p
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 flex items-center justify-center text-center text-xs text-[var(--color-text-tertiary)] italic px-4"
        >
          {lang === "en" ? phrase.en : phrase.es}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}

const TIER_PRICE: Record<string, string> = { "impulso": "29", "ascenso": "99" };

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
    description: "Una revisión breve para saber qué está frenando tus llamadas, mensajes o reservas.",
    enDescription: "A focused review to see what may be getting in the way of calls, messages, or bookings.",
    items: [
      ["Revisión de Google, Maps y rutas de contacto", "Google, Maps, and contact-path review"],
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
    tierKey: "impulso",
    description: "Ordenamos tu ficha y tus mensajes para que el negocio se entienda y sea más fácil contactarte.",
    enDescription: "We organize your listing and customer messages so the business is easier to understand and contact.",
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
    tierKey: "ascenso",
    description: "Te acompañamos a preparar y aplicar los cambios autorizados, sin pedirte contraseñas.",
    enDescription: "We help prepare and apply the changes you approve, without asking for passwords.",
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
  businessIntro: string;
  summary: string;
  problems: DiagnosticProblem[];
  sevenDayPlan: DiagnosticPlanDay[];
}
interface PlaceResult {
  id: string;
  name: string;
  address: string | null;
  primaryType: string | null;
  rating: number | null;
  reviewCount: number;
  mapsUri: string | null;
  photoUrls?: string[];
}

export default function LocalLift() {
  const { language } = useLanguage();
  const prefersReducedMotion = useReducedMotion();
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [lookupMode, setLookupMode] = useState<"name" | "maps">("name");
  const [confirmingPlaceId, setConfirmingPlaceId] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "confirm" | "queued" | "success" | "error">("idle");
  const [loadingStage, setLoadingStage] = useState<"searching" | "photos" | "verifying">("searching");
  const [errorMsg, setErrorMsg] = useState("");
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [candidates, setCandidates] = useState<PlaceResult[]>([]);
  const [visibleCandidateCount, setVisibleCandidateCount] = useState(3);
  const [revealedByAtlas, setRevealedByAtlas] = useState(false);
const [diagnosticLeadId, setDiagnosticLeadId] = useState<string | null>(null);
  const [revealNowLoading, setRevealNowLoading] = useState(false);
  const [revealNowError, setRevealNowError] = useState("");

  const switchLookupMode = (mode: "name" | "maps") => {
    setLookupMode(mode);
    setErrorMsg("");
    setLoadingStage("searching");
    setStatus("idle");
    if (mode === "name") setMapsUrl("");
  };

  // Este submit valida la ficha real en Google y prepara sus fotos antes de
  // abrir la confirmación. La generación del diagnóstico con IA corre después,
  // cuando el cliente pide "Atlas ahora" en handleRevealNow.
  const handleDiagnosticSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (lookupMode === "name" && (!businessName.trim() || !city.trim())) return;
    if (lookupMode === "maps" && !mapsUrl.trim()) return;
    if (!contactName.trim() || !email.trim()) return;
    setStatus("loading");
    setLoadingStage("searching");
    setErrorMsg("");
    const lookupController = new AbortController();
    let lookupTimeout = 0;
    const lookupDeadline = new Promise<never>((_, reject) => {
      lookupTimeout = window.setTimeout(() => {
        lookupController.abort();
        reject(new Error("LOOKUP_TIMEOUT"));
      }, 3600);
    });
    try {
      const { res, data } = await Promise.race([
        fetch("/api/local-lift-diagnostic", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: lookupController.signal,
          body: JSON.stringify({ businessName, city, contactName, email, mapsUrl: lookupMode === "maps" ? mapsUrl.trim() : undefined, lang: language === "en" ? "en" : "es" }),
        }).then(async (response) => ({ res: response, data: await response.json() })),
        lookupDeadline,
      ]);
      window.clearTimeout(lookupTimeout);
      if (!res.ok) {
        setErrorMsg(data.error || (language === "en" ? "Something went wrong." : "Algo salió mal."));
        setStatus("error");
        return;
      }
            const cands: PlaceResult[] = Array.isArray(data.candidates) && data.candidates.length ? data.candidates : (data.place ? [data.place] : []);
      // Montamos todas las fichas mientras el loader sigue visible. Sus imágenes
      // continúan descargándose en segundo plano, pero nunca bloquean la apertura.
      setCandidates(cands);
      setVisibleCandidateCount(3);
      setLoadingStage("photos");
      await new Promise<void>((resolve) => setTimeout(resolve, 500));

      // Google ya entregó rating, reseñas, dirección y estado; aquí validamos
      // que cada ficha tenga los datos mínimos antes de abrir el selector.
      setLoadingStage("verifying");
      const verifiedCandidates = cands.filter((candidate) => Boolean(candidate.id && candidate.name && candidate.address));
      await new Promise<void>((resolve) => setTimeout(resolve, 500));
      if (!verifiedCandidates.length) {
        setErrorMsg(language === "en" ? "We found no complete business listing to confirm." : "No encontramos una ficha comercial completa para confirmar.");
        setStatus("error");
        return;
      }

      setCandidates(verifiedCandidates);
      setVisibleCandidateCount(3);
      setPlace(verifiedCandidates[0] ?? data.place ?? null);
      setDiagnosticLeadId(data.leadId || null);
      setStatus("confirm");
    } catch {
      window.clearTimeout(lookupTimeout);
      setLoadingStage("searching");
      setErrorMsg(lookupController.signal.aborted
        ? (language === "en" ? "The search took too long. Please try again." : "La búsqueda tardó demasiado. Intenta de nuevo.")
        : (language === "en" ? "Something went wrong. Please try again." : "Algo salió mal. Intenta de nuevo."));
      setStatus("error");
    }
  };

  const loadingCopy = loadingStage === "searching"
    ? { es: "Buscando coincidencias en Google...", en: "Finding matches on Google..." }
    : loadingStage === "photos"
      ? { es: "Preparando fotos y reseñas de las fichas...", en: "Preparing listing photos and reviews..." }
      : { es: "Comprobando que encontramos los negocios correctos...", en: "Checking that we found the right businesses..." };

  const handleConfirmCandidate = async (candidate: PlaceResult) => {
    setPlace(candidate);
    if (!mapsUrl.trim()) {
      setStatus("queued");
      return;
    }

    setConfirmingPlaceId(candidate.id || candidate.name);
    setErrorMsg("");
    try {
      const res = await fetch("/api/local-lift-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          businessName: candidate.name,
          city,
          contactName,
          email,
          mapsUrl: mapsUrl.trim(),
          confirmedPlaceId: candidate.id,
          lang: language === "en" ? "en" : "es",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || (language === "en" ? "Something went wrong." : "Algo salió mal."));
        setCandidates([]);
        setStatus("error");
        return;
      }
      setPlace(data.place || candidate);
      setDiagnosticLeadId(data.leadId || null);
      setCandidates([]);
      setStatus("queued");
    } catch {
      setErrorMsg(language === "en" ? "Something went wrong. Please try again." : "Algo salió mal. Intenta de nuevo.");
      setStatus("error");
    } finally {
      setConfirmingPlaceId(null);
    }
  };

const handleRevealNow = async () => {
    if (!diagnosticLeadId || revealNowLoading) return;
    setRevealNowLoading(true);
    setRevealNowError("");
    try {
      const res = await fetch("/api/local-lift-diagnostic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reveal-now", leadId: diagnosticLeadId, lang: language === "en" ? "en" : "es" }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setRevealNowError(data.error || (language === "en" ? "Something went wrong. Please try again." : "Algo salió mal. Intenta de nuevo."));
        setRevealNowLoading(false);
        return;
      }
      setDiagnostic(data.diagnostic);
      if (data.place) setPlace(data.place);
      setRevealedByAtlas(true);
      setStatus("success");
    } catch {
      setRevealNowError(language === "en" ? "Something went wrong. Please try again." : "Algo salió mal. Intenta de nuevo.");
      setRevealNowLoading(false);
    }
  };

const REVEAL_STEPS: Array<{ es: string; en: string }> = [
    { es: "Leyendo tu ficha de Google...", en: "Reading your Google listing..." },
    { es: "Analizando reseñas y calificación...", en: "Analyzing reviews and rating..." },
    { es: "Revisando fotos y descripción...", en: "Checking photos and description..." },
    { es: "Detectando problemas prioritarios...", en: "Detecting priority issues..." },
    { es: "Redactando tu plan de 7 días...", en: "Drafting your 7-day plan..." },
    { es: "Puliendo los últimos detalles...", en: "Polishing the final details..." },
  ];
  const [revealStepIndex, setRevealStepIndex] = useState(0);
  useEffect(() => {
    if (!revealNowLoading) {
      setRevealStepIndex(0);
      return;
    }
    const interval = setInterval(() => {
      setRevealStepIndex((i) => (i + 1 < REVEAL_STEPS.length ? i + 1 : i));
    }, 6000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealNowLoading]);


  // Direct-to-paid: comprar un tier ($99/$179) sin pasar por el diagnóstico
  // gratis. Formulario chico + PayPal, se abre inline en la tarjeta del tier.
  const [buyOpenTier, setBuyOpenTier] = useState<string | null>(null);
  const [buyForm, setBuyForm] = useState({ businessName: "", city: "", contactName: "", email: "" });
  const [buyStatus, setBuyStatus] = useState<"idle" | "paid" | "error">("idle");
  const [buyError, setBuyError] = useState("");
  const buyFormValid = buyForm.businessName.trim() && buyForm.city.trim() && buyForm.contactName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(buyForm.email);

  useDocumentTitle(
    "Polaris Local Lift | Revisa y mejora tu ficha de Google",
    "Polaris Local Lift | Review and improve your Google listing",
    "Revisión de Google Business Profile, Google Maps y rutas de contacto para negocios de República Dominicana.",
    "Google Business Profile, Google Maps, and contact-path review for businesses in the Dominican Republic.",
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
      "Google Business Profile and Google Maps review for businesses in the Dominican Republic.",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: "99",
      availability: "https://schema.org/InStock",
    },
  });

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        <section className="relative overflow-hidden rounded-[var(--radius-bento)] glass-panel px-6 py-12 md:px-14 md:py-20 border border-[var(--color-primary-base)]/20">
          <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-36 -left-24 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary-base)]">
              <MapPin size={13} />
              <T en="Local visibility · Dominican Republic">Visibilidad local · República Dominicana</T>
            </div>
            <h1 className="mt-6 text-4xl md:text-7xl font-display font-black tracking-[-0.05em] leading-[0.98]">
              <T en="Make your Google listing easier to choose.">
                Haz que tu ficha de Google ayude a decidir.
              </T>
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-xl leading-relaxed text-[var(--color-text-secondary)]">
              <T en="We review what customers see before they call, message, or book: your details, services, photos, reviews, and contact paths.">
                Revisamos lo que tus clientes ven antes de llamarte, escribirte o reservar: datos, servicios, fotos, reseñas y formas de contacto.
              </T>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href="#diagnostico"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
              >
                <Search size={18} />
                <T en="Review my listing">Revisar mi ficha</T>
                <ArrowRight size={17} />
              </a>
              <a
                href="#paquetes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] px-6 py-4 text-sm font-black transition-colors hover:border-[var(--color-primary-base)]"
              >
                <T en="See what’s included">Ver qué incluye</T>
                <ChevronRight size={17} />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
              <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> <T en="Real business data">Datos reales</T></span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> <T en="Clear deliverables">Entregables claros</T></span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> <T en="No ranking promises">Sin promesas de ranking</T></span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[
            [Eye, "Que entiendan tu negocio", "Help people understand you", "Descripción, servicios y horarios que no se contradicen."],
            [Search, "Que encuentren lo correcto", "Help people find the right details", "Una ficha de Google más completa para buscarte y ubicarte."],
            [MessageCircle, "Que sepan cómo contactarte", "Make the next step obvious", "Enlaces y llamadas a la acción que llevan al siguiente paso."],
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Choose your level of help">Elige el nivel de ayuda que necesitas</T></p>
            <h2 className="mt-3 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="Start with clarity. Implement when you’re ready.">Empieza con claridad. Implementa cuando estés listo.</T></h2>
            <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed"><T en="Start with a focused diagnosis, or ask us to prepare and apply the changes you approve.">Puedes comenzar con un diagnóstico puntual o pedirnos que preparemos y apliquemos los cambios que autorices.</T></p>
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
                  <T en="Start with this review">Empezar con esta revisión</T>
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
                            <span><T en="Payment received. We’ll prepare your deliverables and send them to your email within 48 hours.">Pago recibido. Prepararemos tus entregables y te los enviaremos a tu correo en las próximas 48 horas.</T></span>
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="A short process you can review">Un proceso corto que puedes revisar</T></p>
            <h2 className="mt-3 text-3xl font-display font-black"><T en="Start with clarity. Review each step.">Empieza con claridad. Revisa cada paso.</T></h2>
            <div className="mt-8 space-y-6">
              {[
                ["01", "Enter your business or paste your listing link", "Escribe tu negocio y ciudad o pega el enlace de tu ficha.", "Enter your business and city, or paste your listing link."],
                ["02", "Confirm the right business", "Confirma que encontramos el negocio correcto.", "Confirm that we found the right business."],
                ["03", "Get priorities you can act on", "Recibe prioridades claras y decide qué quieres implementar.", "Get clear priorities and decide what you want to implement."],
              ].map(([number, enTitle, esTitle, enDescription]) => (
                <div key={number} className="flex gap-4">
                  <span className="text-xs font-black font-mono text-[var(--color-primary-base)]">{number}</span>
                  <div><h3 className="font-black"><T en={enTitle}>{esTitle}</T></h3><p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={enDescription}>{enDescription === "Enter your business and city, or paste your listing link." ? "Escribe tu negocio y ciudad o pega el enlace de tu ficha." : enDescription === "Confirm that we found the right business." ? "Confirma que encontramos el negocio correcto." : "Recibe prioridades claras y decide qué quieres implementar."}</T></p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] p-7 md:p-10 border border-[var(--color-primary-base)]/20">
            <div className="flex items-center gap-2 text-[var(--color-primary-base)]"><ShieldCheck size={20} /><span className="text-xs font-black uppercase tracking-[0.2em]"><T en="Real data · approved changes">Datos reales · cambios autorizados</T></span></div>
            <h2 className="mt-4 text-3xl font-display font-black"><T en="Your business stays yours. We organize the information.">Tu negocio sigue siendo tuyo. Nosotros ordenamos la información.</T></h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en="We work with the information you approve. We don’t invent reviews, fill gaps with guesses, ask for passwords, or promise first place on Google.">Trabajamos con los datos que tú apruebas. No inventamos reseñas, no completamos información con suposiciones, no pedimos contraseñas y no prometemos el primer lugar en Google.</T></p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-[var(--color-text-tertiary)]"><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2">PayPal</span><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2"><T en="Bank transfer">Transferencia</T></span><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2"><T en="Cash in DR">Efectivo en RD</T></span></div>
          </div>
        </section>

        <section id="diagnostico" className="mt-24 rounded-[var(--radius-bento)] glass-panel p-7 md:p-12 border border-[var(--color-primary-base)]/20">
          <div className="text-center max-w-2xl mx-auto">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Review your listing">REVISA TU FICHA</T></p>
            <h2 className="mt-4 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="See what customers find before they contact you.">Descubre qué ven tus clientes antes de contactarte.</T></h2>
              <p className="mt-4 text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]"><T en="Enter your business and city or paste your Google Maps link. We’ll confirm the right listing first, then you can continue to the diagnosis.">Escribe el nombre y la ciudad de tu negocio o pega el enlace de Google Maps. Primero confirmaremos la ficha correcta; después podrás continuar con el diagnóstico.</T></p>
          </div>

          {status !== "success" && status !== "queued" && status !== "confirm" && (
            <form onSubmit={handleDiagnosticSubmit} className="mt-8 max-w-xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
              <AnimatePresence mode="wait" initial={false}>
                {lookupMode === "name" ? (
                  <motion.div
                    key="name-lookup"
                    id="local-lift-name-lookup"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22, ease: "easeOut" }}
                    className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3"
                  >
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
                      className="glass-input rounded-xl px-4 py-3 text-sm sm:col-span-2 outline-none border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)]"
                    />
                    <motion.button
                      type="button"
                      onClick={() => switchLookupMode("maps")}
                      whileTap={{ scale: 0.98 }}
                      className="sm:col-span-2 inline-flex w-fit items-center gap-1.5 px-1 text-left text-xs leading-relaxed text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-primary-base)] focus:outline-none focus-visible:text-[var(--color-primary-base)]"
                      aria-controls="local-lift-maps-lookup"
                    >
                      <span className="underline decoration-[var(--color-primary-base)]/40 underline-offset-4">
                        <T en="Or paste the Google Maps link directly here">O pega directamente aquí el enlace de Google Maps</T>
                      </span>
                      <ArrowRight size={13} className="text-[var(--color-primary-base)]" />
                    </motion.button>
                  </motion.div>
                ) : (
                  <motion.div
                    key="maps-lookup"
                    id="local-lift-maps-lookup"
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: "auto" }}
                    exit={{ opacity: 0, y: -10, height: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="sm:col-span-2 overflow-hidden"
                  >
                    <div className="rounded-xl border border-[var(--color-primary-base)]/25 bg-[var(--color-primary-base)]/5 p-3">
                      <div className="flex items-center gap-2 text-xs font-black text-[var(--color-primary-base)]">
                        <MapPin size={14} />
                        <T en="Use your direct Google Maps listing link">Usa el enlace directo de tu ficha en Google Maps</T>
                      </div>
                      <input
                        type="url"
                        required
                        inputMode="url"
                        maxLength={2000}
                        value={mapsUrl}
                        onChange={(e) => setMapsUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        aria-label={language === "en" ? "Direct Google Maps link" : "Enlace directo de Google Maps"}
                        className="glass-input mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border-subtle)] focus:border-[var(--color-primary-base)]"
                      />
                      <motion.button
                        type="button"
                        onClick={() => switchLookupMode("name")}
                        whileTap={{ scale: 0.98 }}
                        className="mt-2 inline-flex items-center gap-1.5 px-1 text-xs text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-primary-base)] focus:outline-none focus-visible:text-[var(--color-primary-base)]"
                      >
                        <ChevronRight size={13} className="rotate-180" />
                        <T en="Search by business name and city instead">Volver a buscar por nombre y ciudad</T>
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
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
              <p className="sm:col-span-2 -mt-1 text-center text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
                <T en="We use it to send your priorities and follow-up details." >Lo usamos para enviarte tus prioridades y los detalles del siguiente paso.</T>
              </p>

              {status === "error" && (
                <div className="sm:col-span-2 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {status === "loading" ? (
                <div className="relative sm:col-span-2 mt-1 flex flex-col items-center gap-3 py-10 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]">
                  <div className="flex justify-center">
                    <ThinkingOrb
                      state="searching"
                      size={64}
                      theme="auto"
                      aria-label={language === "en" ? "Searching for your listing on Google" : "Buscando tu ficha en Google"}
                    />
                  </div>
                  <div aria-live="polite" className="min-h-[1.25rem]">
                    <ShimmerPhrase es={loadingCopy.es} en={loadingCopy.en} lang={language} />
                  </div>
                </div>
              ) : (
                <button
                  type="submit"
                  className="sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-7 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
                >
                  <Search size={18} />
                  <T en="Review my listing">Revisar mi ficha</T>
                  <ArrowRight size={17} />
                </button>
              )}
            </form>
          )}

          {candidates.length > 0 && (
            <div aria-hidden="true" className="pointer-events-none fixed left-0 top-0 h-px w-px overflow-hidden opacity-0">
              {candidates.flatMap((candidate) => candidate.photoUrls || []).map((url, index) => (
                <img key={`${url}-${index}`} src={url} alt="" loading="eager" decoding="async" />
              ))}
            </div>
          )}

          {status === "confirm" && candidates.length > 0 && (
            <div className="mt-8 max-w-xl mx-auto">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-base)] mb-4 text-center">
                {candidates.length > 1
                  ? <T en="We found several listings — which one is yours?">Encontramos varias fichas — ¿cuál es la tuya?</T>
                  : <T en="Is this your business?">¿Es tu negocio?</T>
                }
              </p>
              <div className="space-y-3">
                <AnimatePresence initial={false}>
                {candidates.slice(0, visibleCandidateCount).map((cand, i) => (
                  <motion.div
                    key={cand.id || `${cand.name}-${i}`}
                    layout
                    initial={prefersReducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.34, delay: Math.min(Math.max(i - 2, 0) * 0.08, 0.32), ease: [0.22, 1, 0.36, 1] }}
                    whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.006 }}
                    className="rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] overflow-hidden will-change-transform"
                  >
                    {/* Franja de fotos reales del lugar */}
                    {cand.photoUrls && cand.photoUrls.length > 0 && (
                      <div className="flex gap-0.5 h-28">
                        {cand.photoUrls.slice(0, 3).map((url, pi) => (
                          <img
                            key={pi}
                            src={url}
                            alt={cand.name}
                            className="flex-1 object-cover"
                            loading="eager"
                            decoding="sync"
                            style={{ minWidth: 0 }}
                          />
                        ))}
                      </div>
                    )}
                    <div className="p-4">
                      <p className="font-display font-black text-base tracking-tight">{cand.name}</p>
                      {cand.address && <p className="mt-0.5 text-xs text-[var(--color-text-tertiary)]">{cand.address}</p>}
                      {cand.primaryType && <p className="text-xs text-[var(--color-text-tertiary)] capitalize">{cand.primaryType.replace(/_/g, " ")}</p>}
                      {cand.rating != null && (
                        <p className="mt-1 text-xs text-amber-400 font-bold">
                          ★ {cand.rating}{cand.reviewCount ? ` · ${cand.reviewCount} ${language === "en" ? "reviews" : "reseñas"}` : ""}
                        </p>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleConfirmCandidate(cand)}
                          disabled={confirmingPlaceId !== null}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary-base)] px-4 py-2 text-xs font-black text-white shadow-sm shadow-indigo-500/20 transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70"
                        >
                          <Check size={13} />
                          <T en={confirmingPlaceId === cand.id ? "Confirming listing..." : "This is mine"}>{confirmingPlaceId === cand.id ? "Confirmando ficha..." : "Este es el mío"}</T>
                        </button>
                        {cand.mapsUri && (
                          <a
                            href={cand.mapsUri}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-xs text-[var(--color-text-tertiary)] hover:border-[var(--color-primary-base)]/40 transition-colors"
                          >
                            <MapPin size={12} />
                            <T en="View on Maps">Ver en Maps</T>
                          </a>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
                </AnimatePresence>
              </div>
              {visibleCandidateCount < candidates.length && (
                <motion.button
                  type="button"
                  onClick={() => setVisibleCandidateCount((count) => Math.min(count + 3, candidates.length))}
                  whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.02 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { type: "spring", stiffness: 420, damping: 26 }}
                  className="mt-4 mx-auto flex items-center gap-1.5 rounded-lg border border-[var(--color-primary-base)]/30 px-4 py-2 text-xs font-black text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/10 will-change-transform"
                >
                  <ChevronRight size={14} className="rotate-90" />
                  <T en="Show more listings">Mostrar más sucursales</T>
                  <span className="opacity-70">({candidates.length - visibleCandidateCount})</span>
                </motion.button>
              )}
              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setCandidates([]); setVisibleCandidateCount(3); setPlace(null); setDiagnosticLeadId(null); setMapsUrl(""); setStatus("idle"); }}
                  className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"
                >
                  <T en="None of these — search again">Ninguna de estas — buscar de nuevo</T>
                </button>
              </div>
            </div>
          )}

          {status === "queued" && (
            <div className="mt-4 max-w-xl mx-auto text-center rounded-xl bg-[var(--color-surface-elevated)] p-5">
              {revealNowLoading ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="flex justify-center">
                    <ThinkingOrb
                      state="solving"
                      size={64}
                      theme="auto"
                      aria-label={language === "en" ? "Atlas is generating your diagnosis" : "Atlas está generando tu diagnóstico"}
                    />
                  </div>
                  <div className="whitespace-nowrap overflow-hidden text-ellipsis max-w-full px-2">
                    <ShimmerPhrase
                      es={REVEAL_STEPS[revealStepIndex].es}
                      en={REVEAL_STEPS[revealStepIndex].en}
                      lang={language}
                    />
                  </div>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    <T en="This usually takes 30–45 seconds.">Esto suele tardar entre 30 y 45 segundos.</T>
                  </p>
                </div>
              ) : (
                <>
                  <Mail size={28} className="mx-auto text-[var(--color-primary-base)]" />
                  <h3 className="mt-4 text-lg font-display font-black"><T en="We're preparing your diagnosis.">Estamos preparando tu diagnóstico.</T></h3>
                  <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
                    <T en={`It will arrive at ${email} within the next 5-10 minutes.`}>{`Te llegará a ${email} dentro de los próximos 5 a 10 minutos.`}</T>
                  </p>
                  <button
                    type="button"
                    onClick={handleRevealNow}
                    className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-base)]/40 bg-[var(--color-primary-base)]/10 px-5 py-3 text-xs font-black text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/15"
                  >
                    <ZapFast size={14} />
                    <T en="Prefer it right now? Let Atlas generate it instantly">¿Lo prefieres ya? Que Atlas te lo genere al instante</T>
                  </button>
                  {revealNowError && <p className="mt-3 text-xs text-red-400">{revealNowError}</p>}
                </>
              )}
            </div>
          )}

          {status === "success" && diagnostic && (
            <div className="mt-8 max-w-2xl mx-auto">
              <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
                  <Check size={15} />
                  <T en={`Sent to ${email}`}>{`Enviado a ${email}`}</T>
                </div>
                {place && (
                  <p className="text-xs text-[var(--color-text-tertiary)] ml-5">
                    {place.name}{place.reviewCount ? ` · ${place.reviewCount} ${language === "en" ? "reviews" : "reseñas"}` : ""}
                    {place.address ? ` · ${place.address}` : ""}
                  </p>
                )}
              </div>
              {revealedByAtlas && (
                <div className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)]">
                  <Zap size={11} />
                  <T en="Generated instantly by Atlas AI">Generado al instante por Atlas IA</T>
                </div>
              )}
              <p className="mt-4 text-sm italic leading-relaxed text-[var(--color-text-tertiary)] break-words overflow-hidden">{diagnostic.businessIntro}</p>
              <p className="mt-2 text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)] break-words overflow-hidden">{diagnostic.summary}</p>

              <div className="mt-6 space-y-3">
                {diagnostic.problems.slice(0, 2).map((p, i) => (
                  <div key={i} className="rounded-xl border border-[var(--color-border-subtle)] p-4 overflow-hidden">
                    <p className="font-black text-sm break-words">{i + 1}. {p.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)] break-words">{p.why}</p>
                    <p className="mt-2 text-xs font-bold text-[var(--color-primary-base)] break-words">→ {p.fix}</p>
                  </div>
                ))}
                {diagnostic.problems.length > 2 && (
                  <div className="rounded-xl border border-dashed border-[var(--color-border-subtle)] px-4 py-3 text-center">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      <T en={`+ ${diagnostic.problems.length - 2} more problems found — unlock the full diagnosis`}>{`+ ${diagnostic.problems.length - 2} problemas más encontrados — desbloquea el diagnóstico completo`}</T>
                    </p>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <p className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] mb-3">
                  <T en="7-day action plan (preview)">Plan de acción de 7 días (vista previa)</T>
                </p>
                <div className="space-y-2">
                  {diagnostic.sevenDayPlan.slice(0, 3).map((d) => (
                    <div key={d.day} className="flex items-start gap-3 rounded-xl border border-[var(--color-border-subtle)] p-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary-base)] flex items-center justify-center text-[10px] font-black text-white">
                        {d.day}
                      </span>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pt-0.5">{d.action}</p>
                    </div>
                  ))}
                </div>
                {diagnostic.sevenDayPlan.length > 3 && (
                  <div className="mt-2 rounded-xl border border-dashed border-[var(--color-border-subtle)] px-4 py-2.5 text-center">
                    <p className="text-xs text-[var(--color-text-tertiary)]">
                      <T en={`+ ${diagnostic.sevenDayPlan.length - 3} more days — unlock the full plan`}>{`+ ${diagnostic.sevenDayPlan.length - 3} días más — desbloquea el plan completo`}</T>
                    </p>
                  </div>
                )}
              </div>

              {diagnosticLeadId && (
                <div className="mt-6 space-y-3">
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2 leading-relaxed">
                      <T en="Impulso: complete audit, 10 posts, 15 review replies, and 10 WhatsApp follow-up messages — delivered in ~2 hours.">
                        Impulso: auditoría completa, 10 publicaciones, 15 respuestas a reseñas y 10 mensajes de seguimiento — entrega en ~2 horas.
                      </T>
                    </p>
                    <Link
                      to={`/local-lift/pagar/${diagnosticLeadId}?tier=impulso`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5 w-full"
                    >
                      <Zap size={16} />
                      <T en="Continue with Impulso · $29">Continuar con Impulso · $29</T>
                      <ArrowRight size={15} />
                    </Link>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2 leading-relaxed">
                      <T en="Ascenso: everything in Impulso + assisted implementation of all changes, without you needing to touch anything.">
                        Ascenso: todo lo de Impulso + implementación asistida de todos los cambios, sin que tengas que tocar nada.
                      </T>
                    </p>
                    <Link
                      to={`/local-lift/pagar/${diagnosticLeadId}?tier=ascenso`}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-base)]/40 bg-[var(--color-primary-base)]/8 px-6 py-3 text-sm font-bold text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/14 w-full"
                    >
                      <TrendingUp size={16} />
                      <T en="Continue with Ascenso · $99">Continuar con Ascenso · $99</T>
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

          <WisePhrase lang={language} />
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
