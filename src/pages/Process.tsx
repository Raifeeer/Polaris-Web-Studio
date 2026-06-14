import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Palette,
  Code,
  Rocket,
  ArrowRight,
  Check,
  Sparkles,
  Calculator,
  Calendar,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T, useLanguage } from "../context/LanguageContext";
import { useTheme } from "../hooks/useTheme";
import Cal, { getCalApi } from "@calcom/embed-react";

export default function Process() {
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = React.useState(0);
  const [isSchedulerOpen, setIsSchedulerOpen] = React.useState(false);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const { theme } = useTheme();
  const { language } = useLanguage();
  const calTheme = theme === "dark" ? "dark" : "light";

  React.useEffect(() => {
    if (!isSchedulerOpen) return;

    let active = true;
    const initCal = async () => {
      try {
        const cal = await getCalApi();
        if (!active) return;

        cal("on", {
          action: "bookingSuccessful",
          callback: (e) => {
            setIsSuccess(true);
          },
        });

        cal("ui", {
          theme: calTheme,
          cssVarsPerTheme: {
            dark: {
              "cal-brand": "#6366f1",
              "cal-brand-emphasis": "#818cf8",
              "cal-brand-text": "#ffffff",
              "cal-bg": "#020617",
              "cal-bg-emphasis": "#0f172a",
              "cal-bg-subtle": "#1e293b",
              "cal-bg-muted": "#0f172a",
              "cal-bg-inverted": "#f8fafc",
              "cal-border": "#1e293b",
              "cal-border-emphasis": "#334155",
              "cal-border-subtle": "#1e293b",
              "cal-border-booker": "#334155",
              "cal-text": "#f8fafc",
              "cal-text-emphasis": "#ffffff",
              "cal-text-subtle": "#94a3b8",
              "cal-text-muted": "#64748b",
              "cal-text-inverted": "#020617",
            },
            light: {
              "cal-brand": "#4f46e5",
              "cal-brand-emphasis": "#4338ca",
              "cal-brand-text": "#ffffff",
              "cal-bg": "#f8fafc",
              "cal-bg-emphasis": "#ffffff",
              "cal-bg-subtle": "#f1f5f9",
              "cal-bg-muted": "#ffffff",
              "cal-bg-inverted": "#020617",
              "cal-border": "#e2e8f0",
              "cal-border-emphasis": "#cbd5e1",
              "cal-border-subtle": "#e2e8f0",
              "cal-border-booker": "#cbd5e1",
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
  }, [isSchedulerOpen, calTheme]);

  const steps = [
    {
      id: "01",
      title: <T en="Diagnosis & Discovery">Diagnóstico y Descubrimiento</T>,
      shortDesc: (
        <T en="Objectives alignment, target modeling, and technical planning.">
          Alineación estratégica, estudio de referentes y plano técnico.
        </T>
      ),
      desc: (
        <T en="We thoroughly analyze your business model, competitor ecosystem, and specify clear conversion goals (KPIs). At Polaris, we view digital presence as an applied science that bridges beautiful visual communication with measurable business performance.">
          Analizamos a fondo tu modelo de negocio, competencia de mercado y
          definimos metas de conversión claras (KPIs). En Polaris vemos la
          presencia digital como una ciencia aplicada que conecta comunicación
          visual con resultados de negocio.
        </T>
      ),
      icon: Search,
      estTime: <T en="Week 1">Semana 1</T>,
      deliverables: [
        <T en="Interactive Sitemap Map">
          Mapa del sitio y flujos interactivos
        </T>,
        <T en="Market & Competitor Benchmarking">
          Análisis de mercado y competidores
        </T>,
        <T en="Tailor-made Technical Proposal">
          Definición de stack técnico y APIs
        </T>,
        <T en="Launch KPIs Definition Checklist">
          Especificación de objetivos y KPIs de éxito
        </T>,
      ],
      kpi: (
        <T en="Architecture and Scope Document Signed">
          Documento de arquitectura y alcance firmado
        </T>
      ),
      polarismethod: (
        <T en="Co-creative review with multi-industry benchmarks">
          Codiseño con benchmarks de múltiples industrias
        </T>
      ),
    },
    {
      id: "02",
      title: <T en="Architecture and Design">Arquitectura y Diseño</T>,
      shortDesc: (
        <T en="Interactive prototyping & visual system construction.">
          Prototipo interactivo de alta fidelidad y guías de estilo premium.
        </T>
      ),
      desc: (
        <T en="We craft polished, responsive, and high-impact digital user interfaces (UI/UX). Every visual layer, layout margin, typography selection, and motion sequence is built around maximize your brand value and user conversion rates.">
          Creamos interfaces de usuario pulidas, interactivas y adaptativas
          (UI/UX). Cada diseño, espaciado, selección tipográfica y animación
          está pensado para maximizar el valor de tu marca y las tasas de
          conversión.
        </T>
      ),
      icon: Palette,
      estTime: <T en="Weeks 2 - 3">Semanas 2 - 3</T>,
      deliverables: [
        <T en="High-Fidelity Interactive UI/UX Prototype">
          Prototipo interactivo de alta fidelidad
        </T>,
        <T en="Visual Brand Book & Assets Toolkit">
          Kit de diseño, tipografías y componentes
        </T>,
        <T en="Multi-device Layout Breakpoint Approval">
          Garantía de rendimiento responsive (móvil y tablet)
        </T>,
        <T en="Custom CSS Style Token Setup">
          Definición de micro-interacciones y transiciones
        </T>,
      ],
      kpi: (
        <T en="UX/UI Prototype 100% Approved">
          Prototipo de interfaz UI/UX aprobado al 100%
        </T>
      ),
      polarismethod: (
        <T en="Prototype testing simulating real client inputs">
          Diseño centrado en el usuario con datos reales de tu negocio
        </T>
      ),
    },
    {
      id: "03",
      title: <T en="Elite Development">Desarrollo de Élite</T>,
      shortDesc: (
        <T en="TypeScript component execution, performance tuning.">
          Programación interactiva en React y optimización extrema de carga.
        </T>
      ),
      desc: (
        <T en="We transform visual architectures into lightweight, accessible, and fast React component code. Leveraging typing safety via TypeScript and optimized static assets, we ensure your platform maintains fluid frame rates and robust responsiveness.">
          Transformamos los diseños aprobados en código React y TypeScript
          ultraliguro, accesible y seguro. Implementamos una arquitectura limpia
          con optimización SEO extrema que garantiza cargas inmediatas.
        </T>
      ),
      icon: Code,
      estTime: <T en="Weeks 4 - 5">Semanas 4 - 5</T>,
      deliverables: [
        <T en="Clean, Typesafe React Component Construction">
          Código React con tipado estricto en TypeScript
        </T>,
        <T en="Responsive Grid Layout & Media Optimization">
          Maquetación responsive adaptativa de alta velocidad
        </T>,
        <T en="Fluid Motion Layout Transition Engines">
          Inclusión de micro-animaciones fluidas con motion
        </T>,
        <T en="Secure Headless Forms & Third-Party APIs Connect">
          Integración de base de datos, CRM y pasarelas
        </T>,
      ],
      kpi: (
        <T en="Mobile & Desktop PageSpeed score above 95+">
          Puntuación de velocidad del sitio superior a 95+
        </T>
      ),
      polarismethod: (
        <T en="Strict semantic tagging & manual code review checks">
          Revisión exhaustiva y empaquetado libre de dependencias pesadas
        </T>
      ),
    },
    {
      id: "04",
      title: <T en="Launch & Support">Lanzamiento y Acompañamiento</T>,
      shortDesc: (
        <T en="Technical auditing, DNS mapping, and ongoing maintenance.">
          Pruebas de estrés, despliegue global y soporte priorizado.
        </T>
      ),
      desc: (
        <T en="We deploy your custom solution to secure, global CDN-powered cloud hosting. We then submit sitemaps, verify SSL cert status, index directories, and trigger automated health watchdogs to ensure stable uptime and conversion readiness from second one.">
          Desplegamos tu sitio de forma segura mediante redes de entrega global
          de datos (CDN). Nos encargamos de la indexación SEO, certificados SSL
          automatizados, monitoreo de servidor y abrimos tu periodo de soporte
          exclusivo.
        </T>
      ),
      icon: Rocket,
      estTime: <T en="Week 6">Semana 6</T>,
      deliverables: [
        <T en="Complete Host Setup & Wildcard SSL Integration">
          Puesta en producción del servidor y certificado SSL
        </T>,
        <T en="Frictionless DNS Mapping & CDN Optimization">
          Asignación final de dominio e indexación SEO
        </T>,
        <T en="Cross-device stress testing checking iframe sandboxes">
          Pruebas exhaustivas de carga y usabilidad responsive
        </T>,
        <T en="90 Days Polaris Premium Post-launch Support kickoff">
          Kickoff de Garantía Extendida de 90 días prioritarios
        </T>,
      ],
      kpi: (
        <T en="Site live with clean production telemetry logs">
          Sitio web en línea con métricas verificadas y cero errores
        </T>
      ),
      polarismethod: (
        <T en="24-hour uptime validation & automatic error alarm systems">
          Monitoreo automatizado con alertas inmediatas
        </T>
      ),
    },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="max-w-6xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Header */}
        <section className="text-center space-y-6 mb-16 md:mb-20">
          <span className="inline-block text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-highlight)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
            <T en="Agile engineering">Ingeniería Web Sin Fricciones</T>
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
            <T
              en={
                <>
                  Our <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    Methodology
                  </span>
                </>
              }
            >
              Nuestra <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                Metodología
              </span>
            </T>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            <T en="A systematic and transparent process designed to scale your brand with software reliability and world-class design standards.">
              Un proceso claro y sistemático diseñado para escalar tu marca y
              convertir visitantes en clientes de manera predecible.
            </T>
          </p>
        </section>

        {/* Dynamic Workflow Process Visualizer */}
        <div className="space-y-10 md:space-y-12">
          {/* Interactive Progress Bar Tracker */}
          <div className="flex items-center justify-between gap-1 sm:gap-2 max-w-2xl mx-auto mb-8 sm:mb-12 relative px-4">
            {steps.map((step, idx) => {
              const isPast = idx <= activeStep;
              const isCurrent = idx === activeStep;
              return (
                <React.Fragment key={idx}>
                  <button
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`relative z-10 w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center font-display font-bold text-xs sm:text-sm transition-all duration-300 border cursor-pointer select-none focus:outline-none ${
                      isCurrent
                        ? "bg-[var(--color-primary-base)] text-white border-[var(--color-primary-base)] shadow-lg shadow-[var(--color-primary-base)]/25 scale-110 font-black"
                        : isPast
                          ? "bg-[var(--color-surface-elevated)] text-[var(--color-primary-base)] border-[var(--color-primary-base)]/50 hover:bg-[var(--color-surface-highlight)]"
                          : "bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] border-[var(--color-border-subtle)] hover:border-[var(--color-text-secondary)]"
                    }`}
                  >
                    {step.id}
                  </button>
                  {idx < steps.length - 1 && (
                    <div className="flex-1 h-0.5 relative overflow-hidden bg-[var(--color-border-subtle)]">
                      <div
                        className="absolute left-0 top-0 bottom-0 bg-[var(--color-primary-base)] transition-all duration-500"
                        style={{ width: idx < activeStep ? "100%" : "0%" }}
                      />
                    </div>
                  )}
                </React.Fragment>
              );
            })}
          </div>

          {/* Core Interactive Layout Split Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start">
            {/* Left Selection Column: Beautiful Hover/Active Cards */}
            <div className="lg:col-span-5 flex flex-col gap-3 md:gap-4 order-2 lg:order-1">
              <span className="text-[10px] font-mono font-black text-[var(--color-text-tertiary)] uppercase tracking-widest pl-1">
                <T en="Select step to audit deliverables:">
                  Selecciona un paso para ver detalles:
                </T>
              </span>

              {steps.map((step, idx) => {
                const isSelected = idx === activeStep;
                const Icon = step.icon;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveStep(idx)}
                    className={`w-full p-4 md:p-5 text-left rounded-2xl border transition-all duration-300 flex items-center gap-4 cursor-pointer group focus:outline-none relative overflow-hidden select-none ${
                      isSelected
                        ? "bg-[var(--color-primary-base)]/[0.04] border-[var(--color-primary-base)] shadow-sm"
                        : "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/40 hover:bg-[var(--color-surface-highlight)]"
                    }`}
                  >
                    {/* Selected marker left visual glow */}
                    {isSelected && (
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--color-primary-base)]" />
                    )}

                    <div
                      className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300 ${
                        isSelected
                          ? "bg-[var(--color-primary-base)] text-white scale-105"
                          : "bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] border border-[var(--color-border-subtle)] group-hover:scale-105 group-hover:text-[var(--color-primary-base)]"
                      }`}
                    >
                      <Icon
                        size={20}
                        className={isSelected ? "animate-pulse" : ""}
                      />
                    </div>

                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`text-[9px] font-mono font-black tracking-wider uppercase ${
                            isSelected
                              ? "text-[var(--color-primary-base)]"
                              : "text-[var(--color-text-tertiary)]"
                          }`}
                        >
                          {step.id} • {step.estTime}
                        </span>
                      </div>
                      <div
                        className={`text-sm sm:text-base font-bold tracking-tight transition-colors ${
                          isSelected
                            ? "text-[var(--color-text-primary)]"
                            : "text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]"
                        }`}
                      >
                        {step.title}
                      </div>
                      <p className="text-xs text-[var(--color-text-secondary)] line-clamp-1 opacity-80">
                        {step.shortDesc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Right Interactive Detail Workbench: Staggered list items and metrics */}
            <div className="lg:col-span-7 order-1 lg:order-2">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeStep}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel rounded-[var(--radius-bento)] p-6 sm:p-10 relative overflow-hidden flex flex-col justify-between min-h-[440px]"
                >
                  {/* Decorative mesh glows */}
                  <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--color-primary-muted)] rounded-full blur-[90px] opacity-15 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                  <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--color-primary-muted)] rounded-full blur-[70px] opacity-5 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

                  {/* Active step panel header */}
                  <div className="flex items-start pb-6 border-b border-[var(--color-border-subtle)]/50 relative z-10 w-full">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl sm:text-3xl font-display font-black text-[var(--color-primary-base)]/50 font-mono tracking-tight leading-none">
                        {steps[activeStep].id}
                      </span>
                      <div>
                        <h2 className="text-lg sm:text-xl font-display font-black text-[var(--color-text-primary)] tracking-tight leading-tight">
                          {steps[activeStep].title}
                        </h2>
                        <span className="text-[10px] font-mono font-black text-[var(--color-primary-base)] uppercase tracking-widest block mt-0.5">
                          {steps[activeStep].estTime}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Core description & key checklist */}
                  <div className="py-6 space-y-5 relative z-10 flex-1">
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {steps[activeStep].desc}
                    </p>

                    <div className="space-y-3 pt-2">
                      <span className="text-[10px] font-mono font-black text-[var(--color-text-tertiary)] uppercase tracking-wider block">
                        <T en="Key Deliverables Check">
                          Entregables verificados de la fase:
                        </T>
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {steps[activeStep].deliverables.map((item, dIdx) => (
                          <div
                            key={dIdx}
                            className="flex items-start gap-2.5 p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[11px] sm:text-xs font-bold text-[var(--color-text-secondary)] hover:border-[var(--color-primary-base)]/30 transition-all duration-200"
                          >
                            <div className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/10">
                              <Check size={11} className="stroke-[3.5px]" />
                            </div>
                            <span className="leading-snug">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Quality benchmark bottom card */}
                  <div className="pt-6 border-t border-[var(--color-border-subtle)]/50 mt-4 relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <span className="text-[9px] font-mono font-black text-[var(--color-text-tertiary)] uppercase tracking-widest block mb-1">
                        <T en="Quality Success Milestone">
                          Fase de calidad y éxito
                        </T>
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-4.5 h-4.5 rounded bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] flex items-center justify-center shrink-0">
                          <Check size={10} className="stroke-[3px]" />
                        </div>
                        <p className="text-[11px] sm:text-xs font-bold text-[var(--color-text-primary)] leading-tight">
                          {steps[activeStep].kpi}
                        </p>
                      </div>
                    </div>

                    <div>
                      <span className="text-[9px] font-mono font-black text-[var(--color-text-tertiary)] uppercase tracking-widest block mb-1">
                        <T en="Engineering Assurance">Revisión de ingeniería</T>
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="w-4.5 h-4.5 rounded bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                          <Sparkles size={10} className="fill-amber-500/10" />
                        </div>
                        <p className="text-[11px] sm:text-xs font-bold text-[var(--color-text-primary)] leading-tight">
                          {steps[activeStep].polarismethod}
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Final CTA Action */}
        <section className="mt-28 md:mt-32 space-y-10">
          <div className="text-center space-y-4">
            <span className="glass-badge inline-block text-emerald-500 text-[10px] font-mono font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border border-emerald-500/20">
              <T en="Interactive & Direct Options">
                Opciones de contacto a medida
              </T>
            </span>
            <h2 className="text-3xl md:text-6xl font-display font-black tracking-tighter text-[var(--color-text-primary)]">
              <T en="Ready to elevate your digital presence?">
                ¿Listo para elevar tu presencia digital?
              </T>
            </h2>
            <p className="text-[var(--color-text-secondary)] max-w-2xl mx-auto text-base md:text-lg leading-relaxed">
              <T en="Choose how you prefer to start. Build your own live estimate step-by-step or skip straight to booking an alignment video call with our team.">
                Selecciona cómo prefieres empezar. Elige diseñar tu presupuesto
                paso a paso o agenda directamente una videoconferencia de
                alineación.
              </T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {/* Path 1: Planificador */}
            <div className="p-8 rounded-[var(--radius-bento)] glass-panel transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[280px] bento-glow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--color-primary-muted)]/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] flex items-center justify-center">
                  <Calculator size={22} />
                </div>
                <h3 className="text-xl md:text-2xl font-display font-black text-[var(--color-text-primary)]">
                  <T en="1. Plan your Project">1. Planificar tu Proyecto</T>
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <T en="Configure project type, scale, complexity, and custom AI integrations. Receive a tailored, detailed price estimation dynamically.">
                    Define el tipo de proyecto, alcance de pantallas,
                    integraciones y obtén una estimación de inversión
                    automatizada al instante.
                  </T>
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <button
                  type="button"
                  onClick={() => navigate("/cotizar")}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--color-surface-highlight)] text-[var(--color-text-primary)] border border-[var(--color-border-strong)] font-bold text-xs uppercase tracking-wider hover:bg-[var(--color-primary-base)] hover:text-white hover:border-[var(--color-primary-base)] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <T en="Go to Project Planner">Ir al Planificador</T>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>

            {/* Path 2: Direct Consultation */}
            <div className="p-8 rounded-[var(--radius-bento)] glass-panel transition-all duration-300 relative overflow-hidden group flex flex-col justify-between min-h-[280px] bento-glow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-2xl group-hover:scale-125 transition-transform duration-500 pointer-events-none" />
              <div className="relative z-10 space-y-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                  <Calendar size={22} className="animate-pulse" />
                </div>
                <h3 className="text-xl md:text-2xl font-display font-black text-[var(--color-text-primary)]">
                  <T en="2. Direct Alignment Call">2. Consultaría Directa</T>
                </h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                  <T en="Book a direct 15-minute Google Meet in our calendar now. Have a face-to-face strategical talk regarding goals and deadlines.">
                    Agenda directamente una videollamada de 15 minutos en
                    nuestro calendario. Define metas, fechas de entrega y aclara
                    dudas cara a cara.
                  </T>
                </p>
              </div>
              <div className="pt-6 relative z-10">
                <button
                  type="button"
                  onClick={() => {
                    setIsSchedulerOpen(true);
                    setIsSuccess(false);
                  }}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-[var(--color-primary-base)] text-white font-bold text-xs uppercase tracking-wider hover:brightness-110 active:scale-[0.98] shadow-lg shadow-[var(--color-primary-base)]/25 transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <T en="Book Live Consultation">
                    Agendar Consultoría Gratuita
                  </T>
                  <ArrowRight size={14} />
                </button>
              </div>
            </div>
          </div>
        </section>
        {/* Immersive Cal.com Scheduler Modal */}
        <AnimatePresence>
          {isSchedulerOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              {/* Backdrop overlay with premium modern blur */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSchedulerOpen(false)}
                className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
              />

              {/* Modal window container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 30 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 30 }}
                transition={{ type: "spring", duration: 0.5, bounce: 0.15 }}
                className="relative glass-panel w-full max-w-4xl rounded-3xl overflow-hidden flex flex-col max-h-[90vh] z-10"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] relative z-20">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <h3 className="text-sm font-display font-black text-[var(--color-text-primary)]">
                        <T en="Strategic Consultation">
                          Consultoría Estratégica
                        </T>
                      </h3>
                      <p className="text-[10px] text-[var(--color-text-tertiary)] font-medium">
                        <T en="Direct video-call with Polaris team via Google Meet">
                          Videollamada directa vía Google Meet con el equipo de
                          Polaris
                        </T>
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => setIsSchedulerOpen(false)}
                    className="p-1.5 rounded-lg bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-border-subtle)] transition-all focus:outline-none cursor-pointer"
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Calendar Body */}
                <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[var(--color-surface-base)] relative">
                  {isSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 md:p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px] h-full"
                    >
                      <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                        <Check size={32} />
                      </div>
                      <h2 className="text-2xl md:text-3xl font-display font-black text-[var(--color-text-primary)]">
                        <T en="Consultation Booked!">¡Consultoría Agendada!</T>
                      </h2>
                      <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                        <T en="We have successfully registered your session. A Google Meet invitation link has been dispatched to your email address. See you soon!">
                          Hemos registrado tu sesión de forma exitosa. Se ha
                          enviado una invitación interactiva con el enlace de
                          Google Meet a tu correo. ¡Nos vemos pronto!
                        </T>
                      </p>
                      <button
                        onClick={() => setIsSchedulerOpen(false)}
                        className="px-6 py-2.5 bg-[var(--color-primary-base)] text-white rounded-xl font-bold hover:scale-103 hover:brightness-110 active:scale-97 transition-all cursor-pointer"
                      >
                        <T en="Close">Cerrar</T>
                      </button>
                    </motion.div>
                  ) : (
                    <div
                      className="w-full rounded-2xl overflow-hidden border border-[var(--color-border-subtle)] min-h-[480px] h-[520px]"
                      style={
                        {
                          "--cal-brand-color": "#10b981",
                          "--cal-brand": "#10b981",
                          "--cal-brand-emphasis": "#059669",
                        } as React.CSSProperties
                      }
                    >
                      <Cal
                        calLink={`cristian-dicen/consultoria-polaris?notes=${encodeURIComponent(
                          language === "en"
                            ? "Direct consultation booked from the Work Methodology page."
                            : "Consulta directa programada desde la sección de Metodología de Trabajo.",
                        )}`}
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
                    </div>
                  )}
                </div>

                {/* Footer with a helpful reminder */}
                <div className="px-6 py-3 border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex justify-between items-center text-[10px] text-[var(--color-text-tertiary)]">
                  <span>
                    <T en="* Direct video meeting length: 15 mins.">
                      * Duración aproximada de la reunión: 15 minutos.
                    </T>
                  </span>
                  <span>
                    <T en="Polaris Methodology">Metodología Polaris</T>
                  </span>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      <Footer />
    </div>
  );
}
