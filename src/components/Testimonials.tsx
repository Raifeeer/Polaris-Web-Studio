import { motion } from "framer-motion";
import { Check, ExternalLink, ShieldCheck } from "lucide-react";
import { T, useLanguage } from "../context/LanguageContext";
import StarBorder from "./StarBorder";

export default function Testimonials() {
  const { language } = useLanguage();

  return (
    <section className="py-12 bg-transparent">
      <div className="max-w-4xl mx-auto px-6">
        {/* Section Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 mb-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--color-primary-base)]">
                <T en="Case Study · Production">Caso de Éxito · En Producción</T>
              </p>
            </div>
            <h2 className="text-3xl font-display font-black tracking-tight text-[var(--color-text-primary)] sm:text-4xl">
              <T en="How Tano Excursions automated direct bookings without third-party commissions">
                Cómo Tano Excursions automatizó sus reservas directas sin comisiones
              </T>
            </h2>
          </div>
          <span className="hidden pb-1 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--color-text-tertiary)] sm:block shrink-0">
            Punta Cana, RD 🇩🇴
          </span>
        </div>

        {/* Case Study Main Card */}
        <motion.a
          href="https://tanoexcursions.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="group block text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-4 focus-visible:ring-offset-[var(--color-surface-base)]"
          aria-label={language === "en" ? "Tano Excursions — visit the live platform" : "Tano Excursions — visitar la plataforma en vivo"}
        >
          <StarBorder
            color="var(--color-primary-base)"
            speed="8s"
            thickness={1}
            className="w-full"
          >
            <div className="relative overflow-hidden rounded-[inherit] p-6 sm:p-9">
              <div className="pointer-events-none absolute -right-24 -top-28 h-64 w-64 rounded-full bg-[var(--color-primary-base)]/[0.08] blur-3xl transition-transform duration-700 group-hover:translate-x-5 group-hover:-translate-y-3" />

              <div className="relative flex flex-col gap-8">
                {/* Header row: Brand Mark + Name + Tag + Live Badge */}
                <div className="flex items-start justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--color-surface-highlight)] border border-[var(--color-border-subtle)] group-hover:border-[var(--color-primary-base)]/40 transition-colors">
                      <img
                        src="/images/portfolio/tano-excursions-isotipo.png"
                        alt="Tano Excursions Logo"
                        className="h-9 w-9 object-contain"
                      />
                    </div>
                    <div>
                      <div className="flex flex-wrap items-center gap-2.5">
                        <h3 className="text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)]">
                          Tano Excursions
                        </h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-[0.14em] text-emerald-600 dark:text-emerald-400">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                          <T en="Live in Production">En Producción</T>
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--color-text-tertiary)]">
                        <T en="Tourism & Adventures · Punta Cana, Dominican Republic">Turismo y Excursiones · Punta Cana, República Dominicana</T>
                      </p>
                    </div>
                  </div>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] transition-all duration-300 group-hover:border-[var(--color-primary-base)]/40 group-hover:bg-[var(--color-primary-base)] group-hover:text-[var(--color-on-primary)]">
                    <ExternalLink size={16} />
                  </span>
                </div>

                {/* Case Study Metrics Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <span className="text-sm font-black text-emerald-500 font-mono block">0%</span>
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight block mt-0.5">
                      <T en="Zero OTA commissions">Sin comisiones a terceros</T>
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <span className="text-sm font-black text-[var(--color-primary-base)] font-mono block">24/7</span>
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight block mt-0.5">
                      <T en="Direct booking engine">Motor de reservas directas</T>
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <span className="text-sm font-black text-blue-500 font-mono block">PayPal USD</span>
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight block mt-0.5">
                      <T en="Instant online payments">Cobro seguro en línea</T>
                    </span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                    <span className="text-sm font-black text-purple-500 font-mono block">3 Idiomas</span>
                    <span className="text-[11px] font-medium text-[var(--color-text-secondary)] leading-tight block mt-0.5">
                      <T en="EN · ES · FR native">EN · ES · FR nativo</T>
                    </span>
                  </div>
                </div>

                {/* Description of the Challenge and Solution */}
                <div className="max-w-3xl space-y-3">
                  <p className="text-sm sm:text-base leading-relaxed text-[var(--color-text-secondary)]">
                    <T en="We engineered a high-performance direct booking platform for Tano Excursions in Punta Cana. Tourists from the US, Europe, and Latin America select tour dates, specify hotel pickup details, and pay securely in USD with PayPal — eliminating 20%–30% commissions paid to external intermediaries.">
                      Desarrollamos una plataforma de venta directa con motor de reservas para Tano Excursions en Punta Cana. Los turistas internacionales eligen fecha, detallan su hotel de recogida y pagan sus tours en dólares con PayPal de forma inmediata — eliminando el 20%–30% en comisiones que cobran plataformas intermediarias.
                    </T>
                  </p>
                </div>

                {/* Bottom Badges + Live Link CTA */}
                <div className="flex flex-col gap-4 border-t border-[var(--color-border-subtle)] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap gap-2 text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--color-text-tertiary)]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-highlight)] px-3 py-1.5">
                      <Check size={12} className="text-emerald-500" />
                      <T en="Real Production Case">Caso Real en Producción</T>
                    </span>
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-surface-highlight)] px-3 py-1.5">
                      <ShieldCheck size={12} className="text-[var(--color-primary-base)]" />
                      <T en="Custom Booking Engine">Motor de Reservas Propio</T>
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-2 text-xs font-black text-[var(--color-primary-base)] transition-transform duration-300 group-hover:translate-x-1">
                    <T en="Visit live website (tanoexcursions.com)">Visitar sitio en vivo (tanoexcursions.com)</T>
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
