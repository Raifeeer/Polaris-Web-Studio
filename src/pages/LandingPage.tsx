import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code, Layers, Zap, ShoppingCart, Briefcase, Globe, BarChart3, Star, ChevronDown, Rocket } from 'lucide-react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import Logo from '../components/Logo';

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
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const testimonials = [
    { name: "Carlos Ruiz", role: "CEO @ TechFlow", text: "Polaris transformó nuestra landing page y las conversiones subieron un 40% en solo un mes. Increíble trabajo." },
    { name: "Elena Gómez", role: "Marketing @ Elevate", text: "El nivel de detalle y la limpieza del código es de otro nivel. Súper recomendados para proyectos serios." },
    { name: "Marc Serra", role: "Fundador @ Nexus", text: "No solo hacen webs bonitas, hacen herramientas de venta. Mi negocio dio un giro de 180 grados." }
  ];

  const faqs = [
    { q: "¿Cuánto tiempo toma un proyecto?", a: "Depende de la complejidad. Una landing page suele estar lista en 2 semanas, mientras que una web corporativa completa toma entre 4 y 6 semanas." },
    { q: "¿Ofrecen mantenimiento?", a: "Sí, tenemos planes de soporte y mantenimiento para asegurar que tu web esté siempre al día y segura." },
    { q: "¿Trabajan con SEO?", a: "Totalmente. Todas nuestras webs nacen con una estructura optimizada para motores de búsqueda (SEO On-page)." },
    { q: "¿Qué incluye el servicio de mantenimiento?", a: "Incluye monitoreo de uptime, actualizaciones de seguridad, copias de respaldo regulares y pequeñas modificaciones de contenido para que tu web siempre esté perfecta." },
    { q: "¿Ofrecen facilidades de pago?", a: "Sí, trabajamos con un esquema de 50% al iniciar el proyecto y 50% al momento del lanzamiento. Para proyectos grandes como e-commerce, podemos estructurar pagos por hitos." }
  ];

    const scrollToContact = () => {
      const element = document.getElementById('contacto');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    };

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
            className="md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)] p-5 pb-6 md:p-16 border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] flex flex-col justify-end relative overflow-hidden group bento-glow"
          >
            <div className="absolute top-1/2 -translate-y-1/2 right-[-150px] sm:right-[-250px] md:right-[-200px] opacity-10 group-hover:opacity-20 group-hover:-translate-x-4 transition-all duration-500 pointer-events-none">
              <Logo size={500} showText={false} className="text-[var(--color-primary-base)]" />
            </div>
            <div className="max-w-3xl space-y-4 md:space-y-6 relative z-10 pt-4 md:pt-0">
              <span className="text-[var(--color-primary-base)] text-[10px] md:text-xs font-black uppercase tracking-[0.2em] font-body">Polaris Web Studio | Global</span>
              <h1 className="text-[2.5rem] sm:text-5xl md:text-8xl font-display font-black leading-[1.1] md:leading-[1] tracking-tighter">
                Digitalizamos el futuro de tu negocio hoy
              </h1>
              <p className="text-[var(--color-text-secondary)] text-sm sm:text-base md:text-xl max-w-xl leading-relaxed">
                Desarrollamos plataformas web de alto impacto diseñadas específicamente para atraer clientes y cerrar ventas. Innovación digital para el mercado global.
              </p>
              <div className="pt-2">
                <button 
                  onClick={scrollToContact}
                  className="px-6 py-3 sm:px-8 sm:py-3 md:px-10 md:py-4 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-sm sm:text-base md:text-lg hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50"
                >
                  Cotizar Proyecto
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
                  Diseño enfocado en conversión para convertir visitantes en clientes reales desde el primer día.
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
                  Plataformas de venta online escalables, seguras y optimizadas para multiplicar tus ingresos las 24 horas del día.
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
                <h3 className="text-2xl font-display font-bold mb-3 tracking-tight">Corporativas</h3>
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                  Identidad digital sólida y elegante que posiciona tu marca como líder indiscutible en su respectivo mercado.
                </p>
              </div>
            </Link>
          </motion.div>

          {/* Metrics Card - Multi-Stats */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
            className="md:col-span-2 lg:col-span-3 rounded-[var(--radius-bento)] p-4 md:p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex items-center justify-center relative overflow-hidden bento-glow min-h-[100px]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-accent-blue)]/10 to-transparent blur-3xl opacity-50" />
            
            <div className="grid grid-cols-1 gap-y-6 sm:gap-y-0 sm:grid-cols-3 sm:divide-x divide-[var(--color-border-strong)] w-full max-w-2xl px-1">
              {/* Stat 1 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  <Counter value={5} suffix="+" />
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full">Interfaces Creadas</p>
              </div>

              {/* Stat 2 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  <Counter value={100} suffix="%" />
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full">Ingeniería Web</p>
              </div>

              {/* Stat 3 */}
              <div className="flex flex-col items-center justify-center text-center px-2">
                <div className="text-3xl sm:text-3xl lg:text-5xl font-display font-black text-[var(--color-primary-base)] tracking-tighter">
                  <Counter value={99} suffix="" />
                </div>
                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mt-1 sm:mt-2 text-center w-full leading-tight">Optimización Lighthouse</p>
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
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">Nuestros Clientes</span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">Soluciones a medida para cada etapa</h2>
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
                  <h3 className="text-xl font-display font-bold mb-3 tracking-tight">Emprendedores y startups</h3>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wide">"Estás lanzando tu idea"</h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                    Necesitas presencia digital rápida, profesional y que inspire confianza desde el primer día.
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
                  <h3 className="text-xl font-display font-bold mb-3 tracking-tight">PYMEs y negocios establecidos</h3>
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wide">"Tu negocio ya existe pero tu web no vende"</h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                    Tienes clientes pero tu sitio actual no los refleja. Es momento de una web a la altura de lo que ofreces.
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
                  <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-2 uppercase tracking-wide">"Quieres vender en línea"</h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
                    Desde catálogos simples hasta tiendas de alto volumen. Te construimos la plataforma que tu negocio necesita para vender 24/7.
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
              <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">Impacto Real</span>
              <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">Lo que dicen de nosotros</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-6 group hover:border-[var(--color-primary-base)] transition-colors duration-300">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map(s => <Star key={s} size={14} className="fill-[var(--color-primary-base)] text-[var(--color-primary-base)]" />)}
                  </div>
                  <p className="text-[var(--color-text-secondary)] italic leading-relaxed">"{t.text}"</p>
                  <div className="pt-6 border-t border-[var(--color-border-subtle)]">
                    <p className="font-bold">{t.name}</p>
                    <p className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-widest">{t.role}</p>
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
               <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">Dudas Comunes</span>
               <h2 className="text-3xl md:text-5xl font-display font-bold tracking-tight">Preguntas Frecuentes</h2>
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
