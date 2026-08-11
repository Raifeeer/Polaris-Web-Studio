import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import TextSizeToggle from "./TextSizeToggle";
import AtlasMark from "./AtlasMark";
import { useLanguage, T } from "../context/LanguageContext";
import { prefetchRoute } from "../lib/routePrefetch";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const { language, setLanguage, translate } = useLanguage();

  // Le avisa al widget flotante de Atlas Assistant (QuoteBot.tsx) que se
  // esconda mientras el menú hamburguesa mobile está abierto -- mismo patrón
  // de clase en <body> ya usado para el "story mode" del portafolio.
  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", isOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (navRef.current && !navRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
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

  // Lista completa, usada tal cual solo en el menú mobile (ahí el espacio
  // horizontal no es un problema, un dropdown solo agregaría un toque extra).
  const navLinks = [
    { name: <T en="Home">Inicio</T>, path: "/" },
    { name: <T en="About">Nosotros</T>, path: "/nosotros" },
    { name: <T en="Services">Servicios</T>, path: "/servicios" },
    { name: <T en="Process">Metodología</T>, path: "/proceso" },
    { name: <T en="Portfolio">Portafolio</T>, path: "/portafolio" },
    { name: <T en="Blog">Blog</T>, path: "/blog" },
    { name: <T en="Contact">Contacto</T>, path: "/contacto" },
    { name: <T en="Client Portal">Portal</T>, path: "/login" },
  ];

  // En desktop, "Nosotros"/"Metodología"/"Blog" (descubrimiento/confianza,
  // no de decisión inmediata) se agrupan bajo un dropdown "Compañía" -- deja
  // más aire para el logo y mantiene visibles como links directos los que sí
  // empujan conversión: Servicios, Portafolio, Contacto, Portal. Pedido
  // explícito del usuario tras notar el logo apretado sin el botón de tema
  // oscuro (ya retirado).
  const desktopDirectLinks = [
    { name: <T en="Home">Inicio</T>, path: "/" },
    { name: <T en="Services">Servicios</T>, path: "/servicios" },
    { name: <T en="Portfolio">Portafolio</T>, path: "/portafolio" },
    { name: <T en="Contact">Contacto</T>, path: "/contacto" },
    { name: <T en="Client Portal">Portal</T>, path: "/login" },
  ];
  const companyLinks = [
    { name: <T en="About">Nosotros</T>, path: "/nosotros" },
    { name: <T en="Process">Metodología</T>, path: "/proceso" },
    { name: <T en="Blog">Blog</T>, path: "/blog" },
  ];
  const isCompanyActive = companyLinks.some((l) => l.path === location.pathname);

  return (
    <>
      <div
        className="h-16 w-full shrink-0"
        aria-hidden="true"
      />
      <nav
        ref={navRef}
        className={`fixed left-0 right-0 top-0 w-full h-16 px-4 md:px-6 lg:px-8 xl:px-12 flex items-center justify-between z-50 transition duration-300 backdrop-blur-xl border-b overflow-visible ${
          scrolled || isOpen
            ? "bg-[var(--color-surface-base)]/98"
            : "bg-transparent"
        } ${
          isOpen
            ? "border-b-transparent"
            : scrolled
            ? "border-b-[var(--color-border-subtle)]"
            : "border-b-transparent"
        } ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      >
        <Link
          to="/"
          className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg"
          aria-label={translate("Polaris Web Studio - Inicio", "Polaris Web Studio - Home")}
        >
          <img
            src="/brand/lockup-horizontal-blanco.svg"
            alt="Polaris Web Studio"
            className="h-12 w-auto shrink-0 [.light_&]:hidden"
          />
          <img
            src="/brand/lockup-horizontal-color.svg"
            alt="Polaris Web Studio"
            className="h-12 w-auto shrink-0 hidden [.light_&]:block"
          />
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-10 xl:gap-14 text-xs lg:text-xs xl:text-sm font-bold text-[var(--color-text-secondary)] uppercase tracking-widest">
          <Link
            to="/"
            onMouseEnter={() => prefetchRoute("/")}
            onFocus={() => prefetchRoute("/")}
            className={`hover:text-[var(--color-primary-base)] transition-colors relative focus-visible:outline-none focus-visible:text-[var(--color-primary-base)] ${
              location.pathname === "/" ? "text-[var(--color-primary-base)]" : ""
            }`}
          >
            <T en="Home">Inicio</T>
            {location.pathname === "/" && (
              <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-primary-base)]" />
            )}
          </Link>

          <div className="relative" onMouseEnter={() => setCompanyOpen(true)} onMouseLeave={() => setCompanyOpen(false)}>
            <button
              className={`flex items-center gap-1 hover:text-[var(--color-primary-base)] transition-colors relative focus-visible:outline-none focus-visible:text-[var(--color-primary-base)] ${
                isCompanyActive ? "text-[var(--color-primary-base)]" : ""
              }`}
              onFocus={() => setCompanyOpen(true)}
              aria-expanded={companyOpen}
              aria-haspopup="true"
            >
              <T en="Company">Compañía</T>
              <ChevronDown size={14} className={`transition-transform ${companyOpen ? "rotate-180" : ""}`} />
              {isCompanyActive && (
                <motion.div layoutId="nav-underline" className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-primary-base)]" />
              )}
            </button>
            <AnimatePresence>
              {companyOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.15, ease: "easeOut" }}
                  className="absolute top-full left-1/2 -translate-x-1/2 mt-3 min-w-[180px] rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/98 backdrop-blur-xl shadow-lg p-1.5 origin-top"
                >
                  {companyLinks.map((link) => (
                    <Link
                      key={link.path}
                      to={link.path}
                      onMouseEnter={() => prefetchRoute(link.path)}
                      onClick={() => setCompanyOpen(false)}
                      className={`block px-3 py-2 rounded-lg normal-case tracking-normal text-sm hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] transition-colors ${
                        location.pathname === link.path ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-secondary)]"
                      }`}
                    >
                      {link.name}
                    </Link>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {desktopDirectLinks
            .filter((link) => link.path !== "/")
            .map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onMouseEnter={() => prefetchRoute(link.path)}
                onFocus={() => prefetchRoute(link.path)}
                className={`hover:text-[var(--color-primary-base)] transition-colors relative focus-visible:outline-none focus-visible:text-[var(--color-primary-base)] ${
                  location.pathname === link.path
                    ? "text-[var(--color-primary-base)]"
                    : ""
                }`}
              >
                {link.name}
                {location.pathname === link.path && (
                  <motion.div
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 bg-[var(--color-primary-base)]"
                  />
                )}
              </Link>
            ))}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden sm:block">
            <TextSizeToggle />
          </div>
          <Link
            to="/asistente"
            onMouseEnter={() => prefetchRoute("/asistente")}
            onFocus={() => prefetchRoute("/asistente")}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-surface-highlight)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]"
            aria-label={translate("Atlas Assistant", "Atlas Assistant")}
            title="Atlas Assistant"
          >
            <AtlasMark variant="isotipo" className="w-6 h-6" />
          </Link>
          <button
            onClick={() => navigate("/cotizar")}
            onMouseEnter={() => prefetchRoute("/cotizar")}
            className="hidden sm:block px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold text-xs sm:text-sm hover:scale-95 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[var(--color-primary-base)] focus-visible:ring-offset-[var(--color-surface-base)] whitespace-nowrap"
          >
            <T en="Plan your Project">Planifica tu Proyecto</T>
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden text-[var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg relative w-10 h-10 flex items-center justify-center overflow-hidden"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={isOpen}
          >
            <AnimatePresence mode="wait">
              {isOpen ? (
                <motion.div
                  key="close"
                  initial={{ rotate: -90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: 90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute"
                >
                  <X size={24} aria-hidden="true" />
                </motion.div>
              ) : (
                <motion.div
                  key="menu"
                  initial={{ rotate: 90, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  exit={{ rotate: -90, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="absolute"
                >
                  <Menu size={24} aria-hidden="true" />
                </motion.div>
              )}
            </AnimatePresence>
          </button>
        </div>

        {/* Mobile Nav Overlay */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 right-0 bg-[var(--color-surface-base)]/98 backdrop-blur-xl border-x border-b border-[var(--color-border-subtle)] p-6 flex flex-col gap-4 lg:hidden z-40"
            >
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setIsOpen(false)}
                  onTouchStart={() => prefetchRoute(link.path)}
                  className="text-lg font-bold uppercase tracking-widest hover:text-[var(--color-primary-base)] transition-colors"
                >
                  {link.name}
                </Link>
              ))}
              <Link
                to="/asistente"
                onClick={() => setIsOpen(false)}
                onTouchStart={() => prefetchRoute("/asistente")}
                className="flex items-center gap-2 text-lg font-bold uppercase tracking-widest hover:text-[var(--color-primary-base)] transition-colors"
              >
                <AtlasMark variant="isotipo" className="w-5 h-5" />
                Atlas Assistant
              </Link>
              <div className="flex items-center justify-between mt-4">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  <T en="Text size">Tamaño de texto</T>
                </span>
                <TextSizeToggle />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  <T en="Theme">Tema</T>
                </span>
                <ThemeToggle />
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                  <T en="Language">Idioma</T>
                </span>
                <div className="flex items-center gap-1 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-full p-1 relative">
                  <button
                    type="button"
                    onClick={() => setLanguage("es")}
                    className={`relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                      language === "es"
                        ? "text-[var(--color-on-primary)]"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {language === "es" && (
                      <motion.span
                        layoutId="activeLang"
                        className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    ES
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage("en")}
                    className={`relative z-10 px-3 py-1 text-xs font-bold rounded-full transition-colors ${
                      language === "en"
                        ? "text-[var(--color-on-primary)]"
                        : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                    }`}
                  >
                    {language === "en" && (
                      <motion.span
                        layoutId="activeLang"
                        className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10"
                        transition={{
                          type: "spring",
                          stiffness: 380,
                          damping: 30,
                        }}
                      />
                    )}
                    EN
                  </button>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate("/cotizar");
                }}
                className="w-full py-4 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold uppercase tracking-widest mt-4"
              >
                <T en="Plan your Project">Planifica tu Proyecto</T>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
