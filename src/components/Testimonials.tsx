import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { T } from '../context/LanguageContext';

export default function Testimonials() {
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonials = [
    { name: "Juan P.", role: "Restaurante", text: "Aumenté mis reservas un 40% en 2 meses con la nueva landing." },
    { name: "Maria L.", role: "Consultora", text: "Polaris transformó mi web corporativa, ahora transmito autoridad real." },
    { name: "Carlos F.", role: "Tienda Online", text: "Las ventas automatizadas me ahorran 10 horas de trabajo semanal." },
  ];

  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  const handleNext = () => setActiveIndex((prev) => (prev + 1) % testimonials.length);

  React.useEffect(() => {
    const interval = setInterval(handleNext, 5000);
    return () => clearInterval(interval);
  }, [activeIndex]);

  return (
    <section className="py-4 bg-transparent">
      <div className="max-w-7xl mx-auto px-6 text-center">
        <h2 className="text-3xl font-display font-black tracking-tight mb-4">
          <T en="What our clients say">Lo que dicen nuestros clientes</T>
        </h2>

        {/* Desktop View */}
        <div className="hidden md:grid grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <div key={i} className="p-6 bg-[var(--color-surface-base)] rounded-2xl border border-[var(--color-border-subtle)] shadow-sm">
              <p className="text-[var(--color-text-secondary)] italic mb-4">"{t.text}"</p>
              <div className="font-bold text-[var(--color-text-primary)]">{t.name}</div>
              <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">{t.role}</div>
            </div>
          ))}
        </div>

        {/* Mobile View */}
        <div className="md:hidden relative flex items-center justify-center overflow-hidden py-2">
          {/* Gradients for fade effect */}
          <div className="absolute left-0 top-0 bottom-0 w-20 bg-gradient-to-r from-[var(--color-surface-base)] to-transparent z-30 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-20 bg-gradient-to-l from-[var(--color-surface-base)] to-transparent z-30 pointer-events-none" />

          <button onClick={handlePrev} className="absolute left-0 z-40 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)]">
            <ChevronLeft size={32} />
          </button>
          
          <div className="relative w-full h-[220px] flex items-center justify-center">
            <AnimatePresence initial={false} mode="wait">
              {testimonials.map((t, i) => {
                const isActive = i === activeIndex;
                const isPrev = i === (activeIndex - 1 + testimonials.length) % testimonials.length;
                const isNext = i === (activeIndex + 1) % testimonials.length;

                if (!isActive && !isPrev && !isNext) return null;

                return (
                  <motion.div
                    key={i}
                    drag="x"
                    dragConstraints={{ left: 0, right: 0 }}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipe = Math.abs(offset.x) * velocity.x;
                      if (swipe < -10000) handleNext();
                      else if (swipe > 10000) handlePrev();
                    }}
                    initial={{ opacity: 0, x: isActive ? 0 : isPrev ? -100 : 100, scale: 0.8 }}
                    animate={{ 
                      opacity: isActive ? 1 : 0.4, 
                      x: isActive ? 0 : isPrev ? -120 : 120, 
                      scale: isActive ? 1 : 0.85,
                      filter: isActive ? 'blur(0px)' : 'blur(4px)',
                      zIndex: isActive ? 10 : 5
                    }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    transition={{ duration: 0.3 }}
                    className="absolute w-[80%] max-w-[280px] p-6 bg-[var(--color-surface-base)] rounded-2xl border border-[var(--color-border-subtle)] shadow-sm cursor-grab active:cursor-grabbing"
                  >
                    <p className="text-[var(--color-text-secondary)] italic mb-4 text-sm">"{t.text}"</p>
                    <div className="font-bold text-[var(--color-text-primary)]">{t.name}</div>
                    <div className="text-xs text-[var(--color-text-tertiary)] uppercase tracking-wider">{t.role}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <button onClick={handleNext} className="absolute right-0 z-40 p-2 text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)]">
            <ChevronRight size={32} />
          </button>
        </div>
      </div>
    </section>
  );
}
