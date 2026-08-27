import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, BriefcaseBusiness, Building2, Mail, Menu, Rocket, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import TextSizeToggle from "./TextSizeToggle";
import RippleButton from "./RippleButton";
import AtlasMark from "./AtlasMark";
import { useLanguage, T } from "../context/LanguageContext";
import { prefetchRoute } from "../lib/routePrefetch";
import "../styles/mobile-navbar.css";

// Reconstrucción del diseño real de CardNav (rama experimental
// feature/cardnav-navbar, commit dabf395 -- el diseño que el usuario pidió
// explícitamente reproducir, no la demo genérica de reactbits.dev): barra
// alineada al ancho real de la tarjeta del Hero, panel de tarjetas (una por
// categoría + una de ajustes) que se expande debajo.
//
// Única diferencia real a propósito respecto al original: sin
// `backdrop-blur-xl`/`backdrop-blur-md` en ningún elemento -- esa propiedad
// es una de las causas reales y ya medidas del freeze en Chrome/iPhone
// (Fase 61 de CLAUDE.md, "backdrop-filter en .glass-panel cerca de
// contenido animado"). Los fondos quedan sólidos/opacos en vez de
// translúcidos con blur, mismo criterio ya aplicado sitewide.

type CardLink = { label: React.ReactNode; path: string };
type NavCard = { label: React.ReactNode; accent: string; links: CardLink[]; icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }> };

interface NavbarProps {
  variant?: "default" | "immersive" | "editorial" | "mercury" | "auros";
}

export default function Navbar({ variant = "default" }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const { language, setLanguage, translate } = useLanguage();
  const isImmersive = variant === "immersive";
  const isEditorial = variant === "editorial";
  const isMercury = variant === "mercury";
  const isAuros = variant === "auros";

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", isOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, [isOpen]);

  // Esconde/muestra el navbar al hacer scroll -- un solo cálculo por evento
  // (rAF-throttled), nunca una animación continua. Nunca se esconde con el
  // menú abierto.
  useEffect(() => {
    let lastScrollY = window.scrollY;
    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          setScrolled(currentScrollY > 20);
          if (currentScrollY > lastScrollY && currentScrollY > 100 && !isOpen) {
            setHidden(true);
          } else if (currentScrollY < lastScrollY) {
            setHidden(false);
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isOpen]);

  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const cards: NavCard[] = [
    {
      label: <T en="Company">Compañía</T>,
      accent: "var(--color-accent-purple)",
      icon: Building2,
      links: [
        { label: <T en="Home">Inicio</T>, path: "/" },
        { label: <T en="About">Nosotros</T>, path: "/nosotros" },
        { label: <T en="Process">Metodología</T>, path: "/proceso" },
        { label: <T en="Blog">Blog</T>, path: "/blog" },
      ],
    },
    {
      label: <T en="Work">Trabajo</T>,
      accent: "var(--color-accent-blue)",
      icon: BriefcaseBusiness,
      links: [
        { label: <T en="Services">Servicios</T>, path: "/servicios" },
        { label: <T en="Polaris Flow">Polaris Flow</T>, path: "/flow" },
        { label: <T en="Local Lift">Local Lift</T>, path: "/local-lift" },
        { label: <T en="Portfolio">Portafolio</T>, path: "/portafolio" },
      ],
    },
    {
      label: <T en="Get in touch">Contacto</T>,
      accent: "var(--color-primary-base)",
      icon: Mail,
      links: [
        { label: <T en="Contact">Contacto</T>, path: "/contacto" },
        { label: <T en="Client Portal">Portal de Cliente</T>, path: "/login" },
      ],
    },
  ];

  return (
    <>
      <div data-navbar-spacer className="h-16 w-full shrink-0" aria-hidden="true" />
      <nav
        data-navbar-fixed
        ref={navRef}
        className={`fixed left-0 right-0 top-0 z-50 w-full transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className={isImmersive || isMercury || isAuros ? "w-full" : isEditorial ? "mx-auto max-w-[1200px] px-4 pt-5 md:px-6" : "max-w-7xl mx-auto px-4 md:px-10 pt-3"}>
          {/* Barra superior -- fondo sólido (sin backdrop-blur) en vez del
              translúcido+blur del original. */}
          <div
            className={`flex items-center justify-between h-16 px-4 transition-colors duration-300 md:px-12 ${
              isAuros
                ? `rounded-none border-x-0 border-t-0 px-6 md:px-12 ${scrolled || isOpen ? "border-b border-white/10 bg-[#020617]/95" : "border-b border-transparent bg-transparent"}`
                : isMercury
                ? `rounded-none border-x-0 border-t-0 px-6 md:px-12 ${scrolled || isOpen ? "border-b border-white/10 bg-[#171721]/95" : "border-b border-transparent bg-transparent"}`
                : isEditorial
                ? "rounded-[22px] border border-black/10 bg-white text-black shadow-[0_0_0_5px_#f7f7f7]"
                : isImmersive
                ? `rounded-none border-x-0 border-t-0 ${scrolled || isOpen ? "border-b border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg" : "border-b border-transparent bg-[var(--color-surface-base)]"}`
                : `rounded-2xl border ${scrolled || isOpen ? "bg-[var(--color-surface-elevated)] border-[var(--color-border-subtle)] shadow-lg" : "bg-[var(--color-surface-elevated)] border-transparent"}`
            }`}
          >
            <Link
              to="/"
              className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg"
              aria-label={translate("Polaris Web Studio - Inicio", "Polaris Web Studio - Home")}
            >
              <img src="/brand/lockup-horizontal-blanco.svg" alt="Polaris Web Studio" className={`h-12 w-auto shrink-0 ${isEditorial ? "hidden" : "[.light_&]:hidden"}`} />
              <img src="/brand/lockup-horizontal-color.svg" alt="Polaris Web Studio" className={`h-12 w-auto shrink-0 ${isEditorial ? "block" : "hidden [.light_&]:block"}`} />
            </Link>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                to="/asistente"
                onMouseEnter={() => prefetchRoute("/asistente")}
                className="hidden sm:flex w-9 h-9 items-center justify-center rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors"
                aria-label="Atlas Assistant"
                title="Atlas Assistant"
              >
                <AtlasMark variant="isotipo" className="w-6 h-6" />
              </Link>
              <div
                className="hidden sm:block relative group shrink-0"
                onMouseEnter={() => prefetchRoute("/cotizar")}
              >
                <div className="absolute inset-0 rounded-xl bg-[var(--color-primary-base)]/20 pointer-events-none" style={{ filter: "blur(8px)" }} />
                <div className="absolute inset-0 rounded-xl border border-[var(--color-primary-base)]/35 pointer-events-none animate-cta-ping" />
                <RippleButton
                  onClick={() => navigate("/cotizar")}
                  className={`group relative inline-flex items-center gap-1.5 overflow-hidden px-4 py-2 font-black text-sm transition-all whitespace-nowrap ${isAuros ? "rounded-md bg-[linear-gradient(90deg,#0ea5e9_0%,#e0f2fe_48%,#c4b5fd_100%)] text-[#020617] hover:brightness-105" : isMercury ? "rounded-full bg-[#5266eb] text-white hover:bg-[#6275ff]" : isEditorial ? "rounded-full bg-[#007aff] text-white shadow-[inset_0_1px_0_0_#ffffff,0_0_0_1px_rgba(0,0,0,0.15),0_3px_2px_0_rgba(0,0,0,0.06)] hover:bg-[#006ee6]" : "rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] hover:scale-105 shadow-lg"}`}
                >
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
                  <Rocket size={16} className="group-hover:rotate-12 group-hover:-translate-y-0.5 transition-transform duration-300" />
                  <T en="Plan your Project">Planifica tu Proyecto</T>
                  <ArrowRight size={16} className="ml-0.5 group-hover:translate-x-1 transition-transform duration-300" />
                </RippleButton>
              </div>
              <motion.button
                onClick={() => setIsOpen((v) => !v)}
                whileTap={{ scale: 0.92 }}
                className="text-[var(--color-text-primary)] rounded-lg relative w-10 h-10 flex items-center justify-center overflow-hidden shrink-0"
                aria-label={isOpen ? translate("Cerrar menú", "Close menu") : translate("Abrir menú", "Open menu")}
                aria-expanded={isOpen}
              >
                <AnimatePresence mode="wait">
                  {isOpen ? (
                    <motion.div key="close" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute">
                      <X size={24} aria-hidden="true" />
                    </motion.div>
                  ) : (
                    <motion.div key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.2 }} className="absolute">
                      <Menu size={24} aria-hidden="true" />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.button>
            </div>
          </div>
        </div>

        {/* Panel de tarjetas -- se expande debajo de la barra. */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              <div className={`${isImmersive || isMercury || isAuros ? "w-full px-4 md:px-12 mt-0" : isEditorial ? "mx-auto max-w-[1200px] px-4 md:px-6 mt-2" : "max-w-7xl mx-auto px-4 md:px-10 mt-2"} grid grid-cols-2 sm:grid-cols-3 gap-2 overscroll-contain pb-2 mobile-menu-grid`}>
                {cards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                    className="mobile-menu-card rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg p-3 sm:p-4 sm:pt-3"
                    style={{ borderTopColor: card.accent, borderTopWidth: 3 }}
                  >
                    <p className="flex items-center gap-2 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-2" style={{ color: card.accent }}>
                      <card.icon size={15} strokeWidth={2.2} aria-hidden="true" />
                      {card.label}
                    </p>
                    <div className="flex flex-col gap-0.5 sm:gap-1">
                      {card.links.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          onTouchStart={() => prefetchRoute(link.path)}
                          onMouseEnter={() => prefetchRoute(link.path)}
                          className={`px-2 py-1.5 sm:py-2 rounded-lg text-sm sm:text-base font-bold transition-colors hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] ${
                            location.pathname === link.path ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-primary)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}

                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: cards.length * 0.06, ease: "easeOut" }}
                  className="mobile-atlas-card col-span-2 sm:hidden rounded-2xl border bg-[var(--color-surface-elevated)] shadow-lg p-2.5"
                >
                  <Link
                    to="/asistente"
                    onClick={() => setIsOpen(false)}
                    onTouchStart={() => prefetchRoute("/asistente")}
                    onMouseEnter={() => prefetchRoute("/asistente")}
                    className="flex min-w-0 items-center justify-center rounded-xl px-2 py-3 hover:bg-[var(--color-surface-highlight)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]"
                    aria-label={translate("Abrir Atlas Assistant", "Open Atlas Assistant")}
                  >
                    <span className="mobile-atlas-lockup" aria-hidden="true">
                      <AtlasMark variant="isotipo" className="mobile-atlas-lockup-mark" />
                      <AtlasMark variant="wordmark" className="mobile-atlas-lockup-wordmark" />
                    </span>
                  </Link>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: (cards.length + 1) * 0.06, ease: "easeOut" }}
                  className="col-span-2 sm:col-span-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg p-3 sm:p-4 flex flex-wrap items-center gap-x-5 gap-y-2"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <T en="Theme">Tema</T>
                    </span>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <T en="Text size">Tamaño de texto</T>
                    </span>
                    <TextSizeToggle />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <T en="Language">Idioma</T>
                    </span>
                    <div className="flex items-center gap-1 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-full p-1 relative">
                      {(["es", "en"] as const).map((lng) => (
                        <button
                          key={lng}
                          type="button"
                          onClick={() => setLanguage(lng)}
                          className={`relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                            language === lng ? "text-[var(--color-on-primary)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                          }`}
                        >
                          {language === lng && (
                            <motion.span
                              layoutId="cardnav-active-lang"
                              className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10"
                              transition={{ type: "spring", stiffness: 380, damping: 30 }}
                            />
                          )}
                          {lng.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <RippleButton
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/cotizar");
                    }}
                    className="mobile-menu-cta col-span-2 sm:hidden ml-auto relative overflow-hidden inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-sm whitespace-nowrap"
                  >
                    <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
                    <Rocket size={18} className="group-hover:rotate-12 group-hover:-translate-y-0.5 transition-transform duration-300" />
                    <T en="Plan your Project">Planifica tu Proyecto</T>
                    <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform duration-300" />
                  </RippleButton>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
