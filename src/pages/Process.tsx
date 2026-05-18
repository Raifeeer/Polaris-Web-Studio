import React from 'react';
import { Link } from 'react-router-dom';
import { Globe, Search, Palette, Code, Rocket, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

export default function Process() {
  const steps = [
    {
      id: "01",
      title: "Diagnóstico",
      desc: "Analizamos a fondo tu modelo de negocio, competencia y objetivos claros (KPIs). Vemos la presencia digital como una ciencia aplicada a resultados.",
      icon: Search
    },
    {
      id: "02",
      title: "Arquitectura y Diseño",
      desc: "Creamos interfaces precisas y de alto impacto, enfocadas en la conversión y la mejor experiencia de usuario para tu audiencia.",
      icon: Palette
    },
    {
      id: "03",
      title: "Desarrollo de Élite",
      desc: "Código limpio, escalable y optimizado para velocidad. Implementamos interacciones fluidas con las últimas tecnologías del mercado.",
      icon: Code
    },
    {
      id: "04",
      title: "Lanzamiento",
      desc: "Pruebas exhaustivas, despliegue seguro y monitoreo continuo para garantizar que tu sitio funcione perfecto desde el primer segundo.",
      icon: Rocket
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="max-w-5xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Header */}
        <section className="text-center space-y-6 mb-32">
          <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter leading-tight drop-shadow-2xl">
            Nuestra Metodología
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            Un proceso sistemático y riguroso diseñado para escalar tu negocio con precisión técnica y visión estratégica.
          </p>
        </section>

        {/* Timeline Process */}
        <div className="relative space-y-12">
          {/* Vertical Line */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-[var(--color-border-subtle)] hidden lg:block" />
          
          {steps.map((step, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`flex flex-col lg:flex-row items-center gap-8 lg:gap-24 relative ${i % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'}`}
            >
              {/* Card Pane */}
              <div className="flex-1 w-full">
                <div className={`p-8 rounded-[var(--radius-bento)] border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] group hover:border-[var(--color-primary-base)] transition-colors duration-500 bento-glow-hover text-left flex flex-col ${i % 2 === 0 ? 'lg:text-right lg:items-end' : 'lg:text-left lg:items-start'}`}>
                  <div className="w-16 h-16 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-strong)] flex items-center justify-center text-[var(--color-primary-base)] mb-6 group-hover:scale-110 transition-transform">
                    <step.icon size={32} />
                  </div>
                  <div className="space-y-4">
                    <span className="text-[var(--color-primary-base)] font-display font-black text-4xl opacity-20">{step.id}</span>
                    <h3 className="text-3xl font-display font-bold tracking-tight">{step.title}</h3>
                    <p className="text-[var(--color-text-secondary)] leading-relaxed">{step.desc}</p>
                  </div>
                </div>
              </div>

              {/* Center Marker */}
              <div className="w-16 h-16 rounded-full bg-[var(--color-surface-base)] border-4 border-[var(--color-border-strong)] flex items-center justify-center z-10 shrink-0 hidden lg:flex">
                 <div className="w-3 h-3 rounded-full bg-[var(--color-primary-base)]" />
              </div>

              {/* Spacer Pane */}
              <div className="flex-1 hidden lg:block" />
            </motion.div>
          ))}
        </div>

        {/* Final CTA */}
        <section className="mt-40 p-12 md:p-24 rounded-[var(--radius-bento)] border border-[var(--color-border-strong)] bg-[var(--color-surface-elevated)] text-center relative overflow-hidden bento-glow">
           <div className="relative z-10 space-y-8">
             <h2 className="text-4xl md:text-6xl font-display font-black tracking-tighter">¿Listo para elevar tu negocio?</h2>
             <p className="text-[var(--color-text-secondary)] max-w-xl mx-auto text-lg leading-relaxed">
               Comienza hoy mismo y transforma tu visión en un producto digital de clase mundial.
             </p>
             <button 
                onClick={() => window.open("https://wa.me/18299200544?text=Hola,%20quiero%20agendar%20una%20consultoría", "_blank")}
                className="px-10 py-4 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-lg hover:scale-105 transition-all shadow-lg flex items-center gap-2 mx-auto focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50"
              >
                Agendar Consultoría Gratuita <ArrowRight size={20} />
             </button>
           </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
