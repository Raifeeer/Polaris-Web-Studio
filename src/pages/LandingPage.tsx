import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Code, Layers, Zap, ShoppingCart, Briefcase, Globe, BarChart3, Star, ChevronDown, Rocket, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import Hero3D from '../components/Hero3D';
import Logo from '../components/Logo';
import { T } from '../context/LanguageContext';

function Counter({ value, suffix = "", duration = 2 }: { value: number, suffix?: string, duration?: number }) {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView) {
      let start = 0;
      const end = value;
      const totalMiliseconds = duration * 1000;
      const increment = end / (totalMiliseconds / 16); // 16ms approx per frame

      const timer = setInterval(() => {
        start += increment;
        if (start >= end) {
          setCount(end);
          clearInterval(timer);
        } else {
          setCount(Math.floor(start));
        }
      }, 16);

      return () => clearInterval(timer);
    }
  }, [isInView, value, duration]);

  return <span ref={ref}>{count}{suffix}</span>;
}

export default function LandingPage() {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const testimonials = [
    { name: "Carlos Ruiz", role: "CEO", company: "TechFlow", initials: "CR", colorClass: "bg-indigo-500/20 text-indigo-500", text: <T en="Polaris transformed our landing page and conversions went up 40% in just a month. Incredible work.">Polaris transformó nuestra landing page y las conversiones subieron un 40% en solo un mes. Increíble trabajo.</T> },
    { name: "Elena Gómez", role: "Marketing", company: "Elevate", initials: "EG", colorClass: "bg-emerald-500/20 text-emerald-500", text: <T en="The level of detail and clean code is on another level. Highly recommended for serious projects.">El nivel de detalle y la limpieza del código es de otro nivel. Súper recomendados para proyectos serios.</T> },
    { name: "Marc Serra", role: "Founder", company: "Nexus", initials: "MS", colorClass: "bg-violet-500/20 text-violet-500", text: <T en="They don't just make pretty websites, they build sales tools. My business took a 180 degree turn.">No solo hacen webs bonitas, hacen herramientas de venta. Mi negocio dio un giro de 180 grados.</T> }
  ];

  const faqs = [
    { q: <T en="How long does a project take?">¿Cuánto tiempo toma un proyecto?</T>, a: <T en="It depends on the complexity. A landing page is usually ready in 2 weeks, while a full corporate website takes between 4 and 6 weeks.">Depende de la complejidad. Una landing page suele estar lista en 2 semanas, mientras que una web corporativa completa toma entre 4 y 6 semanas.</T> },
    { q: <T en="Do you offer maintenance?">¿Ofrecen mantenimiento?</T>, a: <T en="Yes, we have support and maintenance plans to ensure your website is always up to date and secure.">Sí, tenemos planes de soporte y mantenimiento para asegurar que tu web esté siempre al día y segura.</T> },
    { q: <T en="Do you work with SEO?">¿Trabajan con SEO?</T>, a: <T en="Absolutely. All our websites are born with an optimized on-page SEO structure.">Totalmente. Todas nuestras webs nacen con una estructura optimizada para motores de búsqueda (SEO On-page).</T> },
    { q: <T en="What does the maintenance service include?">¿Qué incluye el servicio de mantenimiento?</T>, a: <T en="It includes uptime monitoring, security updates, regular backups, and minor content changes so your site is always perfect.">Incluye monitoreo de uptime, actualizaciones de seguridad, copias de respaldo regulares y pequeñas modificaciones de contenido para que tu web siempre esté perfecta.</T> },
    { q: <T en="Do you offer payment plans?">¿Ofrecen facilidades de pago?</T>, a: <T en="Yes, we work with a 50% upfront and 50% upon launch structure. For large projects like e-commerce, we can structure milestone payments.">Sí, trabajamos con un esquema de 50% al iniciar el proyecto y 50% al momento del lanzamiento. Para proyectos grandes como e-commerce, podemos estructurar pagos por hitos.</T> }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 md:px-10 py-4 md:py-20 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-min">
          
          {/* Main Hero Card */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)] p-5 pb-6 md:p-16 border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] flex flex-col justify-end relative overflow-hidden group bento-glow min-h-[400px] sm:min-h-[500px]"
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-[-150px] sm:right-[-250px] md:right-[-200px] opacity-10 group-hover:opacity-20 group-hover:-translate-x-4 transition-all duration-500 pointer-events-none">
              <Logo size={500} showText={false} className="text-[var(--color-primary-base)]" />
            </div>
            
            {/* 3D WebGL Canvas */}
            <div className="absolute inset-0 z-0">
              <Hero3D />
            </div>

            <div className="max-w-3xl space-y-4 md:space-y-6 relative z-10 pt-4 md:pt-0">
              <span className="text-[var(--color-primary-base)] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] font-body">Polaris Web Studio | Global</span>
              <h1 className="text-[2.5rem] sm:text-5xl md:text-8xl font-display font-black leading-[1.1] md:leading-[1] tracking-tighter">
                <T en="We digitize the future of your business today">Digitalizamos el futuro de tu negocio hoy</T>
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base md:text-xl max-w-xl leading-relaxed">
                <T en="We develop high-impact web platforms designed specifically to attract clients and close sales. Digital innovation for the global market.">
                  Desarrollamos plataformas web de alto impacto diseñadas específicamente para atraer clientes y cerrar ventas. Innovación digital para el mercado global.
                </T>
              </p>
              <div className="pt-2">
                <button 
                  onClick={() => navigate('/cotizar')}
                  className="px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-sm sm:text-base md:text-lg hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50"
                >
                  <T en="Get a Quote">Cotizar Proyecto</T>
                </button>
              </div>
            </div>
          </motion.div>

          {/* Landing Pages Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors duration-500 bento-glow-hover"
          >
            <Link to="/servicios" className="flex flex-col p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:bg-[var(--color-primary-muted)] transition-colors">
                  <Layers size={24} />
                </div>
                <ArrowRight className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-base)] transition-colors translate-x-0 group-hover:translate-x-1" />
              </div>
              <div className="mt-6 md:mt-12">
                <h3 className="text-2xl font-display font-bold mb-3 tracking-tight">Landing Pages</h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                  <T en="Conversion-focused design to turn visitors into real clients from day one.">
                    Diseño enfocado en conversión para convertir visitantes en clientes reales desde el primer día.
                  </T>
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Commerce Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors duration-300 bento-glow-hover"
          >
            <Link to="/servicios" className="flex flex-col p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:bg-[var(--color-primary-muted)] transition-colors">
                  <ShoppingCart size={24} />
                </div>
                <ArrowRight className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-base)] transition-colors translate-x-0 group-hover:translate-x-1" />
              </div>
              <div className="mt-6 md:mt-12">
                <h3 className="text-2xl font-display font-bold mb-3 tracking-tight">E-commerce</h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                  <T en="Scalable, secure, and optimized online sales platforms to multiply your income 24/7.">
                    Plataformas de venta online escalables, seguras y optimizadas para multiplicar tus ingresos las 24 horas del día.
                  </T>
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Corporate Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors duration-300 bento-glow-hover"
          >
            <Link to="/servicios" className="flex flex-col p-8 h-full items-start gap-4 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 rounded-[var(--radius-bento)] text-left justify-between">
              <div className="flex justify-between items-start w-full">
                <div className="w-12 h-12 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:bg-[var(--color-primary-muted)] transition-colors">
                  <Briefcase size={24} />
                </div>
                <ArrowRight className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-base)] transition-colors translate-x-0 group-hover:translate-x-1" />
              </div>
              <div className="mt-6 md:mt-12">
                <h3 className="text-2xl font-display font-bold mb-3 tracking-tight"><T en="Corporate">Corporativas</T></h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                  <T en="Solid and elegant digital identity that positions your brand as an undisputed leader in its respective market.">
                    Identidad digital sólida y elegante que posiciona tu marca como líder indiscutible en su respectivo mercado.
                  </T>
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Metrics Card - Multi-Stats */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)] py-4 md:py-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-center relative overflow-hidden bento-glow min-h-[100px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-accent-blue)]/10 to-transparent blur-3xl opacity-50" />
            
            <div className="grid grid-cols-1 gap-y-6 sm:gap-y-0 sm:grid-cols-3 sm:divide-x divide-[var(--color-border-strong)] w-full">
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  <T en="2 Weeks">2 Semanas</T>
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full"><T en="Landing Page Delivery">Entrega Landing Page</T></p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  100%
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full"><T en="Custom code, no templates">Código a medida, sin plantillas</T></p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  24/7
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full leading-tight"><T en="Post-launch Support">Soporte Post-lanzamiento</T></p>
              </div>
            </div>
          </motion.div>

          {/* Target Audience Section */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="md:col-span-2 lg:col-span-3 py-20 space-y-12"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]"><T en="Our Clients">Nuestros Clientes</T></span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter"><T en="Custom solutions for every stage">Soluciones a medida para cada etapa</T></h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Card 1 */}
              <motion.div 
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col gap-6 group hover:border-[var(--color-primary-base)] transition-colors duration-300 bento-glow-hover"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:bg-[var(--color-primary-muted)] transition-colors">
                  <Rocket size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-3 tracking-tight"><T en="Entrepreneurs & Startups">Emprendedores y startups</T></h3>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wide"><T en={'"You\'re launching your idea"'}>"Estás lanzando tu idea"</T></h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                    <T en="You need a professional digital presence that inspires trust from day one.">
                      Necesitas presencia digital rápida, profesional y que inspire confianza desde el primer día.
                    </T>
                  </p>
                </div>
              </motion.div>

              {/* Card 2 */}
              <motion.div 
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col gap-6 group hover:border-[var(--color-primary-base)] transition-colors duration-300 bento-glow-hover"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:bg-[var(--color-primary-muted)] transition-colors">
                  <Briefcase size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-3 tracking-tight"><T en="SMEs & Established Businesses">PYMEs y negocios establecidos</T></h3>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wide"><T en={'"Your business exists but your site doesn\'t sell"'}>"Tu negocio ya existe pero tu web no vende"</T></h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                    <T en="You have clients but your site doesn't reflect them. It's time for a website up to par with what you offer.">
                      Tienes clientes pero tu sitio actual no los refleja. Es momento de una web a la altura de lo que ofreces.
                    </T>
                  </p>
                </div>
              </motion.div>

              {/* Card 3 */}
              <motion.div 
                whileInView={{ opacity: 1, y: 0 }}
                initial={{ opacity: 0, y: 20 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col gap-6 group hover:border-[var(--color-primary-base)] transition-colors duration-300 bento-glow-hover"
              >
                <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] group-hover:bg-[var(--color-primary-muted)] transition-colors">
                  <ShoppingCart size={28} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-3 tracking-tight">E-commerce</h3>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wide"><T en={'"You want to sell online"'}>"Quieres vender en línea"</T></h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                    <T en="From simple catalogs to high-volume stores. We build the platform your business needs to sell 24/7.">
                      Desde catálogos simples hasta tiendas de alto volumen. Te construimos la plataforma que tu negocio necesita para vender 24/7.
                    </T>
                  </p>
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Testimonials */}
          <motion.div 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="md:col-span-2 lg:col-span-3 py-20 space-y-12"
          >
            <div className="flex flex-col items-center text-center gap-6">
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]"><T en="Real Impact">Impacto Real</T></span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter"><T en="What they say about us">Lo que dicen de nosotros</T></h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between space-y-6 group hover:border-[var(--color-primary-base)] transition-colors duration-300">
                  <div className="space-y-6">
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="fill-[var(--color-primary-base)] text-[var(--color-primary-base)]" />)}
                    </div>
                    <p className="text-[var(--color-text-secondary)] italic leading-relaxed">"{t.text}"</p>
                  </div>
                  <div className="pt-6 border-t border-[var(--color-border-subtle)] flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shrink-0 ${t.colorClass}`}>
                      {t.initials}
                    </div>
                    <div>
                      <p className="font-bold flex items-center gap-1">
                        {t.name}
                      </p>
                      <div className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] mt-1">
                        <span className="uppercase tracking-widest">{t.role}</span>
                        <span className="text-[var(--color-border-strong)]">•</span>
                        <a href="#" className="hover:text-[var(--color-text-primary)] transition-colors">{t.company}</a>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-emerald-500/80 font-medium mt-1">
                        <CheckCircle2 size={12} />
                        <T en="Verified Client">Cliente verificado</T>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Social Proof/Tech Stack */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="md:col-span-2 lg:col-span-3"
          >
            <div className="rounded-[var(--radius-bento)] p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] flex items-center justify-center gap-12 flex-wrap text-neutral-500 hover:text-[var(--color-primary-base)] transition-colors duration-500">
              <div className="flex items-center gap-2 hover:text-[var(--color-text-primary)] transition-colors"><Zap size={20} /> <span className="font-bold">Next.js</span></div>
              <div className="flex items-center gap-2 hover:text-[var(--color-text-primary)] transition-colors"><Code size={20} /> <span className="font-bold">React</span></div>
              <div className="flex items-center gap-2 hover:text-[var(--color-text-primary)] transition-colors"><Globe size={20} /> <span className="font-bold">Tailwind</span></div>
              <div className="flex items-center gap-2 hover:text-[var(--color-text-primary)] transition-colors"><BarChart3 size={20} /> <span className="font-bold">SEO Core</span></div>
              <div className="flex items-center gap-2 hover:text-[var(--color-text-primary)] transition-colors"><Layers size={20} /> <span className="font-bold">Framer</span></div>
            </div>
          </motion.div>

          {/* FAQ Section */}
          <div className="md:col-span-2 lg:col-span-3 py-20 space-y-12">
            <div className="flex flex-col items-center text-center gap-6 mb-8">
               <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]"><T en="Common Questions">Dudas Comunes</T></span>
               <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight"><T en="Frequently Asked Questions">Preguntas Frecuentes</T></h2>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
               {faqs.map((faq, i) => (
                 <div 
                   key={i} 
                   onClick={() => toggleFaq(i)}
                   className={`p-6 rounded-2xl bg-[var(--color-surface-elevated)] border transition-colors cursor-pointer ${
                     openFaqIndex === i ? 'border-[var(--color-primary-base)] shadow-lg' : 'border-[var(--color-border-subtle)] hover:border-[var(--color-primary-base)]/50'
                   }`}
                 >
                    <div className="flex justify-between items-center">
                       <h4 className="font-bold text-lg">{faq.q}</h4>
                       <motion.div
                         animate={{ rotate: openFaqIndex === i ? 180 : 0 }}
                         transition={{ duration: 0.3 }}
                       >
                         <ChevronDown 
                           size={18} 
                           className={openFaqIndex === i ? 'text-[var(--color-primary-base)]' : 'text-[var(--color-text-tertiary)]'} 
                         />
                       </motion.div>
                    </div>
                    <AnimatePresence>
                      {openFaqIndex === i && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.3, ease: "easeInOut" }}
                          className="overflow-hidden"
                        >
                          <p className="text-sm text-[var(--color-text-secondary)] pt-4 leading-relaxed">
                            {faq.a}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                 </div>
               ))}
            </div>
          </div>

        </div>
      </main>

      <ContactSection />
      <Footer />
    </div>
  );
}
