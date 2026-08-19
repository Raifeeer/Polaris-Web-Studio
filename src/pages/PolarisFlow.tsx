import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CircleDot,
  GitBranch,
  Layers3,
  ShieldCheck,
  Sparkles,
  Workflow,
  Zap,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";

const reveal = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

const packages = [
  {
    eyebrow: "FIRST BUILD",
    title: "Office Flow",
    description:
      "Cotizaciones, documentos, aprobaciones y seguimiento en un solo recorrido operativo.",
    enDescription:
      "Quotes, documents, approvals and follow-up in one operational flow.",
    accent: "#2dd4bf",
    icon: Workflow,
    status: "Ahora",
    enStatus: "Now",
    href: "#office-flow",
  },
  {
    eyebrow: "CONVERSATION",
    title: "Chat Convert",
    description:
      "Convierte conversaciones de WhatsApp y otros canales en oportunidades con siguiente paso.",
    enDescription:
      "Turn WhatsApp and other conversations into opportunities with a clear next step.",
    accent: "#25d366",
    icon: GitBranch,
    status: "Siguiente",
    enStatus: "Next",
    href: "#packages",
  },
  {
    eyebrow: "HOSPITALITY",
    title: "Villa Flow",
    description:
      "Coordina reservas, equipos, mantenimiento y tareas sin perder el estado de cada estancia.",
    enDescription:
      "Coordinate stays, teams, maintenance and tasks without losing operational state.",
    accent: "#34d399",
    icon: Layers3,
    status: "Vertical",
    enStatus: "Vertical",
    href: "#packages",
  },
];

const pipeline = [
  { number: "01", title: "Recibe", text: "El lead entra desde el canal donde ya está tu cliente." },
  { number: "02", title: "Ordena", text: "El sistema clasifica, valida y detecta qué información falta." },
  { number: "03", title: "Prepara", text: "La cotización o el documento se arma con tus reglas aprobadas." },
  { number: "04", title: "Confirma", text: "Una persona aprueba el siguiente paso antes de enviarlo." },
];

function FlowMark({ size = 44 }: { size?: number }) {
  return <img src="/brand/polaris-flow-mark.svg" alt="" width={size} height={size} aria-hidden="true" />;
}

export default function PolarisFlow() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="min-h-dvh bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />
      <main className="overflow-hidden">
        <section className="relative isolate px-6 pb-24 pt-20 md:px-12 md:pb-32 md:pt-28">
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-70" aria-hidden="true">
            <div className="absolute left-[8%] top-20 h-72 w-72 rounded-full bg-[#2dd4bf]/10 blur-3xl" />
            <div className="absolute right-[8%] top-10 h-96 w-96 rounded-full bg-[#4f46e5]/15 blur-3xl" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
            <motion.div
              variants={reveal}
              initial="hidden"
              animate="visible"
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="mb-8 flex items-center gap-3">
                <img
                  src="/brand/polaris-flow-lockup-horizontal-dark.svg"
                  alt="Polaris Flow"
                  className="h-12 w-auto [.light_&]:hidden"
                />
                <img
                  src="/brand/polaris-flow-lockup-horizontal-light.svg"
                  alt="Polaris Flow"
                  className="hidden h-12 w-auto [.light_&]:block"
                />
              </div>

              <p className="mb-5 flex items-center gap-2 text-xs font-black uppercase tracking-[0.24em] text-[#5eead4]">
                <span className="h-2 w-2 rounded-full bg-[#2dd4bf] shadow-[0_0_18px_rgba(45,212,191,0.9)]" />
                <T en="Revenue & Operations">Revenue & Operations</T>
              </p>
              <h1 className="max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                <T en="Your operation should not live inside your head.">
                  Tu operación no debería vivir dentro de tu cabeza.
                </T>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
                <T en="Polaris Flow turns repetitive work into visible, approved and measurable systems — without forcing your team to become technical.">
                  Polaris Flow convierte el trabajo repetitivo en sistemas visibles, aprobados y medibles, sin obligar a tu equipo a volverse técnico.
                </T>
              </p>

              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <a
                  href="#office-flow"
                  className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#2dd4bf] px-5 py-3.5 text-sm font-black text-[#042f2e] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]"
                >
                  <T en="See the first flow">Ver el primer flujo</T>
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </a>
                <Link
                  to="/contacto?service=polaris-flow"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] px-5 py-3.5 text-sm font-black text-[var(--color-text-primary)] transition-colors hover:border-[#2dd4bf]/70 hover:bg-[#2dd4bf]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]"
                >
                  <T en="Design my workflow">Diseñar mi flujo</T>
                  <ArrowUpRight size={16} aria-hidden="true" />
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#2dd4bf]" aria-hidden="true" /> <T en="Human approval">Aprobación humana</T></span>
                <span className="inline-flex items-center gap-2"><Zap size={15} className="text-[#2dd4bf]" aria-hidden="true" /> <T en="Built around your rules">Basado en tus reglas</T></span>
              </div>
            </motion.div>

            <motion.div
              variants={reveal}
              initial="hidden"
              animate="visible"
              transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-[#2dd4bf]/25 bg-[#071b20] p-5 shadow-[0_28px_90px_rgba(2,6,23,0.42)] md:p-7">
                <div className="absolute inset-0 opacity-25" style={{ backgroundImage: "linear-gradient(rgba(45,212,191,.13) 1px, transparent 1px), linear-gradient(90deg, rgba(45,212,191,.13) 1px, transparent 1px)", backgroundSize: "34px 34px" }} aria-hidden="true" />
                <div className="relative">
                  <div className="mb-7 flex items-center justify-between border-b border-white/10 pb-4">
                    <div className="flex items-center gap-3">
                      <FlowMark size={38} />
                      <div>
                        <p className="text-sm font-black text-white">Office Flow</p>
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#99f6e4]/70">workflow / live map</p>
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-[#2dd4bf]/30 bg-[#2dd4bf]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#99f6e4]"><span className="h-1.5 w-1.5 rounded-full bg-[#2dd4bf]" /> active</span>
                  </div>

                  <div className="relative grid gap-3 md:grid-cols-[1fr_0.68fr_1fr] md:items-center">
                    <div className="space-y-3">
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5eead4]">01 / intake</p>
                        <p className="mt-2 text-sm font-bold text-white">Nuevo lead recibido</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">Formulario · correo · canal autorizado</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5eead4]">02 / classify</p>
                        <p className="mt-2 text-sm font-bold text-white">Datos organizados</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">Tipo · urgencia · siguiente paso</p>
                      </div>
                    </div>

                    <div className="relative flex min-h-24 items-center justify-center">
                      <div className="absolute left-2 right-2 hidden h-px bg-gradient-to-r from-transparent via-[#2dd4bf] to-transparent md:block" />
                      <div className="relative flex h-24 w-24 items-center justify-center rounded-[1.7rem] border border-[#5eead4]/45 bg-[#2dd4bf]/15 shadow-[0_0_44px_rgba(45,212,191,.18)]">
                        <div className="absolute inset-3 rounded-[1.2rem] border border-[#99f6e4]/25" />
                        <CircleDot size={30} className="text-[#99f6e4]" aria-hidden="true" />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="rounded-2xl border border-[#2dd4bf]/25 bg-[#2dd4bf]/10 p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#99f6e4]">03 / prepare</p>
                        <p className="mt-2 text-sm font-bold text-white">Borrador listo</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-300">Cotización · documento · recordatorio</p>
                      </div>
                      <div className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
                        <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-[#5eead4]">04 / approve</p>
                        <p className="mt-2 text-sm font-bold text-white">Esperando tu decisión</p>
                        <p className="mt-1 text-xs leading-relaxed text-slate-400">Nada se envía sin aprobación</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-7 flex items-center justify-between rounded-xl border border-white/10 bg-black/10 px-4 py-3">
                    <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-slate-500">last event</span>
                    <span className="text-xs font-bold text-[#99f6e4]">Quote draft prepared · 08:42</span>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-5 -left-5 hidden h-28 w-28 rounded-full border border-[#2dd4bf]/20 md:block" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-7 -top-7 hidden h-20 w-20 rounded-full border border-[#6366f1]/30 md:block" aria-hidden="true" />
            </motion.div>
          </div>
        </section>

        <section id="flow-map" className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-[#2dd4bf]">The operating system for follow-through</p>
              <h2 className="font-display text-4xl font-black tracking-[-0.05em] md:text-6xl">
                <T en="No more scattered handoffs.">No más traspasos dispersos.</T>
              </h2>
              <p className="mt-5 text-lg leading-relaxed text-[var(--color-text-secondary)]">
                <T en="Every workflow has a visible state, a responsible person and a next action. That is the product.">
                  Cada flujo tiene un estado visible, una persona responsable y una siguiente acción. Ese es el producto.
                </T>
              </p>
            </div>

            <div className="mt-14 grid gap-px overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-border-subtle)] md:grid-cols-4">
              {pipeline.map((step, index) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.05 }}
                  className="bg-[var(--color-surface-base)] p-6 md:p-8"
                >
                  <p className="font-mono text-xs font-bold tracking-[0.2em] text-[#2dd4bf]">{step.number}</p>
                  <h3 className="mt-16 font-display text-2xl font-black">{step.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section id="office-flow" className="px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
            <div>
              <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-[#2dd4bf]">First productized workflow</p>
              <h2 className="font-display text-4xl font-black tracking-[-0.05em] md:text-6xl">Office Flow.</h2>
              <p className="mt-5 max-w-lg text-lg leading-relaxed text-[var(--color-text-secondary)]">
                <T en="A focused operational layer for teams that quote, prepare documents and follow up every day.">
                  Una capa operativa enfocada para equipos que cotizan, preparan documentos y dan seguimiento todos los días.
                </T>
              </p>
              <Link
                to="/contacto?service=office-flow"
                className="mt-8 inline-flex items-center gap-2 text-sm font-black text-[#5eead4] underline decoration-[#2dd4bf]/30 underline-offset-8 transition-colors hover:text-[#99f6e4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]"
              >
                <T en="Talk through your workflow">Hablar sobre mi flujo</T>
                <ArrowUpRight size={16} aria-hidden="true" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              {[
                "Entrada de leads ordenada",
                "Plantillas con tus reglas",
                "Aprobación humana antes de enviar",
                "Seguimiento sin hojas perdidas",
                "Estados visibles por oportunidad",
                "Historial de cada decisión",
              ].map((item) => (
                <div key={item} className="flex items-start gap-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] p-5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#2dd4bf]/15 text-[#5eead4]"><Check size={13} strokeWidth={3} aria-hidden="true" /></span>
                  <span className="text-sm font-bold leading-relaxed text-[var(--color-text-secondary)]">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="packages" className="border-t border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
              <div className="max-w-xl">
                <p className="mb-4 text-xs font-black uppercase tracking-[0.24em] text-[#2dd4bf]">One engine. Different operations.</p>
                <h2 className="font-display text-4xl font-black tracking-[-0.05em] md:text-5xl">Una línea, no una colección de herramientas.</h2>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-[var(--color-text-tertiary)]">Cada vertical tendrá su caso de uso, su onboarding y su resultado. Por debajo, comparten un mismo lenguaje operativo.</p>
            </div>

            <div className="mt-12 grid gap-4 lg:grid-cols-3">
              {packages.map((item, index) => {
                const Icon = item.icon;
                return (
                  <motion.a
                    key={item.title}
                    href={item.href}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.2 }}
                    transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.06 }}
                    className="group relative overflow-hidden rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-7 transition-transform hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2dd4bf]"
                  >
                    <div className="absolute right-0 top-0 h-32 w-32 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: item.accent }} aria-hidden="true" />
                    <div className="relative">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold tracking-[0.2em]" style={{ color: item.accent }}>{item.eyebrow}</span>
                        <span className="rounded-full border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider" style={{ color: item.accent, borderColor: `${item.accent}44`, backgroundColor: `${item.accent}12` }}>
                          <T en={item.enStatus}>{item.status}</T>
                        </span>
                      </div>
                      <div className="mt-12 flex h-12 w-12 items-center justify-center rounded-2xl border" style={{ color: item.accent, borderColor: `${item.accent}55`, backgroundColor: `${item.accent}12` }}>
                        <Icon size={22} aria-hidden="true" />
                      </div>
                      <h3 className="mt-6 font-display text-3xl font-black">{item.title}</h3>
                      <p className="mt-3 min-h-16 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={item.enDescription}>{item.description}</T></p>
                      <span className="mt-8 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-[var(--color-text-tertiary)] transition-colors group-hover:text-[var(--color-text-primary)]"><T en="Explore">Explorar</T><ArrowRight size={14} aria-hidden="true" /></span>
                    </div>
                  </motion.a>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden px-6 py-24 md:px-12 md:py-36">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[28rem] w-[28rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#2dd4bf]/10 blur-3xl" aria-hidden="true" />
          <div className="mx-auto max-w-4xl text-center">
            <Sparkles className="mx-auto mb-7 text-[#5eead4]" size={28} aria-hidden="true" />
            <h2 className="font-display text-4xl font-black tracking-[-0.05em] md:text-6xl">Empieza con un flujo. No con una plataforma.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]">La primera conversación no necesita una lista de integraciones. Necesita entender dónde se pierde el trabajo y qué debería pasar después.</p>
            <Link
              to="/contacto?service=office-flow"
              className="mt-9 inline-flex items-center gap-3 rounded-xl bg-[#2dd4bf] px-6 py-4 text-sm font-black text-[#042f2e] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#5eead4] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]"
            >
              <T en="Map my first workflow">Mapear mi primer flujo</T>
              <ArrowUpRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
