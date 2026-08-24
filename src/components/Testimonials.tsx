import { motion } from "framer-motion";
import { Check, ExternalLink, Radio } from "lucide-react";
import { T, useLanguage } from "../context/LanguageContext";
import StarBorder from "./StarBorder";

// Un solo caso real (Tano Excursions, único cliente real hoy) en vez de
// testimonios inventados con nombres/cifras ficticias -- ver auditoría CRO
// del 20 de julio. Sin cita textual del cliente porque no existe una real
// todavía; se muestra como caso de estudio con datos verificables, no como
// reseña de boca del cliente.
export default function Testimonials() {
  const { language } = useLanguage();

  return (
    <section className="py-8 bg-transparent">
      <div className="max-w-4xl mx-auto px-6">
        <div className="mb-7 flex items-end justify-between gap-5">
          <div>
            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-primary-base)]">
              <T en="Selected work">Trabajo seleccionado</T>
            </p>
            <h2 className="text-3xl font-display font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
              <T en="A real case">Un caso real</T>
            </h2>
          </div>
          <span className="hidden pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] sm:block">
            01 / 01
          </span>
        </div>

        <motion.a
          href="https://tanoexcursions.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-surface-base)]"
          aria-label={language === "en" ? "Tano Excursions — visit the real site" : "Tano Excursions — visitar sitio real"}
        >
          <StarBorder
            color="var(--color-primary-base)"
            speed="8s"
            thickness={1}
            className="w-full"
          >
            <div className="relative overflow-hidden rounded-[inherit] p-5 sm:p-8">
              <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[var(--color-primary-base)]/[0.08] blur-3xl transition-transform duration-700 group-hover:translate-x-5 group-hover:-translate-y-3" />

              <div className="relative flex flex-col gap-7">
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-start gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-primary-base)]/[0.1] text-[var(--color-primary-base)] ring-1 ring-[var(--color-primary-base)]/20">
                      <Radio size={19} strokeWidth={2.2} />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-xl font-black tracking-tight text-[var(--color-text-primary)] sm:text-2xl">
                          Tano Excursions
                        </h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/[0.08] px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.12em] text-emerald-600 dark:text-emerald-300">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <T en="Live">En producción</T>
                        </span>
                      </div>
                      <p className="mt-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                        <T en="Tourism · Reservation platform">Turismo · Plataforma de reservas</T>
                      </p>
                    </div>
                  </div>
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] transition-all duration-300 group-hover:border-[var(--color-primary-base)]/40 group-hover:bg-[var(--color-primary-base)] group-hover:text-[var(--color-on-primary)]">
                    <ExternalLink size={16} />
                  </span>
                </div>

                <div className="max-w-2xl">
                  <p className="text-base leading-7 text-[var(--color-text-secondary)] sm:text-lg sm:leading-8">
                    <T en="A tour reservation platform with real-time capacity control, automatic references, and PayPal payments — live and processing bookings today.">
                      Plataforma de reservas de excursiones con control de cupo en tiempo real, referencias automáticas y pagos con PayPal — en producción, procesando reservas hoy.
                    </T>
                  </p>
                </div>

                <div className="flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-highlight)] px-3 py-1.5">
                      <Check size={12} className="text-[var(--color-primary-base)]" />
                      <T en="Real client project">Proyecto real</T>
                    </span>
                    <span className="rounded-full bg-[var(--color-surface-highlight)] px-3 py-1.5">
                      PayPal
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-black text-[var(--color-primary-base)] transition-transform duration-300 group-hover:translate-x-1">
                    <T en="Visit the real site">Visitar el sitio real</T>
                    <ArrowRightIcon />
                  </span>
                </div>
              </div>
            </div>
          </StarBorder>
        </motion.a>
      </div>
    </section>
  );
}

function ArrowRightIcon() {
  return <span aria-hidden="true">→</span>;
}
