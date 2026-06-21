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
function CountdownPill({
  targetDate,
  onExpire,
}: {
  targetDate: number;
  onExpire: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = targetDate - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        onExpireRef.current();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="font-display font-black tracking-widest bg-[var(--color-surface-base)] border border-[var(--color-primary-base)] text-[var(--color-primary-base)] px-4 py-1.5 rounded-full shadow-inner tabular-nums text-xs md:text-sm uppercase">
      {`${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`}
    </div>
  );
}

export default function Services() {
  const { language } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
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
    return new Date("2026-07-18T23:59:59Z").getTime();
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
        <T en="A focused, effective landing page — up to 5 sections, designed to convert from the first scroll.">
          Una landing page enfocada y efectiva — hasta 5 secciones, diseñada para convertir desde el primer scroll.
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
        <T en="Your complete digital presence — a professional corporate website of up to 5 pages, built to grow.">
          Tu presencia digital completa — un sitio corporativo profesional de hasta 5 páginas, construido para crecer.
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
        <T en="Your high-performance online store — built to sell, scale and integrate AI.">
          Tu tienda online de alto rendimiento — construida para vender, escalar e integrar IA.
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
      footnote: (
        <>
          <T en="¹ Monthly API/Subscription costs for the AI tool are not included.">
            ¹ Costos de suscripción/API mensual de la herramienta de IA no incluidos.
          </T>
          <br />
          <T en="² Requires a minimum catalog of 20 products.">
            ² Requiere un catálogo mínimo de 20 productos.
          </T>
        </>
      ),
      highlight: false,
    },
  ];

  const Check = () => (
    <div className="flex justify-center select-none">
      <CheckCircle2 size={16} className="text-indigo-600 dark:text-indigo-400" />
    </div>
  );

  const Dash = () => (
    <div className="flex justify-center select-none">
      <span className="text-[var(--color-text-tertiary)]">—</span>
    </div>
  );

  const tableCategories = [
    {
      title: <T en="DESIGN">DISEÑO</T>,
      icon: Palette,
      rows: [
        {
          name: <T en="Pages / sections">Páginas / secciones</T>,
          v1: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="1 page">1 página</T></span>,
          v2: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="Up to 5">Hasta 5</T></span>,
          v3: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="Unlimited">Ilimitadas</T></span>,
        },
        {
          name: <T en="Exclusive design">Diseño exclusivo</T>,
          v1: <Check />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: <T en="Brand visual identity">Identidad visual de marca</T>,
          v1: <Dash />,
          v2: <Check />,
          v3: <Check />,
        },
      ],
    },
    {
      title: <T en="FEATURES">FUNCIONALIDADES</T>,
      icon: Wrench,
      rows: [
        {
          name: <T en="Contact form">Formulario de contacto</T>,
          v1: <Check />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: <T en="WhatsApp button">Botón de WhatsApp</T>,
          v1: <Check />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: <T en="Self-managed blog">Blog autogestionable</T>,
          v1: <Dash />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: <T en="24/7 Chatbot">Chatbot 24/7</T>,
          v1: <Dash />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: <T en="Google Maps Integration">Integración de Google Maps</T>,
          v1: <Dash />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: <T en="Online store">Tienda online</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
        {
          name: <T en="Payment gateways">Pasarelas de pago</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
      ],
    },
    {
      title: <T en="ARTIFICIAL INTELLIGENCE">INTELIGENCIA ARTIFICIAL</T>,
      icon: AISparkleIcon,
      rows: [
        {
          name: <T en="AI tool included">Herramienta de IA incluida</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="1 included">1 incluida</T></span>,
        },
        {
          name: <T en="Chatbot trained on your catalog">Chatbot entrenado con tu catálogo</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
        {
          name: <T en="Smart cross-selling recommender">Recomendador inteligente cross-selling</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
      ],
    },
    {
      title: <T en="BACKEND">BACKEND</T>,
      icon: Database,
      rows: [
        {
          name: <T en="Real-time database">Base de datos en tiempo real</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
        {
          name: <T en="Client registration & login">Registro y login de clientes</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
        {
          name: <T en="Cloud stored images">Imágenes almacenadas en la nube</T>,
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
      ],
    },
    {
      title: <T en="SEO & ANALYTICS">SEO & ANALYTICS</T>,
      icon: BarChart3,
      rows: [
        {
          name: <T en="Google indexing">Indexación en Google</T>,
          v1: <Check />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: (
            <Link to="/blog/seo-on-page-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="SEO On-Page">SEO On-Page</T>
            </Link>
          ),
          v1: <Check />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: (
            <Link to="/blog/seo-tecnico-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Technical SEO">SEO Técnico</T>
            </Link>
          ),
          v1: <Dash />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: (
            <Link to="/blog/google-search-console-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Google Search Console">Google Search Console</T>
            </Link>
          ),
          v1: <Dash />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: (
            <Link to="/blog/schema-markup-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Schema Markup">Schema Markup</T>
            </Link>
          ),
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
        {
          name: (
            <T en={<><Link to="/blog/google-business-profile-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Business Profile</Link> guide</>}>
              Guía de <Link to="/blog/google-business-profile-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">Google Business Profile</Link>
            </T>
          ),
          v1: <Dash />,
          v2: <Dash />,
          v3: <Check />,
        },
        {
          name: (
            <Link to="/blog/google-analytics-4-guia-completa" state={{ fromTab: "comparativa", fromServices: true }} className="hover:text-[var(--color-primary-base)] underline decoration-dotted underline-offset-4 transition-colors">
              <T en="Google Analytics 4">Google Analytics 4</T>
            </Link>
          ),
          v1: <Dash />,
          v2: <Check />,
          v3: <Check />,
        },
      ],
    },
    {
      title: <T en="INFRASTRUCTURE">INFRAESTRUCTURA</T>,
      icon: ShieldCheck,
      rows: [
        {
          name: <T en="Domain included">Dominio incluido</T>,
          v1: <Check />,
          v2: <Check />,
          v3: <Check />,
        },
        {
          name: <T en="Secure connection (HTTPS)">Conexión segura (HTTPS)</T>,
          v1: <Check />,
          v2: <Check />,
          v3: <Check />,
        },
      ],
    },
    {
      title: <T en="SUPPORT">SOPORTE</T>,
      icon: Headphones,
      rows: [
        {
          name: <T en="Warranty days">Días de garantía</T>,
          v1: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="30 days">30 días</T></span>,
          v2: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="60 days">60 días</T></span>,
          v3: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="90 days">90 días</T></span>,
        },
        {
          name: <T en="Support priority">Prioridad de soporte</T>,
          v1: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="Normal">Normal</T></span>,
          v2: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="Normal">Normal</T></span>,
          v3: <span className="text-[var(--color-text-primary)] font-bold text-sm"><T en="Priority">Prioritario</T></span>,
        },
      ],
    },
    {
      title: <T en="PRICE">PRECIO</T>,
      icon: Coins,
      rows: [
        {
          name: <T en="Base price">Precio base</T>,
          v1: (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-amber-500 font-display uppercase tracking-wider font-extrabold mb-0.5 select-none opacity-90">
                <T en="Flash">Destello</T>
              </span>
              <span className="text-[var(--color-text-primary)] font-bold text-sm">${isOfferActive ? Math.round(299 * 0.75) : 299} USD</span>
            </div>
          ),
          v2: (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-[var(--color-primary-base)] font-display uppercase tracking-wider font-extrabold mb-0.5 select-none opacity-90">
                <T en="Constellation">Constelación</T>
              </span>
              <span className="text-[var(--color-text-primary)] font-bold text-sm">${isOfferActive ? Math.round(699 * 0.75) : 699} USD</span>
            </div>
          ),
          v3: (
            <div className="flex flex-col items-center">
              <span className="text-[10px] text-violet-500 font-display uppercase tracking-wider font-extrabold mb-0.5 select-none opacity-90">
                <T en="Nova">Nova</T>
              </span>
              <span className="text-[var(--color-text-primary)] font-bold text-sm">${isOfferActive ? Math.round(1299 * 0.75) : 1299} USD</span>
            </div>
          ),
        },
      ],
    },
  ];

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Header */}
        <section className="text-center space-y-4 mb-12">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
            <T en="Solutions that Convert">Soluciones que Convierten</T>
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter max-w-4xl mx-auto leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
            <T
              en={
                <>
                  Scale your business <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    with Custom Digital Engineering
                  </span>
                </>
              }
            >
              Impulsa tu negocio <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                con ingeniería digital a medida
              </span>
            </T>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
            <T en="Transform your web presence into a 24/7 sales engine designed to grow your local or international business.">
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
                  Oferta de lanzamiento: ¡todo el primer mes con 25% de
                  descuento!
                </T>
              </span>
              <CountdownPill targetDate={targetDate} onExpire={() => setIsOfferActive(false)} />
            </div>
          )}

          <section className="space-y-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Our Plans">Nuestros Paquetes</T>
              </span>
              <h2 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
                <T
                  en={
                    <>
                      Smart <br />
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                        Investment
                      </span>
                    </>
                  }
                >
                  Inversión <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    Inteligente
                  </span>
                </T>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left max-w-lg lg:max-w-none mx-auto pb-20 lg:pb-0">
              {plans.map((plan, i) => (
                <PlanCard
                  key={i}
                  plan={plan}
                  isOfferActive={isOfferActive}
                  navigate={navigate}
                />
              ))}
            </div>

            {/* Comparar todos los planes button */}
            <div className="pt-8 text-center mx-auto">
              <button
                type="button"
                style={{ cursor: "pointer" }}
                onClick={handleToggleComparison}
                className="text-sm font-black uppercase tracking-widest text-[var(--color-primary-base)] bg-transparent border-none outline-none select-none flex items-center gap-2 mx-auto cursor-pointer"
              >
                <T en="Compare all plans">Comparar todos los planes</T>
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-300 ${showComparison ? "rotate-180" : ""}`}
                />
              </button>
            </div>

            {/* Collapsible Comparative Table */}
            <div
              ref={tableRef}
              id="comparison-table"
              style={{
                maxHeight: showComparison ? "2500px" : "0px",
                transition: "max-height 0.5s ease",
              }}
              className="overflow-hidden w-full text-left"
            >
                <div className="overflow-x-auto w-full">
                  <table className="w-full text-left border-collapse min-w-[750px]">
                    <thead>
                      <tr className="md:hidden border-b border-[var(--color-border-subtle)]">
                        <th className="sticky left-0 z-20 p-0 bg-[var(--color-surface-base)] pointer-events-none select-none min-w-[260px] w-[260px]">
                          <div className="flex items-center justify-between w-full px-4 py-2 text-indigo-500 bg-indigo-500/5 border-b border-indigo-500/10">
                            <ArrowLeft size={13} strokeWidth={3} className="shrink-0" />
                            <div className="flex items-center gap-1 text-[9px] uppercase tracking-widest font-black">
                              <Pointer size={11} className="-rotate-45 shrink-0 text-indigo-500" />
                              <T en="Swipe">Desliza</T>
                            </div>
                            <ArrowRight size={13} strokeWidth={3} className="shrink-0" />
                          </div>
                        </th>
                        <th className="bg-[var(--color-surface-base)]" />
                        <th className="bg-[var(--color-surface-base)]" />
                        <th className="bg-[var(--color-surface-base)]" />
                      </tr>
                      <tr className="border-b border-[var(--color-border-subtle)] sticky top-0 bg-[var(--color-surface-base)] z-10">
                        <th className="p-4 pl-6 text-left font-extrabold text-xs uppercase tracking-wider text-[var(--color-text-tertiary)] bg-[var(--color-surface-base)] select-none min-w-[260px] w-[260px]">
                          <T en="Characteristics">Características</T>
                        </th>
                      <th className="p-6 py-8 text-center select-none bg-[var(--color-surface-base)]">
                        <div className="font-display font-black text-amber-500 text-lg md:text-2xl tracking-tight">
                          <T en="Flash">Destello</T>
                        </div>
                        <div className="text-sm md:text-lg text-[var(--color-text-primary)] mt-2 font-black">
                          ${isOfferActive ? Math.round(299 * 0.75) : 299} USD
                        </div>
                      </th>
                      <th className="p-6 py-8 text-center select-none bg-[var(--color-surface-base)] bg-indigo-50/10 dark:bg-indigo-950/5">
                        <div className="font-display font-black text-[var(--color-primary-base)] text-lg md:text-2xl tracking-tight">
                          <T en="Constellation">Constelación</T>
                        </div>
                        <div className="text-sm md:text-lg text-[var(--color-text-primary)] mt-2 font-black">
                          ${isOfferActive ? Math.round(699 * 0.75) : 699} USD
                        </div>
                      </th>
                      <th className="p-6 py-8 text-center select-none bg-[var(--color-surface-base)]">
                        <div className="font-display font-black text-violet-500 text-lg md:text-2xl tracking-tight">
                          <T en="Nova">Nova</T>
                        </div>
                        <div className="text-sm md:text-lg text-[var(--color-text-primary)] mt-2 font-black">
                          ${isOfferActive ? Math.round(1299 * 0.75) : 1299} USD
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableCategories.map((cat, catIdx) => (
                      <React.Fragment key={catIdx}>
                        {/* Category Row */}
                        <tr className="bg-[var(--color-primary-base)]/[0.04] dark:bg-[var(--color-primary-base)]/[0.06] border-y border-[var(--color-border-subtle)]/70">
                          <td colSpan={4} className="p-4 pl-4 text-sm md:text-[15px] font-black uppercase tracking-wider text-[var(--color-text-primary)] select-none">
                            <span className="flex items-center gap-3 relational-heading">
                              {cat.icon && <cat.icon className="text-indigo-600 dark:text-indigo-400 w-5 h-5 flex-shrink-0" />}
                              {cat.title}
                            </span>
                          </td>
                        </tr>
                        {/* Features Rows */}
                        {cat.rows.map((row, rowIdx) => (
                          <tr
                            key={rowIdx}
                            className={rowIdx % 2 === 1 ? "bg-[var(--color-surface-elevated)]/50" : ""}
                          >
                            <td className="p-4 pl-4 text-left text-sm text-[var(--color-text-secondary)] font-medium select-none min-w-[260px] w-[260px]">
                              {row.name}
                            </td>
                            <td className="p-4 text-center text-sm font-bold">
                              {row.v1}
                            </td>
                            <td className="p-4 text-center text-sm font-bold bg-indigo-50/10 dark:bg-indigo-950/5">
                              {row.v2}
                            </td>
                            <td className="p-4 text-center text-sm font-bold">
                              {row.v3}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                     {/* Action buttons row */}
                    <tr className="border-t border-[var(--color-border-subtle)]">
                      <td className="p-4 bg-[var(--color-surface-base)] pl-6 text-xs font-black uppercase tracking-wider text-[var(--color-text-tertiary)] select-none">
                        <T en="Select Plan">Seleccionar Paquete</T>
                      </td>
                      <td className="p-4 bg-[var(--color-surface-base)] text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => navigate("/cotizar?type=landing")}
                            style={{ cursor: "pointer" }}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs transition-all border-2 border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-highlight)] whitespace-nowrap cursor-pointer"
                          >
                            <T en="Choose this Plan">Elegir este Paquete</T>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 bg-[var(--color-surface-base)] bg-indigo-50/10 dark:bg-indigo-950/5 text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => navigate("/cotizar?type=corporate")}
                            style={{ cursor: "pointer" }}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs transition-all bg-[var(--color-primary-base)] text-[var(--color-on-primary)] shadow-md border-none whitespace-nowrap cursor-pointer"
                          >
                            <T en="Choose this Plan">Elegir este Paquete</T>
                          </button>
                        </div>
                      </td>
                      <td className="p-4 bg-[var(--color-surface-base)] text-center">
                        <div className="flex flex-col items-center gap-1.5">
                          <button
                            onClick={() => navigate("/cotizar?type=ecommerce")}
                            style={{ cursor: "pointer" }}
                            className="py-2.5 px-4 rounded-xl font-bold text-xs transition-all border-2 border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)] bg-[var(--color-surface-base)] hover:bg-[var(--color-surface-highlight)] whitespace-nowrap cursor-pointer"
                          >
                            <T en="Choose this Plan">Elegir este Paquete</T>
                          </button>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        </div>

        {/* AI Add-ons Section */}
        <section className="space-y-12 py-20 border-t border-[var(--color-border-subtle)]">
          <div className="flex flex-col items-center text-center gap-6">
            <span className="glass-badge text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
              <T en="Exclusive Add-ons">Add-ons Exclusivos</T>
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter">
              <T
                en={
                  <>
                    Power your site with{" "}
                    <br className="hidden md:block lg:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 inline-block pb-1 pr-1">
                      Artificial Intelligence
                    </span>
                  </>
                }
              >
                Potencia tu web con <br className="hidden md:block lg:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 inline-block pb-1 pr-1">
                  Inteligencia Artificial
                </span>
              </T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto">
              <T en="Optional add-ons with additional cost to implement in your plan to take your platform to the next level of automation.">
                Complementos opcionales (add-ons) con costo adicional al
                implementar en tu plan para llevar tu plataforma al siguiente
                nivel de automatización.
              </T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, amount: 0.2 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-purple-500/50 transition-colors duration-500 bento-glow-hover opacity-0 [transform:translateY(20px)]"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <Bot size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight">
                    <T en="Lead Capture Bot">Bot de Respuestas Rápidas</T>
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="Automated flows with pre-programmed buttons to answer FAQs and capture client contact info 24/7.">
                      Flujos automatizados con botones pre-programados para
                      responder preguntas frecuentes y capturar datos de
                      clientes 24/7.
                    </T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                    <T en="One-time Setup">Pago Único de Implementación</T>
                  </span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]">
                    <T en="From $150">Desde $150</T>
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/cotizar?addon=bot_fast")}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Quote Add-on">Cotizar Add-on</T> <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-emerald-500/50 transition-colors duration-300 bento-glow-hover opacity-0 [transform:translateY(20px)]"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 dark:text-emerald-400">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight">
                    <T en="Autonomous AI Sales Agent">
                      Agente de Ventas Autónomo (IA)
                    </T>
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="An AI with a 'brain' (like Gemini or Grok) trained on your business. It chats naturally, handles objections, and answers complex questions like a real employee.">
                      Una IA con "cerebro" entrenada con los datos de tu
                      negocio. Conversa natural, maneja objeciones y atiende
                      dudas complejas como un empleado real.
                    </T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                    <T en="Monthly Subscription">Suscripción Mensual</T>
                  </span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]">
                    <T en="From $49 / month">Desde $49 / mes</T>
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/cotizar?addon=ai_agent")}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Quote Add-on">Cotizar Add-on</T> <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-blue-500/50 transition-colors duration-300 bento-glow-hover opacity-0 [transform:translateY(20px)]"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 dark:text-blue-400">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight flex flex-wrap items-center gap-2">
                    <T en="Semantic Search">Buscador Semántico</T>
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-violet-500/15 text-violet-400 text-[9px] uppercase font-bold tracking-wider border border-violet-500/20 shadow-sm leading-none">
                      <T en="Recommended for Nova">Recomendado para Nova</T>
                    </span>
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="For e-commerce: your customers find products describing what they need in natural language.">
                      Para e-commerce: tus clientes encuentran productos
                      describiendo lo que necesitan en lenguaje natural.
                    </T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                    <T en="One-time Setup">Pago Único de Implementación</T>
                  </span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]">
                    <T en="From $250">Desde $250</T>
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/cotizar?addon=semantic_search")}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Quote Add-on">Cotizar Add-on</T> <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ delay: 0.3 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-indigo-500/50 transition-colors duration-300 bento-glow-hover opacity-0 [transform:translateY(20px)]"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <AISparkleIcon size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight">
                    <T en="Content Assistant">Asistente de Contenido</T>
                  </h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="Automatically generate product descriptions, blog posts, and review responses.">
                      Genera descripciones de productos, posts de blog y
                      respuestas a reseñas automáticamente.
                    </T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1">
                    <T en="Monthly Subscription">Suscripción Mensual</T>
                  </span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]">
                    <T en="From $29 / month">Desde $29 / mes</T>
                  </span>
                </div>
              </div>
              <button
                onClick={() => navigate("/cotizar?addon=content_assistant")}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Quote Add-on">Cotizar Add-on</T> <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
        </section>

        {/* Hosting & Support Section */}
        <section className="space-y-12 py-20 border-t border-[var(--color-border-subtle)]">
          <div className="flex flex-col lg:flex-row gap-12 items-center">
            <div className="flex-1 space-y-6">
              <span className="glass-badge inline-block text-emerald-500 text-xs font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full border border-emerald-500/20">
                <T en="Post-Launch">Post-Lanzamiento</T>
              </span>
              <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight">
                <T
                  en={
                    <>
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-[var(--color-accent-blue)]">
                        Premium
                      </span>{" "}
                      Maintenance & Support
                    </>
                  }
                >
                  Mantenimiento y Soporte{" "}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-[var(--color-accent-blue)]">
                    Premium
                  </span>
                </T>
              </h2>
              <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl">
                <T en="When your project goes live, your warranty begins. After that, we offer a $30/mo subscription to keep your business running smoothly without technical headaches.">
                  Al entregar tu proyecto comienza tu periodo de garantía. A
                  partir de ahí, ofrecemos una suscripción accesible para
                  mantener tus servidores activos y tu web libre de hackeos.
                </T>
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                    <ShieldCheck className="text-emerald-500" size={20} />
                    <T en="Anti-hack Protection">Protección contra hackeos</T>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <T en="We monitor your website so no one accesses without permission or injects malicious code.">
                      Vigilamos tu web para que nadie acceda sin permiso ni inyecte código malicioso.
                    </T>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                    <Zap className="text-amber-500" size={20} />
                    <T en="Continuously Optimized Loading">Carga optimizada continuamente</T>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <T en="We check that your web continues to load quickly and make adjustments when necessary.">
                      Revisamos que tu web siga cargando rápido y hacemos ajustes cuando sea necesario.
                    </T>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                    <Database className="text-blue-500" size={20} />
                    <T en="Periodic Backups">Backups periódicos</T>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <T en="If anything fails, we restore your website to the last stable state.">
                      Si algo falla, restauramos tu web al último estado estable.
                    </T>
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                    <RefreshCw className="text-purple-500" size={20} />
                    <T en="Always Updated Dependencies">Dependencias siempre actualizadas</T>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <T en="No security gaps due to outdated code.">
                      Sin brechas de seguridad por código desactualizado.
                    </T>
                  </p>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                    <StatisticUpIcon className="text-indigo-500" size={20} />
                    <T en="Monthly Performance Report">Informe mensual de rendimiento</T>
                  </div>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    <T en="Every month you receive a personalized summary of how your website is performing — visits, trends, and actionable recommendations. Nova clients also receive sales data.">
                      Cada mes recibes un resumen personalizado del rendimiento de tu web — visitas, tendencias y recomendaciones accionables. Los clientes Nova reciben además datos de ventas.
                    </T>
                  </p>
                </div>
              </div>
            </div>
            <div className="w-full lg:w-[400px] flex-shrink-0 bg-[var(--color-surface-base)] p-8 rounded-[var(--radius-bento)] border border-[var(--color-border-strong)] relative overflow-hidden group hover:border-emerald-500/50 transition-colors duration-500 shadow-xl">
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-colors"></div>
              <h3 className="text-2xl font-display font-bold mb-2 relative">
                <T en="Peace of Mind">Tranquilidad Total</T>
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-6 relative">
                <T en="Focus on running your business, we take care of the code.">
                  Enfócate en tu negocio, nosotros nos encargamos del código.
                </T>
              </p>
              <div className="flex items-baseline gap-1 mb-8 relative">
                <span className="text-5xl font-black text-[var(--color-text-primary)]">
                  $30
                </span>
                <span className="text-[var(--color-text-tertiary)] uppercase text-xs font-bold tracking-widest">
                  <T en="USD / month">USD / mes</T>
                </span>
              </div>
              <ul className="space-y-4 mb-8 relative">
                {[
                  <T en="Anti-hack Protection">
                    Protección contra hackeos
                  </T>,
                  <T en="Continuously Optimized Loading">
                    Carga optimizada continuamente
                  </T>,
                  <T en="Periodic Backups">
                    Backups periódicos
                  </T>,
                  <T en="Always Updated Dependencies">
                    Dependencias siempre actualizadas
                  </T>,
                  <T en="Monthly performance report">
                    Informe mensual de rendimiento
                  </T>,
                ].map((item, i) => (
                  <li
                    key={i}
                    className="flex items-start gap-3 text-sm text-[var(--color-text-secondary)] font-medium"
                  >
                    <CheckCircle2
                      size={18}
                      className="text-emerald-500 mt-0.5 flex-shrink-0"
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <button
                onClick={() => {
                  navigate("/cotizar?addon=hosting");
                }}
                className="w-full py-4 rounded-xl font-bold bg-[#E8F5E9] hover:bg-[#C8E6C9] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors relative cursor-pointer"
              >
                <T en="Include Add-on in Plan">
                  Incluir en la Planificación
                </T>
              </button>
            </div>
          </div>
        </section>

        <WhyPolaris />
        <Testimonials />

        <FinalCTA />
      </main>

      {/* Sticky price bar — mobile only. Se oculta al llegar al footer para no tapar sus enlaces. */}
      <div
        className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-[var(--color-surface-elevated)]/95 backdrop-blur-md border-t border-[var(--color-border-subtle)] shadow-xl rounded-t-2xl transition-all duration-300 ${
          hideStickyPriceBar ? "opacity-0 translate-y-4 pointer-events-none" : "opacity-100 translate-y-0"
        }`}
      >

        <div className="flex items-stretch divide-x divide-[var(--color-border-subtle)]">
          
          {/* Destello */}
          <button
            onClick={() => scrollToPlan("flash")}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all cursor-pointer ${
              activePricePlan === "flash" ? "bg-amber-500/8" : ""
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
              activePricePlan === "flash" ? "text-amber-400" : "text-[var(--color-text-tertiary)]"
            }`}>
              <T en="Flash">Destello</T>
            </span>
            <span className={`text-sm font-black transition-colors ${
              activePricePlan === "flash" ? "text-amber-400" : "text-[var(--color-text-secondary)]"
            }`}>
              ${isOfferActive ? Math.round(299 * 0.75) : 299}
            </span>
            {activePricePlan === "flash" && (
              <div className="w-4 h-0.5 rounded-full bg-amber-400 mt-1" />
            )}
          </button>

          {/* Constelación */}
          <button
            onClick={() => scrollToPlan("constellation")}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all cursor-pointer relative ${
              activePricePlan === "constellation" ? "bg-[var(--color-primary-base)]/8" : ""
            }`}
          >
            {/* Más popular badge */}
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary-base)] text-white text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">
              <T en="Most Popular">Más Popular</T>
            </div>
            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
              activePricePlan === "constellation" ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-tertiary)]"
            }`}>
              <T en="Constellation">Constelación</T>
            </span>
            <span className={`text-sm font-black transition-colors ${
              activePricePlan === "constellation" ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-secondary)]"
            }`}>
              ${isOfferActive ? Math.round(699 * 0.75) : 699}
            </span>
            {activePricePlan === "constellation" && (
              <div className="w-4 h-0.5 rounded-full bg-[var(--color-primary-base)] mt-1" />
            )}
          </button>

          {/* Nova */}
          <button
            onClick={() => scrollToPlan("nova")}
            className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-all cursor-pointer ${
              activePricePlan === "nova" ? "bg-violet-500/8" : ""
            }`}
          >
            <span className={`text-[10px] font-black uppercase tracking-wider transition-colors ${
              activePricePlan === "nova" ? "text-violet-400" : "text-[var(--color-text-tertiary)]"
            }`}>
              Nova
            </span>
            <span className={`text-sm font-black transition-colors ${
              activePricePlan === "nova" ? "text-violet-400" : "text-[var(--color-text-secondary)]"
            }`}>
              ${(isOfferActive ? Math.round(1299 * 0.75) : 1299).toLocaleString("en-US")}
            </span>
            {activePricePlan === "nova" && (
              <div className="w-4 h-0.5 rounded-full bg-violet-400 mt-1" />
            )}
          </button>

        </div>
      </div>

      <Footer />
    </div>
  );
}
