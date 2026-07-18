import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  Loader2,
  Cloud,
  Info,
  RotateCcw,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AISparkleIcon from "../components/AISparkleIcon";
import GlobeSearchIcon from "../components/GlobeSearchIcon";
import BookingScheduler from "../components/BookingScheduler";
import { T, useLanguage } from "../context/LanguageContext";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../context/ToastContext";
import { collection, doc, addDoc, setDoc, serverTimestamp, Timestamp } from "firebase/firestore";
import { db, auth } from "../lib/firebase";

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo: auth?.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface QuoteSession {
  sessionId: string;
  sector: string | null;
  businessType: string | null;
  webType: string | null;
  addons: string[];
  estimatedPrice: number;
  currentStep: number;
  status: "in_progress" | "abandoned" | "completed";
  createdAt: Timestamp;
  updatedAt: Timestamp;
  email?: string;
}

function AnimatedNumber({ value }: { value: number }) {
  const [displayValue, setDisplayValue] = useState(value);
  const [pulse, setPulse] = useState(false);

  useEffect(() => {
    let startTimestamp: number | null = null;
    const startValue = displayValue;
    const endValue = value;
    const duration = 400; // ms

    let animationFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      // Easing: easeOutCubic
      const easedProgress = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(
        startValue + easedProgress * (endValue - startValue),
      );
      setDisplayValue(current);

      if (progress < 1) {
        animationFrameId = window.requestAnimationFrame(step);
      }
    };

    animationFrameId = window.requestAnimationFrame(step);
    setPulse((prev) => !prev);

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [value]);

  return (
    <motion.span
      animate={{
        scale: [1, 1.08, 1],
        y: [0, -2, 0],
      }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      key={pulse ? "a" : "b"}
      className="inline-block"
    >
      {displayValue}
    </motion.span>
  );
}

const sectors = [
  {
    id: "food",
    title: <T en="Food & Beverages">Alimentación & Bebidas</T>,
    desc: <T en="Restaurants, cafes, bakeries, catering...">Restaurantes, cafeterías, panaderías, catering...</T>,
    businesses: {
      en: ["Restaurant", "Ice Cream Shop", "Cafeteria", "Bakery", "Bar/Lounge", "Catering", "Food Truck", "Pastry Shop", "Juices & Smoothies", "Other"],
      es: ["Restaurante", "Heladería", "Cafetería", "Panadería", "Bar/Lounge", "Catering", "Food Truck", "Repostería", "Jugos & Smoothies", "Otro"]
    }
  },
  {
    id: "health",
    title: <T en="Health, Beauty & Wellness">Salud, Belleza & Bienestar</T>,
    desc: <T en="Clinics, gyms, spas, aesthetics, specialized consultations...">Clínicas, gimnasios, spas, estética, consultas...</T>,
    businesses: {
      en: ["Clinic", "Pharmacy", "Gym", "Spa/Aesthetics", "Psychology", "Nutrition", "Dentistry", "Veterinary", "Optics", "Yoga Center", "Beauty Salon", "Barber Shop", "Nails & Manicure", "Makeup", "Other"],
      es: ["Clínica", "Farmacia", "Gimnasio", "Spa/Estética", "Psicología", "Nutrición", "Odontología", "Veterinaria", "Óptica", "Centro de Yoga", "Salón de belleza", "Barbería", "Uñas & Manicure", "Maquillaje", "Otro"]
    }
  },
  {
    id: "retail",
    title: <T en="Fashion & Retail">Moda & Retail</T>,
    desc: <T en="Clothing stores, footwear, accessories, jewelry...">Tiendas de ropa, calzado, accesorios, joyería...</T>,
    businesses: {
      en: ["Clothing Store", "Footwear", "Accessories", "Jewelry", "Cosmetics", "Perfumery", "Children's Clothing", "Uniforms", "Other"],
      es: ["Tienda de ropa", "Calzado", "Accesorios", "Joyería", "Cosmética", "Perfumería", "Ropa infantil", "Uniformes", "Otro"]
    }
  },
  {
    id: "services",
    title: <T en="Professional Services">Servicios Profesionales</T>,
    desc: <T en="Lawyers, accountants, consultants, coaches...">Abogados, contadores, consultores, coaches...</T>,
    businesses: {
      en: ["Lawyer", "Accountant", "Consultant", "Architect", "Coach", "Marketing Agency", "Photography", "Graphic Design", "Translation", "Private Security", "Other"],
      es: ["Abogado", "Contador", "Consultor", "Arquitecto", "Coach", "Agencia de marketing", "Fotografía", "Diseño gráfico", "Traducción", "Seguridad privada", "Otro"]
    }
  },
  {
    id: "realestate",
    title: <T en="Real Estate">Inmobiliario</T>,
    desc: <T en="Real estate brokers, construction, vacation rentals...">Agentes inmobiliarios, constructoras, alquiler vacacional...</T>,
    businesses: {
      en: ["Broker/Agent", "Construction Company", "Vacation Rental", "Property Management", "Appraisal", "Other"],
      es: ["Broker/Agente", "Constructora", "Alquiler vacacional", "Administración de propiedades", "Tasación", "Otro"]
    }
  },
  {
    id: "education",
    title: <T en="Education & Training">Educación & Capacitación</T>,
    desc: <T en="Language academies, tutors, schools, online courses...">Academias de idiomas, tutores, escuelas, cursos online...</T>,
    businesses: {
      en: ["Language Academy", "Tutor", "School", "Online Course", "Daycare", "Training Center", "Music & Art", "Other"],
      es: ["Academia de idiomas", "Tutor", "Escuela", "Curso online", "Guardería", "Centro de capacitación", "Música & Arte", "Otro"]
    }
  },
  {
    id: "tourism",
    title: <T en="Tourism, Events & Hospitality">Turismo, Eventos & Hospitalidad</T>,
    desc: <T en="Hotels, hostels, operators, event photographer, travel agencies...">Hoteles, hostales, agencias de viaje, fotografía...</T>,
    businesses: {
      en: ["Hotel", "Hostel", "Tour Operator", "Car Rental", "Excursions", "Travel Agency", "DJ", "Event Photography", "Decoration", "Children's Entertainment", "Party Hall", "Audiovisual Production", "Other"],
      es: ["Hotel", "Hostal", "Tour operador", "Renta de vehículos", "Excursiones", "Agencia de viajes", "DJ", "Fotografía de eventos", "Decoración", "Animación infantil", "Salón de fiestas", "Producción audiovisual", "Otro"]
    }
  },
  {
    id: "tech",
    title: <T en="Technology & Agencies">Tecnología & Agencias</T>,
    desc: <T en="Startups, SaaS platforms, mobile applications...">Startups, plataformas SaaS, aplicaciones móviles...</T>,
    businesses: {
      en: ["Startup", "SaaS", "Mobile App", "Digital Agency", "Technical Support", "Equipment Sales", "Other"],
      es: ["Startup", "SaaS", "App móvil", "Agencia digital", "Soporte técnico", "Venta de equipos", "Otro"]
    }
  },
  {
    id: "other",
    title: <T en="Other">Otro</T>,
    desc: <T en="Any other business model or custom interactive platform project.">Cualquier otro modelo de negocio o proyecto de plataforma personalizado.</T>,
    businesses: {
      en: ["Other"],
      es: ["Otro"]
    }
  }
];

const sectorRecommendations: Record<
  string,
  {
    primary: string;
    secondary: string | null;
    addons: string[];
  }
> = {
  food: { primary: "landing", secondary: "corporate", addons: ["bot_fast", "branding"] },
  health: { primary: "corporate", secondary: null, addons: ["bot_fast", "content_assistant"] },
  retail: { primary: "ecommerce", secondary: null, addons: ["semantic_search", "ai_agent"] },
  services: { primary: "landing", secondary: "corporate", addons: ["bot_fast", "content_assistant"] },
  realestate: { primary: "corporate", secondary: null, addons: ["bot_fast", "branding"] },
  education: { primary: "corporate", secondary: null, addons: ["bot_fast", "content_assistant"] },
  tourism: { primary: "landing", secondary: "corporate", addons: ["bot_fast", "branding"] },
  tech: { primary: "corporate", secondary: "ecommerce", addons: ["ai_agent", "semantic_search"] },
  other: { primary: "landing", secondary: "corporate", addons: ["bot_fast"] },
};

const steps = [
  { id: "sector", title: <T en="Sector">Sector</T> },
  { id: "type", title: <T en="Web Type">Tipo de Web</T> },
  { id: "addons", title: <T en="AI & Add-ons">IA y Complementos</T> },
  { id: "pdf", title: <T en="PDF Quote">Cotización PDF</T> },
  { id: "schedule", title: <T en="Schedule Meeting">Agendar Reunión</T> },
];

const types = [
  {
    id: "landing",
    name: "Landing Page",
    title: "Landing Page",
    price: 299,
    // Nombres comerciales (Destello/Constelación/Nova) — usados en el email
    // de confirmación de cotización y el PDF de desglose, donde no se puede
    // renderizar JSX. El wizard en pantalla sigue mostrando "Landing Page".
    labelEs: "Destello",
    labelEn: "Destello",
    desc: (
      <T en="1 single scrollable page (Up to 5 sections)">
        1 sola página web (Diseño vertical de 5 bloques)
      </T>
    ),
  },
  {
    id: "corporate",
    name: "Corporate Web",
    title: <T en="Corporate Web">Web Corporativa</T>,
    price: 699,
    labelEs: "Constelación",
    labelEn: "Constelación",
    desc: (
      <T en="Manageable site (Up to 5 independent pages)">
        Sitio autoadministrable (Hasta 5 páginas independientes)
      </T>
    ),
  },
  {
    id: "ecommerce",
    name: "E-commerce",
    title: "E-commerce",
    price: 1299,
    labelEs: "Nova",
    labelEn: "Nova",
    desc: (
      <T en="Online store (Includes setup of 20 products)">
        Tienda online (Incluye carga inicial de 20 productos)
      </T>
    ),
  },
];



const addons = [
  {
    id: "ai_agent",
    title: <T en="Autonomous AI Agent">Agente de Ventas IA</T>,
    labelEs: "Agente de Ventas IA",
    labelEn: "Autonomous AI Agent",
    price: 49,
    isMonthly: true,
    suffix: "/mes",
    desc: (
      <T
        en={
          <>
            Smart bot that converses and sells*
            <span className="block text-[10px] text-[var(--color-text-tertiary)] mt-1 font-normal">
              *Not available for Nova — already included
            </span>
          </>
        }
      >
        <>
          Bot inteligente que conversa y vende*
          <span className="block text-[10px] text-[var(--color-text-tertiary)] mt-1 font-normal">
            *No disponible para Nova — ya incluido
          </span>
        </>
      </T>
    ),
    isAi: true,
  },
  {
    id: "bot_fast",
    title: <T en="24/7 Attendance Bot">Bot de Atención 24/7</T>,
    labelEs: "Bot de Atención 24/7",
    labelEn: "24/7 Attendance Bot",
    price: 149,
    desc: <T en="Automated flows 24/7">Flujos automatizados 24/7</T>,
    isAi: true,
  },
  {
    id: "semantic_search",
    title: <T en="Semantic AI Search">Buscador Semántico IA</T>,
    labelEs: "Buscador Semántico IA",
    labelEn: "Semantic AI Search",
    price: 249,
    desc: (
      <T en="Smart catalog search. Recommended for Nova e-commerce.">
        Búsqueda avanzada para e-commerce. Recomendado para Nova.
      </T>
    ),
    isAi: true,
    novaSpec: true,
  },
  {
    id: "content_assistant",
    title: <T en="Content Assistant">Asistente de Contenido</T>,
    labelEs: "Asistente de Contenido",
    labelEn: "Content Assistant",
    price: 29,
    isMonthly: true,
    suffix: "/mes",
    desc: (
      <T en="AI assistant integrated into your website, trained on your brand, products and tone — generates descriptions, posts and replies just like your team would.">
        Asistente IA integrado en tu web, entrenado con tu marca, productos y tono — genera descripciones, posts y respuestas tal como lo haría tu equipo.
      </T>
    ),
    isAi: true,
  },
  {
    id: "content_seo",
    title: <T en="SEO Strategy Guide">Guía de Estrategia SEO</T>,
    labelEs: "Guía de Estrategia SEO",
    labelEn: "SEO Strategy Guide",
    price: 49,
    desc: (
      <T en="Personalized content strategy guide with 20 keywords prioritized for your industry and market.">
        Guía personalizada de estrategia de contenido con 20 keywords priorizadas para tu industria y mercado.
      </T>
    ),
  },
  {
    id: "crm_connect",
    title: <T en="CRM Connect">CRM Connect</T>,
    labelEs: "CRM Connect",
    labelEn: "CRM Connect",
    price: 149,
    desc: (
      <T en="Automatically sync every web lead to HubSpot, Zoho CRM, Google Sheets, Pipedrive or Salesforce.">
        Sincroniza cada lead de tu web automáticamente con HubSpot, Zoho CRM, Google Sheets, Pipedrive o Salesforce.
      </T>
    ),
  },
  {
    id: "multilingual",
    title: <T en="Multilingual Website">Sitio Web Multilingüe</T>,
    labelEs: "Sitio Web Multilingüe",
    labelEn: "Multilingual Website",
    price: 99,
    desc: (
      <T en="Site in up to 3 languages, architecture included">
        Sitio en hasta 3 idiomas, arquitectura incluida
      </T>
    ),
  },
  {
    id: "copy",
    title: <T en="Pro Copywriting">Copywriting Profesional</T>,
    labelEs: "Copywriting Profesional",
    labelEn: "Pro Copywriting",
    price: 97,
    desc: <T en="Persuasive sales texts">Textos persuasivos que venden</T>,
  },
  {
    id: "branding",
    title: <T en="Basic Branding Kit">Kit de Branding Básico</T>,
    labelEs: "Kit de Branding Básico",
    labelEn: "Basic Branding Kit",
    price: 149,
    desc: (
      <T en="Logo redesign and professional color palette">
        Rediseño de logotipo y paleta de colores profesional
      </T>
    ),
  },
  {
    id: "hosting",
    title: <T en="Premium Maintenance & Support">Mantenimiento y Soporte Premium</T>,
    labelEs: "Mantenimiento y Soporte Premium",
    labelEn: "Premium Maintenance & Support",
    price: 30,
    isMonthly: true,
    suffix: "/mes",
    desc: (
      <T en="Security and server maintenance">
        Seguridad y mantenimiento continuo
      </T>
    ),
  },
];

// Micro-copy de validación por addon
const addonSocialProof: Record<string, { en: string; es: string }> = {
  ai_agent: {
    en: "Intercom, Zendesk & HubSpot replaced their first-touch support with AI agents — reducing response time by 80%.",
    es: "Intercom, Zendesk y HubSpot reemplazaron su soporte inicial con agentes IA, reduciendo el tiempo de respuesta un 80%.",
  },
  bot_fast: {
    en: "Businesses using 24/7 automated flows capture 3× more leads outside business hours.",
    es: "Negocios con flujos automatizados 24/7 capturan 3× más leads fuera del horario laboral.",
  },
  semantic_search: {
    en: "Shopify stores with AI-powered search see up to 43% higher conversion than keyword-only search.",
    es: "Tiendas con búsqueda semántica convierten hasta un 43% más que las de búsqueda por palabras clave.",
  },
  content_assistant: {
    en: "Brands using AI-generated descriptions publish content 5× faster, freeing time for growth.",
    es: "Marcas que usan IA para sus descripciones publican contenido 5× más rápido.",
  },
  crm_connect: {
    en: "Businesses that auto-capture leads into a CRM close 27% more deals — HubSpot, Zoho, Sheets, Pipedrive and Salesforce supported.",
    es: "Los negocios que capturan leads automáticamente en un CRM cierran un 27% más de ventas — compatible con HubSpot, Zoho, Sheets, Pipedrive y Salesforce.",
  },
  multilingual: {
    en: "Sites in 2+ languages reach 72% more buyers globally. Includes full architecture and translation for up to 3 languages (CSA Research).",
    es: "Sitios en 2+ idiomas alcanzan un 72% más de compradores globales. Incluye arquitectura y traducción para hasta 3 idiomas (CSA Research).",
  },
  copy: {
    en: "Basecamp and Stripe attribute their early growth largely to conversion-focused copywriting.",
    es: "Basecamp y Stripe atribuyen su crecimiento inicial al copywriting enfocado en conversión.",
  },
  branding: {
    en: "Consistent branding across touchpoints increases revenue by up to 23% (Lucidpress).",
    es: "Una marca consistente en todos los puntos de contacto aumenta los ingresos hasta un 23% (Lucidpress).",
  },
  content_seo: {
    en: "Businesses with a defined keyword strategy get 3× more organic traffic than those without one (BrightEdge, 2024).",
    es: "Los negocios con una estrategia de keywords definida reciben 3× más tráfico orgánico que los que no la tienen (BrightEdge, 2024).",
  },
  hosting: {
    en: "Sites with active maintenance have 99.9% uptime vs 94% for unmanaged servers.",
    es: "Sitios con mantenimiento activo alcanzan 99.9% de uptime vs 94% en servidores sin gestión.",
  },
};

// Agendado propio vía Cloud Function calcom-booking (repo Meridian) — el
// wizard ya no usa el formulario embebido de Cal.com. Motivo real (18 de
// julio): con el embed, el cliente recibía siempre dos correos ajenos (la
// confirmación de hello@cal.com y la invitación de Google Calendar desde el
// Gmail personal) imposibles de apagar sin pagar Cal.com. Reservando por API,
// el asistente en Cal.com es el buzón interno (hola@polarisweb.studio) y el
// cliente recibe un solo correo: el de Polaris, con el Meet real y el .ics.
const BOOKING_URL = "https://calcom-booking-wdvfac6mgq-ue.a.run.app";

// Una cotización guardada hace más de 30 días probablemente refleje precios u
// ofertas ya vencidas, así que se descarta en vez de retomarla silenciosamente.
const WIZARD_RESUME_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function isSavedWizardStale(): boolean {
  const savedAt = localStorage.getItem("wizardQuote_savedAt");
  if (!savedAt) return false;
  const ts = parseInt(savedAt, 10);
  return !Number.isNaN(ts) && Date.now() - ts > WIZARD_RESUME_TTL_MS;
}

export default function WizardQuote() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { language, translate } = useLanguage();
  const { success: toastSuccess, error: toastError } = useToast();
  const location = useLocation();

  // Domain search / check state definitions
  const [domainName, setDomainName] = useState("");
  const [domainSuggestions, setDomainSuggestions] = useState<{ domain: string; available: boolean }[]>([]);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");
  const [domainStatus, setDomainStatus] = useState<{
    domain: string;
    available: boolean;
  } | null>(null);
  const domainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastShownRef = useRef(false);

  // States for step 3: PDF Quote
  const [pdfEmail, setPdfEmail] = useState("");
  const [pdfName, setPdfName] = useState("");
  const [sendingPdf, setSendingPdf] = useState(false);
  const [pdfSent, setPdfSent] = useState(false);
  const [pdfEmailError, setPdfEmailError] = useState("");

  const fetchDomainSuggestions = useCallback(async (domain: string, sector: string | null, businessType: string | null) => {
    try {
      const response = await fetch("/api/suggest-domains", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ domain, sector, businessType }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || response.statusText);
      }
      const data = await response.json();
      setDomainSuggestions(data.suggestions || []);
    } catch (error) {
      console.error("Error fetching domain suggestions:", error);
      setDomainSuggestions([]);
    }
  }, [setDomainSuggestions]);

  const checkDomainAvailability = async (domainToCheck?: string) => {
    const target = (domainToCheck || domainName).trim();
    if (!target || !target.includes('.')) return;
    setCheckingDomain(true);
    setDomainError('');
    setDomainStatus(null);
    try {
      const response = await fetch(`/api/check-domain?domain=${encodeURIComponent(target)}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || response.statusText);
      }
      const data = await response.json();
      setDomainStatus({
        domain: target.toLowerCase(),
        available: data.available,
      });

      if (!data.available) {
        fetchDomainSuggestions(target.toLowerCase(), selections.sector || null, selections.businessType || null);
      } else {
        setDomainSuggestions([]); // Clear suggestions if domain is available
      }
    } catch (error: any) {
      let rawMsg = error.message || '';
      if (
        rawMsg.toLowerCase().includes('pattern') || 
        rawMsg.toLowerCase().includes('format') || 
        rawMsg.toLowerCase().includes('load failed') ||
        rawMsg.toLowerCase().includes('failed to fetch')
      ) {
        setDomainError(
          language === "en"
            ? "Could not check availability. Make sure to enter a valid domain (example.com) or try again."
            : "No se pudo comprobar la disponibilidad. Asegúrate de ingresar un dominio con formato válido (ejemplo.com) o intenta de nuevo."
        );
      } else {
        setDomainError(
          rawMsg ||
            (language === "en"
              ? "Could not verify availability. Please try again."
              : "No se pudo verificar la disponibilidad. Intenta nuevamente.")
        );
      }
    } finally {
      setCheckingDomain(false);
    }
  };

  // Session tracking
  const [sessionId, setSessionId] = useState<string>("");
  const [sessionInitialized, setSessionInitialized] = useState<boolean>(false);

  useEffect(() => {
    let currentSessionId = localStorage.getItem("polaris_quote_session");
    if (!currentSessionId) {
      currentSessionId = crypto.randomUUID();
      localStorage.setItem("polaris_quote_session", currentSessionId);
    }
    setSessionId(currentSessionId);

    // Initialize Firestore session on mount
    const initializeSession = async () => {
      if (currentSessionId) {
        try {
          await setDoc(doc(db, "quoteSessions", currentSessionId), {
            sessionId: currentSessionId,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            status: "in_progress",
          } as QuoteSession, { merge: true });
          setSessionInitialized(true);
        } catch (error) {
          console.error("Failed to initialize session in Firestore:", error);
          try {
            handleFirestoreError(error, OperationType.WRITE, `quoteSessions/${currentSessionId}`);
          } catch (e) {
            // Keep going, but we logged the formatted error
          }
        }
      }
    };
    initializeSession();
  }, []); // Run only once on mount

  const resetWizard = () => {
    // 1. Mark current session as "abandoned" in Firestore
    if (sessionId) {
      const sessionRef = doc(db, "quoteSessions", sessionId);
      setDoc(sessionRef, {
        status: "abandoned",
        updatedAt: serverTimestamp(),
      } as Partial<QuoteSession>, { merge: true }).catch(console.error);
    }

    // 2. Generate a new sessionId
    const newSessionId = crypto.randomUUID();

    // 3. Overwrite localStorage with the new sessionId
    localStorage.setItem("polaris_quote_session", newSessionId);

    // Reset all local storage items related to the wizard's state
    localStorage.removeItem("wizardQuote_currentStep");
    localStorage.removeItem("wizardQuote_selections");
    localStorage.removeItem("wizardQuote_savedAt");
    localStorage.removeItem("wizardQuote_leadCaptured");
    localStorage.removeItem("wizardQuote_selectedType");
    localStorage.removeItem("wizardQuote_selectedAddons");
    localStorage.removeItem("wizardQuote_domainName");
    localStorage.removeItem("polaris_addon_descriptions");
    
    // 4. Reset frontend state
    setCurrentStep(0);
    setSelections({ // Reset selections to initial state
      sector: "",
      businessType: "",
      type: "",
      addons: ["hosting"] as string[],
      date: null as Date | null,
      time: "",
      name: "",
      email: "",
      phone: "",
      notes: "",
    });
    setSessionId(newSessionId); // Update sessionId state
    window.location.reload(); // Hard refresh to ensure full state reset and new session tracking
  };

  const [currentStep, setCurrentStep] = useState(() => {
    if (isSavedWizardStale()) return 0;
    const saved = localStorage.getItem("wizardQuote_currentStep");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [expandedThirdTypes, setExpandedThirdTypes] = useState<Set<string>>(new Set());
  // La hidratación inicial queda en {}: el efecto de abajo rellena las
  // descripciones desde la caché por-negocio (o pide a la IA) tras montar.
  const [addonDescriptions, setAddonDescriptions] = useState<Record<string, string | null>>({});
  const [addonDescLoading, setAddonDescLoading] = useState(false);

  const [selections, setSelections] = useState(() => {
    if (!isSavedWizardStale()) {
      const saved = localStorage.getItem("wizardQuote_selections");
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch (e) {
          console.error(
            "Failed to parse wizard selections from local storage",
            e,
          );
        }
      }
    }
    return {
      sector: "",
      businessType: "",
      type: "",
      addons: ["hosting"] as string[],
      date: null as Date | null,
      time: "",
      name: "",
      email: "",
      phone: "",
      notes: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("wizardQuote_currentStep", currentStep.toString());
    localStorage.setItem("wizardQuote_savedAt", Date.now().toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem("wizardQuote_selections", JSON.stringify(selections));
    localStorage.setItem("wizardQuote_savedAt", Date.now().toString());
  }, [selections]);

  useEffect(() => {
    if (!selections.businessType || !selections.sector) return;
    const currentPlanType = selections.type || sectorRecommendations[selections.sector]?.primary || "corporate";
    const cacheKey = `polaris_addon_desc_${selections.businessType}_${currentPlanType}`;
    try {
      const saved = localStorage.getItem(cacheKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === "object") {
          setAddonDescriptions(parsed);
          return;
        }
      }
    } catch {}
    generateAddonDescriptions(selections.businessType, selections.sector, currentPlanType);
  }, [selections.businessType, selections.type, selections.sector]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const typeParam = params.get("type");
    const scopeParam = params.get("scope");
    const planParam = params.get("plan");
    const addonParam = params.get("addon");
    const addonsParam = params.get("addons");
    const stepParam = params.get("step");

    if (stepParam === "schedule" || stepParam === "3") {
      setCurrentStep(3);
      return;
    }

    const targetType =
      typeParam || scopeParam || (planParam === "nova" ? "ecommerce" : null);

    if (targetType || addonParam || addonsParam) {
      setSelections((s) => {
        let newType = s.type;
        if (
          targetType &&
          ["landing", "corporate", "ecommerce"].includes(targetType)
        ) {
          newType = targetType;
        }

        let newAddons = [...s.addons];
        if (addonParam && !newAddons.includes(addonParam)) {
          newAddons.push(addonParam);
        }
        if (addonsParam) {
          const splitAddons = addonsParam.split(",");
          splitAddons.forEach((a) => {
            const cleanA = a.trim();
            if (cleanA && !newAddons.includes(cleanA)) {
              newAddons.push(cleanA);
            }
          });
        }

        return {
          ...s,
          type: newType,
          addons: newAddons,
        };
      });
      setCurrentStep(0);
    }
  }, [location.search]);

  // Avisa que se retomó una cotización en progreso, pero no si llegó por un
  // enlace con parámetros propios (?type=, ?step=, etc.), ya que ese efecto
  // de arriba sobreescribe el paso/selecciones restaurados con los de la URL.
  useEffect(() => {
    const hasResumedProgress =
      currentStep > 0 || !!selections.sector || !!selections.businessType;
    if (!location.search && hasResumedProgress && !toastShownRef.current) {
      toastShownRef.current = true;
      toastSuccess(
        <T en="Welcome back! We picked up your quote where you left off.">
          ¡Bienvenido de nuevo! Retomamos tu cotización donde la dejaste.
        </T>
      );
    }
    // Solo debe evaluarse una vez, con el estado ya restaurado del montaje inicial.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [estimateExpanded, setEstimateExpanded] = useState(false);
  // Rastrea qué sector terminó su animación de expansión, para poder
  // dejar de recortar (overflow-hidden) una vez que ya no hace falta
  // y así no cortar el hover/shadow de los botones de tipo de negocio.
  const [expandedSectorDone, setExpandedSectorDone] = useState<string | null>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const [sidebarVisible, setSidebarVisible] = useState(false);

  const scrollToProgress = () => {
    setTimeout(() => {
      const el = progressRef.current;
      if (el) {
        const rect = el.getBoundingClientRect();
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        window.scrollTo({
          top: rect.top + scrollTop - 100,
          behavior: "smooth",
        });
      }
    }, 50);
  };

  useEffect(() => {
    const el = sidebarRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSidebarVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);


  // GA4 helper
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    try {
      (window as any).gtag?.("event", eventName, params);
    } catch (_) {}
  };

  const [targetDate] = useState(() =>
    new Date("2026-08-17T23:59:59Z").getTime(),
  );
  const [timeLeft, setTimeLeft] = useState(targetDate - new Date().getTime());
  const [isOfferActive, setIsOfferActive] = useState(timeLeft > 0);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = targetDate - new Date().getTime();
      if (remaining <= 0) {
        setTimeLeft(0);
        setIsOfferActive(false);
        clearInterval(timer);
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const calculateTotalPrice = useMemo(() => {
    let basePrice = 0;
    const selectedType = types.find((t) => t.id === selections.type);
    if (selectedType) {
      basePrice += selectedType.price;
    }

    const addonsPrice = selections.addons.reduce((sum, addonId) => {
      const addon = addons.find((a) => a.id === addonId);
      return sum + (addon ? addon.price : 0);
    }, 0);

    let total = basePrice + addonsPrice;

    // Apply 25% discount if active
    if (isOfferActive) {
      total *= 0.75;
    }
    return Math.max(0, total);
  }, [selections, isOfferActive]);


  // Firestore session update effect
  useEffect(() => {
    if (sessionId && sessionInitialized) {
      const updateFirestoreSession = async () => {
        try {
          const sessionRef = doc(db, "quoteSessions", sessionId);
          await setDoc(sessionRef, {
            currentStep: currentStep,
            sector: selections.sector || null,
            businessType: selections.businessType || null,
            webType: selections.type || null,
            addons: selections.addons || [],
            estimatedPrice: calculateTotalPrice,
            updatedAt: serverTimestamp(),
          } as Partial<QuoteSession>, { merge: true });
        } catch (error) {
          console.error("Failed to update quote session in Firestore:", error);
          try {
            handleFirestoreError(error, OperationType.WRITE, `quoteSessions/${sessionId}`);
          } catch (e) {
            // Logged the error
          }
        }
      };
      updateFirestoreSession();
    }
  }, [sessionId, sessionInitialized, selections, currentStep, calculateTotalPrice]);


  const aiAddons = ["bot_fast", "semantic_search"];
  const params = new URLSearchParams(location.search);
  const isNovaPlan = params.get("plan") === "nova";

  const basePrice = types.find((t) => t.id === selections.type)?.price || 0;

  let discountedAiAddonId: string | null = null;
  if (isNovaPlan) {
    discountedAiAddonId =
      selections.addons.find((id) => aiAddons.includes(id)) || null;
  }

  const addonsPrice = addons
    .filter((a) => selections.addons.includes(a.id) && !a.isMonthly)
    .reduce((acc, a) => {
      if (a.id === discountedAiAddonId) return acc;
      return acc + a.price;
    }, 0);
  const monthlyAddonsPrice = addons
    .filter((a) => selections.addons.includes(a.id) && a.isMonthly)
    .reduce((acc, a) => acc + a.price, 0);

  const estimatedTotal = basePrice + addonsPrice;
  const discountedTotal = isOfferActive
    ? Math.round(estimatedTotal * 0.75)
    : estimatedTotal;

  const t = (enText: string, esText: string) =>
    language === "en" ? enText : esText;

  const getTypeName = (id: string) => {
    if (!id) return t("Direct Consultation", "Consultoría Directa");
    switch (id) {
      case "landing":
        return "Landing Page";
      case "corporate":
        return t("Corporate Web", "Web Corporativa");
      case "ecommerce":
        return "E-commerce";
      default:
        return id;
    }
  };



  const getAddonName = (id: string) => {
    switch (id) {
      case "content_seo":
        return t("SEO Strategy Guide", "Guía de Estrategia SEO");
      case "bot_fast":
        return t("24/7 Attendance Bot", "Bot de Atención 24/7");
      case "ai_agent":
        return t("Autonomous AI Agent", "Agente de Ventas IA");
      case "semantic_search":
        return t("Semantic AI Search", "Buscador Semántico IA");
      case "content_assistant":
        return t("Content Assistant", "Asistente de Contenido");
      case "crm_connect":
        return t("CRM Connect", "CRM Connect");
      case "copy":
        return t("Pro Copywriting", "Copywriting Profesional");
      case "multilingual":
        return t("Multilingual Website", "Sitio Web Multilingüe");
      case "branding":
        return t("Basic Branding Kit", "Kit de Branding Básico");
      case "hosting":
        return t("Premium Maintenance & Support", "Mantenimiento y Soporte Premium");
      default:
        if (!id) return "";
        return id
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");
    }
  };

  const domainSummaryText =
    domainStatus && domainStatus.available
      ? `${domainStatus.domain} (Included)`
      : t("Standard Included ($15 default credit)", "Estándar Incluido ($15 crédito por defecto)");

  const getSectorName = (id: string) => {
    switch (id) {
      case "food": return t("Food & Beverages", "Alimentación & Bebidas");
      case "health": return t("Health, Beauty & Wellness", "Salud, Belleza & Bienestar");
      case "retail": return t("Fashion & Retail", "Moda & Retail");
      case "services": return t("Professional Services", "Servicios Profesionales");
      case "realestate": return t("Real Estate", "Inmobiliario");
      case "education": return t("Education & Training", "Educación & Capacitación");
      case "tourism": return t("Tourism, Events & Hospitality", "Turismo, Eventos & Hospitalidad");
      case "tech": return t("Technology & Agencies", "Tecnología & Agencias");
      case "other": return t("Other", "Otro");
      default: return id ? (id.charAt(0).toUpperCase() + id.slice(1)) : "";
    }
  };

  const getBadgeAndExplanation = (typeId: string, sector: string) => {
    const rec = sectorRecommendations[sector] || { primary: "corporate", secondary: null };
    const isPr = typeId === rec.primary;
    const isSec = typeId === rec.secondary;

    let badge = null;
    let explanation = null;

    if (isPr) {
      badge = (
        <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)]">
          <T en="Recommended for your business">Recomendado para tu negocio</T>
        </span>
      );
    } else {
      badge = (
        <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]">
          <T en="Also available">También disponible</T>
        </span>
      );
    }

    if (sector === "food") {
      if (typeId === "corporate") {
        explanation = (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2 italic">
            <T en="Ideal if you have multiple services and want a complete online presence.">
              Ideal si tienes múltiples servicios y quieres una presencia completa online.
            </T>
          </p>
        );
      } else if (typeId === "landing") {
        explanation = (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2 italic">
            <T en="Ideal to capture clients for a specific product or promotion.">
              Ideal para captar clientes para un producto o promoción específica.
            </T>
          </p>
        );
      }
    } else if (sector === "tourism") {
      if (typeId === "corporate") {
        explanation = (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2 italic">
            <T en="Ideal if you offer multiple services and want a complete online presence.">
              Ideal si ofreces múltiples servicios y quieres una presencia completa online.
            </T>
          </p>
        );
      } else if (typeId === "landing") {
        explanation = (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2 italic">
            <T en="Ideal to capture clients for a specific service or season.">
              Ideal para captar clientes para un servicio específico o una temporada.
            </T>
          </p>
        );
      }
    } else if (sector === "tech") {
      if (typeId === "corporate") {
        explanation = (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2 italic">
            <T en="Ideal if you have a service portfolio and want to position yourself as a brand.">
              Ideal si tienes un portafolio de servicios y quieres posicionarte como marca.
            </T>
          </p>
        );
      } else if (typeId === "landing") {
        explanation = (
          <p className="text-xs text-[var(--color-text-tertiary)] mt-2 italic">
            <T en="Ideal to launch a specific product and validate the market fast.">
              Ideal para lanzar un producto puntual y validar el mercado rápido.
            </T>
          </p>
        );
      }
    }

    // Dynamic dynamic fallback or enhancement for all sectors/businesses
    let bizNameEn = "";
    let bizNameEs = "";
    const secData = sectors.find((s) => s.id === sector);
    const selectedBus = selections.businessType;

    if (selectedBus) {
      if (secData) {
        const esIndex = secData.businesses.es.indexOf(selectedBus);
        const enIndex = secData.businesses.en.indexOf(selectedBus);
        let idx = -1;
        if (esIndex !== -1) idx = esIndex;
        else if (enIndex !== -1) idx = enIndex;

        if (idx !== -1) {
          bizNameEn = secData.businesses.en[idx].toLowerCase();
          bizNameEs = secData.businesses.es[idx].toLowerCase();
        } else {
          bizNameEn = selectedBus.toLowerCase();
          bizNameEs = selectedBus.toLowerCase();
        }
      } else {
        bizNameEn = selectedBus.toLowerCase();
        bizNameEs = selectedBus.toLowerCase();
      }
    }

    const isOtherBiz = bizNameEs === "otro" || bizNameEn === "other" || !selectedBus;

    let sectorEn = "your industry";
    let sectorEs = "tu sector de negocio";
    if (sector === "food") { sectorEn = "food & beverage"; sectorEs = "alimentación y bebidas"; }
    else if (sector === "health") { sectorEn = "health & wellness"; sectorEs = "salud y bienestar"; }
    else if (sector === "retail") { sectorEn = "retail & fashion"; sectorEs = "moda y tienda física"; }
    else if (sector === "services") { sectorEn = "professional services"; sectorEs = "servicios profesionales"; }
    else if (sector === "realestate") { sectorEn = "real estate"; sectorEs = "bienes raíces"; }
    else if (sector === "education") { sectorEn = "education & training"; sectorEs = "educación y capacitación"; }
    else if (sector === "tourism") { sectorEn = "tourism & hospitality"; sectorEs = "turismo y eventos"; }
    else if (sector === "tech") { sectorEn = "technology"; sectorEs = "tecnología"; }

    const businessExplanations: Record<string, {
      landing: { es: string; en: string };
      corporate: { es: string; en: string };
      ecommerce: { es: string; en: string };
    }> = {
      // ALIMENTACIÓN & BEBIDAS
      "Restaurante": {
        landing: {
          es: "Muestra tu menú, horarios y ubicación en una página rápida que aparece en Google Maps cuando alguien busca dónde comer cerca.",
          en: "Showcase your menu, hours and location on a fast page that shows up on Google Maps when someone searches where to eat nearby."
        },
        corporate: {
          es: "Presenta tu historia, menú completo, galería de platos y formulario de reservas — todo lo que necesita un cliente antes de decidir dónde cenar.",
          en: "Present your story, full menu, dish gallery and reservation form — everything a client needs before deciding where to dine."
        },
        ecommerce: {
          es: "Vende combos, cajas de regalo o servicios de catering online con pago inmediato — sin llamadas, sin intermediarios.",
          en: "Sell combos, gift boxes or catering services online with instant payment — no calls, no middlemen."
        }
      },
      "Heladería": {
        landing: {
          es: "Captura pedidos de temporada, lanza sabores nuevos y promociones especiales — una página enfocada convierte mejor que un menú de navegación complejo.",
          en: "Capture seasonal orders, launch new flavors and special promos — a focused page converts better than complex navigation."
        },
        corporate: {
          es: "Muestra tus sabores, sucursales, historia de marca y eventos especiales. Ideal si tienes más de una ubicación o línea de productos.",
          en: "Showcase your flavors, locations, brand story and special events. Ideal if you have more than one location or product line."
        },
        ecommerce: {
          es: "Vende tortas personalizadas, pedidos anticipados y paquetes de eventos directamente desde tu web con pago en línea.",
          en: "Sell custom cakes, pre-orders and event packages directly from your website with online payment."
        }
      },
      "Cafetería": {
        landing: {
          es: "Una página limpia con tu menú, horarios y ubicación exacta — perfecta para captar clientes que buscan 'cafetería cerca de mí' en Google.",
          en: "A clean page with your menu, hours and exact location — perfect for capturing clients searching 'coffee shop near me' on Google."
        },
        corporate: {
          es: "Presenta tu carta completa, galería de ambiente, opciones de trabajo remoto y eventos culturales — construye comunidad alrededor de tu espacio.",
          en: "Present your full menu, ambiance gallery, remote work options and cultural events — build community around your space."
        },
        ecommerce: {
          es: "Vende suscripciones de café, merchandise o paquetes de catering para oficinas directamente online.",
          en: "Sell coffee subscriptions, merchandise or office catering packages directly online."
        }
      },
      "Panadería": {
        landing: {
          es: "Muestra tus productos estrella y recibe pedidos anticipados para fechas especiales — sin perder ventas por no tener presencia online.",
          en: "Showcase your star products and receive pre-orders for special dates — without losing sales from having no online presence."
        },
        corporate: {
          es: "Presenta tu historia artesanal, catálogo completo, opciones de entrega y pedidos para eventos — genera confianza antes de la primera compra.",
          en: "Present your artisan story, full catalog, delivery options and event orders — build trust before the first purchase."
        },
        ecommerce: {
          es: "Recibe pedidos con pago adelantado para bodas, cumpleaños y eventos corporativos — automatiza tu proceso de ventas especiales.",
          en: "Receive pre-paid orders for weddings, birthdays and corporate events — automate your special sales process."
        }
      },
      "Bar / Lounge": {
        landing: {
          es: "Captura reservas de mesas, promociona eventos nocturnos y muestra tu ambiente — todo en una página que carga en segundos.",
          en: "Capture table reservations, promote night events and show your vibe — all on a page that loads in seconds."
        },
        corporate: {
          es: "Presenta tu carta de bebidas, galería de eventos pasados, política de reservas y calendario de actividades para fidelizar clientes.",
          en: "Present your drinks menu, past event gallery, reservation policy and activity calendar to build client loyalty."
        },
        ecommerce: {
          es: "Vende entradas para eventos, experiencias VIP y botellas reservadas online antes de que se agoten.",
          en: "Sell event tickets, VIP experiences and reserved bottles online before they sell out."
        }
      },
      "Catering": {
        landing: {
          es: "Una landing enfocada en captar leads de eventos — formulario de cotización, galería de montajes y testimonios que cierran contratos.",
          en: "A landing focused on capturing event leads — quote form, setup gallery and testimonials that close contracts."
        },
        corporate: {
          es: "Muestra tu portafolio de eventos, menús por tipo de servicio, equipo profesional y proceso de contratación paso a paso.",
          en: "Showcase your event portfolio, menus by service type, professional team and step-by-step hiring process."
        },
        ecommerce: {
          es: "Ofrece paquetes de catering con precio fijo para empresas y eventos sociales — el cliente paga y reserva sin necesidad de llamarte.",
          en: "Offer fixed-price catering packages for companies and social events — the client pays and books without needing to call you."
        }
      },
      "Food Truck": {
        landing: {
          es: "Muestra tu ruta semanal, menú del día y redes sociales en una página que carga al instante desde el móvil mientras el cliente está en la calle.",
          en: "Show your weekly route, daily menu and social media on a page that loads instantly from mobile while the client is on the street."
        },
        corporate: {
          es: "Presenta tu concepto, historia, menú completo, calendario de ubicaciones y opciones de reserva para eventos privados.",
          en: "Present your concept, story, full menu, location calendar and private event booking options."
        },
        ecommerce: {
          es: "Vende reservas de tu food truck para eventos corporativos y fiestas privadas con pago anticipado en línea.",
          en: "Sell your food truck reservations for corporate events and private parties with advance online payment."
        }
      },
      "Repostería": {
        landing: {
          es: "Muestra tus creaciones más llamativas y recibe pedidos personalizados — una galería visual bien hecha vende sola.",
          en: "Showcase your most eye-catching creations and receive custom orders — a well-crafted visual gallery sells itself."
        },
        corporate: {
          es: "Presenta tu portafolio completo, precios por categoría, proceso de pedido y testimonios de clientes satisfechos.",
          en: "Present your full portfolio, prices by category, ordering process and satisfied client testimonials."
        },
        ecommerce: {
          es: "Recibe pedidos personalizados con pago adelantado para bodas, baby showers y eventos especiales — sin mensajes de WhatsApp interminables.",
          en: "Receive custom orders with advance payment for weddings, baby showers and special events — without endless WhatsApp messages."
        }
      },
      "Jugos & Smoothies": {
        landing: {
          es: "Muestra tu menú, beneficios de cada ingrediente y ubicación — capta clientes health-conscious que buscan opciones saludables cerca.",
          en: "Show your menu, each ingredient's benefits and location — capture health-conscious clients looking for healthy options nearby."
        },
        corporate: {
          es: "Presenta tu filosofía de alimentación saludable, menú completo, planes de detox y opciones de delivery para fidelizar clientes.",
          en: "Present your healthy eating philosophy, full menu, detox plans and delivery options to build client loyalty."
        },
        ecommerce: {
          es: "Vende planes de jugos semanales, suscripciones de batidos y paquetes detox con pago online y entrega a domicilio.",
          en: "Sell weekly juice plans, smoothie subscriptions and detox packages with online payment and home delivery."
        }
      },
      // SALUD, BELLEZA & BIENESTAR
      "Clínica": {
        landing: {
          es: "Capta pacientes nuevos con una página clara que muestra tus especialidades, médicos y formulario de citas — aparece en Google cuando buscan atención médica cerca.",
          en: "Attract new patients with a clear page showing your specialties, doctors and appointment form — appear on Google when they search for medical care nearby."
        },
        corporate: {
          es: "Presenta tu equipo médico, especialidades, tecnología disponible y proceso de atención — genera confianza antes de la primera consulta.",
          en: "Present your medical team, specialties, available technology and care process — build trust before the first consultation."
        },
        ecommerce: {
          es: "Vende consultas online, chequeos preventivos y paquetes de salud con pago anticipado — reduce las citas no atendidas.",
          en: "Sell online consultations, preventive checkups and health packages with advance payment — reduce no-show appointments."
        }
      },
      "Farmacia": {
        landing: {
          es: "Muestra tu ubicación, horario extendido y servicios especiales — captura clientes que buscan farmacia de turno cerca de ellos.",
          en: "Show your location, extended hours and special services — capture clients searching for a nearby on-duty pharmacy."
        },
        corporate: {
          es: "Presenta tu catálogo de servicios, equipo, especialidades farmacéuticas y convenios con aseguradoras para diferenciarte de las cadenas grandes.",
          en: "Present your service catalog, team, pharmaceutical specialties and insurance agreements to stand out from large chains."
        },
        ecommerce: {
          es: "Permite pedidos online de medicamentos con entrega a domicilio — reduce filas y capta clientes que prefieren comprar desde casa.",
          en: "Allow online medication orders with home delivery — reduce lines and capture clients who prefer buying from home."
        }
      },
      "Gimnasio": {
        landing: {
          es: "Capta nuevos miembros con una landing que muestra instalaciones, precios y una oferta de prueba gratuita — con formulario de registro inmediato.",
          en: "Capture new members with a landing showing facilities, prices and a free trial offer — with immediate registration form."
        },
        corporate: {
          es: "Muestra clases, entrenadores, horarios, testimonios de transformación y planes de membresía — todo lo que necesita un prospecto para inscribirse.",
          en: "Show classes, trainers, schedules, transformation testimonials and membership plans — everything a prospect needs to sign up."
        },
        ecommerce: {
          es: "Vende membresías mensuales, clases individuales y programas de entrenamiento online con pago automático recurrente.",
          en: "Sell monthly memberships, individual classes and online training programs with automatic recurring payment."
        }
      },
      "Spa / Estética": {
        landing: {
          es: "Muestra tus tratamientos estrella y captura reservas directamente — sin llamadas, sin WhatsApp, con disponibilidad en tiempo real.",
          en: "Show your star treatments and capture reservations directly — no calls, no WhatsApp, with real-time availability."
        },
        corporate: {
          es: "Presenta tu menú de servicios completo, galería de resultados, equipo de terapeutas y paquetes especiales para parejas o grupos.",
          en: "Present your full service menu, results gallery, therapist team and special packages for couples or groups."
        },
        ecommerce: {
          es: "Vende gift cards, paquetes de tratamientos y membresías de bienestar online — el regalo perfecto que se compra desde el sofá.",
          en: "Sell gift cards, treatment packages and wellness memberships online — the perfect gift bought from the couch."
        }
      },
      "Psicología": {
        landing: {
          es: "Una página profesional y empática que presenta tu especialidad y permite agendar una primera sesión — reduce la fricción del primer paso.",
          en: "A professional and empathetic page presenting your specialty and allowing a first session booking — reduces the friction of the first step."
        },
        corporate: {
          es: "Presenta tu enfoque terapéutico, especialidades, formación, modalidades de consulta presencial y online, y preguntas frecuentes.",
          en: "Present your therapeutic approach, specialties, training, in-person and online consultation modalities, and FAQs."
        },
        ecommerce: {
          es: "Vende sesiones individuales, paquetes de terapia y talleres grupales con pago anticipado — reduce cancelaciones de último momento.",
          en: "Sell individual sessions, therapy packages and group workshops with advance payment — reduce last-minute cancellations."
        }
      },
      "Nutrición": {
        landing: {
          es: "Capta clientes que buscan cambios reales — muestra tu metodología, resultados y agenda tu primera consulta directamente.",
          en: "Capture clients looking for real changes — show your methodology, results and book your first consultation directly."
        },
        corporate: {
          es: "Presenta tus planes nutricionales, especialidades, blog de recetas y testimonios de clientes — construye autoridad en tu área.",
          en: "Present your plans, specialties, recipe blog and client testimonials — build authority in your field."
        },
        ecommerce: {
          es: "Vende planes de alimentación personalizados, consultas online y guías descargables con pago directo en tu web.",
          en: "Sell personalized meal plans, online consultations and downloadable guides with direct payment on your website."
        }
      },
      "Odontología": {
        landing: {
          es: "Capta pacientes nuevos mostrando tus tratamientos principales, antes/después y un botón directo para agendar — genera confianza desde el primer clic.",
          en: "Capture new patients by showing your main treatments, before/after results and a direct booking button — build trust from the first click."
        },
        corporate: {
          es: "Presenta tu equipo, tecnología dental, especialidades, financiamiento disponible y galería de casos — diferénciate de otras clínicas.",
          en: "Present your team, dental technology, specialties, available financing and case gallery — stand out from other clinics."
        },
        ecommerce: {
          es: "Vende blanqueamientos, limpiezas y chequeos preventivos con pago anticipado — llena tu agenda sin depender solo del boca a boca.",
          en: "Sell whitening treatments, cleanings and preventive checkups with advance payment — fill your schedule without relying only on word of mouth."
        }
      },
      "Veterinaria": {
        landing: {
          es: "Una página clara con tus servicios, horarios y mapa — perfecta para captar dueños de mascotas que buscan atención veterinaria cerca.",
          en: "A clear page with your services, hours and map — perfect for capturing pet owners searching for nearby veterinary care."
        },
        corporate: {
          es: "Muestra tu equipo veterinario, especialidades, servicios de emergencia, tienda de productos y blog de cuidado animal.",
          en: "Show your veterinary team, specialties, emergency services, product store and animal care blog."
        },
        ecommerce: {
          es: "Vende consultas, vacunas, productos veterinarios y planes de salud para mascotas con pago online — expande tu negocio más allá de tu local.",
          en: "Sell consultations, vaccines, veterinary products and pet health plans with online payment — expand your business beyond your location."
        }
      },
      "Óptica": {
        landing: {
          es: "Muestra tus marcas de armazones, servicios de examen visual y ubicación — capta clientes que buscan óptica cerca antes de ir a un centro comercial.",
          en: "Show your frame brands, vision exam services and location — capture clients searching for a nearby optician before going to a mall."
        },
        corporate: {
          es: "Presenta tu catálogo completo, servicios de optometría, marcas disponibles, convenios y precios — genera confianza antes de la visita.",
          en: "Present your full catalog, optometry services, available brands, agreements and prices — build trust before the visit."
        },
        ecommerce: {
          es: "Vende armazones, lentes de contacto y soluciones de limpieza online con envío a domicilio — amplía tus ventas más allá de tu local.",
          en: "Sell frames, contact lenses and cleaning solutions online with home delivery — expand your sales beyond your location."
        }
      },
      "Centro de Yoga": {
        landing: {
          es: "Capta nuevos estudiantes con tu clase de prueba gratuita, horarios y filosofía — una página enfocada convierte curiosos en clientes comprometidos.",
          en: "Capture new students with your free trial class, schedules and philosophy — a focused page converts curious visitors into committed clients."
        },
        corporate: {
          es: "Presenta tus instructores, estilos de yoga, horarios completos, retiros y talleres especiales — construye una comunidad alrededor de tu espacio.",
          en: "Present your instructors, yoga styles, full schedules, retreats and special workshops — build a community around your space."
        },
        ecommerce: {
          es: "Vende membresías, clases sueltas, retiros y material digital como guías de meditación con pago automático recurrente.",
          en: "Sell memberships, drop-in classes, retreats and digital materials like meditation guides with automatic recurring payment."
        }
      },
      "Salón de belleza": {
        landing: {
          es: "Muestra tus servicios estrella, galería de trabajos y agenda citas directamente — sin llamadas, sin mensajes de WhatsApp que se pierden.",
          en: "Show your star services, work gallery and book appointments directly — no calls, no WhatsApp messages that get lost."
        },
        corporate: {
          es: "Presenta tu equipo de estilistas, servicios completos, galería antes/después, precios y sistema de reservas online.",
          en: "Present your stylist team, full services, before/after gallery, prices and online booking system."
        },
        ecommerce: {
          es: "Vende gift cards, paquetes de novia y productos de cuidado capilar online — genera ingresos más allá de las citas del día.",
          en: "Sell gift cards, bridal packages and hair care products online — generate revenue beyond daily appointments."
        }
      },
      "Barbería": {
        landing: {
          es: "Una página con tus cortes, precios, equipo y botón de reserva — capta clientes que buscan barbería cerca y deciden con lo que ven.",
          en: "A page with your cuts, prices, team and booking button — capture clients searching for a nearby barbershop who decide based on what they see."
        },
        corporate: {
          es: "Presenta tu identidad de marca, barberos, servicios, galería de trabajos y sistema de citas online — diferénciate de la competencia.",
          en: "Present your brand identity, barbers, services, work gallery and online appointment system — stand out from the competition."
        },
        ecommerce: {
          es: "Vende productos de cuidado de barba, gift cards y paquetes de membresía mensual con descuento online.",
          en: "Sell beard care products, gift cards and monthly membership packages with online discount."
        }
      },
      "Uñas & Manicure": {
        landing: {
          es: "Muestra tus diseños más llamativos, precios y disponibilidad — las clientas deciden con los ojos, una galería bien hecha llena tu agenda.",
          en: "Show your most eye-catching designs, prices and availability — clients decide with their eyes, a well-crafted gallery fills your schedule."
        },
        corporate: {
          es: "Presenta tu catálogo completo de servicios, galería de trabajos, precios, equipo y sistema de reservas para varios clientes simultáneos.",
          en: "Present your full service catalog, work gallery, prices, team and booking system for multiple simultaneous clients."
        },
        ecommerce: {
          es: "Vende paquetes de uñas para eventos, gift cards y kits de cuidado de uñas en casa con entrega a domicilio.",
          en: "Sell nail packages for events, gift cards and at-home nail care kits with home delivery."
        }
      },
      "Maquillaje": {
        landing: {
          es: "Una galería impactante de tus trabajos más recientes con botón de reserva directo — las novias y clientas de eventos contratan lo que ven.",
          en: "An impactful gallery of your most recent work with direct booking button — brides and event clients hire what they see."
        },
        corporate: {
          es: "Presenta tu portafolio por categorías (novias, editoriales, eventos), formación, servicios a domicilio y proceso de contratación.",
          en: "Present your portfolio by categories (brides, editorials, events), training, at-home services and hiring process."
        },
        ecommerce: {
          es: "Vende sesiones de maquillaje, talleres de automaquillaje y kits de productos seleccionados con pago directo online.",
          en: "Sell makeup sessions, self-makeup workshops and curated product kits with direct online payment."
        }
      },
      // MODA & RETAIL
      "Tienda de ropa": {
        landing: {
          es: "Una página de lanzamiento o temporada con tus piezas estrella y botón de compra inmediata — ideal para campañas y colecciones nuevas.",
          en: "A launch or seasonal page with your star pieces and immediate purchase button — ideal for campaigns and new collections."
        },
        corporate: {
          es: "Presenta tu marca, historia, colecciones, lookbook y puntos de venta — construye identidad antes de que el cliente entre a la tienda.",
          en: "Present your brand, story, collections, lookbook and sales points — build identity before the client enters the store."
        },
        ecommerce: {
          es: "Vende tu colección completa online con tallas, colores, filtros y pasarela de pago — tu tienda abierta las 24 horas.",
          en: "Sell your full collection online with sizes, colors, filters and payment gateway — your store open 24 hours."
        }
      },
      "Calzado": {
        landing: {
          es: "Lanza una colección o temporada con tus modelos más vendidos y un CTA directo de compra o visita a la tienda.",
          en: "Launch a collection or season with your best-selling models and a direct purchase or store visit CTA."
        },
        corporate: {
          es: "Presenta tu catálogo por categorías, historia de marca, puntos de venta y lookbook editorial — diferénciate de las zapatillas del mall.",
          en: "Present your catalog by categories, brand story, sales points and editorial lookbook — stand out from mall sneakers."
        },
        ecommerce: {
          es: "Vende tu catálogo completo con filtros por talla, estilo y precio — elimina la fricción entre el cliente y su próximo par.",
          en: "Sell your full catalog with filters by size, style and price — remove the friction between the client and their next pair."
        }
      },
      "Accesorios": {
        landing: {
          es: "Muestra tu colección más reciente y captura ventas inmediatas — los accesorios son compras impulsivas que una buena imagen cierra sola.",
          en: "Show your latest collection and capture immediate sales — accessories are impulse purchases that a good image closes alone."
        },
        corporate: {
          es: "Presenta tu universo de marca, colecciones, materiales y proceso artesanal — ideal si tus piezas tienen una historia que contar.",
          en: "Present your brand universe, collections, materials and artisan process — ideal if your pieces have a story to tell."
        },
        ecommerce: {
          es: "Vende bolsos, jewelry, cinturones y más con fotografías de alta calidad, variantes de color y envío nacional.",
          en: "Sell bags, jewelry, belts and more with high-quality photos, color variants and nationwide shipping."
        }
      },
      "Joyería": {
        landing: {
          es: "Una página de lujo que presenta tu colección estrella y captura solicitudes de piezas personalizadas — la joyería se vende con la emoción, no con el precio.",
          en: "A luxury page presenting your star collection and capturing custom piece requests — jewelry sells with emotion, not price."
        },
        corporate: {
          es: "Presenta tu historia artesanal, colecciones por categoría, materiales premium, proceso de personalización y galería de piezas únicas.",
          en: "Present your artisan story, collections by category, premium materials, customization process and unique pieces gallery."
        },
        ecommerce: {
          es: "Vende piezas individuales y colecciones completas online con certificaciones, variantes y envío seguro — tu joyería abierta 24/7.",
          en: "Sell individual pieces and full collections online with certifications, variants and secure shipping — your jewelry store open 24/7."
        }
      },
      "Cosmética": {
        landing: {
          es: "Lanza un producto o línea nueva con una página de conversión enfocada — ideal para campañas de marketing digital y colaboraciones con influencers.",
          en: "Launch a new product or line with a focused conversion page — ideal for digital marketing campaigns and influencer collaborations."
        },
        corporate: {
          es: "Presenta tu filosofía de marca, líneas de productos, ingredientes, proceso y valores — los consumidores de cosmética compran la historia.",
          en: "Present your brand philosophy, product lines, ingredients, process and values — cosmetics consumers buy the story."
        },
        ecommerce: {
          es: "Vende tu catálogo completo con rutinas recomendadas, reseñas de clientes y suscripciones de reabastecimiento automático.",
          en: "Sell your full catalog with recommended routines, customer reviews and automatic replenishment subscriptions."
        }
      },
      "Perfumería": {
        landing: {
          es: "Una página sensorial que presenta tu fragancia estrella con historia, notas olfativas y opción de muestra gratuita — convierte curiosos en compradores.",
          en: "A sensory page presenting your star fragrance with story, olfactory notes and free sample option — converts curious visitors into buyers."
        },
        corporate: {
          es: "Presenta tu catálogo de fragancias, historia de la marca, colecciones por familia olfativa y proceso de selección personalizada.",
          en: "Present your fragrance catalog, brand story, collections by olfactory family and personalized selection process."
        },
        ecommerce: {
          es: "Vende perfumes, sets de regalo y muestras online con descripciones sensoriales detalladas que suplen la imposibilidad de oler antes de comprar.",
          en: "Sell perfumes, gift sets and samples online with detailed sensory descriptions that compensate for the inability to smell before buying."
        }
      },
      "Ropa infantil": {
        landing: {
          es: "Presenta tu colección de temporada con fotos de niños reales usando tus prendas — los padres compran lo que imaginan en sus hijos.",
          en: "Present your seasonal collection with photos of real children wearing your garments — parents buy what they imagine on their children."
        },
        corporate: {
          es: "Muestra tus colecciones por edad, materiales seguros, proceso de confección y valores de marca — los padres investigan antes de comprar para sus hijos.",
          en: "Show your collections by age, safe materials, manufacturing process and brand values — parents research before buying for their children."
        },
        ecommerce: {
          es: "Vende tu catálogo completo con filtros por talla, edad y temporada — con políticas de cambio claras que dan confianza a los padres.",
          en: "Sell your full catalog with filters by size, age and season — with clear exchange policies that give parents confidence."
        }
      },
      "Uniformes": {
        landing: {
          es: "Capta empresas y colegios que necesitan uniformes con una página enfocada en solicitud de cotización — tu formulario es tu vendedor.",
          en: "Capture companies and schools that need uniforms with a page focused on quote requests — your form is your salesperson."
        },
        corporate: {
          es: "Presenta tus capacidades de producción, tipos de uniformes, clientes anteriores, materiales y proceso de personalización para cerrar contratos corporativos.",
          en: "Present your production capabilities, uniform types, previous clients, materials and customization process to close corporate contracts."
        },
        ecommerce: {
          es: "Permite que empresas hagan pedidos de uniformes en cantidad con personalización online — reduce el proceso de ventas de semanas a minutos.",
          en: "Allow companies to place bulk uniform orders with online customization — reduce the sales process from weeks to minutes."
        }
      },
      // SERVICIOS PROFESIONALES
      "Abogado": {
        landing: {
          es: "Una página profesional con tu especialidad, casos de éxito y formulario de consulta gratuita — los clientes contratan abogados en los que confían.",
          en: "A professional page with your specialty, success cases and free consultation form — clients hire lawyers they trust."
        },
        corporate: {
          es: "Presenta tu bufete, áreas de práctica, equipo de abogados, casos destacados y proceso de contratación — construye autoridad legal online.",
          en: "Present your firm, practice areas, lawyer team, highlighted cases and hiring process — build legal authority online."
        },
        ecommerce: {
          es: "Vende consultas iniciales, revisiones de contratos y servicios legales estandarizados con pago online — monetiza tu expertise sin llamadas.",
          en: "Sell initial consultations, contract reviews and standardized legal services with online payment — monetize your expertise without calls."
        }
      },
      "Contador": {
        landing: {
          es: "Capta clientes que buscan contador cerca con una página que muestra tus servicios, precios y formulario de contacto directo.",
          en: "Capture clients searching for a nearby accountant with a page showing your services, prices and direct contact form."
        },
        corporate: {
          es: "Presenta tus servicios contables y fiscales, equipo, software que dominas, tipos de clientes que atiendes y proceso de incorporación.",
          en: "Present your accounting and tax services, team, software you master, types of clients you serve and onboarding process."
        },
        ecommerce: {
          es: "Vende servicios contables recurrentes, declaraciones de impuestos y asesorías financieras con pago mensual automatizado.",
          en: "Sell recurring accounting services, tax returns and financial consulting with automated monthly payment."
        }
      },
      "Consultor": {
        landing: {
          es: "Una landing de autoridad con tu metodología, resultados medibles y CTA para agendar una sesión estratégica gratuita.",
          en: "An authority landing with your methodology, measurable results and CTA to book a free strategy session."
        },
        corporate: {
          es: "Presenta tu expertise, casos de éxito, metodología de trabajo, servicios y testimonios de clientes — vende tu conocimiento antes de la reunión.",
          en: "Present your expertise, success cases, work methodology, services and client testimonials — sell your knowledge before the meeting."
        },
        ecommerce: {
          es: "Vende talleres, cursos, sesiones de consultoría y documentos estratégicos descargables — escala tu impacto más allá de tu tiempo disponible.",
          en: "Sell workshops, courses, consulting sessions and downloadable strategic documents — scale your impact beyond your available time."
        }
      },
      "Arquitecto": {
        landing: {
          es: "Un portafolio visual de tus proyectos más impresionantes con formulario de consulta — los clientes contratan arquitectos por lo que han hecho.",
          en: "A visual portfolio of your most impressive projects with consultation form — clients hire architects for what they've done."
        },
        corporate: {
          es: "Presenta tu filosofía de diseño, portafolio completo por categorías, equipo, premios y proceso de trabajo — diferénciate en un mercado visual.",
          en: "Present your design philosophy, full portfolio by categories, team, awards and work process — stand out in a visual market."
        },
        ecommerce: {
          es: "Vende consultas iniciales, planos estandarizados y servicios de diseño de interiores con cotización online — captura leads calificados.",
          en: "Sell initial consultations, standardized floor plans and interior design services with online quotes — capture qualified leads."
        }
      },
      "Coach": {
        landing: {
          es: "Tu historia de transformación personal + metodología + sesión gratuita de descubrimiento — la landing más poderosa para coaches es la que conecta emocionalmente.",
          en: "Your personal transformation story + methodology + free discovery session — the most powerful landing for coaches is the one that connects emotionally."
        },
        corporate: {
          es: "Presenta tus programas, metodología, certificaciones, podcast o blog y testimonios de clientes transformados — construye una marca personal sólida.",
          en: "Present your programs, methodology, certifications, podcast or blog and transformed client testimonials — build a solid personal brand."
        },
        ecommerce: {
          es: "Vende programas de coaching grupales, cursos online, masterminds y recursos descargables — escala tus ingresos sin multiplicar tus horas.",
          en: "Sell group coaching programs, online courses, masterminds and downloadable resources — scale your income without multiplying your hours."
        }
      },
      "Agencia de marketing": {
        landing: {
          es: "Muestra tus resultados más impresionantes y captura leads listos para invertir — las agencias se venden con números reales.",
          en: "Show your most impressive results and capture leads ready to invest — agencies sell with real numbers."
        },
        corporate: {
          es: "Presenta tus servicios, casos de éxito por industria, equipo, metodología y stack de herramientas — diferénciate en un mercado saturado.",
          en: "Present your services, success cases by industry, team, methodology and tool stack — stand out in a saturated market."
        },
        ecommerce: {
          es: "Vende paquetes de servicios de marketing con precio fijo, auditorías digitales y cursos — genera ingresos predecibles más allá de los proyectos.",
          en: "Sell fixed-price marketing service packages, digital audits and courses — generate predictable revenue beyond projects."
        }
      },
      "Fotografía": {
        landing: {
          es: "Tu mejor trabajo en una galería impactante con botón directo de reserva — en fotografía, la imagen vende sola si la presentas bien.",
          en: "Your best work in an impactful gallery with direct booking button — in photography, the image sells itself if you present it well."
        },
        corporate: {
          es: "Presenta tu portafolio por categorías (bodas, corporativo, producto), paquetes, proceso y testimonios — construye confianza antes del primer contacto.",
          en: "Present your portfolio by categories (weddings, corporate, product), packages, process and testimonials — build trust before first contact."
        },
        ecommerce: {
          es: "Vende sesiones fotográficas, álbumes digitales, prints y paquetes especiales con reserva y pago online anticipado.",
          en: "Sell photography sessions, digital albums, prints and special packages with advance online booking and payment."
        }
      },
      "Diseño gráfico": {
        landing: {
          es: "Un portafolio visual que habla por sí solo con formulario de proyecto — los diseñadores que muestran bien su trabajo no necesitan convencer, solo mostrar.",
          en: "A visual portfolio that speaks for itself with project form — designers who showcase their work well don't need to convince, just show."
        },
        corporate: {
          es: "Presenta tus servicios, proceso creativo, clientes anteriores, portafolio por industria y paquetes de branding — posiciónate como experto.",
          en: "Present your services, creative process, previous clients, portfolio by industry and branding packages — position yourself as an expert."
        },
        ecommerce: {
          es: "Vende templates, recursos gráficos, paquetes de branding y sesiones de diseño con entrega digital inmediata.",
          en: "Sell templates, graphic resources, branding packages and design sessions with immediate digital delivery."
        }
      },
      "Traducción": {
        landing: {
          es: "Capta clientes corporativos con una página que muestra tus pares de idiomas, especialidades técnicas y tiempo de entrega garantizado.",
          en: "Capture corporate clients with a page showing your language pairs, technical specialties and guaranteed delivery time."
        },
        corporate: {
          es: "Presenta tus servicios por tipo (legal, médico, técnico), equipo de traductores, certificaciones y proceso de control de calidad.",
          en: "Present your services by type (legal, medical, technical), translator team, certifications and quality control process."
        },
        ecommerce: {
          es: "Vende traducciones por número de palabras, revisiones de documentos y servicios de interpretación remota con pago online inmediato.",
          en: "Sell translations by word count, document reviews and remote interpretation services with immediate online payment."
        }
      },
      "Seguridad privada": {
        landing: {
          es: "Capta empresas y residencias que necesitan seguridad con una página que transmite confianza, trayectoria y formulario de cotización rápida.",
          en: "Capture companies and residences needing security with a page that conveys trust, track record and quick quote form."
        },
        corporate: {
          es: "Presenta tus servicios de seguridad, tipos de clientes, certificaciones, equipo y tecnología de monitoreo — genera confianza institucional.",
          en: "Present your security services, client types, certifications, team and monitoring technology — build institutional trust."
        },
        ecommerce: {
          es: "Vende paquetes de monitoreo mensual, instalación de cámaras y servicios de consultoría de seguridad con contratación online.",
          en: "Sell monthly monitoring packages, camera installation and security consulting services with online contracting."
        }
      },
      // INMOBILIARIO
      "Broker / Agente": {
        landing: {
          es: "Tu diferenciador personal, propiedades destacadas y formulario de contacto directo — en inmobiliario, la confianza en el agente es la venta.",
          en: "Your personal differentiator, featured properties and direct contact form — in real estate, trust in the agent is the sale."
        },
        corporate: {
          es: "Presenta tu portafolio de propiedades, historial de ventas, área de especialización, equipo y proceso de trabajo — construye tu marca personal inmobiliaria.",
          en: "Present your property portfolio, sales history, area of specialization, team and work process — build your real estate personal brand."
        },
        ecommerce: {
          es: "Publica propiedades con filtros avanzados, tours virtuales y formulario de visita — captura leads calificados directamente en tu web.",
          en: "Publish properties with advanced filters, virtual tours and visit form — capture qualified leads directly on your website."
        }
      },
      "Constructora": {
        landing: {
          es: "Muestra tu proyecto estrella actual y captura interesados antes de que se llene — las preventas inmobiliarias se ganan online.",
          en: "Show your current star project and capture interested buyers before it fills up — real estate pre-sales are won online."
        },
        corporate: {
          es: "Presenta tu portafolio de proyectos terminados, en construcción y planificados, con especificaciones, equipo y proceso de compra.",
          en: "Present your portfolio of completed, under construction and planned projects, with specifications, team and purchasing process."
        },
        ecommerce: {
          es: "Publica apartamentos y unidades disponibles con precio, planos y formulario de reserva con depósito online — digitaliza tu proceso de preventa.",
          en: "Publish available apartments and units with price, floor plans and reservation form with online deposit — digitize your pre-sale process."
        }
      },
      "Alquiler vacacional": {
        landing: {
          es: "Una página por propiedad con galería, amenidades, disponibilidad en tiempo real y botón de reserva directa — sin comisiones de Airbnb.",
          en: "A page per property with gallery, amenities, real-time availability and direct booking button — no Airbnb commissions."
        },
        corporate: {
          es: "Presenta todas tus propiedades disponibles, reviews de huéspedes, políticas y experiencias locales — construye una marca de hospitalidad propia.",
          en: "Present all your available properties, guest reviews, policies and local experiences — build your own hospitality brand."
        },
        ecommerce: {
          es: "Sistema completo de reservas con calendario, pagos online, confirmación automática y gestión de huéspedes — tu Airbnb propio sin comisiones.",
          en: "Complete booking system with calendar, online payments, automatic confirmation and guest management — your own Airbnb without commissions."
        }
      },
      "Administración de propiedades": {
        landing: {
          es: "Capta propietarios que necesitan administrar sus inmuebles con una página que muestra tus servicios, tarifas y formulario de contacto.",
          en: "Capture property owners who need to manage their real estate with a page showing your services, rates and contact form."
        },
        corporate: {
          es: "Presenta tus servicios de administración, portafolio de propiedades gestionadas, equipo, tecnología y reportes mensuales que ofreces.",
          en: "Present your management services, managed properties portfolio, team, technology and monthly reports you provide."
        },
        ecommerce: {
          es: "Vende planes de administración de propiedades con precio mensual fijo y contratación online — escala tu cartera sin escalar tu equipo.",
          en: "Sell property management plans with fixed monthly price and online contracting — scale your portfolio without scaling your team."
        }
      },
      "Tasación": {
        landing: {
          es: "Capta propietarios que necesitan conocer el valor de su propiedad con una página clara de servicios y formulario de solicitud inmediata.",
          en: "Capture property owners who need to know their property value with a clear services page and immediate request form."
        },
        corporate: {
          es: "Presenta tus credenciales, tipos de tasaciones, metodología, clientes que sirves y proceso de entrega de informes.",
          en: "Present your credentials, types of appraisals, methodology, clients you serve and report delivery process."
        },
        ecommerce: {
          es: "Vende informes de tasación por tipo de propiedad con pago online y entrega digital — elimina el proceso manual de cotización.",
          en: "Sell appraisal reports by property type with online payment and digital delivery — eliminate the manual quoting process."
        }
      },
      // EDUCACIÓN & CAPACITACIÓN
      "Academia de idiomas": {
        landing: {
          es: "Capta estudiantes con una clase de prueba gratuita y muestra tus niveles, horarios y metodología — la decisión de aprender un idioma empieza online.",
          en: "Capture students with a free trial class and show your levels, schedules and methodology — the decision to learn a language starts online."
        },
        corporate: {
          es: "Presenta tus idiomas disponibles, profesores nativos, metodología, horarios, precios y testimonios de alumnos — construye confianza académica.",
          en: "Present your available languages, native teachers, methodology, schedules, prices and student testimonials — build academic trust."
        },
        ecommerce: {
          es: "Vende cursos por nivel, suscripciones mensuales de clases y material didáctico descargable con matrícula online inmediata.",
          en: "Sell courses by level, monthly class subscriptions and downloadable teaching materials with immediate online enrollment."
        }
      },
      "Tutor": {
        landing: {
          es: "Tu especialidad, metodología y disponibilidad en una página que captura solicitudes de clases directamente — sin intermediarios.",
          en: "Your specialty, methodology and availability on a page that captures class requests directly — no middlemen."
        },
        corporate: {
          es: "Presenta tus áreas de tutoría, niveles que atiendes, metodología, historial académico y testimonios de estudiantes y padres.",
          en: "Present your tutoring areas, levels you serve, methodology, academic background and student and parent testimonials."
        },
        ecommerce: {
          es: "Vende paquetes de clases, sesiones individuales y materiales de estudio con pago online — llena tu agenda sin llamadas.",
          en: "Sell class packages, individual sessions and study materials with online payment — fill your schedule without calls."
        }
      },
      "Escuela": {
        landing: {
          es: "Capta familias en proceso de matrícula con una página que muestra tu propuesta educativa, instalaciones y formulario de inscripción.",
          en: "Capture families in enrollment process with a page showing your educational proposal, facilities and registration form."
        },
        corporate: {
          es: "Presenta tu modelo educativo, niveles académicos, actividades extracurriculares, cuerpo docente, instalaciones y proceso de admisión.",
          en: "Present your educational model, academic levels, extracurricular activities, teaching staff, facilities and admission process."
        },
        ecommerce: {
          es: "Permite pagos de matrícula, mensualidades y actividades extracurriculares online — reduce filas y simplifica la gestión de cobros.",
          en: "Allow online tuition, monthly fee and extracurricular activity payments — reduce lines and simplify collection management."
        }
      },
      "Curso online": {
        landing: {
          es: "Una landing de lanzamiento con módulos, bonos, testimonios y precio con urgencia — el 80% de la venta de cursos online ocurre en la landing.",
          en: "A launch landing with modules, bonuses, testimonials and urgency pricing — 80% of online course sales happen on the landing."
        },
        corporate: {
          es: "Presenta tu catálogo completo de cursos, metodología de enseñanza, instructor, comunidad de alumnos y resultados obtenidos.",
          en: "Present your full course catalog, teaching methodology, instructor, student community and results achieved."
        },
        ecommerce: {
          es: "Vende acceso a cursos, bundles de programas y membresías de comunidad con pago inmediato y entrega automática del contenido.",
          en: "Sell course access, program bundles and community memberships with immediate payment and automatic content delivery."
        }
      },
      "Guardería": {
        landing: {
          es: "Capta padres que buscan guardería cerca con una página que transmite seguridad, calidez y formulario de visita directa.",
          en: "Capture parents searching for a nearby daycare with a page that conveys safety, warmth and direct visit form."
        },
        corporate: {
          es: "Presenta tu filosofía de cuidado, instalaciones, equipo educativo, horarios, tarifas y actividades diarias — los padres necesitan confiar antes de dejar a sus hijos.",
          en: "Present your care philosophy, facilities, educational team, schedules, rates and daily activities — parents need to trust before leaving their children."
        },
        ecommerce: {
          es: "Permite pagos de mensualidad y actividades online con facturación automática — simplifica la gestión administrativa de tu guardería.",
          en: "Allow monthly fee and activity payments online with automatic billing — simplify your daycare's administrative management."
        }
      },
      "Centro de capacitación": {
        landing: {
          es: "Capta empresas que necesitan capacitar a sus equipos con una página enfocada en ROI, temas disponibles y solicitud de propuesta.",
          en: "Capture companies needing to train their teams with a page focused on ROI, available topics and proposal request."
        },
        corporate: {
          es: "Presenta tu catálogo de programas, modalidades (presencial, virtual, mixta), instructores certificados, clientes corporativos y metodología.",
          en: "Present your program catalog, modalities (in-person, virtual, blended), certified instructors, corporate clients and methodology."
        },
        ecommerce: {
          es: "Vende talleres públicos, cursos abiertos y certificaciones online con inscripción y pago inmediato — llena tus grupos sin llamadas de ventas.",
          en: "Sell public workshops, open courses and online certifications with immediate registration and payment — fill your groups without sales calls."
        }
      },
      "Música & Arte": {
        landing: {
          es: "Una página que muestra tu talento con muestras de trabajo y captura inscripciones para clases — el arte se vende con lo que se ve y escucha.",
          en: "A page showcasing your talent with work samples and capturing class registrations — art sells with what is seen and heard."
        },
        corporate: {
          es: "Presenta tus programas por instrumento o disciplina, profesores, metodología, galería de presentaciones y sistema de inscripciones.",
          en: "Present your programs by instrument or discipline, teachers, methodology, performance gallery and enrollment system."
        },
        ecommerce: {
          es: "Vende clases individuales, paquetes mensuales y materiales didácticos online — escala tu enseñanza más allá de tu espacio físico.",
          en: "Sell individual classes, monthly packages and teaching materials online — scale your teaching beyond your physical space."
        }
      },
      // TURISMO, EVENTOS & HOSPITALIDAD
      "Hotel": {
        landing: {
          es: "Una página de reserva directa con galería, tarifas y disponibilidad en tiempo real — cada reserva directa que capturas elimina la comisión de Booking.com.",
          en: "A direct booking page with gallery, rates and real-time availability — every direct booking you capture eliminates the Booking.com commission."
        },
        corporate: {
          es: "Presenta todas tus habitaciones, amenidades, restaurante, eventos disponibles, ubicación y sistema de reservas — tu alternativa a depender de OTAs.",
          en: "Present all your rooms, amenities, restaurant, available events, location and booking system — your alternative to depending on OTAs."
        },
        ecommerce: {
          es: "Sistema completo de reservas con calendario, pago online, confirmación automática y gestión de habitaciones — elimina la comisión de intermediarios.",
          en: "Complete booking system with calendar, online payment, automatic confirmation and room management — eliminate intermediary commissions."
        }
      },
      "Hostal": {
        landing: {
          es: "Muestra tu ambiente único, precios competitivos y ubicación estratégica — los viajeros independientes deciden rápido si la foto y el precio convencen.",
          en: "Show your unique vibe, competitive prices and strategic location — independent travelers decide fast if the photo and price convince."
        },
        corporate: {
          es: "Presenta tus habitaciones, áreas comunes, actividades, reviews de huéspedes y sistema de reservas — compite con las grandes cadenas con autenticidad.",
          en: "Present your rooms, common areas, activities, guest reviews and booking system — compete with large chains through authenticity."
        },
        ecommerce: {
          es: "Reservas directas con pago online, paquetes de experiencias locales y tours incluidos — elimina las comisiones de Hostelworld o Booking.",
          en: "Direct bookings with online payment, local experience packages and included tours — eliminate Hostelworld or Booking commissions."
        }
      },
      "Tour operador": {
        landing: {
          es: "Presenta tu tour estrella con itinerario detallado, fotos reales y botón de reserva directa — los turistas deciden en minutos si el tour es visual.",
          en: "Present your star tour with detailed itinerary, real photos and direct booking button — tourists decide in minutes if the tour is visual."
        },
        corporate: {
          es: "Presenta tu catálogo completo de tours, destinos, guías, reviews y sistema de reservas con disponibilidad en tiempo real.",
          en: "Present your full tour catalog, destinations, guides, reviews and booking system with real-time availability."
        },
        ecommerce: {
          es: "Vende tours, excursiones y paquetes completos con reserva y pago online — captura turistas que investigan y compran desde su hotel.",
          en: "Sell tours, excursions and complete packages with online booking and payment — capture tourists who research and buy from their hotel."
        }
      },
      "Renta de vehículos": {
        landing: {
          es: "Muestra tu flota disponible con precios claros y formulario de reserva directa — los viajeros comparan y reservan en el mismo momento.",
          en: "Show your available fleet with clear prices and direct reservation form — travelers compare and book at the same moment."
        },
        corporate: {
          es: "Presenta tu flota completa por categoría, tarifas, condiciones, cobertura y proceso de entrega — diferénciate de las grandes cadenas con servicio personalizado.",
          en: "Present your full fleet by category, rates, conditions, coverage and delivery process — stand out from large chains with personalized service."
        },
        ecommerce: {
          es: "Reservas online con selección de fechas, vehículo y extras — pago seguro y confirmación inmediata sin esperar llamadas.",
          en: "Online bookings with date, vehicle and extras selection — secure payment and immediate confirmation without waiting for calls."
        }
      },
      "Excursiones": {
        landing: {
          es: "Una página por destino con galería impactante, itinerario y botón de reserva — los turistas en Punta Cana buscan excursiones desde su teléfono.",
          en: "A page per destination with impactful gallery, itinerary and booking button — tourists in Punta Cana search for excursions from their phones."
        },
        corporate: {
          es: "Presenta todo tu catálogo de excursiones con destinos, duración, precio, inclusiones y sistema de reservas multilingüe.",
          en: "Present your full excursion catalog with destinations, duration, price, inclusions and multilingual booking system."
        },
        ecommerce: {
          es: "Vende excursiones individuales y paquetes combinados con reserva online, pago seguro y voucher digital automático.",
          en: "Sell individual excursions and combined packages with online booking, secure payment and automatic digital voucher."
        }
      },
      "Agencia de viajes": {
        landing: {
          es: "Capta viajeros con una oferta específica de temporada — luna de miel, viaje de grupo o destino particular — con formulario de cotización directa.",
          en: "Capture travelers with a specific seasonal offer — honeymoon, group trip or particular destination — with direct quote form."
        },
        corporate: {
          es: "Presenta tus destinos, tipos de viajes, equipo de asesores, clientes satisfechos y proceso de planificación personalizada.",
          en: "Present your destinations, trip types, advisor team, satisfied clients and personalized planning process."
        },
        ecommerce: {
          es: "Vende paquetes de viaje con precio cerrado, reserva online y pago seguro — capta clientes que quieren planificar sin llamadas.",
          en: "Sell closed-price travel packages with online booking and secure payment — capture clients who want to plan without calls."
        }
      },
      "DJ": {
        landing: {
          es: "Tu mix más impactante, galería de eventos y formulario de contratación directa — los DJ se contratan por lo que suenan y lo que se ve en sus eventos.",
          en: "Your most impactful mix, event gallery and direct booking form — DJs are hired for how they sound and what is seen at their events."
        },
        corporate: {
          es: "Presenta tu catálogo de géneros, equipamiento, eventos pasados, rider técnico y paquetes disponibles — profesionaliza tu imagen como artista.",
          en: "Present your genre catalog, equipment, past events, technical rider and available packages — professionalize your artist image."
        },
        ecommerce: {
          es: "Vende paquetes de DJ para bodas, cumpleaños y eventos corporativos con cotización online y anticipo para reservar fecha.",
          en: "Sell DJ packages for weddings, birthdays and corporate events with online quote and advance payment to book the date."
        }
      },
      "Fotografía de eventos": {
        landing: {
          es: "Tu mejor trabajo de bodas o eventos en una galería que enamora — con botón de reserva directa para la fecha disponible más próxima.",
          en: "Your best wedding or event work in a gallery that captivates — with direct booking button for the nearest available date."
        },
        corporate: {
          es: "Presenta tu portafolio por tipo de evento, paquetes con y sin álbum, proceso de trabajo y política de entrega de fotos.",
          en: "Present your portfolio by event type, packages with and without album, work process and photo delivery policy."
        },
        ecommerce: {
          es: "Vende paquetes fotográficos con reserva de fecha y anticipo online — llena tu agenda con meses de anticipación sin gestión manual.",
          en: "Sell photography packages with date reservation and online advance payment — fill your schedule months ahead without manual management."
        }
      },
      "Decoración": {
        landing: {
          es: "Una galería de tus montajes más impresionantes con formulario de cotización directa — en decoración, la foto lo es todo.",
          en: "A gallery of your most impressive setups with direct quote form — in decoration, the photo is everything."
        },
        corporate: {
          es: "Presenta tu portafolio por tipo de evento, equipo, proveedores aliados, proceso y testimonios — construye confianza para los momentos más importantes.",
          en: "Present your portfolio by event type, team, allied suppliers, process and testimonials — build trust for the most important moments."
        },
        ecommerce: {
          es: "Vende paquetes de decoración por tipo de evento con cotización base online y anticipo para reservar tu fecha.",
          en: "Sell decoration packages by event type with base online quote and advance payment to reserve your date."
        }
      },
      "Animación infantil": {
        landing: {
          es: "Fotos de niños felices, personajes disponibles y botón de reserva directa — los padres contratan animadores en minutos si lo que ven les da confianza.",
          en: "Photos of happy children, available characters and direct booking button — parents hire entertainers in minutes if what they see builds trust."
        },
        corporate: {
          es: "Presenta tus personajes, servicios completos, paquetes por duración, galería de eventos y testimonios de padres satisfechos.",
          en: "Present your characters, full services, packages by duration, event gallery and satisfied parent testimonials."
        },
        ecommerce: {
          es: "Vende paquetes de animación con precio fijo por duración, reserva online y anticipo para confirmar la fecha del cumpleaños.",
          en: "Sell entertainment packages with fixed price by duration, online booking and advance to confirm the birthday date."
        }
      },
      "Salón de fiestas": {
        landing: {
          es: "Muestra tus espacios, capacidad, amenidades y disponibilidad — capta reservas de cumpleaños, bodas y eventos corporativos directamente.",
          en: "Show your spaces, capacity, amenities and availability — capture birthday, wedding and corporate event bookings directly."
        },
        corporate: {
          es: "Presenta todos tus salones, paquetes de catering incluido, servicios adicionales, galería de eventos pasados y proceso de reserva.",
          en: "Present all your halls, included catering packages, additional services, past event gallery and reservation process."
        },
        ecommerce: {
          es: "Sistema de reservas con selección de fecha, salón y extras — anticipo online para confirmar y reducir cancelaciones de último momento.",
          en: "Booking system with date, hall and extras selection — online advance to confirm and reduce last-minute cancellations."
        }
      },
      "Producción audiovisual": {
        landing: {
          es: "Tu reel más impactante con los primeros 30 segundos que cautivan — y formulario de proyecto para captar clientes corporativos.",
          en: "Your most impactful reel with the first 30 seconds that captivate — and project form to capture corporate clients."
        },
        corporate: {
          es: "Presenta tus servicios por tipo (video corporativo, publicidad, documental), equipo técnico, clientes y proceso de producción.",
          en: "Present your services by type (corporate video, advertising, documentary), technical team, clients and production process."
        },
        ecommerce: {
          es: "Vende paquetes de producción de video con precio base para YouTube, redes sociales y eventos — capta clientes con presupuesto definido.",
          en: "Sell video production packages with base price for YouTube, social media and events — capture clients with defined budgets."
        }
      },
      // TECNOLOGÍA & AGENCIAS
      "Startup": {
        landing: {
          es: "Tu propuesta de valor en una página que convierte — para validar el mercado, captar early adopters e inversores antes del lanzamiento.",
          en: "Your value proposition on a converting page — to validate the market, capture early adopters and investors before launch."
        },
        corporate: {
          es: "Presenta tu producto, equipo fundador, tracción actual, modelo de negocio y roadmap — genera confianza para clientes e inversores.",
          en: "Present your product, founding team, current traction, business model and roadmap — build trust for clients and investors."
        },
        ecommerce: {
          es: "Vende acceso anticipado, planes de suscripción y servicios adicionales online — monetiza desde el día uno sin esperar el producto final.",
          en: "Sell early access, subscription plans and additional services online — monetize from day one without waiting for the final product."
        }
      },
      "SaaS": {
        landing: {
          es: "La landing más importante de tu empresa — debe comunicar el valor en 5 segundos, mostrar el producto y convertir visitantes en trials.",
          en: "The most important page of your company — must communicate value in 5 seconds, show the product and convert visitors into trials."
        },
        corporate: {
          es: "Presenta todas tus funcionalidades, integraciones, planes de precio, casos de uso por industria y testimonios de clientes — tu web es tu vendedor principal.",
          en: "Present all your features, integrations, pricing plans, use cases by industry and client testimonials — your website is your main salesperson."
        },
        ecommerce: {
          es: "Planes de suscripción con pago online, upgrades automáticos y portal de cliente — la infraestructura de monetización de tu SaaS.",
          en: "Subscription plans with online payment, automatic upgrades and client portal — the monetization infrastructure of your SaaS."
        }
      },
      "App móvil": {
        landing: {
          es: "Una landing de lanzamiento que presenta tu app, muestra las pantallas principales y captura descargas o registros anticipados.",
          en: "A launch landing presenting your app, showing the main screens and capturing downloads or early registrations."
        },
        corporate: {
          es: "Presenta todas las funciones de tu app, screenshots, reseñas de usuarios, casos de uso y botones directos a App Store y Google Play.",
          en: "Present all your app features, screenshots, user reviews, use cases and direct buttons to App Store and Google Play."
        },
        ecommerce: {
          es: "Vende suscripciones premium, funciones adicionales y acceso anticipado directamente desde tu web — sin las comisiones del 30% de las tiendas.",
          en: "Sell premium subscriptions, additional features and early access directly from your website — without the 30% commission from app stores."
        }
      },
      "Agencia digital": {
        landing: {
          es: "Muestra tus mejores resultados en números reales y captura leads listos para invertir — las agencias digitales se contratan por resultados probados.",
          en: "Show your best results in real numbers and capture leads ready to invest — digital agencies are hired for proven results."
        },
        corporate: {
          es: "Presenta tus servicios, casos de éxito por industria, equipo, metodología y stack tecnológico — diferénciate en un mercado saturado de agencias.",
          en: "Present your services, success cases by industry, team, methodology and technology stack — stand out in a market saturated with agencies."
        },
        ecommerce: {
          es: "Vende paquetes de servicios con precio fijo, auditorías digitales y cursos — genera ingresos predecibles más allá de los proyectos por proyecto.",
          en: "Sell fixed-price service packages, digital audits and courses — generate predictable revenue beyond project-by-project work."
        }
      },
      "Soporte técnico": {
        landing: {
          es: "Capta empresas que necesitan soporte IT con una página que muestra tiempos de respuesta, servicios y formulario de contacto de emergencia.",
          en: "Capture companies needing IT support with a page showing response times, services and emergency contact form."
        },
        corporate: {
          es: "Presenta tus servicios de soporte, tipos de contratos, SLA garantizados, tecnologías que dominas y clientes que atienes.",
          en: "Present your support services, contract types, guaranteed SLAs, technologies you master and clients you serve."
        },
        ecommerce: {
          es: "Vende contratos de soporte mensual, horas de consultoría y servicios de configuración con contratación y pago online.",
          en: "Sell monthly support contracts, consulting hours and configuration services with online contracting and payment."
        }
      },
      "Venta de equipos": {
        landing: {
          es: "Muestra tu producto estrella o promoción del mes con especificaciones, precio y botón de compra o cotización directa.",
          en: "Show your star product or monthly promotion with specifications, price and direct purchase or quote button."
        },
        corporate: {
          es: "Presenta tu catálogo por categoría, marcas que manejas, servicios postventa, garantías y proceso de compra corporativa.",
          en: "Present your catalog by category, brands you carry, after-sale services, warranties and corporate purchase process."
        },
        ecommerce: {
          es: "Vende tu inventario completo online con especificaciones técnicas, comparativas y envío a domicilio — tu tienda abierta 24/7.",
          en: "Sell your full inventory online with technical specifications, comparisons and home delivery — your store open 24/7."
        }
      }
    };

    // Generic fallbacks by sector when specific business not found
    const sectorFallbacks: Record<string, {
      landing: { es: string; en: string };
      corporate: { es: string; en: string };
      ecommerce: { es: string; en: string };
    }> = {
      food: {
        landing: { es: "Captura clientes con una página enfocada en tu producto o servicio principal y un CTA directo de contacto o reserva.", en: "Capture clients with a page focused on your main product or service and a direct contact or booking CTA." },
        corporate: { es: "Muestra todos tus servicios, historia, equipo y formas de contacto — una presencia completa que genera confianza antes de la primera visita.", en: "Show all your services, story, team and contact methods — a complete presence that builds trust before the first visit." },
        ecommerce: { es: "Vende tus productos o servicios online con pago inmediato y gestión automática de pedidos.", en: "Sell your products or services online with immediate payment and automatic order management." }
      },
      health: {
        landing: { es: "Capta pacientes o clientes nuevos con una página que muestra tu especialidad, equipo y formulario de cita directa.", en: "Capture new patients or clients with a page showing your specialty, team and direct appointment form." },
        corporate: { es: "Presenta tus servicios completos, equipo profesional, instalaciones y proceso de atención — genera confianza antes del primer contacto.", en: "Present your full services, professional team, facilities and care process — build trust before first contact." },
        ecommerce: { es: "Vende servicios, productos o planes de bienestar online con pago anticipado y gestión automática.", en: "Sell wellness services, products or plans online with advance payment and automatic management." }
      },
      retail: {
        landing: { es: "Lanza tu colección o producto estrella con una página de conversión directa y botón de compra inmediata.", en: "Launch your collection or star product with a direct conversion page and immediate purchase button." },
        corporate: { es: "Presenta tu marca, catálogo completo, historia y puntos de venta — construye identidad antes de que el cliente entre a tu tienda.", en: "Present your brand, full catalog, story and sales points — build identity before the client enters your store." },
        ecommerce: { es: "Vende tu catálogo completo online con filtros, variantes y pasarela de pago — tu tienda abierta las 24 horas.", en: "Sell your full catalog online with filters, variants and payment gateway — your store open 24 hours." }
      },
      services: {
        landing: { es: "Capta clientes con tu propuesta de valor principal y un formulario de contacto o cotización directa.", en: "Capture clients with your main value proposition and a direct contact or quote form." },
        corporate: { es: "Presenta tus servicios, equipo, proceso de trabajo y casos de éxito — vende tu expertise antes de la primera reunión.", en: "Present your services, team, work process and success cases — sell your expertise before the first meeting." },
        ecommerce: { es: "Vende tus servicios con precio definido y contratación online — elimina el proceso manual de cotización.", en: "Sell your services with defined price and online contracting — eliminate the manual quoting process." }
      },
      realestate: {
        landing: { es: "Muestra tu propuesta inmobiliaria principal y captura leads calificados con formulario de contacto directo.", en: "Show your main real estate proposition and capture qualified leads with direct contact form." },
        corporate: { es: "Presenta tu portafolio, equipo, áreas de especialización y proceso de trabajo — construye confianza en el sector inmobiliario.", en: "Present your portfolio, team, areas of specialization and work process — build trust in the real estate sector." },
        ecommerce: { es: "Publica propiedades o servicios con sistema de reserva y pago online — captura leads calificados directamente.", en: "Publish properties or services with online booking and payment system — capture qualified leads directly." }
      },
      education: {
        landing: { es: "Capta estudiantes con tu oferta educativa principal, una clase de prueba y formulario de inscripción directa.", en: "Capture students with your main educational offer, a trial class and direct enrollment form." },
        corporate: { es: "Presenta tus programas, metodología, equipo docente, horarios y testimonios — construye confianza académica online.", en: "Present your programs, methodology, teaching team, schedules and testimonials — build academic trust online." },
        ecommerce: { es: "Vende cursos, programas y materiales online con inscripción y pago inmediato — escala tu educación más allá del aula.", en: "Sell courses, programs and materials online with immediate enrollment and payment — scale your education beyond the classroom." }
      },
      tourism: {
        landing: { es: "Presenta tu experiencia estrella con galería visual impactante y botón de reserva directa — los turistas deciden rápido.", en: "Present your star experience with impactful visual gallery and direct booking button — tourists decide fast." },
        corporate: { es: "Muestra todo tu catálogo de servicios, experiencias, equipo, reviews y sistema de reservas con disponibilidad en tiempo real.", en: "Show your full service and experience catalog, team, reviews and booking system with real-time availability." },
        ecommerce: { es: "Vende experiencias, paquetes y servicios con reserva y pago online — capta turistas que investigan y compran desde su dispositivo.", en: "Sell experiences, packages and services with online booking and payment — capture tourists who research and buy from their device." }
      },
      tech: {
        landing: { es: "Tu propuesta de valor en una página que convierte — comunica el problema que resuelves y captura leads calificados.", en: "Your value proposition on a converting page — communicate the problem you solve and capture qualified leads." },
        corporate: { es: "Presenta tu producto o servicios, equipo, casos de uso, integraciones y prueba social — tu web es tu vendedor principal.", en: "Present your product or services, team, use cases, integrations and social proof — your website is your main salesperson." },
        ecommerce: { es: "Vende suscripciones, servicios o productos digitales online con pago automático y entrega inmediata.", en: "Sell subscriptions, services or digital products online with automatic payment and immediate delivery." }
      },
      other: {
        landing: { es: "Una página enfocada en tu propuesta de valor principal con un CTA claro — ideal para captar clientes rápidamente.", en: "A page focused on your main value proposition with a clear CTA — ideal for capturing clients quickly." },
        corporate: { es: "Una presencia digital completa que muestra todo lo que ofreces, genera confianza y facilita el contacto.", en: "A complete digital presence showing everything you offer, building trust and facilitating contact." },
        ecommerce: { es: "Vende tus productos o servicios online con pasarela de pago integrada y gestión automática.", en: "Sell your products or services online with integrated payment gateway and automatic management." }
      }
    };

    const getExplanationCopy = (busType: string) => {
      if (!busType) return null;
      if (businessExplanations[busType]) return businessExplanations[busType];

      const norm = (s: string) => s.replace(/\s+/g, "").toLowerCase();
      const targetNorm = norm(busType);

      const foundKey = Object.keys(businessExplanations).find(
        (key) => norm(key) === targetNorm
      );
      if (foundKey) {
        return businessExplanations[foundKey];
      }
      return null;
    };

    let lookupKey = selections.businessType;
    if (lookupKey && secData) {
      const enIndex = secData.businesses.en.indexOf(lookupKey);
      const esIndex = secData.businesses.es.indexOf(lookupKey);
      if (enIndex !== -1) {
        lookupKey = secData.businesses.es[enIndex];
      } else if (esIndex !== -1) {
        lookupKey = secData.businesses.es[esIndex];
      }
    }

    const specificCopy = getExplanationCopy(lookupKey);
    const fallback = sectorFallbacks[sector] || sectorFallbacks.other;
    const copy = specificCopy || fallback;

    let expEs = "";
    let expEn = "";

    if (typeId === "landing") {
      expEs = copy.landing.es;
      expEn = copy.landing.en;
    } else if (typeId === "corporate") {
      expEs = copy.corporate.es;
      expEn = copy.corporate.en;
    } else if (typeId === "ecommerce") {
      expEs = copy.ecommerce.es;
      expEn = copy.ecommerce.en;
    }

    if (expEn && expEs) {
      explanation = (
        <p className="text-xs text-[var(--color-text-tertiary)] mt-2 italic">
          <T en={expEn}>{expEs}</T>
        </p>
      );
    }

    return { badge, explanation };
  };

  const selectedSectorName = getSectorName(selections.sector);
  const selectedBusinessType = selections.businessType || t("Not specified", "No especificado");

  const quoteSummary = [
    `Sector: ${selectedSectorName} | Negocio: ${selectedBusinessType}`,
    `${t("Project Type", "Tipo de Proyecto")}: ${getTypeName(selections.type)}`,
    `${t("Target Domain name", "Nombre del dominio")}: ${domainSummaryText}`,
    `${t("Add-ons", "Servicios Extra")}: ${selections.addons.length ? selections.addons.map(getAddonName).join(", ") : t("None", "Ninguno")}`,
    `${t("Total Estimated Price", "Precio Total Estimado")}: ${estimatedTotal > 0 ? `$${isOfferActive ? discountedTotal : estimatedTotal}` : t("To be custom defined in the session", "A definir a medida en la llamada")}${monthlyAddonsPrice > 0 ? t(" + $" + monthlyAddonsPrice + "/mo", " + $" + monthlyAddonsPrice + "/mes") : ""}`,
    ``,
    t(
      "Please share anything else that will help prepare for our meeting:",
                      language === "es"
                  ? "Por favor comparte cualquier otra cosa que ayude a prepararnos para la reunión:"
                  : "Please share anything else that will help us prepare for the meeting:",
    ),
  ].join("\n");

  const handleNext = async () => {
    try {
      const nextStep = currentStep + 1;

      let emailForFirestore = selections.email;
      let nameForFirestore = selections.name;

      // If we're on the PDF step and skipping, prepare data for selections update and Firestore
      if (currentStep === 3 && nextStep === 4) {
        emailForFirestore = pdfEmail.trim();
        nameForFirestore = pdfName.trim();

        setSelections(prev => ({
          ...prev,
          email: emailForFirestore,
          name: nameForFirestore
        }));
      }

      if (nextStep === steps.length - 1) { // steps.length is 5, final step is index 4
        if (sessionId) {
          const sessionRef = doc(db, "quoteSessions", sessionId);
          const updateData: any = {
            status: "completed",
            updatedAt: serverTimestamp(),
          };
          if (emailForFirestore) {
            updateData.email = emailForFirestore;
          }
          await setDoc(sessionRef, updateData, { merge: true }).catch(console.error);
        }
      }

      if (nextStep < steps.length) {
        trackEvent("wizard_step_complete", { step: nextStep });
        setCurrentStep(nextStep);
        scrollToProgress();
      }
    } catch (error) {
      console.error("Error in handleNext:", error);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    }
    scrollToProgress();
  };

  // Cierre post-reserva — replica lo que antes hacía el callback
  // bookingSuccessful del embed de Cal.com: limpiar el progreso guardado y
  // navegar a /gracias con el resumen de lo cotizado.
  const handleBookingComplete = () => {
    trackEvent("lead_captured", { method: "wizard_booking" });
    trackEvent("wizard_step_complete", { step: 4 });
    const statePayload = {
      plan: selections.type,
      planName: getTypeName(selections.type),
      total: isOfferActive ? discountedTotal : estimatedTotal,
      isMonthly: monthlyAddonsPrice > 0 ? monthlyAddonsPrice : null,
      discountActive: isOfferActive,
      addons: selections.addons.map(getAddonName),
      domain: domainSummaryText,
    };
    localStorage.removeItem("wizardQuote_currentStep");
    localStorage.removeItem("wizardQuote_selections");
    localStorage.removeItem("polaris_addon_descriptions");
    navigate("/gracias", { state: statePayload });
  };

  // Paso 3 ("Cotización PDF") real -- escribe el lead a Firestore y dispara
  // el correo de confirmación (que incluye el link real al PDF vía
  // quote-pdf). Bug real encontrado en vivo (17 de julio): el botón "Get My
  // PDF Quote" solo simulaba el envío (`await new Promise(setTimeout(...))`,
  // sin ninguna llamada real) — nunca escribía a `wizardLeads` ni mandaba
  // ningún correo, así que ningún lead real del wizard llegaba a Meridian ni
  // recibía nada por email, aunque la UI mostrara "¡Cotización enviada con
  // éxito!". El único código que sí hacía el trabajo real (`handleSubmitLead`,
  // ligado a un formulario `showLeadCapture` que nunca se activaba en ningún
  // lado) era código muerto -- eliminado, esta función lo reemplaza.
  const handleGetPdfQuote = async () => {
    setSendingPdf(true);
    const name = pdfName.trim();
    const email = pdfEmail.trim();

    addDoc(collection(db, "wizardLeads"), {
      name,
      email,
      phone: "",
      type: selections.type,
      addons: selections.addons,
      domain: domainSummaryText || null,
      language,
      createdAt: serverTimestamp(),
    }).catch((err) => console.error("No se pudo guardar el lead en Firestore:", err));
    // Dispara el correo de confirmación con el desglose de la cotización —
    // sin bloquear el avance del wizard, si falla el lead ya quedó guardado.
    fetch("https://quote-confirmation-send-wdvfac6mgq-ue.a.run.app", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone: "",
        domain: domainSummaryText || "",
        packageId: selections.type,
        addonIds: selections.addons,
        language,
      }),
    }).catch((err) => console.error("Error triggering quote confirmation email: ", err));

    setSelections((prev) => ({ ...prev, email, name }));
    trackEvent("lead_captured", { method: "wizard_pdf_step" });
    setSendingPdf(false);
    setPdfSent(true);
  };

  const toggleAddon = (id: string) => {
    setSelections((s) => ({
      ...s,
      addons: s.addons.includes(id)
        ? s.addons.filter((a) => a !== id)
        : [...s.addons, id],
    }));
  };

  const recommendedAddonIds = sectorRecommendations[selections.sector]?.addons || [];

  const isAddonDisabled = (a: any) => {
    return !!(a.novaSpec && selections.type !== "ecommerce");
  };

  const disabledAddons = addons.filter(isAddonDisabled);

  const recommendedAddons = addons.filter((a) =>
    recommendedAddonIds.includes(a.id) && !isAddonDisabled(a)
  );

  const nonRecommendedAddons = addons.filter((a) =>
    !recommendedAddonIds.includes(a.id) && !isAddonDisabled(a)
  );

  const remainingAi = nonRecommendedAddons.filter((a) =>
    ["ai_agent", "bot_fast", "semantic_search", "content_assistant"].includes(a.id)
  );

  const remainingGrowth = nonRecommendedAddons.filter((a) =>
    ["content_seo", "crm_connect", "multilingual"].includes(a.id)
  );

  const remainingBranding = nonRecommendedAddons.filter((a) =>
    ["copy", "branding"].includes(a.id)
  );

  const remainingHosting = nonRecommendedAddons.filter((a) =>
    ["hosting"].includes(a.id)
  );

  const renderAddonCard = (a: any, isRecommended: boolean) => {
    return (
      <button
        key={a.id}
        onClick={() => toggleAddon(a.id)}
        className={`p-5 md:p-6 rounded-[var(--radius-bento)] border transition-all text-left flex flex-col justify-between group h-full ${
          selections.addons.includes(a.id)
            ? isRecommended
              ? "bg-[var(--color-primary-base)]/15 border border-[var(--color-primary-base)] shadow-md translate-y-[-1px]"
              : "bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)] shadow-sm"
            : isRecommended
              ? "bg-[var(--color-primary-base)]/[0.04] border border-[var(--color-primary-base)]/40 hover:border-[var(--color-primary-base)]/70 shadow-sm"
              : "glass-panel border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50"
        } ${isAddonDisabled(a) ? "opacity-40 pointer-events-none" : ""}`}
      >
        <div className="flex justify-between w-full gap-2 mb-4">
          <div className="flex-1">
            <div className="flex flex-col gap-1.5">
              <h3
                className={`font-bold font-display flex flex-wrap items-center gap-1.5 leading-snug ${
                  selections.addons.includes(a.id) ? "text-[var(--color-primary-base)]" : ""
                }`}
              >
                <span>{a.title}</span>
                {a.isAi && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-surface-highlight)] border border-purple-500/20 text-[10px] uppercase font-bold tracking-wider leading-none">
                    <AISparkleIcon size={10} className="text-indigo-500 animate-pulse" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-extrabold">
                      <T en="AI">IA</T>
                    </span>
                  </span>
                )}
              </h3>
              {/* @ts-ignore */}
              {a.novaSpec && (
                <div className="flex flex-wrap gap-1.5">
                  <span className="inline-flex items-center text-[8px] bg-violet-500/15 border border-violet-500/10 text-violet-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider leading-none w-fit">
                    <T en="Exclusive for E-commerce">Exclusivo para E-commerce</T>
                  </span>
                </div>
              )}
            </div>
            {!isAddonDisabled(a) && (
              addonDescLoading && Object.keys(addonDescriptions).length === 0
                ? <div className="h-3 w-3/4 rounded bg-[var(--color-border-subtle)] animate-pulse mt-1" />
                : addonDescriptions[a.id] !== undefined && addonDescriptions[a.id] !== null && addonDescriptions[a.id] !== ""
                  ? <p className="text-xs text-[var(--color-text-secondary)] mt-1">{addonDescriptions[a.id]}</p>
                  : a.desc && <p className="text-xs text-[var(--color-text-secondary)] mt-1">{a.desc}</p>
            )}
          </div>
          <div
            className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${
              selections.addons.includes(a.id)
                ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)] text-white"
                : "border-[var(--color-border-strong)] text-transparent"
            }`}
          >
            <Check size={12} />
          </div>
        </div>
        <span className="text-sm font-black text-[var(--color-text-tertiary)]">
          {a.id === discountedAiAddonId ? (
            <span className="flex items-center gap-1">
              <span className="line-through opacity-50 mr-1">
                $<AnimatedNumber value={a.price} />
              </span>
              <span className="text-emerald-500 font-bold">
                $0 <T en="(Nova Perk)">(Incluido en Nova)</T>
              </span>
            </span>
          ) : (
            <span>
              +$
              <AnimatedNumber value={a.price} />
              {a.suffix ? (
                a.suffix
              ) : a.isMonthly ? (
                <T en="/mo">/mes</T>
              ) : (
                ""
              )}
            </span>
          )}
        </span>
        {/* Social proof micro-copy on selection */}
        <AnimatePresence>
          {selections.addons.includes(a.id) && addonSocialProof[a.id] && (
            <motion.p
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: "auto", marginTop: 8 }}
              exit={{ opacity: 0, height: 0, marginTop: 0 }}
              transition={{ duration: 0.25 }}
              className="text-[11px] text-[var(--color-text-tertiary)] leading-relaxed border-t border-[var(--color-primary-base)]/20 pt-2 mt-2 overflow-hidden"
            >
              <Info
                size={11}
                className="inline mr-1.5 text-[var(--color-primary-base)] opacity-70 shrink-0"
              />
              {language === "en" ? addonSocialProof[a.id].en : addonSocialProof[a.id].es}
            </motion.p>
          )}
        </AnimatePresence>
      </button>
    );
  };

  const generateAddonDescriptions = async (businessType: string, sector: string, planType: string) => {
    if (!businessType || !sector) return;
    setAddonDescLoading(true);

    try {
      const res = await fetch("/api/generate-addon-descriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType, sector, planType })
      });

      if (!res.ok) throw new Error("API error");
      const descriptions = await res.json();

      setAddonDescriptions(descriptions);
      // Misma clave que lee el efecto de hidratación (por negocio + plan),
      // guardando el mapa de descripciones directamente para que la caché acierte.
      localStorage.setItem(
        `polaris_addon_desc_${businessType}_${planType}`,
        JSON.stringify(descriptions)
      );
    } catch {
      // Silencioso — se usan descripciones hardcodeadas
    } finally {
      setAddonDescLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-base)] relative overflow-x-hidden">
      <Navbar />

      <main className="flex-1 min-w-0 max-w-5xl mx-auto w-full px-6 pt-10 pb-24 md:pt-24 relative z-10 flex flex-col">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden -z-10 bg-transparent">
          <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-[var(--color-primary-base)]/15" style={{ filter: "blur(130px)" }} />
          <div className="absolute top-[-100px] left-1/4 w-[320px] h-[320px] rounded-full bg-indigo-500/10" style={{ filter: "blur(110px)" }} />
          <div className="absolute top-[-100px] right-1/4 w-[320px] h-[320px] rounded-full bg-cyan-700/8" style={{ filter: "blur(110px)" }} />
        </div>

        {/* Header */}
        <section className="text-center space-y-4 mb-12 relative select-none">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] block">
            <T en="Build Your Digital Presence">Construye tu Presencia Digital</T>
          </span>

          <h1 className="text-3xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter max-w-4xl mx-auto leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)] pb-4 border-b border-[var(--color-border-subtle)] w-full">
            <T
              en={
                <>
                  Interactive <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    Project Planner
                  </span>
                </>
              }
            >
              Planificador de <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                proyectos interactivo
              </span>
            </T>
          </h1>

          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
            <T en="Build your custom platform spec, evaluate costs dynamically, and lock in your session built for growth.">
              Construye las especificaciones de tu plataforma, evalúa costos dinámicamente y agenda tu sesión estratégica.
            </T>
          </p>
        </section>

        {/* Progress Bar — Thread Style */}
        <div ref={progressRef} className="mb-12">
          {/* SVG Thread Line */}
          <div className="relative h-3 mb-3">
            <svg
              className="absolute inset-0 w-full h-full"
              viewBox="0 0 100 12"
              preserveAspectRatio="none"
              fill="none"
            >
              {/* Background thread */}
              <line
                x1="0" y1="6" x2="100" y2="6"
                stroke="var(--color-border-subtle)"
                strokeWidth="2"
                strokeLinecap="round"
              />
              {/* Animated progress thread */}
              <motion.line
                x1="0" y1="6"
                x2="100" y2="6"
                stroke="var(--color-primary-base)"
                strokeWidth="2.5"
                strokeLinecap="round"
                initial={{ pathLength: 0 }}
                animate={{
                  pathLength: (currentStep + 1) / steps.length,
                }}
                transition={{
                  duration: 0.6,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
              />
            </svg>

            {/* Step dots on the thread */}
            <div className="absolute inset-0 flex items-center justify-between px-[2px]">
              {steps.map((_, idx) => {
                const isClickable = idx < currentStep;
                return (
                  <motion.button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (isClickable) {
                        setCurrentStep(idx);
                        scrollToProgress();
                      }
                    }}
                    disabled={!isClickable}
                    className={`relative z-10 p-2 -m-2 bg-transparent border-none rounded-full outline-none transition-all duration-300 focus:scale-110 flex items-center justify-center ${
                      isClickable ? "cursor-pointer hover:scale-125" : "cursor-default"
                    }`}
                    animate={{
                      scale: idx === currentStep ? 1.3 : 1,
                    }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    title={
                      isClickable
                        ? language === "es"
                          ? `Regresar al paso ${idx + 1}`
                          : `Go back to step ${idx + 1}`
                        : undefined
                    }
                  >
                    <div
                      className={`w-3 h-3 rounded-full border-2 transition-all duration-300 ${
                        idx <= currentStep
                          ? "bg-[var(--color-primary-base)] border-[var(--color-primary-base)] shadow-md shadow-[var(--color-primary-base)]/30"
                          : "bg-[var(--color-surface-base)] border-[var(--color-border-strong)]"
                      }`}
                    />
                    {idx === currentStep && (
                      <motion.div
                        className="absolute inset-0 rounded-full border-2 border-[var(--color-primary-base)]/40 pointer-events-none"
                        animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                      />
                    )}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Step label */}
          <div className="flex items-center justify-start mt-3 px-1">
            <span className="text-xs md:text-sm font-bold text-[var(--color-text-primary)]">
              <span className="text-[var(--color-primary-base)] font-extrabold">
                <T en={`Step ${currentStep + 1} of ${steps.length} — `}>
                  Paso {currentStep + 1} de {steps.length} —{" "}
                </T>
              </span>
              <span>{steps[currentStep].title}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Content */}
        <div className="flex-1 min-w-0 flex flex-col md:flex-row gap-12">
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[400px]"
                >
                  {currentStep > 0 && selections.sector && (
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[var(--color-primary-base)]/5 border border-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] text-[10px] md:text-[11px] font-bold uppercase tracking-wider rounded-lg mb-4 max-w-full">
                      <span>{getSectorName(selections.sector)}</span>
                      {selections.businessType && (
                        <>
                          <span className="opacity-40">|</span>
                          <span className="text-[var(--color-text-secondary)]">{selections.businessType}</span>
                        </>
                      )}
                    </div>
                  )}
                  {/* STEP 0: SECTOR */}
                  {currentStep === 0 && (
                    <div className="space-y-6 animate-fade-in">
                      <h2 className="text-2xl font-display font-bold">
                        <T en="What is your business sector?">
                          ¿Cuál es tu sector de negocio?
                        </T>
                      </h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sectors.map((s) => {
                          const isSelected = selections.sector === s.id;
                          return (
                            <motion.div
                              key={s.id}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{
                                duration: 0.3,
                                ease: "easeOut"
                              }}
                              whileHover={
                                !isSelected
                                  ? {
                                      y: -5,
                                      scale: 1.008,
                                      transition: { type: "spring", stiffness: 300, damping: 22 }
                                    }
                                  : undefined
                              }
                              whileTap={!isSelected ? { scale: 0.99 } : undefined}
                              onClick={() => {
                                if (!isSelected) {
                                  setExpandedSectorDone(null);
                                  setSelections((prev) => {
                                    const newSector = s.id;

                                    // Retain the previously selected addons
                                    let updatedAddons = [...prev.addons];

                                    // Guarantee hosting is included
                                    if (!updatedAddons.includes("hosting")) {
                                      updatedAddons.push("hosting");
                                    }

                                    // Do not preselect the web type automatically
                                    const newType = "";

                                    return {
                                      ...prev,
                                      sector: newSector,
                                      type: newType,
                                      addons: updatedAddons,
                                    };
                                  });
                                }
                              }}
                              className={`rounded-[var(--radius-bento)] border transition-all duration-300 ease-out text-left flex flex-col relative ${
                                isSelected
                                  ? "bg-[var(--color-primary-base)]/10 border-[var(--color-primary-base)] shadow-md col-span-full h-auto p-6"
                                  : "overflow-hidden glass-panel border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/40 hover:!bg-[var(--color-primary-base)]/[0.04] dark:hover:!bg-[var(--color-primary-base)]/[0.07] hover:shadow-lg hover:shadow-[var(--color-primary-base)]/[0.03] dark:hover:shadow-[var(--color-primary-base)]/[0.05] cursor-pointer h-auto min-h-[140px] sm:min-h-[160px] p-6 justify-between flex-row sm:flex-col"
                              }`}
                            >
                              {!isSelected ? (
                                <>
                                  <div className="flex flex-col gap-1.5 flex-1 pr-2">
                                    <span className="font-display font-black text-sm md:text-base leading-snug text-[var(--color-text-primary)]">
                                      {s.title}
                                    </span>
                                    {/* @ts-ignore */}
                                    {s.desc && (
                                      <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">
                                        {/* @ts-ignore */}
                                        {s.desc}
                                      </p>
                                    )}
                                  </div>
                                  <div className="flex items-center sm:justify-end w-auto sm:w-full mt-0 sm:mt-3 shrink-0 self-center sm:self-auto">
                                    <div className="w-5 h-5 rounded-full border border-[var(--color-border-strong)] flex items-center justify-center">
                                      {/* Empty Circle */}
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <div className="w-full">
                                  <div className="flex justify-between items-center w-full mb-5 pb-3 border-b border-[var(--color-border-subtle)]">
                                    <span className="font-display font-black text-base md:text-lg leading-snug text-[var(--color-primary-base)]">
                                      {s.title}
                                    </span>
                                    <div className="w-5 h-5 rounded-full border border-[var(--color-primary-base)] bg-[var(--color-primary-base)] text-white flex items-center justify-center">
                                      <Check size={12} />
                                    </div>
                                  </div>

                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    transition={{ duration: 0.35, ease: "easeInOut" }}
                                    onAnimationComplete={() => setExpandedSectorDone(s.id)}
                                    className={`space-y-4 w-full ${expandedSectorDone === s.id ? "overflow-visible" : "overflow-hidden"}`}
                                  >
                                    <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                                      <T en="What specific business are you?">
                                        ¿Qué tipo de negocio específico eres?
                                      </T>
                                    </h3>
                                    <div className="flex flex-wrap gap-2">
                                      {(language === "en"
                                        ? s.businesses.en
                                        : s.businesses.es
                                      ).map((b) => {
                                        const isBizSelected = selections.businessType === b;
                                        return (
                                          <button
                                            key={b}
                                            type="button"
                                            onClick={(e) => {
                                              e.stopPropagation(); // prevent re-triggering parent onClick
                                              setSelections((prev) => ({
                                                ...prev,
                                                businessType: b,
                                              }));
                                              // Auto advance after 300ms
                                              setTimeout(() => {
                                                setCurrentStep(1);
                                                scrollToProgress();
                                              }, 300);
                                            }}
                                            className={`px-4 py-2.5 rounded-full border text-xs font-bold transition-all duration-300 hover:scale-105 active:scale-95 cursor-pointer ${
                                              isBizSelected
                                                ? "bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)] shadow-sm"
                                                : "glass-panel border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)] hover:text-[var(--color-primary-base)]"
                                            }`}
                                          >
                                            {b}
                                          </button>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                </div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* STEP 1: WEB TYPE */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-fade-in">
                      <h2 className="text-2xl font-display font-bold">
                        <T en="What are you looking to build?">
                          ¿Qué buscas construir?
                        </T>
                      </h2>
                      <div className="grid gap-4">
                        {(() => {
                          const rec = sectorRecommendations[selections.sector] || { primary: "corporate", secondary: null };
                          const primary = types.find(t => t.id === rec.primary);
                          const secondary = types.find(t => t.id === rec.secondary);
                          const others = types.filter(t => t.id !== rec.primary && t.id !== rec.secondary);

                          const renderCard = (
                            type: typeof types[0],
                            variant: "primary" | "secondary" | "third"
                          ) => {
                            const isSelected = selections.type === type.id;
                            const isThird = variant === "third";
                            const isCardExpanded = expandedThirdTypes.has(type.id);
                            const isExpanded = !isThird || isCardExpanded;
                            const { explanation } = getBadgeAndExplanation(type.id, selections.sector);

                            const toggleThirdExpanded = () => {
                              setExpandedThirdTypes(prev => {
                                const next = new Set(prev);
                                if (next.has(type.id)) {
                                  next.delete(type.id);
                                } else {
                                  next.add(type.id);
                                }
                                return next;
                              });
                            };

                            return (
                              <div
                                key={type.id}
                                onClick={() => {
                                  if (isThird && !isCardExpanded) {
                                    toggleThirdExpanded();
                                    return;
                                  }
                                  setSelections(prev => {
                                    let updatedAddons = [...prev.addons];
                                    // Filter out any novaSpec addons if the new type is not ecommerce
                                    if (type.id !== "ecommerce") {
                                      const novaSpecAddons = addons.filter((a) => (a as any).novaSpec).map((a) => a.id);
                                      updatedAddons = updatedAddons.filter((addonId) => !novaSpecAddons.includes(addonId));
                                    }
                                    return {
                                      ...prev,
                                      type: type.id,
                                      addons: updatedAddons
                                    };
                                  });
                                }}
                                className={`
                                  relative p-6 pt-10 rounded-2xl border transition-all cursor-pointer text-left
                                  ${isSelected
                                    ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 shadow-md ring-1 ring-[var(--color-primary-base)]"
                                    : variant === "primary"
                                    ? "border-[var(--color-primary-base)]/50 bg-[var(--color-primary-base)]/[0.03] shadow-sm hover:bg-[var(--color-primary-base)]/[0.05]"
                                    : variant === "secondary"
                                    ? "border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/[0.01] hover:bg-[var(--color-primary-base)]/[0.03]"
                                    : "border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] hover:border-[var(--color-primary-base)]/30"
                                  }
                                `}
                              >
                                {/* Badge */}
                                {variant === "primary" && (
                                  <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)]">
                                    <T en="Recommended for your business">Recomendado para tu negocio</T>
                                  </span>
                                )}
                                {variant === "secondary" && (
                                  <span className="absolute top-2 left-2 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-[var(--color-primary-base)]/5 text-[var(--color-primary-base)]/80">
                                    <T en="Could also work">También podría funcionar</T>
                                  </span>
                                )}

                                <div className="flex justify-between items-start w-full gap-4">
                                  <div className="flex-1">
                                    <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-1.5 sm:gap-3 mb-2 w-full">
                                      <h3 className={`font-black font-display text-lg sm:text-xl leading-tight text-[var(--color-text-primary)]`}>
                                        {type.title}
                                      </h3>
                                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border shrink-0 w-fit whitespace-nowrap ${
                                        variant === "primary"
                                          ? "border-[var(--color-primary-base)]/30 text-[var(--color-primary-base)]"
                                          : "border-[var(--color-border-subtle)] text-[var(--color-text-secondary)]"
                                      }`}>
                                        <T en="from">desde</T> ${type.price}
                                      </span>
                                    </div>

                                    {/* Descripción breve: siempre visible */}
                                    <p className="mt-3 text-[var(--color-text-secondary)] text-sm">{type.desc}</p>

                                    {/* Contenido expandible (solo aplica a las cards "third") */}
                                    <div
                                      className={`grid transition-all duration-300 ease-in-out ${
                                        isExpanded ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
                                      }`}
                                    >
                                      <div className="overflow-hidden">
                                        <div className="space-y-2 pt-2">
                                          {explanation && (
                                            <div className="border-t border-[var(--color-border-subtle)]/70 my-3" />
                                          )}
                                          {explanation}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2 mt-1 shrink-0">
                                    {isThird && (
                                      <button
                                        type="button"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleThirdExpanded();
                                        }}
                                        aria-label={isCardExpanded ? translate("Contraer", "Collapse") : translate("Expandir", "Expand")}
                                        className="p-1 -m-1 rounded-full hover:bg-[var(--color-primary-base)]/10 transition-colors"
                                      >
                                        <ChevronDown
                                          size={16}
                                          className={`text-[var(--color-text-tertiary)] transition-transform duration-300 ease-in-out ${isCardExpanded ? "rotate-180" : ""}`}
                                        />
                                      </button>
                                    )}
                                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors duration-200 ${
                                      isSelected
                                        ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]"
                                        : "border-[var(--color-border-strong)]"
                                    }`}>
                                      {isSelected && <Check size={12} className="text-white" />}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          };

                          return (
                            <div className="space-y-3 w-full">
                              {primary && renderCard(primary, "primary")}
                              {secondary && renderCard(secondary, "secondary")}

                              {others.length > 0 && (
                                <>
                                  <div className="flex items-center gap-3 py-1">
                                    <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                                      <T en="Other options">Otras opciones</T>
                                    </span>
                                    <div className="flex-1 h-px bg-[var(--color-border-subtle)]" />
                                  </div>
                                  {others.map(t => renderCard(t, "third"))}
                                </>
                              )}
                            </div>
                          );
                        })()}
                      </div>

                    </div>
                  )}

                  {/* STEP 2: ADD-ONS */}
                  {currentStep === 2 && (
                    <div className="space-y-8 animate-fade-in">
                      {/* Premium Domain Checker Card */}
                      <div className="p-6 md:p-8 rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] glass-panel space-y-5 bento-glow shadow-sm hover:border-[var(--color-primary-base)]/20 transition-all duration-300 will-change-transform transition-all">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] flex items-center justify-center shrink-0 shadow-inner">
                            <GlobeSearchIcon size={28} className="opacity-90" />
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-display font-black text-[var(--color-text-primary)]">
                              <T en="Domain Search">Buscador de Dominios</T>
                            </h3>
                            <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                              <T en="All of our web plans include a standard domain up to $15 USD. Check yours here to confirm it's available.">Todos nuestros planes web incluyen un dominio estándar de hasta $15 USD. ¡Verifica aquí si el tuyo está disponible!</T>
                            </p>
                          </div>
                        </div>

                        <div className="w-full max-w-lg mt-2">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="miempresa.com"
                              aria-label={translate("Nombre de dominio a verificar", "Domain name to check")}
                              value={domainName}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDomainName(val);
                                setDomainStatus(null);
                                setDomainError('');
                                if (domainDebounceRef.current) clearTimeout(domainDebounceRef.current);
                                if (val.trim() && val.includes('.')) {
                                  domainDebounceRef.current = setTimeout(() => {
                                    checkDomainAvailability(val.trim());
                                  }, 600);
                                } else {
                                  setDomainSuggestions(
                                    ['com', 'net', 'org', 'co', 'io', 'app'].map(tld => ({
                                      domain: `${val.trim()}.${tld}`,
                                      available: true
                                    }))
                                  );
                                }
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  checkDomainAvailability();
                                }
                              }}
                              autoCapitalize="none"
                              autoCorrect="off"
                              autoComplete="off"
                              spellCheck={false}
                              inputMode="url"
                              className="glass-input w-full px-4 py-3.5 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-primary)] font-medium placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] focus:border-transparent text-base md:text-sm shadow-sm transition-all text-left"
                            />
                            {checkingDomain && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                <Loader2 size={16} className="animate-spin text-[var(--color-primary-base)]" />
                              </div>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {['com', 'net', 'org', 'co', 'io', 'app', 'dev', 'store'].map((tld) => {
                              const base = domainName.includes('.')
                                ? domainName.split('.')[0]
                                : domainName;
                              const full = `${base}.${tld}`;
                              const isActive = domainName === full;
                              return (
                                <button
                                  key={tld}
                                  onMouseDown={() => {
                                    if (!base.trim()) return;
                                    setDomainName(full);
                                    setDomainStatus(null);
                                    setDomainError('');
                                    if (domainDebounceRef.current) clearTimeout(domainDebounceRef.current);
                                    checkDomainAvailability(full);
                                  }}
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider transition-all border ${
                                    isActive
                                      ? 'bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)]'
                                      : 'bg-[var(--color-surface-base)] border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)] hover:text-[var(--color-primary-base)]'
                                  }`}
                                >
                                  .{tld}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {domainError && (
                          <div className="text-xs md:text-sm text-red-500 font-medium bg-red-500/10 p-4 rounded-xl border border-red-500/20 max-w-lg flex items-start gap-2">
                            <span>⚠</span>
                            <span>{domainError}</span>
                          </div>
                        )}

                        {domainStatus && (
                          <div className={`p-5 rounded-2xl border max-w-lg transition-all duration-300 ${
                            domainStatus.available 
                              ? "bg-emerald-500/10 border-emerald-500/20 dark:bg-emerald-400/5 dark:border-emerald-500/15" 
                              : "bg-amber-500/10 border-amber-500/20 dark:bg-amber-400/5 dark:border-amber-500/15"
                            } space-y-3`}
                          >
                            <div className="flex items-center flex-wrap gap-2 justify-between">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full ${domainStatus.available ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                                <span className="font-bold font-display text-base text-[var(--color-text-primary)]">
                                  {domainStatus.domain}
                                </span>
                              </div>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider ${
                                domainStatus.available 
                                  ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400" 
                                  : "bg-amber-500/20 text-amber-600 dark:text-amber-400"
                                }`}
                              >
                                {domainStatus.available ? (
                                  <T en="Available">Disponible</T>
                                ) : (
                                  <T en="Unavailable">No disponible</T>
                                )}
                              </span>
                            </div>

                            {domainStatus.available && (
                              <div className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed pt-1.5 border-t border-[var(--color-border-subtle)]">
                                <div className="space-y-3">
                                  <p className="text-emerald-600 dark:text-emerald-400 font-medium text-xs">
                                    <T en="This domain appears to be available. Check the exact registration price on GoDaddy.">
                                      Este dominio parece estar disponible. Consulta el precio exacto de registro en GoDaddy.
                                    </T>
                                  </p>
                                  <a
                                    href={`https://www.godaddy.com/domainsearch/find?domainToCheck=${encodeURIComponent(domainStatus.domain)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[var(--color-surface-base)] border border-emerald-500/30 hover:border-emerald-500/60 text-emerald-600 dark:text-emerald-400 font-bold text-xs transition-all hover:scale-105 active:scale-95"
                                  >
                                    <span>🌐</span>
                                    <T en="View price on GoDaddy">Ver precio en GoDaddy</T>
                                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                                  </a>
                                </div>
                              </div>
                            )}

                            {!domainStatus.available && (
                              <div className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed pt-1.5 border-t border-[var(--color-border-subtle)]">
                                <T 
                                  en="This domain is already registered. You can search for other extensions (like .net, .co, .org) or try a different branding variation.">
                                  Este dominio ya está registrado. Puedes intentar buscando otras extensiones (como .net, .org, .co) o probar una variación de tu marca.
                                </T>
                              </div>
                            )}
                          </div>
                        )}

                        {domainStatus && !domainStatus.available && domainSuggestions.length > 0 && (
                          <div className="mt-5 pt-4 border-t border-[var(--color-border-subtle)]/50">
                            <div className="flex items-center gap-1.5 mb-3">
                              <AISparkleIcon size={15} className="text-[var(--color-primary-base)] flex-shrink-0" />
                              <h4 className="font-bold text-xs uppercase tracking-widest text-[var(--color-text-secondary)]">
                                <T en="Suggested Domains">Dominios Sugeridos</T>
                              </h4>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                              {domainSuggestions.map((suggestion: {domain: string, available: boolean}) => {
                                const isSelected = domainName.trim().toLowerCase() === suggestion.domain.toLowerCase();
                                return (
                                  <button
                                    key={suggestion.domain}
                                    type="button"
                                    onClick={() => setDomainName(suggestion.domain)}
                                    className={`flex items-center gap-2 p-2 px-3 rounded-lg border transition-all duration-200 text-left cursor-pointer min-w-0 ${
                                      isSelected
                                        ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 shadow-sm"
                                        : "border-[var(--color-border-subtle)] bg-[var(--color-surface-soft)] hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-primary-base)]/50"
                                    }`}
                                  >
                                    <AISparkleIcon size={11} className="text-[var(--color-primary-base)] flex-shrink-0" />
                                    <span className={`font-medium text-xs truncate flex-1 ${
                                      isSelected ? "text-[var(--color-primary-base)] font-bold" : "text-[var(--color-text-primary)]"
                                    }`}>
                                      {suggestion.domain}
                                    </span>
                                    {suggestion.available ? (
                                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" title="Available" />
                                    ) : (
                                      <span className="w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" title="Taken" />
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Powerups Options List */}
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl md:text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
                            <T
                              en={
                                <>
                                  Want to add{" "}
                                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pr-1">
                                    superpowers
                                  </span>
                                  ?
                                </>
                              }
                            >
                              ¿Deseas agregar{" "}
                              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pr-1">
                                superpoderes
                              </span>
                              ?
                            </T>
                          </h2>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            <T en="Select from our advanced features to optimize your conversions, client management, and search engines.">Selecciona de nuestras características avanzadas para optimizar tus conversiones, gestión de clientes y motores de búsqueda.</T>
                          </p>
                        </div>
                      <div className="space-y-8">
                        {/* Recommended Addons Section */}
                        {recommendedAddons.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] mt-2 mb-1">
                              <T en="Recommended for your business">Recomendado para tu negocio</T>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {recommendedAddons.map((a) => renderAddonCard(a, true))}
                            </div>
                          </div>
                        )}

                        {/* Remaining: AI & Automation */}
                        {remainingAi.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mt-4 mb-1">
                              <T en="AI & Automation">IA y Automatización</T>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {remainingAi.map((a) => renderAddonCard(a, false))}
                            </div>
                          </div>
                        )}

                        {/* Remaining: Growth & Reach */}
                        {remainingGrowth.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mt-4 mb-1">
                              <T en="Growth & Reach">Crecimiento y Alcance</T>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {remainingGrowth.map((a) => renderAddonCard(a, false))}
                            </div>
                          </div>
                        )}

                        {/* Remaining: Brand & Content */}
                        {remainingBranding.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mt-4 mb-1">
                              <T en="Brand & Content">Marca y Contenido</T>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {remainingBranding.map((a) => renderAddonCard(a, false))}
                            </div>
                          </div>
                        )}

                        {/* Remaining: Infrastructure */}
                        {remainingHosting.length > 0 && (
                          <div className="space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mt-4 mb-1">
                              <T en="Infrastructure">Infraestructura</T>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {remainingHosting.map((a) => renderAddonCard(a, false))}
                            </div>
                          </div>
                        )}

                        {/* Disabled Addons Section */}
                        {disabledAddons.length > 0 && (
                          <div className="pt-8 mt-8 border-t border-[var(--color-border-subtle)]/50 space-y-3">
                            <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] opacity-60 mb-1">
                              <T en="Not Recommended / Unavailable">No recomendado o no disponible</T>
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {disabledAddons.map((a) => renderAddonCard(a, false))}
                            </div>
                          </div>
                        )}
                      </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: PDF QUOTE */}
                  {currentStep === 3 && (
                    <div className="space-y-6 w-full max-w-xl mx-auto animate-fade-in">
                      <div className="text-center space-y-2">
                        <h2 className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                          <T en="Save your quote details">Guarda los detalles de tu cotización</T>
                        </h2>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          <T en="Receive a PDF breakdown of your quote and recommendations by email. No commitments.">
                            Recibe un desglose detallado de tu cotización y recomendaciones por correo. Sin compromisos.
                          </T>
                        </p>
                      </div>

                      <div className="p-6 md:p-8 rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] glass-panel space-y-5 bento-glow shadow-sm">
                        {!pdfSent ? (
                          <div className="space-y-4">
                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                                <T en="Full Name (Optional)">Nombre Completo (Opcional)</T>
                              </label>
                              <input
                                type="text"
                                value={pdfName}
                                onChange={(e) => setPdfName(e.target.value)}
                                placeholder="Juan Pérez"
                                className="glass-input w-full px-4 py-3 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-base md:text-sm transition-all"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-bold uppercase tracking-wider mb-2 text-[var(--color-text-secondary)]">
                                <T en="Email Address">Correo Electrónico</T>
                              </label>
                              <input
                                type="email"
                                value={pdfEmail}
                                onChange={(e) => {
                                  setPdfEmail(e.target.value);
                                  setPdfEmailError("");
                                }}
                                placeholder="tu@correo.com"
                                className={`glass-input w-full px-4 py-3 rounded-xl border text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-base md:text-sm transition-all ${
                                  pdfEmailError ? "border-red-500/50 focus:ring-red-500/10" : "border-[var(--color-border-strong)]"
                                }`}
                              />
                              {pdfEmailError && (
                                <p className="mt-1.5 text-xs text-red-500">{pdfEmailError}</p>
                              )}
                            </div>

                            <button
                              type="button"
                              disabled={sendingPdf}
                              onClick={async () => {
                                if (!pdfEmail.trim()) {
                                  setPdfEmailError(
                                    language === "en"
                                      ? "Please enter your email address"
                                      : "Por favor, ingresa tu correo electrónico"
                                  );
                                  return;
                                }
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                if (!emailRegex.test(pdfEmail.trim())) {
                                  setPdfEmailError(
                                    language === "en"
                                      ? "Please enter a valid email address"
                                      : "Por favor, ingresa un correo electrónico válido"
                                  );
                                  return;
                                }

                                await handleGetPdfQuote();
                              }}
                              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[var(--color-primary-base)] hover:brightness-110 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-sm cursor-pointer border-none shadow-none"
                            >
                              {sendingPdf ? (
                                <>
                                  <Loader2 className="animate-spin" size={18} />
                                  <T en="Generating & Sending PDF...">Generando y enviando PDF...</T>
                                </>
                              ) : (
                                <T en="Get My PDF Quote">Obtener mi cotización PDF</T>
                              )}
                            </button>

                            <button
                              type="button"
                              onClick={handleNext}
                              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-transparent border border-[var(--color-border-subtle)] hover:border-[var(--color-border-strong)] hover:bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold rounded-xl transition-all text-sm cursor-pointer mt-2"
                            >
                              <T en="Skip & Book Call">Saltar y agendar llamada</T>
                              <ArrowRight size={16} />
                            </button>
                          </div>
                        ) : (
                          <div className="py-6 text-center space-y-4 animate-fade-in">
                            <div className="inline-flex p-3 rounded-full bg-green-500/10 text-green-500 animate-bounce">
                              <CheckCircle2 size={32} />
                            </div>
                            <div className="space-y-1">
                              <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                                <T en="Quote Sent Successfully!">¡Cotización enviada con éxito!</T>
                              </h3>
                              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-sm mx-auto">
                                <T en="Check your inbox at">Hemos enviado el PDF con el desglose detallado a</T>{" "}
                                <strong className="text-[var(--color-text-primary)]">{pdfEmail}</strong>.{" "}
                                <T en="It should arrive in a couple of minutes.">Debería llegar en un par de minutos.</T>
                              </p>
                            </div>

                            <button
                              type="button"
                              onClick={handleNext}
                              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[var(--color-primary-base)] hover:brightness-110 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-sm cursor-pointer border-none shadow-none mt-4"
                            >
                              <T en="Continue to Schedule">Continuar a la llamada</T>
                              <ArrowRight size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 4: SCHEDULE */}
                  {currentStep === 4 && (
                    <div className="space-y-6 w-full min-w-0">
                      <h2 className="text-2xl font-display font-bold">
                        <T en="Let's build it together">Vamos a construirlo</T>
                      </h2>

                      {!selections.addons.includes("hosting") && (
                        <div className="p-5 rounded-2xl bg-amber-500/5 dark:bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/35 flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-all">
                          <div className="flex gap-3 items-start">
                            <div className="p-2 ml-1 rounded-xl bg-amber-500/10 text-amber-500 flex-shrink-0 mt-0.5">
                              <Cloud size={18} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-sm font-bold text-[var(--color-text-primary)]">
                                <T en="Add maintenance and support?">¿Deseas agregar mantenimiento y soporte?</T>
                              </h4>
                              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                                <T en="Get optimized speed, automatic backups, and continuous tech support for just $30/mo. Recommended for launch.">Consigue velocidad óptima, copias de seguridad automáticas y soporte continuo por solo $30/mes. Opción recomendada para el lanzamiento.</T>
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => toggleAddon("hosting")}
                            className="md:shrink-0 py-2.5 px-5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs uppercase tracking-wider active:scale-95 transition-all text-center border-none cursor-pointer"
                          >
                            <T en="+ Add for $30/month">+ Agregar por $30/mes</T>
                          </button>
                        </div>
                      )}

                      <BookingScheduler
                        notes={quoteSummary}
                        initialName={selections.name || ""}
                        initialEmail={selections.email || ""}
                        phone={selections.phone || ""}
                        onBooked={handleBookingComplete}
                      />
                    </div>
                  )}
                </motion.div>
            </AnimatePresence>

            {/* Footer Navigation */}
              <div className="mt-8 flex items-center justify-between pt-8 border-t border-[var(--color-border-subtle)]">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleBack}
                    disabled={currentStep === 0}
                    className={`flex items-center gap-2 p-3 font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:hover:text-[var(--color-text-secondary)] transition-colors ${currentStep === 0 ? "invisible" : ""}`}
                  >
                    <ArrowLeft size={18} /> <T en="Back">Atrás</T>
                  </button>
                  <button
                    onClick={resetWizard}
                    title={language === "es" ? "Reiniciar planificador" : "Reset planner"}
                    className="w-7 h-7 rounded-full border border-red-500/20 bg-red-500/5 text-red-400/50 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 flex items-center justify-center transition-all cursor-pointer"
                  >
                    <RotateCcw size={12} />
                  </button>
                </div>
                {currentStep < 3 && (
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 0 && (!selections.sector || !selections.businessType)) ||
                      (currentStep === 1 && !selections.type)
                    }
                    className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary-base)] text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border-none ml-auto cursor-pointer"
                  >
                    <T en="Next">Siguiente</T> <ArrowRight size={18} />
                  </button>
                )}
              </div>
          </div>

          {/* Sidebar Estimator */}
            <div ref={sidebarRef} className="w-full md:w-80 h-max sticky top-24 p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)]">
            <h3 className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-6">
              <T en="Live Estimate">Estimación en vivo</T>
            </h3>

            <div className="space-y-4">
              <div className="flex justify-between items-start pb-4 border-b border-[var(--color-border-subtle)] text-sm">
                <span className="text-[var(--color-text-secondary)] pr-4">
                  Base
                </span>
                <span className="font-bold whitespace-nowrap flex-shrink-0">
                  $<AnimatedNumber value={basePrice} />
                </span>
              </div>

              {selections.addons.length > 0 && (
                <div className="flex flex-col gap-2 pb-4 border-b border-[var(--color-border-subtle)] text-sm">
                  {selections.addons.map((addonId: string) => {
                    const addon = addons.find((a) => a.id === addonId);
                    if (!addon) return null;
                    const isFree = addonId === discountedAiAddonId;
                    return (
                      <div
                        key={addonId}
                        className="flex justify-between items-start"
                      >
                        <span className="text-[var(--color-text-secondary)] pr-4">
                          {getAddonName(addonId)}
                        </span>
                        <div className="text-right">
                          {addon.isMonthly ? (
                            <div className="font-bold whitespace-nowrap text-[var(--color-text-tertiary)]">
                              +$
                              <AnimatedNumber value={addon.price} />
                              /mes
                            </div>
                          ) : isFree ? (
                            <div className="whitespace-nowrap">
                              <span className="line-through opacity-50 mr-2">
                                $<AnimatedNumber value={addon.price} />
                              </span>
                              <span className="text-emerald-500 font-bold">
                                $0 <T en="(Nova Perk)">(Incluido en Nova)</T>
                              </span>
                            </div>
                          ) : (
                            <div className="font-bold whitespace-nowrap">
                              +$
                              <AnimatedNumber value={addon.price} />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Dynamic Domain Estimate inclusion in the sidebar list */}
              {domainStatus && domainStatus.available && (
                <div className="flex flex-col gap-1 pb-4 border-b border-[var(--color-border-subtle)] text-sm">
                  <div className="flex justify-between items-start">
                    <span className="text-[var(--color-text-secondary)] pr-4">
                      <T en="Domain Registry">Registro de Dominio</T> ({domainStatus.domain})
                    </span>
                    <span className="font-bold whitespace-nowrap flex-shrink-0 text-emerald-500">
                      <T en="Free">Gratis</T>
                    </span>
                  </div>
                  <div className="text-[10px] text-emerald-500 font-bold bg-emerald-500/5 px-2 py-1 rounded inline-block w-fit mt-1">
                    <T en="100% Covered ($15 credit)">$15 USD dominio incluido</T>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6">
              <span className="block text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">
                <T en="Total Estimate">Estimado Total</T>
              </span>
              {isOfferActive && estimatedTotal > 0 && (
                <div className="flex items-baseline gap-2 opacity-60 mb-1">
                  <span className="text-xl font-display font-medium line-through">
                    $<AnimatedNumber value={estimatedTotal} />
                  </span>
                  <span className="glass-badge text-xs font-bold text-emerald-500 px-2 py-0.5 rounded uppercase">
                    -25%
                  </span>
                </div>
              )}
              <div className="flex items-baseline flex-wrap">
                <span className="text-4xl font-display font-black text-[var(--color-primary-base)]">
                  $
                  <AnimatedNumber
                    value={
                      isOfferActive && estimatedTotal > 0
                        ? discountedTotal
                        : estimatedTotal
                    }
                  />
                </span>
                {monthlyAddonsPrice > 0 && (
                  <span className="text-lg font-bold text-[var(--color-text-tertiary)] ml-2">
                    +$
                    <AnimatedNumber value={monthlyAddonsPrice} />
                    /mes
                  </span>
                )}
              </div>
              <p className="text-[10px] text-[var(--color-text-tertiary)] mt-2">
                <T en="* Final prices may vary based on exact requirements.">
                  * Los precios finales pueden variar según requisitos exactos.
                </T>
                {isOfferActive && estimatedTotal > 0 && monthlyAddonsPrice > 0 && (
                  <>
                    {" "}
                    <T en="The -25% discount applies only to the one-time payment, not to the monthly fee.">
                      El descuento del -25% aplica solo al pago único, no a la cuota mensual.
                    </T>
                  </>
                )}
              </p>
            </div>

            {selections.type && (
              <div className="mt-4 pt-4 border-t border-[var(--color-border-subtle)]">
                <span className="block text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-widest mb-1">
                  <T en="Estimated Delivery">Tiempo estimado de entrega</T>
                </span>
                <p className="text-sm font-black text-[var(--color-text-primary)]">
                  {selections.type === "landing" && <T en="1–2 weeks">1–2 semanas</T>}
                  {selections.type === "corporate" && <T en="2–4 weeks">2–4 semanas</T>}
                  {selections.type === "ecommerce" && <T en="4–6 weeks">4–6 semanas</T>}
                </p>
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                  <T en="* May vary based on complexity and feedback speed.">
                    * Puede variar según la complejidad y velocidad de feedback.
                  </T>
                </p>
              </div>
            )}

            {/* Hosting Upsell inside sidebar */}
            {!selections.addons.includes("hosting") && (
              <div className="mt-6 p-4 rounded-xl bg-amber-500/5 border border-amber-500/25 space-y-3">
                <div className="flex gap-2 items-start">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-500 flex-shrink-0 mt-0.5">
                    <Cloud size={14} />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-[var(--color-text-primary)]">
                      <T en="Recommended: Maintenance & Support">¿Deseas mantenimiento y soporte?</T>
                    </h4>
                    <p className="text-[10px] text-[var(--color-text-secondary)] leading-normal">
                      <T en="Get guaranteed speed, automatic backups, and 24/7 tech support for $30/mo.">Consigue velocidad óptima, copias de seguridad automáticas y soporte continuo por solo $30/mes.</T>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => toggleAddon("hosting")}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-500 text-white font-bold text-[10px] uppercase tracking-wider hover:bg-amber-600 active:scale-95 transition-all text-center border-none cursor-pointer"
                >
                  <T en="+ Add for $30/month">+ Agregar por $30/mes</T>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Barra sticky mobile — se oculta cuando el sidebar real es visible */}
          <AnimatePresence>
            {!sidebarVisible && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="md:hidden fixed bottom-0 left-0 right-0 z-40 rounded-t-2xl overflow-hidden shadow-2xl border border-b-0 border-[var(--color-border-subtle)] pb-safe"
              >
                {/* Drawer expandido */}
                <AnimatePresence>
                  {estimateExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeOut" }}
                      className="overflow-hidden bg-[var(--color-surface-elevated)]"
                    >
                      <div className="px-5 pt-5 pb-2 max-h-[60vh] overflow-y-auto space-y-3">
                        {/* Desglose */}
                        <div className="flex justify-between items-start text-sm pb-3 border-b border-[var(--color-border-subtle)]">
                          <span className="text-[var(--color-text-secondary)]">Base</span>
                          <span className="font-bold">${basePrice}</span>
                        </div>

                        {selections.addons.length > 0 && (
                          <div className="flex flex-col gap-2 pb-3 border-b border-[var(--color-border-subtle)]">
                            {selections.addons.map((addonId: string) => {
                              const addon = addons.find((a) => a.id === addonId);
                              if (!addon) return null;
                              const isFree = addonId === discountedAiAddonId;
                              return (
                                <div key={addonId} className="flex justify-between items-start text-sm">
                                  <span className="text-[var(--color-text-secondary)] pr-4">{getAddonName(addonId)}</span>
                                  <span className="font-bold whitespace-nowrap">
                                    {isFree ? (
                                      <span className="text-emerald-500">$0</span>
                                    ) : addon.isMonthly ? (
                                      `+$${addon.price}/mes`
                                    ) : (
                                      `+$${addon.price}`
                                    )}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                        {domainStatus?.available && (
                          <div className="flex justify-between items-start text-sm pb-3 border-b border-[var(--color-border-subtle)]">
                            <span className="text-[var(--color-text-secondary)]">
                              <T en="Domain">Dominio</T> ({domainStatus.domain})
                            </span>
                            <span className="font-bold text-emerald-500">
                              <T en="Free">Gratis</T>
                            </span>
                          </div>
                        )}
                        {selections.type && (
                          <div className="pb-2 text-xs text-[var(--color-text-tertiary)]">
                            <span className="font-bold text-[var(--color-text-primary)]">
                              <T en="Delivery">Entrega</T>:{" "}
                            </span>
                            {selections.type === "landing" && <T en="1–2 weeks">1–2 semanas</T>}
                            {selections.type === "corporate" && <T en="2–4 weeks">2–4 semanas</T>}
                            {selections.type === "ecommerce" && <T en="4–6 weeks">4–6 semanas</T>}
                          </div>
                        )}
                        {isOfferActive && estimatedTotal > 0 && monthlyAddonsPrice > 0 && (
                          <p className="text-[10px] text-[var(--color-text-tertiary)]">
                            <T en="The -25% discount applies only to the one-time payment, not to the monthly fee.">
                              El descuento del -25% aplica solo al pago único, no a la cuota mensual.
                            </T>
                          </p>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Barra compacta siempre visible */}
                <div className="w-full flex items-center gap-2 px-3 py-2.5 bg-[var(--color-surface-elevated)] border-t border-[var(--color-border-subtle)]">
                  {/* Atrás + Reiniciar */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {currentStep > 0 && (
                      <button
                        type="button"
                        onClick={handleBack}
                        title={language === "es" ? "Atrás" : "Back"}
                        className="w-8 h-8 rounded-full border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] flex items-center justify-center transition-all cursor-pointer"
                      >
                        <ArrowLeft size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={resetWizard}
                      title={language === "es" ? "Reiniciar planificador" : "Reset planner"}
                      className="w-8 h-8 rounded-full border border-red-500/20 bg-red-500/5 text-red-400/50 hover:text-red-400 hover:border-red-500/40 hover:bg-red-500/10 flex items-center justify-center transition-all cursor-pointer"
                    >
                      <RotateCcw size={12} />
                    </button>
                  </div>

                  {/* Estimado — tocable para expandir detalles */}
                  <div
                    onClick={() => setEstimateExpanded(prev => !prev)}
                    className={`flex-1 min-w-0 flex items-center gap-1.5 cursor-pointer ${currentStep === 3 ? "justify-center" : ""}`}
                  >
                    <div className={`flex flex-col min-w-0 ${currentStep === 3 ? "items-center" : "items-start"}`}>
                      <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                        <T en="Estimate">Estimado</T>
                      </span>
                      <div className="flex items-baseline gap-1 flex-wrap">
                        <span className="text-lg font-display font-black text-[var(--color-primary-base)]">
                          $<AnimatedNumber value={isOfferActive && estimatedTotal > 0 ? discountedTotal : estimatedTotal} />
                        </span>
                        {monthlyAddonsPrice > 0 && (
                          <span className="text-[10px] text-[var(--color-text-tertiary)] font-bold">
                            +$<AnimatedNumber value={monthlyAddonsPrice} />/mes
                          </span>
                        )}
                        {isOfferActive && estimatedTotal > 0 && (
                          <span className="text-[9px] bg-emerald-500/15 text-emerald-500 font-black px-1 py-0.5 rounded">
                            -25%
                          </span>
                        )}
                      </div>
                    </div>
                    <motion.div
                      animate={{ rotate: estimateExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      className="flex-shrink-0"
                    >
                      <ChevronUp size={14} className="text-[var(--color-text-tertiary)]" />
                    </motion.div>
                  </div>

                  {/* Siguiente — oculto en el paso 3 (PDF) porque ya tiene sus propios CTAs inline */}
                  {currentStep < 3 && (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={
                        (currentStep === 0 && (!selections.sector || !selections.businessType)) ||
                        (currentStep === 1 && !selections.type)
                      }
                      className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 bg-[var(--color-primary-base)] text-white rounded-xl font-bold text-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-40 disabled:hover:scale-100 border-none cursor-pointer"
                    >
                      <span className="hidden xs:inline"><T en="Next">Siguiente</T></span> <ArrowRight size={16} />
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </main>
      <Footer />
    </div>
  );
}
