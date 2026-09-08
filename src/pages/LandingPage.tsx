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
  Rocket,
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
import Carousel from "../components/Carousel";
import TextLoop from "../components/TextLoop";

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
      id: "lumina-sky-concept",
      title: "Lúmina Sky",
      slug: "lumina-sky-concept",
      desktopImg: "/screenshots/lumina-sky-desktop.svg",
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
      id: "nexus-real-estate",
      title: "Nexus Realty",
      slug: "nexus-real-estate",
      desktopImg: "/screenshots/nexus-realty-desktop.png",
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
      id: "chroma-store",
      title: "Chroma Tech Store",
      slug: "chroma-store",
      desktopImg: "/screenshots/chroma-store-desktop.svg",
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
    {
      id: "vitality-clinic",
      title: "Vitality Med",
      slug: "vitality-clinic",
      desktopImg: "/screenshots/vitality-clinic-desktop.svg",
      type: <T en="Health · Appointment Portal">Salud · Portal de Citas</T>,
      desc: (
        <T en="Multi-specialty clinic with doctor profiles, health blog, real appointment booking, and its own admin panel.">
          Clínica multidisciplinaria con perfiles de médicos, blog de salud,
          agendado real de citas y panel administrativo propio.
        </T>
      ),
      stack: ["React", "TypeScript", "React Router", "Firebase"],
      colorClass: "from-emerald-500/20 to-teal-500/5 hover:border-emerald-500/40",
    },
    {
      id: "sabor-autentico",
      title: "La Reja",
      slug: "sabor-autentico",
      desktopImg: "/screenshots/la-reja-desktop.svg",
      type: <T en="Gastronomy · Digital Experience">Gastronomía · Experiencia Digital</T>,
      desc: (
        <T en="Premium digital experience for a contemporary Dominican restaurant, with a live menu, tasting routes, and budget-based menu planning.">
          Experiencia digital premium para un restaurante dominicano de cocina
          contemporánea, con carta viva, rutas de degustación y menú a medida.
        </T>
      ),
      stack: ["React", "TypeScript", "Vite", "Firebase"],
      colorClass: "from-orange-500/20 to-amber-500/5 hover:border-orange-500/40",
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
                  <span className="glass-badge text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-300 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-800/40">
                    <T en="Conversion">Conversión</T>
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black tracking-tight group-hover:text-[var(--color-primary-base)] transition-colors">
                    Landing Pages
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    <T en="Conversion-focused design to turn visitors into real clients from day one.">
                      Diseño centrado en conversión para convertir visitantes en clientes reales desde el primer día.
                    </T>
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-[var(--color-border-subtle)] w-full">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-indigo-500" />
                  <T en="Lead capture funnel">Embudo de captación de leads</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-indigo-500" />
                  <T en="100% responsive layout">Diseño 100% responsivo</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-indigo-500" />
                  <T en="WhatsApp integrated button">Botón de WhatsApp integrado</T>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* E-commerce Card */}
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
                  <span className="glass-badge text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-300 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    <T en="Sell 24/7">Vende 24/7</T>
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black tracking-tight group-hover:text-[var(--color-primary-base)] transition-colors">
                    E-commerce
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    <T en="Scalable, secure, and optimized online sales platforms to multiply your income 24/7.">
                      Plataformas de venta online escalables, seguras y optimizadas para multiplicar ingresos 24/7.
                    </T>
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-[var(--color-border-subtle)] w-full">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <T en="Stripe & payment systems">Pasarelas Stripe y PayPal</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <T en="Intuitive product manager">Gestor intuitivo de inventario</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <T en="Frictionless checkouts">Checkouts sin fricción</T>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Corporativas Card */}
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
                  <span className="glass-badge text-[9px] font-extrabold uppercase tracking-widest text-purple-600 dark:text-purple-300 px-2.5 py-1 rounded-full border border-purple-200 dark:border-purple-800/40">
                    <T en="Authority">Autoridad</T>
                  </span>
                </div>
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-black tracking-tight group-hover:text-[var(--color-primary-base)] transition-colors">
                    <T en="Corporate">Corporativas</T>
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    <T en="Solid and elegant digital identity that positions your brand as an undisputed leader in its respective market.">
                      Identidad digital sólida y elegante que posiciona a tu marca como referente de su sector.
                    </T>
                  </p>
                </div>
              </div>

              <div className="space-y-3 pt-6 border-t border-[var(--color-border-subtle)] w-full">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <T en="Premium custom layout">Diseño a medida premium</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <T en="Self-manageable section & blog">Sección y blog autogestionable</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <T en="Enterprise light-speed loading">Velocidad de carga instantánea</T>
                </div>
              </div>
            </Link>
          </motion.div>

          {/* Quick Metrics Bar */}
          <div className="md:col-span-2 lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-6 rounded-[var(--radius-bento)] glass-panel flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)]">
                <Zap size={24} />
              </div>
              <div>
                <span className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                  <T en="2 Weeks">2 Semanas</T>
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                  <T en="Landing Page Delivery">Entrega de Landing Page</T>
                </p>
              </div>
            </div>
            <div className="p-6 rounded-[var(--radius-bento)] glass-panel flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)]">
                <Code size={24} />
              </div>
              <div>
                <span className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                  100%
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                  <T en="Custom code, no templates">Código propio, sin plantillas</T>
                </p>
              </div>
            </div>
            <div className="p-6 rounded-[var(--radius-bento)] glass-panel flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)]">
                <ShieldCheck size={24} />
              </div>
              <div>
                <span className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                  24/7
                </span>
                <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                  <T en="Post-launch Support">Soporte post-lanzamiento</T>
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Audience / Tiers Section */}
        <section className="py-16 md:py-24 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
              <T en="Our Clients">Nuestros Clientes</T>
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter">
              <T en={<>Custom solutions <br className="hidden md:block" /> for every stage</>}>
                Soluciones a medida <br className="hidden md:block" /> para cada etapa
              </T>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              className="p-6 sm:p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] font-mono">
                    <T en="STARTING PHASE">FASE INICIAL</T>
                  </span>
                  <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500 font-black text-xs">
                    01
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold">
                    <T en="Entrepreneurs & Startups">Emprendedores y Startups</T>
                  </h3>
                  <p className="text-xs font-mono text-[var(--color-primary-base)]">
                    <T en='"You&apos;re launching your idea"'>"Estás lanzando tu idea"</T>
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    <T en="You need a professional digital presence that inspires trust from day one.">
                      Necesitas una presencia digital profesional que inspire confianza desde el primer día.
                    </T>
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-2 mt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-[var(--color-primary-base)]" />
                  <T en="Conversion optimized Landing Page">Landing Page optimizada para conversión</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-[var(--color-primary-base)]" />
                  <T en="Domain setup & hosting">Configuración de dominio y hosting</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-[var(--color-primary-base)]" />
                  <T en="Initial client capturing funnel">Embudo de captación inicial</T>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="p-6 sm:p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] font-mono">
                    <T en="GROWTH">CRECIMIENTO</T>
                  </span>
                  <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-500 font-black text-xs">
                    02
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold">
                    <T en="SMEs & Established Businesses">PYMEs y Negocios Establecidos</T>
                  </h3>
                  <p className="text-xs font-mono text-emerald-500">
                    <T en='"Your business exists but your site doesn&apos;t sell"'>"Tu negocio existe pero tu web no vende"</T>
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    <T en="You have clients but your site doesn't reflect them. It's time for a website up to par with what you offer.">
                      Tienes clientes pero tu web no lo refleja. Es momento de una plataforma al nivel de lo que ofreces.
                    </T>
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-2 mt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <T en="Premium redesign & clean catalog">Rediseño premium y catálogo claro</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <T en="CRM or WhatsApp integrations">Integraciones CRM o WhatsApp</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-emerald-500" />
                  <T en="High-converting multi-page layout">Arquitectura multi-página de conversión</T>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="p-6 sm:p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] font-mono">
                    <T en="E-COMMERCE">VENTA DIRECTA</T>
                  </span>
                  <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-500 font-black text-xs">
                    03
                  </div>
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-display font-bold">
                    <T en="E-commerce">Comercio y Reservas</T>
                  </h3>
                  <p className="text-xs font-mono text-purple-500">
                    <T en='"You want to sell online"'>"Quieres vender o reservar sin intermediarios"</T>
                  </p>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                    <T en="From simple catalogs to high-volume stores. We build the platform your business needs to sell 24/7.">
                      Desde catálogos hasta motores de reservas. Creamos la plataforma que tu negocio necesita para facturar 24/7.
                    </T>
                  </p>
                </div>
              </div>
              <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-2 mt-6">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <T en="Agile cart & frictionless checkout">Checkout ágil sin fricciones</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <T en="Stripe or custom payment gateways">Pasarelas locales e internacionales</T>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)]">
                  <CheckCircle2 size={14} className="text-purple-500" />
                  <T en="Self-manageable admin products center">Panel autogestionable de pedidos</T>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Process Section */}
        <section id="proceso" className="py-16 md:py-24 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
              <T en="Our Process">Nuestro Proceso</T>
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter">
              <T en={<>How it <br className="hidden md:block" /> works</>}>
                Cómo trabajamos <br className="hidden md:block" /> paso a paso
              </T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed">
              <T en="Three simple steps to transform your vision into a high-performance digital reality.">
                Tres pasos claros para transformar tu visión en una plataforma de alto rendimiento.
              </T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className="glass-panel p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform"
            >
              <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                <span className="text-5xl font-display font-black text-[var(--color-primary-base)]">
                  1
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] px-3 py-1 rounded-full text-[var(--color-text-secondary)]">
                  <T en="2 MINUTES">2 MINUTOS</T>
                </span>
              </div>
              <h3 className="text-xl font-display font-bold">
                <T en="Plan">Planificas</T>
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                <T en="Tell us about your project in our smart planner and get a custom strategy plan.">
                  Cuéntanos sobre tu negocio en nuestro planificador y recibe una propuesta estratégica personalizada.
                </T>
              </p>
              <div className="pt-4 border-t border-[var(--color-border-subtle)] w-full text-xs text-[var(--color-text-tertiary)] space-y-1">
                <p><T en="Adaptive instant pricing">Presupuesto claro y adaptado</T></p>
                <p><T en="Free professional advice">Asesoría profesional sin costo</T></p>
                <p><T en="No commitment required">Sin compromisos iniciales</T></p>
              </div>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.15 }}
              className="glass-panel p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform"
            >
              <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                <span className="text-5xl font-display font-black text-[var(--color-primary-base)]">
                  2
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] px-3 py-1 rounded-full text-[var(--color-text-secondary)]">
                  <T en="LIVE PREVIEW">VISTA PREVIA</T>
                </span>
              </div>
              <h3 className="text-xl font-display font-bold">
                <T en="We Design">Diseñamos</T>
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                <T en="We craft fully customized interfaces and code with state-of-the-art web technologies for elite results.">
                  Estructuramos interfaces modernas y código original con foco absoluto en conversión y velocidad.
                </T>
              </p>
              <div className="pt-4 border-t border-[var(--color-border-subtle)] w-full text-xs text-[var(--color-text-tertiary)] space-y-1">
                <p><T en="Premium custom design concepts">Diseño original sin plantillas</T></p>
                <p><T en="Private styling updates">Revisiones interactivas</T></p>
                <p><T en="Continuous flexible reviews">Ajustes directos con feedback</T></p>
              </div>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="glass-panel p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover will-change-transform"
            >
              <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                <span className="text-5xl font-display font-black text-[var(--color-primary-base)]">
                  3
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] px-3 py-1 rounded-full text-[var(--color-text-secondary)]">
                  <T en="SEO & ULTRA SPEED">LANZAMIENTO</T>
                </span>
              </div>
              <h3 className="text-xl font-display font-bold">
                <T en="We Launch">Lanzamos</T>
              </h3>
              <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                <T en="We launch your website meticulously configured for top performance, maximum speed, and ready to welcome users.">
                  Desplegamos tu plataforma con SEO, velocidad de carga óptima y WhatsApp listo para recibir clientes.
                </T>
              </p>
              <div className="pt-4 border-t border-[var(--color-border-subtle)] w-full text-xs text-[var(--color-text-tertiary)] space-y-1">
                <p><T en="Top-tier load speed optimizations">Carga instantánea en móviles</T></p>
                <p><T en="Standard technical structure configuration">Configuración de analítica y Google</T></p>
                <p><T en="Administrative access & full control">Propiedad total de tu código</T></p>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Selected Work Carousel */}
        <section id="portafolio" className="py-16 md:py-24 space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
              <T en="What We Build">Lo que Construimos</T>
            </span>
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter">
              <T en={<>Real projects, <br className="hidden md:block" /> proven results</>}>
                Proyectos reales, <br className="hidden md:block" /> resultados tangibles
              </T>
            </h2>
          </div>

          <Carousel projects={featuredProjects} />
        </section>

        {/* Interactive Tech Stack Grid */}
        <section className="py-12 border-y border-[var(--color-border-subtle)] overflow-hidden">
          <TextLoop />
        </section>

        {/* Why Choose Polaris */}
        <WhyPolaris />

        {/* Testimonials */}
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
                  <T en="High-converting landing page designed to capture leads from day one and position your business on Google Maps.">
                    Landing page de alta conversión para captar prospectos desde el primer día y posicionar tu negocio en Google Maps.
                  </T>
                </p>
                <ul className="space-y-2.5 flex-1">
                  {[
                    { es: "Diseño ultra-rápido enfocado en conversión (CRO)", en: "Ultra-fast conversion-focused design (CRO)" },
                    { es: "Botón y embudo directo a WhatsApp optimizado", en: "Optimized WhatsApp direct sales button" },
                    { es: "Optimización en Google Maps y SEO Local", en: "Google Maps & Local SEO setup" },
                    { es: "Entrega garantizada en 1–2 semanas", en: "Guaranteed 1–2 week delivery" },
                    { es: "30 días de garantía post-lanzamiento", en: "30-day post-launch warranty" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
                      <CheckCircle2 size={14} className="text-amber-500 shrink-0" />
                      <T en={item.en}>{item.es}</T>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/servicios")}
                  className="w-full py-2.5 rounded-xl border border-amber-500/30 text-amber-500 text-sm font-bold hover:bg-amber-500/10 transition-all"
                >
                  <T en="See details →">Ver detalles →</T>
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
                  <T en="Complete digital presence with a 24/7 AI smart assistant to qualify leads and automate appointment booking.">
                    Tu presencia digital completa con asistente inteligente 24/7 para calificar prospectos y agendar citas automáticamente.
                  </T>
                </p>
                <ul className="space-y-2.5 flex-1">
                  {[
                    { es: "Todo lo del Paquete Destello", en: "Everything in Flash Plan" },
                    { es: "Arquitectura web corporativa multi-sección", en: "Multi-section corporate web architecture" },
                    { es: "Asistente de IA 24/7 para atención y captación", en: "24/7 AI Lead & Support Assistant" },
                    { es: "Agendamiento automático de citas y reuniones", en: "Automated meeting and appointment booking" },
                    { es: "SEO Técnico + Google Analytics 4", en: "Technical SEO + Google Analytics 4" },
                    { es: "60 días de garantía post-lanzamiento", en: "60-day post-launch warranty" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
                      <CheckCircle2 size={14} className="text-[var(--color-primary-base)] shrink-0" />
                      <T en={item.en}>{item.es}</T>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/servicios")}
                  className="w-full py-2.5 rounded-xl bg-[var(--color-primary-base)] text-white text-sm font-bold hover:bg-[var(--color-primary-base)]/90 transition-all shadow-lg shadow-[var(--color-primary-base)]/20"
                >
                  <T en="See details →">Ver detalles →</T>
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
                  <T en="Direct sales or booking engine with payment gateways and custom admin dashboard to scale revenue 24/7.">
                    Motor de ventas o reservas directas con pasarelas de pago y panel autogestionable para escalar tu facturación 24/7.
                  </T>
                </p>
                <ul className="space-y-2.5 flex-1">
                  {[
                    { es: "Todo lo del Paquete Constelación", en: "Everything in Constellation Plan" },
                    { es: "Motor de ventas o reservas (sin comisiones extra)", en: "Direct sales or booking engine (zero platform fees)" },
                    { es: "Pasarelas de pago en línea (Locales e Internacionales)", en: "Online payment gateways (Local & International)" },
                    { es: "Panel admin para pedidos, reservas y catálogo", en: "Custom admin panel for orders, bookings & catalog" },
                    { es: "Herramienta de IA integrada para acelerar ventas", en: "Integrated AI sales acceleration tool" },
                    { es: "90 días de garantía prioritaria", en: "90-day priority warranty" },
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-2.5 text-sm text-[var(--color-text-secondary)]">
                      <CheckCircle2 size={14} className="text-violet-400 shrink-0" />
                      <T en={item.en}>{item.es}</T>
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => navigate("/servicios")}
                  className="w-full py-2.5 rounded-xl border border-violet-500/30 text-violet-400 text-sm font-bold hover:bg-violet-500/10 transition-all"
                >
                  <T en="See details →">Ver detalles →</T>
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

        {/* The Polaris Ecosystem Solutions Section */}
        <section id="soluciones" className="py-24 px-6 md:px-12 bg-gradient-to-b from-transparent via-[var(--color-surface-highlight)]/40 to-transparent relative border-t border-[var(--color-border-subtle)]">
          <div className="max-w-6xl mx-auto space-y-16">
            <div className="text-center space-y-4 max-w-2xl mx-auto">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
                <T en="The Polaris ecosystem">El ecosistema Polaris</T>
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight">
                <T en={<>More ways to move <br className="hidden md:block" /> your business forward</>}>
                  Más formas de hacer avanzar <br className="hidden md:block" /> tu negocio
                </T>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed">
                <T en="Web design is our core. Around it, we build focused solutions for the moments that come after your website is ready.">
                  El diseño web es nuestro núcleo. A su alrededor, construimos soluciones enfocadas para lo que tu negocio necesita después de tener su web lista.
                </T>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Card 1: Core Web Design */}
              <div className="p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between space-y-6 hover:border-[var(--color-primary-base)] transition-all group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] flex items-center justify-center">
                    <Globe size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-[var(--color-text-tertiary)] block">
                    <T en="Our core service">Servicio principal</T>
                  </span>
                  <h3 className="text-xl font-display font-bold">
                    <T en="Design and development for digital experiences that convert">
                      Diseño y desarrollo web enfocado en conversión
                    </T>
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <T en="Landing pages, corporate websites and e-commerce built around your goals — with original code, strategy and a clear path to launch.">
                      Landing pages, webs corporativas y e-commerce construidos alrededor de tus objetivos comerciales — con código original, estrategia y entrega en semanas.
                    </T>
                  </p>
                </div>
                <Link
                  to="/cotizar"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--color-primary-base)] hover:underline"
                >
                  <T en="Quote your project">Cotizar proyecto</T> <ArrowRight size={14} />
                </Link>
              </div>

              {/* Card 2: Local Lift */}
              <div className="p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between space-y-6 hover:border-emerald-500/50 transition-all group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <BarChart3 size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-emerald-500/80 block">
                    <T en="Local presence">Presencia local</T>
                  </span>
                  <h3 className="text-xl font-display font-bold">
                    Local Lift
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <T en="A focused way to improve how your business appears, communicates and gets discovered locally — without handing over your Google account.">
                      Optimización de perfil de Google Business y SEO local para que los clientes de tu zona te encuentren primero en Google Maps.
                    </T>
                  </p>
                </div>
                <Link
                  to="/local-lift"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-500 hover:underline"
                >
                  <T en="Explore Local Lift">Conocer Local Lift</T> <ArrowRight size={14} />
                </Link>
              </div>

              {/* Card 3: Polaris Flow */}
              <div className="p-8 rounded-[var(--radius-bento)] glass-panel flex flex-col justify-between space-y-6 hover:border-purple-500/50 transition-all group">
                <div className="space-y-4">
                  <div className="w-12 h-12 rounded-2xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
                    <Cpu size={24} />
                  </div>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-purple-500/80 block">
                    <T en="Automation">Automatización</T>
                  </span>
                  <h3 className="text-xl font-display font-bold">
                    Polaris Flow
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                    <T en="Focused automation systems that connect the repetitive parts of your business so your team can spend more time moving forward.">
                      Sistemas de automatización con IA y WhatsApp que conectan las tareas repetitivas para que tu equipo ahorre horas y no pierda ventas.
                    </T>
                  </p>
                </div>
                <Link
                  to="/flow"
                  className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-500 hover:underline"
                >
                  <T en="Explore Polaris Flow">Conocer Polaris Flow</T> <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section id="faq" className="py-24 px-6 md:px-12 max-w-4xl mx-auto">
          <div className="text-center mb-16 space-y-4">
            <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
              <T en="Common Questions">Dudas Habituales</T>
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tight">
              <T en="Frequently Asked Questions">Preguntas Frecuentes</T>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div
                key={index}
                className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] overflow-hidden transition-colors"
              >
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-base md:text-lg focus-visible:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    size={20}
                    className={`shrink-0 transition-transform duration-300 text-[var(--color-text-tertiary)] ${
                      openFaqIndex === index ? "rotate-180 text-[var(--color-primary-base)]" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaqIndex === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-6 text-sm md:text-base text-[var(--color-text-secondary)] leading-relaxed border-t border-[var(--color-border-subtle)]/40 pt-4">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <FinalCTA />
      </main>

      <Footer />
    </div>
  );
}
