import { motion, useReducedMotion } from "framer-motion";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Check,
  ClipboardCheck,
  Eye,
  FileCheck2,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";
import { useDocumentTitle, useJsonLd } from "../hooks/useDocumentTitle";

const journey = [
  {
    number: "01",
    title: "Recibe",
    enTitle: "Receive",
    text: "Cada oportunidad entra con origen, responsable y siguiente paso visibles.",
    enText: "Every opportunity enters with a visible source, owner and next step.",
  },
  {
    number: "02",
    title: "Ordena",
    enTitle: "Organize",
    text: "La información se reúne antes de convertirse en una búsqueda entre mensajes.",
    enText: "Information is gathered before it becomes a search across messages.",
  },
  {
    number: "03",
    title: "Prepara",
    enTitle: "Prepare",
    text: "Las propuestas se preparan con reglas y contexto que el equipo reconoce.",
    enText: "Proposals are prepared with rules and context the team recognizes.",
  },
  {
    number: "04",
    title: "Confirma",
    enTitle: "Confirm",
    text: "Nada se envía sin una decisión humana clara y registrada.",
    enText: "Nothing is sent without a clear, recorded human decision.",
  },
];

const capabilities = [
  {
    title: "Estado visible por oportunidad",
    enTitle: "Visible status per opportunity",
    text: "El equipo ve qué pasó, qué falta y quién debe actuar.",
    enText: "The team sees what happened, what is missing and who needs to act.",
    icon: Eye,
  },
  {
    title: "Borradores antes de enviar",
    enTitle: "Drafts before sending",
    text: "La preparación avanza el trabajo; la decisión final continúa siendo tuya.",
    enText: "Preparation moves work forward; the final decision remains yours.",
    icon: FileCheck2,
  },
  {
    title: "Aprobación humana obligatoria",
    enTitle: "Mandatory human approval",
    text: "Office Flow no envía propuestas ni comunicaciones por su cuenta.",
    enText: "Office Flow does not send proposals or communications on its own.",
    icon: ShieldCheck,
  },
];

const launchSteps = [
  {
    title: "Mapeamos",
    enTitle: "We map",
    text: "Identificamos por dónde entra el trabajo, dónde se detiene y qué decisión debe quedar visible.",
    enText: "We identify where work enters, where it stops and which decision needs to stay visible.",
  },
  {
    title: "Configuramos",
    enTitle: "We configure",
    text: "Traducimos reglas, documentos y responsables a un recorrido operativo claro.",
    enText: "We translate rules, documents and owners into a clear operational journey.",
  },
  {
    title: "Probamos",
    enTitle: "We test",
    text: "El equipo recorre casos controlados antes de depender del flujo cada día.",
    enText: "Your team walks through controlled cases before depending on the flow every day.",
  },
  {
    title: "Confirmamos",
    enTitle: "We confirm",
    text: "El proceso queda listo cuando sus responsables pueden avanzar con seguridad y criterio.",
    enText: "The process is ready when its owners can move forward with confidence and judgment.",
  },
];

function FlowBrand() {
  return (
    <div className="inline-flex items-center rounded-2xl border border-[#f59e0b]/30 bg-[#fff8e6] px-3 py-2 shadow-[0_14px_40px_rgba(245,158,11,0.14)]">
      <img
        src="/brand/polaris-flow-vertical-dark-official.svg"
        alt="Polaris Flow — Operations in motion"
        className="h-14 w-auto"
      />
    </div>
  );
}

export default function PolarisFlowCommercial() {
  const reduceMotion = useReducedMotion();

  useDocumentTitle(
    "Polaris Flow | Polaris Web Studio",
    "Polaris Flow | Polaris Web Studio",
    "Polaris Flow es la línea de operaciones de Polaris Web Studio. Office Flow organiza leads, propuestas, aprobaciones y seguimiento con control humano.",
    "Polaris Flow is the operations line from Polaris Web Studio. Office Flow organizes leads, proposals, approvals and follow-up with human control.",
    { path: "/flow" },
  );

  useJsonLd("jsonld-polaris-flow", {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Polaris Flow — Office Flow",
    provider: { "@type": "Organization", name: "Polaris Web Studio", url: "https://polarisweb.studio" },
    url: "https://polarisweb.studio/flow",
    description: "Servicio operativo acompañado para organizar leads, propuestas, aprobaciones y seguimiento con control humano.",
  });

  return (
    <div className="min-h-dvh overflow-hidden bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />
      <main>
        <section className="relative isolate px-6 pb-24 pt-14 md:px-12 md:pb-32 md:pt-24">
          <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
            <div className="absolute -left-28 top-4 h-[28rem] w-[28rem] rounded-full bg-[#f59e0b]/12 blur-3xl" />
            <div className="absolute right-[8%] top-24 h-80 w-80 rounded-full bg-[#4f46e5]/12 blur-3xl" />
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#f59e0b]/70 to-transparent" />
          </div>

          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[0.92fr_1.08fr] lg:gap-20">
            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
            >
              <FlowBrand />
              <p className="mt-8 flex items-center gap-2 text-xs font-black uppercase tracking-[0.22em] text-[#fcd34d]">
                <span className="h-2 w-2 rounded-full bg-[#f59e0b] shadow-[0_0_18px_rgba(245,158,11,0.75)]" />
                <T en="An operations product by PWS">Un producto de operaciones de PWS</T>
              </p>
              <h1 className="mt-5 max-w-3xl font-display text-5xl font-black leading-[0.95] tracking-[-0.06em] sm:text-6xl lg:text-7xl">
                <T en="Make the work between a lead and a decision move forward.">
                  Haz que el trabajo entre un lead y una decisión avance.
                </T>
              </h1>
              <p className="mt-7 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)] md:text-xl">
                <T en="Polaris Flow turns scattered follow-up into an operating journey your team can see, prepare and approve with confidence.">
                  Polaris Flow convierte el seguimiento disperso en un recorrido operativo que tu equipo puede ver, preparar y aprobar con claridad.
                </T>
              </p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/contacto?service=office-flow"
                  className="group inline-flex items-center justify-center gap-3 rounded-xl bg-[#f59e0b] px-5 py-3.5 text-sm font-black text-[#2d1900] shadow-[0_14px_35px_rgba(245,158,11,0.2)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcd34d] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]"
                >
                  <T en="Request an Office Flow diagnostic">Solicitar diagnóstico de Office Flow</T>
                  <ArrowUpRight size={17} className="transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden="true" />
                </Link>
                <a
                  href="#recorrido"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-surface-base)]/50 px-5 py-3.5 text-sm font-black text-[var(--color-text-primary)] transition-colors hover:border-[#f59e0b]/70 hover:bg-[#f59e0b]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#f59e0b]"
                >
                  <T en="See the journey">Ver el recorrido</T>
                  <ArrowDownRight size={16} aria-hidden="true" />
                </a>
              </div>
              <p className="mt-6 max-w-xl text-sm leading-relaxed text-[var(--color-text-tertiary)]">
                <T en="The diagnostic starts a human conversation. No proposal or client communication is sent automatically.">
                  El diagnóstico abre una conversación humana. Ninguna propuesta ni comunicación con clientes se envía automáticamente.
                </T>
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: reduceMotion ? 0 : 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="relative"
            >
              <div className="relative overflow-hidden rounded-[2rem] border border-[#f59e0b]/25 bg-[#17120a] p-5 shadow-[0_30px_95px_rgba(2,6,23,0.48)] md:p-7">
                <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(245,158,11,.11) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,.11) 1px, transparent 1px)", backgroundSize: "38px 38px" }} aria-hidden="true" />
                <div className="relative">
                  <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-5">
                    <div className="flex items-center gap-3">
                      <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#f59e0b] text-[#2d1900]"><Workflow size={23} strokeWidth={2.5} aria-hidden="true" /></span>
                      <div>
                        <p className="text-sm font-black text-white">Office Flow</p>
                        <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.18em] text-[#fde68a]/70">recorrido operativo</p>
                      </div>
                    </div>
                    <span className="rounded-full border border-[#f59e0b]/30 bg-[#f59e0b]/10 px-3 py-1.5 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[#fde68a]"><T en="human-led">Con supervisión humana</T></span>
                  </div>
                  <div className="mt-6 space-y-3">
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f59e0b]/15 font-mono text-xs font-bold text-[#fde68a]">01</span>
                      <div><p className="text-sm font-bold text-white">Lead recibido</p><p className="mt-0.5 text-xs text-slate-400">Origen, intención y responsable visibles.</p></div>
                      <Check size={18} className="text-[#f59e0b]" aria-hidden="true" />
                    </div>
                    <div className="ml-4 border-l border-dashed border-[#f59e0b]/35 py-1 pl-6 text-xs text-[#fde68a]/65"><T en="Information is organized before the next handoff.">La información se ordena antes del siguiente traspaso.</T></div>
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-[#f59e0b]/25 bg-[#f59e0b]/10 p-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f59e0b] font-mono text-xs font-bold text-[#2d1900]">03</span>
                      <div><p className="text-sm font-bold text-white">Borrador preparado</p><p className="mt-0.5 text-xs text-[#fef3c7]/70">Propuesta lista para revisar, no para enviar sola.</p></div>
                      <ClipboardCheck size={18} className="text-[#fde68a]" aria-hidden="true" />
                    </div>
                    <div className="ml-4 border-l border-dashed border-[#f59e0b]/35 py-1 pl-6 text-xs text-[#fde68a]/65"><T en="The authorized person decides the next action.">La persona autorizada decide el siguiente paso.</T></div>
                    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.045] p-4">
                      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/10 font-mono text-xs font-bold text-white">04</span>
                      <div><p className="text-sm font-bold text-white">Decisión confirmada</p><p className="mt-0.5 text-xs text-slate-400">Aprobación y contexto quedan trazables.</p></div>
                      <ShieldCheck size={18} className="text-[#fcd34d]" aria-hidden="true" />
                    </div>
                  </div>
                </div>
              </div>
              <div className="pointer-events-none absolute -bottom-5 -left-5 hidden h-24 w-24 rounded-full border border-[#f59e0b]/25 md:block" aria-hidden="true" />
              <div className="pointer-events-none absolute -right-5 -top-5 hidden h-20 w-20 rounded-full border border-[#4f46e5]/35 md:block" aria-hidden="true" />
            </motion.div>
          </div>
        </section>

        <section id="recorrido" className="border-y border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-7 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
              <div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#f59e0b]">Office Flow</p><h2 className="mt-4 max-w-xl font-display text-4xl font-black tracking-[-0.05em] md:text-6xl"><T en="A clear route for work that matters.">Un recorrido claro para el trabajo que importa.</T></h2></div>
              <p className="max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]"><T en="Office Flow is the first productized service inside Polaris Flow. It gives a sales and delivery team a shared operating language without replacing their judgment.">Office Flow es el primer servicio productizado dentro de Polaris Flow. Le da al equipo comercial y operativo un lenguaje compartido sin reemplazar su criterio.</T></p>
            </div>
            <div className="relative mt-14 grid gap-4 md:grid-cols-4 md:gap-0">
              <div className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-8 hidden h-px bg-gradient-to-r from-[#f59e0b] via-[#fcd34d] to-[#4f46e5] md:block" aria-hidden="true" />
              {journey.map((step, index) => (
                <motion.article key={step.number} initial={{ opacity: 0, y: reduceMotion ? 0 : 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.25 }} transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : index * 0.06 }} className="relative rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] p-6 md:mx-2 md:border-none md:bg-transparent md:p-5">
                  <span className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-[#f59e0b]/35 bg-[var(--color-surface-base)] font-mono text-sm font-black text-[#fcd34d] shadow-[0_0_0_7px_var(--color-surface-elevated)]">{step.number}</span>
                  <h3 className="mt-8 font-display text-3xl font-black tracking-[-0.04em]"><T en={step.enTitle}>{step.title}</T></h3>
                  <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={step.enText}>{step.text}</T></p>
                </motion.article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-20 md:px-12 md:py-28">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-[0.88fr_1.12fr] lg:items-start">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-[#f59e0b]">Control sin fricción</p>
              <h2 className="mt-4 font-display text-4xl font-black tracking-[-0.05em] md:text-6xl"><T en="Move faster without letting go of the decision.">Avanza más rápido sin soltar la decisión.</T></h2>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-[var(--color-text-secondary)]"><T en="The point is not to automate every message. The point is to make the right next action obvious and keep the human approval that protects your business.">El objetivo no es automatizar cada mensaje. Es hacer evidente el siguiente paso correcto y conservar la aprobación humana que protege tu negocio.</T></p>
            </div>
            <div className="divide-y divide-[var(--color-border-subtle)] rounded-3xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] px-6 md:px-8">
              {capabilities.map((capability) => {
                const Icon = capability.icon;
                return <div key={capability.title} className="grid grid-cols-[auto_1fr] gap-5 py-7 first:pt-8 last:pb-8"><span className="flex h-11 w-11 items-center justify-center rounded-2xl border border-[#f59e0b]/30 bg-[#f59e0b]/10 text-[#fcd34d]"><Icon size={21} aria-hidden="true" /></span><div><p className="font-display text-2xl font-black tracking-[-0.03em]"><T en={capability.enTitle}>{capability.title}</T></p><p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={capability.enText}>{capability.text}</T></p><span className="mt-4 inline-flex items-center gap-2 text-xs font-bold text-[#fcd34d]"><Check size={14} strokeWidth={3} aria-hidden="true" /><T en="Human control remains in place">El control humano se mantiene</T></span></div></div>;
              })}
            </div>
          </div>
        </section>

        <section className="relative overflow-hidden border-y border-[var(--color-border-subtle)] bg-[#f59e0b] px-6 py-20 text-[#2d1900] md:px-12 md:py-28">
          <div className="pointer-events-none absolute inset-0 opacity-35" style={{ backgroundImage: "linear-gradient(rgba(45,25,0,.16) 1px, transparent 1px), linear-gradient(90deg, rgba(45,25,0,.16) 1px, transparent 1px)", backgroundSize: "34px 34px" }} aria-hidden="true" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-9 lg:grid-cols-[0.78fr_1.22fr] lg:items-start"><div><p className="text-xs font-black uppercase tracking-[0.22em] text-[#5d3300]">Implementación acompañada</p><h2 className="mt-4 font-display text-4xl font-black tracking-[-0.05em] md:text-6xl"><T en="A system does not begin with a dashboard.">Un sistema no empieza con un dashboard.</T></h2></div><p className="max-w-2xl text-lg leading-relaxed text-[#5d3300]"><T en="It begins by agreeing on what must happen next. Polaris Web Studio works with your team to shape that agreement into an operating flow.">Empieza al acordar qué debe pasar después. Polaris Web Studio trabaja con tu equipo para convertir ese acuerdo en un flujo operativo.</T></p></div>
            <div className="mt-14 grid gap-4 md:grid-cols-4">
              {launchSteps.map((step, index) => <motion.article key={step.title} initial={{ opacity: 0, y: reduceMotion ? 0 : 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.2 }} transition={{ duration: reduceMotion ? 0 : 0.35, delay: reduceMotion ? 0 : index * 0.05 }} className="border-t border-[#2d1900]/25 pt-5"><p className="font-mono text-xs font-bold tracking-[0.16em] text-[#5d3300]">0{index + 1}</p><h3 className="mt-8 font-display text-3xl font-black tracking-[-0.04em]"><T en={step.enTitle}>{step.title}</T></h3><p className="mt-3 text-sm leading-relaxed text-[#5d3300]"><T en={step.enText}>{step.text}</T></p></motion.article>)}
            </div>
          </div>
        </section>

        <section className="relative px-6 py-24 md:px-12 md:py-36">
          <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[25rem] w-[25rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#4f46e5]/12 blur-3xl" aria-hidden="true" />
          <div className="mx-auto max-w-4xl text-center"><Sparkles className="mx-auto mb-7 text-[#f59e0b]" size={28} aria-hidden="true" /><p className="text-xs font-black uppercase tracking-[0.22em] text-[#f59e0b]">Polaris Web Studio × Polaris Flow</p><h2 className="mt-4 font-display text-4xl font-black tracking-[-0.05em] md:text-6xl"><T en="Start with the work that keeps getting stuck.">Empieza por el trabajo que se sigue quedando detenido.</T></h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--color-text-secondary)]"><T en="Tell us where your team loses time between receiving a lead and confirming the next action. We will map the first workflow with you.">Cuéntanos dónde pierde tiempo tu equipo entre recibir un lead y confirmar la siguiente acción. Mapearemos contigo el primer flujo.</T></p><Link to="/contacto?service=office-flow" className="mt-9 inline-flex items-center gap-3 rounded-xl bg-[#f59e0b] px-6 py-4 text-sm font-black text-[#2d1900] shadow-[0_16px_38px_rgba(245,158,11,0.2)] transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#fcd34d] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-base)]"><T en="Request my diagnostic">Solicitar mi diagnóstico</T><ArrowRight size={17} aria-hidden="true" /></Link></div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
