import { lazy, Suspense, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowDown,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Briefcase,
  Check,
  CheckCircle2,
  ChevronDown,
  Code2,
  Compass,
  Globe2,
  Layers3,
  Orbit,
  Rocket,
  ShoppingCart,
  Sparkles,
  Zap,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T, useLanguage } from "../context/LanguageContext";
import RippleButton from "../components/RippleButton";

const Hero3D = lazy(() => import("../components/Hero3D"));

const services = [
  {
    index: "01",
    title: "Landing Pages",
    label: { es: "CONVERSIÓN", en: "CONVERSION" },
    description: {
      es: "Diseño enfocado en conversión para convertir visitantes en clientes reales desde el primer día.",
      en: "Conversion-focused design to turn visitors into real clients from day one.",
    },
    points: [
      { es: "Captura rápida de leads", en: "Fast lead capture" },
      { es: "Diseño móvil optimizado", en: "Mobile-first layout" },
      { es: "WhatsApp directo integrado", en: "Direct WhatsApp integration" },
    ],
    icon: Layers3,
    href: "/blog/landing-pages-conversion",
    color: "#818cf8",
  },
  {
    index: "02",
    title: "E-commerce",
    label: { es: "VENTAS 24/7", en: "SELL 24/7" },
    description: {
      es: "Plataformas de venta online escalables, seguras y optimizadas para multiplicar tus ingresos las 24 horas del día.",
      en: "Scalable, secure online sales platforms designed to multiply your income 24/7.",
    },
    points: [
      { es: "Pasarela segura de pago", en: "Secure payment gateway" },
      { es: "Administrador de productos", en: "Product management" },
      { es: "Experiencia de compra ágil", en: "Frictionless checkout" },
    ],
    icon: ShoppingCart,
    href: "/blog/ecommerce-alto-nivel",
    color: "#5eead4",
  },
  {
    index: "03",
    title: { es: "Webs Corporativas", en: "Corporate Websites" },
    label: { es: "AUTORIDAD", en: "AUTHORITY" },
    description: {
      es: "Identidad digital sólida y elegante que posiciona tu marca como líder en su mercado.",
      en: "A solid, elegant digital identity that positions your brand as a leader in its market.",
    },
    points: [
      { es: "Arquitectura web a medida", en: "Custom web architecture" },
      { es: "Estrategia de contenido", en: "Content strategy" },
      { es: "Escalable desde el inicio", en: "Scalable from day one" },
    ],
    icon: Briefcase,
    href: "/blog/webs-corporativas-identidad",
    color: "#c4b5fd",
  },
];

const projects = [
  {
    number: "01",
    title: "Lúmina Sky",
    type: { es: "Turismo · Web inmersiva", en: "Tourism · Immersive web" },
    description: {
      es: "Prototipo de hotel boutique de lujo con motor de reservas y animaciones fluidas de alta fidelidad.",
      en: "Luxury boutique-hotel prototype with a booking engine and high-fidelity motion.",
    },
    image: "/screenshots/lumina-sky-desktop.svg",
    slug: "lumina-sky-concept",
    tone: "from-cyan-500/25 via-slate-950/20 to-indigo-950/70",
  },
  {
    number: "02",
    title: "Nexus Realty",
    type: { es: "Inmobiliaria · Plataforma", en: "Real estate · Platform" },
    description: {
      es: "Catálogo inmobiliario interactivo optimizado para un filtrado rápido de propiedades de lujo.",
      en: "Interactive real-estate catalogue optimized for rapid browsing of premium properties.",
    },
    image: "/screenshots/nexus-realty-desktop.png",
    slug: "nexus-real-estate",
    tone: "from-amber-500/20 via-slate-950/30 to-indigo-950/70",
  },
  {
    number: "03",
    title: "Chroma Tech Store",
    type: { es: "E-commerce · Tecnología", en: "E-commerce · Technology" },
    description: {
      es: "Tienda online de tecnología con pasarela de pago, buscador inteligente y carrito persistente.",
      en: "Technology store with payments, smart search and a persistent shopping cart.",
    },
    image: "/screenshots/chroma-store-desktop.svg",
    slug: "chroma-store",
    tone: "from-violet-500/25 via-slate-950/20 to-fuchsia-950/70",
  },
  {
    number: "04",
    title: "Vitality Med",
    type: { es: "Salud · Portal de citas", en: "Health · Appointment portal" },
    description: {
      es: "Clínica multidisciplinaria con perfiles de médicos, blog de salud y panel administrativo propio.",
      en: "Multidisciplinary clinic with doctor profiles, health content and its own admin panel.",
    },
    image: "/screenshots/vitality-clinic-desktop.svg",
    slug: "vitality-clinic",
    tone: "from-emerald-500/25 via-slate-950/25 to-cyan-950/70",
  },
  {
    number: "05",
    title: "La Reja",
    type: { es: "Gastronomía · Experiencia digital", en: "Gastronomy · Digital experience" },
    description: {
      es: "Experiencia digital premium para un restaurante dominicano de cocina contemporánea, con carta viva y rutas de degustación.",
      en: "Premium digital experience for a contemporary Dominican restaurant, with a live menu and tasting routes.",
    },
    image: "/screenshots/la-reja-desktop.svg",
    slug: "sabor-autentico",
    tone: "from-orange-500/25 via-slate-950/25 to-amber-950/70",
  },
];

const plans = [
  {
    number: "01",
    title: { es: "Paquete Destello", en: "Flash Package" },
    price: 299,
    accent: "#fbbf24",
    summary: {
      es: "Una página diseñada para convertir visitantes en clientes desde el primer scroll.",
      en: "One page designed to turn visitors into clients from the first scroll.",
    },
    features: [
      { es: "Diseño exclusivo y responsivo", en: "Exclusive responsive design" },
      { es: "Botón de WhatsApp integrado", en: "WhatsApp button integrated" },
      { es: "SEO On-Page incluido", en: "On-Page SEO included" },
      { es: "Entrega en 1–2 semanas", en: "Delivered in 1–2 weeks" },
    ],
    warranty: { es: "30 días de garantía post-lanzamiento", en: "30-day post-launch warranty" },
  },
  {
    number: "02",
    title: { es: "Paquete Constelación", en: "Constellation Package" },
    price: 699,
    accent: "#818cf8",
    summary: {
      es: "Sitio corporativo completo de hasta 5 páginas con chatbot IA, blog y Analytics.",
      en: "Complete corporate site of up to 5 pages with an AI chatbot, blog and Analytics.",
    },
    features: [
      { es: "Todo lo del Paquete Destello", en: "Everything in Flash Package" },
      { es: "Hasta 5 páginas independientes", en: "Up to 5 independent pages" },
      { es: "Chatbot 24/7 con IA", en: "24/7 AI chatbot" },
      { es: "SEO Técnico + Search Console", en: "Technical SEO + Search Console" },
      { es: "Google Analytics 4", en: "Google Analytics 4" },
    ],
    warranty: { es: "60 días de garantía post-lanzamiento", en: "60-day post-launch warranty" },
    featured: true,
  },
  {
    number: "03",
    title: { es: "Paquete Nova", en: "Nova Package" },
    price: 1299,
    accent: "#c4b5fd",
    summary: {
      es: "Plataforma de ventas completa con pagos, panel admin y herramienta IA incluida.",
      en: "Complete sales platform with payments, an admin panel and an AI tool included.",
    },
    features: [
      { es: "Todo lo del Paquete Constelación", en: "Everything in Constellation Package" },
      { es: "E-commerce + Stripe y PayPal", en: "E-commerce + Stripe and PayPal" },
      { es: "Panel admin personalizado", en: "Custom admin panel" },
      { es: "Schema Markup para Google", en: "Schema Markup for Google" },
      { es: "1 herramienta IA incluida", en: "1 AI tool included" },
    ],
    warranty: { es: "90 días de garantía prioritaria", en: "90-day priority warranty" },
  },
];

const faqs = [
  {
    es: "¿Cuánto cuesta un proyecto?",
    en: "How much does a project cost?",
    answerEs: "Nuestros proyectos profesionales y personalizados comienzan desde $299 USD. Ofrecemos precios claros, adaptados a la complejidad y necesidades específicas de tu negocio.",
    answerEn: "Our custom professional projects start at $299 USD. We offer clear pricing structured around your specific requirements and complexity.",
  },
  {
    es: "¿Ofrecen facilidades de pago?",
    en: "Do you offer payment plans?",
    answerEs: "Sí, trabajamos con un esquema de 50% al iniciar el proyecto y 50% al momento del lanzamiento. Para proyectos grandes podemos estructurar pagos por fases.",
    answerEn: "Yes. We work with 50% upfront and 50% at launch. For larger projects, we can structure milestone payments.",
  },
  {
    es: "¿Cuánto tiempo toma un proyecto?",
    en: "How long does a project take?",
    answerEs: "Depende de la complejidad. Una landing page suele estar lista en 2 semanas, mientras que una web corporativa completa toma entre 4 y 6 semanas.",
    answerEn: "It depends on complexity. A landing page is usually ready in 2 weeks, while a complete corporate website takes 4 to 6 weeks.",
  },
  {
    es: "¿Trabajan con SEO y mantenimiento?",
    en: "Do you provide SEO and maintenance?",
    answerEs: "Sí. Todas nuestras webs nacen con una estructura SEO On-Page optimizada y contamos con planes de soporte para mantenerlas actualizadas y seguras.",
    answerEn: "Yes. Every website starts with optimized on-page SEO and we offer support plans to keep it current and secure.",
  },
];

function ChapterLabel({ number, children }: { number: string; children: React.ReactNode }) {
  return (
    <p className="flex items-center gap-3 font-mono text-[10px] font-black uppercase tracking-[0.2em] text-indigo-300">
      <span className="text-cyan-300">{number}</span>
      <span className="h-px w-8 bg-indigo-400/50" aria-hidden="true" />
      {children}
    </p>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const reduceMotion = useReducedMotion();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [isOfferActive, setIsOfferActive] = useState(() => Date.now() < new Date("2026-08-17T23:59:59Z").getTime());

  useEffect(() => {
    const title = language === "es" ? "Polaris Web Studio | Diseño y Desarrollo de Páginas Web Premium" : "Polaris Web Studio | Premium Web Design & Development";
    const description = language === "es"
      ? "Desarrollamos sitios web, landing pages y e-commerce de alto impacto y velocidad máxima, diseñados para captar clientes y potenciar tu negocio."
      : "We build high-impact, ultra-fast websites, landing pages, and e-commerce platforms designed to acquire customers and scale your business.";
    document.title = title;
    const meta = document.querySelector('meta[name="description"]') ?? document.head.appendChild(document.createElement("meta"));
    meta.setAttribute("name", "description");
    meta.setAttribute("content", description);
    const canonical = document.querySelector('link[rel="canonical"]') ?? document.head.appendChild(document.createElement("link"));
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", "https://polarisweb.studio");
  }, [language]);

  const entrance = (delay = 0) => ({
    initial: { opacity: 0, y: reduceMotion ? 0 : 22 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.18 },
    transition: { duration: reduceMotion ? 0 : 0.56, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
  });

  return (
    <div className="min-h-[100svh] overflow-x-clip bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar variant="immersive" />

      <main>
        <section id="inicio" className="relative isolate flex min-h-[calc(100svh-4rem)] items-end overflow-hidden border-b border-indigo-400/20 px-6 pb-14 pt-24 md:px-12 md:pb-20 lg:px-16">
          <div className="pointer-events-none absolute inset-0 -z-20 bg-[#020617]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-75" aria-hidden="true">
            <Suspense fallback={<div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_40%,rgba(99,102,241,0.22),transparent_34%)]" />}>
              <Hero3D />
            </Suspense>
          </div>
          <div className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,#020617_0%,rgba(2,6,23,0.9)_34%,rgba(2,6,23,0.3)_70%,#020617_100%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-2/3 bg-[linear-gradient(0deg,#020617_0%,rgba(2,6,23,0.72)_42%,transparent_100%)]" aria-hidden="true" />
          <div className="pointer-events-none absolute inset-0 -z-10 opacity-20 [background-image:linear-gradient(rgba(148,163,184,.24)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,.24)_1px,transparent_1px)] [background-size:64px_64px]" aria-hidden="true" />

          <div className="relative grid w-full grid-cols-1 gap-10 lg:grid-cols-12 lg:items-end">
            <motion.div {...entrance()} className="lg:col-span-8 xl:col-span-7">
              <ChapterLabel number="01"><T en="DIGITAL ENGINEERING · DOMINICAN REPUBLIC">INGENIERÍA DIGITAL · REPÚBLICA DOMINICANA</T></ChapterLabel>
              <h1 className="mt-6 max-w-5xl font-display text-[3.3rem] font-black leading-[0.88] tracking-[-0.065em] text-white sm:text-7xl md:text-8xl lg:text-[7rem] xl:text-[8.4rem]">
                <T en="We digitize the future of your business today">Digitalizamos el futuro de tu negocio hoy</T>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-relaxed text-slate-300 sm:text-lg md:text-xl">
                <T en="We build web platforms designed to attract clients, close sales and scale. From the Caribbean, with cutting-edge technology.">
                  Desarrollamos plataformas web diseñadas para atraer clientes, cerrar ventas y escalar. Desde República Dominicana, con tecnología de punta.
                </T>
              </p>
              <div className="mt-10 flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                <RippleButton
                  onClick={() => navigate("/cotizar")}
                  className="group inline-flex min-h-14 items-center gap-3 bg-[#818cf8] px-6 py-4 text-base font-black text-[#0b1025] transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60 sm:px-8"
                >
                  <Rocket size={20} className="transition-transform duration-200 group-hover:-translate-y-1 group-hover:rotate-12" aria-hidden="true" />
                  <T en="Plan your Project">Planifica tu Proyecto</T>
                  <ArrowRight size={20} className="transition-transform duration-200 group-hover:translate-x-1" aria-hidden="true" />
                </RippleButton>
                <p className="border-l border-indigo-300/35 pl-4 text-xs font-medium leading-relaxed text-slate-300">
                  <span className="block font-mono font-black uppercase tracking-[0.16em] text-cyan-200"><T en="From $299 USD">Proyectos desde $299 USD</T></span>
                  <T en="Free initial consultation · No commitment">Asesoría inicial gratuita · Sin compromiso</T>
                </p>
              </div>
            </motion.div>

            <motion.aside {...entrance(0.12)} className="grid grid-cols-3 border-y border-white/10 py-5 lg:col-span-4 lg:grid-cols-1 lg:border-l lg:border-y-0 lg:py-0 lg:pl-8 xl:col-span-3">
              {[
                { number: "A", es: "Código original", en: "Original code" },
                { number: "B", es: "Estrategia clara", en: "Clear strategy" },
                { number: "C", es: "Lanzamiento guiado", en: "Guided launch" },
              ].map((item) => (
                <div key={item.number} className="border-white/10 px-3 first:px-0 not-last:border-r lg:border-b lg:px-0 lg:py-4 lg:first:pt-0 lg:not-last:border-r-0">
                  <span className="font-mono text-[10px] font-black tracking-[0.18em] text-cyan-300">{item.number}</span>
                  <p className="mt-2 text-xs font-bold text-white"><T en={item.en}>{item.es}</T></p>
                </div>
              ))}
            </motion.aside>
          </div>

          <a href="#servicios" className="absolute bottom-6 right-6 flex items-center gap-2 font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-300 transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300 md:bottom-9 md:right-12">
            <T en="Explore">Explorar</T><ArrowDown size={15} aria-hidden="true" />
          </a>
        </section>

        <section id="servicios" className="relative min-h-[100svh] border-b border-[var(--color-border-subtle)] bg-[#070c20] px-6 py-20 md:px-12 md:py-24 lg:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,rgba(129,140,248,.5)_1px,transparent_0)] [background-size:28px_28px]" aria-hidden="true" />
          <div className="relative flex min-h-[calc(100svh-10rem)] flex-col">
            <motion.header {...entrance()} className="grid gap-5 border-b border-indigo-300/20 pb-10 lg:grid-cols-12 lg:items-end">
              <div className="lg:col-span-4"><ChapterLabel number="02"><T en="WHAT WE BUILD">LO QUE CONSTRUIMOS</T></ChapterLabel></div>
              <div className="lg:col-span-8">
                <h2 className="max-w-5xl font-display text-4xl font-black leading-[0.92] tracking-[-0.055em] text-white sm:text-5xl md:text-6xl"><T en="An original digital presence built to do its job.">Una presencia digital original, construida para hacer su trabajo.</T></h2>
              </div>
            </motion.header>

            <div className="grid flex-1 divide-y divide-indigo-300/20 md:grid-cols-3 md:divide-x md:divide-y-0">
              {services.map((service, index) => {
                const Icon = service.icon;
                const title = typeof service.title === "string" ? service.title : service.title.es;
                const titleEn = typeof service.title === "string" ? service.title : service.title.en;
                return (
                  <motion.div {...entrance(index * 0.07)} key={service.index} className="group flex min-h-80 flex-col justify-between py-9 md:px-8 md:py-12 first:md:pl-0 last:md:pr-0">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-black tracking-[0.16em]" style={{ color: service.color }}>{service.index}</span>
                        <Icon size={25} style={{ color: service.color }} aria-hidden="true" />
                      </div>
                      <p className="mt-10 font-mono text-[10px] font-black tracking-[0.18em] text-slate-400"><T en={service.label.en}>{service.label.es}</T></p>
                      <h3 className="mt-3 font-display text-3xl font-black tracking-[-0.04em] text-white"><T en={titleEn}>{title}</T></h3>
                      <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-300"><T en={service.description.en}>{service.description.es}</T></p>
                    </div>
                    <div className="mt-9 border-t border-white/10 pt-5">
                      <ul className="space-y-2.5">
                        {service.points.map((point) => <li key={point.es} className="flex gap-2 text-xs leading-relaxed text-slate-300"><Check size={14} className="mt-0.5 shrink-0" style={{ color: service.color }} aria-hidden="true" /><T en={point.en}>{point.es}</T></li>)}
                      </ul>
                      <Link to={service.href} className="mt-8 inline-flex items-center gap-2 text-xs font-black text-white transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-300"><T en="Explore capability">Explorar capacidad</T><ArrowUpRight size={16} aria-hidden="true" /></Link>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="relative grid min-h-[100svh] overflow-hidden bg-[#818cf8] text-[#080d25] md:grid-cols-12">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:linear-gradient(rgba(8,13,37,.35)_1px,transparent_1px),linear-gradient(90deg,rgba(8,13,37,.35)_1px,transparent_1px)] [background-size:42px_42px]" aria-hidden="true" />
          <motion.div {...entrance()} className="relative flex flex-col justify-between border-b border-[#080d25]/25 px-6 py-16 md:col-span-5 md:border-b-0 md:border-r md:px-12 md:py-20 lg:px-16">
            <div>
              <p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-[#29316e]"><T en="WHY POLARIS">POR QUÉ POLARIS</T></p>
              <h2 className="mt-7 max-w-xl font-display text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl"><T en="You do not need another template. You need a system that carries your business forward.">No necesitas otra plantilla. Necesitas un sistema que impulse tu negocio.</T></h2>
            </div>
            <p className="mt-12 max-w-md text-base leading-relaxed text-[#222b61] md:text-lg"><T en="Every decision is built around the way your customers discover, trust and choose your business.">Cada decisión se construye alrededor de cómo tus clientes descubren, confían y eligen tu negocio.</T></p>
          </motion.div>
          <div className="relative grid divide-y divide-[#080d25]/25 md:col-span-7 md:grid-rows-3">
            {[
              { number: "01", title: { es: "No partimos de una plantilla", en: "We do not start from a template" }, text: { es: "La estructura, el mensaje y las interacciones responden a tu negocio, no a un catálogo de layouts.", en: "Structure, message and interaction respond to your business, not a catalogue of layouts." }, icon: Code2 },
              { number: "02", title: { es: "Diseñamos para el siguiente paso", en: "We design for the next action" }, text: { es: "Cada bloque tiene una tarea: explicar, generar confianza, facilitar una decisión o convertir.", en: "Every block has a job: explain, build trust, help a decision or convert." }, icon: Compass },
              { number: "03", title: { es: "Lanzamos con una base sólida", en: "We launch on solid ground" }, text: { es: "Velocidad, SEO técnico y un camino claro para seguir mejorando después del lanzamiento.", en: "Speed, technical SEO and a clear path to improve after launch." }, icon: BarChart3 },
            ].map((item, index) => {
              const Icon = item.icon;
              return <motion.article {...entrance(index * 0.07)} key={item.number} className="grid gap-5 px-6 py-10 sm:grid-cols-[auto_1fr_auto] sm:items-center md:px-12 lg:px-16"><span className="font-mono text-xs font-black tracking-[0.16em] text-[#30386f]">{item.number}</span><div><h3 className="font-display text-2xl font-black tracking-[-0.035em] sm:text-3xl"><T en={item.title.en}>{item.title.es}</T></h3><p className="mt-2 max-w-xl text-sm leading-relaxed text-[#222b61]"><T en={item.text.en}>{item.text.es}</T></p></div><Icon className="hidden sm:block" size={28} strokeWidth={1.6} aria-hidden="true" /></motion.article>;
            })}
          </div>
        </section>

        <section id="proceso" className="relative min-h-[100svh] overflow-hidden border-b border-indigo-300/20 bg-[#0f172a] px-6 py-20 md:px-12 md:py-24 lg:px-16">
          <div className="pointer-events-none absolute -right-1/4 top-1/4 h-[36rem] w-[36rem] rounded-full border border-indigo-400/20" aria-hidden="true" />
          <div className="pointer-events-none absolute -right-[19%] top-[30%] h-[30rem] w-[30rem] rounded-full border border-cyan-300/15" aria-hidden="true" />
          <div className="relative grid min-h-[calc(100svh-10rem)] gap-12 lg:grid-cols-12 lg:items-center">
            <motion.div {...entrance()} className="lg:col-span-5">
              <ChapterLabel number="03"><T en="A CLEAR PATH TO LAUNCH">UN CAMINO CLARO AL LANZAMIENTO</T></ChapterLabel>
              <h2 className="mt-6 max-w-xl font-display text-5xl font-black leading-[0.91] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl"><T en="The work moves in a straight line.">El trabajo avanza en línea recta.</T></h2>
              <p className="mt-7 max-w-md text-base leading-relaxed text-slate-300"><T en="A precise process keeps the project visible, collaborative and ready to launch without losing momentum.">Un proceso preciso mantiene el proyecto visible, colaborativo y listo para lanzar sin perder impulso.</T></p>
            </motion.div>
            <div className="lg:col-span-7 lg:border-l lg:border-indigo-300/25 lg:pl-10">
              {[
                { number: "01", title: { es: "Planificas", en: "You plan" }, text: { es: "Alineamos objetivos, público, alcance y las decisiones que importan antes de diseñar.", en: "We align goals, audience, scope and the decisions that matter before design starts." } },
                { number: "02", title: { es: "Diseñamos", en: "We design" }, text: { es: "Traducimos la estrategia en una experiencia clara, distintiva y preparada para convertir.", en: "We translate strategy into a clear, distinctive experience ready to convert." } },
                { number: "03", title: { es: "Lanzamos", en: "We launch" }, text: { es: "Publicamos con una base técnica sólida y acompañamos los primeros pasos del sitio.", en: "We launch on a solid technical foundation and support your website’s first steps." } },
              ].map((step, index) => <motion.div {...entrance(index * 0.1)} key={step.number} className="group grid grid-cols-[auto_1fr] gap-5 border-t border-indigo-300/20 py-8 first:border-t-0 first:pt-0"><span className="flex h-10 w-10 items-center justify-center border border-indigo-300/35 font-mono text-xs font-black text-cyan-200">{step.number}</span><div><h3 className="font-display text-3xl font-black tracking-[-0.04em] text-white"><T en={step.title.en}>{step.title.es}</T></h3><p className="mt-2 max-w-xl text-sm leading-relaxed text-slate-300"><T en={step.text.en}>{step.text.es}</T></p></div></motion.div>)}
              <Link to="/proceso" className="mt-5 inline-flex items-center gap-2 border-b border-cyan-300 pb-1 text-sm font-black text-cyan-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><T en="Explore our process">Conoce nuestra metodología</T><ArrowRight size={16} aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <section id="portafolio" className="border-b border-[var(--color-border-subtle)] bg-[#020617]">
          <motion.header {...entrance()} className="grid gap-5 border-b border-indigo-300/20 px-6 py-16 md:grid-cols-12 md:px-12 md:py-20 lg:px-16">
            <div className="md:col-span-4"><ChapterLabel number="04"><T en="SELECTED WORK">PROYECTOS SELECCIONADOS</T></ChapterLabel></div>
            <div className="md:col-span-8"><h2 className="max-w-4xl font-display text-5xl font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl"><T en="Different industries. One standard of execution.">Industrias distintas. Un mismo estándar de ejecución.</T></h2></div>
          </motion.header>
          <div className="divide-y divide-indigo-300/20">
            {projects.map((project, index) => <motion.article {...entrance(0.04)} key={project.slug} className="group relative min-h-[82svh] overflow-hidden px-6 py-12 md:px-12 md:py-16 lg:px-16"><div className="absolute inset-0 bg-cover bg-center opacity-45 transition duration-700 group-hover:scale-105 group-hover:opacity-60" style={{ backgroundImage: `url(${project.image})` }} aria-hidden="true" /><div className={`absolute inset-0 bg-gradient-to-r ${project.tone}`} aria-hidden="true" /><div className="relative grid min-h-[calc(82svh-6rem)] items-end gap-10 lg:grid-cols-12"><div className="lg:col-span-2"><span className="font-mono text-xs font-black tracking-[0.2em] text-cyan-200">{project.number}</span></div><div className="lg:col-span-7"><p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-indigo-200"><T en={project.type.en}>{project.type.es}</T></p><h3 className="mt-4 max-w-4xl font-display text-5xl font-black leading-[0.9] tracking-[-0.055em] text-white sm:text-6xl lg:text-7xl">{project.title}</h3><p className="mt-6 max-w-xl text-base leading-relaxed text-slate-200"><T en={project.description.en}>{project.description.es}</T></p></div><div className="lg:col-span-3 lg:justify-self-end"><Link to={`/portafolio/${project.slug}`} className="inline-flex min-h-12 items-center gap-3 border border-white/30 bg-slate-950/35 px-5 text-sm font-black text-white transition-colors hover:border-cyan-200 hover:bg-cyan-200 hover:text-[#08102a] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-cyan-200/60"><T en="View project">Ver proyecto</T><ArrowUpRight size={18} aria-hidden="true" /></Link></div></div></motion.article>)}
          </div>
          <div className="px-6 py-10 md:px-12 lg:px-16"><Link to="/portafolio" className="inline-flex items-center gap-2 text-sm font-black text-cyan-200 transition-colors hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><T en="See all projects">Ver todos los proyectos</T><ArrowRight size={17} aria-hidden="true" /></Link></div>
        </section>

        <section className="relative min-h-[100svh] overflow-hidden bg-[#080d25] px-6 py-20 md:px-12 md:py-24 lg:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_75%_15%,rgba(129,140,248,.3),transparent_30%),radial-gradient(circle_at_10%_85%,rgba(34,211,238,.16),transparent_28%)]" aria-hidden="true" />
          <div className="relative flex min-h-[calc(100svh-10rem)] flex-col">
            <motion.header {...entrance()} className="grid gap-6 border-b border-indigo-300/20 pb-11 lg:grid-cols-12 lg:items-end"><div className="lg:col-span-4"><ChapterLabel number="05"><T en="TRANSPARENT PRICING">INVERSIÓN TRANSPARENTE</T></ChapterLabel></div><div className="lg:col-span-8"><h2 className="max-w-4xl font-display text-5xl font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl"><T en="The right plan for every stage.">El paquete correcto para cada etapa.</T></h2><p className="mt-5 max-w-xl text-base leading-relaxed text-slate-300"><T en="Fixed prices, no hidden costs. One payment and your site can be live in weeks.">Precios fijos, sin costos ocultos. Un pago y tu sitio puede estar en línea en semanas.</T></p></div></motion.header>
            {isOfferActive && <div className="border-b border-amber-300/25 py-4 font-mono text-xs font-bold text-amber-200"><T en="Launch offer: 25% off during the first month.">Oferta de lanzamiento: 25% de descuento durante el primer mes.</T></div>}
            <div className="grid flex-1 divide-y divide-indigo-300/20 md:grid-cols-3 md:divide-x md:divide-y-0">
              {plans.map((plan, index) => {
                const price = isOfferActive ? Math.round(plan.price * 0.75) : plan.price;
                return <motion.article {...entrance(index * 0.07)} key={plan.number} className="relative flex min-h-[34rem] flex-col justify-between py-9 md:px-8 md:py-12 first:md:pl-0 last:md:pr-0">{plan.featured && <span className="absolute right-0 top-0 bg-[#818cf8] px-3 py-1.5 font-mono text-[10px] font-black uppercase tracking-[0.15em] text-[#080d25]"><T en="Most popular">Más popular</T></span>}<div><div className="flex items-baseline justify-between gap-4"><span className="font-mono text-xs font-black tracking-[0.16em]" style={{ color: plan.accent }}>{plan.number}</span><span className="font-mono text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">USD</span></div><h3 className="mt-10 font-display text-3xl font-black tracking-[-0.04em] text-white"><T en={plan.title.en}>{plan.title.es}</T></h3><div className="mt-5 flex items-end gap-2">{isOfferActive && <span className="mb-2 text-sm text-slate-500 line-through">${plan.price.toLocaleString()}</span>}<span className="font-display text-6xl font-black leading-none tracking-[-0.06em] text-white">${price.toLocaleString()}</span></div><p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300"><T en={plan.summary.en}>{plan.summary.es}</T></p></div><div className="mt-10"><ul className="space-y-3 border-t border-white/10 pt-6">{plan.features.map((feature) => <li key={feature.es} className="flex gap-2 text-xs leading-relaxed text-slate-300"><CheckCircle2 size={14} className="mt-0.5 shrink-0" style={{ color: plan.accent }} aria-hidden="true" /><T en={feature.en}>{feature.es}</T></li>)}</ul><p className="mt-6 flex items-center gap-2 text-xs font-bold" style={{ color: plan.accent }}><Sparkles size={14} aria-hidden="true" /><T en={plan.warranty.en}>{plan.warranty.es}</T></p><button type="button" onClick={() => navigate("/cotizar")} className="mt-7 inline-flex min-h-11 items-center gap-2 border-b border-current pb-1 text-sm font-black text-white transition-colors hover:text-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><T en="Start with this plan">Comenzar con este plan</T><ArrowRight size={16} aria-hidden="true" /></button></div></motion.article>;
              })}
            </div>
            <div className="border-t border-indigo-300/20 pt-7 text-sm text-slate-300"><T en="All packages include a domain up to $15 USD (1st year), SSL and managed hosting.">Todos los paquetes incluyen dominio web hasta $15 USD (1er año), SSL y hosting administrado.</T><Link to="/servicios" className="ml-3 inline-flex font-black text-cyan-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><T en="Compare everything">Comparar todo</T></Link></div>
          </div>
        </section>

        <section id="soluciones" className="min-h-[100svh] border-b border-[var(--color-border-subtle)] bg-[#f8fafc] text-[#101632]">
          <motion.header {...entrance()} className="grid gap-6 border-b border-[#101632]/15 px-6 py-16 md:grid-cols-12 md:px-12 md:py-20 lg:px-16"><div className="md:col-span-4"><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-indigo-700"><T en="THE POLARIS ECOSYSTEM">EL ECOSISTEMA POLARIS</T></p></div><div className="md:col-span-8"><h2 className="max-w-4xl font-display text-5xl font-black leading-[0.9] tracking-[-0.06em] sm:text-6xl lg:text-7xl"><T en="More ways to move your business forward.">Más formas de hacer crecer tu negocio.</T></h2></div></motion.header>
          <div className="grid md:grid-cols-3">
            {[
              { label: { es: "NÚCLEO DIGITAL", en: "DIGITAL CORE" }, title: { es: "Diseño y desarrollo web", en: "Web design and development" }, text: { es: "Landing pages, webs corporativas y e-commerce construidos alrededor de tus objetivos.", en: "Landing pages, corporate websites and e-commerce built around your goals." }, link: "/cotizar", action: { es: "Cotiza tu proyecto", en: "Quote your project" }, icon: Globe2, color: "#4f46e5" },
              { label: { es: "PRESENCIA LOCAL", en: "LOCAL PRESENCE" }, title: { es: "Local Lift", en: "Local Lift" }, text: { es: "Una forma enfocada de mejorar cómo aparece, comunica y se descubre tu negocio a nivel local.", en: "A focused way to improve how your business appears, communicates and gets discovered locally." }, link: "/local-lift", action: { es: "Conoce Local Lift", en: "Explore Local Lift" }, icon: Compass, color: "#0faaa4" },
              { label: { es: "OPERACIONES", en: "OPERATIONS" }, title: { es: "Polaris Flow", en: "Polaris Flow" }, text: { es: "Sistemas enfocados que organizan las partes repetitivas de tu negocio para que el equipo avance con más claridad.", en: "Focused systems that organize the repetitive parts of your business so the team can move with more clarity." }, link: "/flow", action: { es: "Explora Polaris Flow", en: "Explore Polaris Flow" }, icon: Orbit, color: "#f59e0b" },
            ].map((solution, index) => { const Icon = solution.icon; return <motion.article {...entrance(index * 0.07)} key={solution.title.en} className="group flex min-h-[30rem] flex-col justify-between border-b border-[#101632]/15 px-6 py-10 last:border-b-0 md:border-b-0 md:border-r md:px-10 md:py-14 last:md:border-r-0 lg:px-16"><div><div className="flex items-center justify-between"><span className="font-mono text-[10px] font-black tracking-[0.16em]" style={{ color: solution.color }}><T en={solution.label.en}>{solution.label.es}</T></span><Icon size={25} style={{ color: solution.color }} aria-hidden="true" /></div><h3 className="mt-14 font-display text-4xl font-black leading-[0.92] tracking-[-0.05em]"><T en={solution.title.en}>{solution.title.es}</T></h3><p className="mt-5 max-w-sm text-sm leading-relaxed text-slate-600"><T en={solution.text.en}>{solution.text.es}</T></p></div><Link to={solution.link} className="inline-flex items-center gap-2 border-b pb-1 text-sm font-black transition-colors hover:text-indigo-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600" style={{ borderColor: solution.color, color: solution.color }}><T en={solution.action.en}>{solution.action.es}</T><ArrowRight size={16} aria-hidden="true" /></Link></motion.article>; })}
          </div>
        </section>

        <section id="faq" className="relative min-h-[100svh] overflow-hidden bg-[#050816] px-6 py-20 md:px-12 md:py-24 lg:px-16">
          <div className="pointer-events-none absolute bottom-0 left-0 h-1/2 w-full bg-[radial-gradient(ellipse_at_bottom,rgba(79,70,229,.25),transparent_62%)]" aria-hidden="true" />
          <div className="relative grid gap-14 lg:grid-cols-12 lg:items-start">
            <motion.div {...entrance()} className="lg:col-span-4"><ChapterLabel number="06"><T en="COMMON QUESTIONS">DUDAS COMUNES</T></ChapterLabel><h2 className="mt-6 max-w-md font-display text-5xl font-black leading-[0.9] tracking-[-0.055em] text-white sm:text-6xl"><T en="The details should be as clear as the idea.">Los detalles deben ser tan claros como la idea.</T></h2><p className="mt-6 max-w-sm text-sm leading-relaxed text-slate-300"><T en="If there is a question before starting, this is a good place to resolve it. You can also talk directly with us.">Si hay una pregunta antes de comenzar, este es un buen lugar para resolverla. También puedes hablar directamente con nosotros.</T></p><Link to="/contacto" className="mt-8 inline-flex items-center gap-2 text-sm font-black text-cyan-200 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><T en="Contact Polaris">Contactar a Polaris</T><ArrowRight size={16} aria-hidden="true" /></Link></motion.div>
            <div className="lg:col-span-8 lg:border-l lg:border-indigo-300/20 lg:pl-10">
              {faqs.map((faq, index) => { const open = openFaqIndex === index; return <motion.div {...entrance(index * 0.05)} key={faq.es} className="border-b border-indigo-300/20"><button type="button" onClick={() => setOpenFaqIndex(open ? null : index)} className="flex w-full items-center justify-between gap-6 py-7 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200"><span className="font-display text-xl font-black tracking-[-0.025em] text-white sm:text-2xl"><T en={faq.en}>{faq.es}</T></span><ChevronDown size={21} className={`shrink-0 text-cyan-200 transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" /></button>{open && <div className="max-w-2xl pb-7 text-sm leading-relaxed text-slate-300"><T en={faq.answerEn}>{faq.answerEs}</T></div>}</motion.div>; })}
            </div>
          </div>
          <motion.div {...entrance(0.12)} className="relative mt-24 border-t border-indigo-300/20 pt-16 text-center md:mt-32 md:pt-20"><p className="font-mono text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200"><T en="READY TO START?">¿LISTO PARA COMENZAR?</T></p><h2 className="mx-auto mt-6 max-w-5xl font-display text-5xl font-black leading-[0.88] tracking-[-0.065em] text-white sm:text-6xl lg:text-8xl"><T en="Let’s build something extraordinary.">Construyamos algo extraordinario.</T></h2><p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-slate-300"><T en="Plan your project today and receive a personalized proposal in less than 24 hours. No obligation.">Planifica tu proyecto hoy y recibe una propuesta personalizada en menos de 24 horas. Sin compromiso.</T></p><RippleButton onClick={() => navigate("/cotizar")} className="group mt-9 inline-flex min-h-14 items-center gap-3 bg-[#818cf8] px-7 py-4 text-base font-black text-[#0b1025] transition-transform hover:-translate-y-0.5 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/60"><Rocket size={20} className="transition-transform group-hover:-translate-y-1 group-hover:rotate-12" aria-hidden="true" /><T en="Plan your Project">Planifica tu Proyecto</T><ArrowRight size={19} className="transition-transform group-hover:translate-x-1" aria-hidden="true" /></RippleButton></motion.div>
        </section>
      </main>

      <Footer variant="immersive" />
    </div>
  );
}
