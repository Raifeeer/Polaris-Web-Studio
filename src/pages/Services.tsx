import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import {
  Rocket,
  ShoppingCart,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  BrainCircuit,
  Palette,
  Wrench,
  Headphones,
  BarChart3,
  Search,
  Database,
  ChevronDown,
  Coins,
  RefreshCw,
  ArrowLeft,
  Pointer,
  Bot,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import Testimonials from "../components/Testimonials";
import WhyPolaris from "../components/WhyPolaris";
import FinalCTA from "../components/FinalCTA";
import CountdownPill from "../components/CountdownPill";
import { useDocumentTitle, useJsonLd } from "../hooks/useDocumentTitle";
import { T, useLanguage } from "../context/LanguageContext";
import AISparkleIcon from "../components/AISparkleIcon";

// "Statistic Up" de Akar Icons (no existe en lucide-react)
function StatisticUpIcon({
  size = 20,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      <path d="m7 14l4-4l4 4l6-6" />
      <path d="M18 8h3v3" />
    </svg>
  );
}

interface PlanItem {
  id: string;
  name: React.ReactNode;
  titleColor: string;
  desc: React.ReactNode;
  originalPrice: number;
  sections?: {
    title: React.ReactNode;
    icon: React.ComponentType<any>;
    items: React.ReactNode[];
  }[];
  inheritedFrom?: React.ReactNode;
  extraFeatures?: React.ReactNode[];
  highlight: boolean;
  prefix?: React.ReactNode;
  badge?: React.ReactNode;
  badgeIcon?: boolean;
  footnote?: React.ReactNode;
}

function PlanCard({
  plan,
  isOfferActive,
  navigate,
}: {
  plan: any;
  isOfferActive: boolean;
  navigate: any;
  key?: any;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      whileHover={{ y: -5 }}
      id={`plan-card-${plan.id}`}
      style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      className={`p-8 rounded-[var(--radius-bento)] border transition-[border-color,background-color,box-shadow] duration-300 min-h-[500px] relative ${
        plan.highlight
          ? "bg-[var(--color-surface-elevated)] border-[var(--color-primary-base)]"
          : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]"
      }`}
    >
      {/* Absolute Badges */}
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary-base)] text-[var(--color-on-primary)] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-20 whitespace-nowrap">
          <T en="Most Popular">Más Popular</T>
        </div>
      )}

      <div className="flex flex-col h-full justify-between">
        <div>
          <div className="h-[140px] md:h-[160px] lg:h-[160px] flex flex-col justify-start">
            <h3
              className={`text-3xl font-display font-black tracking-tight mb-2 ${plan.titleColor}`}
            >
              {plan.name}
            </h3>
            {plan.badge && (
              <div className="bg-[var(--color-surface-highlight)] border border-purple-500/20 text-[10px] rounded-full px-2.5 py-0.5 inline-flex items-center gap-1.5 mb-2 md:mb-4 uppercase tracking-wider shadow-inner w-fit">
                {plan.badgeIcon && (
                  <AISparkleIcon size={12} className="text-indigo-500 animate-pulse" />
                )}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 font-extrabold">
                  {plan.badge}
                </span>
              </div>
            )}
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mt-1">
              {plan.desc}
            </p>
          </div>
          <div className="mb-8 border-b border-[var(--color-border-subtle)] pb-8 mt-4 md:mt-0">
            <div className="text-[var(--color-text-tertiary)] font-bold text-[10px] uppercase tracking-widest mb-1 h-3 flex items-end">
              {plan.prefix || "\u00A0"}
            </div>
            <div className="flex flex-col gap-1">
              {isOfferActive && (
                <div className="flex items-baseline gap-2 opacity-60">
                  <span className="text-xl md:text-2xl font-display font-medium line-through">
                    ${plan.originalPrice.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="flex items-baseline gap-2">
                <span className="text-5xl md:text-4xl xl:text-5xl font-display font-black text-[var(--color-primary-base)]">
                  $
                  {isOfferActive
                    ? Math.round(
                        plan.originalPrice * 0.75,
                      ).toLocaleString()
                    : plan.originalPrice.toLocaleString()}
                </span>
                <span className="text-[var(--color-text-tertiary)] font-bold text-xs uppercase tracking-widest">
                  USD
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-6 mb-6">
            {plan.inheritedFrom && (
              <div className="text-xs md:text-[13px] font-medium italic text-[var(--color-text-secondary)] mb-4 block leading-normal">
                {plan.inheritedFrom}
              </div>
            )}

            {plan.sections && plan.sections.map((section: any, sIdx: number) => {
              const SectionIcon = section.icon;
              return (
                <div key={sIdx} className="space-y-3">
                  <div className="flex items-center gap-2.5">
                    <SectionIcon size={18} className="text-[var(--color-text-secondary)] shrink-0" />
                    <span className="text-xs md:text-[13px] font-extrabold uppercase tracking-widest text-[var(--color-text-secondary)] select-none">
                      {section.title}
                    </span>
                  </div>
                  <ul className="space-y-2 ml-1">
                    {section.items.map((item: any, iIdx: number) => {
                      const isNew = plan.id !== "flash";
                      return (
                        <li
                          key={iIdx}
                          className="flex items-start gap-2.5 text-sm font-medium"
                        >
                          {isNew ? (
                            <>
                              <svg
                                viewBox="0 0 24 24"
                                fill="currentColor"
                                stroke="currentColor"
                                strokeWidth="2.5"
                                strokeLinejoin="round"
                                className="w-2.5 h-2.5 text-[var(--color-primary-base)] shrink-0 mt-[5px] select-none"
                              >
                                <path d="M12 4l2.5 5.5h6l-4.5 4 1.5 6L12 16l-5.5 3.5 1.5-6L3.5 9.5h6L12 4z" />
                              </svg>
                              <span className="text-[var(--color-primary-base)] font-semibold leading-normal">
                                {item}
                              </span>
                            </>
                          ) : (
                            <>
                              <CheckCircle2
                                size={15}
                                className="text-[var(--color-primary-base)] shrink-0 mt-0.5"
                              />
                              <span className="text-[var(--color-text-primary)] leading-normal">
                                {item}
                              </span>
                            </>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>

          {plan.extraFeatures && plan.extraFeatures.length > 0 && (
            <div className="mb-6">
              <div
                className="overflow-hidden"
                style={{
                  maxHeight: expanded ? "600px" : "0px",
                  transition: "max-height 0.4s ease",
                }}
              >
                <ul className="space-y-3 pt-4 pb-2 border-t border-[var(--color-border-subtle)]/50">
                  {plan.extraFeatures.map((extraF: any, idx: number) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2.5 text-sm font-medium"
                    >
                      <CheckCircle2
                        size={15}
                        className="text-[var(--color-primary-base)] shrink-0 mt-0.5"
                      />
                      <span className="text-[var(--color-text-primary)] leading-normal">
                        {extraF}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
              <button
                type="button"
                style={{ cursor: "pointer" }}
                onClick={() => setExpanded(!expanded)}
                className="text-xs font-bold text-[var(--color-primary-base)] hover:opacity-80 transition-opacity flex items-center gap-1 mt-2 p-0 border-none bg-transparent cursor-pointer"
              >
                {expanded ? (
                  <T en="Hide benefits ↑">Ocultar ↑</T>
                ) : (
                  <T en="See more benefits ↓">Ver más beneficios ↓</T>
                )}
              </button>
            </div>
          )}

          {plan.footnote && (
            <p className="text-[10px] text-[var(--color-text-tertiary)] italic mb-6 leading-normal block">
              {plan.footnote}
            </p>
          )}
        </div>
      </div>
      <p
        onClick={() => navigate("/portafolio")}
        className="text-center text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:opacity-80 transition-all cursor-pointer mb-4 underline decoration-dotted underline-offset-4"
        style={{ cursor: "pointer" }}
      >
        <T en="See portfolio examples →">Ver ejemplos en el portafolio →</T>
      </p>

      <button
        onClick={() => {
          const typeMap: Record<string, string> = {
            flash: "landing",
            constellation: "corporate",
            nova: "ecommerce",
          };
          navigate(
            `/cotizar?type=${typeMap[plan.id] || "landing"}`,
          );
        }}
        style={{ cursor: "pointer" }}
        className={`w-full py-4 rounded-xl font-black text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 ${
          plan.highlight
            ? "bg-[var(--color-primary-base)] text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary-base)]/20 border-none"
            : "bg-[var(--color-surface-base)] border-2 border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-surface-highlight)]"
        }`}
      >
        <T en="Choose this Plan">Elegir este Paquete</T>
      </button>
    </motion.div>
  );
}

// Píldora de cuenta regresiva aislada: posee su propio estado/intervalo para que
// el tick de cada segundo re-renderice SOLO este componente y no toda la página
// de Servicios (que reconstruye arrays grandes de planes/comparativa).
export default function Services() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  useDocumentTitle(
    "Nuestros Servicios Web | Landing Pages, E-commerce y Corporativas",
    "Our Web Services | Landing Pages, E-commerce & Corporate Websites",
    "Soluciones web de software original optimizados para conversión. Creamos tiendas virtuales, webs elegantes y landing pages eficaces.",
    "Custom web software optimized for conversion. We build online stores, elegant corporate sites, and high-converting landing pages.",
  );
  // BreadcrumbList -- ayuda a Google a entender la jerarquía real del sitio,
  // un factor real (no garantizado) para que aparezcan sitelinks de
  // navegación en los resultados de búsqueda (pedido explícito, 23 de julio).
  useJsonLd("jsonld-servicios-breadcrumb", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: language === "es" ? "Inicio" : "Home", item: "https://polarisweb.studio/" },
      { "@type": "ListItem", position: 2, name: language === "es" ? "Servicios" : "Services", item: "https://polarisweb.studio/servicios" },
    ],
  });
  const [showComparison, setShowComparison] = useState(false);
  const tableRef = useRef<HTMLDivElement>(null);
  const [activePricePlan, setActivePricePlan] = useState<string>("flash");
  const isProgrammaticScroll = useRef(false);
  const programmaticScrollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const planIds = ["flash", "constellation", "nova"];
    const observers: IntersectionObserver[] = [];

    // En pantallas más altas (iPad) la zona de detección necesita
    // ser más generosa en el bottom
    const bottomMargin = window.innerHeight >= 900 ? "-40%" : "-60%";

    planIds.forEach((id) => {
      const el = document.getElementById(`plan-card-${id}`);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (isProgrammaticScroll.current) return;
          if (entry.isIntersecting) setActivePricePlan(id);
        },
        {
          threshold: 0,
          rootMargin: `-20% 0px ${bottomMargin} 0px`
        }
      );
      observer.observe(el);
      observers.push(observer);
    });

    return () => observers.forEach((o) => o.disconnect());
  }, []);

  // La barra fija de precios (mobile) se oculta al llegar al footer para no
  // tapar los enlaces legales (Privacidad/Términos/Cookies).
  const [hideStickyPriceBar, setHideStickyPriceBar] = useState(false);

  useEffect(() => {
    const footerEl = document.querySelector("footer");
    if (!footerEl) return;
    const observer = new IntersectionObserver(
      ([entry]) => setHideStickyPriceBar(entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(footerEl);
    return () => observer.disconnect();
  }, []);

  const scrollToPlan = (planId: string) => {
    const el = document.getElementById(`plan-card-${planId}`);
    if (!el) return;

    // Bloquear observer durante scroll programático
    isProgrammaticScroll.current = true;
    setActivePricePlan(planId);

    // Limpiar timer anterior si existe
    if (programmaticScrollTimer.current) {
      clearTimeout(programmaticScrollTimer.current);
    }

    const navbarHeight = 80;
    const offset = 24;
    const top = el.getBoundingClientRect().top + window.scrollY - navbarHeight - offset;
    window.scrollTo({ top, behavior: "smooth" });

    // Reactivar observer después de que termina el scroll (~800ms)
    programmaticScrollTimer.current = setTimeout(() => {
      isProgrammaticScroll.current = false;
    }, 800);
  };

  const stateFromTab = location.state?.fromTab;

  useEffect(() => {
    if (stateFromTab) {
      if (stateFromTab === "comparativa") {
        setShowComparison(true);
        setTimeout(() => {
          const compTable = document.getElementById("comparison-table");
          if (compTable) {
            compTable.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      } else {
        setTimeout(() => {
          const planCard = document.getElementById(`plan-card-${stateFromTab}`);
          if (planCard) {
            planCard.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 100);
      }
      // Reset state to avoid scrolling again on subsequent renders or background updates
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [stateFromTab, navigate, location.pathname]);

  const handleToggleComparison = () => {
    setShowComparison(prev => {
      if (!prev) {
        setTimeout(() => tableRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
      }
      return !prev;
    });
  };

  const [targetDate] = useState(() => {
    return new Date("2026-08-17T23:59:59Z").getTime();
  });

  // Solo guardamos si la oferta sigue activa (cambia una única vez). El conteo
  // por segundo vive dentro de <CountdownPill> para no re-renderizar esta página.
  const [isOfferActive, setIsOfferActive] = useState(
    targetDate - Date.now() > 0
  );

  const plans: {
    id: string;
    name: React.ReactNode;
    titleColor: string;
    desc: React.ReactNode;
    originalPrice: number;
    sections?: {
      title: React.ReactNode;
      icon: React.ComponentType<any>;
      items: React.ReactNode[];
    }[];
    inheritedFrom?: React.ReactNode;
    extraFeatures?: React.ReactNode[];
    highlight: boolean;
    prefix?: React.ReactNode;
    badge?: React.ReactNode;
    badgeIcon?: boolean;
    footnote?: React.ReactNode;
  }[] = [
    {
      id: "flash",
      name: <T en="Flash Package">Paquete Destello</T>,
      titleColor: "text-amber-500",
      desc: (
        <T en="High-converting landing page designed to capture leads from day one and position your business on Google Maps.">
          Landing page de alta conversión para captar prospectos desde el primer día y posicionar tu negocio en Google Maps.
        </T>
      ),
      originalPrice: 299,
      sections: [
        {
          title: <T en="Design">DISEÑO</T>,
          icon: Palette,
          items: [
            <T en="Exclusive and responsive design">Diseño exclusivo y responsivo</T>,
            <T en="Designed to capture customers">Diseñada para captar clientes</T>,
          ],
        },
        {
          title: <T en="Features">FUNCIONALIDADES</T>,
          icon: Wrench,
          items: [
            <T en="Contact form included">Formulario de contacto incluido</T>,
            <T en="Integrated WhatsApp button">Botón de WhatsApp integrado</T>,
            <T en="Compatible with social media">Compatible con redes sociales</T>,
          ],
        },
        {
          title: <T en="Infrastructure">INFRAESTRUCTURA</T>,
          icon: ShieldCheck,
          items: [
            <T en="Web domain included (up to $15 USD)">Dominio web incluido (hasta $15 USD)</T>,
            <T en="Secure connection (HTTPS)">Conexión segura (HTTPS)</T>,
          ],
        },
        {
          title: <T en="SEO">SEO</T>,
          icon: Search,
          items: [
            <T en="Google indexing">Indexación en Google</T>,
            <Link to="/blog/seo-on-page-guia-completa" state={{ fromTab: "flash", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="SEO On-Page">SEO On-Page</T>
            </Link>,
          ],
        },
        {
          title: <T en="Support">SOPORTE</T>,
          icon: Headphones,
          items: [
            <T en="30-day post-launch warranty">30 días de garantía post-lanzamiento</T>,
          ],
        },
      ],
      extraFeatures: [
        <T en="Optimized loading speed">Velocidad de carga optimizada</T>,
        <T en="The code is yours forever">El código es tuyo para siempre</T>,
        <T en="Live visitor statistics">Estadísticas de visitas en vivo</T>,
      ],
      highlight: false,
    },
    {
      id: "constellation",
      name: <T en="Constellation Package">Paquete Constelación</T>,
      titleColor: "text-[var(--color-primary-base)]",
      desc: (
        <T en="Complete digital presence with a 24/7 AI smart assistant to qualify leads and automate appointment booking.">
          Tu presencia digital completa con asistente inteligente 24/7 para calificar prospectos y agendar citas automáticamente.
        </T>
      ),
      originalPrice: 699,
      inheritedFrom: <T en="↳ Everything in Flash, plus:">↳ Todo lo de Destello, más:</T>,
      sections: [
        {
          title: <T en="Design">DISEÑO</T>,
          icon: Palette,
          items: [
            <T en="Up to 5 custom sections/pages">Hasta 5 páginas personalizadas</T>,
            <T en="Visual identity coherent with your brand">Identidad visual coherente con tu marca</T>,
          ],
        },
        {
          title: <T en="Features">FUNCIONALIDADES</T>,
          icon: Wrench,
          items: [
            <T en="Self-managed blog">Blog autogestionable</T>,
            <T en="3 initial articles written">3 artículos iniciales redactados</T>,
            <T en="24/7 Support Chatbot">Chatbot de atención 24/7</T>,
            <T en="Google Maps Integration">Integración de Google Maps</T>,
          ],
        },
        {
          title: <T en="Analytics">ANALYTICS</T>,
          icon: BarChart3,
          items: [
            <T en={<>Full <Link to="/blog/google-analytics-4-guia-completa" state={{ fromTab: "constellation", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Analytics 4</Link></>}>
              <Link to="/blog/google-analytics-4-guia-completa" state={{ fromTab: "constellation", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Analytics 4</Link> completo
            </T>,
            <T en="Real-time visitor statistics">Estadísticas de visitas en tiempo real</T>,
          ],
        },
        {
          title: <T en="SEO">SEO</T>,
          icon: Search,
          items: [
            <Link to="/blog/seo-tecnico-guia-completa" state={{ fromTab: "constellation", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Technical SEO">SEO Técnico</T>
            </Link>,
            <T en={<><Link to="/blog/google-search-console-guia-completa" state={{ fromTab: "constellation", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Search Console</Link> configuration</>}>
              Configuración en <Link to="/blog/google-search-console-guia-completa" state={{ fromTab: "constellation", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Search Console</Link>
            </T>,
          ],
        },
        {
          title: <T en="Support">SOPORTE</T>,
          icon: Headphones,
          items: [
            <T en="60-day post-launch warranty">60 días de garantía post-lanzamiento</T>,
          ],
        },
      ],
      extraFeatures: [
        <T en="Optimized loading speed">Velocidad de carga optimizada</T>,
        <T en="The code is yours forever">El código es tuyo para siempre</T>,
        <T en="Live visitor statistics">Estadísticas de visitas en vivo</T>,
        <T en={
          <>
            <Link to="/blog/open-graph-redes-sociales" state={{ fromTab: "constellation", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Open Graph</Link> for social media
          </>
        }>
          <>
            <Link to="/blog/open-graph-redes-sociales" state={{ fromTab: "constellation", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Open Graph</Link> para redes sociales
          </>
        </T>,
        <T en="Automatic email configuration">Configuración de emails automáticos</T>,
        <T en="Instant alert when you receive a message">Alerta inmediata al recibir un mensaje</T>,
      ],
      highlight: true,
    },
    {
      id: "nova",
      name: <T en="Nova Package">Paquete Nova</T>,
      titleColor: "text-violet-500",
      desc: (
        <T en="Direct sales or booking engine with payment gateways and custom admin dashboard to scale revenue 24/7.">
          Motor de ventas o reservas directas con pasarelas de pago y panel autogestionable para escalar tu facturación 24/7.
        </T>
      ),
      originalPrice: 1299,
      badge: <T en="AI Powered">Potenciado con IA</T>,
      badgeIcon: true,
      inheritedFrom: <T en="↳ Everything in Constellation, plus:">↳ Todo lo de Constelación, más:</T>,
      sections: [
        {
          title: <T en="Store">TIENDA</T>,
          icon: ShoppingCart,
          items: [
            <T en="Unlimited product catalog">Catálogo ilimitado de productos</T>,
            <T en="Initial loading of 20 products">Carga Inicial de 20 productos</T>,
            <T en="Configured payment gateways">Pasarelas de pago configuradas</T>,
            <T en="Inventory manager">Gestor de inventario</T>,
            <T en="Admin panel">Panel de administración</T>,
          ],
        },
        {
          title: <T en="Artificial Intelligence">INTELIGENCIA ARTIFICIAL</T>,
          icon: AISparkleIcon,
          items: [
            <T en="1 AI tool included¹">1 herramienta de IA incluida¹</T>,
            <T en="Chatbot trained on your catalog">Chatbot entrenado con tu catálogo</T>,
            <T en="Smart cross-selling recommender²">Recomendador inteligente cross-selling²</T>,
          ],
        },
        {
          title: <T en="Backend">BACKEND</T>,
          icon: Database,
          items: [
            <T en="Real-time database">Base de datos en tiempo real</T>,
            <T en="Client registration and login">Registro y login de clientes</T>,
            <T en="Cloud stored images">Imágenes almacenadas en la nube</T>,
          ],
        },
        {
          title: <T en="SEO">SEO</T>,
          icon: Search,
          items: [
            <Link to="/blog/schema-markup-guia-completa" state={{ fromTab: "nova", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Schema Markup">Schema Markup</T>
            </Link>,
            <T en={<><Link to="/blog/google-business-profile-guia-completa" state={{ fromTab: "nova", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Business Profile</Link> optimization guide</>}>
              Guía de optimización de <Link to="/blog/google-business-profile-guia-completa" state={{ fromTab: "nova", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Business Profile</Link>
            </T>,
          ],
        },
        {
          title: <T en="Support">SOPORTE</T>,
          icon: Headphones,
          items: [
            <T en="90-day priority warranty">90 días de garantía prioritaria</T>,
          ],
        },
      ],
      extraFeatures: [
        <T en="Optimized loading speed">Velocidad de carga optimizada</T>,
        <T en="The code is yours forever">El código es tuyo para siempre</T>,
        <T en="Live visitor statistics">Estadísticas de visitas en vivo</T>,
        <T en={
          <>
            <Link to="/blog/open-graph-redes-sociales" state={{ fromTab: "nova", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Open Graph</Link> for social media
          </>
        }>
          <>
            <Link to="/blog/open-graph-redes-sociales" state={{ fromTab: "nova", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Open Graph</Link> para redes sociales
          </>
        </T>,
        <T en="Automatic email configuration">Configuración de emails automáticos</T>,
        <T en="Instant alert when you receive a message">Alerta inmediata al recibir un mensaje</T>,
        <T en="Real-time sales notifications">Notificaciones de venta en tiempo real</T>,
        <T en="Abandoned cart recovery">Recuperación de carritos abandonados</T>,
        <T en={
          <>
            <Link to="/blog/google-shopping-guia-completa" state={{ fromTab: "nova", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Shopping</Link> optimization guide
          </>
        }>
          <>
            Guía de optimización de <Link to="/blog/google-shopping-guia-completa" state={{ fromTab: "nova", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Shopping</Link>
          </>
        </T>,
      ],
      highlight: false,
      footnote: (
        <T en="¹ Monthly tool subscription/API costs not included. ² Requires minimum 20 product catalog.">
          ¹ Costos de suscripción/API mensual de la herramienta de IA no
          incluidos. ² Requiere un catálogo mínimo de 20 productos.
        </T>
      ),
    },
  ];

  const comparisonCategories = [
    {
      category: <T en="DESIGN">DISEÑO</T>,
      features: [
        {
          name: <T en="Sections / Pages">Páginas / secciones</T>,
          flash: <T en="1 page">1 página</T>,
          constellation: <T en="Up to 5">Hasta 5</T>,
          nova: <T en="Unlimited">Ilimitadas</T>,
        },
        {
          name: <T en="Exclusive design">Diseño exclusivo</T>,
          flash: true,
          constellation: true,
          nova: true,
        },
        {
          name: <T en="Brand visual identity">Identidad visual de marca</T>,
          flash: false,
          constellation: true,
          nova: true,
        },
      ],
    },
    {
      category: <T en="FEATURES">FUNCIONALIDADES</T>,
      features: [
        {
          name: <T en="Contact form">Formulario de contacto</T>,
          flash: true,
          constellation: true,
          nova: true,
        },
        {
          name: <T en="WhatsApp button">Botón de WhatsApp</T>,
          flash: true,
          constellation: true,
          nova: true,
        },
        {
          name: <T en="Self-managed blog">Blog autogestionable</T>,
          flash: false,
          constellation: true,
          nova: true,
        },
        {
          name: <T en="24/7 Chatbot">Chatbot 24/7</T>,
          flash: false,
          constellation: true,
          nova: true,
        },
        {
          name: <T en="Google Maps Integration">Integración de Google Maps</T>,
          flash: false,
          constellation: true,
          nova: true,
        },
        {
          name: <T en="Online store">Tienda online</T>,
          flash: false,
          constellation: false,
          nova: true,
        },
        {
          name: <T en="Payment gateways">Pasarelas de pago</T>,
          flash: false,
          constellation: false,
          nova: true,
        },
      ],
    },
    {
      category: <T en="ARTIFICIAL INTELLIGENCE">INTELIGENCIA ARTIFICIAL</T>,
      features: [
        {
          name: <T en="AI tool included">Herramienta de IA incluida</T>,
          flash: false,
          constellation: false,
          nova: <T en="1 included">1 incluida</T>,
        },
        {
          name: <T en="Chatbot trained on your catalog">Chatbot entrenado con tu catálogo</T>,
          flash: false,
          constellation: false,
          nova: true,
        },
        {
          name: <T en="Smart cross-selling recommender">Recomendador inteligente cross-selling</T>,
          flash: false,
          constellation: false,
          nova: true,
        },
      ],
    },
    {
      category: <T en="BACKEND">BACKEND</T>,
      features: [
        {
          name: <T en="Real-time database">Base de datos en tiempo real</T>,
          flash: false,
          constellation: false,
          nova: true,
        },
        {
          name: <T en="Client registration and login">Registro y login de clientes</T>,
          flash: false,
          constellation: false,
          nova: true,
        },
        {
          name: <T en="Cloud stored images">Imágenes almacenadas en la nube</T>,
          flash: false,
          constellation: false,
          nova: true,
        },
      ],
    },
    {
      category: <T en="SEO & ANALYTICS">SEO & ANALYTICS</T>,
      features: [
        {
          name: <T en="Google indexing">Indexación en Google</T>,
          flash: true,
          constellation: true,
          nova: true,
        },
        {
          name: (
            <Link to="/blog/seo-on-page-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="SEO On-Page">SEO On-Page</T>
            </Link>
          ),
          flash: true,
          constellation: true,
          nova: true,
        },
        {
          name: (
            <Link to="/blog/seo-tecnico-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Technical SEO">SEO Técnico</T>
            </Link>
          ),
          flash: false,
          constellation: true,
          nova: true,
        },
        {
          name: (
            <Link to="/blog/google-search-console-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Google Search Console">Google Search Console</T>
            </Link>
          ),
          flash: false,
          constellation: true,
          nova: true,
        },
        {
          name: (
            <Link to="/blog/schema-markup-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Schema Markup">Schema Markup</T>
            </Link>
          ),
          flash: false,
          constellation: false,
          nova: true,
        },
        {
          name: (
            <Link to="/blog/google-business-profile-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Google Business Profile Guide">Guía de Google Business Profile</T>
            </Link>
          ),
          flash: false,
          constellation: false,
          nova: true,
        },
        {
          name: (
            <Link to="/blog/google-analytics-4-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Google Analytics 4">Google Analytics 4</T>
            </Link>
          ),
          flash: false,
          constellation: true,
          nova: true,
        },
      ],
    },
    {
      category: <T en="INFRASTRUCTURE">INFRAESTRUCTURA</T>,
      features: [
        {
          name: <T en="Domain included">Dominio incluido</T>,
          flash: true,
          constellation: true,
          nova: true,
        },
        {
          name: <T en="Secure connection (HTTPS)">Conexión segura (HTTPS)</T>,
          flash: true,
          constellation: true,
          nova: true,
        },
      ],
    },
    {
      category: <T en="SUPPORT">SOPORTE</T>,
      features: [
        {
          name: <T en="Warranty days">Días de garantía</T>,
          flash: <T en="30 days">30 días</T>,
          constellation: <T en="60 days">60 días</T>,
          nova: <T en="90 days">90 días</T>,
        },
        {
          name: <T en="Support priority">Prioridad de soporte</T>,
          flash: <T en="Standard">Normal</T>,
          constellation: <T en="Standard">Normal</T>,
          nova: <T en="Priority">Prioritario</T>,
        },
      ],
    },
    {
      category: <T en="PRICING">PRECIO</T>,
      features: [
        {
          name: <T en="Base price">Precio base</T>,
          flash: (
            <div>
              <span className="font-extrabold text-sm block">Destello</span>
              <span className="font-bold text-xs text-[var(--color-primary-base)]">$299 USD</span>
            </div>
          ),
          constellation: (
            <div>
              <span className="font-extrabold text-sm block">Constelación</span>
              <span className="font-bold text-xs text-[var(--color-primary-base)]">$699 USD</span>
            </div>
          ),
          nova: (
            <div>
              <span className="font-extrabold text-sm block">Nova</span>
              <span className="font-bold text-xs text-[var(--color-primary-base)]">$1299 USD</span>
            </div>
          ),
        },
        {
          name: <T en="Select Package">Seleccionar Paquete</T>,
          flash: (
            <button
              onClick={() => navigate("/cotizar?type=landing")}
              className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-surface-highlight)] rounded-lg text-xs font-bold transition-all"
            >
              <T en="Choose this Plan">Elegir este Paquete</T>
            </button>
          ),
          constellation: (
            <button
              onClick={() => navigate("/cotizar?type=corporate")}
              className="px-4 py-2 bg-[var(--color-primary-base)] text-[var(--color-on-primary)] rounded-lg text-xs font-bold transition-all shadow-md shadow-[var(--color-primary-base)]/20 hover:opacity-90"
            >
              <T en="Choose this Plan">Elegir este Paquete</T>
            </button>
          ),
          nova: (
            <button
              onClick={() => navigate("/cotizar?type=ecommerce")}
              className="px-4 py-2 bg-[var(--color-surface-elevated)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)] hover:bg-[var(--color-surface-highlight)] rounded-lg text-xs font-bold transition-all"
            >
              <T en="Choose this Plan">Elegir este Paquete</T>
            </button>
          ),
        },
      ],
    },
  ];

  const addons = [
    {
      title: <T en="Quick Response Bot">Bot de Respuestas Rápidas</T>,
      desc: (
        <T en="Automated flows with pre-programmed buttons to answer FAQs and capture client info 24/7.">
          Flujos automatizados con botones pre-programados para responder preguntas frecuentes y capturar datos de clientes 24/7.
        </T>
      ),
      price: <T en="From $150">Desde $150</T>,
      type: <T en="One-time Setup Fee">Pago Único de Implementación</T>,
      typeMapValue: "quick-bot",
      highlight: false,
    },
    {
      title: <T en="Autonomous Sales Agent (AI)">Agente de Ventas Autónomo (IA)</T>,
      desc: (
        <T en="An AI with a 'brain' trained on your business data. Chats naturally, handles objections, and answers complex questions like a real employee.">
          Una IA con "cerebro" entrenada con los datos de tu negocio. Conversa natural, maneja objeciones y atiende dudas complejas como un empleado real.
        </T>
      ),
      price: <T en="From $49 / mo">Desde $49 / mes</T>,
      type: <T en="Monthly Subscription">Suscripción Mensual</T>,
      typeMapValue: "ai-agent",
      highlight: false,
    },
    {
      title: <T en="Semantic Search Engine">Buscador Semántico</T>,
      desc: (
        <T en="For e-commerce: your clients find products by describing what they need in natural language.">
          Para e-commerce: tus clientes encuentran productos describiendo lo que necesitan en lenguaje natural.
        </T>
      ),
      price: <T en="From $250">Desde $250</T>,
      type: <T en="One-time Setup Fee">Pago Único de Implementación</T>,
      typeMapValue: "semantic-search",
      highlight: false,
      badge: <T en="Recommended for Nova">Recomendado para Nova</T>,
    },
    {
      title: <T en="Content Assistant">Asistente de Contenido</T>,
      desc: (
        <T en="Generates product descriptions, blog posts, and review responses automatically.">
          Genera descripciones de productos, posts de blog y respuestas a reseñas automáticamente.
        </T>
      ),
      price: <T en="From $29 / mo">Desde $29 / mes</T>,
      type: <T en="Monthly Subscription">Suscripción Mensual</T>,
      typeMapValue: "content-assistant",
      highlight: false,
    },
  ];

  const maintenanceFeatures = [
    {
      title: <T en="Hacking Protection">Protección contra hackeos</T>,
      desc: (
        <T en="We monitor your site so unauthorized access and malicious code injections are prevented.">
          Vigilamos tu web para que nadie acceda sin permiso ni inyecte código malicioso.
        </T>
      ),
      icon: Lock,
    },
    {
      title: <T en="Continual Speed Optimization">Carga optimizada continuamente</T>,
      desc: (
        <T en="We continuously verify lightning speed and make performance tweaks whenever needed.">
          Revisamos que tu web siga cargando rápido y hacemos ajustes cuando sea necesario.
        </T>
      ),
      icon: Zap,
    },
    {
      title: <T en="Regular Backups">Backups periódicos</T>,
      desc: (
        <T en="If anything ever breaks, we can restore your site immediately to its latest healthy state.">
          Si algo falla, restauramos tu web al último estado estable.
        </T>
      ),
      icon: Database,
    },
    {
      title: <T en="Dependencies Kept Up to Date">Dependencias siempre actualizadas</T>,
      desc: (
        <T en="Zero security vulnerabilities caused by obsolete or unmaintained code libraries.">
          Sin brechas de seguridad por código desactualizado.
        </T>
      ),
      icon: RefreshCw,
    },
    {
      title: <T en="Monthly Performance Report">Informe mensual de rendimiento</T>,
      desc: (
        <T en="Every month you receive a personalized summary of how your website is performing — visits, trends, and actionable recommendations. Nova clients also receive sales data.">
          Cada mes recibes un resumen personalizado del rendimiento de tu web — visitas, tendencias y recomendaciones accionables. Los clientes Nova reciben además datos de ventas.
        </T>
      ),
      icon: BarChart3,
    },
  ];

  const Dash = () => (
    <div className="flex justify-center select-none">
      <span className="text-[var(--color-text-tertiary)]"> — </span>
    </div>
  );

  return (
    <div className="min-h-[100svh] flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Header */}
        <section className="text-center space-y-6 mb-20">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
            <T en="Solutions That Convert">Soluciones que Convierten</T>
          </span>
          <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter">
            <T en={<>Power your business <br className="hidden md:block" /> with tailored digital engineering</>}>
              Impulsa tu negocio <br className="hidden md:block" /> con ingeniería digital a medida
            </T>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            <T en="Turn your digital presence into a 24/7 sales machine designed to scale your business.">
              Transforma tu presencia digital en una máquina de ventas 24/7 diseñada para hacer crecer tu negocio.
            </T>
          </p>
        </section>

        {/* Pricing Section */}
        <div className="bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface-base)] rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] p-8 md:p-16 mb-32 relative overflow-hidden">
          {isOfferActive && (
            <div className="-mx-8 md:-mx-16 -mt-8 md:-mt-16 mb-8 md:mb-12 bg-[var(--color-primary-base)]/10 border-b border-[var(--color-primary-base)]/30 px-4 py-4 md:py-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6 text-center text-sm md:text-base relative z-10">
              <span className="font-bold text-[var(--color-text-primary)]">
                <T en="Launch Offer: Get a 25% discount through the entire first month!">
                  Oferta de lanzamiento: ¡todo el primer mes con 25% de descuento!
                </T>
              </span>
              <CountdownPill
                targetDate={targetDate}
                onExpire={() => setIsOfferActive(false)}
              />
            </div>
          )}

          <section className="space-y-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Our Plans">Nuestros Paquetes</T>
              </span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">
                <T en="Smart Investment">Inversión Inteligente</T>
              </h2>
            </div>

            {/* Grid de Precios */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
              {plans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  isOfferActive={isOfferActive}
                  navigate={navigate}
                />
              ))}
            </div>

            <div className="pt-8">
              <button
                onClick={handleToggleComparison}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] font-bold text-xs uppercase tracking-wider hover:border-[var(--color-primary-base)] transition-all cursor-pointer"
              >
                {showComparison ? (
                  <T en="Hide full comparison ↑">Ocultar comparativa ↑</T>
                ) : (
                  <T en="Compare all plans ↓">Comparar todos los planes ↓</T>
                )}
              </button>
            </div>
          </section>

          {/* Comparativa Detallada */}
          <AnimatePresence>
            {showComparison && (
              <motion.div
                id="comparison-table"
                ref={tableRef}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="overflow-hidden pt-16 border-t border-[var(--color-border-subtle)] mt-16 select-text selection:bg-[var(--color-primary-base)]/20 selection:text-[var(--color-primary-base)]"
              >
                <div className="text-center mb-12">
                  <h3 className="text-3xl font-display font-bold mb-4">
                    <T en="Feature Comparison">Comparativa de Características</T>
                  </h3>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <T en="Explore the exact technical specifications of every package.">
                      Explora en detalle técnico qué incluye cada paquete.
                    </T>
                  </p>
                </div>

                <div className="overflow-x-auto relative shadow-2xl rounded-2xl border border-[var(--color-border-subtle)]">
                  <table className="w-full text-left border-collapse text-xs md:text-sm bg-[var(--color-surface-elevated)]">
                    <thead>
                      <tr className="border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-highlight)]">
                        <th className="p-4 md:p-6 font-bold text-[var(--color-text-primary)] min-w-[200px]">
                          <T en="Swipe →">Desliza →</T>
                        </th>
                        {plans.map((p) => (
                          <th
                            key={p.id}
                            className={`p-4 md:p-6 text-center font-bold min-w-[140px] md:min-w-[180px] ${
                              p.highlight
                                ? "bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)]"
                                : "text-[var(--color-text-primary)]"
                            }`}
                          >
                            <span className="block text-sm md:text-base font-black font-display">
                              {p.name}
                            </span>
                            <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                              ${isOfferActive ? Math.round(p.originalPrice * 0.75) : p.originalPrice} USD
                            </span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--color-border-subtle)] font-medium">
                      {comparisonCategories.map((cat, cIdx) => (
                        <React.Fragment key={cIdx}>
                          <tr className="bg-[var(--color-surface-base)]/60">
                            <td
                              colSpan={4}
                              className="p-3 md:p-4 font-black uppercase text-[10px] md:text-xs tracking-widest text-[var(--color-primary-base)] bg-[var(--color-surface-base)]"
                            >
                              {cat.category}
                            </td>
                          </tr>
                          {cat.features.map((feat: any, fIdx: number) => (
                            <tr
                              key={fIdx}
                              className="hover:bg-[var(--color-surface-highlight)] transition-colors"
                            >
                              <td className="p-4 md:p-6 font-semibold text-[var(--color-text-primary)]">
                                {feat.name}
                              </td>
                              {["flash", "constellation", "nova"].map(
                                (planId) => {
                                  const val = feat[planId];
                                  const isHighlight = planId === "constellation";
                                  return (
                                    <td
                                      key={planId}
                                      className={`p-4 md:p-6 text-center ${
                                        isHighlight
                                          ? "bg-[var(--color-primary-base)]/5"
                                          : ""
                                      }`}
                                    >
                                      {typeof val === "boolean" ? (
                                        val ? (
                                          <div className="flex justify-center">
                                            <CheckCircle2
                                              size={18}
                                              className="text-emerald-500"
                                            />
                                          </div>
                                        ) : (
                                          <Dash />
                                        )
                                      ) : val ? (
                                        <span className="font-bold text-[var(--color-text-primary)]">
                                          {val}
                                        </span>
                                      ) : (
                                        <Dash />
                                      )}
                                    </td>
                                  );
                                },
                              )}
                            </tr>
                          ))}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Addons Section */}
        <section className="mb-32 space-y-12">
          <div className="text-center space-y-4">
            <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)] inline-block">
              <T en="Exclusive Add-ons">Add-ons Exclusivos</T>
            </span>
            <h2 className="text-4xl md:text-6xl font-display font-black tracking-tight">
              <T en={<>Power your web with <br className="hidden md:block" /> Artificial Intelligence</>}>
                Potencia tu web con <br className="hidden md:block" /> Inteligencia Artificial
              </T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base max-w-xl mx-auto leading-relaxed">
              <T en="Optional add-on features with separate pricing to integrate into your plan and take your platform to the next level of automation.">
                Complementos opcionales (add-ons) con costo adicional al implementar en tu plan para llevar tu plataforma al siguiente nivel de automatización.
              </T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {addons.map((addon, i) => (
              <div
                key={i}
                className="p-6 rounded-[var(--radius-bento)] glass-panel border border-[var(--color-border-subtle)] flex flex-col justify-between hover:border-[var(--color-primary-base)] transition-all duration-300 group"
              >
                <div className="space-y-4">
                  {addon.badge && (
                    <span className="text-[9px] font-black uppercase tracking-widest text-[var(--color-primary-base)] bg-[var(--color-surface-highlight)] px-2.5 py-1 rounded-full border border-[var(--color-primary-base)]/20 inline-block">
                      {addon.badge}
                    </span>
                  )}
                  <h3 className="text-xl font-display font-bold group-hover:text-[var(--color-primary-base)] transition-colors">
                    {addon.title}
                  </h3>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {addon.desc}
                  </p>
                </div>
                <div className="pt-6 border-t border-[var(--color-border-subtle)] mt-6 space-y-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] block">
                      {addon.type}
                    </span>
                    <span className="text-xl font-display font-black text-[var(--color-text-primary)]">
                      {addon.price}
                    </span>
                  </div>
                  <button
                    onClick={() => navigate(`/cotizar?addon=${addon.typeMapValue}`)}
                    className="w-full py-2 rounded-lg bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] text-xs font-bold hover:border-[var(--color-primary-base)] hover:bg-[var(--color-surface-highlight)] transition-all cursor-pointer"
                  >
                    <T en="Quote Add-on">Cotizar Add-on</T>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Mantenimiento Section */}
        <section className="mb-32">
          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-bento)] p-8 md:p-16 relative overflow-hidden">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              <div className="lg:col-span-7 space-y-6">
                <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-base)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)] inline-block">
                  <T en="Post-Launch">Post-Lanzamiento</T>
                </span>
                <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight leading-tight">
                  <T en="Premium Maintenance & Support">Mantenimiento y Soporte Premium</T>
                </h2>
                <p className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed">
                  <T en="Upon project delivery your warranty period begins. Afterwards, we offer an accessible subscription to keep your servers running and your web free from vulnerabilities.">
                    Al entregar tu proyecto comienza tu periodo de garantía. A partir de ahí, ofrecemos una suscripción accesible para mantener tus servidores activos y tu web libre de hackeos.
                  </T>
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                  {maintenanceFeatures.map((feat, idx) => {
                    const FeatIcon = feat.icon;
                    return (
                      <div
                        key={idx}
                        className={`p-4 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-2 ${
                          idx === 4 ? "sm:col-span-2" : ""
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs font-bold text-[var(--color-text-primary)]">
                          <FeatIcon size={16} className="text-[var(--color-primary-base)] shrink-0" />
                          {feat.title}
                        </div>
                        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                          {feat.desc}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="lg:col-span-5 flex flex-col justify-center">
                <div className="p-8 rounded-2xl bg-[var(--color-surface-base)] border-2 border-[var(--color-primary-base)]/40 relative shadow-2xl space-y-6 text-center">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)]">
                    <T en="Total Peace of Mind">Tranquilidad Total</T>
                  </span>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <T en="Focus on your business, we take care of the code.">
                      Enfócate en tu negocio, nosotros nos encargamos del código.
                    </T>
                  </p>
                  <div className="py-2">
                    <span className="text-5xl font-display font-black text-[var(--color-text-primary)]">
                      $30
                    </span>
                    <span className="text-xs font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mt-1">
                      USD / <T en="month">mes</T>
                    </span>
                  </div>
                  <ul className="space-y-2.5 text-xs font-medium text-[var(--color-text-secondary)] text-left border-t border-[var(--color-border-subtle)] pt-6">
                    {maintenanceFeatures.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                        {feat.title}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/cotizar?step=plan&maintenance=true")}
                    className="w-full py-3 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold text-xs uppercase tracking-wider hover:opacity-90 transition-opacity shadow-lg shadow-[var(--color-primary-base)]/20 cursor-pointer"
                  >
                    <T en="Include in Project Plan">Incluir en la Planificación</T>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Polaris Section */}
        <WhyPolaris />

        {/* Testimonials Section */}
        <Testimonials />

        {/* Final CTA */}
        <FinalCTA />
      </main>

      {/* Floating Bottom Sticky Price Bar on Mobile */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-40 lg:hidden transition-all duration-300 ease-out ${
          hideStickyPriceBar
            ? "translate-y-full opacity-0 pointer-events-none"
            : "translate-y-0 opacity-100"
        }`}
      >
        <div className="glass-panel border-t border-[var(--color-border-subtle)] px-3 py-2.5 flex items-center justify-between gap-1 shadow-2xl bg-[var(--color-surface-elevated)]/95 backdrop-blur-xl">
          {[
            { id: "flash", name: <T en="Flash">Destello</T>, price: 299 },
            { id: "constellation", name: <T en="Constellation">Constelación</T>, price: 699, popular: true },
            { id: "nova", name: "Nova", price: 1299 },
          ].map((item) => {
            const isActive = activePricePlan === item.id;
            return (
              <button
                key={item.id}
                onClick={() => scrollToPlan(item.id)}
                className={`flex-1 py-2 px-1 rounded-xl flex flex-col items-center justify-center transition-all relative cursor-pointer ${
                  isActive
                    ? "bg-[var(--color-primary-base)]/15 border border-[var(--color-primary-base)]/40 shadow-sm"
                    : "hover:bg-[var(--color-surface-highlight)] border border-transparent"
                }`}
              >
                {item.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary-base)] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full whitespace-nowrap">
                    <T en="Most Popular">Más Popular</T>
                  </div>
                )}
                <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
                  isActive ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-secondary)]"
                }`}>
                  {item.name}
                </span>
                <span className="text-xs font-display font-black text-[var(--color-text-primary)]">
                  ${isOfferActive ? Math.round(item.price * 0.75) : item.price}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <Footer />
    </div>
  );
}