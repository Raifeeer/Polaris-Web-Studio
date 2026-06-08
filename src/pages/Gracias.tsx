import React, { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle2, ArrowRight, Home, Calendar, Sparkles, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";

const GA_ID = import.meta.env.VITE_GA4_ID;

export default function Gracias() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};

  useEffect(() => {
    // Scroll to top
    window.scrollTo(0, 0);

    // Track conversion event in Google Analytics 4 (GA4)
    if (GA_ID) {
      try {
        import("react-ga4").then((module) => {
          module.default.event({
            category: "Conversion",
            action: "quote_submission_success",
            label: `Plan: ${state.plan || "Undefined"} | Total: ${state.total || "Custom"}`,
          });
          module.default.send({ hitType: "pageview", page: "/gracias" });
        });
      } catch (err) {
        console.warn("GA4 event firing failed:", err);
      }
    }
  }, [state]);

  const steps = [
    {
      num: "01",
      title: <T en="Automatic Registration">Registro Confirmado</T>,
      desc: state.discountActive ? (
        <T en="We received your configuration and locked your 25% discount. An invitation has been dispatched to your email.">
          Hemos recibido la configuración de tu proyecto y aseguramos tu descuento del 25%. Enviamos una invitación a tu correo.
        </T>
      ) : (
        <T en="We received your project configuration. An invitation has been dispatched to your email.">
          Hemos recibido la configuración de tu proyecto con éxito. Enviamos una invitación de reunión a tu correo.
        </T>
      )
    },
    {
      num: "02",
      title: <T en="Strategy Briefing">Briefing de Estrategia</T>,
      desc: <T en="In our meeting, we will dissect your competitors, structural requirements, and conversion targets.">En nuestra sesión analizaremos la competencia, los requerimientos estructurales y tus objetivos de conversión.</T>
    },
    {
      num: "03",
      title: <T en="Launch Delivery">Lanzamiento Dinámico</T>,
      desc: <T en="Within record days, we deliver and optimize your handcrafted high-performance engine for live conversions.">En tiempo récord ponderamos, estructuramos y activamos tu plataforma lista para captar ventas.</T>
    }
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />

      <main className="flex-1 max-w-4xl mx-auto w-full px-6 py-24 md:py-32 flex flex-col items-center justify-center relative">
        {/* Background glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-[var(--color-primary-base)]/5 rounded-full blur-[100px] pointer-events-none" />

        {/* Animated Check Icon */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 100, damping: 15 }}
          className="w-24 h-24 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.1)]"
        >
          <CheckCircle2 size={48} />
        </motion.div>

        {/* Title and message */}
        <div className="text-center space-y-4 max-w-2xl mb-12">
          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-black tracking-tight"
          >
            <T en="¡Thank you! We're ready.">¡Muchísimas Gracias!</T>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[var(--color-text-secondary)] text-md md:text-lg leading-relaxed font-sans"
          >
            {state.discountActive ? (
              <T en="Your project request and strategic session have been successfully scheduled. We have secured your special offer for a limited time.">
                Tu solicitud de proyecto y sesión estratégica han sido agendadas con éxito. Hemos asegurado tu oferta especial por tiempo limitado.
              </T>
            ) : (
              <T en="Your project request and strategic session have been successfully scheduled. We're ready to design your customized platform.">
                Tu solicitud de proyecto y sesión estratégica han sido agendadas con éxito. Estamos listos para diseñar tu plataforma a medida.
              </T>
            )}
          </motion.p>
        </div>

        {/* Selected Config Summary Sheet */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-[var(--radius-bento)] p-6 md:p-8 mb-16 shadow-lg relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
            <Sparkles size={80} />
          </div>

          <h3 className="text-lg font-display font-bold mb-4 flex items-center gap-2 text-[var(--color-primary-base)]">
            <Sparkles size={18} />
            <T en="Project Summary">Resumen de tu Cotización</T>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm divide-y md:divide-y-0 md:divide-x divide-[var(--color-border-subtle)]">
            <div className="space-y-4 pt-4 md:pt-0">
              <div>
                <span className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold block mb-1">
                  <T en="Plan Chosen">Plan Seleccionado</T>
                </span>
                <span className="font-bold text-base text-[var(--color-text-primary)]">
                  {state.planName ? state.planName : <T en="Custom Setup">Personalizado</T>}
                </span>
              </div>

              {state.addons && state.addons.length > 0 && (
                <div>
                  <span className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold block mb-1">
                    <T en="Add-on Services">Servicios Adicionales</T>
                  </span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {state.addons.map((add: string, i: number) => (
                      <span key={i} className="px-2 py-0.5 bg-[var(--color-surface-highlight)] text-xs rounded border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] font-medium">
                        {add}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-4 pt-4 md:pt-0 md:pl-6">
              <div>
                <span className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold block mb-1">
                  <T en="Final Estimate Price">Estimación Final Garantizada</T>
                </span>
                <span className="text-2xl md:text-3xl font-display font-black text-[var(--color-primary-base)]">
                  {state.total ? `$${state.total}` : <T en="To define in session">A definir en sesión</T>}
                  {state.isMonthly && <span className="text-xs font-normal text-[var(--color-text-tertiary)]"> + ${state.isMonthly}/mes</span>}
                </span>
                {state.discountActive && (
                  <span className="block mt-1 text-xs text-emerald-500 font-bold flex items-center gap-1">
                    <ShieldCheck size={12} />
                    <T en="with 25% Off Guaranteed">Incluye descuento del 25% asegurado</T>
                  </span>
                )}
              </div>

              {state.domain && (
                <div>
                  <span className="text-xs uppercase tracking-widest text-[var(--color-text-tertiary)] font-bold block mb-1">
                    <T en="Proposed Domain">Dominio Propuesto</T>
                  </span>
                  <span className="font-mono text-xs text-[var(--color-text-secondary)] bg-[var(--color-surface-base)] px-2 py-1 rounded border border-[var(--color-border-subtle)] inline-block">
                    {state.domain}
                  </span>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Process Next Steps */}
        <div className="w-full mb-16 space-y-8">
          <div className="text-center">
            <h2 className="text-xl md:text-2xl font-display font-black">
              <T en="What happens next?">¿Cuáles son los siguientes pasos?</T>
            </h2>
            <p className="text-xs text-[var(--color-text-tertiary)] mt-1 uppercase tracking-wider">
              <T en="Path to your new launch">El camino hacia tu próximo lanzamiento</T>
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {steps.map((st, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-6 rounded-2xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] relative flex flex-col justify-between"
              >
                <div>
                  <div className="text-3xl font-display font-black text-[var(--color-primary-base)]/25 mb-4 font-mono select-none">
                    {st.num}
                  </div>
                  <h4 className="font-bold text-sm tracking-tight text-[var(--color-text-primary)] mb-2 uppercase">
                    {st.title}
                  </h4>
                  <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                    {st.desc}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto font-sans"
        >
          <button
            onClick={() => navigate("/")}
            style={{ cursor: "pointer" }}
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--color-surface-highlight)] hover:bg-[var(--color-border-strong)] rounded-xl font-bold transition-all text-sm w-full sm:w-auto border-none"
          >
            <Home size={16} />
            <T en="Go to Homepage">Ir al Inicio</T>
          </button>
          
          <a
            href="https://wa.me/18299200544?text=Hola%20Polaris%2C%20acabo%20de%20completar%20mi%20cotizaci%C3%B3n%20y%20me%20gustar%C3%ADa%20coordinar%20los%20detalles."
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-8 py-3 bg-[var(--color-primary-base)] text-white hover:scale-105 active:scale-95 rounded-xl font-bold transition-all text-sm w-full sm:w-auto text-center line-none no-underline shadow-md"
            style={{ textDecoration: "none" }}
          >
            <T en="Talk with the Team">Hablar con el equipo</T>
            <ArrowRight size={16} />
          </a>
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
