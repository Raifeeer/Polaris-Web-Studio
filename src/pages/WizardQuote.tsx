import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Calendar,
  Clock,
  Loader2,
  Sparkles,
  Globe,
  Cloud,
  Info,
  MessageCircle,
  Bot,
  Search,
  PenLine,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T, useLanguage } from "../context/LanguageContext";
import { useTheme } from "../hooks/useTheme";

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

const steps = [
  { id: "type", title: <T en="Project Type">Tipo de Proyecto</T> },
  { id: "size", title: <T en="Size & Scope">Tamaño y Alcance</T> },
  { id: "addons", title: <T en="AI & Add-ons">IA y Complementos</T> },
  { id: "schedule", title: <T en="Schedule Meeting">Agendar Reunión</T> },
];

const types = [
  {
    id: "landing",
    name: "Landing Page",
    title: "Landing Page",
    price: 299,
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
    desc: (
      <T en="Online store (Includes setup of 20 products)">
        Tienda online (Incluye carga inicial de 20 productos)
      </T>
    ),
  },
];

const projectScopes: Record<
  string,
  {
    id: string;
    name: string;
    title: React.ReactNode;
    priceAdd: number;
    desc: React.ReactNode;
  }[]
> = {
  landing: [
    {
      id: "landing_basic",
      name: "Standard Layout",
      title: <T en="Standard Design">Diseño Estándar</T>,
      priceAdd: 0,
      desc: (
        <T en="Proven layout structure, fast delivery">
          Estructura probada, entrega rápida
        </T>
      ),
    },
    {
      id: "landing_pro",
      name: "Custom Design",
      title: <T en="Custom Design">Diseño a Medida</T>,
      priceAdd: 150,
      desc: (
        <T en="Highly personalized, custom animations">
          Diseño único, animaciones fluidas 3D/2D
        </T>
      ),
    },
    {
      id: "landing_enterprise",
      name: "Conversion Focused (A/B)",
      title: (
        <T en="Conversion Focused (A/B Test)">
          Enfocada en Conversión (Test A/B)
        </T>
      ),
      priceAdd: 300,
      desc: (
        <T en="2 visual variants to measure which sells more">
          Creamos 2 variantes para medir cuál vende más
        </T>
      ),
    },
  ],
  corporate: [
    {
      id: "corp_basic",
      name: "Essential",
      title: <T en="Essential (Up to 5 pages)">Esencial (Hasta 5 secc/págs)</T>,
      priceAdd: 0,
      desc: (
        <T en="e.g. Home, About Us, Services, Contact">
          Ej: Inicio, Nosotros, Servicios, Contacto
        </T>
      ),
    },
    {
      id: "corp_pro",
      name: "Professional",
      title: (
        <T en="Professional (CMS & Blog)">Profesional (Con Blog/Noticias)</T>
      ),
      priceAdd: 400,
      desc: (
        <T en="Manageable content (Includes 3 initial posts)">
          Autoadministrable (Incluye carga de 3 posts)
        </T>
      ),
    },
    {
      id: "corp_enterprise",
      name: "Enterprise",
      title: (
        <T en="Enterprise (Client Portal)">Empresarial (Portal de Clientes)</T>
      ),
      priceAdd: 900,
      desc: (
        <T en="User login, database, custom dashboard">
          Login de usuarios, base de datos y panel a medida
        </T>
      ),
    },
  ],
  ecommerce: [
    {
      id: "ecom_basic",
      name: "Starter",
      title: <T en="Starter (Standard Store)">Tienda Inicial</T>,
      priceAdd: 0,
      desc: (
        <T en="Catalog, payments, user accounts">
          Catálogo, pagos online y cuentas de cliente
        </T>
      ),
    },
    {
      id: "ecom_pro",
      name: "Growth",
      title: <T en="Growth (Advanced Store)">Crecimiento Avanzado</T>,
      priceAdd: 500,
      desc: (
        <T en="Subscriptions, abandoned cart recovery">
          Suscripciones, envíos automáticos de carritos
        </T>
      ),
    },
    {
      id: "ecom_enterprise",
      name: "Custom ERP",
      title: <T en="Custom / Integrations">A medida / Integraciones</T>,
      priceAdd: 1500,
      desc: (
        <T en="Sync with external software (ERP) or B2B">
          Conexión con tu software de inventario o B2B
        </T>
      ),
    },
  ],
};

const addons = [
  {
    id: "ai_agent",
    title: <T en="Autonomous AI Agent">Agente de Ventas IA</T>,
    price: 49,
    isMonthly: true,
    suffix: "/mes",
    desc: <T en="Smart bot with GPT-4">Bot inteligente que conversa y vende</T>,
    isAi: true,
  },
  {
    id: "bot_fast",
    title: <T en="Lead Capture Bot">Bot de Respuestas Rápidas</T>,
    price: 150,
    desc: <T en="Automated flows 24/7">Flujos automatizados 24/7</T>,
    isAi: true,
  },
  {
    id: "semantic_search",
    title: <T en="Semantic AI Search">Buscador Semántico IA</T>,
    price: 250,
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
    price: 29,
    isMonthly: true,
    suffix: "/mes",
    desc: (
      <T en="Auto-generate products and posts">Genera descripciones y posts</T>
    ),
    isAi: true,
  },
  {
    id: "crm",
    title: <T en="CRM Integration">Integración CRM</T>,
    price: 300,
    desc: <T en="Connect your sales software">Conecta tu software de ventas</T>,
  },
  {
    id: "multilingual",
    title: <T en="Multilingual Website">Sitio Web Multilingüe</T>,
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
    price: 99,
    desc: <T en="Persuasive sales texts">Textos persuasivos que venden</T>,
  },
  {
    id: "branding",
    title: <T en="Basic Branding Kit">Kit de Branding Básico</T>,
    price: 150,
    desc: (
      <T en="Logo redesign and professional color palette">
        Rediseño de logotipo y paleta de colores profesional
      </T>
    ),
  },
  {
    id: "content_seo",
    title: <T en="Content SEO Map">Mapa de Contenidos SEO</T>,
    price: 149,
    desc: (
      <T en="Keyword research + content structure for organic traffic">
        Investigación de keywords + estructura de contenido para tráfico orgánico
      </T>
    ),
  },
  {
    id: "hosting",
    title: <T en="Premium Maintenance & Support">Mantenimiento y Soporte Premium</T>,
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
  crm: {
    en: "HubSpot reports that CRM-connected businesses close deals 27% faster on average.",
    es: "HubSpot reporta que los negocios conectados a un CRM cierran ventas un 27% más rápido.",
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

function safePatchCal() {
  try {
    const Cal = (window as any).Cal;
    if (!Cal) return false;

    // If default instance exists, patch its prototype
    if (Cal.instance) {
      const proto = Object.getPrototypeOf(Cal.instance);
      if (proto && !proto.__isPatched) {
        const originalDoInIframe = proto.doInIframe;
        proto.doInIframe = function (e: any) {
          if (!this.iframe) {
            this.iframeDoQueue = this.iframeDoQueue || [];
            this.iframeDoQueue.push(e);
            return;
          }
          try {
            return originalDoInIframe.apply(this, arguments);
          } catch (err) {
            console.warn("Caught doInIframe error:", err);
          }
        };
        proto.__isPatched = true;
        console.log("Successfully patched Cal's prototype.doInIframe!");
        return true;
      }
    }

    // Also patch any existing instances directly just in case
    const instances: any[] = [];
    if (Cal.instance) instances.push(Cal.instance);
    if (Cal.ns) {
      Object.keys(Cal.ns).forEach((ns) => {
        if (Cal.ns[ns] && Cal.ns[ns].instance) {
          instances.push(Cal.ns[ns].instance);
        }
      });
    }

    instances.forEach((inst) => {
      if (inst && !inst.__isPatched) {
        const originalDoInIframe = inst.doInIframe;
        inst.doInIframe = function (e: any) {
          if (!this.iframe) {
            this.iframeDoQueue = this.iframeDoQueue || [];
            this.iframeDoQueue.push(e);
            return;
          }
          try {
            return originalDoInIframe.apply(this, arguments);
          } catch (err) {
            console.warn("Caught doInIframe error on instance:", err);
          }
        };
        inst.__isPatched = true;
      }
    });
  } catch (err) {
    console.warn("Error applying Cal patch:", err);
  }
  return false;
}

if (typeof window !== "undefined") {
  const interval = setInterval(() => {
    const patched = safePatchCal();
    if (patched) {
      clearInterval(interval);
      // Run it on a slower poll to check for any new dynamic/namespace instances
      setInterval(safePatchCal, 1000);
    }
  }, 100);
}

export default function WizardQuote() {
  const navigate = useNavigate();
  const { theme } = useTheme();
  const { language } = useLanguage();
  const calTheme = theme === "dark" ? "dark" : "light";
  const location = useLocation();

  // Domain search / check state definitions
  const [domainName, setDomainName] = useState("");
  const [domainSuggestions, setDomainSuggestions] = useState<string[]>([]);
  const [checkingDomain, setCheckingDomain] = useState(false);
  const [domainError, setDomainError] = useState("");
  const [domainStatus, setDomainStatus] = useState<{
    domain: string;
    available: boolean;
    price: number;
    isPremium: boolean;
  } | null>(null);
  const domainDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        price: 0,
        isPremium: false,
      });
    } catch (error: any) {
      setDomainError(error.message || 'No se pudo verificar la disponibilidad. Intenta nuevamente.');
    } finally {
      setCheckingDomain(false);
    }
  };

  // AI-powered setup states and functions
  const [aiDescription, setAiDescription] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState("");
  const [aiUsed, setAiUsed] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string; addons: string[]; reasoning: string } | null>(null);
  const [showAiStep, setShowAiStep] = useState(true);

  const analyzeWithAI = async () => {
    if (!aiDescription.trim() || aiDescription.length < 10) {
      setAiError(language === "en" ? "Please enter a description." : "Por favor ingresa una descripción.");
      return;
    }
    setAiLoading(true);
    setAiError("");

    try {
      const systemPrompt = `Eres el asistente de cotización de Polaris Web Studio, una agencia de desarrollo web en República Dominicana. Analiza la descripción del negocio y devuelve ÚNICAMENTE un objeto JSON válido, sin texto adicional, sin markdown, sin backticks.

PLANES (campo "type"):
- "landing": presencia básica, 1 página, emprendedores, profesionales independientes, negocios simples. $299
- "corporate": múltiples páginas, blog, restaurantes, clínicas, hoteles, despachos, salones. $699
- "ecommerce": vender productos online, pagos con tarjeta, inventario, tiendas de cualquier tipo. $1,299

ADD-ONS (campo "addons", array, puede estar vacío []):
- "bot_fast": respuestas automáticas, preguntas frecuentes, atención 24/7
- "ai_agent": ventas automatizadas, seguimiento de clientes
- "semantic_search": buscador de productos (solo si type es ecommerce)
- "content_assistant": blog activo, publicar contenido frecuente
- "hosting": mantenimiento continuo (incluir siempre por defecto)

CAMPO "confidence": "high" | "medium" | "low"
CAMPO "reasoning": entre 20 y 30 palabras en español. Explica específicamente qué tipo de negocio es, qué problema resuelve el plan elegido y por qué los add-ons sugeridos le aportan valor concreto.

EJEMPLO: {"type":"corporate","addons":["hosting","bot_fast"],"confidence":"high","reasoning":"Dentista necesita web corporativa para captar pacientes localmente"}`;

      // Función auxiliar para parsear la respuesta en JSON
      const parseJSON = (raw: string) => {
        const clean = raw.replace(/```json|```/g, "").trim();
        return JSON.parse(clean);
      };

      // Función auxiliar para mapear el resultado al estado
      const mapResult = (data: any) => {
        const mappedType = ["landing", "corporate", "ecommerce"].includes(data.type)
          ? data.type : "landing";
        const mappedAddons = ["hosting"];
        if (data.addons && Array.isArray(data.addons)) {
          const validAddons = ["bot_fast", "ai_agent", "semantic_search", "content_assistant"];
          data.addons.forEach((key: string) => {
            if (validAddons.includes(key) && !mappedAddons.includes(key)) {
              mappedAddons.push(key);
            }
          });
        }
        return { mappedType, mappedAddons, reasoning: data.reasoning || "", confidence: data.confidence || "low" };
      };

      let data: any = null;

      // Intento 1 — Gemini
      try {
        const geminiRes = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?key=" + import.meta.env.VITE_GEMINI_API_KEY,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              systemInstruction: { parts: [{ text: systemPrompt }] },
              contents: [{ parts: [{ text: aiDescription }] }],
              generationConfig: { temperature: 0.1, maxOutputTokens: 300 }
            })
          }
        );
        if (!geminiRes.ok) throw new Error("Gemini error");
        const geminiResult = await geminiRes.json();
        const geminiText = geminiResult.candidates?.[0]?.content?.parts?.[0]?.text || "";
        data = parseJSON(geminiText);
      } catch {
        // Gemini falló — intentar con Grok
        try {
          const grokRes = await fetch("https://api.x.ai/v1/chat/completions", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": "Bearer " + import.meta.env.VITE_GROK_API_KEY
            },
            body: JSON.stringify({
              model: "grok-3-mini",
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: aiDescription }
              ],
              temperature: 0.1,
              max_tokens: 300
            })
          });
          if (!grokRes.ok) throw new Error("Grok error");
          const grokResult = await grokRes.json();
          const grokText = grokResult.choices?.[0]?.message?.content || "";
          data = parseJSON(grokText);
        } catch {
          throw new Error("all_providers_failed");
        }
      }

      if (!data) throw new Error("no_data");

      const { mappedType, mappedAddons, reasoning, confidence } = mapResult(data);

      if (confidence === "low") {
        setAiError(
          language === "en"
            ? "Your description is too brief. Could you add a bit more detail? For example, what type of business is it and what do you need your website to do?"
            : "Tu descripción es muy breve. ¿Puedes agregar un poco más de detalle? Por ejemplo, ¿qué tipo de negocio tienes y qué necesitas que haga tu web?"
        );
        setAiLoading(false);
        return;
      }

      setSelections((prev: any) => ({
        ...prev,
        type: mappedType,
        addons: mappedAddons,
        notes: aiDescription,
      }));

      setAiResult({ type: mappedType, addons: mappedAddons, reasoning });
      setAiUsed(true);
      trackEvent("ai_analysis_complete", { type: mappedType });

    } catch (err: any) {
      setAiError(
        language === "en"
          ? "Couldn't analyze your description. Choose manually below."
          : "No pudimos analizar tu descripción. Elige manualmente abajo."
      );
    } finally {
      setAiLoading(false);
    }
  };

  const skipAiStep = () => {
    setAiUsed(false);
    setShowAiStep(false);
    setCurrentStep(0);
  };

  const [currentStep, setCurrentStep] = useState(() => {
    const saved = localStorage.getItem("wizardQuote_currentStep");
    return saved !== null ? parseInt(saved, 10) : 0;
  });

  const [selections, setSelections] = useState(() => {
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
    return {
      type: "",
      size: "",
      addons: ["hosting"] as string[],
      date: null as Date | null,
      time: "",
      name: "",
      email: "",
      notes: "",
    };
  });

  useEffect(() => {
    localStorage.setItem("wizardQuote_currentStep", currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem("wizardQuote_selections", JSON.stringify(selections));
  }, [selections]);

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
          size: "", // Reset size so they pick complexity for that new type
          addons: newAddons,
        };
      });
      setCurrentStep(0);
    }
  }, [location.search]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Lead capture state
  const [leadCaptured, setLeadCaptured] = useState(() =>
    !!localStorage.getItem("wizardQuote_leadCaptured")
  );
  const [showLeadCapture, setShowLeadCapture] = useState(false);
  const [leadName, setLeadName] = useState(selections.name || "");
  const [leadEmail, setLeadEmail] = useState(selections.email || "");
  const [leadEmailError, setLeadEmailError] = useState("");

  // GA4 helper
  const trackEvent = (eventName: string, params?: Record<string, any>) => {
    try {
      (window as any).gtag?.("event", eventName, params);
    } catch (_) {}
  };

  const [targetDate] = useState(() =>
    new Date("2026-06-18T23:59:59Z").getTime(),
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

  const [CalComponent, setCalComponent] = useState<any>(null);

  useEffect(() => {
    // Solo cargar Cal cuando el usuario llegue al último paso
    if (currentStep === 3 && !CalComponent) {
      import('@calcom/embed-react').then((mod) => {
        setCalComponent(() => mod.default);
      });
    }
  }, [currentStep, CalComponent]);

  useEffect(() => {
    if (currentStep !== 3) return;

    let active = true;
    const initCal = async () => {
      try {
        const calMod = await import("@calcom/embed-react");
        const getCalApi = calMod.getCalApi;
        const cal = await getCalApi();
        if (!active) return;

        cal("on", {
          action: "bookingSuccessful",
          callback: (e) => {
            const selectedPlanName = getTypeName(selections.type);
            const finalTotal = isOfferActive ? discountedTotal : estimatedTotal;
            const statePayload = {
              plan: selections.type,
              planName: selectedPlanName,
              total: finalTotal,
              isMonthly: monthlyAddonsPrice > 0 ? monthlyAddonsPrice : null,
              discountActive: isOfferActive,
              addons: selections.addons.map(getAddonName),
              domain: domainSummaryText,
            };
            localStorage.removeItem("wizardQuote_currentStep");
            localStorage.removeItem("wizardQuote_selections");
            navigate("/gracias", { state: statePayload });
          },
        });

        cal("ui", {
          theme: calTheme,
          cssVarsPerTheme: {
            dark: {
              // Brand
              "cal-brand": "#6366f1",
              "cal-brand-emphasis": "#818cf8",
              "cal-brand-text": "#ffffff",

              // Fondos
              "cal-bg": "#020617",
              "cal-bg-emphasis": "#0f172a",
              "cal-bg-subtle": "#1e293b",
              "cal-bg-muted": "#0f172a",
              "cal-bg-inverted": "#f8fafc",

              // Bordes
              "cal-border": "#1e293b",
              "cal-border-emphasis": "#334155",
              "cal-border-subtle": "#1e293b",
              "cal-border-booker": "#334155",

              // Texto
              "cal-text": "#f8fafc",
              "cal-text-emphasis": "#ffffff",
              "cal-text-subtle": "#94a3b8",
              "cal-text-muted": "#64748b",
              "cal-text-inverted": "#020617",
            },
            light: {
              // Brand
              "cal-brand": "#4f46e5",
              "cal-brand-emphasis": "#4338ca",
              "cal-brand-text": "#ffffff",

              // Fondos
              "cal-bg": "#f8fafc",
              "cal-bg-emphasis": "#ffffff",
              "cal-bg-subtle": "#f1f5f9",
              "cal-bg-muted": "#ffffff",
              "cal-bg-inverted": "#020617",

              // Bordes
              "cal-border": "#e2e8f0",
              "cal-border-emphasis": "#cbd5e1",
              "cal-border-subtle": "#e2e8f0",
              "cal-border-booker": "#cbd5e1",

              // Texto
              "cal-text": "#020617",
              "cal-text-emphasis": "#000000",
              "cal-text-subtle": "#64748b",
              "cal-text-muted": "#94a3b8",
              "cal-text-inverted": "#f8fafc",
            },
          },
          hideEventTypeDetails: false,
          layout: "month_view",
        });
      } catch (err) {
        console.warn("Cal.com UI config deferred:", err);
      }
    };

    const timer = setTimeout(initCal, 150);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [currentStep, calTheme]);

  const aiAddons = ["bot_fast", "semantic_search"];
  const params = new URLSearchParams(location.search);
  const isNovaPlan = params.get("plan") === "nova";

  const basePrice = types.find((t) => t.id === selections.type)?.price || 0;
  const currentScopes =
    projectScopes[selections.type as keyof typeof projectScopes] || [];
  const selectedScope = currentScopes.find((s) => s.id === selections.size);
  const scopeExtraPrice = selectedScope?.priceAdd || 0;

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

  const estimatedTotal = basePrice + scopeExtraPrice + addonsPrice;
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

  const getSizeName = (id: string) => {
    if (!id) return t("Custom Scope", "Alcance General");
    for (const scopeArray of Object.values(projectScopes)) {
      const found = scopeArray.find((s) => s.id === id);
      if (found) return t(found.name, found.name); // You can expand translations here
    }
    return id;
  };

  const getAddonName = (id: string) => {
    switch (id) {
      case "content_seo":
        return t("Content SEO Map", "Mapa de Contenidos SEO");
      case "bot_fast":
        return t("Lead Capture Bot", "Bot de Respuestas Rápidas");
      case "ai_agent":
        return t("Autonomous AI Agent", "Agente de Ventas IA");
      case "semantic_search":
        return t("Semantic AI Search", "Buscador Semántico IA");
      case "content_assistant":
        return t("Content Assistant", "Asistente de Contenido");
      case "crm":
        return t("CRM Integration", "Integración CRM");
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

  const quoteSummary = [
    `${t("Project Type", "Tipo de Proyecto")}: ${getTypeName(selections.type)}`,
    `${t("Size/Scope", "Tamaño/Alcance")}: ${getSizeName(selections.size)}`,
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

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      // Intercept before step 3 if lead not captured
      if (currentStep === 2 && !leadCaptured) {
        setShowLeadCapture(true);
        return;
      }
      trackEvent("wizard_step_complete", { step: currentStep + 1 });
      setCurrentStep((c) => c + 1);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      submitQuote();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((c) => c - 1);
    } else if (currentStep === 0 && !showAiStep) {
      setShowAiStep(true);
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleSubmitLead = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(leadEmail)) {
      setLeadEmailError(t("Enter a valid email.", "Ingresa un email válido."));
      return;
    }
    setLeadEmailError("");
    setSelections((s) => ({ ...s, name: leadName, email: leadEmail }));
    localStorage.setItem("wizardQuote_leadCaptured", "1");
    setLeadCaptured(true);
    setShowLeadCapture(false);
    trackEvent("lead_captured", { method: "wizard_pre_schedule" });
    trackEvent("wizard_step_complete", { step: 3 });
    setCurrentStep((c) => c + 1);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const submitQuote = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      const selectedPlanName = getTypeName(selections.type);
      const finalTotal = isOfferActive ? discountedTotal : estimatedTotal;
      const statePayload = {
        plan: selections.type,
        planName: selectedPlanName,
        total: finalTotal,
        isMonthly: monthlyAddonsPrice > 0 ? monthlyAddonsPrice : null,
        discountActive: isOfferActive,
        addons: selections.addons.map(getAddonName),
        domain: domainSummaryText,
      };
      localStorage.removeItem("wizardQuote_currentStep");
      localStorage.removeItem("wizardQuote_selections");
      navigate("/gracias", { state: statePayload });
    }, 1500);
  };

  const toggleAddon = (id: string) => {
    setSelections((s) => ({
      ...s,
      addons: s.addons.includes(id)
        ? s.addons.filter((a) => a !== id)
        : [...s.addons, id],
    }));
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative">
      <Navbar />

      <main className="flex-1 max-w-5xl mx-auto w-full px-6 pt-10 pb-24 md:pt-24 relative z-10 flex flex-col">
        {/* Ambient Background Glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[450px] pointer-events-none overflow-hidden -z-10 bg-transparent">
          <div className="absolute top-[-150px] left-1/2 -translate-x-1/2 w-[550px] h-[550px] rounded-full bg-[var(--color-primary-base)]/15" style={{ filter: "blur(130px)" }} />
          <div className="absolute top-[-100px] left-1/4 w-[320px] h-[320px] rounded-full bg-indigo-500/10" style={{ filter: "blur(110px)" }} />
          <div className="absolute top-[-100px] right-1/4 w-[320px] h-[320px] rounded-full bg-cyan-700/8" style={{ filter: "blur(110px)" }} />
        </div>

        {/* Header */}
        <div className="text-center mb-16 space-y-6 relative">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full border border-[var(--color-primary-base)]/20 bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] text-[10px] sm:text-[11px] font-black uppercase tracking-[0.25em]">
            <T en="Build Your Digital Presence">Construye tu Presencia Digital</T>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-black tracking-tight leading-[1.1] py-2">
            <span className="inline-block bg-gradient-to-r from-[var(--color-text-primary)] via-[var(--color-text-primary)] to-[var(--color-text-secondary)] bg-clip-text text-transparent pb-1 select-none px-1">
              <T en="Interactive">Planificador</T>
            </span>{" "}
            <span className="inline-block whitespace-nowrap bg-gradient-to-r from-[var(--color-primary-base)] to-indigo-400 bg-clip-text text-transparent pb-1 select-none px-1">
              <T en="Project Planner">de Proyectos</T>
            </span>
          </h1>

          <p className="text-[var(--color-text-secondary)] text-sm sm:text-base md:text-lg max-w-xl mx-auto leading-relaxed font-normal">
            <T en="Build your custom platform spec, evaluate costs dynamically, and lock in your session built for growth.">Construye las especificaciones de tu plataforma, evalúa costos dinámicamente y agenda tu sesión estratégica.</T>
          </p>
        </div>

        {/* Progress Bar */}
        {!showAiStep && (
          <div className="flex items-center gap-2 mb-12">
            {steps.map((step, idx) => (
              <React.Fragment key={idx}>
                <div className="flex-1 flex flex-col gap-2">
                  <div
                    className={`h-2 rounded-full transition-colors ${idx <= currentStep ? "bg-[var(--color-primary-base)]" : "glass-panel border border-[var(--color-border-subtle)]"}`}
                  />
                  <span
                    className={`text-[10px] font-bold uppercase tracking-widest ${idx <= currentStep ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-tertiary)]"}`}
                  >
                    {step.title}
                  </span>
                </div>
              </React.Fragment>
            ))}
          </div>
        )}

        {/* Dynamic Content */}
        <div className="flex-1 flex flex-col md:flex-row gap-12">
          <div className="flex-1">
            <AnimatePresence mode="wait">
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="p-12 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-primary-base)]/30 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]"
                >
                  <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center mb-4">
                    <Check size={40} />
                  </div>
                  <h2 className="text-3xl font-display font-black">
                    <T en="Meeting Confirmed!">¡Reunión Agendada!</T>
                  </h2>
                  <p className="text-[var(--color-text-secondary)]">
                    <T en="We have sent the invitation via Google Meet to your email. See you soon!">
                      Hemos enviado la invitación vía Google Meet a tu correo.
                      ¡Nos vemos pronto!
                    </T>
                  </p>
                  <button
                    onClick={() => navigate("/")}
                    className="mt-8 px-8 py-3 bg-[var(--color-surface-highlight)] rounded-xl font-bold hover:bg-[var(--color-primary-base)] hover:text-white transition-colors"
                  >
                    <T en="Return to Home">Volver al Inicio</T>
                  </button>
                </motion.div>
              ) : showAiStep ? (
                <motion.div
                  key="ai-step"
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  className="space-y-8 animate-fade-in"
                >
                  <div className="rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] glass-panel p-8 md:p-12 space-y-6 bento-glow shadow-sm hover:border-[var(--color-primary-base)]/20 transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] flex items-center justify-center shrink-0 shadow-inner w-12 h-12">
                        <Sparkles size={22} className="opacity-90 animate-pulse text-[var(--color-primary-base)]" />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)]">
                          <T en="Smart suggestions">Sugerencias inteligentes</T>
                        </div>
                        <h2 className="text-2xl md:text-3xl font-display font-black text-[var(--color-text-primary)] leading-tight">
                          <T en="Describe your project">Describe tu proyecto</T>
                        </h2>
                        <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                          <T en="Tell us about your business in a few words and we'll suggest the right plan automatically.">
                            Cuéntanos sobre tu negocio en pocas palabras y te sugeriremos el plan ideal automáticamente.
                          </T>
                        </p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <textarea
                        value={aiDescription}
                        onChange={(e) => setAiDescription(e.target.value)}
                        placeholder={language === 'es'
                          ? "Ej: Tengo una panadería y quiero que mis clientes puedan hacer pedidos online..."
                          : "E.g: I have a bakery and want my customers to place orders online..."}
                        className="glass-input w-full h-16 md:h-24 p-3 md:p-5 rounded-2xl border border-[var(--color-border-strong)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-sm md:text-base shadow-sm transition-all resize-none"
                      />
                      
                      <div className="mt-3 flex flex-col gap-1">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] mb-1">
                          <T en="Examples">Ejemplos</T>
                        </span>
                        {[
                          language === 'es' ? '"Tengo una ferretería y quiero vender online"' : '"I have a hardware store and want to sell online"',
                          language === 'es' ? '"Soy dentista y quiero que mis pacientes me encuentren en Google"' : '"I\'m a dentist and want patients to find me on Google"',
                          language === 'es' ? '"Tengo una tienda de ropa y quiero aceptar pagos con tarjeta"' : '"I have a clothing store and want to accept card payments"',
                        ].map((example, i) => (
                          <button
                            key={i}
                            type="button"
                            onClick={() => setAiDescription(example.replace(/"/g, ''))}
                            className="text-left text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] hover:bg-[var(--color-surface-elevated)] transition-all cursor-pointer py-1.5 px-2 rounded-lg flex items-center gap-1.5 group w-full"
                          >
                            <ArrowRight size={10} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-base)] flex-shrink-0 transition-colors" />
                            <span>{example}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {aiError && (
                      <div className="text-xs md:text-sm text-red-500 font-medium bg-red-500/10 p-4 rounded-xl border border-red-500/20 flex items-start gap-2 animate-fade-in">
                        <span>⚠</span>
                        <span>{aiError}</span>
                      </div>
                    )}

                    {aiResult && (
                      <div className="mt-4 p-4 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-4">
                        
                        {/* Header de la tarjeta */}
                        <div className="flex items-center gap-2">
                          <Sparkles size={14} className="text-[var(--color-primary-base)]" />
                          <p className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)]">
                            <T en="Based on your description">Basado en tu descripción</T>
                          </p>
                        </div>

                        {/* Plan sugerido con features */}
                        <div className="p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 size={14} className="text-emerald-500 flex-shrink-0" />
                            <span className="text-sm font-black flex items-center gap-1.5 flex-wrap">
                              {aiResult.type === "landing" && (
                                <>
                                  <span className="text-amber-500"><T en="Destello Plan">Plan Destello</T></span>
                                  <span className="text-[var(--color-text-secondary)] font-medium">•</span>
                                  <span className="text-[var(--color-text-primary)]">${isOfferActive ? Math.round(299 * 0.75) : 299} USD</span>
                                </>
                              )}
                              {aiResult.type === "corporate" && (
                                <>
                                  <span className="text-[var(--color-primary-base)]"><T en="Constellation Plan">Plan Constelación</T></span>
                                  <span className="text-[var(--color-text-secondary)] font-medium">•</span>
                                  <span className="text-[var(--color-text-primary)]">${isOfferActive ? Math.round(699 * 0.75) : 699} USD</span>
                                </>
                              )}
                              {aiResult.type === "ecommerce" && (
                                <>
                                  <span className="text-violet-500"><T en="Nova Plan">Plan Nova</T></span>
                                  <span className="text-[var(--color-text-secondary)] font-medium">•</span>
                                  <span className="text-[var(--color-text-primary)]">${isOfferActive ? Math.round(1299 * 0.75) : 1299} USD</span>
                                </>
                              )}
                            </span>
                          </div>

                          {/* Features clave del plan */}
                          <ul className="space-y-1 pl-6">
                            {aiResult.type === "landing" && [
                              <T en="1 page designed to convert">1 página diseñada para captar clientes</T>,
                              <T en="WhatsApp button + contact form">Botón de WhatsApp + formulario de contacto</T>,
                              <T en="Visible on Google from day 1">Visible en Google desde el día 1</T>,
                            ].map((f, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5 align-middle">
                                <span className="text-[var(--color-primary-base)] mt-0.5">·</span>{f}
                              </li>
                            ))}
                            {aiResult.type === "corporate" && [
                              <T en="Up to 5 custom pages">Hasta 5 páginas personalizadas</T>,
                              <T en="Blog + 24/7 chatbot">Blog + chatbot de atención 24/7</T>,
                              <T en="Advanced SEO + Google Analytics">SEO avanzado + Google Analytics</T>,
                            ].map((f, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5 align-middle">
                                <span className="text-[var(--color-primary-base)] mt-0.5">·</span>{f}
                              </li>
                            ))}
                            {aiResult.type === "ecommerce" && [
                              <T en="Unlimited product catalog">Catálogo ilimitado de productos</T>,
                              <T en="Accepts cards and PayPal">Acepta tarjetas y PayPal</T>,
                              <T en="Inventory management + admin panel">Gestión de inventario + panel de administración</T>,
                            ].map((f, i) => (
                              <li key={i} className="text-xs text-[var(--color-text-secondary)] flex items-start gap-1.5 align-middle">
                                <span className="text-[var(--color-primary-base)] mt-0.5">·</span>{f}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Add-ons sugeridos */}
                        {aiResult.addons.filter(a => a !== "hosting").length > 0 && (
                          <div className="space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                              <T en="Suggested add-ons">Add-ons sugeridos</T>
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {aiResult.addons.filter(a => a !== "hosting").map((addon) => (
                                <span key={addon} className="flex items-center gap-1.5 text-[11px] font-bold px-3 py-1.5 rounded-full bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 text-[var(--color-primary-base)]">
                                  {addon === "bot_fast" && <MessageCircle size={11} />}
                                  {addon === "ai_agent" && <Bot size={11} />}
                                  {addon === "semantic_search" && <Search size={11} />}
                                  {addon === "content_assistant" && <PenLine size={11} />}
                                  <span>{getAddonName(addon)}</span>
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Reasoning mejorado */}
                        {aiResult.reasoning && (
                          <div className="flex items-start gap-2 p-3 rounded-xl bg-[var(--color-primary-base)]/5 border border-[var(--color-primary-base)]/10">
                            <Info size={12} className="text-[var(--color-primary-base)] flex-shrink-0 mt-0.5" />
                            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                              {aiResult.reasoning}
                            </p>
                          </div>
                        )}

                        {/* CTAs */}
                        <button
                          type="button"
                          onClick={() => { setShowAiStep(false); setCurrentStep(0); }}
                          className="w-full py-3 rounded-xl text-sm font-black bg-[var(--color-primary-base)] text-white hover:opacity-90 transition-all cursor-pointer border-none"
                        >
                          <T en="Continue with this selection →">Continuar con esta selección →</T>
                        </button>
                        <button
                          type="button"
                          onClick={() => { setAiResult(null); setAiUsed(false); }}
                          className="w-full text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer py-1 border-none bg-transparent"
                        >
                          <T en="Adjust manually">Ajustar manualmente</T>
                        </button>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-t border-[var(--color-border-subtle)]">
                      <button
                        type="button"
                        onClick={skipAiStep}
                        className="py-3 px-6 rounded-xl text-[var(--color-text-secondary)] font-bold hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-highlight)] active:scale-95 transition-all text-center border-none cursor-pointer bg-transparent"
                      >
                        <T en="Skip & configure manually ➔">Configurar manualmente ➔</T>
                      </button>
                      <button
                        type="button"
                        disabled={aiLoading}
                        onClick={analyzeWithAI}
                        className="flex items-center justify-center gap-2 px-8 py-3.5 bg-[var(--color-primary-base)] text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-75 border-none min-w-[180px] shadow-lg shadow-indigo-500/10 cursor-pointer"
                      >
                        {aiLoading ? (
                          <>
                            <Loader2 className="animate-spin" size={18} />
                            <T en="Analyzing...">Analizando...</T>
                          </>
                        ) : (
                          <>
                            <Sparkles size={18} />
                            <T en="Suggest my plan">Sugerir mi plan</T>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="min-h-[400px]"
                >
                  {/* STEP 0: TYPE */}
                  {currentStep === 0 && (
                    <div className="space-y-4">
                      <h2 className="text-2xl font-display font-bold mb-6">
                        <T en="What are you looking to build?">
                          ¿Qué buscas construir?
                        </T>
                      </h2>
                      <div className="grid gap-4">
                        {types.map((t) => (
                          <button
                            key={t.id}
                            onClick={() => {
                              if (selections.type !== t.id) {
                                setSelections((s) => ({
                                  ...s,
                                  type: t.id,
                                  size: "",
                                }));
                              }
                            }}
                            className={`p-6 rounded-[var(--radius-bento)] border transition-all text-left flex items-start gap-4 justify-between group ${selections.type === t.id ? "bg-[var(--color-primary-base)]/10 border-[var(--color-primary-base)]" : "glass-panel border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50"}`}
                          >
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-1.5 sm:gap-3 mb-2 w-full">
                                <h3
                                  className={`font-bold font-display text-lg sm:text-xl leading-tight ${selections.type === t.id ? "text-[var(--color-primary-base)]" : ""}`}
                                >
                                  {t.title}
                                </h3>
                                <span className="glass-badge text-xs font-bold px-2.5 py-0.5 rounded-full border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] shrink-0 w-fit whitespace-nowrap">
                                  <T en="from">desde</T> ${t.price}
                                </span>
                              </div>
                              <p className="text-[var(--color-text-secondary)] text-sm">
                                {t.desc}
                              </p>
                            </div>
                            <div
                              className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.type === t.id ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]" : "border-[var(--color-border-strong)]"}`}
                            >
                              {selections.type === t.id && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* STEP 1: SIZE */}
                  {currentStep === 1 && (
                    <div className="space-y-4">
                      {selections.type === "landing" && (
                        <h2 className="text-2xl font-display font-bold mb-6">
                          <T en="How complex should your Landing Page be?">
                            ¿Qué tan compleja será tu Landing Page?
                          </T>
                        </h2>
                      )}
                      {selections.type === "corporate" && (
                        <h2 className="text-2xl font-display font-bold mb-6">
                          <T en="How large is your Corporate Website?">
                            ¿Qué tan grande es tu Web Corporativa?
                          </T>
                        </h2>
                      )}
                      {selections.type === "ecommerce" && (
                        <h2 className="text-2xl font-display font-bold mb-6">
                          <T en="What scale is your Online Store?">
                            ¿A qué escala será tu Tienda Online?
                          </T>
                        </h2>
                      )}
                      {!selections.type && (
                        <h2 className="text-2xl font-display font-bold mb-6">
                          <T en="What is the dimension of your project?">
                            ¿Cuál es la dimensión de tu proyecto?
                          </T>
                        </h2>
                      )}

                      <div className="grid gap-4">
                        {currentScopes.map((s) => (
                          <button
                            key={s.id}
                            onClick={() =>
                              setSelections((sel) => ({ ...sel, size: s.id }))
                            }
                            className={`p-6 rounded-[var(--radius-bento)] border transition-all text-left flex items-start gap-4 justify-between group ${selections.size === s.id ? "bg-[var(--color-primary-base)]/10 border-[var(--color-primary-base)]" : "glass-panel border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50"}`}
                          >
                            <div className="flex-1">
                              <div className="flex flex-col sm:flex-row sm:items-start md:items-center gap-1.5 sm:gap-3 mb-2 w-full">
                                <h3
                                  className={`font-bold font-display text-lg sm:text-xl leading-tight ${selections.size === s.id ? "text-[var(--color-primary-base)]" : ""}`}
                                >
                                  {s.title}
                                </h3>
                                <span className="glass-badge text-xs font-bold px-2.5 py-0.5 rounded-full border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] shrink-0 w-fit whitespace-nowrap">
                                  {s.priceAdd > 0 ? (
                                    `+$${s.priceAdd}`
                                  ) : (
                                    <T en="Included">Incluido</T>
                                  )}
                                </span>
                              </div>
                              <p className="text-[var(--color-text-secondary)] text-sm">
                                {s.desc}
                              </p>
                            </div>
                            <div
                              className={`mt-1 flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center ${selections.size === s.id ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]" : "border-[var(--color-border-strong)]"}`}
                            >
                              {selections.size === s.id && (
                                <Check size={14} className="text-white" />
                              )}
                            </div>
                          </button>
                        ))}
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
                            <Globe size={22} className="opacity-90" />
                          </div>
                          <div>
                            <h3 className="text-lg md:text-xl font-display font-black text-[var(--color-text-primary)]">
                              <T en="Domain Search">Buscador de Dominios</T>
                            </h3>
                            <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1 leading-relaxed">
                              <T en="All of our web plans include a standard domain up to $15 USD. Check yours here! If it is a premium domain, we will credit the $15 USD and you will only pay the extra difference in your total project budget.">Todos nuestros planes web incluyen un dominio estándar de hasta $15 USD. ¡Verifica el tuyo aquí! Si es un dominio premium, te acreditamos los $15 USD y solo pagarás la diferencia extra en el presupuesto total de tu proyecto.</T>
                            </p>
                          </div>
                        </div>

                        <div className="w-full max-w-lg mt-2">
                          <div className="relative">
                            <input
                              type="text"
                              placeholder="miempresa.com"
                              aria-label="Nombre de dominio a verificar"
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
                                    ['com', 'net', 'org', 'co', 'io', 'app'].map(tld => `${val.trim()}.${tld}`)
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
                              className="glass-input w-full px-4 py-3.5 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-primary)] font-medium placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] focus:border-transparent text-sm shadow-sm transition-all text-left"
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
                                  en="This domain is already registered. You can search for other extensions (like .net, .co, .org) or try a different branding variation."
                                >
                                  Este dominio ya está registrado. Puedes intentar buscando otras extensiones (como .net, .org, .co) o probar una variación de tu marca.
                                </T>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Powerups Options List */}
                      <div className="space-y-6">
                        <div>
                          <h2 className="text-xl md:text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
                            <T en="¿Deseas agregar superpoderes?">¿Deseas agregar superpoderes?</T>
                          </h2>
                          <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                            <T en="Select from our advanced features to optimize your conversions, client management, and search engines.">Selecciona de nuestras características avanzadas para optimizar tus conversiones, gestión de clientes y motores de búsqueda.</T>
                          </p>
                        </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {addons.map((a) => (
                          <button
                            key={a.id}
                            onClick={() => toggleAddon(a.id)}
                            className={`p-5 md:p-6 rounded-[var(--radius-bento)] border transition-all text-left flex flex-col justify-between group h-full ${selections.addons.includes(a.id) ? "bg-[var(--color-primary-base)]/10 border-[var(--color-primary-base)]" : "glass-panel border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50"}`}
                          >
                            <div className="flex justify-between w-full gap-2 mb-4">
                              <div>
                                <h3
                                  className={`font-bold font-display flex flex-wrap items-center gap-x-1.5 gap-y-1 leading-snug ${selections.addons.includes(a.id) ? "text-[var(--color-primary-base)]" : ""}`}
                                >
                                  <span>{a.title}</span>
                                  {/* @ts-ignore */}
                                  {a.novaSpec && (
                                    <span className="inline-flex items-center text-[8px] bg-violet-500/15 border border-violet-500/10 text-violet-400 font-bold px-1.5 py-0.5 rounded uppercase tracking-wider leading-none">
                                      <T en="Nova Rec.">Recomendado Nova</T>
                                    </span>
                                  )}
                                  {a.isAi && (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--color-surface-highlight)] border border-purple-500/20 text-[10px] uppercase font-bold tracking-wider leading-none">
                                      <Sparkles size={10} className="text-indigo-500 animate-pulse" />
                                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-extrabold">
                                        <T en="AI">IA</T>
                                      </span>
                                    </span>
                                  )}
                                </h3>
                                {a.desc && (
                                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                                    {a.desc}
                                  </p>
                                )}
                              </div>
                              <div
                                className={`flex-shrink-0 w-5 h-5 rounded border flex items-center justify-center ${selections.addons.includes(a.id) ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)] text-white" : "border-[var(--color-border-strong)] text-transparent"}`}
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
                                    $0{" "}
                                    <T en="(Nova Perk)">(Incluido en Nova)</T>
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
                                  <Info size={11} className="inline mr-1.5 text-[var(--color-primary-base)] opacity-70 shrink-0" />{language === "en" ? addonSocialProof[a.id].en : addonSocialProof[a.id].es}
                                </motion.p>
                              )}
                            </AnimatePresence>
                          </button>
                        ))}
                      </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: SCHEDULE */}
                  {currentStep === 3 && (
                    <div className="space-y-6 w-full">
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

                      <div
                        className="w-full bg-[var(--color-surface-base)] rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] min-h-[500px]"
                        style={
                          {
                            "--cal-brand-color":
                              theme === "dark" ? "#6366f1" : "#4f46e5",
                            "--cal-brand":
                              theme === "dark" ? "#6366f1" : "#4f46e5",
                            "--cal-brand-emphasis":
                              theme === "dark" ? "#818cf8" : "#4338ca",
                          } as React.CSSProperties
                        }
                      >
                        {CalComponent ? (
                          <CalComponent
                            key={quoteSummary}
                            calLink={`cristian-dicen/consultoria-polaris?name=${encodeURIComponent(selections.name || "")}&email=${encodeURIComponent(selections.email || "")}&notes=${encodeURIComponent(quoteSummary)}`}
                            style={{
                              width: "100%",
                              height: "100%",
                              overflow: "scroll",
                            }}
                            config={{
                              layout: "month_view",
                              theme: calTheme,
                              locale: language === "en" ? "en" : "es",
                            }}
                          />
                        ) : (
                          <div className="flex items-center justify-center h-full min-h-[500px]">
                            <div className="animate-spin w-6 h-6 border-2 border-[var(--color-primary-base)] border-t-transparent rounded-full" />
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer Navigation */}
            {!success && !showAiStep && (
              <div className="mt-8 flex items-center justify-between pt-8 border-t border-[var(--color-border-subtle)]">
                <button
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={`flex items-center gap-2 p-3 font-bold text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-30 disabled:hover:text-[var(--color-text-secondary)] transition-colors ${currentStep === 0 ? "invisible" : ""}`}
                >
                  <ArrowLeft size={18} /> <T en="Back">Atrás</T>
                </button>
                {currentStep < 3 && (
                  <button
                    onClick={handleNext}
                    disabled={
                      (currentStep === 0 && !selections.type) ||
                      (currentStep === 1 && !selections.size)
                    }
                    className="flex items-center gap-2 px-8 py-3 bg-[var(--color-primary-base)] text-white rounded-xl font-bold hover:scale-105 active:scale-95 transition-all disabled:opacity-50 border-none ml-auto"
                  >
                    {loading ? (
                      <Loader2 className="animate-spin" size={18} />
                    ) : (
                      <>
                        <T en="Next">Siguiente</T> <ArrowRight size={18} />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sidebar Estimator */}
          {!showAiStep && !success && (
            <div className="w-full md:w-80 h-max sticky top-24 p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)]">
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
              {selections.size && (
                <div className="flex justify-between items-start pb-4 border-b border-[var(--color-border-subtle)] text-sm">
                  <span className="text-[var(--color-text-secondary)] pr-4">
                    <T en="Project Scope">Tamaño del proyecto</T> (
                    {selectedScope?.title})
                  </span>
                  <span className="font-bold whitespace-nowrap flex-shrink-0">
                    +
                    {scopeExtraPrice === 0 ? (
                      "0"
                    ) : (
                      <span>
                        $<AnimatedNumber value={scopeExtraPrice} />
                      </span>
                    )}
                  </span>
                </div>
              )}
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
                    <span className={`font-bold whitespace-nowrap flex-shrink-0 ${domainStatus.isPremium ? 'text-amber-500' : 'text-emerald-500'}`}>
                      {domainStatus.isPremium ? (
                        <T en="Premium">Premium</T>
                      ) : (
                        <T en="Free">Gratis</T>
                      )}
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
          )}
        </div>
      </main>
      <Footer />

      {/* Lead Capture Modal */}
      <AnimatePresence>
        {showLeadCapture && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-md glass-panel border border-[var(--color-border-subtle)] rounded-[var(--radius-bento)] p-8 space-y-6 shadow-2xl"
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ duration: 0.25 }}
            >
              <div className="space-y-2">
                <div className="w-10 h-10 rounded-2xl bg-[var(--color-primary-base)]/10 flex items-center justify-center text-[var(--color-primary-base)] mb-4">
                  <Calendar size={20} />
                </div>
                <h3 className="text-xl font-display font-black tracking-tight">
                  <T en="Save your proposal">Guarda tu propuesta</T>
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <T en="We'll send a detailed copy to your email so you can review it anytime — even if you don't schedule today.">
                    Te enviamos una copia detallada a tu correo para que la revises cuando quieras, aunque no agendes hoy.
                  </T>
                </p>
              </div>

              <div className="space-y-3">
                <div>
                  <input
                    type="text"
                    placeholder={t("Your name", "Tu nombre")}
                    value={leadName}
                    onChange={(e) => setLeadName(e.target.value)}
                    className="glass-input w-full px-4 py-3 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-sm transition-all"
                  />
                </div>
                <div>
                  <input
                    type="email"
                    placeholder={t("your@email.com", "tu@correo.com")}
                    value={leadEmail}
                    onChange={(e) => { setLeadEmail(e.target.value); setLeadEmailError(""); }}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSubmitLead(); }}
                    className={`w-full px-4 py-3 rounded-xl border bg-[var(--color-surface-base)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-sm transition-all ${leadEmailError ? "border-red-500" : "border-[var(--color-border-strong)]"}`}
                  />
                  {leadEmailError && (
                    <p className="glass-input text-xs text-red-500 mt-1">{leadEmailError}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={handleSubmitLead}
                  className="w-full py-3 px-6 bg-[var(--color-primary-base)] text-white rounded-xl font-bold hover:scale-[1.02] active:scale-95 transition-all border-none cursor-pointer"
                >
                  <T en="Save & continue to scheduling →">Guardar y continuar →</T>
                </button>
                <button
                  onClick={() => {
                    setShowLeadCapture(false);
                    localStorage.setItem("wizardQuote_leadCaptured", "1");
                    setLeadCaptured(true);
                    trackEvent("wizard_step_complete", { step: 3 });
                    setCurrentStep((c) => c + 1);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  className="w-full py-2 px-6 text-[var(--color-text-tertiary)] text-xs hover:text-[var(--color-text-secondary)] transition-colors border-none bg-transparent cursor-pointer"
                >
                  <T en="Skip for now">Continuar sin guardar</T>
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
