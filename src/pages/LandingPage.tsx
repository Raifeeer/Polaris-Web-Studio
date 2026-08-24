import React, { useState, useEffect, useRef, lazy, Suspense, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  Code,
  Layers,
  Zap,
  ShoppingCart,
  Briefcase,
  Globe,
  BarChart3,
  Star,
  ChevronDown,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Orbit,
  Eclipse,
  Cpu,
  Brain,
  Cloud,
} from "lucide-react";
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useScroll, useTransform } from "framer-motion"; // Tree-shaking: solo se usan estos 7 exports
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Logo from "../components/Logo";
import MockupFrame from "../components/MockupFrame";
import CountdownPill from "../components/CountdownPill";
import WhyPolaris from "../components/WhyPolaris";
import Testimonials from "../components/Testimonials";
import { T, useLanguage } from "../context/LanguageContext";
import RippleButton from "../components/RippleButton";
import { useBorderGlow } from "../hooks/useBorderGlow";
import { RocketIcon } from "@/components/ui/rocket";

const Hero3D = lazy(() => import("../components/Hero3D"));

function Counter({
  value,
  suffix = "",
  duration = 2,
}: {
  value: number;
  suffix?: string;
  duration?: number;
}) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalMiliseconds = duration * 1000;
      const increment = end / (totalMiliseconds / 16); // 16ms approx per frame

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return (
    <span ref={ref}>
      {count}
      {suffix}
    </span>
  );
}

function ParallaxElement({
  children,
  speed = 0.2,
  className = "",
  style = {},
}: {
  children?: React.ReactNode;
  speed?: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  const isMd = typeof window !== "undefined" && window.innerWidth >= 768;
  // Translate up to 120 pixels depending on speed and viewport width
  const y = useTransform(scrollYProgress, [0, 1], isMd ? [120 * speed, -120 * speed] : [0, 0]);

  return (
    <motion.div ref={ref} style={{ ...style, y }} className={className}>
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { language } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>("inicio");
  // Misma fecha límite de la oferta de lanzamiento usada en Services.tsx (25% de descuento)
  const [targetDate] = useState(() => new Date("2026-08-17T23:59:59Z").getTime());
  const [isOfferActive, setIsOfferActive] = useState(() => Date.now() < targetDate);
  const { wrapRef: heroGlowRef, handlePointerMove: handleHeroGlowMove } = useBorderGlow();

  const cursorX = useMotionValue(-100);
  const cursorY = useMotionValue(-100);
  const [cursorVisible, setCursorVisible] = useState(false);
  const [cursorLabel, setCursorLabel] = useState("");

  const handleProjectMouseMove = (e: React.MouseEvent) => {
    cursorX.set(e.clientX);
    cursorY.set(e.clientY);
  };

  const pricingRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: pricingScroll } = useScroll({
    target: pricingRef,
    offset: ["start end", "end start"],
  });
  const isMd = typeof window !== 'undefined' && window.innerWidth >= 768;
  const destelloY = useTransform(pricingScroll, [0, 1], isMd ? [40, -40] : [0, 0]);
  const constelaY = useTransform(pricingScroll, [0, 1], isMd ? [20, -20] : [0, 0]);
  const novaY = useTransform(pricingScroll, [0, 1], isMd ? [40, -40] : [0, 0]);

  useEffect(() => {
    const metaData: Record<
      string,
      { esTitle: string; esDesc: string; enTitle: string; enDesc: string }
    > = {
      inicio: {
        esTitle:
          "Polaris Web Studio | Diseño y Desarrollo de Páginas Web Premium",
        esDesc:
          "Desarrollamos sitios web, landing pages y e-commerce de alto impacto y velocidad máxima, diseñados para captar clientes y potenciar tu negocio.",
        enTitle: "Polaris Web Studio | Premium Web Design & Development",
        enDesc:
          "We build high-impact, ultra-fast websites, landing pages, and e-commerces designed to acquire customers and scale your business.",
      },
      servicios: {
        esTitle:
          "Nuestros Servicios Web | Landing Pages, E-commerce y Corporativas",
        esDesc:
          "Soluciones web de software original optimizados para conversión. Creamos tiendas virtuales, webs elegantes y landing pages eficaces.",
        enTitle:
          "Our Web Services | Landing Pages, E-commerce & Corporate Websites",
        enDesc:
          "Custom web software optimized for conversion. We build online stores, elegant corporate sites, and high-converting landing pages.",
      },
      proceso: {
        esTitle: "Nuestro Proceso de Desarrollo | Ágil y Transparente",
        esDesc:
          "Conoce los 3 sencillos pasos que transformarán tu visión en una realidad digital de alto rendimiento: Planificas, Diseñamos y Lanzamos.",
        enTitle: "Our Web Development Process | Agile & Transparent",
        enDesc:
          "Learn the 3 simple steps to transform your vision into high-performance digital reality: Plan, Design, and Launch.",
      },
      portafolio: {
        esTitle: "Nuestro Portafolio de Proyectos Web | Casos de Éxito",
        esDesc:
          "Explora proyectos reales impecablemente optimizados: Lúmina Sky, Nexus Realty, y Chroma Tech Store construidos en código limpio.",
        enTitle: "Our Web Projects Portfolio | Live Demos & Success Cases",
        enDesc:
          "Explore high-fidelity, real-world custom projects: Lumina Sky, Nexus Realty, and Chroma Tech Store meticulously engineered.",
      },
      soluciones: {
        esTitle: "Soluciones Polaris | Diseño Web, Presencia Local y Automatización",
        esDesc:
          "Conoce las soluciones de Polaris para crear una presencia digital sólida, mejorar tu visibilidad local y automatizar operaciones.",
        enTitle: "Polaris Solutions | Web Design, Local Presence & Automation",
        enDesc:
          "Explore Polaris solutions to build a stronger digital presence, improve local visibility, and automate operations.",
      },
      faq: {
        esTitle: "Preguntas Frecuentes | Soporte y Tarifas Web",
        esDesc:
          "Dudas resueltas sobre tiempos de entrega, hosting, mantenimiento SEO, facilidades de pago y planes de desarrollo desde $299 USD.",
        enTitle: "Frequently Asked Questions | Web Pricing & Support FAQs",
        enDesc:
          "Get answers regarding turnaround times, hosting, SEO maintenance, flexible payment plans, and custom estimates starting at $299 USD.",
      },
    };

    const currentMeta = metaData[activeSection] || metaData.inicio;
    const currentTitle =
      language === "es" ? currentMeta.esTitle : currentMeta.enTitle;
    const currentDesc =
      language === "es" ? currentMeta.esDesc : currentMeta.enDesc;

    document.title = currentTitle;

    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement("meta");
      metaDesc.setAttribute("name", "description");
      document.head.appendChild(metaDesc);
    }
    metaDesc.setAttribute("content", currentDesc);

    // La home ya no tiene un canonical estático en index.html (ver el
    // comentario en ese archivo) -- lo pone acá para que quede explícito,
    // igual que useDocumentTitle.ts hace en el resto de las páginas.
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", "https://polarisweb.studio");
  }, [activeSection, language]);

  useEffect(() => {
    const observerOptions = {
      root: null,
      rootMargin: "-30% 0px -30% 0px",
      threshold: 0,
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    };

    const observer = new IntersectionObserver(
      observerCallback,
      observerOptions,
    );

    const sections = [
      "inicio",
      "servicios",
      "proceso",
      "portafolio",
      "soluciones",
      "faq",
    ];
    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => {
      sections.forEach((id) => {
        const el = document.getElementById(id);
        if (el) observer.unobserve(el);
      });
    };
  }, []);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const [techStackExpanded, setTechStackExpanded] = useState(() => {
    if (typeof window !== "undefined") {
      const stored = sessionStorage.getItem("techStackExpanded");
      return stored ? JSON.parse(stored) : false;
    }
    return false;
  });
  const [activeSlide, setActiveSlide] = useState(0);
  // Bug real de rendimiento encontrado en vivo (11 de agosto, datos reales
  // de un usuario en Chrome/iPhone): el auto-rotate de este carrusel
  // (antes un setInterval de 3.5s) remonta el slide activo completo en
  // cada rotación (AnimatePresence) -- costo real que, en este tipo de
  // dispositivo/conexión, bloqueaba el hilo principal cada ~3s. Se probó
  // primero aliviar el blur (glass-panel-lite) y después pausar el timer
  // hasta que la sección entrara en pantalla (useInView) -- ninguno de los
  // dos alcanzó (la sección ya asoma dentro del viewport inicial en
  // pantallas de teléfono, así que el timer igual arrancaba casi de
  // inmediato). Fix definitivo: se quitó el auto-rotate por completo --
  // la navegación sigue disponible a mano (dots, swipe), solo que ya no
  // rota sola.
  const techStackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    sessionStorage.setItem("techStackExpanded", JSON.stringify(techStackExpanded));
  }, [techStackExpanded]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        techStackExpanded &&
        techStackRef.current &&
        !techStackRef.current.contains(event.target as Node)
      ) {
        setTechStackExpanded(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [techStackExpanded]);

  const featuredProjects = [
    {
      title: "Lúmina Sky",
      slug: "lumina-sky-concept",
      desktopImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FLumina%20PC.PNG?alt=media&token=26caed50-0c21-4386-913f-ce3f31b0384c",
      type: <T en="Tourism · Immersive Web">Turismo · Web Inmersiva</T>,
      desc: (
        <T en="Luxury boutique hotel prototype with a custom booking engine and fine-tuned interactive animations.">
          Prototipo de hotel boutique de lujo con motor de reservas y
          animaciones fluidas de alta fidelidad.
        </T>
      ),
      stack: ["React", "Framer Motion", "Vite", "Tailwind CSS"],
      colorClass: "from-cyan-500/20 to-indigo-500/5 hover:border-cyan-500/40",
      // SEO 100/100, no "Rendimiento" -- medido en vivo con Google PageSpeed
      // Insights (17 de julio): Performance real es 69/100 mobile, no un
      // número que resista mostrarse en la landing. SEO 100/100 sí es real
      // y verificable (mismo dato ya usado en el Email 1 del Lead Drip).
      scoreLabel: <T en="SEO">SEO</T>,
      perfScore: 100,
    },
    {
      title: "Nexus Realty",
      slug: "nexus-real-estate",
      desktopImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FNexusPC.PNG?alt=media&token=5550e8eb-4f3a-4cbd-b468-971651cc033d",
      type: <T en="Real Estate · Platform">Inmobiliaria · Plataforma</T>,
      desc: (
        <T en="Real estate platform catalog showing rapid, zero-lag filters to browse elite properties on mobile.">
          Catálogo inmobiliario interactivo optimizado para un filtrado
          ultra-rápido de propiedades de lujo.
        </T>
      ),
      stack: ["React", "TypeScript", "Tailwind CSS", "Firebase"],
      colorClass: "from-amber-500/20 to-orange-500/5 hover:border-amber-500/40",
      perfScore: 88,
    },
    {
      title: "Chroma Tech Store",
      slug: "chroma-store",
      desktopImg: "https://firebasestorage.googleapis.com/v0/b/gen-lang-client-0746441136.firebasestorage.app/o/Lum%2FChromaPC.png?alt=media&token=7071ec72-9030-4227-bb96-c4359ceb3edd",
      type: <T en="E-commerce · Technology">E-commerce · Tecnología</T>,
      desc: (
        <T en="High-performance automated digital store prototype with smart cart, AI assistant and secure gateway.">
          Tienda online de tecnología con pasarela de pago, buscador inteligente
          con IA y carrito persistente.
        </T>
      ),
      stack: ["React", "Firebase", "Stripe", "PayPal"],
      colorClass:
        "from-violet-500/20 to-fuchsia-500/5 hover:border-violet-500/40",
    },
  ];

  const faqs = [
    {
      q: <T en="How much does a project cost?">¿Cuánto cuesta un proyecto?</T>,
      a: (
        <T en="Our custom professional projects start from $299 USD. We offer clear pricing with zero hidden costs, structured based on your specific requirements and complexity.">
          Nuestros proyectos profesionales y personalizados comienzan desde $299
          USD. Ofrecemos precios claros sin sorpresas ni costos ocultos,
          adaptados a la complejidad y necesidades específicas de tu negocio.
        </T>
      ),
    },
    {
      q: <T en="Do you offer payment plans?">¿Ofrecen facilidades de pago?</T>,
      a: (
        <T en="Yes, we work with a 50% upfront and 50% upon launch structure. For large projects like e-commerce, we can structure milestone payments.">
          Sí, trabajamos con un esquema de 50% al iniciar el proyecto y 50% al
          momento del lanzamiento. Para proyectos grandes como e-commerce,
          podemos estructurar pagos por fases.
        </T>
      ),
    },
    {
      q: (
        <T en="What if I'm not happy with the result?">
          ¿Qué pasa si el resultado no me convence?
        </T>
      ),
      a: (
        <T en="Every package includes a post-launch warranty (30 to 90 days depending on the plan) to fix anything that doesn't match what we agreed on — at no extra cost.">
          Todos los paquetes incluyen una garantía post-lanzamiento (de 30 a 90
          días según el plan) para corregir cualquier cosa que no coincida con
          lo acordado — sin costo adicional.
        </T>
      ),
    },
    {
      q: (
        <T en="How long does a project take?">
          ¿Cuánto tiempo toma un proyecto?
        </T>
      ),
      a: (
        <T en="It depends on the complexity. A landing page is usually ready in 2 weeks, while a full corporate website takes between 4 and 6 weeks.">
          Depende de la complejidad. Una landing page suele estar lista en 2
          semanas, mientras que una web corporativa completa toma entre 4 y 6
          semanas.
        </T>
      ),
    },
    {
      q: <T en="Do you offer maintenance?">¿Ofrecen mantenimiento?</T>,
      a: (
        <T en="Yes, we have support and maintenance plans to ensure your website is always up to date and secure.">
          Sí, tenemos planes de soporte y mantenimiento para asegurar que tu web
          esté siempre al día y segura.
        </T>
      ),
    },
    {
      q: (
        <T en="What does the maintenance service include?">
          ¿Qué incluye el servicio de mantenimiento?
        </T>
      ),
      a: (
        <T en="It includes uptime monitoring, security updates, regular backups, and minor content changes so your site is always perfect.">
          Incluye monitoreo de uptime, actualizaciones de seguridad, copias de
          respaldo regulares y pequeñas modificaciones de contenido para que tu
          web siempre esté perfecta.
        </T>
      ),
    },
    {
      q: <T en="Do you work with SEO?">¿Trabajan con SEO?</T>,
      a: (
        <T en="Absolutely. All our websites are born with an optimized on-page SEO structure.">
          Totalmente. Todas nuestras webs nacen con una estructura optimizada
          para motores de búsqueda (SEO On-page).
        </T>
      ),
    },
  ];

  return (
    <div className="min-h-[100svh] flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      {/* Floating Parallax Background Orbs & Shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        {/* Hero Section: Glowing Purple/Indigo Orb (Slower, negative speed) */}
        <ParallaxElement speed={-0.3} className="absolute top-[5%] right-[-10%] w-[300px] h-[300px] md:w-[600px] md:h-[600px] rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 blur-[80px] md:blur-[120px]" />
        
        {/* Services Section: Glowing Blue Orb (Positive speed) */}
        <ParallaxElement speed={0.4} className="absolute top-[25%] left-[-10%] w-[250px] h-[250px] md:w-[500px] md:h-[500px] rounded-full bg-blue-500/8 dark:bg-blue-500/5 blur-[70px] md:blur-[100px]" />
        
        {/* Proceso Section: Decorative Floating Star or Sparkle Accent */}
        <ParallaxElement speed={-0.5} className="absolute top-[48%] right-[5%] text-[var(--color-primary-base)]/15 hidden md:block">
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="0.5" strokeLinecap="round" strokeLinejoin="round" className="animate-spin-slow">
            <path d="M12 2v20M2 12h20M5.03 5.03l13.94 13.94M18.97 5.03L5.03 18.97" />
          </svg>
        </ParallaxElement>
        
        {/* Process Section: Glowing Emerald/Cyan Orb (Negative speed) */}
        <ParallaxElement speed={-0.4} className="absolute top-[52%] right-[-5%] w-[300px] h-[300px] md:w-[550px] md:h-[550px] rounded-full bg-emerald-500/8 dark:bg-emerald-500/4 blur-[80px] md:blur-[110px]" />

        {/* Portafolio Section: Glowing Violet Orb (Positive speed) */}
        <ParallaxElement speed={0.3} className="absolute top-[72%] left-[-5%] w-[350px] h-[350px] md:w-[600px] md:h-[600px] rounded-full bg-violet-500/8 dark:bg-violet-500/4 blur-[90px] md:blur-[120px]" />
        
        {/* FAQ Section: Glowing Amber/Orange Orb (Negative speed) */}
        <ParallaxElement speed={-0.2} className="absolute top-[88%] right-[-8%] w-[250px] h-[250px] md:w-[450px] md:h-[450px] rounded-full bg-amber-500/8 dark:bg-amber-500/4 blur-[70px] md:blur-[100px]" />
      </div>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-10 py-4 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          {/* Main Hero Card */}
          <div
            ref={heroGlowRef}
            onPointerMove={handleHeroGlowMove}
            className="hero-glow-wrap md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)]"
          >
            <span className="edge-light" />
          <motion.div
            id="inicio"
            initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 45, damping: 14 }}
            className="rounded-[var(--radius-bento)] p-5 pb-6 md:p-16 glass-panel flex flex-col justify-end relative overflow-hidden group bento-glow min-h-[400px] sm:min-h-[500px] bg-gradient-to-br from-indigo-50/40 via-transparent to-violet-50/30 dark:from-transparent dark:to-transparent"
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-[-150px] sm:right-[-250px] md:right-[-200px] opacity-[0.07] dark:opacity-[0.15] group-hover:opacity-[0.18] dark:group-hover:opacity-[0.28] group-hover:-translate-x-4 transition-all duration-500 pointer-events-none">
              <Logo
                size={500}
                showText={false}
                className="text-[var(--color-primary-base)]"
              />
            </div>

            {/* 3D WebGL Canvas */}
            <div className="absolute inset-0 z-0">
              <Suspense
                fallback={
                  <div className="absolute inset-0 z-0 pointer-events-none" />
                }
              >
                <Hero3D />
              </Suspense>
            </div>

            <div className="max-w-3xl space-y-4 md:space-y-6 relative z-10 pt-4 md:pt-0">
              <motion.span
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-[var(--color-primary-base)] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] font-body block"
              >
                Polaris Web Studio | República Dominicana
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.55, delay: 0.2 }}
                className="text-[2.5rem] sm:text-5xl md:text-6xl lg:text-8xl font-display font-black leading-[1.1] md:leading-[1] tracking-[-0.04em]"
              >
                <T en="We digitize the future of your business today">
                  Digitalizamos el futuro de tu negocio hoy
                </T>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.32 }}
                className="text-[var(--color-text-secondary)] text-sm sm:text-base md:text-xl max-w-xl leading-relaxed"
              >
                <T en="We build web platforms designed to attract clients, close sales and scale. From the Caribbean, with cutting-edge technology.">
                  Desarrollamos plataformas web diseñadas para atraer clientes, cerrar ventas y escalar. Desde República Dominicana, con tecnología de punta.
                </T>
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.44 }}
                className="pt-2"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                  <div className="relative group shrink-0">
                    {/* Static subtle glow */}
                    <div className="absolute inset-0 rounded-xl bg-[var(--color-primary-base)]/20 pointer-events-none" style={{ filter: "blur(8px)" }} />

                    {/* Periodic ping ring */}
                    <div className="absolute inset-0 rounded-xl border border-[var(--color-primary-base)]/35 pointer-events-none animate-cta-ping" />
                    <RippleButton
                      onClick={() => navigate("/cotizar")}
                      className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-sm sm:text-base md:text-lg hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 w-full justify-center"
                    >
                      {/* Shimmer effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

                      <RocketIcon
                        size={20}
                        aria-hidden={true}
                        className="shrink-0 group-hover:rotate-12 group-hover:-translate-y-1 transition-transform duration-300"
                      />

                      <T en="Plan your Project">Planifica tu Proyecto</T>

                      <ArrowRight
                        size={20}
                        className="ml-1 group-hover:translate-x-2 transition-transform duration-300"
                      />
                    </RippleButton>
                  </div>
                  <div className="flex flex-col text-left space-y-0.5">
                    <span className="text-xs font-black text-[var(--color-primary-base)] tracking-wider uppercase font-mono">
                      <T en="From $299 USD">Proyectos desde $299 USD</T>
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-medium">
                      <T en="Agile delivery · 100% original code · No templates">
                        Entrega ágil · Código 100% original · Sin plantillas
                      </T>
                    </span>
                  </div>
                </div>
                <p className="text-[10px] sm:text-xs text-[var(--color-text-tertiary)] font-medium mt-2">
                  <T en="Free initial consultation · No commitment">
                    Asesoría inicial 100% gratuita · Sin compromiso
                  </T>
                </p>
              </motion.div>
            </div>
          </motion.div>
          </div>

          {/* Landing Pages Card */}
          <motion.div
            id="servicios"
            initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.1 }}
            className="rounded-[var(--radius-bento)] glass-panel group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover flex flex-col will-change-transform"
          >
            <Link
              to="/blog/landing-pages-conversion"
              className="flex flex-col p-6 sm:p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between w-full"
            >
              <div className="w-full space-y-6">
                <div className="flex justify-between items-center w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                    <Layers size={24} />
                  </div>
                  <span className="glass-badge text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20 shrink-0">
                    <T en="CONVERSION">CONVERSIÓN</T>
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors duration-300">
                    Landing Pages
                  </h2>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs mt-2">
                    <T en="Conversion-focused design to turn visitors into real clients from day one.">
                      Diseño enfocado en conversión para convertir visitantes en
                      clientes reales desde el primer día.
                    </T>
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--color-border-subtle)]/40 pt-4 mt-6 w-full space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-indigo-600 dark:text-indigo-400 shrink-0"
                  />
                  <span>
                    <T en="Lead capture funnel">Captura rápida de leads</T>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)] font-medium">
                  <CheckCircle2
                    size={13}
                    className="text-indigo-600 dark:text-indigo-400 shrink-0"
                  />
                  <span>
                    <T en="100% responsive layout">Diseño móvil optimizado</T>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-indigo-600 dark:text-indigo-400 shrink-0"
                  />
                  <span>
                    <T en="WhatsApp integrated button">
                      WhatsApp directo integrado
                    </T>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Commerce Card */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.2 }}
            className="rounded-[var(--radius-bento)] glass-panel group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover flex flex-col will-change-transform"
          >
            <Link
              to="/blog/ecommerce-alto-nivel"
              className="flex flex-col p-6 sm:p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between w-full"
            >
              <div className="w-full space-y-6">
                <div className="flex justify-between items-center w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                    <ShoppingCart size={24} />
                  </div>
                  <span className="glass-badge text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                    <T en="SELL 24/7">VENTAS 24/7</T>
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors duration-300">
                    E-commerce
                  </h2>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs mt-2">
                    <T en="Scalable, secure, and optimized online sales platforms to multiply your income 24/7.">
                      Plataformas de venta online escalables, seguras y
                      optimizadas para multiplicar tus ingresos las 24 horas del
                      día.
                    </T>
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--color-border-subtle)]/40 pt-4 mt-6 w-full space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <span>
                    <T en="Stripe & payment systems">Pasarela segura de pago</T>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <span>
                    <T en="Intuitive product manager">
                      Administrador de productos
                    </T>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-emerald-600 dark:text-emerald-400 shrink-0"
                  />
                  <span>
                    <T en="Frictionless checkouts">
                      Experiencia de compra ágil
                    </T>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Corporate Card */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.3 }}
            className="md:col-span-2 lg:col-span-1 rounded-[var(--radius-bento)] glass-panel group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover flex flex-col will-change-transform"
          >
            <Link
              to="/blog/webs-corporativas-identidad"
              className="flex flex-col p-6 sm:p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between w-full"
            >
              <div className="w-full space-y-6">
                <div className="flex justify-between items-center w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                    <Briefcase size={24} />
                  </div>
                  <span className="glass-badge text-[9px] font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-300 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-500/20 shrink-0">
                    <T en="AUTHORITY">AUTORIDAD</T>
                  </span>
                </div>
                <div>
                  <h2 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors duration-300">
                    <T en="Corporate">Corporativas</T>
                  </h2>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs mt-2">
                    <T en="Solid and elegant digital identity that positions your brand as an undisputed leader in its respective market.">
                      Identidad digital sólida y elegante que posiciona tu marca
                      como líder indiscutible en su respectivo mercado.
                    </T>
                  </p>
                </div>
              </div>

              <div className="border-t border-[var(--color-border-subtle)]/40 pt-4 mt-6 w-full space-y-2">
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-violet-600 dark:text-violet-400 shrink-0"
                  />
                  <span>
                    <T en="Premium custom layout">Diseño estético premium</T>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-violet-600 dark:text-violet-400 shrink-0"
                  />
                  <span>
                    <T en="Self-manageable section & blog">
                      Secciones y blog auto-editables
                    </T>
                  </span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-[var(--color-text-secondary)]">
                  <CheckCircle2
                    size={13}
                    className="text-violet-600 dark:text-violet-400 shrink-0"
                  />
                  <span>
                    <T en="Enterprise light-speed loading">
                      Velocidad y carga excelente
                    </T>
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Metrics Card - Multi-Stats */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)] py-4 md:py-8 glass-panel flex items-center justify-center relative overflow-hidden bento-glow min-h-[100px] opacity-0"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-accent-blue)]/10 to-transparent blur-3xl opacity-50" />

            <div className="grid grid-cols-1 gap-y-6 sm:gap-y-0 sm:grid-cols-3 sm:divide-x divide-[var(--color-border-strong)] w-full">
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  <T en="2 Weeks">2 Semanas</T>
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full">
                  <T en="Landing Page Delivery">Entrega Landing Page</T>
                </p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  100%
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full">
                  <T en="Custom code, no templates">
                    Código a medida, sin plantillas
                  </T>
                </p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  24/7
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full leading-tight">
                  <T en="Post-launch Support">Soporte Post-lanzamiento</T>
                </p>
              </div>
            </div>
          </motion.div>

          {/* Target Audience Section */}
          <motion.div
            initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 45, damping: 14 }}
            className="md:col-span-2 lg:col-span-3 py-20 space-y-12 opacity-0"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Our Clients">Nuestros Clientes</T>
              </span>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
                <T
                  en={
                    <>
                      Custom solutions <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                        for every stage
                      </span>
                    </>
                  }
                >
                  Soluciones a medida <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    para cada etapa
                  </span>
                </T>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <motion.div
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 45, damping: 14 }}
                className="p-6 sm:p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform opacity-0"
              >
                <div className="space-y-5">
                  {/* Card Header with Icon and Highlight Badge */}
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-12 h-12 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:border-[var(--color-primary-base)] group-hover:scale-110 transition-all duration-300">
                      <Rocket size={24} />
                    </div>
                    <span className="glass-badge text-[9px] uppercase tracking-widest font-extrabold text-blue-400 px-2.5 py-1 rounded-full border border-blue-500/20 shrink-0">
                      <T en="STARTING PHASE">FASE INICIAL</T>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors duration-300">
                      <T en="Entrepreneurs & Startups">
                        Emprendedores y startups
                      </T>
                    </h3>

                    {/* Custom Styled Quote container */}
                    <div className="mt-2.5 mb-4 border-l-2 border-[var(--color-primary-base)] bg-[var(--color-primary-base)]/5 px-3 py-2 rounded-r-lg">
                      <p className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wide leading-tight">
                        <T en={'"You\'re launching your idea"'}>
                          "Estás lanzando tu idea"
                        </T>
                      </p>
                    </div>

                    <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
                      <T en="You need a professional digital presence that inspires trust from day one.">
                        Necesitas presencia digital rápida, profesional y que
                        inspire confianza desde el primer día.
                      </T>
                    </p>
                  </div>
                </div>

                {/* Checklist with Deliverables */}
                <div className="border-t border-[var(--color-border-subtle)]/40 pt-4 mt-5 space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-blue-400 shrink-0"
                    />
                    <span>
                      <T en="Conversion optimized Landing Page">
                        Landing Page optimizada a conversión
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-blue-400 shrink-0"
                    />
                    <span>
                      <T en="Domain setup & hosting">
                        Dominio y alojamiento listo
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-blue-400 shrink-0"
                    />
                    <span>
                      <T en="Initial client capturing funnel">
                        Sistemas de captación rápidos
                      </T>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.1 }}
                className="p-6 sm:p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform opacity-0"
              >
                <div className="space-y-5">
                  {/* Card Header with Icon and Highlight Badge */}
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-12 h-12 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:border-[var(--color-primary-base)] group-hover:scale-110 transition-all duration-300">
                      <Briefcase size={24} />
                    </div>
                    <span className="glass-badge text-[9px] uppercase tracking-widest font-extrabold text-amber-400 px-2.5 py-1 rounded-full border border-amber-500/20 shrink-0">
                      <T en="GROWTH">CRECIMIENTO</T>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors duration-300">
                      <T en="SMEs & Established Businesses">
                        PYMEs y negocios establecidos
                      </T>
                    </h3>

                    {/* Custom Styled Quote container */}
                    <div className="mt-2.5 mb-4 border-l-2 border-amber-400/80 bg-amber-400/5 px-3 py-2 rounded-r-lg">
                      <p className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wide leading-tight">
                        <T
                          en={
                            '"Your business exists but your site doesn\'t sell"'
                          }
                        >
                          "Tu negocio ya existe pero tu web no vende"
                        </T>
                      </p>
                    </div>

                    <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
                      <T en="You have clients but your site doesn't reflect them. It's time for a website up to par with what you offer.">
                        Tienes clientes pero tu sitio actual no los refleja. Es
                        momento de una web a la altura de lo que ofreces.
                      </T>
                    </p>
                  </div>
                </div>

                {/* Checklist with Deliverables */}
                <div className="border-t border-[var(--color-border-subtle)]/40 pt-4 mt-5 space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-amber-400 shrink-0"
                    />
                    <span>
                      <T en="Premium redesign & clean catalog">
                        Rediseño estético y catálogo premium
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-amber-400 shrink-0"
                    />
                    <span>
                      <T en="CRM or WhatsApp integrations">
                        Integración con CRM o WhatsApp
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-amber-400 shrink-0"
                    />
                    <span>
                      <T en="High-converting multi-page layout">
                        Arquitectura multi-página robusta
                      </T>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div
                whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.2 }}
                className="p-6 sm:p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform opacity-0"
              >
                <div className="space-y-5">
                  {/* Card Header with Icon and Highlight Badge */}
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-12 h-12 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:border-[var(--color-primary-base)] group-hover:scale-110 transition-all duration-300">
                      <ShoppingCart size={24} />
                    </div>
                    <span className="glass-badge text-[9px] uppercase tracking-widest font-extrabold text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                      <T en="E-COMMERCE">VENTA ONLINE</T>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors duration-300">
                      E-commerce
                    </h3>

                    {/* Custom Styled Quote container */}
                    <div className="mt-2.5 mb-4 border-l-2 border-emerald-600 dark:border-emerald-400/80 bg-emerald-500/5 px-3 py-2 rounded-r-lg">
                      <p className="text-[11px] font-bold text-[var(--color-text-primary)] uppercase tracking-wide leading-tight">
                        <T en={'"You want to sell online"'}>
                          "Quieres vender en línea"
                        </T>
                      </p>
                    </div>

                    <p className="text-[var(--color-text-secondary)] leading-relaxed text-xs">
                      <T en="From simple catalogs to high-volume stores. We build the platform your business needs to sell 24/7.">
                        Desde catálogos simples hasta tiendas de alto volumen.
                        Te construimos la plataforma que tu negocio necesita
                        para vender 24/7.
                      </T>
                    </p>
                  </div>
                </div>

                {/* Checklist with Deliverables */}
                <div className="border-t border-[var(--color-border-subtle)]/40 pt-4 mt-5 space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)] font-medium">
                    <CheckCircle2
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    />
                    <span>
                      <T en="Agile cart & frictionless checkout">
                        Carrito ágil y checkout sin roces
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    />
                    <span>
                      <T en="Stripe or custom payment gateways">
                        Pasarela Stripe o métodos locales
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-emerald-600 dark:text-emerald-400 shrink-0"
                    />
                    <span>
                      <T en="Self-manageable admin products center">
                        Administrador de productos fácil
                      </T>
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Compact 3-Step Process Section */}
          <motion.div
            id="proceso"
            initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)", y: 35 }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ type: "spring", stiffness: 45, damping: 14 }}
            className="md:col-span-2 lg:col-span-3 py-16 space-y-12 border-t border-b border-[var(--color-border-subtle)]/50 my-12 opacity-0"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Our Process">Nuestro Proceso</T>
              </span>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
                <T
                  en={
                    <>
                      How it <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                        works
                      </span>
                    </>
                  }
                >
                  ¿Cómo <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    funciona?
                  </span>
                </T>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto leading-relaxed">
                <T en="Three simple steps to transform your vision into a high-performance digital reality.">
                  Tres pasos simples para transformar tu idea en una realidad
                  digital de alto rendimiento.
                </T>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)", y: 35 }}
                whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 45, damping: 14 }}
                className="glass-panel p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform opacity-0"
              >
                {/* Number and Badge Header Row */}
                <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute inset-x-[-6px] inset-y-[-6px] bg-[var(--color-primary-base)]/10 rounded-full blur group-hover:bg-[var(--color-primary-base)]/25 transition-all duration-300" />
                    <div className="relative w-12 h-12 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center font-mono text-lg font-black text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                      1
                    </div>
                  </div>
                  <span className="glass-badge text-[9px] uppercase tracking-widest font-extrabold text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                    <T en="2 MINUTES">2 MINUTOS</T>
                  </span>
                </div>

                <div className="space-y-2 w-full">
                  <h3 className="text-xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors">
                    <T en="Plan">Planificas</T>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    <T en="Tell us about your project in our smart planner and get a custom strategy plan.">
                      Cuéntanos tu idea en nuestro planificador dinámico y recibe
                      una propuesta y planificación de inmediato.
                    </T>
                  </p>
                </div>

                {/* Sub-deliverables checklist */}
                <div className="w-full border-t border-[var(--color-border-subtle)]/40 pt-4 mt-1 space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-emerald-500 shrink-0"
                    />
                    <span>
                      <T en="Adaptive instant pricing">
                        Presupuesto adaptado al instante
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-emerald-500 shrink-0"
                    />
                    <span>
                      <T en="Free professional advice">
                        Asesoría inicial 100% gratuita
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-emerald-500 shrink-0"
                    />
                    <span>
                      <T en="No commitment required">
                        Sin compromisos ni costes ocultos
                      </T>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Step 2 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)", y: 35 }}
                whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.1 }}
                className="glass-panel p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform opacity-0"
              >
                {/* Number and Badge Header Row */}
                <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute inset-x-[-6px] inset-y-[-6px] bg-[var(--color-primary-base)]/10 rounded-full blur group-hover:bg-[var(--color-primary-base)]/25 transition-all duration-300" />
                    <div className="relative w-12 h-12 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center font-mono text-lg font-black text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                      2
                    </div>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 px-2.5 py-1 rounded-full border border-[var(--color-primary-base)]/20 shrink-0">
                    <T en="LIVE PREVIEW">CÓDIGO EN VIVO</T>
                  </span>
                </div>

                <div className="space-y-2 w-full">
                  <h3 className="text-xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors">
                    <T en="We Design">Diseñamos</T>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    <T en="We craft fully customized interfaces and code with state-of-the-art web technologies for elite results.">
                      Creamos interfaces totalmente personalizadas y programamos
                      con tecnología web moderna, dándote acceso a vistas del
                      avance en vivo.
                    </T>
                  </p>
                </div>

                {/* Sub-deliverables checklist */}
                <div className="w-full border-t border-[var(--color-border-subtle)]/40 pt-4 mt-1 space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-[var(--color-primary-base)] shrink-0"
                    />
                    <span>
                      <T en="Premium custom design concepts">
                        Propuesta visual premium a tu medida
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-[var(--color-primary-base)] shrink-0"
                    />
                    <span>
                      <T en="Private styling updates">
                        Ver el desarrollo activo paso a paso
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-[var(--color-primary-base)] shrink-0"
                    />
                    <span>
                      <T en="Continuous flexible reviews">
                        Refinamiento constante y flexible
                      </T>
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Step 3 */}
              <motion.div
                initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)", y: 35 }}
                whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.2 }}
                className="glass-panel p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform opacity-0"
              >
                {/* Number and Badge Header Row */}
                <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute inset-x-[-6px] inset-y-[-6px] bg-[var(--color-primary-base)]/10 rounded-full blur group-hover:bg-[var(--color-primary-base)]/25 transition-all duration-300" />
                    <div className="relative w-12 h-12 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center font-mono text-lg font-black text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                      3
                    </div>
                  </div>
                  <span className="glass-badge text-[9px] uppercase tracking-widest font-extrabold text-violet-600 dark:text-violet-300 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-500/20 shrink-0">
                    <T en="SEO & ULTRA SPEED">ALTO IMPACTO</T>
                  </span>
                </div>

                <div className="space-y-2 w-full">
                  <h3 className="text-xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors">
                    <T en="We Launch">Lanzamos</T>
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    <T en="We launch your website meticulously configured for top performance, maximum speed, and ready to welcome users.">
                      Lanzamos tu sitio web minuciosamente configurado para el
                      mayor rendimiento, velocidad máxima de carga y listo para
                      recibir clientes.
                    </T>
                  </p>
                </div>

                {/* Sub-deliverables checklist */}
                <div className="w-full border-t border-[var(--color-border-subtle)]/40 pt-4 mt-1 space-y-2 text-left">
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-violet-600 dark:text-violet-400 shrink-0"
                    />
                    <span>
                      <T en="Top-tier load speed optimizations">
                        Velocidad máxima (PageSpeed 90+)
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-violet-600 dark:text-violet-400 shrink-0"
                    />
                    <span>
                      <T en="Standard technical structure configuration">
                        Configuración técnica óptima de serie
                      </T>
                    </span>
                  </div>
                  <div className="flex items-center gap-2.5 text-[11px] text-[var(--color-text-secondary)]">
                    <CheckCircle2
                      size={13}
                      className="text-violet-600 dark:text-violet-400 shrink-0"
                    />
                    <span>
                      <T en="Administrative access & full control">
                        Acceso administrativo y control de tu web
                      </T>
                    </span>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Featured Projects - "Lo que construimos" */}
          <motion.div
            id="portafolio"
            initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)", y: 35 }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 45, damping: 14 }}
            className="md:col-span-2 lg:col-span-3 py-20 space-y-12 opacity-0"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="What We Build">Lo que construimos</T>
              </span>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
                <T
                  en={
                    <>
                      Real projects, <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                        proven results
                      </span>
                    </>
                  }
                >
                  Proyectos reales, <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    resultados demostrados
                  </span>
                </T>
              </h2>
            </div>
            {/* Desktop: grid original */}
            <div className="hidden lg:grid lg:grid-cols-3 gap-8">
              {featuredProjects.map((p, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)", y: 35 }}
                  whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ type: "spring", stiffness: 45, damping: 14, delay: i * 0.15 }}
                  onClick={() => navigate(`/portafolio/${p.slug}`)}
                  onMouseMove={handleProjectMouseMove}
                  onMouseEnter={() => {
                    setCursorVisible(true);
                    setCursorLabel(language === "es" ? "Ver proyecto" : "View project");
                  }}
                  onMouseLeave={() => setCursorVisible(false)}
                  className="p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between space-y-6 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 md:cursor-none cursor-pointer bento-glow-hover will-change-transform opacity-0"
                >
                  {/* CONTENIDO ORIGINAL DE CADA CARD -- no cambiar nada adentro */}
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-widest">{p.type}</span>
                      <span className="px-2 py-0.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded text-[9px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                        <T en="Concept Demo">Prototipo</T>
                      </span>
                    </div>
                    <h3 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors">{p.title}</h3>
                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{p.desc}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {p.stack.map((tech, tIdx) => (
                        <span key={tIdx} className="px-2 py-0.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-md text-[10px] font-semibold text-[var(--color-text-secondary)] transition-colors group-hover:border-[var(--color-primary-base)]/20">{tech}</span>
                      ))}
                      {p.perfScore && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-[10px] font-bold text-emerald-500 transition-colors">
                          <Zap size={10} className="shrink-0" />
                          {p.perfScore}/100 {p.scoreLabel || <T en="Performance">Rendimiento</T>}
                        </span>
                      )}
                    </div>
                    <motion.div
                      className="pt-4 overflow-hidden rounded-lg"
                      initial={{ clipPath: "inset(0 100% 0 0)" }}
                      whileInView={{ clipPath: "inset(0 0% 0 0)" }}
                      viewport={{ once: true, amount: 0.3 }}
                      transition={{ duration: 0.8, delay: 0.2 + i * 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <div className="relative w-full overflow-hidden rounded-lg transition-transform duration-500 group-hover:scale-[1.03]">
                        {p.desktopImg ? (
                          <div className="relative w-full overflow-hidden rounded-xl bg-transparent h-[200px]">
                            {/* loading/decoding explícitos (11 de agosto): estos
                                PNG pesan 0.67-1.68 MB reales y se muestran a
                                200px de alto -- sin esto, el navegador los
                                decodificaba a resolución completa en el hilo
                                principal durante la carga inicial, justo cuando
                                el visitante intenta abrir el navbar. */}
                            <img
                              src={p.desktopImg}
                              alt={p.title}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-contain object-center rounded-lg"
                            />
                          </div>
                        ) : (
                          <div className="h-[200px] w-full bg-gradient-to-br from-[var(--color-surface-base)] to-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-subtle)]" />
                        )}
                      </div>
                    </motion.div>
                  </div>
                  <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-4">
                    <div className="flex justify-between items-center w-full pt-1">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors inline-flex items-center gap-1.5">
                        <T en="View Details">Ver Detalles</T>
                        <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform duration-300" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Mobile: carrusel automático */}
            <div className="lg:hidden relative">
              <div className="overflow-hidden rounded-[var(--radius-bento)]" style={{ height: '560px' }}>
                <AnimatePresence mode="wait">
                  {featuredProjects.map((p, i) =>
                    i === activeSlide ? (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                        onClick={() => navigate(`/portafolio/${p.slug}`)}
                        className="p-8 rounded-[var(--radius-bento)] glass-panel-lite flex flex-col justify-between space-y-6 cursor-pointer border border-[var(--color-border-subtle)] h-full w-full"
                      >
                        <div className="space-y-4">
                          <div className="flex justify-between items-start">
                            <span className="text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-widest">{p.type}</span>
                            <span className="px-2 py-0.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded text-[9px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                              <T en="Concept Demo">Prototipo</T>
                            </span>
                          </div>
                          <h3 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)]">{p.title}</h3>
                          <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{p.desc}</p>
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {p.stack.map((tech, tIdx) => (
                              <span key={tIdx} className="px-2 py-0.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-md text-[10px] font-semibold text-[var(--color-text-secondary)]">{tech}</span>
                            ))}
                            {p.perfScore && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/30 rounded-md text-[10px] font-bold text-emerald-500">
                                <Zap size={10} className="shrink-0" />
                                {p.perfScore}/100 {p.scoreLabel || <T en="Performance">Rendimiento</T>}
                              </span>
                            )}
                          </div>
                          <div className="pt-4 overflow-hidden rounded-lg">
                            <div className="relative w-full overflow-hidden rounded-lg">
                              {p.desktopImg ? (
                                <div className="relative w-full overflow-hidden rounded-xl bg-transparent h-[200px]">
                                  {/* Mismo criterio que la grilla de escritorio
                                      de arriba -- ver nota ahí. */}
                                  <img
                                    src={p.desktopImg}
                                    alt={p.title}
                                    loading="lazy"
                                    decoding="async"
                                    className="w-full h-full object-contain object-center rounded-lg"
                                  />
                                </div>
                              ) : (
                                <div className="h-[200px] w-full bg-gradient-to-br from-[var(--color-surface-base)] to-[var(--color-surface-elevated)] rounded-lg border border-[var(--color-border-subtle)]" />
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-4">
                          <div className="flex justify-between items-center w-full pt-1">
                            <span className="text-xs font-bold text-[var(--color-text-primary)] inline-flex items-center gap-1.5">
                              <T en="View Details">Ver Detalles</T>
                              <ArrowRight size={14} />
                            </span>
                          </div>
                        </div>
                      </motion.div>
                    ) : null
                  )}
                </AnimatePresence>
              </div>

              {/* Dots de navegación */}
              <div className="flex justify-center gap-2 mt-5">
                {featuredProjects.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveSlide(i)}
                    className={`transition-all duration-300 rounded-full ${
                      i === activeSlide
                        ? "w-6 h-2 bg-[var(--color-primary-base)]"
                        : "w-2 h-2 bg-[var(--color-border-strong)] hover:bg-[var(--color-primary-base)]/50"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>

          {/* Social Proof/Tech Stack */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)", y: 35 }}
            whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)", y: 0 }}
            viewport={{ once: true, amount: 0.15 }}
            transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 text-center opacity-0"
          >
            <div
              ref={techStackRef}
              className={`rounded-[var(--radius-bento)] p-6 sm:p-8 glass-panel backdrop-blur-md relative overflow-hidden bento-glow-hover transition-all duration-500 ${techStackExpanded ? "shadow-2xl shadow-purple-500/10 border-purple-500/30 font-medium" : ""}`}
            >
              {/* Dropdown toggle arrow in the top right corner */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTechStackExpanded(!techStackExpanded);
                }}
                className="absolute top-4 right-4 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] transition-all duration-300 z-20 focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)]/50 active:scale-95 cursor-pointer flex items-center justify-center"
                aria-label="Expand technologies"
              >
                <motion.div
                  animate={{ rotate: techStackExpanded ? 180 : 0 }}
                  transition={{ duration: 0.4, ease: "easeInOut" }}
                >
                  <ChevronDown size={18} />
                </motion.div>
              </button>

              {/* Header inside Tech Stack Section */}
              <div className="flex flex-col items-center mb-6 text-center max-w-xl mx-auto space-y-2">
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/5 px-2.5 py-1 rounded-full border border-[var(--color-primary-base)]/15">
                  <T en="STABLE & FAST CONSTITUTION">arquitectura premium</T>
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] leading-tight">
                  <T en="Continuous performance & premium user experiences built with standard tools. Tap to learn more.">
                    Rendimiento impecable y experiencias interactivas
                    optimizadas para conversión. Toca para saber más.
                  </T>
                </p>
              </div>

              <AnimatePresence mode="wait">
                {!techStackExpanded ? (
                  <motion.div
                    key="marquee"
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    transition={{ duration: 0.3 }}
                    className="relative w-full overflow-hidden py-4 cursor-pointer group/click"
                    onClick={() => setTechStackExpanded(true)}
                  >
                    {/* Horizontal Gradient Edge Masks for perfect visual fading */}
                    <div className="absolute left-0 top-0 h-full w-8 sm:w-16 bg-gradient-to-r from-[var(--color-surface-elevated)] to-transparent z-10 pointer-events-none" />
                    <div className="absolute right-0 top-0 h-full w-8 sm:w-16 bg-gradient-to-l from-[var(--color-surface-elevated)] to-transparent z-10 pointer-events-none" />

                    {/* Looping Track using High-Performance CSS Marquee */}
                    <div className="animate-marquee flex gap-0 w-max whitespace-nowrap">
                      {(() => {
                        const baseTechs = [
                          {
                            name: "Next.js",
                            icon: Zap,
                            rgb: "245, 158, 11",
                            hex: "#f59e0b",
                            slug: "nextjs-arquitectura-optima",
                          },
                          {
                            name: "React",
                            icon: Code,
                            rgb: "6, 182, 212",
                            hex: "#06b6d4",
                            slug: "react-libreria-componentes",
                          },
                          {
                            name: "Tailwind",
                            icon: Globe,
                            rgb: "56, 189, 248",
                            hex: "#38bdf8",
                            slug: "tailwind-diseno-rapido",
                          },
                          {
                            name: "Cloud",
                            icon: Cloud,
                            rgb: "249, 115, 22",
                            hex: "#f97316",
                            slug: "cloud-firebase-servidores",
                          },
                          {
                            name: "Vite",
                            icon: Rocket,
                            rgb: "168, 85, 247",
                            hex: "#a855f7",
                            slug: "vite-desarrollo-veloz",
                          },
                          {
                            name: "TypeScript",
                            icon: ShieldCheck,
                            rgb: "37, 99, 235",
                            hex: "#2563eb",
                            slug: "typescript-codigo-seguro",
                          },
                          {
                            name: "Gemini",
                            icon: Cpu,
                            rgb: "99, 102, 241",
                            hex: "#6366f1",
                            slug: "gemini-inteligencia-artificial",
                          },
                          {
                            name: "Grok",
                            icon: Brain,
                            rgb: "107, 114, 128",
                            hex: "#6b7280",
                            slug: "grok-modelo-ia",
                          },
                          {
                            name: "SEO Core",
                            icon: BarChart3,
                            rgb: "16, 185, 129",
                            hex: "#10b981",
                            slug: "seo-core-optimizacion-busqueda",
                          },
                          {
                            name: "Framer",
                            icon: Layers,
                            rgb: "219, 39, 119",
                            hex: "#db2777",
                            slug: "framer-motion-animaciones",
                          },
                          {
                            name: "SSL",
                            icon: Lock,
                            rgb: "20, 184, 166",
                            hex: "#14b8a6",
                            slug: "ssl-seguridad-certificado",
                          },
                        ];

                        const trackItems = [...baseTechs, ...baseTechs];

                        const renderTrack = (trackIdx: number) => (
                          <div
                            key={trackIdx}
                            className="flex gap-4 sm:gap-6 pr-4 sm:pr-6 shrink-0 whitespace-nowrap"
                          >
                            {trackItems.map((tech, idx) => {
                              const IconComponent = tech.icon;
                              const uniqueKey = `${trackIdx}-${idx}`;
                              return (
                                <motion.div
                                  key={uniqueKey}
                                  whileHover={{ scale: 1.05, y: -2 }}
                                  whileTap={{ scale: 0.95 }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    navigate(`/blog/${tech.slug}`, { state: { fromLanding: true } });
                                  }}
                                  style={{
                                    backgroundColor: `rgba(${tech.rgb}, 0.1)`,
                                    borderColor: `rgba(${tech.rgb}, 0.4)`,
                                    boxShadow: `0 0 10px rgba(${tech.rgb}, 0.35), 0 0 28px rgba(${tech.rgb}, 0.18)`,
                                  }}
                                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer select-none group/tech shrink-0 whitespace-nowrap min-w-max"
                                >
                                  {/* Era un motion.div con repeat:Infinity -- con
                                      48 íconos en el marquee eso son 48
                                      animaciones de JS reescribiendo estilos
                                      en cada cuadro, para siempre. Ver la nota
                                      completa en index.css
                                      (@keyframes tech-icon-pulse). */}
                                  <div
                                    style={{
                                      color: tech.hex,
                                      animationDelay: `${(idx % 5) * 0.15}s`,
                                    }}
                                    className="shrink-0 tech-icon-pulse"
                                  >
                                    <IconComponent size={18} />
                                  </div>
                                  <span className="font-bold text-xs tracking-tight text-[var(--color-text-primary)] transition-colors duration-200 whitespace-nowrap">
                                    {tech.name}
                                  </span>
                                </motion.div>
                              );
                            })}
                          </div>
                        );

                        return [renderTrack(1), renderTrack(2)];
                      })()}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="expanded"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.4, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto py-6 px-2 sm:px-3">
                      {(() => {
                        const baseTechs = [
                          {
                            name: "Next.js",
                            icon: Zap,
                            rgb: "245, 158, 11",
                            hex: "#f59e0b",
                            catEs: "Framework",
                            catEn: "Framework",
                            slug: "nextjs-arquitectura-optima",
                          },
                          {
                            name: "React",
                            icon: Code,
                            rgb: "6, 182, 212",
                            hex: "#06b6d4",
                            catEs: "Librería UI",
                            catEn: "UI Library",
                            slug: "react-libreria-componentes",
                          },
                          {
                            name: "Tailwind",
                            icon: Globe,
                            rgb: "56, 189, 248",
                            hex: "#38bdf8",
                            catEs: "Diseño CSS",
                            catEn: "CSS Design",
                            slug: "tailwind-diseno-rapido",
                          },
                          {
                            name: "Cloud",
                            icon: Cloud,
                            rgb: "249, 115, 22",
                            hex: "#f97316",
                            catEs: "Nube / Firebase",
                            catEn: "Cloud / Firebase",
                            slug: "cloud-firebase-servidores",
                          },
                          {
                            name: "Vite",
                            icon: Rocket,
                            rgb: "168, 85, 247",
                            hex: "#a855f7",
                            catEs: "Construcción",
                            catEn: "Build Tool",
                            slug: "vite-desarrollo-veloz",
                          },
                          {
                            name: "TypeScript",
                            icon: ShieldCheck,
                            rgb: "37, 99, 235",
                            hex: "#2563eb",
                            catEs: "Lenguaje",
                            catEn: "Language",
                            slug: "typescript-codigo-seguro",
                          },
                          {
                            name: "Gemini",
                            icon: Cpu,
                            rgb: "99, 102, 241",
                            hex: "#6366f1",
                            catEs: "Modelo IA",
                            catEn: "AI Model",
                            slug: "gemini-inteligencia-artificial",
                          },
                          {
                            name: "Grok",
                            icon: Brain,
                            rgb: "107, 114, 128",
                            hex: "#6b7280",
                            catEs: "Modelo IA",
                            catEn: "AI Model",
                            slug: "grok-modelo-ia",
                          },
                          {
                            name: "SEO Core",
                            icon: BarChart3,
                            rgb: "16, 185, 129",
                            hex: "#10b981",
                            catEs: "Optimización",
                            catEn: "Optimization",
                            slug: "seo-core-optimizacion-busqueda",
                          },
                          {
                            name: "Framer",
                            icon: Layers,
                            rgb: "219, 39, 119",
                            hex: "#db2777",
                            catEs: "Animación",
                            catEn: "Animation",
                            slug: "framer-motion-animaciones",
                          },
                          {
                            name: "SSL",
                            icon: Lock,
                            rgb: "20, 184, 166",
                            hex: "#14b8a6",
                            catEs: "Seguridad",
                            catEn: "SSL Security",
                            slug: "ssl-seguridad-certificado",
                          },
                        ];
                        return baseTechs.map((tech, idx) => {
                          const IconComponent = tech.icon;
                          return (
                            <motion.a
                              key={tech.name}
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                navigate(`/blog/${tech.slug}`, { state: { fromLanding: true } });
                              }}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.3 }}
                              whileHover={{ scale: 1.05, y: -4 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                backgroundColor: `rgba(${tech.rgb}, 0.1)`,
                                borderColor: `rgba(${tech.rgb}, 0.4)`,
                                boxShadow: `0 0 10px rgba(${tech.rgb}, 0.35), 0 0 28px rgba(${tech.rgb}, 0.18)`,
                              }}
                              className="flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 group/tech cursor-pointer text-center relative overflow-hidden"
                            >
                              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/tech:opacity-100 transition-opacity duration-300" style={{ color: tech.hex }}>
                                <ArrowRight size={12} className="-rotate-45" />
                              </div>
                              {/* Mismo caso que el marquee de arriba: pulso
                                  infinito movido de framer-motion a CSS puro.
                                  Ver nota en index.css. */}
                              <div
                                style={{
                                  color: tech.hex,
                                  animationDelay: `${idx * 0.2}s`,
                                }}
                                className="mb-3 tech-icon-pulse-soft"
                              >
                                <IconComponent size={24} />
                              </div>
                              <span className="font-bold text-xs sm:text-sm tracking-tight text-[var(--color-text-primary)] transition-colors duration-200">
                                {tech.name}
                              </span>
                              <span className="text-[10px] text-[var(--color-text-tertiary)] mt-1.5 font-mono uppercase tracking-wider">
                                <T en={tech.catEn}>{tech.catEs}</T>
                              </span>
                            </motion.a>
                          );
                        });
                      })()}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>


        </div>
      </main>

      {/* Why Polaris -- comparativa real vs. otras agencias (movida a la home, antes solo en /servicios) */}
      <WhyPolaris />

      {/* Caso real -- reemplaza los testimonios inventados */}
      <Testimonials />

      {/* Pricing Preview Section */}
      <section className="py-24 px-6 md:px-12 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 bg-gradient-to-b from-[var(--color-primary-base)]/3 via-transparent to-transparent pointer-events-none" />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Header */}
          <div className="text-center mb-16 space-y-4">
            <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)] inline-block">
              <T en="Transparent Pricing">Inversión Transparente</T>
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
              <T en="The right plan">El paquete correcto</T>
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)]">
                <T en="for every stage">para cada etapa</T>
              </span>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base max-w-md mx-auto">
              <T en="Fixed prices, no hidden costs. One payment, your site live in weeks.">
                Precios fijos, sin costos ocultos. Un pago y tu sitio en línea en semanas.
              </T>
            </p>
            {/* Ancla de valor: agencias promedio $2,000-$8,000 por sitio (ecommerce $5,000-$30,000+),
                dato real de mercado 2026 -- ver auditoría CRO. Nunca se nombra una agencia específica. */}
            <p className="text-[var(--color-text-tertiary)] text-xs max-w-lg mx-auto pt-1">
              <T en="The average agency charges $2,000–$8,000 for a professional website (ecommerce projects run $5,000–$30,000+). Our fixed prices start at a fraction of that.">
                El promedio de una agencia es de $2,000–$8,000 por un sitio profesional
                (proyectos e-commerce llegan a $5,000–$30,000+). Nuestros precios fijos
                arrancan en una fracción de eso.
              </T>
            </p>
          </div>

          {isOfferActive && (
            <div className="mb-10 rounded-2xl bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/30 px-4 py-4 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center">
              <span className="font-bold text-sm md:text-base text-[var(--color-text-primary)]">
                <T en="Launch Offer: Get a 25% discount through the entire first month!">
                  Oferta de lanzamiento: ¡todo el primer mes con 25% de descuento!
                </T>
              </span>
              <CountdownPill targetDate={targetDate} onExpire={() => setIsOfferActive(false)} />
            </div>
          )}

          {/* Plans Grid */}
          <div ref={pricingRef} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

            {/* Destello */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 45, damping: 14 }}
              style={{ y: destelloY }}
              className="glass-panel border border-[var(--color-border-subtle)] rounded-2xl p-7 flex flex-col gap-5 hover:border-amber-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-amber-500 mb-2 block">
                    <T en="Flash Package">Paquete Destello</T>
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {isOfferActive && (
                      <span className="text-base font-display font-medium line-through text-[var(--color-text-tertiary)] opacity-60">
                        $299
                      </span>
                    )}
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-display font-black text-[var(--color-text-primary)]">
                        ${isOfferActive ? Math.round(299 * 0.75) : 299}
                      </span>
                      <span className="text-[var(--color-text-tertiary)] text-sm mb-1">USD</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <Zap size={18} className="text-amber-500" />
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                <T en="One page designed to convert visitors into clients from the first scroll.">
                  Una página diseñada para convertir visitantes en clientes desde el primer scroll.
                </T>
              </p>
              <ul className="space-y-2.5 flex-1">
                {[
                  { es: "Diseño exclusivo y responsivo", en: "Exclusive responsive design" },
                  { es: "Botón de WhatsApp integrado", en: "WhatsApp button integrated" },
                  { es: "SEO On-Page incluido", en: "On-Page SEO included" },
                  { es: "Entrega en 1–2 semanas", en: "Delivered in 1–2 weeks" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
                    <T en={item.en}>{item.es}</T>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs font-bold text-amber-500 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                <ShieldCheck size={14} className="shrink-0" />
                <T en="30-day post-launch warranty">30 días de garantía post-lanzamiento</T>
              </div>
              <button
                onClick={() => navigate("/cotizar")}
                className="w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-500 text-sm font-bold hover:bg-amber-500/10 transition-all"
              >
                <T en="Start with this plan →">Comenzar con este plan →</T>
              </button>
            </motion.div>

            {/* Constelación -- destacado */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.1 }}
              style={{ y: constelaY }}
              className="glass-panel border border-[var(--color-primary-base)]/50 rounded-2xl p-7 flex flex-col gap-5 relative shadow-lg shadow-[var(--color-primary-base)]/10 md:-translate-y-4"
            >
              {/* Most popular badge */}
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                <span className="bg-[var(--color-primary-base)] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg shadow-[var(--color-primary-base)]/30 whitespace-nowrap">
                  <T en="Most Popular">Más Popular</T>
                </span>
              </div>
              <div className="flex items-start justify-between pt-2">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-primary-base)] mb-2 block">
                    <T en="Constellation Package">Paquete Constelación</T>
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {isOfferActive && (
                      <span className="text-base font-display font-medium line-through text-[var(--color-text-tertiary)] opacity-60">
                        $699
                      </span>
                    )}
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-display font-black text-[var(--color-text-primary)]">
                        ${isOfferActive ? Math.round(699 * 0.75) : 699}
                      </span>
                      <span className="text-[var(--color-text-tertiary)] text-sm mb-1">USD</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 flex items-center justify-center">
                  <Orbit size={18} className="text-[var(--color-primary-base)]" />
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                <T en="Complete corporate site up to 5 pages with AI chatbot, blog and Analytics.">
                  Sitio corporativo completo de hasta 5 páginas con chatbot IA, blog y Analytics.
                </T>
              </p>
              <ul className="space-y-2.5 flex-1">
                {[
                  { es: "Todo lo del Paquete Destello", en: "Everything in Flash Plan" },
                  { es: "Hasta 5 páginas independientes", en: "Up to 5 independent pages" },
                  { es: "Chatbot 24/7 con IA", en: "24/7 AI Chatbot" },
                  { es: "SEO Técnico + Search Console", en: "Technical SEO + Search Console" },
                  { es: "Google Analytics 4", en: "Google Analytics 4" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <CheckCircle2 size={14} className="text-[var(--color-primary-base)] shrink-0" />
                    <T en={item.en}>{item.es}</T>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-primary-base)] bg-[var(--color-primary-base)]/10 border border-[var(--color-primary-base)]/20 rounded-lg px-3 py-2">
                <ShieldCheck size={14} className="shrink-0" />
                <T en="60-day post-launch warranty">60 días de garantía post-lanzamiento</T>
              </div>
              <button
                onClick={() => navigate("/cotizar")}
                className="w-full py-2.5 rounded-xl bg-[var(--color-primary-base)] text-white text-sm font-bold hover:bg-[var(--color-primary-base)]/90 transition-all shadow-lg shadow-[var(--color-primary-base)]/20"
              >
                <T en="Start with this plan →">Comenzar con este plan →</T>
              </button>
            </motion.div>

            {/* Nova */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, filter: "blur(6px)" }}
              whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.2 }}
              style={{ y: novaY }}
              className="glass-panel border border-[var(--color-border-subtle)] rounded-2xl p-7 flex flex-col gap-5 hover:border-violet-500/30 transition-colors group"
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-violet-400 mb-2 block">
                    <T en="Nova Package">Paquete Nova</T>
                  </span>
                  <div className="flex flex-col gap-0.5">
                    {isOfferActive && (
                      <span className="text-base font-display font-medium line-through text-[var(--color-text-tertiary)] opacity-60">
                        $1,299
                      </span>
                    )}
                    <div className="flex items-end gap-1">
                      <span className="text-4xl font-display font-black text-[var(--color-text-primary)]">
                        ${isOfferActive ? Math.round(1299 * 0.75).toLocaleString() : "1,299"}
                      </span>
                      <span className="text-[var(--color-text-tertiary)] text-sm mb-1">USD</span>
                    </div>
                  </div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                  <Eclipse size={18} className="text-violet-400" />
                </div>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                <T en="Complete sales platform with payments, admin panel and AI tool included.">
                  Plataforma de ventas completa con pagos, panel admin y herramienta IA incluida.
                </T>
              </p>
              <ul className="space-y-2.5 flex-1">
                {[
                  { es: "Todo lo del Paquete Constelación", en: "Everything in Constellation Plan" },
                  { es: "E-commerce + Stripe y PayPal", en: "E-commerce + Stripe & PayPal" },
                  { es: "Panel admin personalizado", en: "Custom admin panel" },
                  { es: "Schema Markup para Google", en: "Schema Markup for Google" },
                  { es: "1 herramienta IA incluida", en: "1 AI tool included" },
                ].map((item, i) => (
                  <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
                    <CheckCircle2 size={14} className="text-violet-400 shrink-0" />
                    <T en={item.en}>{item.es}</T>
                  </li>
                ))}
              </ul>
              <div className="flex items-center gap-2 text-xs font-bold text-violet-400 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2">
                <ShieldCheck size={14} className="shrink-0" />
                <T en="90-day priority warranty">90 días de garantía prioritaria</T>
              </div>
              <button
                onClick={() => navigate("/cotizar")}
                className="w-full py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-bold hover:bg-violet-500/10 transition-all"
              >
                <T en="Start with this plan →">Comenzar con este plan →</T>
              </button>
            </motion.div>
          </div>

          {/* Bottom note */}
          <div className="text-center space-y-3">
            <p className="text-xs text-[var(--color-text-tertiary)]">
              <T en="All packages include a domain up to $15 USD (1st year), SSL and managed hosting.">
                Todos los paquetes incluyen dominio web hasta $15 USD (1er año), SSL y hosting administrado.
              </T>
            </p>
            <button
              onClick={() => navigate("/servicios")}
              className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] transition-colors"
            >
              <T en="Compare all features in detail">Comparar todas las funcionalidades en detalle</T>
            </button>
          </div>
        </div>
      </section>

      {/* Polaris Solutions Section */}
      <section className="py-24 px-6 md:px-12" id="soluciones">
        <div className="max-w-6xl mx-auto">
          <div className="max-w-3xl mx-auto text-center space-y-5 mb-12">
            <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
              <T en="The Polaris ecosystem">El ecosistema Polaris</T>
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight">
              <T en="More ways to move your business forward">Más formas de hacer crecer tu negocio</T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-base md:text-lg leading-relaxed">
              <T en="Web design is our core. Around it, we build focused solutions for the moments that come after your website is ready.">
                El diseño web es nuestro núcleo. A su alrededor creamos soluciones enfocadas para lo que viene después de tener una web lista.
              </T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 50, damping: 16 }}
              className="md:col-span-2 rounded-[2rem] border border-[var(--color-primary-base)]/25 bg-gradient-to-br from-indigo-500/[0.08] via-transparent to-[var(--color-primary-base)]/[0.08] p-7 md:p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-8"
            >
              <div className="max-w-2xl space-y-4">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]">
                  <T en="Our core service">Nuestro servicio principal</T>
                </span>
                <h3 className="text-2xl md:text-3xl font-display font-black tracking-tight">
                  <T en="Design and development for digital experiences that convert">Diseño y desarrollo de experiencias digitales que convierten</T>
                </h3>
                <p className="text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed">
                  <T en="Landing pages, corporate websites and e-commerce built around your goals — with original code, strategy and a clear path to launch.">
                    Landing pages, webs corporativas y e-commerce construidos alrededor de tus objetivos, con código original, estrategia y un camino claro hasta el lanzamiento.
                  </T>
                </p>
              </div>
              <Link
                to="/cotizar"
                className="shrink-0 inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-[var(--color-primary-base)]/20 transition-all hover:-translate-y-0.5 hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/40"
              >
                <T en="Quote your project">Cotiza tu proyecto</T>
                <ArrowRight size={17} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 50, damping: 16, delay: 0.08 }}
              className="rounded-[2rem] border border-[#16C8C1]/30 bg-gradient-to-br from-[#16C8C1]/[0.13] via-transparent to-cyan-500/[0.04] p-7 flex flex-col gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[#16C8C1]/30 bg-[#16C8C1]/10 text-[#0faaa4] dark:text-[#5ee7df]">
                  <Globe size={24} />
                </div>
                <span className="rounded-full border border-[#16C8C1]/30 bg-[#16C8C1]/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-[#0faaa4] dark:text-[#5ee7df]">
                  <T en="Local presence">Presencia local</T>
                </span>
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="text-2xl font-display font-black tracking-tight">Local Lift</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <T en="A focused way to improve how your business appears, communicates and gets discovered locally — without handing over your Google account.">
                    Una forma enfocada de mejorar cómo aparece, comunica y se descubre tu negocio a nivel local, sin entregarnos el acceso a tu cuenta de Google.
                  </T>
                </p>
              </div>
              <Link
                to="/local-lift"
                className="inline-flex items-center gap-2 text-sm font-black text-[#0faaa4] dark:text-[#5ee7df] transition-transform hover:translate-x-1"
              >
                <T en="Explore Local Lift">Conoce Local Lift</T>
                <ArrowRight size={16} />
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ type: "spring", stiffness: 50, damping: 16, delay: 0.16 }}
              className="rounded-[2rem] border border-teal-400/30 bg-gradient-to-br from-teal-400/[0.12] via-transparent to-emerald-500/[0.04] p-7 flex flex-col gap-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-teal-400/30 bg-teal-400/10 text-teal-500 dark:text-teal-300">
                  <Zap size={24} />
                </div>
                <span className="rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[9px] font-black uppercase tracking-widest text-teal-600 dark:text-teal-300">
                  <T en="Automation">Automatización</T>
                </span>
              </div>
              <div className="space-y-3 flex-1">
                <h3 className="text-2xl font-display font-black tracking-tight">Polaris Flow</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <T en="Focused automation systems that connect the repetitive parts of your business so your team can spend more time moving forward.">
                    Sistemas de automatización enfocados que conectan las partes repetitivas de tu negocio para que tu equipo pueda avanzar con más tiempo y claridad.
                  </T>
                </p>
              </div>
              <Link
                to="/flow"
                className="inline-flex items-center gap-2 text-sm font-black text-teal-600 dark:text-teal-300 transition-transform hover:translate-x-1"
              >
                <T en="Explore Polaris Flow">Explora Polaris Flow</T>
                <ArrowRight size={16} />
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-6 md:px-12" id="faq">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col items-center text-center gap-6 mb-8">
            <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
              <T en="Common Questions">Dudas Comunes</T>
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">
              <T en="Frequently Asked Questions">Preguntas Frecuentes</T>
            </h2>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                onClick={() => toggleFaq(i)}
                className={`p-6 rounded-2xl glass-panel transition-colors cursor-pointer ${
                  openFaqIndex === i
                    ? "!border-[var(--color-primary-base)] shadow-lg"
                    : "hover:!border-[var(--color-primary-base)]/50"
                }`}
              >
                <div className="flex justify-between items-center">
                  <h3 className="font-bold text-lg">{faq.q}</h3>
                  <motion.div
                    animate={{ rotate: openFaqIndex === i ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronDown
                      size={18}
                      className={
                        openFaqIndex === i
                          ? "text-[var(--color-primary-base)]"
                          : "text-[var(--color-text-tertiary)]"
                      }
                    />
                  </motion.div>
                </div>
                <AnimatePresence>
                  {openFaqIndex === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-sm text-[var(--color-text-secondary)] pt-4 leading-relaxed">
                        {faq.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-[var(--color-surface-base)] relative overflow-hidden border-t border-[var(--color-border-subtle)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-primary-base)]/5 opacity-50 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 flex flex-col items-center">
          <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
            <T en="Ready to Start?">¿Listo para comenzar?</T>
          </span>
          <h2 className="text-[var(--color-text-primary)] font-display font-black tracking-tight max-w-2xl mx-auto leading-[1.1]">
            <span className="block text-4xl md:text-6xl mb-1">
              <T en="Let's build something">Construyamos algo</T>
            </span>
            <span className="block text-4xl md:text-6xl text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] pb-1">
              <T en="Extraordinary">Extraordinario</T>
            </span>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm md:text-lg max-w-lg mx-auto leading-relaxed">
            <T en="Plan your project today and get a personalized proposal in less than 24 hours. No obligation.">
              Planifica tu proyecto hoy y recibe una propuesta a la medida en menos
              de 24 horas.
            </T>
          </p>
          <div className="pt-4">
            <div className="relative group shrink-0 inline-flex">
              {/* Static subtle glow */}
              <div className="absolute inset-0 rounded-xl bg-[var(--color-primary-base)]/20 pointer-events-none" style={{ filter: "blur(8px)" }} />

              {/* Periodic ping ring */}
              <div className="absolute inset-0 rounded-xl border border-[var(--color-primary-base)]/35 pointer-events-none animate-cta-ping" />
              <RippleButton
                onClick={() => navigate("/cotizar")}
                className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-sm sm:text-base md:text-lg hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

                <Rocket
                  size={20}
                  className="group-hover:rotate-12 group-hover:-translate-y-1 transition-transform duration-300"
                />

                <T en="Plan your Project">Planifica tu Proyecto</T>

                <ArrowRight
                  size={20}
                  className="ml-1 group-hover:translate-x-2 transition-transform duration-300"
                />
              </RippleButton>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Portfolio Cursor */}
      <motion.div
        className="hidden md:flex fixed top-0 left-0 z-[9999] pointer-events-none items-center justify-center"
        style={{
          x: cursorX,
          y: cursorY,
          translateX: "-50%",
          translateY: "-50%",
        }}
        animate={{
          scale: cursorVisible ? 1 : 0,
          opacity: cursorVisible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--color-primary-base)] text-white text-xs font-black uppercase tracking-wider shadow-lg shadow-[var(--color-primary-base)]/30">
          <span>{cursorLabel}</span>
          <ArrowRight size={12} />
        </div>
      </motion.div>

      <Footer />
    </div>
  );
}
