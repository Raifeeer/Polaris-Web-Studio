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
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[var(--color-surface-base)] to-transparent z-30 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[var(--color-surface-base)] to-transparent z-30 pointer-events-none" />

          <button
            onClick={handlePrev}
            aria-label="Previous testimonial"
            className="absolute left-1 z-40 p-1.5 rounded-full text-[var(--color-text-tertiary)] opacity-50 hover:opacity-100 hover:text-[var(--color-primary-base)] transition-all"
          >
            <ChevronLeft size={20} />
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
                    initial={{ opacity: 0, x: isActive ? 0 : isPrev ? -90 : 90, scale: 0.85 }}
                    animate={{
                      opacity: isActive ? 1 : 0.65,
                      x: isActive ? 0 : isPrev ? -100 : 100,
                      scale: isActive ? 1 : 0.88,
                      filter: isActive ? 'blur(0px)' : 'blur(1px)',
                      zIndex: isActive ? 10 : 5
                    }}
                    exit={{ opacity: 0, scale: 0.85 }}
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

          <button
            onClick={handleNext}
            aria-label="Next testimonial"
            className="absolute right-1 z-40 p-1.5 rounded-full text-[var(--color-text-tertiary)] opacity-50 hover:opacity-100 hover:text-[var(--color-primary-base)] transition-all"
          >
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </section>
  );
}
