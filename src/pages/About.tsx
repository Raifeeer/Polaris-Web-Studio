import React from 'react';
import { motion } from 'framer-motion';
import { Target, Lightbulb, TrendingUp, Users, ArrowRight, Globe } from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import ContactSection from '../components/ContactSection';
import { T } from '../context/LanguageContext';

export default function About() {
  const values = [
    {
      title: <T en="Precision">Precisión</T>,
      description: <T en="Every line of code and every pixel has a defined purpose. We leave nothing to chance.">Cada línea de código y cada píxel tiene un propósito definido. No dejamos nada al azar.</T>,
      icon: Target,
      color: "var(--color-primary-base)"
    },
    {
      title: <T en="Innovation">Innovación</T>,
      description: <T en="We explore the latest technologies to deliver solutions that not only work today, but lead tomorrow.">Exploramos las últimas tecnologías para ofrecer soluciones que no solo funcionen hoy, sino que lideren mañana.</T>,
      icon: Lightbulb,
      color: "var(--color-accent-blue)"
    },
    {
      title: <T en="Results">Resultados</T>,
      description: <T en="We don't just build websites; we create business tools that generate real conversions.">No solo construimos sitios web; creamos herramientas de negocio que generan conversiones reales.</T>,
      icon: TrendingUp,
      color: "var(--color-primary-base)"
    }
  ];

  const team = [
    {
      name: "Cristian Dicen",
      role: <T en="CEO & Founder">CEO & Fundador</T>,
      initials: "CD",
      bio: <T en="Developer and digital strategist. Expert in the Google ecosystem and with broad mastery of the modern tech stack to lead development, design, and operations.">Desarrollador y estratega digital. Experto en el ecosistema de Google y con un amplio dominio del stack tecnológico moderno para dirigir el desarrollo, diseño y operaciones.</T>
    }
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-12 md:py-20 relative z-10 space-y-32">
        
        {/* Hero Section */}
        <section className="flex flex-col items-center text-center gap-6">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-elevated)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]"
          >
            <T en="Our Beginnings">Nuestros Inicios</T>
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-8xl font-display font-black leading-[1] tracking-tighter"
          >
            <T en={<>Engineering Digital <br /> with Purpose.</>}>Ingeniería Digital <br /> con Propósito.</T>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-[var(--color-text-secondary)] max-w-2xl mx-auto leading-relaxed"
          >
            <T en="Our mission is to raise the digital standard for brands in Latin America through elite web solutions.">Nuestra misión es elevar el estándar digital de las marcas en Latinoamérica a través de soluciones web de élite.</T>
          </motion.p>
        </section>

        {/* Story Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight"><T en="Our Story">Nuestra Historia</T></h2>
            <div className="space-y-4 text-[var(--color-text-secondary)] leading-relaxed">
              <p>
                <T en="Polaris Web Studio was born with a clear vision: to bridge the gap between aesthetic design and exceptional technical performance.">Polaris Web Studio nació con una visión clara: cerrar la brecha entre el diseño estético y el rendimiento técnico excepcional. </T>
              </p>
              <p>
                <T en="What started as a deep passion for development and technology has consolidated into an independent studio serving ambitious brands across the region, from disruptive startups to established businesses.">Lo que comenzó como una profunda pasión por el desarrollo y la tecnología, se ha consolidado como un estudio independiente que sirve a marcas ambiciosas en toda la región, desde startups disruptivas hasta empresas establecidas.</T>
              </p>
              <p>
                <T en="The web is the most critical frontier for any modern business, and my unwavering obsession with precision allows me to deliver consistent results that push the boundaries of conventionality.">La web es la frontera más importante para cualquier negocio moderno, y mi inquebrantable obsesión por la precisión me permite entregar resultados consistentes que desafían los límites de lo convencional.</T>
              </p>
            </div>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative h-[400px] rounded-[var(--radius-bento)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] overflow-hidden flex items-center justify-center p-8"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[var(--color-primary-base)]/5 to-transparent shadow-inner" />
            <div className="relative text-center space-y-4">
               <Globe size={80} strokeWidth={1.5} className="mx-auto text-[var(--color-primary-base)]" />
               <p className="font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]"><T en="100% Virtual & Global Operation">Operación 100% Virtual & Global</T></p>
            </div>
          </motion.div>
        </section>

        {/* Values Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight"><T en="Values that Guide Us">Valores que nos Guían</T></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {values.map((value, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="p-8 rounded-[var(--radius-bento)] bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-6 group hover:border-[var(--color-primary-base)] transition-colors duration-300 bento-glow-hover"
              >
                <div 
                  className="w-14 h-14 rounded-2xl flex items-center justify-center border border-[var(--color-border-strong)] bg-[var(--color-surface-base)]"
                  style={{ color: value.color }}
                >
                  <value.icon size={28} />
                </div>
                <div className="space-y-3">
                  <h3 className="text-2xl font-display font-bold tracking-tight">{value.title}</h3>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Team Section */}
        <section className="space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight"><T en="The Team">El Equipo</T></h2>
            <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto"><T en="A personalized approach where creativity and technique work in sync to materialize your vision.">Un enfoque personalizado donde la creatividad y la técnica trabajan en sincronía para materializar tu visión.</T></p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-1 max-w-sm mx-auto gap-8">
            {team.map((member, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center space-y-6"
              >
                <div className="w-32 h-32 rounded-full border-2 border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] mx-auto flex items-center justify-center text-3xl font-display font-black text-[var(--color-primary-base)] relative group">
                  <div className="absolute inset-0 rounded-full bg-[var(--color-primary-base)] scale-0 group-hover:scale-100 transition-transform opacity-10" />
                  {member.initials}
                </div>
                <div className="space-y-2">
                  <h3 className="text-xl font-bold">{member.name}</h3>
                  <p className="text-xs text-[var(--color-primary-base)] font-black uppercase tracking-[0.2em]">{member.role}</p>
                  <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed max-w-[250px] mx-auto">
                    {member.bio}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </section>

        {/* CTA Footer Section */}
        <section className="text-center space-y-10 pt-20">
           <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter max-w-4xl mx-auto"><T en="Ready to build the future of your brand?">¿Listo para construir el futuro de tu marca?</T></h2>
           <button 
             onClick={scrollToContact}
             className="px-10 py-5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-xl hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 flex items-center gap-2 mx-auto"
           >
             <T en="Get a Quote">Cotizar Proyecto</T> <ArrowRight size={24} />
           </button>
        </section>

      </main>

      <ContactSection />
      <Footer />
    </div>
  );
}
