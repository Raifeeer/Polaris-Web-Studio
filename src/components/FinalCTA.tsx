import React from 'react';
import { useNavigate } from 'react-router-dom';
import { T } from '../context/LanguageContext';
import RippleButton from './RippleButton';

export default function FinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-20 text-center px-6">
      <h2 className="text-3xl md:text-4xl font-display font-black tracking-tight mb-6">
        <T en="Still have doubts?">¿Todavía tienes dudas?</T>
      </h2>
      <p className="text-lg text-[var(--color-text-secondary)] mb-8">
        <T en="Schedule a free 30-minute call without commitment.">
          Agenda una llamada gratuita de 30 minutos sin compromiso.
        </T>
      </p>
      <div className="flex justify-center">
        <RippleButton
          onClick={() => navigate("/cotizar?step=schedule")}
          className="px-8 py-4 bg-[var(--color-primary-base)] text-[var(--color-on-primary)] rounded-xl font-bold hover:bg-[var(--color-primary-base)]/90 hover:scale-105 transition-all shadow-lg focus-visible:outline-none cursor-pointer"
        >
          <T en="Schedule a call">Agendar llamada</T>
        </RippleButton>
      </div>
    </section>
  );
}
