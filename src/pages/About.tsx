import React from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Target,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Globe,
  Cpu,
  Code2,
  Award,
  Zap,
  Sparkles,
  Command,
  Check,
  CheckCircle2,
  Terminal,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import ContactSection from "../components/ContactSection";
import { T } from "../context/LanguageContext";

export default function About() {
  const navigate = useNavigate();

  const values = [
    {
      id: "01",
      title: <T en="Precision">Precisión</T>,
      tagline: <T en="Handcrafted perfection">Perfección hecha a mano</T>,
      description: (
        <T en="Every line of code and every pixel has a defined purpose. We leave nothing to chance.">
          Cada línea de código y cada píxel tiene un propósito definido. No dejamos nada al azar.
        </T>
      ),
      icon: Target,
      color: "text-indigo-500",
      bg: "bg-indigo-500/10",
      border: "hover:border-indigo-500/30",
    },
    {
      id: "02",
      title: <T en="Innovation">Innovación</T>,
      tagline: <T en="State-Of-The-Art stack">Tecnología de vanguardia</T>,
      description: (
        <T en="We explore the latest technologies to deliver solutions that not only work today, but lead tomorrow.">
          Exploramos las últimas tecnologías para ofrecer soluciones que no solo funcionen hoy, sino que lideren mañana.
        </T>
      ),
      icon: Lightbulb,
      color: "text-amber-500",
      bg: "bg-amber-500/10",
      border: "hover:border-amber-500/30",
    },
    {
      id: "03",
      title: <T en="Results">Resultados</T>,
      tagline: <T en="High-converting assets">Conversión y rentabilidad</T>,
      description: (
        <T en="We don't just build websites; we create business tools that generate real conversions and client trust.">
          No solo construimos sitios web; creamos herramientas de negocio que generan conversiones reales y confianza.
        </T>
      ),
      icon: TrendingUp,
      color: "text-emerald-500",
      bg: "bg-emerald-500/10",
      border: "hover:border-emerald-500/30",
    },
  ];

  const coreCapabilities = [
    { name: <T en="Modern & Attractive Design">Diseño Visual Atractivo y Moderno</T>, value: "98%" },
    { name: <T en="Google Visibility & SEO">Visibilidad y Posicionamiento en Google (SEO)</T>, value: "100%" },
    { name: <T en="Ultra-fast Loading Speed">Velocidad de Carga Ultra Rápida</T>, value: "99%" },
    { name: <T en="Mobile & Tablet Optimization">Compatibilidad Perfecta con Celulares</T>, value: "100%" },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      {/* Premium Tech Background grids */}
      <div className="absolute inset-x-0 top-0 h-[800px] bg-gradient-to-b from-[var(--color-primary-base)]/5 via-transparent to-transparent pointer-events-none" />
      <div className="absolute top-[20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-indigo-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[30%] right-[-10%] w-[500px] h-[500px] rounded-full bg-violet-500/5 blur-[120px] pointer-events-none" />
      
      {/* Background Micro Grid lines */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px] pointer-events-none" />

      <Navbar />

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-12 md:py-24 relative z-10 space-y-36">
        {/* HERO SECTION */}
        <section className="flex flex-col items-center text-center gap-6 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center px-4 py-1.5 rounded-full bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 text-indigo-600 dark:text-indigo-400 text-xs font-mono font-black uppercase tracking-wider"
          >
            <T en="EXCLUSIVE DIGITAL STUDIO">ESTUDIO DIGITAL DE ÉLITE</T>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.5 }}
            className="text-4xl sm:text-6xl md:text-[5.5rem] font-display font-black leading-[1.05] tracking-tight text-[var(--color-text-primary)]"
          >
            <T
              en={
                <>
                  Developing Web <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                    With Pure Precision.
                  </span>
                </>
              }
            >
              Desarrollo Web <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500">
                Con Pura Precisión.
              </span>
            </T>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.5 }}
            className="text-base sm:text-lg md:text-xl text-[var(--color-text-secondary)] leading-relaxed max-w-2xl mx-auto"
          >
            <T en="Polaris Web Studio bridges the gap between beautiful aesthetics and professional web development. We craft bespoke digital machinery to maximize conversion and speed.">
              Polaris Web Studio cierra la brecha entre la estética impecable y el desarrollo web profesional. Diseñamos maquinaria digital a medida para maximizar conversiones y velocidad.
            </T>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="pt-4 flex flex-wrap gap-4 items-center justify-center text-xs font-mono text-[var(--color-text-secondary)]"
          >
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <T en="Clean, Optimized Code">Código Limpio y Optimizado</T>
            </span>
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <T en="100% Performance Driven">Enfoque de Alto Rendimiento</T>
            </span>
          </motion.div>
        </section>

        {/* STORY & TECHNICAL SPECS SECTION */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Story */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-7 space-y-6"
          >
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-500 tracking-wider uppercase">
              <span>01 /</span>
              <T en="Identity & Core DNA">Identidad y ADN Fundamental</T>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
              <T en="Elevating the regional web standard.">Elevando el estándar web en toda la región.</T>
            </h2>

            <div className="space-y-4 text-[var(--color-text-secondary)] leading-relaxed text-sm md:text-base">
              <p>
                <T en="Polaris Web Studio was created with a clear, uncompromising standard: to eradicate sluggish templates, boring design, and fragile code. We believe your digital presence should be your strongest sales asset, not a digital liability.">
                  Polaris Web Studio nació con un estándar firme y sin concesiones: erradicar las plantillas lentas, el diseño genérico y el código descuidado. Creamos soluciones donde cada pixel e interacción sirve a tus metas empresariales.
                </T>
              </p>
              <p>
                <T en="What started as an absolute obsession for clean, efficient technology has grown into an independent digital craft facility. Today, we build bespoke digital platforms for visionary agencies, founders, and enterprises globally.">
                  Lo que comenzó como una obsesión absoluta por la velocidad y la eficiencia del software, se ha transformado en un taller de artesanía digital de alta tecnología que presta servicios a marcas globales, startups disruptivas y corporaciones independientes.
                </T>
              </p>
              <p className="font-semibold text-[var(--color-text-primary)]">
                <T en="We don't buy templates. We don't settle for 'good enough'. We build lightning-fast web infrastructure configured for total growth.">
                  Nosotros no compramos plantillas. No nos conformamos con lo común. Construimos infraestructura web ultra rápida configurada estratégicamente para tu escalabilidad.
                </T>
              </p>
            </div>
          </motion.div>

          {/* Right Column: Spec-Sheet (Aesthetic high-tech panel) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 relative"
          >
            <div className="absolute inset-0 rounded-[var(--radius-bento)] bg-gradient-to-tr from-indigo-500/10 via-purple-500/5 to-transparent pointer-events-none" />
            <div className="p-6 md:p-8 rounded-[var(--radius-bento)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] relative overflow-hidden backdrop-blur-sm space-y-6 shadow-xl">
              {/* Terminal-like window decorations */}
              <div className="flex items-center justify-between border-b border-[var(--color-border-subtle)] pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-rose-500/30 border border-rose-500/50" />
                  <div className="w-3 h-3 rounded-full bg-amber-500/30 border border-amber-500/50" />
                  <div className="w-3 h-3 rounded-full bg-emerald-500/30 border border-emerald-500/50" />
                </div>
                <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] uppercase tracking-widest">
                  firmware_meta.json
                </span>
              </div>

              {/* High Performance Metrics */}
              <div className="space-y-5">
                <h4 className="text-xs font-mono uppercase tracking-widest text-[var(--color-text-primary)] font-bold">
                  <T en="STABILITY SPEC SHEET">FICHA TÉCNICA Y GARANTÍAS</T>
                </h4>

                <div className="space-y-4">
                  {/* Metric 1 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)] font-medium">
                        <T en="Average Lighthouse Score">Rendimiento Google Lighthouse</T>
                      </span>
                      <span className="font-mono text-emerald-500 font-bold">100/100</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-base)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border-subtle)]/30">
                      <div className="bg-emerald-500 h-full rounded-full w-full" />
                    </div>
                  </div>

                  {/* Metric 2 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)] font-medium">
                        <T en="Web Vitals Load Time">Velocidad de Carga Inicial</T>
                      </span>
                      <span className="font-mono text-indigo-500 font-bold">&lt; 0.5s</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-base)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border-subtle)]/30">
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-400 h-full rounded-full w-[95%]" />
                    </div>
                  </div>

                  {/* Metric 3 */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs">
                      <span className="text-[var(--color-text-secondary)] font-medium">
                        <T en="Search Engine Optimization (SEO)">Estructura e Indexación SEO</T>
                      </span>
                      <span className="font-mono text-purple-500 font-bold">100%</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-base)] h-1.5 rounded-full overflow-hidden border border-[var(--color-border-subtle)]/30">
                      <div className="bg-purple-500 h-full rounded-full w-full" />
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-[var(--color-border-subtle)]/40 grid grid-cols-2 gap-4">
                  <div className="bg-[var(--color-surface-base)] p-3.5 rounded-xl border border-[var(--color-border-subtle)] text-center">
                    <div className="text-xl sm:text-2xl font-display font-black text-[var(--color-primary-base)]">
                      100%
                    </div>
                    <div className="text-[10px] font-mono uppercase text-[var(--color-text-secondary)] mt-0.5">
                      <T en="Bespoke Code">Código a Medida</T>
                    </div>
                  </div>
                  <div className="bg-[var(--color-surface-base)] p-3.5 rounded-xl border border-[var(--color-border-subtle)] text-center">
                    <div className="text-xl sm:text-2xl font-display font-black text-[var(--color-primary-base)]">
                      24/7
                    </div>
                    <div className="text-[10px] font-mono uppercase text-[var(--color-text-secondary)] mt-0.5">
                      <T en="Online Asset">Activo Inteligente</T>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] font-mono text-[var(--color-text-secondary)] bg-zinc-500/5 px-3 py-2 rounded-lg border border-[var(--color-border-subtle)]/40">
                  <Globe size={12} className="text-indigo-400 animate-spin" style={{ animationDuration: "12s" }} />
                  <span>
                    <T en="Hyper-secure global servers operation">Infraestructura global de respuesta optimizada</T>
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* CORE VALUES Grid */}
        <section className="space-y-12">
          <div className="text-center space-y-4 max-w-2xl mx-auto">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-500 tracking-wider uppercase">
              <span>02 /</span>
              <T en="Our Absolute Creed">Nuestro Credo y Valores</T>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
              <T en="Values that direct our development focus.">Valores que dirigen nuestro enfoque.</T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base">
              <T en="Our standard is high. We develop software configured to generate confidence and scale your market footprint.">
                Nuestro estándar de calidad es absoluto. Desarrollamos herramientas diseñadas para proyectar confianza y multiplicar tus ventas.
              </T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className={`p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] hover:border-indigo-500/30 transition-all duration-300 bento-glow-hover flex flex-col justify-between group h-full relative overflow-hidden`}
              >
                {/* Visual Number top right */}
                <span className="absolute top-6 right-8 font-mono text-3xl font-black text-indigo-500/5 group-hover:text-indigo-500/10 transition-colors pointer-events-none">
                  {value.id}
                </span>

                <div className="space-y-6">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border border-[var(--color-border-strong)] bg-[var(--color-surface-base)] ${value.bg}`}>
                    <value.icon className={`w-7 h-7 ${value.color}`} />
                  </div>
                  <div className="space-y-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-indigo-500">
                      {value.tagline}
                    </span>
                    <h3 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
                      {value.title}
                    </h3>
                    <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                      {value.description}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* METRICS & DIGITAL CAPABILITIES */}
        <section className="p-8 md:p-12 rounded-[var(--radius-bento)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent pointer-events-none" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative z-10">
            {/* Left Area: Title & description */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-500 tracking-wider uppercase">
                <span>03 /</span>
                <T en="Focus on Results">Enfoque en Resultados</T>
              </div>
              <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
                <T en="Experiences built to grow your business.">Experiencias creadas para hacer crecer tu negocio.</T>
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm md:text-base">
                <T en="We don't just write code; we build commercial tools that capture your customers' attention instantly. Each site is designed for speed and reliability, so your brand communicates absolute professionalism, trust, and authority in the market.">
                  No nos limitamos a escribir código; creamos herramientas comerciales que capturan la atención de tus clientes al instante. Diseñamos con un rendimiento impecable para que tu marca proyecte total profesionalismo, confianza y autoridad en el mercado.
                </T>
              </p>
              
              <div className="flex flex-wrap gap-3 pt-2">
                <span className="px-3 py-1.5 text-xs font-mono bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg font-bold">
                  <T en="100% Custom Design">Diseño 100% Personalizado</T>
                </span>
                <span className="px-3 py-1.5 text-xs font-mono bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg font-bold">
                  <T en="Instant Loading">Velocidad de Carga Inmediata</T>
                </span>
                <span className="px-3 py-1.5 text-xs font-mono bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg font-bold">
                  <T en="SEO Friendly">Optimizado para Google</T>
                </span>
                <span className="px-3 py-1.5 text-xs font-mono bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-lg font-bold">
                  <T en="Mobile Optimized">Adaptable a Celulares</T>
                </span>
              </div>
            </div>

            {/* Right Area: Capabilities Progress Bars */}
            <div className="space-y-6 bg-[var(--color-surface-base)] p-6 md:p-8 rounded-2xl border border-[var(--color-border-subtle)] shadow-inner">
              <h3 className="font-mono text-xs font-bold uppercase tracking-widest text-[var(--color-text-primary)] flex items-center gap-2 pb-4 border-b border-[var(--color-border-subtle)]/40">
                <Command size={14} className="text-indigo-500 animate-spin" style={{ animationDuration: "8s" }} />
                <T en="STUDIO QUALITY RATINGS">ÍNDICES DE CALIDAD COMPROBADOS</T>
              </h3>
              
              <div className="space-y-4">
                {coreCapabilities.map((cap, idx) => (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-[var(--color-text-secondary)]">{cap.name}</span>
                      <span className="font-mono font-bold text-indigo-500">{cap.value}</span>
                    </div>
                    <div className="w-full bg-[var(--color-surface-elevated)] h-2 rounded-full overflow-hidden border border-[var(--color-border-subtle)]/30">
                      <div 
                        className="bg-indigo-500 h-full rounded-full transition-all duration-1000" 
                        style={{ width: cap.value }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* FOUNDER & CHIEF ENGINEER PROFILE (CRISTIAN DICEN) */}
        <section className="space-y-12">
          <div className="text-center space-y-4 max-w-xl mx-auto">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-500 tracking-wider uppercase">
              <span>04 /</span>
              <T en="The Mastermind">La Mente Maestra</T>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
              <T en="Lead Developer & Founder">Desarrollador Principal & Fundador</T>
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm md:text-base">
              <T en="Direct point of communication, ensuring unmatched conceptual synchronization.">
                Atención totalmente directa y sin intermediarios para garantizar la máxima precisión técnica de tu idea.
              </T>
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12 p-8 md:p-12 rounded-[var(--radius-bento)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] relative overflow-hidden shadow-xl"
            >
              {/* Left Column: Visual Developer ID Badge / Interactive Container */}
              <div className="md:col-span-5 flex flex-col items-center justify-center space-y-6">
                <div className="relative">
                  {/* Decorative glowing border ring */}
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-indigo-500 via-purple-500 to-pink-500 opacity-20 blur-sm animate-pulse" />
                  
                  {/* Inner ID Initials Avatar */}
                  <div className="relative w-40 h-40 rounded-full border-4 border-[var(--color-border-strong)] bg-[var(--color-surface-base)] mx-auto flex flex-col items-center justify-center text-5xl font-display font-black text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 select-none shadow-2xl">
                    <span>CD</span>
                    <span className="text-[10px] font-mono tracking-widest text-[var(--color-text-tertiary)] uppercase mt-1">
                      CRISTIAN
                    </span>
                  </div>
                </div>

                {/* Technical Tags */}
                <div className="flex flex-wrap gap-2 justify-center">
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[var(--color-surface-base)] border border-indigo-500/20 text-indigo-500 rounded-full font-bold">
                    Web Developer
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[var(--color-surface-base)] border border-purple-500/20 text-purple-500 rounded-full font-bold">
                    SEO Strategist
                  </span>
                  <span className="px-2.5 py-1 text-[10px] font-mono uppercase bg-[var(--color-surface-base)] border border-emerald-500/20 text-emerald-500 rounded-full font-bold">
                    UX Lead
                  </span>
                </div>
              </div>

              {/* Right Column: Narrative Biography / Executive Overview */}
              <div className="md:col-span-7 space-y-6 flex flex-col justify-center text-left">
                <div className="space-y-2">
                  <h3 className="text-3xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
                    Cristian Dicen
                  </h3>
                  <p className="text-xs font-mono uppercase tracking-[0.2em] text-indigo-500 font-bold">
                    <T en="FOUNDER & LEAD DEVELOPER">FUNDADOR Y DESARROLLADOR WEB PRINCIPAL</T>
                  </p>
                </div>

                <div className="space-y-4 text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed">
                  <p>
                    <T en="An advisor, designer, and full-stack developer with expert mastery of the Google ecosystem, next-generation web tech stacks, and digital strategy.">
                      Creador, diseñador y programador de software full-stack con un profundo dominio del ecosistema de Google, las arquitecturas modernas de desarrollo y la consultoría estratégica.
                    </T>
                  </p>
                  <p>
                    <T en="With an unwavering obsession for performance optimization, SEO, and visual cleanliness, I build web solutions that solve business critical needs. If there is a bottleneck, or a design that looks obsolete, I create the perfect remedy.">
                      Con una inquebrantable obsesión por el rendimiento, la accesibilidad de primer nivel y la pulcritud estética, desarrollo soluciones de software que resuelven prioridades de negocio reales. No construyo páginas genéricas; configuro motores de captación y venta.
                    </T>
                  </p>
                </div>

                {/* Work Statistics Grid */}
                <div className="grid grid-cols-3 gap-4 pt-4 border-t border-[var(--color-border-subtle)]/30 font-mono">
                  <div className="space-y-1">
                    <div className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">
                      5+
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                      <T en="Years Exper">Años Exper.</T>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">
                      25+
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                      <T en="Projects">Proyectos</T>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="text-lg md:text-xl font-bold text-[var(--color-text-primary)]">
                      99%
                    </div>
                    <div className="text-[9px] uppercase tracking-wider text-[var(--color-text-secondary)]">
                      <T en="Satisfac.">Satisfac.</T>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* REVOLUTIONARY HIGH-PERFORMANCE CTA */}
        <section className="text-center space-y-10 pt-16">
          <div className="space-y-4 max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-indigo-500 tracking-wider uppercase bg-indigo-500/5 px-3 py-1 rounded-full border border-indigo-500/10">
              <Zap size={12} className="text-indigo-500" />
              <T en="SECURE YOUR COVETED SLOT">ASEGURA TU LUGAR HOY MISMO</T>
            </div>
            
            <h2 className="text-4xl sm:text-5xl md:text-7xl font-display font-black tracking-tighter text-[var(--color-text-primary)] leading-[1.05]">
              <T en="Ready to build the future of your brand?">
                ¿Listo para construir el futuro de tu marca?
              </T>
            </h2>
            
            <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto text-sm sm:text-base leading-relaxed">
              <T en="Calculate a fully customized quotation and gain diagnostic technical feedback for your digital platform. No strings attached.">
                Calcula una cotización 100% personalizada y recibe un diagnóstico técnico estratégico para tu plataforma web. Sin compromisos.
              </T>
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <div className="relative group shrink-0 inline-flex">
              {/* High-Performance, GPU-Composited glowing pulse ring */}
              <div className="absolute inset-0 rounded-xl bg-[var(--color-primary-base)]/50 pointer-events-none animate-cta-glow-pulse" style={{ filter: "blur(6px)" }} />
              <button
                onClick={() => navigate("/cotizar")}
                className="group relative overflow-hidden inline-flex items-center gap-2 px-8 py-4 sm:px-10 sm:py-4.5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-base sm:text-lg hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 cursor-pointer"
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />

                <Cpu size={18} className="group-hover:rotate-12 transition-transform" />
                <T en="Plan your Project">Planifica tu Proyecto</T>
                <ArrowRight size={18} className="ml-1 group-hover:translate-x-1.5 transition-transform" />
              </button>
            </div>
          </div>
        </section>
      </main>

      <ContactSection />
      <Footer />
    </div>
  );
}
