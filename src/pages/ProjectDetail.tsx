import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, CheckCircle2, Layout, Zap, Trophy, ArrowRight } from 'lucide-react';
import { projects } from '../constants/projects';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import MockupFrame from '../components/MockupFrame';

export default function ProjectDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const project = projects.find(p => p.slug === slug);

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-surface-base)]">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-display font-black">Proyecto no encontrado</h1>
          <button onClick={() => navigate('/portafolio')} className="text-[var(--color-primary-base)] font-bold">
            Volver al portafolio
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)]">
      <Navbar />
      
      <main className="flex-1 max-w-7xl mx-auto w-full px-6 md:px-10 py-12 md:py-20 space-y-24">
        
        {/* Back Button */}
        <Link 
          to="/portafolio" 
          className="inline-flex items-center gap-2 text-sm font-bold text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] transition-colors"
        >
          <ArrowLeft size={16} /> Volver al Portafolio
        </Link>

        {/* Hero Section */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="flex flex-col items-start gap-2.5">
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                  project.plan === 'Destello' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                  project.plan === 'Constelación' ? 'bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] border-[var(--color-primary-base)]/20' :
                  'bg-purple-500/10 text-purple-500 border-purple-500/20'
                }`}>
                  Plan {project.plan}
                </span>
                <span className="text-[var(--color-text-tertiary)] text-[10px] font-black uppercase tracking-widest">
                  {project.type}
                </span>
              </div>
              <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter leading-tight">
                {project.title}
              </h1>
              <p className="text-xl text-[var(--color-text-secondary)] leading-relaxed">
                {project.shortDesc}
              </p>
            </div>

            <div className="rounded-[var(--radius-bento)] p-6 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] relative overflow-hidden mt-8 bento-glow">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[var(--color-primary-base)]/10 to-transparent blur-3xl opacity-50" />
              <div className="grid grid-cols-1 gap-y-6 sm:gap-y-0 sm:grid-cols-3 sm:divide-x divide-[var(--color-border-strong)] w-full relative z-10">
                {project.results.map((res, i) => (
                  <div key={i} className="flex flex-col items-center justify-start text-center px-1 sm:px-2 h-full">
                    <p className="text-[9px] sm:text-[10px] font-bold uppercase tracking-widest text-[var(--color-text-secondary)] mb-2 text-center h-[28px] flex items-center pt-2 w-full justify-center">
                      {res.label}
                    </p>
                    <div className="text-xl sm:text-base md:text-lg lg:text-xl xl:text-2xl font-display font-black text-[var(--color-primary-base)] leading-none tracking-tight text-center w-full flex-1 flex items-start justify-center">
                      {res.value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="relative"
          >
            <MockupFrame 
              type={project.size === 'tall' || project.slug === 'clinica-bienestar' || project.slug === 'sabor-autentico' ? 'mobile' : 'browser'}
              projectSlug={project.slug}
            />
          </motion.div>
        </section>

        {/* Case Study Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-12 pt-16">
          <div className="md:col-span-2 space-y-16">
            <div className="space-y-6">
              <h2 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
                <Layout className="text-[var(--color-primary-base)]" size={24} /> Concepto del Proyecto
              </h2>
              <p className="text-[var(--color-text-secondary)] leading-relaxed text-lg">
                {project.context}
              </p>
            </div>

            <div className="space-y-6">
              <h2 className="text-3xl font-display font-black tracking-tight flex items-center gap-3">
                <Zap className="text-[var(--color-primary-base)]" size={24} /> Desafío & Solución Técnica
              </h2>
              <div className="space-y-4">
                <div className="p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)]">
                  <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-red-500 mb-2">Desafío Técnico</h4>
                  <p className="text-[var(--color-text-secondary)] leading-relaxed italic border-l-2 border-red-500/30 pl-4">
                    "{project.challenge}"
                  </p>
                </div>
                <div className="p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-primary-base)]/30">
                  <h4 className="font-black uppercase text-[10px] tracking-[0.2em] text-[var(--color-primary-base)] mb-2">Ingeniería Web</h4>
                  <p className="text-[var(--color-text-primary)] leading-relaxed">
                    {project.solution}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-12">
            <div className="p-8 rounded-3xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] space-y-8">
              <h3 className="text-xl font-display font-black tracking-tight flex items-center gap-2">
                <Trophy className="text-[var(--color-primary-base)]" size={20} /> Focos Clave
              </h3>
              <div className="space-y-6">
                {project.results.map((res, i) => (
                  <div key={i} className="flex flex-col border-b border-[var(--color-border-subtle)] pb-4 gap-1">
                    <span className="text-xs font-bold text-[var(--color-text-secondary)]">{res.label}</span>
                    <span className="text-xl md:text-xl lg:text-2xl font-display font-black text-[var(--color-primary-base)] leading-tight">{res.value}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--color-text-tertiary)]">Tecnologías</h4>
              <div className="flex flex-wrap gap-2">
                {project.techStack.map((tech, i) => (
                  <span key={i} className="px-3 py-1.5 rounded-lg bg-[var(--color-surface-highlight)] text-xs font-bold">
                    {tech}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="text-center py-20 bg-[var(--color-surface-highlight)] rounded-[3rem] space-y-8">
          <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter">¿Buscas una plataforma similar?</h2>
          <button 
            onClick={() => navigate('/?plan=Consulta#contacto')}
            className="px-10 py-5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-xl hover:scale-105 transition-all shadow-lg flex items-center gap-2 mx-auto"
          >
            Cotizar Proyecto <ArrowRight size={20} />
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
