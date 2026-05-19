import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Globe, Rocket, ShoppingCart, ShieldCheck, Zap, ArrowRight, CheckCircle2, MessageSquare, Sparkles, BrainCircuit } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { T } from '../context/LanguageContext';

export default function Services() {
  const navigate = useNavigate();

  const [targetDate] = useState(() => {
    return new Date('2026-06-18T23:59:59Z').getTime();
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
    return `${days}d ${hours.toString().padStart(2, '0')}h ${minutes.toString().padStart(2, '0')}m ${seconds.toString().padStart(2, '0')}s`;
  };

  const plans = [
    {
      name: <T en="Flash Package">Paquete Destello</T>,
      titleColor: "text-amber-500",
      desc: <T en="Your economic Landing Page (fast and direct).">Tu Landing Page económica (rápida y directa).</T>,
      originalPrice: 299,
      features: [
        <T en="Exclusive responsive design">Diseño responsivo exclusivo</T>,
        <T en="Conversion optimization">Optimización de conversión</T>,
        <T en="Form integration">Integración de formularios</T>,
        <T en="30-day support">Soporte por 30 días</T>
      ],
      highlight: false
    },
    {
      name: <T en="Constellation Package">Paquete Constelación</T>,
      titleColor: "text-[var(--color-primary-base)]",
      desc: <T en="Your 5-page Corporate Website (robust and connected).">Tu Web Corporativa de 5 páginas (robusta y conectada).</T>,
      originalPrice: 699,
      features: [
        <T en="Up to 5 custom sections">Hasta 5 secciones personalizadas</T>,
        <T en="Advanced On-page SEO">SEO On-page avanzado</T>,
        <T en="Self-manageable blog">Blog autogestionable</T>,
        <T en="Basic chatbot for predefined answers">Chatbot básico de respuestas predefinidas</T>,
        <T en="SSL Certificate included">Certificado SSL incluido</T>,
        <T en="90-day support">Soporte por 90 días</T>
      ],
      highlight: true
    },
    {
      name: <T en="Nova Package">Paquete Nova</T>,
      titleColor: "text-violet-500",
      desc: <T en="Your virtual store (to explode in sales).">Tu tienda virtual (para explotar en ventas).</T>,
      prefix: <T en="From">Desde</T>,
      originalPrice: 1299,
      badge: <T en="AI Powered">Potenciado con IA</T>,
      badgeIcon: true,
      features: [
        <T en="Unlimited product catalog">Catálogo de productos ilimitado</T>,
        <T en="Configured payment gateways">Pasarelas de pago configuradas</T>,
        <T en="Inventory management">Gestión de inventario</T>,
        <T en="AI Chatbot for lead capture">Chatbot IA para captura de leads</T>,
        <T en="AI tool integration (per project)">Integración con herramientas de IA (según proyecto)</T>,
        <T en="Admin panel">Panel de administración</T>,
        <T en="1-year support">Soporte por 1 año</T>
      ],
      highlight: false
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Header */}
        <section className="text-center space-y-6 mb-20">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]"><T en="Expertise & Execution">Expertise & Ejecución</T></span>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter"><T en="Digital Engineering at Your Fingertips">Ingeniería Digital a tu Alcance</T></h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
            <T en="Explore our specialized services. We develop scalable solutions designed to boost your market presence.">Explora nuestros servicios especializados. Desarrollamos soluciones escalables diseñadas para potenciar tu presencia en el mercado.</T>
          </p>
        </section>

        {/* Services Bento */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-32">
          <div id="landing" className="md:col-span-2 lg:col-span-2 rounded-[var(--radius-bento)] p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col justify-between group bento-glow-hover transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] mb-8 transition-transform group-hover:scale-110">
              <Rocket size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold mb-4 tracking-tight">Landing Pages</h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                <T en="Landing pages designed to convert, with a high-impact interface and minimal loading times.">Páginas de aterrizaje diseñadas para convertir, con una interfaz de alto impacto y tiempos de carga mínimos.</T>
              </p>
              <button 
                onClick={() => navigate('/servicios#landing')}
                className="flex items-center gap-2 text-[var(--color-primary-base)] font-bold group-hover:gap-4 transition-all uppercase text-xs tracking-widest"
              >
                <T en="Learn More">Saber más</T> <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div id="ecommerce" className="md:col-span-2 lg:col-span-2 rounded-[var(--radius-bento)] p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col justify-between group bento-glow-hover transition-all">
            <div className="w-14 h-14 rounded-2xl bg-[var(--color-surface-base)] flex items-center justify-center text-[var(--color-primary-base)] mb-8 transition-transform group-hover:scale-110">
              <ShoppingCart size={28} />
            </div>
            <div>
              <h2 className="text-3xl font-display font-bold mb-4 tracking-tight"><T en="High-Level E-commerce">E-commerce de Alto Nivel</T></h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed mb-6">
                <T en="Scalable virtual stores built on modern technologies to guarantee a seamless shopping experience.">Tiendas virtuales escalables construidas sobre tecnologías modernas para garantizar una experiencia de compra fluida.</T>
              </p>
              <button 
                onClick={() => navigate('/servicios#ecommerce')}
                className="flex items-center gap-2 text-[var(--color-primary-base)] font-bold group-hover:gap-4 transition-all uppercase text-xs tracking-widest"
              >
                <T en="Learn More">Saber más</T> <ArrowRight size={14} />
              </button>
            </div>
          </div>

          <div className="md:col-span-2 lg:col-span-1 rounded-[var(--radius-bento)] p-6 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col gap-4 text-center items-center justify-center group bento-glow-hover transition-all">
             <ShieldCheck className="text-[var(--color-primary-base)]" size={40} />
             <h3 className="font-display font-bold"><T en="Maintenance">Mantenimiento</T></h3>
          </div>

          <div className="md:col-span-2 lg:col-span-2 rounded-[var(--radius-bento)] p-8 border border-[var(--color-border-subtle)] bg-[var(--color-primary-muted)]/10 flex flex-col justify-center gap-2 items-center group bento-glow transition-all">
             <Zap className="text-[var(--color-primary-base)]" size={32} />
             <h3 className="text-2xl font-display font-bold"><T en="SEO Optimization">Optimización SEO</T></h3>
             <p className="text-[var(--color-text-tertiary)] text-xs font-bold uppercase tracking-widest"><T en="Speed and Ranking">Velocidad y Posicionamiento</T></p>
          </div>

          <div className="md:col-span-2 lg:col-span-1 rounded-[var(--radius-bento)] p-6 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col gap-4 text-center items-center justify-center group bento-glow-hover transition-all">
             <Globe className="text-[var(--color-primary-base)]" size={40} />
             <h3 className="font-display font-bold"><T en="Mobile Apps">Apps Móviles</T></h3>
          </div>
        </div>

        {/* Pricing Section */}
        <div className="bg-gradient-to-b from-[var(--color-surface-elevated)] to-[var(--color-surface-base)] rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] p-8 md:p-16 mb-32 relative overflow-hidden">
          {isOfferActive && (
            <div className="absolute top-0 left-0 right-0 bg-[var(--color-primary-base)]/10 border-b border-[var(--color-primary-base)]/30 px-4 py-3 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-6 z-10 text-center text-sm md:text-base">
              <span className="font-bold text-[var(--color-text-primary)]">
                <T en="Launch Offer: Get a 25% discount through the entire first month!">Oferta de lanzamiento: ¡todo el primer mes con 25% de descuento!</T>
              </span>
              <div className="font-display tracking-widest bg-[var(--color-surface-base)] border border-[var(--color-primary-base)] text-[var(--color-primary-base)] px-4 py-1.5 rounded-full shadow-inner tabular-nums">
                {formatTime(timeLeft)}
              </div>
            </div>
          )}

          <section className={`space-y-12 text-center ${isOfferActive ? 'mt-12' : ''}`}>
            <div className="flex flex-col items-center gap-6">
               <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]"><T en="Our Plans">Nuestros Planes</T></span>
               <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter"><T en="Smart Investment">Inversión Inteligente</T></h2>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left max-w-lg lg:max-w-none mx-auto">
              {plans.map((plan, i) => (
                <motion.div 
                  key={i}
                  whileHover={{ y: -10 }}
                  className={`p-8 rounded-[var(--radius-bento)] border transition-all flex flex-col justify-between min-h-[500px] relative ${
                    plan.highlight 
                      ? 'bg-[var(--color-surface-elevated)] border-[var(--color-primary-base)]' 
                      : 'bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)]'
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
                        <h3 className={`text-3xl font-display font-black tracking-tight mb-2 ${plan.titleColor}`}>{plan.name}</h3>
                        {plan.badge && (
                          <div className="bg-gradient-to-r from-purple-500/20 to-blue-500/20 border border-purple-500/30 text-purple-400 text-[10px] font-black rounded-full px-2.5 py-0.5 inline-flex items-center gap-1.5 mb-2 md:mb-4 uppercase tracking-wider shadow-inner w-fit">
                            {plan.badgeIcon && <Sparkles size={12} className="text-purple-400" />}
                            {plan.badge}
                          </div>
                        )}
                        <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">{plan.desc}</p>
                      </div>
                      <div className="mb-8 border-b border-[var(--color-border-subtle)] pb-8 mt-2 md:mt-0">
                        <div className="text-[var(--color-text-tertiary)] font-bold text-[10px] uppercase tracking-widest mb-1 h-3 flex items-end">
                          {plan.prefix || '\u00A0'}
                        </div>
                        <div className="flex flex-col gap-1">
                          {isOfferActive && (
                            <div className="flex items-baseline gap-2 opacity-60">
                              <span className="text-xl md:text-2xl font-display font-medium line-through">${plan.originalPrice.toLocaleString()}</span>
                            </div>
                          )}
                          <div className="flex items-baseline gap-2">
                            <span className="text-5xl md:text-4xl xl:text-5xl font-display font-black text-[var(--color-primary-base)]">
                              ${isOfferActive ? Math.round(plan.originalPrice * 0.75).toLocaleString() : plan.originalPrice.toLocaleString()}
                            </span>
                            <span className="text-[var(--color-text-tertiary)] font-bold text-xs uppercase tracking-widest">USD</span>
                          </div>
                        </div>
                      </div>
                      <ul className="space-y-4 mb-8">
                      {plan.features.map((feature, j) => (
                        <li key={j} className="flex items-start gap-3 text-sm font-medium">
                          <CheckCircle2 size={16} className="text-[var(--color-primary-base)] shrink-0 mt-0.5" />
                          <span className="text-[var(--color-text-primary)]">{feature}</span>
                        </li>
                      ))}
                    </ul>
                    </div>
                  </div>
                  <button 
                    onClick={() => navigate('/cotizar')}
                    className={`w-full py-4 rounded-xl font-black text-sm transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 ${
                    plan.highlight 
                      ? 'bg-[var(--color-primary-base)] text-[var(--color-on-primary)] shadow-lg shadow-[var(--color-primary-base)]/20' 
                      : 'bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)]'
                  }`}>
                    <T en="Choose this Plan">Elegir este Plan</T>
                  </button>
                </motion.div>
              ))}
            </div>
          </section>
        </div>

        {/* AI Add-ons Section */}
        <section className="space-y-12 py-20 border-t border-[var(--color-border-subtle)]">
          <div className="flex flex-col items-center text-center gap-6">
             <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]"><T en="Exclusive Add-ons">Add-ons Exclusivos</T></span>
             <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter"><T en={<>Power your site with <br className="hidden md:block lg:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-purple)] inline-block">Artificial Intelligence</span></>}>Potencia tu web con <br className="hidden md:block lg:hidden" /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-purple)] inline-block">Inteligencia Artificial</span></T></h2>
             <p className="text-[var(--color-text-secondary)] text-lg max-w-2xl mx-auto"><T en="Optional add-ons with additional cost to implement in your plan to take your platform to the next level of automation.">Complementos opcionales (add-ons) con costo adicional al implementar en tu plan para llevar tu plataforma al siguiente nivel de automatización.</T></p>
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
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight"><T en="Smart Chatbot">Chatbot Inteligente</T></h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="Answer customer questions 24/7, capture leads, and schedule appointments automatically.">Responde preguntas de tus clientes 24/7, captura leads y agenda citas automáticamente.</T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1"><T en="Additional Cost">Costo Adicional</T></span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]"><T en="From $150 / month">Desde $150 / mes</T></span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/?plan=Consulta#contacto')}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Consult">Consultar</T> <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.1 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-emerald-500/50 transition-colors duration-300 bento-glow-hover"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                  <BrainCircuit size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight"><T en="Advanced AI Assistant">Asistente de IA Avanzado</T></h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="Integration with AI models like GPT-4 or Gemini, capable of maintaining complex conversations or logical processes.">Integración con modelos de IA como GPT-4 o Gemini, capaz de mantener conversaciones complejas o procesos lógicos.</T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1"><T en="Additional Cost">Costo Adicional</T></span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]"><T en="From $350 / month">Desde $350 / mes</T></span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/?plan=Consulta#contacto')}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Consult">Consultar</T> <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.2 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-blue-500/50 transition-colors duration-300 bento-glow-hover"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400">
                  <Zap size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight"><T en="Semantic Search">Buscador Semántico</T></h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="For e-commerce: your customers find products describing what they need in natural language.">Para e-commerce: tus clientes encuentran productos describiendo lo que necesitan en lenguaje natural.</T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1"><T en="Additional Cost">Costo Adicional</T></span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]"><T en="From $200 / month">Desde $200 / mes</T></span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/?plan=Consulta#contacto')}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Consult">Consultar</T> <ArrowRight size={14} />
              </button>
            </motion.div>

            <motion.div 
              whileInView={{ opacity: 1, y: 0 }}
              initial={{ opacity: 0, y: 20 }}
              transition={{ delay: 0.3 }}
              className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] flex flex-col justify-between group hover:border-indigo-500/50 transition-colors duration-300 bento-glow-hover"
            >
              <div className="space-y-6">
                <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-display font-bold mb-2 tracking-tight"><T en="Content Assistant">Asistente de Contenido</T></h3>
                  <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed mb-4">
                    <T en="Automatically generate product descriptions, blog posts, and review responses.">Genera descripciones de productos, posts de blog y respuestas a reseñas automáticamente.</T>
                  </p>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider block mb-1"><T en="Additional Cost">Costo Adicional</T></span>
                  <span className="text-sm font-black text-[var(--color-text-primary)]"><T en="From $100 / month">Desde $100 / mes</T></span>
                </div>
              </div>
              <button 
                onClick={() => navigate('/?plan=Consulta#contacto')}
                className="mt-8 text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)] hover:gap-4 flex items-center gap-2 transition-all"
              >
                <T en="Consult">Consultar</T> <ArrowRight size={14} />
              </button>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
