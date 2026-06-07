import React, { useState, useEffect, useRef, lazy, Suspense } from "react";
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
  Rocket,
  CheckCircle2,
  ShieldCheck,
  Lock,
  Sparkles,
  Cpu,
  Brain,
  Database,
  Cloud,
} from "lucide-react";
import { motion, AnimatePresence, useInView } from "framer-motion"; // Tree-shaking: solo se usan estos 3 exports
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactSection from "../components/ContactSection";
import Logo from "../components/Logo";
import MockupFrame from "../components/MockupFrame";
import { T, useLanguage } from "../context/LanguageContext";

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

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const { language } = useLanguage();
  const [activeSection, setActiveSection] = useState<string>("inicio");

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
      faq: {
        esTitle: "Preguntas Frecuentes | Soporte y Tarifas Web",
        esDesc:
          "Dudas resueltas sobre tiempos de entrega, hosting, mantenimiento SEO, facilidades de pago y planes de desarrollo desde $299 USD.",
        enTitle: "Frequently Asked Questions | Web Pricing & Support FAQs",
        enDesc:
          "Get answers regarding turnaround times, hosting, SEO maintenance, flexible payment plans, and custom estimates starting at $299 USD.",
      },
      contacto: {
        esTitle: "Hablemos de tu Proyecto | Planificador de Proyectos",
        esDesc:
          "Define tu propuesta en minutos con nuestro planificador interactivo. Sin compromisos ni costes ocultos y agenda inmediata.",
        enTitle: "Let's Build Your Project | Interactive Project Planner",
        enDesc:
          "Complete our dynamic project planner in under 2 minutes and unlock detailed deliverables, rates, and launch schedules.",
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
      "faq",
      "contacto",
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

  const [techStackExpanded, setTechStackExpanded] = useState(false);
  const techStackRef = useRef<HTMLDivElement>(null);

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
      type: <T en="Tourism · Immersive Web">Turismo · Web Inmersiva</T>,
      desc: (
        <T en="Luxury boutique hotel prototype with a custom booking engine and fine-tuned interactive animations.">
          Prototipo de hotel boutique de lujo con motor de reservas y
          animaciones fluidas de alta fidelidad.
        </T>
      ),
      stack: ["React", "Framer Motion", "Vite", "Tailwind CSS"],
      metrics: [
        {
          label: <T en="Google PageSpeed">Google PageSpeed</T>,
          value: "99/100",
        },
        { label: <T en="Load Time">Carga Inicial</T>, value: "0.4s" },
        {
          label: <T en="Engagement">Interactividad</T>,
          value: <T en="Excellent">Excelente</T>,
        },
      ],
      colorClass: "from-cyan-500/20 to-indigo-500/5 hover:border-cyan-500/40",
    },
    {
      title: "Nexus Realty",
      slug: "nexus-real-estate",
      type: <T en="Real Estate · Platform">Inmobiliaria · Plataforma</T>,
      desc: (
        <T en="Real estate platform catalog showing rapid, zero-lag filters to browse elite properties on mobile.">
          Catálogo inmobiliario interactivo optimizado para un filtrado
          ultra-rápido de propiedades de lujo.
        </T>
      ),
      stack: ["React", "TypeScript", "Tailwind CSS"],
      metrics: [
        {
          label: <T en="Search Engine">Buscador Inteligente</T>,
          value: <T en="Instant">Instantáneo</T>,
        },
        { label: <T en="Mobile Perf">Puntaje Celular</T>, value: "100/100" },
        { label: <T en="Speed Index">Índice velocidad</T>, value: "0.8s" },
      ],
      colorClass: "from-amber-500/20 to-orange-500/5 hover:border-amber-500/40",
    },
    {
      title: "Chroma Tech Store",
      slug: "chroma-store",
      type: <T en="E-commerce · Technology">E-commerce · Tecnología</T>,
      desc: (
        <T en="High-performance automated digital store prototype with smart cart, AI assistant and secure gateway.">
          Tienda online de tecnología con pasarela de pago, buscador inteligente
          con IA y carrito persistente.
        </T>
      ),
      stack: ["Next.js", "Zustand", "Stripe (UI)", "Tailwind CSS"],
      metrics: [
        {
          label: <T en="Payment Flow">Trámite Pago</T>,
          value: <T en="100% Secure">100% Seguro</T>,
        },
        { label: <T en="Uptime">Uptime</T>, value: "24/7/365" },
        {
          label: <T en="AI Assistant">Asistente de IA</T>,
          value: <T en="Integrated">Integrado</T>,
        },
      ],
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
      q: <T en="Do you work with SEO?">¿Trabajan con SEO?</T>,
      a: (
        <T en="Absolutely. All our websites are born with an optimized on-page SEO structure.">
          Totalmente. Todas nuestras webs nacen con una estructura optimizada
          para motores de búsqueda (SEO On-page).
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
      q: <T en="Do you offer payment plans?">¿Ofrecen facilidades de pago?</T>,
      a: (
        <T en="Yes, we work with a 50% upfront and 50% upon launch structure. For large projects like e-commerce, we can structure milestone payments.">
          Sí, trabajamos con un esquema de 50% al iniciar el proyecto y 50% al
          momento del lanzamiento. Para proyectos grandes como e-commerce,
          podemos estructurar pagos por hitos.
        </T>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <style>{`
        @keyframes ctaPulse {
          0%, 100% {
            box-shadow: 0 0 0px 0px rgba(99, 102, 241, 0);
          }
          50% {
            box-shadow: 0 0 20px 6px rgba(99, 102, 241, 0.5);
          }
        }
      `}</style>
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-10 py-4 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          {/* Main Hero Card */}
          <motion.div
            id="inicio"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)] p-5 pb-6 md:p-16 border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] flex flex-col justify-end relative overflow-hidden group bento-glow min-h-[400px] sm:min-h-[500px]"
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-[-150px] sm:right-[-250px] md:right-[-200px] opacity-10 group-hover:opacity-20 group-hover:-translate-x-4 transition-all duration-500 pointer-events-none">
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
              <span className="text-[var(--color-primary-base)] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] font-body">
                Polaris Web Studio | Global
              </span>
              <h1 className="text-[2.5rem] sm:text-5xl md:text-8xl font-display font-black leading-[1.1] md:leading-[1] tracking-tighter">
                <T en="We digitize the future of your business today">
                  Digitalizamos el futuro de tu negocio hoy
                </T>
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base md:text-xl max-w-xl leading-relaxed">
                <T en="We develop high-impact web platforms designed specifically to attract clients and close sales. Digital innovation for the global market.">
                  Desarrollamos plataformas web de alto impacto diseñadas
                  específicamente para atraer clientes y cerrar ventas.
                  Innovación digital para el mercado global.
                </T>
              </p>
              <div className="pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 md:gap-6">
                  <div className="relative group shrink-0">
                    {/* High-Performance, GPU-Composited glowing pulse ring */}
                    <div className="absolute inset-0 rounded-xl bg-[var(--color-primary-base)]/50 pointer-events-none animate-cta-glow-pulse" style={{ filter: "blur(6px)" }} />
                    <button
                      onClick={() => navigate("/cotizar")}
                      className="group relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-sm sm:text-base md:text-lg hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 w-full justify-center"
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
                    </button>
                  </div>
                  <div className="flex flex-col text-left space-y-0.5">
                    <span className="text-xs font-black text-[var(--color-primary-base)] tracking-wider uppercase font-mono">
                      <T en="From $299 USD">Proyectos desde $299 USD</T>
                    </span>
                    <span className="text-[10px] sm:text-xs text-[var(--color-text-secondary)] font-medium">
                      <T en="Agile delivery · Fully customized coding">
                        Entrega ágil · Código 100% original
                      </T>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Landing Pages Card */}
          <motion.div
            id="servicios"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover flex flex-col"
          >
            <Link
              to="/servicios"
              className="flex flex-col p-6 sm:p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between w-full"
            >
              <div className="w-full space-y-6">
                <div className="flex justify-between items-center w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                    <Layers size={24} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-indigo-600 dark:text-indigo-300 bg-indigo-100/60 dark:bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-200 dark:border-indigo-500/20 shrink-0">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover flex flex-col"
          >
            <Link
              to="/servicios"
              className="flex flex-col p-6 sm:p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between w-full"
            >
              <div className="w-full space-y-6">
                <div className="flex justify-between items-center w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                    <ShoppingCart size={24} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-emerald-600 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
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
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="md:col-span-2 lg:col-span-1 rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover flex flex-col"
          >
            <Link
              to="/servicios"
              className="flex flex-col p-6 sm:p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between w-full"
            >
              <div className="w-full space-y-6">
                <div className="flex justify-between items-center w-full">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                    <Briefcase size={24} />
                  </div>
                  <span className="text-[9px] font-extrabold uppercase tracking-widest text-violet-600 dark:text-violet-300 bg-violet-100/60 dark:bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-500/20 shrink-0">
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
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)] py-4 md:py-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-center relative overflow-hidden bento-glow min-h-[100px]"
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="md:col-span-2 lg:col-span-3 py-20 space-y-12"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Our Clients">Nuestros Clientes</T>
              </span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">
                <T en="Custom solutions for every stage">
                  Soluciones a medida para cada etapa
                </T>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <motion.div
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                className="p-6 sm:p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover"
              >
                <div className="space-y-5">
                  {/* Card Header with Icon and Highlight Badge */}
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-12 h-12 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:border-[var(--color-primary-base)] group-hover:scale-110 transition-all duration-300">
                      <Rocket size={24} />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full border border-blue-500/20 shrink-0">
                      <T en="FASE INICIAL">FASE INICIAL</T>
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
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-6 sm:p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover"
              >
                <div className="space-y-5">
                  {/* Card Header with Icon and Highlight Badge */}
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-12 h-12 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:border-[var(--color-primary-base)] group-hover:scale-110 transition-all duration-300">
                      <Briefcase size={24} />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 shrink-0">
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
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-6 sm:p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover"
              >
                <div className="space-y-5">
                  {/* Card Header with Icon and Highlight Badge */}
                  <div className="flex items-center justify-between w-full">
                    <div className="relative w-12 h-12 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:border-[var(--color-primary-base)] group-hover:scale-110 transition-all duration-300">
                      <ShoppingCart size={24} />
                    </div>
                    <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-600 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            className="md:col-span-2 lg:col-span-3 py-16 space-y-12 border-t border-b border-[var(--color-border-subtle)]/50 my-12"
          >
            <div className="flex flex-col items-center text-center gap-4">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Our Process">Nuestro Proceso</T>
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter">
                <T en="How it works">¿Cómo funciona?</T>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-sm max-w-md mx-auto leading-relaxed">
                <T en="Three simple steps to transform your vision into a high-performance digital reality.">
                  Tres pasos simples para transformar tu idea en una realidad
                  digital de alto rendimiento.
                </T>
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
              {/* Connector line for desktop */}
              <div className="hidden md:block absolute top-[2.5rem] left-[15%] right-[15%] h-[1px] bg-gradient-to-r from-[var(--color-primary-base)]/50 via-[var(--color-primary-base)]/20 to-[var(--color-primary-base)]/50 z-0" />

              {/* Connector line for mobile (timeline style behind numbers) */}
              <div className="absolute left-[2.5rem] top-12 bottom-12 w-[1px] bg-gradient-to-b from-[var(--color-primary-base)]/40 via-[var(--color-primary-base)]/10 to-[var(--color-primary-base)]/40 z-0 md:hidden" />

              {/* Step 1 */}
              <motion.div
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover"
              >
                {/* Number and Badge Header Row */}
                <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute inset-x-[-6px] inset-y-[-6px] bg-[var(--color-primary-base)]/10 rounded-full blur group-hover:bg-[var(--color-primary-base)]/25 transition-all duration-300" />
                    <div className="relative w-12 h-12 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center font-mono text-lg font-black text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                      1
                    </div>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-emerald-600 dark:text-emerald-300 bg-emerald-100/60 dark:bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-200 dark:border-emerald-500/20 shrink-0">
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
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.15 }}
                className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover"
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
                    <T en="Diseñamos">Diseñamos</T>
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
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] p-6 sm:p-8 rounded-[var(--radius-bento)] flex flex-col items-start md:items-center text-left md:text-center space-y-4 relative z-10 group hover:border-[var(--color-primary-base)] transition-[border-color,background-color,box-shadow] duration-300 bento-glow-hover"
              >
                {/* Number and Badge Header Row */}
                <div className="flex items-center justify-between w-full md:flex-col md:gap-3">
                  <div className="relative shrink-0">
                    <div className="absolute inset-x-[-6px] inset-y-[-6px] bg-[var(--color-primary-base)]/10 rounded-full blur group-hover:bg-[var(--color-primary-base)]/25 transition-all duration-300" />
                    <div className="relative w-12 h-12 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center font-mono text-lg font-black text-[var(--color-primary-base)] group-hover:scale-110 group-hover:border-[var(--color-primary-base)] transition-all duration-300">
                      3
                    </div>
                  </div>
                  <span className="text-[9px] uppercase tracking-widest font-extrabold text-violet-600 dark:text-violet-300 bg-violet-100/60 dark:bg-violet-500/10 px-2.5 py-1 rounded-full border border-violet-200 dark:border-violet-500/20 shrink-0">
                    <T en="SEO & ULTRA SPEED">ALTO IMPACTO</T>
                  </span>
                </div>

                <div className="space-y-2 w-full">
                  <h3 className="text-xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors">
                    <T en="Lanzamos">Lanzamos</T>
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="md:col-span-2 lg:col-span-3 py-20 space-y-12"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="What We Build">Lo que construimos</T>
              </span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">
                <T en="Real projects, proven results">
                  Proyectos reales, resultados demostrados
                </T>
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {featuredProjects.map((p, i) => (
                <div
                  key={i}
                  onClick={() => navigate(`/portafolio/${p.slug}`)}
                  className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-6 group hover:border-[var(--color-primary-base)] transition-all duration-300 cursor-pointer bento-glow-hover"
                >
                  <div className="space-y-4">
                    <div className="flex justify-between items-start">
                      <span className="text-[var(--color-text-secondary)] text-[10px] font-bold uppercase tracking-widest">
                        {p.type}
                      </span>
                      <span className="px-2 py-0.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded text-[9px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
                        <T en="Concept Demo">Prototipo</T>
                      </span>
                    </div>

                    <h3 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors">
                      {p.title}
                    </h3>

                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                      {p.desc}
                    </p>

                    {/* Tech Stack Badges */}
                    <div className="flex flex-wrap gap-1.5 pt-2">
                      {p.stack.map((tech, tIdx) => (
                        <span
                          key={tIdx}
                          className="px-2 py-0.5 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-md text-[10px] font-semibold text-[var(--color-text-secondary)] transition-colors group-hover:border-[var(--color-primary-base)]/20"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>

                    {/* Interactive Mockup Preview */}
                    <div className="pt-4 overflow-hidden rounded-lg">
                      <div className="relative w-full overflow-hidden rounded-lg transition-transform duration-500 group-hover:scale-[1.03]">
                        {p.slug === "nexus-real-estate" ||
                        p.slug === "chroma-store" ? (
                          <div className="h-[160px] w-full overflow-hidden relative flex justify-center items-start bg-gradient-to-br from-[var(--color-surface-base)] to-[var(--color-surface-elevated)] pt-6 rounded-lg border border-[var(--color-border-subtle)]">
                            <div className="scale-[0.45] origin-top translate-y-[-10px] transition-transform duration-500 group-hover:scale-[0.48]">
                              <MockupFrame type="mobile" projectSlug={p.slug} />
                            </div>
                            {/* Fade overlay since it's elegantly cropped to half-height */}
                            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[var(--color-surface-elevated)] to-transparent pointer-events-none z-10" />
                          </div>
                        ) : (
                          <MockupFrame type="browser" projectSlug={p.slug} />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Real Numbers Metrics */}
                  <div className="pt-6 border-t border-[var(--color-border-subtle)] space-y-4">
                    <div className="grid grid-cols-3 gap-2 text-center bg-[var(--color-surface-base)] p-3 rounded-xl border border-[var(--color-border-subtle)]/50">
                      {p.metrics.map((metric, mIdx) => (
                        <div
                          key={mIdx}
                          className="flex flex-col justify-center"
                        >
                          <span className="text-[9px] text-[var(--color-text-secondary)] uppercase font-bold min-h-[36px] flex items-center justify-center leading-tight tracking-wider mb-1.5">
                            {metric.label}
                          </span>
                          <span className="text-xs sm:text-sm font-black font-mono text-[var(--color-primary-base)] leading-none">
                            {metric.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center w-full pt-1">
                      <span className="text-xs font-bold text-[var(--color-text-primary)] group-hover:text-[var(--color-primary-base)] transition-colors inline-flex items-center gap-1.5">
                        <T en="View Details">Ver Detalles</T>
                        <ArrowRight
                          size={14}
                          className="group-hover:translate-x-1 transition-transform duration-300"
                        />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Social Proof/Tech Stack */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 text-center"
          >
            <div
              ref={techStackRef}
              className={`rounded-[var(--radius-bento)] p-6 sm:p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] backdrop-blur-md relative overflow-hidden bento-glow-hover transition-all duration-500 ${techStackExpanded ? "shadow-2xl shadow-purple-500/10 border-purple-500/30 font-medium" : ""}`}
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
                          },
                          {
                            name: "React",
                            icon: Code,
                            rgb: "88, 196, 220",
                            hex: "#58c4dc",
                          },
                          {
                            name: "Tailwind",
                            icon: Globe,
                            rgb: "56, 189, 248",
                            hex: "#38bdf8",
                          },
                          {
                            name: "Cloud",
                            icon: Cloud,
                            rgb: "14, 165, 233",
                            hex: "#0ea5e9",
                          },
                          {
                            name: "Vite",
                            icon: Rocket,
                            rgb: "189, 52, 254",
                            hex: "#bd34fe",
                          },
                          {
                            name: "TypeScript",
                            icon: ShieldCheck,
                            rgb: "49, 120, 198",
                            hex: "#3178c6",
                          },
                          {
                            name: "Gemini",
                            icon: Cpu,
                            rgb: "66, 133, 244",
                            hex: "#4285f4",
                          },
                          {
                            name: "Grok",
                            icon: Brain,
                            rgb: "var(--color-grok-rgb)",
                            hex: "var(--color-grok)",
                          },
                          {
                            name: "PostgreSQL",
                            icon: Database,
                            rgb: "51, 103, 145",
                            hex: "#336791",
                          },
                          {
                            name: "SEO Core",
                            icon: BarChart3,
                            rgb: "16, 185, 129",
                            hex: "#10b981",
                          },
                          {
                            name: "Framer",
                            icon: Layers,
                            rgb: "168, 85, 247",
                            hex: "#a855f7",
                          },
                          {
                            name: "SSL",
                            icon: Lock,
                            rgb: "6, 182, 212",
                            hex: "#06b6d4",
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
                                  style={{
                                    backgroundColor: `rgba(${tech.rgb}, 0.08)`,
                                    borderColor: `rgba(${tech.rgb}, 0.25)`,
                                    boxShadow: `0 0 15px rgba(${tech.rgb}, 0.12)`,
                                  }}
                                  className="flex items-center gap-3 px-4 py-2.5 rounded-xl border transition-all duration-300 cursor-pointer select-none group/tech shrink-0 whitespace-nowrap min-w-max"
                                >
                                  <motion.div
                                    animate={{
                                      opacity: [0.7, 1, 0.7],
                                      scale: [0.95, 1, 0.95],
                                    }}
                                    transition={{
                                      repeat: Infinity,
                                      duration: 2.5,
                                      ease: "easeInOut",
                                      delay: (idx % 5) * 0.15,
                                    }}
                                    style={{ color: tech.hex }}
                                    className="shrink-0"
                                  >
                                    <IconComponent size={18} />
                                  </motion.div>
                                  <span className="font-bold text-xs tracking-tight text-[var(--color-text-primary)] group-hover/tech:text-white transition-colors duration-200 whitespace-nowrap">
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
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4 max-w-4xl mx-auto py-6">
                      {(() => {
                        const baseTechs = [
                          {
                            name: "Next.js",
                            icon: Zap,
                            rgb: "245, 158, 11",
                            hex: "#f59e0b",
                            catEs: "Framework",
                            catEn: "Framework",
                          },
                          {
                            name: "React",
                            icon: Code,
                            rgb: "88, 196, 220",
                            hex: "#58c4dc",
                            catEs: "Librería UI",
                            catEn: "UI Library",
                          },
                          {
                            name: "Tailwind",
                            icon: Globe,
                            rgb: "56, 189, 248",
                            hex: "#38bdf8",
                            catEs: "Diseño CSS",
                            catEn: "CSS Design",
                          },
                          {
                            name: "Cloud",
                            icon: Cloud,
                            rgb: "14, 165, 233",
                            hex: "#0ea5e9",
                            catEs: "Nube / Firebase",
                            catEn: "Cloud / Firebase",
                          },
                          {
                            name: "Vite",
                            icon: Rocket,
                            rgb: "189, 52, 254",
                            hex: "#bd34fe",
                            catEs: "Construcción",
                            catEn: "Build Tool",
                          },
                          {
                            name: "TypeScript",
                            icon: ShieldCheck,
                            rgb: "49, 120, 198",
                            hex: "#3178c6",
                            catEs: "Lenguaje",
                            catEn: "Language",
                          },
                          {
                            name: "Gemini",
                            icon: Cpu,
                            rgb: "66, 133, 244",
                            hex: "#4285f4",
                            catEs: "Modelo IA",
                            catEn: "AI Model",
                          },
                          {
                            name: "Grok",
                            icon: Brain,
                            rgb: "var(--color-grok-rgb)",
                            hex: "var(--color-grok)",
                            catEs: "Modelo IA",
                            catEn: "AI Model",
                          },
                          {
                            name: "PostgreSQL",
                            icon: Database,
                            rgb: "51, 103, 145",
                            hex: "#336791",
                            catEs: "Base de Datos",
                            catEn: "Database",
                          },
                          {
                            name: "SEO Core",
                            icon: BarChart3,
                            rgb: "16, 185, 129",
                            hex: "#10b981",
                            catEs: "Optimización",
                            catEn: "Optimization",
                          },
                          {
                            name: "Framer",
                            icon: Layers,
                            rgb: "168, 85, 247",
                            hex: "#a855f7",
                            catEs: "Animación",
                            catEn: "Animation",
                          },
                          {
                            name: "SSL",
                            icon: Lock,
                            rgb: "6, 182, 212",
                            hex: "#06b6d4",
                            catEs: "Seguridad",
                            catEn: "SSL Security",
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
                              }}
                              initial={{ opacity: 0, y: 15 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: idx * 0.05, duration: 0.3 }}
                              whileHover={{ scale: 1.05, y: -4 }}
                              whileTap={{ scale: 0.95 }}
                              style={{
                                backgroundColor: `rgba(${tech.rgb}, 0.08)`,
                                borderColor: `rgba(${tech.rgb}, 0.25)`,
                                boxShadow: `0 0 15px rgba(${tech.rgb}, 0.12)`,
                              }}
                              className="flex flex-col items-center justify-center p-5 rounded-2xl border transition-all duration-300 group/tech cursor-pointer text-center relative overflow-hidden"
                            >
                              <div className="absolute top-2.5 right-2.5 opacity-0 group-hover/tech:opacity-100 transition-opacity duration-300 text-[var(--color-primary-base)]">
                                <ArrowRight size={12} className="-rotate-45" />
                              </div>
                              <motion.div
                                animate={{
                                  opacity: [0.8, 1, 0.8],
                                  scale: [0.97, 1, 0.97],
                                }}
                                transition={{
                                  repeat: Infinity,
                                  duration: 3,
                                  ease: "easeInOut",
                                  delay: idx * 0.2,
                                }}
                                style={{ color: tech.hex }}
                                className="mb-3"
                              >
                                <IconComponent size={24} />
                              </motion.div>
                              <span className="font-bold text-xs sm:text-sm tracking-tight text-[var(--color-text-primary)] group-hover/tech:text-white transition-colors duration-200">
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

          {/* FAQ Section */}
          <div
            id="faq"
            className="md:col-span-2 lg:col-span-3 py-20 space-y-12"
          >
            <div className="flex flex-col items-center text-center gap-6 mb-8">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
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
                  className={`p-6 rounded-2xl bg-[var(--color-surface-elevated)] border transition-colors cursor-pointer ${
                    openFaqIndex === i
                      ? "border-[var(--color-primary-base)] shadow-lg"
                      : "border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50"
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
        </div>
      </main>

      <ContactSection />

      {/* Bottom CTA Section */}
      <section className="py-24 px-6 md:px-12 bg-[var(--color-surface-base)] relative overflow-hidden border-t border-[var(--color-border-subtle)]">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[var(--color-primary-base)]/5 opacity-50 pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center space-y-6 relative z-10 flex flex-col items-center">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
            <T en="Ready to Start?">¿Listo para comenzar?</T>
          </span>
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight max-w-2xl mx-auto">
            <T en="Let's build a digital experience that drives results.">
              Construyamos una experiencia digital que multiplique tus
              resultados.
            </T>
          </h2>
          <p className="text-[var(--color-text-secondary)] text-sm md:text-lg max-w-lg mx-auto leading-relaxed">
            <T en="Plan your project today and get a personalized proposal in less than 24 hours. No obligation.">
              Planifica tu proyecto hoy y recibe una propuesta a la medida en menos
              de 24 horas.
            </T>
          </p>
          <div className="pt-4">
            <div className="relative group shrink-0 inline-flex">
              {/* High-Performance, GPU-Composited glowing pulse ring */}
              <div className="absolute inset-0 rounded-xl bg-[var(--color-primary-base)]/50 pointer-events-none animate-cta-glow-pulse" style={{ filter: "blur(6px)" }} />
              <button
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
              </button>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
