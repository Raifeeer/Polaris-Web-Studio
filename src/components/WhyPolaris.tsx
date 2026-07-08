import React, { useEffect, useRef, useState } from 'react';
import { motion, useInView, animate } from 'framer-motion';
import { T, useLanguage } from '../context/LanguageContext';

// Hook para animar números
function useCountUp(target: number, isActive: boolean, duration = 1.5) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (!isActive) return;
    const controls = animate(0, target, {
      duration,
      ease: 'easeOut',
      onUpdate: (v) => setValue(Math.round(v)),
    });
    return () => controls.stop();
  }, [isActive, target, duration]);
  return value;
}

// Componente de barra comparativa individual
function CompareBar({ label, polarisVal, competitorVal, unit, lessIsBetter }: any) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  
  let polarisPct = (polarisVal / Math.max(polarisVal, competitorVal)) * 100;
  let competitorPct = (competitorVal / Math.max(polarisVal, competitorVal)) * 100;

  if (lessIsBetter) {
    const minVal = Math.min(polarisVal, competitorVal);
    polarisPct = (minVal / polarisVal) * 100;
    competitorPct = (minVal / competitorVal) * 100;
  }

  const polarisDisplay = useCountUp(polarisVal, isInView);
  const compDisplay = useCountUp(competitorVal, isInView);

  return (
    <div ref={ref} className="space-y-3">
      <p className="text-xs font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">{label}</p>
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-[var(--color-text-secondary)] w-28 shrink-0">Polaris</span>
          <div className="flex-1 h-5 bg-[var(--color-surface-highlight)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full flex items-center justify-end pr-3"
              style={{ background: `var(--color-primary-base)` }}
              initial={{ width: 0 }}
              animate={{ width: isInView ? `${polarisPct}%` : 0 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
            >
              <span className="text-[10px] font-black text-white whitespace-nowrap">
                {polarisDisplay}{unit}
              </span>
            </motion.div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-bold text-[var(--color-text-secondary)] w-28 shrink-0">
            <T en="Other agencies">Otras agencias</T>
          </span>
          <div className="flex-1 h-5 bg-[var(--color-surface-highlight)] rounded-full overflow-hidden">
            <motion.div
              className="h-full rounded-full flex items-center justify-end pr-3 bg-[var(--color-border-strong)]"
              initial={{ width: 0 }}
              animate={{ width: isInView ? `${competitorPct}%` : 0 }}
              transition={{ duration: 1.2, ease: 'easeOut', delay: 0.2 }}
            >
              <span className="text-[10px] font-black text-[var(--color-text-secondary)] whitespace-nowrap">
                {compDisplay}{unit}
              </span>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Componente de círculo de progreso
function CircleProgress({ value, label, sublabel, color, suffix = '%' }: any) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-80px' });
  const animatedValue = useCountUp(value, isInView);
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const dash = (value / 100) * circ;

  return (
    <div ref={ref} className="flex flex-col items-center gap-3">
      <div className="relative w-28 h-28">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 128 128">
          <circle cx="64" cy="64" r={radius} fill="none"
            stroke="var(--color-surface-highlight)" strokeWidth="10" />
          <motion.circle
            cx="64" cy="64" r={radius} fill="none"
            stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dash} ${circ}`}
            initial={{ strokeDasharray: `0 ${circ}` }}
            animate={{ strokeDasharray: isInView ? `${dash} ${circ}` : `0 ${circ}` }}
            transition={{ duration: 1.4, ease: 'easeOut' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[var(--color-text-primary)]" style={{ color }}>
            {animatedValue}{suffix}
          </span>
        </div>
      </div>
      <div className="text-center">
        <p className="text-sm font-black text-[var(--color-text-primary)]">{label}</p>
        <p className="text-[11px] text-[var(--color-text-tertiary)] mt-0.5">{sublabel}</p>
      </div>
    </div>
  );
}

export default function WhyPolaris() {
  const { language } = useLanguage();

  return (
    <section className="py-20 border-t border-[var(--color-border-subtle)]">
      <div className="max-w-5xl mx-auto px-6 space-y-12">

        {/* Título */}
        <motion.div
          className="text-center space-y-3"
          initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: "spring", stiffness: 45, damping: 14 }}
        >
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em]">
            <T en="Performance & Results">Rendimiento & Resultados</T>
          </span>
          <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter">
            {(language === "es" 
              ? "¿Por qué elegir Polaris?" 
              : "Why choose Polaris?"
            ).split(" ").map((word, i) => (
              <motion.span
                key={i}
                initial={{ opacity: 0, y: 20, filter: "blur(4px)" }}
                whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{
                  duration: 0.4,
                  delay: i * 0.08,
                  ease: [0.25, 0.46, 0.45, 0.94],
                }}
                className="inline-block mr-[0.25em]"
              >
                {word}
              </motion.span>
            ))}
          </h2>
          <motion.p
            className="text-[var(--color-text-secondary)] max-w-xl mx-auto"
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <T en="Numbers don't lie. See how we compare.">
              Los números no mienten. Mira cómo nos comparamos.
            </T>
          </motion.p>
        </motion.div>

        {/* A: Barras comparativas */}
        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.1 }}
        >
          <p className="text-xs font-black uppercase tracking-widest text-center text-[var(--color-text-tertiary)] mb-8">
            <T en="Head-to-head comparison">Comparación directa</T>
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 glass-panel rounded-2xl p-5">
            <CompareBar
              label={language === 'es' ? 'Respuesta de comunicación' : 'Communication response'}
              polarisVal={24} competitorVal={72} unit="h"
              lessIsBetter={true}
            />
            <CompareBar
              label={language === 'es' ? 'Tecnologías dominadas' : 'Technologies mastered'}
              polarisVal={10} competitorVal={3} unit="+"
            />
          </div>
        </motion.div>

        {/* B: Círculos de progreso */}
        <motion.div
          initial={{ opacity: 0, y: 35, scale: 0.96, filter: "blur(6px)" }}
          whileInView={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
          viewport={{ once: true, margin: '-80px' }}
          transition={{ type: "spring", stiffness: 45, damping: 14, delay: 0.2 }}
        >
          <p className="text-xs font-black uppercase tracking-widest text-center text-[var(--color-text-tertiary)] mb-8">
            <T en="Our standards">Nuestros estándares</T>
          </p>
          <div className="grid grid-cols-3 gap-4 md:gap-5 glass-panel rounded-2xl p-5">
            <CircleProgress
              value={100} suffix=""
              label={<T en="SEO Score">SEO Score</T>}
              sublabel={<T en="Consistent in all projects">Consistente en todos los proyectos</T>}
              color="#6366f1"
            />
            <CircleProgress
              value={99} suffix="%"
              label={<T en="Uptime">Uptime</T>}
              sublabel={<T en="Global infrastructure">Infraestructura global</T>}
              color="#22c55e"
            />
            <CircleProgress
              value={100} suffix="%"
              label={<T en="Your code">Tu código</T>}
              sublabel={<T en="Proprietary, always yours">Propietario, siempre tuyo</T>}
              color="#f59e0b"
            />
          </div>
        </motion.div>

      </div>
    </section>
  );
}
