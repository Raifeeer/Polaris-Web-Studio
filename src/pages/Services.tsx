import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  Rocket,
  ShoppingCart,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  MessageSquare,
  Sparkles,
  BrainCircuit,
  Briefcase,
  Palette,
  Wrench,
  Headphones,
  BarChart3,
  Search,
  Brain,
  Database,
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";

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
      style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}
      className={`p-8 rounded-[var(--radius-bento)] border transition-[border-color,background-color,box-shadow] duration-300 min-h-[500px] relative ${
        plan.highlight
          ? "bg-[var(--color-surface-elevated)] border-[var(--color-primary-base)]"
          : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]"
      }`}
    >
      {/* Absolute Badges */}
      {plan.highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--color-primary-base)] text-[var(--color-on-primary)] text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg z-20">
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
              <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1.5 mb-2 md:mb-4 uppercase tracking-wider shadow-inner w-fit">
                {plan.badgeIcon && (
                  <Sparkles size={12} className="text-purple-400" />
                )}
               {plan.badge}
              </div>
            )}
            <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mt-1">
              {plan.desc}
            </p>
          </div>
          <div className="mb-8 border-b border-[var(--color-border-subtle)] pb-8 mt-2 md:mt-0">
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
        className={`w-full py-4 rounded-xl font-black text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 border-none ${
          plan.highlight
            ? "bg-[var(--color-primary-base)] text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary-base)]/20"
            : "bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)]"
        }`}
      >
        <T en="Choose this Plan">Elegir este Plan</T>
      </button>
    </motion.div>
  );
}

export default function Services() {
  const navigate = useNavigate();

  const [targetDate] = useState(() => {
    return new Date("2026-06-18T23:59:59Z").getTime();
  });

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

  const formatTime = (ms: number) => {
    const days = Math.floor(ms / (1000 * 60 * 60 * 24));
    const hours = Math.floor((ms % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`;
  };

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
        <T en="Strategic one-page landing optimized to convert visits into actual customers.">
          Página de aterrizaje estratégica optimizada para convertir visitas en clientes.
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
            <T en="Visible on Google">Visible en Google</T>,
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
            <T en="Optimized loading speed">Velocidad de carga optimizada</T>,
          ],
        },
        {
          title: <T en="Support">SOPORTE</T>,
          icon: Headphones,
          items: [
            <T en="30 days of post-launch support">30 días de soporte post-lanzamiento</T>,
          ],
        },
      ],
      extraFeatures: [
        <T en="Loads in less than 3 seconds">Carga en menos de 3 segundos</T>,
        <T en="The code is yours forever">El código es tuyo para siempre</T>,
        <T en="Basic visitor statistics">Estadísticas básicas de visitas</T>,
      ],
      highlight: false,
    },
    {
      id: "constellation",
      name: <T en="Constellation Package">Paquete Constelación</T>,
      titleColor: "text-[var(--color-primary-base)]",
      desc: (
        <T en="Complete corporate website of up to 5 internal pages with custom integrated blog.">
          Sitio corporativo de hasta 5 secciones internas con blog autogestionable integrado.
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
            <T en="Blog that you can update yourself">Blog que tú mismo puedes actualizar</T>,
            <T en="3 initial articles written">3 artículos iniciales redactados</T>,
            <T en="24/7 Support Chatbot">Chatbot de atención 24/7</T>,
            <T en="Google Maps Integration">Integración de Google Maps</T>,
          ],
        },
        {
          title: <T en="Analytics">ANALYTICS</T>,
          icon: BarChart3,
          items: [
            <T en="Full Google Analytics 4">Google Analytics 4 completo</T>,
            <T en="Real-time visitor statistics">Estadísticas de visitas en tiempo real</T>,
          ],
        },
        {
          title: <T en="SEO">SEO</T>,
          icon: Search,
          items: [
            <T en="Advanced SEO">SEO avanzado</T>,
            <T en="Google Search Console configuration">Configuración en Google Search Console</T>,
          ],
        },
        {
          title: <T en="Support">SOPORTE</T>,
          icon: Headphones,
          items: [
            <T en="30 days of post-launch support">30 días de soporte post-lanzamiento</T>,
          ],
        },
      ],
      extraFeatures: [
        <T en="Loads in less than 3 seconds">Carga en menos de 3 segundos</T>,
        <T en="The code is yours forever">El código es tuyo para siempre</T>,
        <T en="Basic visitor statistics">Estadísticas básicas de visitas</T>,
        <T en="Open Graph for social media">Open Graph para redes sociales</T>,
        <T en="Advanced forms with automatic replies">Formularios avanzados con respuestas automáticas</T>,
        <T en="Email notifications">Notificaciones por email</T>,
        <T en="Website history of changes">Historial de cambios de tu web</T>,
      ],
      highlight: true,
    },
    {
      id: "nova",
      name: <T en="Nova Package">Paquete Nova</T>,
      titleColor: "text-violet-500",
      desc: (
        <T en="High-performance online store with automated checkout and support for AI integration.">
          Tienda online de alto rendimiento con pasarelas de pago y soporte para integración de IA.
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
          icon: Brain,
          items: [
            <T en="1 AI tool included*">1 herramienta de IA incluida*</T>,
            <T en="Chatbot trained on your catalog">Chatbot entrenado con tu catálogo</T>,
            <T en="Smart cross-selling recommender">Recomendador inteligente cross-selling</T>,
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
          title: <T en="Support">SOPORTE</T>,
          icon: Headphones,
          items: [
            <T en="90 days of priority support">90 días de soporte prioritario</T>,
          ],
        },
      ],
      extraFeatures: [
        <T en="Loads in less than 3 seconds">Carga en menos de 3 segundos</T>,
        <T en="The code is yours forever">El código es tuyo para siempre</T>,
        <T en="Open Graph for social media">Open Graph para redes sociales</T>,
        <T en="Advanced forms with automatic replies">Formularios avanzados con respuestas automáticas</T>,
        <T en="Email notifications">Notificaciones por email</T>,
        <T en="Website history of changes">Historial de cambios de tu web</T>,
        <T en="Real-time sales notifications">Notificaciones de venta en tiempo real</T>,
        <T en="Abandoned cart recovery">Recuperación de carritos abandonados</T>,
        <T en="Monthly sales reports">Reporte mensual de ventas</T>,
        <T en="Post-sale automations">Automatizaciones post-venta</T>,
        <T en="Products in Google Shopping">Productos en Google Shopping</T>,
      ],
      footnote: (
        <T en="*Monthly API/Subscription costs not included">
          *Costos de suscripción/API mensual no incluidos
        </T>
      ),
      highlight: false,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Header */}
        <section className="text-center space-y-6 mb-20">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
            <T en="Expertise & Execution">Expertise & Ejecución</T>
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter">
            <T en="Digital Engineering at Your Fingertips">
              Ingeniería Digital a tu Alcance
            </T>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
            <T en="Explore our specialized services. We develop scalable solutions designed to boost your market presence.">
              Explora nuestros servicios especializados. Desarrollamos
              soluciones escalables diseñadas para potenciar tu presencia en el
              mercado.
            </T>
          </p>
        </section>

        {/* Services Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-32">
          {/* Landing Pages Card */}
          <div
            id="landing"
            className="md:col-span-2 lg:col-span-2 rounded-[var(--radius-bento)] p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col justify-between group bento-glow-hover transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] mb-8 transition-transform group-hover:scale-110">
              <Rocket size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">
                Landing Pages
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                <T en="Landing pages designed to convert, with a high-impact interface and minimal loading times.">
                  Páginas de aterrizaje diseñadas para convertir, con una
                  interfaz de alto impacto y tiempos de carga mínimos.
                </T>
              </p>
              <button
                onClick={() => navigate("/blog/landing-pages-conversion")}
                className="flex items-center gap-2 text-[var(--color-primary-base)] font-bold group-hover:gap-4 transition-all uppercase text-xs tracking-widest cursor-pointer"
              >
                <T en="Learn More">Saber más</T> <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Web Corporativa Card */}
          <div
            id="corporate"
            className="md:col-span-2 lg:col-span-2 rounded-[var(--radius-bento)] p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col justify-between group bento-glow-hover transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] mb-8 transition-transform group-hover:scale-110">
              <Briefcase size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">
                <T en="Corporate Websites">Webs Corporativas</T>
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                <T en="Elegant and solid digital identity to position your brand as a market leader with structured multi-page content.">
                  Identidad digital sólida y elegante para posicionar tu marca
                  como referente de mercado mediante múltiples secciones.
                </T>
              </p>
              <button
                onClick={() => navigate("/blog/webs-corporativas-identidad")}
                className="flex items-center gap-2 text-[var(--color-primary-base)] font-bold group-hover:gap-4 transition-all uppercase text-xs tracking-widest cursor-pointer"
              >
                <T en="Learn More">Saber más</T> <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* E-commerce Card */}
          <div
            id="ecommerce"
            className="md:col-span-2 lg:col-span-2 rounded-[var(--radius-bento)] p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col justify-between group bento-glow-hover transition-all"
          >
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] mb-8 transition-transform group-hover:scale-110">
              <ShoppingCart size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">
                <T en="High-Level E-commerce">E-commerce de Alto Nivel</T>
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                <T en="Scalable virtual stores built on modern technologies to guarantee a seamless shopping experience.">
                  Tiendas virtuales escalables construidas sobre tecnologías
                  modernas para garantizar una experiencia de compra fluida.
                </T>
              </p>
              <button
                onClick={() => navigate("/blog/ecommerce-alto-nivel")}
                className="flex items-center gap-2 text-[var(--color-primary-base)] font-bold group-hover:gap-4 transition-all uppercase text-xs tracking-widest cursor-pointer"
              >
                <T en="Learn More">Saber más</T> <ArrowRight size={14} />
              </button>
            </div>
          </div>

          {/* Maintenance Card */}
          <div className="md:col-span-2 lg:col-span-1 rounded-[var(--radius-bento)] p-6 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col gap-4 text-center items-center justify-center group bento-glow-hover transition-all">
            <ShieldCheck
              className="text-[var(--color-primary-base)]"
              size={40}
            />
            <h3 className="font-display font-bold text-base">
              <T en="Maintenance">Mantenimiento</T>
            </h3>
          </div>

          {/* SEO Card */}
          <div className="md:col-span-2 lg:col-span-1 rounded-[var(--radius-bento)] p-6 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col gap-4 text-center items-center justify-center group bento-glow-hover transition-all">
            <Zap className="text-[var(--color-primary-base)]" size={40} />
            <h3 className="font-display font-bold text-base">
              <T en="SEO Optimization">Optimización SEO</T>
            </h3>
          </div>
        </div>

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
              <div className="font-display tracking-widest bg-[var(--color-surface-base)] border border-[var(--color-primary-base)] text-[var(--color-primary-base)] px-4 py-1.5 rounded-full shadow-inner tabular-nums">
                {formatTime(timeLeft)}
              </div>
            </div>
          )}

          <section className="space-y-12 text-center">
            <div className="flex flex-col items-center gap-6">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
                <T en="Our Plans">Nuestros Planes</T>
              </span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">
                <T en="Smart Investment">Inversión Inteligente</T>
              </h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left max-w-lg lg:max-w-none mx-auto">
              {plans.map((plan, i) => (
                <PlanCard
                  key={i}
                  plan={plan}
                  isOfferActive={isOfferActive}
                  navigate={navigate}
                />
              ))}
            </div>
          </section>

          {/* Hosting & Support Section */}
          <section className="space-y-12 pt-8 pb-20">
            <div className="flex flex-col lg:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <span className="inline-block text-emerald-500 text-xs font-black uppercase tracking-[0.2em] bg-emerald-500/10 px-4 py-1.5 rounded-full border border-emerald-500/20">
                  <T en="Post-Launch">Post-Lanzamiento</T>
                </span>
                <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight mt-4">
                  <T en="Premium Hosting & Support">
                    Hosting Premium y Soporte
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
                      <T en="Bank-grade Security">Seguridad Bancaria</T>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      <T en="Automatic updates and SSL renewals to ensure your site is protected.">
                        Actualizaciones automáticas y renovación de certificados
                        para evitar vulnerabilidades.
                      </T>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                      <Zap className="text-amber-500" size={20} />
                      <T en="99.9% Uptime guarantee">Uptime del 99.9%</T>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      <T en="Always-on infrastructure. If a server goes down, we handle the technical crisis.">
                        Infraestructura siempre en línea. Nosotros nos
                        encargamos de que nunca pierdas ventas.
                      </T>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                      <Rocket className="text-blue-500" size={20} />
                      <T en="Global Speed (CDN)">Velocidad Global (CDN)</T>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      <T en="Continuous performance optimization so your site loads in milliseconds globally.">
                        Optimización continua en servidores para que tu web
                        cargue súper rápido.
                      </T>
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-[var(--color-text-primary)] font-bold">
                      <Sparkles className="text-purple-500" size={20} />
                      <T en="Content Updates">Actualizaciones Menores</T>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      <T en="Need to change a photo or a paragraph? We make minor tweaks so your site stays fresh.">
                        ¿Necesitas cambiar una foto o un párrafo? Hacemos
                        pequeños ajustes por ti sin cobrar por hora.
                      </T>
                    </p>
                  </div>
                </div>
              </div>
              <div className="w-full lg:w-[400px] flex-shrink-0 bg-[var(--color-surface-elevated)] p-8 rounded-[var(--radius-bento)] border border-[var(--color-border-strong)] relative overflow-hidden group hover:border-emerald-500/50 transition-colors duration-500 shadow-xl">
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
                    <T en="Premium Hosting Engine">
                      Infraestructura Premium de Hosting
                    </T>,
                    <T en="Automated Database Backups">
                      Copias de seguridad automáticas (Backups)
                    </T>,
                    <T en="Direct Tech Support">
                      Soporte Técnico Directo (WhatsApp)
                    </T>,
                    <T en="Content and Image Adjustments">
                      Ajustes menores de texto/imágenes
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
                  className="w-full py-4 rounded-xl font-bold bg-[#E8F5E9] hover:bg-[#C8E6C9] dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 transition-colors relative"
                >
                  <T en="Include Add-on in Plan">
                    Incluir en la Planificación
                  </T>
                </button>
              </div>
            </div>
          </section>
        </div>

        {/* AI Add-ons Section */}
        <section className="space-y-12 py-20 border-t border-[var(--color-border-subtle)]">
          <div className="flex flex-col items-center text-center gap-6">
            <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
              <T en="Exclusive Add-ons">Add-ons Exclusivos</T>
            </span>
            <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter">
              <T
                en={
                  <>
                    Power your site with{" "}
                    <br className="hidden md:block lg:hidden" />
                    <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-purple)] inline-block">
                      Artificial Intelligence
                    </span>
                  </>
                }
              >
                Potencia tu web con <br className="hidden md:block lg:hidden" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-purple)] inline-block">
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
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-purple-500/50 transition-colors duration-500 bento-glow-hover"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400">
                  <MessageSquare size={24} />
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
              transition={{ delay: 0.1 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-emerald-500/50 transition-colors duration-300 bento-glow-hover"
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
                    <T en="An AI with a 'brain' (like Gemini or Grok) trained on your business. It chats naturally, handles objections, and closes sales like a real employee.">
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
              transition={{ delay: 0.2 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-blue-500/50 transition-colors duration-300 bento-glow-hover"
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
              transition={{ delay: 0.3 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-indigo-500/50 transition-colors duration-300 bento-glow-hover"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <Sparkles size={24} />
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
      </main>

      <Footer />
    </div>
  );
}
