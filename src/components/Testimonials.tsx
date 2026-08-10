import { motion } from 'framer-motion';
import { ExternalLink } from 'lucide-react';
import { T } from '../context/LanguageContext';

// Un solo caso real (Tano Excursions, único cliente real hoy) en vez de
// testimonios inventados con nombres/cifras ficticias -- ver auditoría CRO
// del 20 de julio. Sin cita textual del cliente porque no existe una real
// todavía; se muestra como caso de estudio con datos verificables (GA4,
// Fase 32 de CLAUDE.md), no como reseña de boca del cliente.
export default function Testimonials() {
  return (
    <section className="py-4 bg-transparent">
      <div className="max-w-3xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-display font-black tracking-tight mb-8">
          <T en="A real case">Un caso real</T>
        </h2>

        <motion.a
          href="https://tanoexcursions.com"
          target="_blank"
          rel="noopener noreferrer"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.5 }}
          className="group block p-8 bg-[var(--color-surface-base)] rounded-2xl border border-[var(--color-border-subtle)] shadow-sm hover:border-[var(--color-primary-base)] transition-colors text-left"
        >
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <div className="font-bold text-lg text-[var(--color-text-primary)]">Tano Excursions</div>
              <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">
                <T en="Tourism · Reservation platform">Turismo · Plataforma de reservas</T>
              </div>
            </div>
            <ExternalLink size={18} className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-base)] transition-colors shrink-0" />
          </div>
          <p className="text-[var(--color-text-secondary)] leading-relaxed text-sm">
            <T en="A tour reservation platform with real-time capacity control, automatic references, and PayPal payments — live and processing bookings today.">
              Plataforma de reservas de excursiones con control de cupo en
              tiempo real, referencias automáticas y pagos con PayPal — en
              producción, procesando reservas hoy.
            </T>
          </p>
          <div className="mt-4 text-xs font-bold text-[var(--color-primary-base)] inline-flex items-center gap-1.5">
            <T en="Visit the real site">Visitar el sitio real</T>
            <ExternalLink size={12} />
          </div>
        </motion.a>
      </div>
    </section>
  );
}
