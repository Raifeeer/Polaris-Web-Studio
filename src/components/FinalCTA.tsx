import React from 'react';
import { T } from '../context/LanguageContext';

export default function FinalCTA() {
  return (
    <section className="py-20 text-center px-6">
      <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-6">
        <T en="Still have doubts?">¿Todavía tienes dudas?</T>
      </h2>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8">
        <T en="Schedule a free 15-minute call without commitment.">
          Agenda una llamada gratuita de 15 minutos sin compromiso.
        </T>
      </p>
      <a
        href="/cotizar?step=schedule"
        target="_self"
        rel="noopener noreferrer"
        className="inline-block px-8 py-4 bg-[var(--color-primary-base)] text-[var(--color-on-primary)] rounded-xl font-bold hover:bg-[var(--color-primary-base)]/90 transition-all"
      >
        <T en="Schedule a call">Agendar llamada</T>
      </a>
    </section>
  );
}
