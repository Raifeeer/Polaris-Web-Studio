import React from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";

interface LegalPageProps {
  title: React.ReactNode;
}

export default function LegalPage({ title }: LegalPageProps) {
  const navigate = useNavigate();

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />

      <main className="flex-1 max-w-3xl mx-auto w-full pt-32 pb-20 px-6 relative z-10">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate(-1)}
          className="mb-8 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] transition-colors group"
        >
          <ArrowLeft
            size={16}
            className="group-hover:-translate-x-1 transition-transform"
          />
          <T en="Back">Volver</T>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1 className="font-display font-black text-4xl md:text-5xl uppercase tracking-tighter mb-8 bg-gradient-to-r from-[var(--color-text-primary)] to-[var(--color-primary-base)] bg-clip-text text-transparent">
            {title}
          </h1>

          <div className="space-y-12">
            <section className="p-8 rounded-2xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <div className="w-24 h-24 rounded-full border-4 border-[var(--color-primary-base)]" />
              </div>

              <div className="relative z-10">
                <div className="w-12 h-1 bg-[var(--color-primary-base)] mb-6 rounded-full" />
                <p className="text-[var(--color-text-secondary)] leading-relaxed text-lg">
                  <T en="We are finishing drafting this document to guarantee maximum transparency and legal compliance.">
                    Estamos terminando de redactar este documento para
                    garantizar la máxima transparencia y cumplimiento legal.
                  </T>
                </p>
                <div className="mt-8 flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-[var(--color-primary-base)] animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--color-primary-base)]">
                    <T en="Content in preparation">Contenido en preparación</T>
                  </span>
                </div>
              </div>
            </section>

            <div className="grid gap-6">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 bg-[var(--color-surface-highlight)] rounded-full w-full opacity-30 animate-pulse"
                  style={{ width: `${100 - i * 15}%` }}
                />
              ))}
            </div>

            <p className="text-[var(--color-text-tertiary)] text-sm italic">
              <T en="If you need specific information on this topic before it is available, please contact us at">
                Si necesitas información específica sobre este tema antes de que
                esté disponible, por favor contáctanos en
              </T>{" "}
              <a
                href="mailto:hola@polarisweb.studio"
                className="text-[var(--color-primary-base)] underline"
              >
                hola@polarisweb.studio
              </a>
              .
            </p>
          </div>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
