import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { Globe, ArrowUpRight, ExternalLink, Code } from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { projects } from "../constants/projects";
import { T } from "../context/LanguageContext";
import MockupFrame from "../components/MockupFrame";

export default function Portfolio() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10">
        {/* Header */}
        <section className="text-center space-y-6 mb-20">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
            <T en="Concepts and Prototypes">Conceptos y Prototipos</T>
          </span>
          <h1 className="text-5xl md:text-8xl font-display font-black tracking-tighter">
            <T en="Portfolio">Portafolio</T>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
            <T en="Explore a selection of concepts, interfaces, and functional prototypes created to demonstrate the scope of my development and visual design.">
              Explora una selección de conceptos, interfaces y prototipos
              funcionales creados para demostrar el alcance de mi desarrollo y
              diseño visual.
            </T>
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs font-medium max-w-xl mx-auto">
            <T en="Demonstration projects — client portfolio coming soon">
              Proyectos de demostración — portafolio de clientes próximamente
            </T>
          </p>
        </section>

        {/* Portfolio Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[450px] md:auto-rows-[550px] pb-24">
          {projects.map((project, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              onClick={() => navigate(`/portafolio/${project.slug}`)}
              className={`rounded-[var(--radius-bento)] p-6 lg:p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col group overflow-hidden relative bento-glow-hover transition-colors duration-500 cursor-pointer ${
                i === projects.length - 1 ? "md:col-span-2" : ""
              }`}
            >
              {/* Content Top */}
              <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-1">
                  <span
                    className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                      project.plan === "Destello"
                        ? "text-amber-500"
                        : project.plan === "Constelación"
                          ? "text-[var(--color-primary-base)]"
                          : "text-purple-500"
                    }`}
                  >
                    <T en={`Plan ${project.planEN || project.plan}`}>
                      Plan {project.plan}
                    </T>
                  </span>
                  <p className="text-[var(--color-text-tertiary)] text-[10px] font-black uppercase tracking-widest">
                    <T en={project.typeEN || project.type}>{project.type}</T>
                  </p>
                </div>
                <div className="flex gap-2 items-start">
                  {project.isConcept && (
                    <span className="px-3 py-1 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-full text-[10px] font-bold text-[var(--color-text-tertiary)] uppercase tracking-wider">
                      <T en="Demo">Demo</T>
                    </span>
                  )}
                  {project.liveUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        window.open(project.liveUrl, "_blank");
                      }}
                      className="p-3 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] hover:border-[var(--color-primary-base)]/30 transition-all"
                      title="Ver sitio en vivo"
                    >
                      <ExternalLink size={20} />
                    </button>
                  )}
                  <div className="p-3 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-base)] group-hover:border-[var(--color-primary-base)]/30 transition-all">
                    <ArrowUpRight size={20} />
                  </div>
                </div>
              </div>

              {/* Title & Badge */}
              <div className="relative z-10 pt-4 flex flex-col gap-4">
                <div className="flex gap-2 items-center flex-wrap">
                  <span className="px-3 py-1 bg-[var(--color-primary-base)]/10 text-[var(--color-primary-base)] border border-[var(--color-primary-base)]/20 rounded-full text-[10px] font-black uppercase tracking-widest">
                    <T en={project.keyResultEN || project.keyResult}>
                      {project.keyResult}
                    </T>
                  </span>
                </div>
                <h3 className="text-4xl md:text-5xl lg:text-6xl font-display font-black tracking-tighter text-[var(--color-text-primary)]">
                  {project.title}
                </h3>
                <p className="text-[var(--color-text-secondary)] text-sm max-w-sm line-clamp-2">
                  <T en={project.shortDescEN || project.shortDesc}>
                    {project.shortDesc}
                  </T>
                </p>
              </div>

               {/* Mockup Presentation */}
              <div className="relative z-10 w-full mt-8 rounded-t-xl overflow-hidden shadow-2xl transition-transform duration-500 group-hover:-translate-y-2 flex-grow flex flex-col opacity-90 group-hover:opacity-100">
                {project.slug === "nexus-real-estate" ||
                project.slug === "chroma-store" ||
                project.slug === "vitality-clinic" ||
                project.slug === "sabor-autentico" ? (
                  <div className="h-[180px] w-full overflow-hidden relative flex justify-center items-start bg-gradient-to-br from-[var(--color-surface-base)] to-[var(--color-surface-elevated)] pt-6 rounded-t-xl border border-b-0 border-[var(--color-border-subtle)]">
                    <div className="scale-[0.52] sm:scale-[0.6] md:scale-[0.68] lg:scale-[0.75] origin-top translate-y-2 transition-transform duration-500 group-hover:scale-[0.55] sm:group-hover:scale-[0.63] md:group-hover:scale-[0.71] lg:group-hover:scale-[0.78]">
                      <MockupFrame type="mobile" projectSlug={project.slug} />
                    </div>
                  </div>
                ) : (
                  <div className="w-full h-full rounded-t-xl overflow-hidden">
                    <MockupFrame type="browser" projectSlug={project.slug} />
                  </div>
                )}
              </div>

              {/* Decorative Overlay */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none`}
              />
            </motion.div>
          ))}
        </div>

        {/* CTA Footer Section */}
        <section className="mt-32 text-center space-y-10">
          <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter">
            <T en="Is your project next?">¿Tu proyecto es el siguiente?</T>
          </h2>
          <button
            onClick={() => navigate("/cotizar")}
            className="px-10 py-5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-xl hover:scale-105 transition-all shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 cursor-pointer"
          >
            <T en="Plan your project">Planifica tu proyecto</T>
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
