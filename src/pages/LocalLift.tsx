import { Link } from "react-router-dom";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Clock3,
  Eye,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Zap,
} from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";
import { useDocumentTitle, useJsonLd } from "../hooks/useDocumentTitle";

const WHATSAPP_NUMBER = "18299200544";
const whatsappLink = (message: string) =>
  `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

const tiers = [
  {
    name: "Diagnóstico Express",
    enName: "Express Audit",
    price: "29",
    rdPrice: "RD$1,800",
    time: "24 horas",
    enTime: "24 hours",
    accent: "amber",
    description: "Un mapa claro de lo que está frenando tus llamadas, mensajes o reservas.",
    enDescription: "A clear map of what is blocking calls, messages, or bookings.",
    items: [
      ["Revisión visual de Google/Maps y WhatsApp", "Google/Maps and WhatsApp review"],
      ["Cinco problemas prioritarios", "Five priority issues"],
      ["Plan de acción para los próximos 7 días", "A 7-day action plan"],
    ],
  },
  {
    name: "Local Lift 48H",
    enName: "Local Lift 48H",
    price: "99",
    rdPrice: "RD$5,900",
    time: "48 horas",
    enTime: "48 hours",
    accent: "indigo",
    featured: true,
    description: "La presencia local lista para que tus clientes entiendan, confíen y contacten.",
    enDescription: "A local presence ready to help customers understand, trust, and contact you.",
    items: [
      ["Auditoría completa de tu perfil local", "Complete local profile audit"],
      ["Descripción, servicios y llamadas a la acción", "Description, services, and calls to action"],
      ["10 publicaciones listas para adaptar", "10 posts ready to adapt"],
      ["15 respuestas personalizadas para reseñas", "15 personalized review replies"],
      ["10 mensajes de WhatsApp para seguimiento", "10 WhatsApp follow-up messages"],
    ],
  },
  {
    name: "Implementado",
    enName: "Implemented",
    price: "179",
    rdPrice: "RD$10,500",
    time: "3–5 días",
    enTime: "3–5 days",
    accent: "violet",
    description: "Todo el sistema preparado y aplicado contigo, sin pedirte contraseñas.",
    enDescription: "The complete system prepared and applied with you, without requesting passwords.",
    items: [
      ["Todo lo incluido en Local Lift 48H", "Everything in Local Lift 48H"],
      ["Implementación asistida de cambios autorizados", "Assisted implementation of authorized changes"],
      ["Carga de textos e imágenes proporcionados", "Upload of supplied text and images"],
      ["Una ronda de revisión", "One revision round"],
    ],
  },
];

export default function LocalLift() {
  useDocumentTitle(
    "Polaris Local Lift | Más visibilidad y conversaciones en 48 horas",
    "Polaris Local Lift | More local visibility and conversations in 48 hours",
    "Optimización de Google Business Profile, Google Maps y WhatsApp para negocios de República Dominicana y clientes internacionales.",
    "Google Business Profile, Google Maps, and WhatsApp optimization for businesses in the Dominican Republic and worldwide.",
  );

  useJsonLd("jsonld-local-lift", {
    "@context": "https://schema.org",
    "@type": "Service",
    name: "Polaris Local Lift",
    provider: {
      "@type": "Organization",
      name: "Polaris Web Studio",
      url: "https://polarisweb.studio",
    },
    areaServed: ["Dominican Republic", "Worldwide"],
    description:
      "Local visibility and WhatsApp conversion optimization delivered in 48 hours.",
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: "99",
      availability: "https://schema.org/InStock",
    },
  });

  const defaultMessage = "Hola Polaris, quiero solicitar el diagnóstico de Polaris Local Lift para mi negocio.";

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 md:py-16">
        <section className="relative overflow-hidden rounded-[var(--radius-bento)] glass-panel px-6 py-12 md:px-14 md:py-20 border border-[var(--color-primary-base)]/20">
          <div className="absolute -top-28 -right-20 w-80 h-80 rounded-full bg-indigo-500/15 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-36 -left-24 w-96 h-96 rounded-full bg-violet-500/10 blur-3xl pointer-events-none" />
          <div className="relative z-10 max-w-4xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--color-primary-base)]/30 bg-[var(--color-primary-base)]/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[var(--color-primary-base)]">
              <Sparkles size={13} />
              <T en="Local visibility sprint · Dominican Republic">Sprint de visibilidad local · República Dominicana</T>
            </div>
            <h1 className="mt-6 text-4xl md:text-7xl font-display font-black tracking-[-0.05em] leading-[0.98]">
              <T en="Your customers are already looking for you. Make sure they find the right information.">
                Tus clientes ya te están buscando. Haz que encuentren la información correcta.
              </T>
            </h1>
            <p className="mt-6 max-w-2xl text-base md:text-xl leading-relaxed text-[var(--color-text-secondary)]">
              <T en="Polaris Local Lift organizes your Google and WhatsApp presence within 48 hours so customers can understand what you offer, where you are, and how to contact you.">
                Polaris Local Lift organiza tu presencia en Google y WhatsApp en 48 horas para que tus clientes entiendan qué ofreces, dónde estás y cómo contactarte.
              </T>
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <a
                href={whatsappLink(defaultMessage)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"
              >
                <MessageCircle size={18} />
                <T en="Get my 24-hour audit">Quiero mi diagnóstico de 24 horas</T>
                <ArrowRight size={17} />
              </a>
              <a
                href="#paquetes"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--color-border-strong)] px-6 py-4 text-sm font-black transition-colors hover:border-[var(--color-primary-base)]"
              >
                <T en="See packages">Ver paquetes</T>
                <ChevronRight size={17} />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-xs font-semibold text-[var(--color-text-tertiary)]">
              <span className="inline-flex items-center gap-1.5"><Clock3 size={14} /> <T en="Fast delivery">Entrega rápida</T></span>
              <span className="inline-flex items-center gap-1.5"><MapPin size={14} /> <T en="Based in the Dominican Republic">Desde República Dominicana</T></span>
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={14} /> <T en="No ranking promises">Sin promesas de ranking</T></span>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
          {[
            [Eye, "Que te entiendan", "Make your offer clear", "Descripción, servicios y datos sin contradicciones."],
            [Search, "Que te encuentren", "Help customers find you", "Perfil local más completo, útil y fácil de revisar."],
            [MessageCircle, "Que te contacten", "Make contact simple", "Rutas directas hacia WhatsApp, llamadas o reservas."],
          ].map(([Icon, title, enTitle, description]) => {
            const IconComponent = Icon as typeof Eye;
            return (
              <div key={title as string} className="rounded-[var(--radius-bento)] glass-panel p-6 border border-[var(--color-border-subtle)]">
                <IconComponent size={22} className="text-[var(--color-primary-base)]" />
                <h2 className="mt-5 text-xl font-display font-black"><T en={enTitle as string}>{title as string}</T></h2>
                <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={description as string}>{description as string}</T></p>
              </div>
            );
          })}
        </section>

        <section id="paquetes" className="pt-24">
          <div className="max-w-2xl">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Choose your starting point">Elige tu punto de partida</T></p>
            <h2 className="mt-3 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="A faster way to improve your digital presence.">Una forma más rápida de mejorar tu presencia digital.</T></h2>
            <p className="mt-4 text-[var(--color-text-secondary)] leading-relaxed"><T en="Start with a diagnosis or have us prepare the full system with you. No long contracts, no fabricated reviews, and no guarantees we cannot prove.">Empieza con un diagnóstico o deja que preparemos el sistema contigo. Sin contratos largos, reseñas inventadas ni garantías que no podamos demostrar.</T></p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-10">
            {tiers.map((tier) => (
              <article key={tier.name} className={`relative flex flex-col rounded-[var(--radius-bento)] p-7 border ${tier.featured ? "border-[var(--color-primary-base)] bg-[var(--color-primary-base)]/8 shadow-xl shadow-indigo-500/10" : "border-[var(--color-border-subtle)] glass-panel"}`}>
                {tier.featured && <div className="absolute -top-3 left-6 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-base)] px-3 py-1 text-[10px] font-black uppercase tracking-widest text-white"><Star size={12} fill="currentColor" /> <T en="Recommended">Recomendado</T></div>}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-2xl font-display font-black"> <T en={tier.enName}>{tier.name}</T></h3>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en={tier.enDescription}>{tier.description}</T></p>
                  </div>
                  <Zap size={20} className="shrink-0 text-[var(--color-primary-base)]" />
                </div>
                <div className="mt-7 flex items-end gap-2">
                  <span className="text-5xl font-display font-black text-[var(--color-primary-base)]">${tier.price}</span>
                  <span className="pb-2 text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">USD</span>
                </div>
                <p className="mt-1 text-xs font-bold text-[var(--color-text-tertiary)]">{tier.rdPrice} · <T en={tier.enTime}>{tier.time}</T></p>
                <div className="mt-7 space-y-3 flex-1">
                  {tier.items.map(([es, en]) => (
                    <div key={es} className="flex items-start gap-2.5 text-sm leading-relaxed">
                      <Check size={16} className="mt-0.5 shrink-0 text-emerald-500" />
                      <span><T en={en}>{es}</T></span>
                    </div>
                  ))}
                </div>
                <a href={whatsappLink(`Hola Polaris, me interesa el paquete ${tier.name}. Quiero saber qué necesitas para comenzar.`)} target="_blank" rel="noreferrer" className={`mt-8 inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-black transition-transform hover:-translate-y-0.5 ${tier.featured ? "bg-[var(--color-primary-base)] text-white" : "border border-[var(--color-border-strong)] hover:border-[var(--color-primary-base)]"}`}>
                  <MessageCircle size={16} />
                  <T en="Start on WhatsApp">Empezar por WhatsApp</T>
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-5 pt-24">
          <div className="rounded-[var(--radius-bento)] glass-panel p-7 md:p-10 border border-[var(--color-border-subtle)]">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="The process">El proceso</T></p>
            <h2 className="mt-3 text-3xl font-display font-black"><T en="Small scope. Visible progress.">Alcance pequeño. Progreso visible.</T></h2>
            <div className="mt-8 space-y-6">
              {[
                ["01", "Send your link", "Envíanos tu enlace y el objetivo principal del negocio."],
                ["02", "Receive priorities", "Recibes un diagnóstico con acciones ordenadas por impacto y esfuerzo."],
                ["03", "Implement with confidence", "Aplicamos solo los cambios autorizados y te entregamos todo documentado."],
              ].map(([number, enTitle, esDescription]) => (
                <div key={number} className="flex gap-4">
                  <span className="text-xs font-black font-mono text-[var(--color-primary-base)]">{number}</span>
                  <div><h3 className="font-black"><T en={enTitle}>{enTitle === "Send your link" ? "Envíanos tu enlace" : enTitle === "Receive priorities" ? "Recibe prioridades" : "Implementa con confianza"}</T></h3><p className="mt-1 text-sm leading-relaxed text-[var(--color-text-secondary)]">{esDescription}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] p-7 md:p-10 border border-[var(--color-primary-base)]/20">
            <div className="flex items-center gap-2 text-[var(--color-primary-base)]"><ShieldCheck size={20} /><span className="text-xs font-black uppercase tracking-[0.2em]"><T en="Built on trust">Basado en confianza</T></span></div>
            <h2 className="mt-4 text-3xl font-display font-black"><T en="Useful, honest, and ready to act.">Útil, honesto y listo para actuar.</T></h2>
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en="We work with the information you approve. We do not create fake reviews, invent business details, request passwords, or promise first place on Google.">Trabajamos con la información que tú apruebas. No creamos reseñas falsas, no inventamos datos del negocio, no pedimos contraseñas y no prometemos el primer lugar en Google.</T></p>
            <div className="mt-8 flex flex-wrap gap-3 text-xs font-bold text-[var(--color-text-tertiary)]"><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2">PayPal</span><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2"><T en="Bank transfer">Transferencia</T></span><span className="rounded-full border border-[var(--color-border-subtle)] px-3 py-2"><T en="Cash in DR">Efectivo en RD</T></span></div>
          </div>
        </section>

        <section className="mt-24 rounded-[var(--radius-bento)] glass-panel p-7 md:p-12 text-center border border-[var(--color-primary-base)]/20">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Ready to be easier to find?">¿Listo para que te encuentren más fácilmente?</T></p>
          <h2 className="mt-4 text-3xl md:text-5xl font-display font-black tracking-[-0.04em]"><T en="Start with a 24-hour diagnosis.">Empieza con un diagnóstico de 24 horas.</T></h2>
          <p className="mx-auto mt-4 max-w-xl text-sm md:text-base leading-relaxed text-[var(--color-text-secondary)]"><T en="Send us your business link and we will tell you what to fix first.">Envíanos el enlace de tu negocio y te diremos qué conviene corregir primero.</T></p>
          <a href={whatsappLink(defaultMessage)} target="_blank" rel="noreferrer" className="mt-8 inline-flex items-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-7 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5"><MessageCircle size={18} /><T en="Request my audit">Solicitar mi diagnóstico</T><ArrowRight size={17} /></a>
          <p className="mt-5 text-xs text-[var(--color-text-tertiary)]"><T en="Prefer email? hola@polarisweb.studio">¿Prefieres correo? hola@polarisweb.studio</T></p>
        </section>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-[var(--color-text-tertiary)]">
          <Link to="/" className="hover:text-[var(--color-primary-base)]"><T en="Back to Polaris Web Studio">Volver a Polaris Web Studio</T></Link>
          <span aria-hidden="true">·</span>
          <Link to="/terminos" className="hover:text-[var(--color-primary-base)]"><T en="Terms">Términos</T></Link>
          <span aria-hidden="true">·</span>
          <Link to="/privacidad" className="hover:text-[var(--color-primary-base)]"><T en="Privacy">Privacidad</T></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}
