import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, Compass, Globe2, Layers3, Rocket, ShoppingCart, Sparkles } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T, useLanguage } from "../context/LanguageContext";
import RippleButton from "../components/RippleButton";

const services = [
  {
    number: "01",
    title: "Landing Pages",
    label: { es: "CONVERSIÓN", en: "CONVERSION" },
    description: { es: "Diseño enfocado en conversión para transformar visitantes en clientes reales desde el primer día.", en: "Conversion-focused design that turns visitors into real clients from day one." },
    points: [{ es: "Captura rápida de leads", en: "Fast lead capture" }, { es: "Diseño móvil optimizado", en: "Mobile-first layout" }, { es: "WhatsApp directo integrado", en: "Direct WhatsApp integration" }],
    href: "/blog/landing-pages-conversion",
    icon: Layers3,
  },
  {
    number: "02",
    title: "E-commerce",
    label: { es: "VENTAS 24/7", en: "SELL 24/7" },
    description: { es: "Plataformas de venta online escalables, seguras y diseñadas para multiplicar ingresos las 24 horas.", en: "Scalable, secure online sales platforms designed to multiply revenue around the clock." },
    points: [{ es: "Pasarela segura de pago", en: "Secure payment gateway" }, { es: "Administrador de productos", en: "Product management" }, { es: "Compra ágil", en: "Frictionless checkout" }],
    href: "/blog/ecommerce-alto-nivel",
    icon: ShoppingCart,
  },
  {
    number: "03",
    title: { es: "Webs Corporativas", en: "Corporate Websites" },
    label: { es: "AUTORIDAD", en: "AUTHORITY" },
    description: { es: "Una identidad digital sólida y elegante que ayuda a posicionar la marca en su mercado.", en: "A solid, elegant digital identity that helps position a brand in its market." },
    points: [{ es: "Arquitectura a medida", en: "Custom architecture" }, { es: "Estrategia de contenido", en: "Content strategy" }, { es: "Escalable desde el inicio", en: "Scalable from day one" }],
    href: "/blog/webs-corporativas-identidad",
    icon: Globe2,
  },
];

const plans = [
  { number: "01", title: { es: "Paquete Destello", en: "Flash Package" }, price: "$299", description: { es: "Una página diseñada para convertir visitantes en clientes desde el primer scroll.", en: "One page designed to turn visitors into clients from the first scroll." }, items: [{ es: "Diseño exclusivo y responsivo", en: "Exclusive responsive design" }, { es: "WhatsApp integrado", en: "WhatsApp integration" }, { es: "SEO On-Page", en: "On-page SEO" }, { es: "Entrega en 1–2 semanas", en: "Delivered in 1–2 weeks" }], warranty: { es: "30 días de garantía post-lanzamiento", en: "30-day post-launch warranty" } },
  { number: "02", title: { es: "Paquete Constelación", en: "Constellation Package" }, price: "$699", description: { es: "Sitio corporativo de hasta 5 páginas con chatbot IA, blog y Analytics.", en: "Corporate site of up to 5 pages with an AI chatbot, blog and Analytics." }, items: [{ es: "Todo lo de Destello", en: "Everything in Flash" }, { es: "Hasta 5 páginas", en: "Up to 5 pages" }, { es: "Chatbot IA 24/7", en: "24/7 AI chatbot" }, { es: "SEO Técnico + Search Console", en: "Technical SEO + Search Console" }], warranty: { es: "60 días de garantía post-lanzamiento", en: "60-day post-launch warranty" }, featured: true },
  { number: "03", title: { es: "Paquete Nova", en: "Nova Package" }, price: "$1,299", description: { es: "Plataforma de ventas completa con pagos, panel administrativo y una herramienta IA.", en: "Complete sales platform with payments, an admin panel and one AI tool." }, items: [{ es: "Todo lo de Constelación", en: "Everything in Constellation" }, { es: "E-commerce + Stripe y PayPal", en: "E-commerce + Stripe and PayPal" }, { es: "Panel admin personalizado", en: "Custom admin panel" }, { es: "Schema Markup", en: "Schema Markup" }], warranty: { es: "90 días de garantía prioritaria", en: "90-day priority warranty" } },
];

const faqs = [
  { es: "¿Cuánto cuesta un proyecto?", en: "How much does a project cost?", answerEs: "Nuestros proyectos profesionales y personalizados comienzan desde $299 USD. La inversión se define con claridad según la complejidad y las necesidades del negocio.", answerEn: "Our custom professional projects start at $299 USD. The investment is defined clearly around the complexity and needs of the business." },
  { es: "¿Ofrecen facilidades de pago?", en: "Do you offer payment plans?", answerEs: "Sí. Trabajamos con 50% al iniciar el proyecto y 50% al momento del lanzamiento. En proyectos mayores podemos estructurar pagos por fases.", answerEn: "Yes. We work with 50% to start and 50% at launch. For larger projects, we can structure milestone payments." },
  { es: "¿Cuánto tiempo toma un proyecto?", en: "How long does a project take?", answerEs: "Depende de la complejidad. Una landing page suele estar lista en 2 semanas y una web corporativa completa puede tomar entre 4 y 6 semanas.", answerEn: "It depends on complexity. A landing page is usually ready in 2 weeks, while a complete corporate website can take 4 to 6 weeks." },
  { es: "¿Trabajan con SEO y mantenimiento?", en: "Do you provide SEO and maintenance?", answerEs: "Sí. Todas nuestras webs nacen con una estructura SEO On-Page optimizada y contamos con planes de soporte para mantenerlas actualizadas y seguras.", answerEn: "Yes. Every website starts with optimized on-page SEO and we offer support plans to keep it current and secure." },
];

function DuskHorizon() {
  return (
    <svg viewBox="0 0 1440 260" preserveAspectRatio="none" className="pointer-events-none absolute inset-x-0 bottom-0 h-[26%] w-full" aria-hidden="true">
      <path d="M0 165C98 132 166 157 253 138C344 118 422 82 510 107C621 139 681 183 774 158C899 124 961 92 1073 118C1201 148 1317 104 1440 139V260H0Z" fill="#251f38" fillOpacity="0.82" />
      <path d="M0 204C130 171 197 198 323 170C431 146 545 180 648 191C755 202 846 159 974 178C1115 199 1234 165 1440 188V260H0Z" fill="#171322" fillOpacity="0.96" />
      {[92, 224, 377, 510, 678, 824, 1008, 1183, 1348].map((x, index) => <path key={x} d={`M${x} 198l14-72 14 72-8-18 8 30h-28l8-30z`} fill="#171322" opacity={index % 2 ? 0.92 : 0.76} />)}
    </svg>
  );
}

function BrowserMockup() {
  return (
    <figure className="twilight-halo overflow-hidden rounded-[30px] border border-black/10 bg-white">
      <div className="flex h-11 items-center gap-2 border-b border-[#f0f0f0] px-4" aria-hidden="true"><span className="h-2.5 w-2.5 rounded-full bg-[#ff605c]" /><span className="h-2.5 w-2.5 rounded-full bg-[#ffbd44]" /><span className="h-2.5 w-2.5 rounded-full bg-[#00ca4e]" /><span className="ml-4 h-5 flex-1 rounded-full bg-[#f7f7f7]" /></div>
      <div className="relative aspect-[16/10] overflow-hidden bg-[#0d1028]"><img src="/screenshots/la-reja-desktop.svg" alt="Vista previa de un proyecto de Polaris Web Studio" className="h-full w-full object-cover object-top" /><div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#0d1028]/65 to-transparent px-5 pb-5 pt-14"><p className="text-xs font-medium text-white">Proyecto de muestra · La Reja</p></div></div>
      <figcaption className="px-5 py-4 text-xs leading-relaxed text-[#636363]"><T en="A crafted web experience starts with a clear point of view.">Una experiencia web bien construida comienza con una mirada clara.</T></figcaption>
    </figure>
  );
}

export default function LandingPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const reducedMotion = useReducedMotion();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    document.title = language === "es" ? "Polaris Web Studio | Diseño y Desarrollo de Páginas Web Premium" : "Polaris Web Studio | Premium Web Design & Development";
    const description = language === "es" ? "Diseñamos y desarrollamos experiencias web originales para atraer clientes y hacer crecer negocios." : "We design and develop original web experiences that attract clients and help businesses grow.";
    const meta = document.querySelector('meta[name="description"]') ?? document.head.appendChild(document.createElement("meta"));
    meta.setAttribute("name", "description");
    meta.setAttribute("content", description);
  }, [language]);

  const reveal = (delay = 0) => ({ initial: { opacity: 0, y: reducedMotion ? 0 : 16 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true, amount: 0.18 }, transition: { duration: reducedMotion ? 0 : 0.48, delay, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] } });

  return (
    <div className="twilight-page min-h-screen overflow-x-clip bg-[#f7f7f7] text-[#000000]">
      <Navbar variant="editorial" />
      <main>
        <section className="twilight-dusk relative isolate overflow-hidden px-5 pb-44 pt-24 sm:px-8 md:min-h-[790px] md:px-12 md:pb-48 lg:px-16">
          <div className="pointer-events-none absolute inset-0 opacity-25 [background-image:radial-gradient(rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:22px_22px]" aria-hidden="true" />
          <div className="pointer-events-none absolute left-[10%] top-[18%] h-32 w-32 rounded-full bg-[#fff5d8]/45 blur-3xl" aria-hidden="true" />
          <DuskHorizon />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 lg:grid-cols-[0.95fr_1.05fr] lg:gap-16">
            <motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.52, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} className="rounded-[30px] bg-white p-7 text-black twilight-halo sm:p-10">
              <p className="text-xs font-semibold tracking-[-0.02em] text-[#636363]"><T en="Polaris Web Studio · Digital craftsmanship from the Dominican Republic">Polaris Web Studio · Artesanía digital desde República Dominicana</T></p>
              <h1 className="twilight-display mt-5 max-w-xl text-[2.9rem] font-normal leading-[0.98] tracking-[-0.045em] sm:text-6xl"><T en="A website should feel like the beginning of something.">Una web debe sentirse como el comienzo de algo.</T></h1>
              <p className="mt-6 max-w-md text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e] sm:text-base"><T en="We create intentional digital experiences for businesses ready to be discovered, understood and chosen.">Creamos experiencias digitales intencionales para negocios listos para ser descubiertos, entendidos y elegidos.</T></p>
              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
                <RippleButton onClick={() => navigate("/cotizar")} className="inline-flex min-h-12 items-center gap-2 rounded-full bg-[#007aff] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#006ee6] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007aff]/25"><T en="Plan your project">Planifica tu proyecto</T><ArrowRight size={17} aria-hidden="true" /></RippleButton>
                <a href="#estudio" className="inline-flex min-h-12 items-center gap-2 rounded-full border-[1.5px] border-black px-5 py-3 text-sm font-medium text-black transition-opacity hover:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007aff]/25"><T en="Discover Polaris">Conoce Polaris</T><ArrowDownIcon /></a>
              </div>
            </motion.div>
            <motion.div initial={{ opacity: 0, y: reducedMotion ? 0 : 22 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reducedMotion ? 0 : 0.56, delay: reducedMotion ? 0 : 0.08, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] }} className="relative mx-auto w-full max-w-xl lg:translate-y-16"><BrowserMockup /></motion.div>
          </div>
        </section>

        <section id="estudio" className="bg-[#f7f7f7] px-6 py-24 md:px-12 md:py-32">
          <motion.div {...reveal()} className="mx-auto max-w-[690px] text-center"><p className="text-xs font-semibold text-[#007aff]"><T en="A SMALL STUDIO WITH A CLEAR POINT OF VIEW">UN ESTUDIO PEQUEÑO CON UNA MIRADA CLARA</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.04em] text-black sm:text-5xl"><T en="Your digital presence should make your next move easier.">Tu presencia digital debe hacer más fácil tu próximo paso.</T></h2><p className="mt-6 text-base leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en="We pair thoughtful strategy with original code so your website can do more than look polished: it can help the right people act.">Unimos estrategia consciente y código original para que tu web haga más que verse bien: puede ayudar a las personas correctas a actuar.</T></p></motion.div>
        </section>

        <section id="servicios" className="bg-white px-6 py-24 md:px-12 md:py-32"><div className="mx-auto max-w-[800px]"><motion.header {...reveal()}><p className="text-xs font-semibold text-[#007aff]"><T en="WHAT WE BUILD">LO QUE CONSTRUIMOS</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.04em] sm:text-5xl"><T en="Different formats. The same standard of care.">Formatos distintos. El mismo estándar de cuidado.</T></h2></motion.header><div className="mt-16 border-t border-black">{services.map((service, index) => { const Icon = service.icon; const titleEs = typeof service.title === "string" ? service.title : service.title.es; const titleEn = typeof service.title === "string" ? service.title : service.title.en; return <motion.article {...reveal(index * 0.06)} key={service.number} className="grid gap-6 border-b border-black py-9 sm:grid-cols-[76px_1fr_auto] sm:items-start"><span className="text-sm font-medium text-[#007aff]">{service.number}</span><div><p className="text-xs font-semibold text-[#636363]"><T en={service.label.en}>{service.label.es}</T></p><h3 className="twilight-display mt-3 text-3xl font-normal leading-none tracking-[-0.035em]"><T en={titleEn}>{titleEs}</T></h3><p className="mt-4 max-w-lg text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en={service.description.en}>{service.description.es}</T></p><ul className="mt-5 space-y-2">{service.points.map((point) => <li key={point.es} className="flex gap-2 text-sm text-[#3e3e3e]"><Check size={16} className="mt-0.5 shrink-0 text-[#007aff]" aria-hidden="true" /><T en={point.en}>{point.es}</T></li>)}</ul></div><div className="flex justify-end"><Icon size={24} className="text-[#007aff]" aria-hidden="true" /></div><Link to={service.href} className="sm:col-start-2 inline-flex w-fit items-center gap-2 text-sm font-medium text-[#007aff] hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"><T en="Read more">Ver más</T><ArrowUpRight size={16} aria-hidden="true" /></Link></motion.article>; })}</div></div></section>

        <section id="portafolio" className="bg-[#f7f7f7] px-6 py-24 md:px-12 md:py-32"><div className="mx-auto max-w-[960px]"><motion.div {...reveal()} className="max-w-[650px]"><p className="text-xs font-semibold text-[#007aff]"><T en="SELECTED WORK">PROYECTOS SELECCIONADOS</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.04em] sm:text-5xl"><T en="The work changes shape. The intention stays visible.">El trabajo cambia de forma. La intención se mantiene visible.</T></h2></motion.div><motion.div {...reveal(0.08)} className="mt-14"><BrowserMockup /></motion.div><div className="mx-auto mt-9 flex max-w-[760px] flex-col gap-6 sm:flex-row sm:items-end sm:justify-between"><p className="max-w-md text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en="Every project begins with its own audience, business model and point of view. The outcome should never look borrowed.">Cada proyecto comienza con su propio público, modelo de negocio y punto de vista. El resultado no debe parecer prestado.</T></p><Link to="/portafolio" className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full border-[1.5px] border-black px-5 py-3 text-sm font-medium text-black hover:opacity-60 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007aff]/25"><T en="See the portfolio">Ver el portafolio</T><ArrowRight size={16} aria-hidden="true" /></Link></div></div></section>

        <section id="proceso" className="bg-white px-6 py-24 md:px-12 md:py-32"><div className="mx-auto max-w-[800px]"><motion.header {...reveal()} className="max-w-[650px]"><p className="text-xs font-semibold text-[#007aff]"><T en="A WAY OF WORKING">UNA FORMA DE TRABAJAR</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.04em] sm:text-5xl"><T en="The process leaves room for the details that make a site feel right.">El proceso deja espacio para los detalles que hacen que una web se sienta correcta.</T></h2></motion.header><ol className="mt-16 border-t border-black">{[{ n: "01", es: "Planificamos", en: "We plan", copyEs: "Alineamos objetivos, público, alcance y las decisiones que realmente importan.", copyEn: "We align goals, audience, scope and the decisions that actually matter." }, { n: "02", es: "Diseñamos", en: "We design", copyEs: "Convertimos la estrategia en una experiencia clara, distintiva y preparada para convertir.", copyEn: "We turn strategy into a clear, distinctive experience ready to convert." }, { n: "03", es: "Lanzamos", en: "We launch", copyEs: "Publicamos sobre una base técnica sólida y acompañamos los primeros pasos.", copyEn: "We launch on a solid technical foundation and support the first steps." }].map((step, index) => <motion.li {...reveal(index * 0.07)} key={step.n} className="grid gap-4 border-b border-black py-8 sm:grid-cols-[76px_1fr]"><span className="text-sm font-medium text-[#007aff]">{step.n}</span><div><h3 className="twilight-display text-3xl font-normal leading-none tracking-[-0.035em]"><T en={step.en}>{step.es}</T></h3><p className="mt-3 max-w-xl text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en={step.copyEn}>{step.copyEs}</T></p></div></motion.li>)}</ol><Link to="/proceso" className="mt-9 inline-flex items-center gap-2 text-sm font-medium text-[#007aff] hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"><T en="Explore the process">Conoce la metodología</T><ArrowRight size={16} aria-hidden="true" /></Link></div></section>

        <section id="precios" className="bg-[#f7f7f7] px-6 py-24 md:px-12 md:py-32"><div className="mx-auto max-w-[800px]"><motion.header {...reveal()} className="max-w-[650px]"><p className="text-xs font-semibold text-[#007aff]"><T en="TRANSPARENT PRICING">INVERSIÓN TRANSPARENTE</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.04em] sm:text-5xl"><T en="A clear starting point for every stage.">Un punto de partida claro para cada etapa.</T></h2><p className="mt-5 text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en="Fixed prices, no hidden costs. Start with the scope that makes sense today.">Precios fijos, sin costos ocultos. Empieza con el alcance que tiene sentido hoy.</T></p></motion.header><div className="mt-16 border-t border-black">{plans.map((plan, index) => <motion.article {...reveal(index * 0.06)} key={plan.number} className="grid gap-5 border-b border-black py-9 sm:grid-cols-[76px_1fr_auto]"><span className="text-sm font-medium text-[#007aff]">{plan.number}</span><div><div className="flex flex-wrap items-center gap-3"><h3 className="twilight-display text-3xl font-normal leading-none tracking-[-0.035em]"><T en={plan.title.en}>{plan.title.es}</T></h3>{plan.featured && <span className="rounded-full bg-[#e8f3ff] px-3 py-1 text-xs font-medium text-[#007aff]"><T en="Most popular">Más popular</T></span>}</div><p className="mt-3 max-w-xl text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en={plan.description.en}>{plan.description.es}</T></p><ul className="mt-5 grid gap-2 sm:grid-cols-2">{plan.items.map((item) => <li key={item.es} className="flex gap-2 text-sm text-[#3e3e3e]"><Check size={15} className="mt-0.5 shrink-0 text-[#007aff]" aria-hidden="true" /><T en={item.en}>{item.es}</T></li>)}</ul><p className="mt-5 flex gap-2 text-xs text-[#636363]"><Sparkles size={14} className="shrink-0 text-[#007aff]" aria-hidden="true" /><T en={plan.warranty.en}>{plan.warranty.es}</T></p></div><div className="flex flex-col items-start gap-4 sm:items-end"><strong className="twilight-display text-4xl font-normal leading-none tracking-[-0.04em] text-black">{plan.price}</strong><button type="button" onClick={() => navigate("/cotizar")} className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#007aff] px-4 py-2 text-sm font-semibold text-white hover:bg-[#006ee6] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007aff]/25"><T en="Start here">Comenzar</T><ArrowRight size={15} aria-hidden="true" /></button></div></motion.article>)}</div><p className="mt-8 text-xs leading-relaxed text-[#636363]"><T en="All packages include a domain up to $15 USD (first year), SSL and managed hosting.">Todos los paquetes incluyen dominio web hasta $15 USD (primer año), SSL y hosting administrado.</T></p></div></section>

        <section id="soluciones" className="bg-white px-6 py-24 md:px-12 md:py-32"><div className="mx-auto max-w-[800px]"><motion.header {...reveal()} className="max-w-[650px]"><p className="text-xs font-semibold text-[#007aff]"><T en="THE POLARIS ECOSYSTEM">EL ECOSISTEMA POLARIS</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.04em] sm:text-5xl"><T en="More ways to move a business forward.">Más formas de impulsar un negocio.</T></h2></motion.header><div className="mt-16 border-t border-black">{[{ label: { es: "NÚCLEO DIGITAL", en: "DIGITAL CORE" }, title: { es: "Diseño y desarrollo web", en: "Web design and development" }, text: { es: "Landing pages, webs corporativas y e-commerce construidos alrededor de objetivos reales.", en: "Landing pages, corporate websites and e-commerce built around real goals." }, link: "/cotizar", action: { es: "Cotiza tu proyecto", en: "Quote your project" } }, { label: { es: "PRESENCIA LOCAL", en: "LOCAL PRESENCE" }, title: { es: "Local Lift", en: "Local Lift" }, text: { es: "Una forma enfocada de mejorar cómo aparece, comunica y se descubre un negocio a nivel local.", en: "A focused way to improve how a business appears, communicates and gets discovered locally." }, link: "/local-lift", action: { es: "Conoce Local Lift", en: "Explore Local Lift" } }, { label: { es: "OPERACIONES", en: "OPERATIONS" }, title: { es: "Polaris Flow", en: "Polaris Flow" }, text: { es: "Sistemas enfocados para ordenar las partes repetitivas del negocio y avanzar con más claridad.", en: "Focused systems that organize a business’s repetitive parts and help the team move with more clarity." }, link: "/flow", action: { es: "Explora Polaris Flow", en: "Explore Polaris Flow" } }].map((solution, index) => <motion.article {...reveal(index * 0.06)} key={solution.title.en} className="border-b border-black py-9"><p className="text-xs font-semibold text-[#007aff]"><T en={solution.label.en}>{solution.label.es}</T></p><h3 className="twilight-display mt-3 text-3xl font-normal leading-none tracking-[-0.035em]"><T en={solution.title.en}>{solution.title.es}</T></h3><p className="mt-4 max-w-xl text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en={solution.text.en}>{solution.text.es}</T></p><Link to={solution.link} className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#007aff] hover:opacity-60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#007aff]"><T en={solution.action.en}>{solution.action.es}</T><ArrowRight size={16} aria-hidden="true" /></Link></motion.article>)}</div></div></section>

        <section id="faq" className="bg-[#f7f7f7] px-6 py-24 md:px-12 md:py-32"><div className="mx-auto max-w-[800px]"><motion.header {...reveal()} className="max-w-[650px]"><p className="text-xs font-semibold text-[#007aff]"><T en="COMMON QUESTIONS">DUDAS COMUNES</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.04em] sm:text-5xl"><T en="The details should be as clear as the idea.">Los detalles deben ser tan claros como la idea.</T></h2></motion.header><div className="mt-16 border-t border-black">{faqs.map((faq, index) => { const open = openFaq === index; return <motion.article {...reveal(index * 0.04)} key={faq.es} className="border-b border-black"><button type="button" onClick={() => setOpenFaq(open ? null : index)} aria-expanded={open} className="flex w-full items-center justify-between gap-6 py-7 text-left text-black focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007aff]/25"><span className="twilight-display text-2xl font-normal leading-none tracking-[-0.03em] sm:text-3xl"><T en={faq.en}>{faq.es}</T></span><ChevronDown size={20} className={`shrink-0 text-[#007aff] transition-transform duration-200 ${open ? "rotate-180" : ""}`} aria-hidden="true" /></button>{open && <p className="max-w-2xl pb-7 text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en={faq.answerEn}>{faq.answerEs}</T></p>}</motion.article>; })}</div></div></section>

        <section className="bg-white px-6 py-24 md:px-12 md:py-32"><motion.div {...reveal()} className="mx-auto max-w-[700px] text-center"><p className="text-xs font-semibold text-[#007aff]"><T en="READY WHEN YOU ARE">CUANDO ESTÉS LISTO</T></p><h2 className="twilight-display mt-5 text-4xl font-normal leading-none tracking-[-0.045em] sm:text-5xl"><T en="Let’s make the next thing your business needs to be seen for.">Hagamos que tu próximo paso sea algo por lo que tu negocio sea recordado.</T></h2><p className="mt-6 text-[15px] leading-[1.4] tracking-[-0.02em] text-[#3e3e3e]"><T en="Tell us what you are building. The first conversation is a good place to make the path ahead clearer.">Cuéntanos qué estás construyendo. La primera conversación es un buen lugar para hacer más claro el camino.</T></p><RippleButton onClick={() => navigate("/cotizar")} className="mt-8 inline-flex min-h-12 items-center gap-2 rounded-full bg-[#007aff] px-6 py-3 text-sm font-semibold text-white hover:bg-[#006ee6] active:scale-[0.98] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#007aff]/25"><T en="Plan your project">Planifica tu proyecto</T><ArrowRight size={17} aria-hidden="true" /></RippleButton></motion.div></section>
      </main>
      <Footer variant="editorial" />
    </div>
  );
}

function ArrowDownIcon() {
  return <span aria-hidden="true" className="text-lg leading-none">↓</span>;
}
