import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useEffect, useRef, useState, type CSSProperties } from "react";
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronDown,
  ChevronRight,
  Eye,
  Building2,
  Mail,
  MapPin,
  MessageCircle,
  Search,
  Star,
  TrendingUp,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AtlasMark from "../components/AtlasMark";
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
        className="relative block max-w-full whitespace-normal break-words text-sm font-bold leading-relaxed"
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
  { es: "Una presencia clara responde preguntas antes del primer mensaje.", en: "A clear presence answers questions before the first message." },
  { es: "Las fotos reales ayudan a mostrar qué puede esperar un cliente.", en: "Real photos help show customers what to expect." },
  { es: "Responder reseñas mantiene abierta la conversación.", en: "Replying to reviews keeps the conversation open." },
  { es: "Horarios y servicios claros evitan pasos innecesarios.", en: "Clear hours and services remove unnecessary steps." },
  { es: "Tu presencia debe llevar a las personas al siguiente paso.", en: "Your presence should lead people to the next step." },
];

const LOADING_PHRASES = {
  searching: [
    { es: "Buscando en Google...", en: "Searching Google..." },
    { es: "Consultando Google Maps...", en: "Checking Google Maps..." },
    { es: "Comparando el nombre y la ciudad...", en: "Matching the business name and city..." },
    { es: "Verificando que el lugar sea correcto...", en: "Verifying the place..." },
  ],
  photos: [
    { es: "Recopilando datos del lugar...", en: "Collecting place details..." },
    { es: "Compilando fotos...", en: "Compiling photos..." },
    { es: "Preparando las imágenes para comparar...", en: "Preparing images for comparison..." },
    { es: "Revisando reseñas y calificación disponibles...", en: "Reviewing available reviews and rating..." },
    { es: "Comprobando horarios y servicios...", en: "Checking hours and services..." },
  ],
  verifying: [
    { es: "Verificando los datos del negocio...", en: "Verifying the business details..." },
    { es: "Confirmando dirección y categoría...", en: "Confirming the address and category..." },
    { es: "Revisando que las primeras opciones estén completas...", en: "Checking that the first options are complete..." },
    { es: "Ordenando las opciones para mostrártelas...", en: "Ordering the options to show you..." },
  ],
} as const;

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

const tiers = [
  {
    name: "Diagnóstico Express",
    enName: "Express Audit",
    isFree: true,
    price: "Gratis",
    enPrice: "Free",
    time: "≈ 1 minuto",
    enTime: "~1 minute",
    accent: "amber",
    icon: "zap",
    description: "Una revisión breve para saber qué puede estar frenando tus llamadas, mensajes o reservas.",
    enDescription: "A focused review to see what may be getting in the way of calls, messages, or bookings.",
    cta: "Empezar gratis",
    enCta: "Start for free",
    items: [
      ["Lo que tus clientes encuentran al buscarte", "What customers find when they search for you"],
      ["5 puntos para corregir primero", "5 priorities to fix first"],
      ["Plan de acción para los próximos 7 días", "7-day action plan"],
    ],
  },
  {
    name: "Impulso",
    enName: "Impulso",
    isFree: false,
    price: "29",
    enPrice: "29",
    time: "≈ 2 horas",
    enTime: "~2 hours",
    accent: "indigo",
    featured: true,
    icon: "message",
    description: "Ordenamos la información y los mensajes que tus clientes necesitan para decidir y contactarte.",
    enDescription: "We organize the information and messages customers need to decide and contact you.",
    cta: "Preparar mi negocio",
    enCta: "Prepare my business",
    items: [
      ["Revisión completa de tu presencia local", "Complete review of your local presence"],
      ["Descripción y servicios listos para publicar", "Description and services ready to publish"],
      ["10 publicaciones listas para adaptar", "10 posts ready to adapt"],
      ["15 respuestas personalizadas para tus reseñas", "15 personalized replies to your reviews"],
      ["10 mensajes de seguimiento listos para enviar", "10 follow-up messages ready to send"],
    ],
  },
  {
    name: "Ascenso",
    enName: "Ascenso",
    isFree: false,
    price: "99",
    enPrice: "99",
    time: "Seguimiento personalizado 1:1",
    enTime: "Personalized 1:1 follow-up",
    accent: "violet",
    icon: "trending",
    description: "Te acompañamos a preparar y aplicar los cambios que autorices, sin pedirte contraseñas.",
    enDescription: "We help prepare and apply the changes you approve, without asking for passwords.",
    cta: "Solicitar implementación",
    enCta: "Request implementation",
    items: [
      ["Todo lo incluido en Impulso", "Everything in Impulso"],
      ["Llevamos el plan a la práctica contigo", "We put the plan into practice with you"],
      ["Subimos los textos e imágenes que apruebes", "We upload the text and images you approve"],
      ["Una revisión final contigo", "One final review with you"],
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
  const [loadingCopyIndex, setLoadingCopyIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [diagnostic, setDiagnostic] = useState<DiagnosticResult | null>(null);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [candidates, setCandidates] = useState<PlaceResult[]>([]);
  const [visibleCandidateCount, setVisibleCandidateCount] = useState(3);
  const [revealedByAtlas, setRevealedByAtlas] = useState(false);
  const [diagnosticLeadId, setDiagnosticLeadId] = useState<string | null>(null);
  const [revealNowLoading, setRevealNowLoading] = useState(false);
  const [revealNowError, setRevealNowError] = useState("");
  const loadingRef = useRef<HTMLDivElement | null>(null);
  const candidatesRef = useRef<HTMLDivElement | null>(null);
  const queuedRef = useRef<HTMLDivElement | null>(null);
  const successRef = useRef<HTMLDivElement | null>(null);
  const nameFieldRef = useRef<HTMLInputElement | null>(null);
  const mapsFieldRef = useRef<HTMLInputElement | null>(null);
  const motionReveal = (delay = 0) => prefersReducedMotion
    ? { initial: false }
    : {
        initial: { opacity: 0, y: 24 },
        whileInView: { opacity: 1, y: 0 },
        viewport: { once: true, amount: 0.2 },
        transition: { duration: 0.62, delay, ease: [0.22, 1, 0.36, 1] as const },
      };

  const scrollElementToCenter = (element: HTMLElement | null, behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth") => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
    const centeredTop = window.scrollY + rect.top - Math.max(0, (viewportHeight - rect.height) / 2);
    window.scrollTo({ top: Math.max(0, centeredTop), behavior });
  };

  const scrollSectionIntro = (section: HTMLElement | null, behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth") => {
    if (!section) return;
    const intro = section.querySelector<HTMLElement>(":scope > div") ?? section;
    const rect = intro.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>("nav");
    const navBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    const topInset = Math.max(24, navBottom + 16);
    const visualOffset = window.visualViewport?.offsetTop ?? 0;
    const alignedTop = window.scrollY + rect.top - topInset - visualOffset;
    window.scrollTo({ top: Math.max(0, alignedTop), behavior });
  };

  // Las opciones pueden ser más altas que el viewport en móvil. Centrar todo el
  // bloque calcula un top negativo y deja su encabezado detrás del navbar.
  const scrollElementBelowNav = (element: HTMLElement | null, behavior: ScrollBehavior = prefersReducedMotion ? "auto" : "smooth") => {
    if (!element) return;
    const rect = element.getBoundingClientRect();
    const nav = document.querySelector<HTMLElement>("nav");
    const navBottom = nav ? Math.max(0, nav.getBoundingClientRect().bottom) : 0;
    const topInset = Math.max(24, navBottom + 12);
    const visualOffset = window.visualViewport?.offsetTop ?? 0;
    const alignedTop = window.scrollY + rect.top - topInset - visualOffset;
    window.scrollTo({ top: Math.max(0, alignedTop), behavior });
  };

  const toggleFaq = (index: number) => setOpenFaqIndex((current) => (current === index ? null : index));

  const scrollToSection = (id: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    const section = document.getElementById(id);
    if (!section) return;
    event.preventDefault();
    scrollSectionIntro(section);
    window.history.replaceState(null, "", `#${id}`);
  };

  useEffect(() => {
    const target = status === "loading"
      ? loadingRef.current
      : status === "confirm"
        ? candidatesRef.current
        : status === "queued"
          ? queuedRef.current
          : status === "success"
            ? successRef.current
            : null;
    if (!target) return;
    const alignState = () => {
      const anchor = target.querySelector<HTMLElement>("[data-scroll-anchor]") ?? target;
      if (status === "confirm" || status === "success") {
        scrollElementBelowNav(anchor);
      } else {
        scrollElementToCenter(anchor);
      }
    };
    const timer = window.setTimeout(alignState, 120);
    // Candidate cards can gain height when their first images finish decoding.
    // Re-align once after that layout settles so the confirmation/result header remains visible.
    const settleTimer = status === "confirm" ? window.setTimeout(alignState, 520) : undefined;
    return () => {
      window.clearTimeout(timer);
      if (settleTimer) window.clearTimeout(settleTimer);
    };
  }, [status, prefersReducedMotion]);

  const switchLookupMode = (mode: "name" | "maps") => {
    setLookupMode(mode);
    setErrorMsg("");
    setLoadingStage("searching");
    setStatus("idle");
    if (mode === "name") setMapsUrl("");
    window.setTimeout(() => {
      const field = mode === "maps" ? mapsFieldRef.current : nameFieldRef.current;
      scrollElementToCenter(field);
      field?.focus({ preventScroll: true });
    }, 160);
  };

  const resetCandidateSearch = () => {
    setCandidates([]);
    setVisibleCandidateCount(3);
    setPlace(null);
    setDiagnosticLeadId(null);
    setErrorMsg("");
    setLoadingStage("searching");
    setStatus("idle");
    window.setTimeout(() => {
      const field = lookupMode === "maps" ? mapsFieldRef.current : nameFieldRef.current;
      scrollElementToCenter(field);
      field?.focus({ preventScroll: true });
    }, 180);
  };

  const waitForPhotos = (urls: string[], priority: "high" | "low" = "low") => Promise.all(urls.map((url) => new Promise<void>((resolve) => {
    const image = new Image();
    let settled = false;
    const finish = () => {
      if (settled) return;
      settled = true;
      const decodePromise = image.complete && typeof image.decode === "function" ? image.decode().catch(() => undefined) : Promise.resolve();
      void decodePromise.then(() => resolve());
    };
    image.decoding = "async";
    image.setAttribute("fetchpriority", priority);
    image.onload = finish;
    image.onerror = finish;
    image.src = url;
    if (image.complete) finish();
  })));

  // Este submit valida el negocio real en Google y prepara sus fotos antes de
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
      }, 10000);
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
      // Google ya entregó rating, reseñas, dirección y estado; primero descartamos
      // cualquier candidato incompleto antes de preparar las fotos visibles.
      const verifiedCandidates = cands.filter((candidate) => Boolean(candidate.id && candidate.name && candidate.address));
      if (!verifiedCandidates.length) {
        setErrorMsg(language === "en" ? "We found no complete business result to confirm." : "No encontramos un negocio completo para confirmar.");
        setStatus("error");
        return;
      }

      // Preparamos todas las opciones mientras el loader sigue visible. Las fotos de
      // las primeras tres bloquean la apertura; las demás empiezan en paralelo.
      setCandidates(verifiedCandidates);
      setVisibleCandidateCount(3);
      const firstThreePhotoUrls = [...new Set(verifiedCandidates.slice(0, 3).flatMap((candidate) => candidate.photoUrls || []))];
      const remainingPhotoUrls = [...new Set(verifiedCandidates.slice(3).flatMap((candidate) => candidate.photoUrls || []))];
      setLoadingStage("photos");
      void waitForPhotos(remainingPhotoUrls, "low");
      await waitForPhotos(firstThreePhotoUrls, "high");
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

      // La primera tanda ya tiene todos sus recursos fotográficos resueltos.
      // Esta etapa confirma que los datos mínimos siguen presentes antes de abrirla.
      setLoadingStage("verifying");
      await new Promise<void>((resolve) => setTimeout(resolve, 300));

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

  useEffect(() => {
    setLoadingCopyIndex(0);
    if (status !== "loading" || prefersReducedMotion) return;
    const phrases = LOADING_PHRASES[loadingStage];
    const interval = window.setInterval(() => {
      setLoadingCopyIndex((current) => (current + 1) % phrases.length);
    }, 1400);
    return () => window.clearInterval(interval);
  }, [loadingStage, prefersReducedMotion, status]);

  const loadingPhrases = LOADING_PHRASES[loadingStage];
  const loadingCopy = loadingPhrases[loadingCopyIndex % loadingPhrases.length];

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
    { es: "Leyendo la presencia de tu negocio en Google...", en: "Reading your business presence on Google..." },
    { es: "Analizando reseñas y calificación...", en: "Analyzing reviews and rating..." },
    { es: "Revisando fotos y descripción...", en: "Checking photos and description..." },
    { es: "Detectando problemas prioritarios...", en: "Detecting priority issues..." },
    { es: "Redactando tu plan de 7 días...", en: "Drafting your 7-day plan..." },
    { es: "Puliendo los últimos detalles...", en: "Polishing the final details..." },
  ];
  const [revealStepIndex, setRevealStepIndex] = useState(0);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
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


  useDocumentTitle(
    "Polaris Local Lift | Mejora tu presencia en Google",
    "Polaris Local Lift | Improve your local visibility on Google",
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
    <div
      className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]"
      style={{
        // Color real de marca de Local Lift (Polaris Product Brand System v1):
        // teal, el mismo tono de la palabra "LIFT" del logo, reemplazando el
        // índigo genérico de Polaris solo dentro de esta página.
        "--color-primary-base": "#16C8C1",
        "--color-primary-hover": "#12a8a2",
        "--color-primary-muted": "rgba(22, 200, 193, 0.10)",
      } as CSSProperties}
    >
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        <motion.section {...motionReveal(0)} className="relative overflow-hidden rounded-[var(--radius-bento)] glass-panel px-6 pt-4 pb-12 md:px-14 md:pt-8 md:pb-20 border border-[var(--color-primary-base)]/20">
          <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-36 -left-24 w-96 h-96 rounded-full bg-orange-700/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-4xl">
            <img
              src="/brand/local-lift-lockup-horizontal-dark.svg"
              alt="Local Lift by Polaris Web Studio"
              className="local-lift-logo-light-text -ml-8 sm:-ml-8 md:-ml-4 block h-32 sm:h-36 md:h-40 lg:h-44 max-w-[94%] sm:max-w-none w-auto object-contain object-left -mt-2 mb-[-0.5rem]"
            />
            <img
              src="/brand/local-lift-lockup-horizontal-light.svg"
              alt="Local Lift by Polaris Web Studio"
              className="local-lift-logo-dark-text -ml-8 sm:-ml-8 md:-ml-4 block h-32 sm:h-36 md:h-40 lg:h-44 max-w-[94%] sm:max-w-none w-auto object-contain object-left -mt-2 mb-[-0.5rem]"
            />
            <div className="relative z-10 -mt-1 inline-flex w-fit items-center gap-2 whitespace-nowrap rounded-full border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary-base)]">
              <Eye size={13} />
              <T en="Local visibility">Visibilidad local</T>
            </div>
            <h1 className="mt-6 text-4xl md:text-7xl font-display font-black tracking-[-0.05em] leading-[0.98]">
              <T en="Make your business clear before the first message.">
                Que tu negocio se entienda antes del primer mensaje.
              </T>
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-xl leading-relaxed text-[var(--color-text-secondary)]">
              <T en="If your details, services, photos, and reviews tell different stories, people hesitate. We review what they find and show you what to clarify first.">
                Si tus datos, servicios, fotos y reseñas no cuentan la misma historia, la gente duda. Revisamos lo que encuentran y te mostramos qué conviene aclarar primero.
              </T>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <motion.a
                href="#diagnostico"
                onClick={scrollToSection("diagnostico")}
                whileHover={prefersReducedMotion ? undefined : { y: -3, scale: 1.015 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition-shadow hover:shadow-2xl hover:shadow-teal-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
              >
                <Search size={18} />
                <T en="Review my business">Revisar mi negocio</T>
                <ArrowRight size={17} />
              </motion.a>
              <motion.a
                href="#paquetes"
                onClick={scrollToSection("paquetes")}
                whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] px-6 py-4 text-sm font-black transition-colors hover:border-[var(--color-primary-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
              >
                <T en="See what’s included">Ver qué incluye</T>
                <ChevronRight size={17} />
              </motion.a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
              <span className="inline-flex items-center gap-1.5"><Eye size={14} /> <T en="Clarity at a glance">Claridad al primer vistazo</T></span>
              <span className="inline-flex items-center gap-1.5"><Check size={14} /> <T en="Fewer doubts">Menos dudas</T></span>
              <span className="inline-flex items-center gap-1.5"><ArrowRight size={14} /> <T en="More action">Más acciones</T></span>
            </div>
          </div>
        </motion.section>

        <motion.section {...motionReveal(0.08)} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[
            [Eye, "Claridad al primer vistazo.", "Clarity at a glance.", "Datos, servicios y horarios que responden lo esencial."],
            [Search, "Menos dudas antes de contactarte.", "Fewer doubts before reaching out.", "Información visible para saber si eres lo que necesitan."],
            [MessageCircle, "Un siguiente paso más fácil.", "An easier next step.", "Llamar, escribir o reservar sin tener que buscar de más."],
          ].map(([Icon, title, enTitle, description], index) => {
            const IconComponent = Icon as typeof Eye;
            return (
              <motion.div key={title as string} {...motionReveal(index * 0.08)} whileHover={prefersReducedMotion ? undefined : { y: -5 }} className="rounded-[var(--radius-bento)] glass-panel p-6 border border-[var(--color-border-subtle)] transition-shadow duration-300 hover:shadow-xl hover:shadow-teal-500/10">
                <IconComponent size={22} className="text-[var(--color-primary-base)]" />
                <h2 className="mt-5 text-xl font-display font-black"><T en={enTitle as string}>{title as string}</T></h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]">                  <T en={index === 0 ? "Details, services, and hours that tell the same story." : index === 1 ? "Useful information so people know whether you are what they need." : "Links and calls to action that make it easier to call, message, or book."}>{description as string}</T></p>
              </motion.div>
            );
          })}
        </motion.section>

        <motion.section {...motionReveal(0.04)} id="paquetes" className="scroll-mt-24 pt-24">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Choose your level of help">Elige el nivel de ayuda que necesitas</T></p>
            <h2 className="mt-3 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="Start with clarity. Implement when you’re ready.">Empieza con claridad. Implementa cuando estés listo.</T></h2>
            <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed"><T en="Start with a focused diagnosis, or ask us to prepare and apply the changes you approve.">Puedes comenzar con un diagnóstico puntual o pedirnos que preparemos y apliquemos los cambios que autorices.</T></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-10">
            {tiers.map((tier, index) => (
              <motion.article key={tier.name} {...motionReveal(index * 0.1)} whileHover={prefersReducedMotion ? undefined : { y: -6 }} className={`relative flex flex-col rounded-[var(--radius-bento)] p-7 border transition-shadow duration-300 hover:shadow-2xl hover:shadow-teal-500/10 ${tier.featured ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]/8 shadow-xl shadow-teal-500/10" : "border-[var(--color-border-subtle)] glass-panel"}`}>
                {tier.featured && <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-base)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"><Star size={12} fill="currentColor" /> <T en="Recommended">Recomendado</T></div>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-display font-black"> <T en={tier.enName}>{tier.name}</T></h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={tier.enDescription}>{tier.description}</T></p>
                  </div>
                  {tier.icon === "zap" ? <Zap size={22} className="shrink-0 text-[var(--color-primary-base)]" /> : tier.icon === "message" ? <MessageCircle size={22} className="shrink-0 text-[var(--color-primary-base)]" /> : <TrendingUp size={22} className="shrink-0 text-[var(--color-primary-base)]" />}
                </div>
                <div className="mt-7 flex items-end gap-2">
                  <span className={`${tier.isFree ? "text-4xl" : "text-5xl"} font-display font-black text-[var(--color-primary-base)]`}>
                    <T en={tier.enPrice}>{tier.price}</T>
                  </span>
                  {!tier.isFree && <span className="pb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">USD</span>}
                </div>
                <p className="mt-1 text-xs font-bold text-[var(--color-text-tertiary)]"><T en={tier.enTime}>{tier.time}</T></p>
                <div className="mt-7 space-y-3 flex-1">
                  {tier.items.map(([es, en]) => (
                    <div key={es} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span><T en={en}>{es}</T></span>
                    </div>
                  ))}
                </div>
                <motion.a href="#diagnostico" onClick={scrollToSection("diagnostico")} whileHover={prefersReducedMotion ? undefined : { y: -2 }} whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }} className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-shadow hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2 ${tier.featured ? "bg-[var(--color-primary-base)] text-white shadow-teal-500/20" : "border border-[var(--color-border-strong)] hover:border-[var(--color-primary-base)]"}`}>
                  {tier.icon === "zap" ? <Zap size={16} /> : tier.icon === "message" ? <MessageCircle size={16} /> : <TrendingUp size={16} />}
                  <T en={tier.enCta}>{tier.cta}</T>
                </motion.a>

              </motion.article>
            ))}
          </div>
        </motion.section>

        <motion.section {...motionReveal(0.04)} id="proceso-local" className="scroll-mt-24 pt-24">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="From first search to clear action">DEL PRIMER VISTAZO A LA ACCIÓN</T></p>
            <h2 className="mt-3 text-3xl font-display font-black"><T en="Know what to do next.">Sabe qué hacer después.</T></h2>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              ["01", "Find your business", "Encontramos tu negocio.", "Use the name and city or paste your Google Maps link.", "Usa el nombre y la ciudad o pega tu enlace de Google Maps."],
              ["02", "Confirm the right place", "Confirma el lugar correcto.", "We show you the options so the review starts from the right business.", "Te mostramos las opciones para empezar sobre el negocio correcto."],
              ["03", "Get a plan you can use", "Recibe un plan que puedas usar.", "You’ll know what to fix first and what can wait.", "Sabrás qué corregir primero y qué puede esperar."],
            ].map(([number, enTitle, esTitle, enDescription, esDescription], index) => (
              <motion.div key={number} {...motionReveal(index * 0.08)} className="rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] p-6">
                <span className="text-xs font-black font-mono text-[var(--color-primary-base)]">{number}</span>
                <h3 className="mt-4 font-black"><T en={enTitle}>{esTitle}</T></h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={enDescription}>{esDescription}</T></p>
              </motion.div>
            ))}
          </div>
        </motion.section>

        <motion.section {...motionReveal(0.04)} id="diagnostico" className="scroll-mt-24 mt-24 rounded-[var(--radius-bento)] glass-panel p-7 md:p-12 border border-[var(--color-primary-base)]/20">
          <AnimatePresence mode="wait" initial={false}>
            {status !== "confirm" && status !== "queued" && status !== "success" && (
              <motion.div
                key="diagnostic-intro"
                initial={prefersReducedMotion ? false : { opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={prefersReducedMotion ? undefined : { opacity: 0, y: -8 }}
                transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.24, ease: "easeOut" }}
                className="text-center max-w-2xl mx-auto"
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Review your presence">REVISA TU PRESENCIA</T></p>
                <h2 className="mt-4 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="See what may be getting in the way of calls, messages, or bookings.">Descubre qué puede estar frenando tus llamadas, mensajes o reservas.</T></h2>
                <p className="mt-4 text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]"><T en="Enter your business and city or paste your Google Maps link. We’ll first confirm the right place, then you can continue.">Escribe el nombre y la ciudad de tu negocio o pega el enlace de Google Maps. Primero confirmaremos que encontramos el lugar correcto; después podrás continuar.</T></p>
              </motion.div>
            )}
          </AnimatePresence>

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
                      ref={nameFieldRef}
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder={language === "en" ? "Business name" : "Nombre del negocio"}
                      className="glass-input local-lift-input rounded-xl px-4 py-3 text-sm sm:col-span-2 outline-none border border-[var(--color-border-subtle)] transition-[border-color,box-shadow] focus:border-[var(--color-primary-base)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]/30"
                    />
                    <input
                      type="text"
                      required
                      maxLength={100}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={language === "en" ? "City" : "Ciudad"}
                      className="glass-input local-lift-input rounded-xl px-4 py-3 text-sm sm:col-span-2 outline-none border border-[var(--color-border-subtle)] transition-[border-color,box-shadow] focus:border-[var(--color-primary-base)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]/30"
                    />
                    <motion.button
                      type="button"
                      onClick={() => switchLookupMode("maps")}
                      whileTap={{ scale: 0.98 }}
                      className="sm:col-span-2 inline-flex w-fit items-center gap-1.5 px-1 text-left text-xs font-bold leading-relaxed text-[var(--color-primary-base)] transition-colors hover:text-[var(--color-primary-hover)] focus:outline-none focus-visible:text-[var(--color-primary-hover)]"
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
                        <T en="Use your direct Google Maps business link">Usa el enlace directo de tu negocio en Google Maps</T>
                      </div>
                      <input
                        type="url"
                        required
                        inputMode="url"
                        maxLength={2000}
                        ref={mapsFieldRef}
                        value={mapsUrl}
                        onChange={(e) => setMapsUrl(e.target.value)}
                        placeholder="https://maps.app.goo.gl/..."
                        aria-label={language === "en" ? "Direct Google Maps link" : "Enlace directo de Google Maps"}
                        className="glass-input local-lift-input mt-3 w-full rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border-subtle)] transition-[border-color,box-shadow] focus:border-[var(--color-primary-base)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]/30"
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
                className="glass-input local-lift-input rounded-xl px-4 py-3 text-sm outline-none border border-[var(--color-border-subtle)] transition-[border-color,box-shadow] focus:border-[var(--color-primary-base)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]/30"
              />
              <input
                type="email"
                required
                maxLength={200}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={language === "en" ? "Your email" : "Tu correo"}
                className="glass-input local-lift-input rounded-xl px-4 py-3 text-sm sm:col-span-2 outline-none border border-[var(--color-border-subtle)] transition-[border-color,box-shadow] focus:border-[var(--color-primary-base)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]/30"
              />
              <p className="sm:col-span-2 -mt-1 text-center text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
                <T en="We’ll send your priorities and next steps.">Recibirás prioridades y próximos pasos.</T>
              </p>

              {status === "error" && (
                <div className="sm:col-span-2 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {status === "loading" ? (
                <motion.div
                  ref={loadingRef}
                  data-scroll-anchor
                  initial={prefersReducedMotion ? false : { opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: "easeOut" }}
                  role="status"
                  className="relative sm:col-span-2 mt-1 flex flex-col items-center gap-3 py-10 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] overflow-hidden">
                  <div className="flex w-full justify-center">
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full border border-[var(--color-primary-base)]/25 bg-[var(--color-primary-base)]/10 shadow-[0_0_28px_rgba(22,200,193,0.16)]">
                      <ThinkingOrb
                        state="searching"
                        size={64}
                        theme="auto"
                        aria-label={language === "en" ? "Searching for your business on Google" : "Buscando tu negocio en Google"}
                      />
                    </div>
                  </div>
                  <div aria-live="polite" className="min-h-[1.25rem]">
                    <ShimmerPhrase es={loadingCopy.es} en={loadingCopy.en} lang={language} />
                  </div>
                </motion.div>
              ) : (
                <motion.button
                  type="submit"
                  whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                  className="sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-7 py-4 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition-transform hover:-translate-y-0.5"
                >
                  <Search size={18} />
                  <T en="Review my business">Revisar mi negocio</T>
                  <ArrowRight size={17} />
                </motion.button>
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
            <motion.div
              ref={candidatesRef}
              data-scroll-anchor
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
              className="mt-3 max-w-xl mx-auto">
              <div className="mb-2 flex justify-start">
                <motion.button
                  type="button"
                  onClick={resetCandidateSearch}
                  whileHover={prefersReducedMotion ? undefined : { x: -1 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className="inline-flex items-center gap-1 rounded-md px-1 py-1 text-xs font-medium text-[var(--color-text-tertiary)] transition-colors hover:text-[var(--color-primary-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
                >
                  <ChevronRight size={13} className="rotate-180" />
                  <T en="Change search">Cambiar búsqueda</T>
                </motion.button>
              </div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-[var(--color-primary-base)] mb-4 text-center">
                {candidates.length > 1
                  ? <T en="We found several similar businesses — which one is yours?">Encontramos varios negocios parecidos — ¿cuál es el tuyo?</T>
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
                          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-primary-base)] px-4 py-2 text-xs font-black text-white shadow-sm shadow-teal-500/20 transition-transform hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-70 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
                        >
                          <Check size={13} />
                          <T en={confirmingPlaceId === cand.id ? "Confirming business..." : "This is my business"}>{confirmingPlaceId === cand.id ? "Confirmando negocio..." : "Este es mi negocio"}</T>
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
                  className="mt-4 mx-auto flex items-center gap-1.5 rounded-lg border border-[var(--color-primary-base)]/30 px-4 py-2 text-xs font-black text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/10 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
                >
                  <ChevronRight size={14} className="rotate-90" />
                  <T en="Show more listings">Mostrar más sucursales</T>
                  <span className="opacity-70">({candidates.length - visibleCandidateCount})</span>
                </motion.button>
              )}
              <div className="mt-3 border-t border-[var(--color-border-subtle)]/70 pt-3">
                <motion.button
                  type="button"
                  onClick={resetCandidateSearch}
                  whileHover={prefersReducedMotion ? undefined : { y: -2, scale: 1.01 }}
                  whileTap={prefersReducedMotion ? undefined : { scale: 0.98 }}
                  className="mx-auto flex w-fit max-w-full items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-[var(--color-border-subtle)] px-3 py-2 text-xs font-bold text-[var(--color-text-tertiary)] transition-colors hover:border-[var(--color-primary-base)]/50 hover:text-[var(--color-primary-base)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-2"
                >
                  <Search size={14} />
                  <T en="Search another business">Buscar otro negocio</T>
                </motion.button>
              </div>
            </motion.div>
          )}

          {status === "queued" && (
            <motion.div
              ref={queuedRef}
              data-scroll-anchor
              initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.45, ease: "easeOut" }}
              className="mt-4 max-w-xl mx-auto px-2 text-center">
              {revealNowLoading ? (
                <div className="flex w-full flex-col items-center gap-3">
                  <div className="flex justify-center">
                    <ThinkingOrb
                      state="solving"
                      size={64}
                      theme="auto"
                      aria-label={language === "en" ? "Atlas is generating your diagnosis" : "Atlas está generando tu diagnóstico"}
                    />
                  </div>
                  <div className="w-full max-w-md px-2 text-center whitespace-normal break-words">
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
                  <div className="mt-6 flex flex-col items-center gap-2">
                    <p className="text-xs font-bold text-[var(--color-text-tertiary)]"><T en="Prefer it right now?">¿Lo prefieres ya?</T></p>
                    <button
                      type="button"
                      onClick={handleRevealNow}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-base)]/40 bg-[var(--color-primary-base)]/10 px-5 py-3 text-xs font-black text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/15"
                    >
                      <AtlasMark variant="isotipo" label="Atlas Assistant" className="h-5 w-5 shrink-0" />
                      <T en="Generate with Atlas instantly">Generar con Atlas al instante</T>
                    </button>
                  </div>
                  {revealNowError && <p className="mt-3 text-xs text-red-400">{revealNowError}</p>}
                </>
              )}
            </motion.div>
          )}

          {status === "success" && diagnostic && (
            <motion.div
              ref={successRef}
              data-scroll-anchor
              initial={prefersReducedMotion ? false : { opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="mt-8 max-w-2xl mx-auto">
              {revealedByAtlas && (
                <div className="mb-5 flex justify-center" role="img" aria-label="Atlas Assistant">
                  <div className="flex items-center gap-3">
                    <AtlasMark variant="isotipo" className="h-14 w-14" />
                    <AtlasMark variant="wordmark" className="h-8 w-auto" />
                  </div>
                </div>
              )}
              <div className="rounded-2xl border border-[var(--color-primary-base)]/20 bg-[var(--color-primary-base)]/5 px-4 py-5 md:px-6">
                <div className="flex items-center gap-2 text-emerald-500 text-xs font-black uppercase tracking-widest">
                  <Check size={15} />
                  <T en="Diagnosis ready">Diagnóstico listo</T>
                </div>
                {place && (
                  <>
                    <p className="mt-2 truncate text-base font-bold text-[var(--color-text-primary)]">
                      {place.name}
                    </p>
                    <div className="mt-3 space-y-2 text-xs text-[var(--color-text-secondary)]">
                      {place.address && (
                        <div className="flex items-start gap-2">
                          <MapPin size={15} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" />
                          <span className="break-words">{place.address}</span>
                        </div>
                      )}
                      {place.primaryType && (
                        <div className="flex items-center gap-2">
                          <Building2 size={15} className="shrink-0 text-[var(--color-primary-base)]" />
                          <span className="capitalize">{place.primaryType.replace(/_/g, " ")}</span>
                        </div>
                      )}
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {place.rating != null && (
                          <span className="inline-flex items-center gap-1 font-bold text-amber-500">
                            <Star size={15} fill="currentColor" />
                            {place.rating}/5
                          </span>
                        )}
                        {place.reviewCount > 0 && (
                          <span className="inline-flex items-center gap-1">
                            <MessageCircle size={15} className="text-[var(--color-primary-base)]" />
                            {place.reviewCount} {language === "en" ? "reviews" : "reseñas"}
                          </span>
                        )}
                      </div>
                    </div>
                  </>
                )}
                <p className="mt-4 flex items-start gap-2 border-t border-[var(--color-primary-base)]/15 pt-3 text-xs leading-relaxed text-[var(--color-text-secondary)]">
                  <Mail size={14} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" />
                  <span>
                    {revealedByAtlas
                      ? <T en={`Sent immediately to ${email}.`}>{`Enviado ahora a ${email}.`}</T>
                      : <T en={`It will be sent to ${email} within 5–10 minutes.`}>{`Se enviará a ${email} en 5–10 minutos.`}</T>}
                  </span>
                </p>
              </div>
              <p className="mt-4 text-sm italic leading-relaxed text-[var(--color-text-tertiary)] break-words overflow-hidden">{diagnostic.businessIntro}</p>
              <p className="mt-2 text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)] break-words overflow-hidden">{diagnostic.summary}</p>

              <div className="mt-6 space-y-3">
                {diagnostic.problems.slice(0, 2).map((p, i) => (
                  <motion.div key={i} {...motionReveal(i * 0.08)} className="rounded-xl border border-[var(--color-border-subtle)] p-4 overflow-hidden">
                    <p className="font-black text-sm break-words">{i + 1}. {p.title}</p>
                    <p className="mt-1 text-xs text-[var(--color-text-secondary)] break-words">{p.why}</p>
                    <p className="mt-2 text-xs font-bold text-[var(--color-primary-base)] break-words">→ {p.fix}</p>
                  </motion.div>
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
                  {diagnostic.sevenDayPlan.slice(0, 3).map((d, i) => (
                    <motion.div key={d.day} {...motionReveal(i * 0.08)} className="flex items-start gap-3 rounded-xl border border-[var(--color-border-subtle)] p-3">
                      <span className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-primary-base)] flex items-center justify-center text-[10px] font-black text-white">
                        {d.day}
                      </span>
                      <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed pt-0.5">{d.action}</p>
                    </motion.div>
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
                      <T en="Impulso organizes the information, content, and follow-up messages your customers need to take the next step.">
                        Impulso organiza la información, el contenido y los mensajes de seguimiento que tus clientes necesitan para dar el siguiente paso.
                      </T>
                    </p>
                    <motion.a
                      href={`/local-lift/pagar/${diagnosticLeadId}?tier=impulso`}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-teal-500/20 transition-transform hover:-translate-y-0.5 w-full"
                    >
                      <MessageCircle size={16} />
                      <T en="I want Impulso">Quiero Impulso</T>
                      <ArrowRight size={15} />
                    </motion.a>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2 leading-relaxed">
                      <T en="Ascenso adds assisted implementation, so the approved changes move from plan to execution without asking for passwords.">
                        Ascenso añade implementación asistida para llevar los cambios aprobados del plan a la ejecución, sin pedirte contraseñas.
                      </T>
                    </p>
                    <motion.a
                      href={`/local-lift/pagar/${diagnosticLeadId}?tier=ascenso`}
                      whileHover={prefersReducedMotion ? undefined : { y: -2 }}
                      whileTap={prefersReducedMotion ? undefined : { scale: 0.985 }}
                      className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-primary-base)]/40 bg-[var(--color-primary-base)]/8 px-6 py-3 text-sm font-bold text-[var(--color-primary-base)] transition-colors hover:bg-[var(--color-primary-base)]/14 w-full"
                    >
                      <TrendingUp size={16} />
                      <T en="I want Ascenso">Quiero Ascenso</T>
                    </motion.a>
                  </div>
                </div>
              )}
              {revealedByAtlas && (
                <p className="mt-8 text-center text-[10px] italic leading-relaxed text-[var(--color-text-tertiary)]">
                  <T en="This analysis was generated by Atlas from the information found on Google.">Este análisis fue generado por Atlas a partir de la información encontrada en Google.</T>
                </p>
              )}
            </motion.div>
          )}

          <WisePhrase lang={language} />
        </motion.section>

        <motion.section {...motionReveal(0.04)} id="preguntas-frecuentes" className="scroll-mt-24 pt-24">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col items-center text-center gap-4 mb-8">
              <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Common questions">PREGUNTAS FRECUENTES</T>
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight"><T en="Questions before you start">Preguntas antes de empezar</T></h2>
              <p className="max-w-2xl text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en="A few clear answers about the review, the packages, and what happens next.">Respuestas claras sobre la revisión, los paquetes y lo que sucede después.</T></p>
            </div>
            <div className="space-y-4">
              {[
                ["What do I need to start?", "¿Qué necesito para empezar?", "Just your business name and city, or its direct Google Maps link.", "Solo el nombre y la ciudad de tu negocio, o su enlace directo de Google Maps."],
                ["Can I see the result without receiving an email?", "¿Puedo ver el resultado sin recibir un correo?", "Yes. You can view it on screen when it is ready; email is optional.", "Sí. Puedes verlo en pantalla cuando esté listo; el correo es opcional."],
                ["What is the difference between the packages?", "¿Qué diferencia hay entre los paquetes?", "Express identifies priorities, Impulso prepares the materials, and Ascenso adds personalized 1:1 implementation support.", "Express identifica prioridades, Impulso prepara los materiales y Ascenso añade implementación personalizada 1:1."],
                ["Will you ask for my passwords?", "¿Me pedirán mis contraseñas?", "No. We work with the information and changes you approve.", "No. Trabajamos con la información y los cambios que tú apruebes."],
                ["Do you guarantee a position on Google?", "¿Garantizan una posición en Google?", "No. We show what may be creating friction and what is worth improving first.", "No. Mostramos qué puede estar generando dudas y qué conviene mejorar primero."],
              ].map(([enQuestion, esQuestion, enAnswer, esAnswer], index) => (
                <motion.div
                  key={enQuestion}
                  onClick={() => toggleFaq(index)}
                  className={`p-6 rounded-2xl glass-panel transition-colors cursor-pointer ${openFaqIndex === index ? "!border-[var(--color-primary-base)] shadow-lg" : "hover:!border-[var(--color-primary-base)]/50"}`}
                >
                  <div className="flex justify-between items-center gap-4">
                    <h3 className="font-bold text-base md:text-lg"><T en={enQuestion}>{esQuestion}</T></h3>
                    <motion.div
                      animate={{ rotate: openFaqIndex === index ? 180 : 0 }}
                      transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3 }}
                      className="shrink-0"
                    >
                      <ChevronDown size={18} className={openFaqIndex === index ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-tertiary)]"} />
                    </motion.div>
                  </div>
                  <AnimatePresence initial={false}>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={prefersReducedMotion ? false : { height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={prefersReducedMotion ? undefined : { height: 0, opacity: 0 }}
                        transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <p className="text-sm text-[var(--color-text-secondary)] pt-4 leading-relaxed"><T en={enAnswer}>{esAnswer}</T></p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

      </main>
      <Footer />
    </div>
  );
}
