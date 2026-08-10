import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ThemeToggle from "./ThemeToggle";
import TextSizeToggle from "./TextSizeToggle";
import AtlasMark from "./AtlasMark";
import { useLanguage, T } from "../context/LanguageContext";
import { prefetchRoute } from "../lib/routePrefetch";

// Reemplazo del navbar clásico (dropdown "Compañía" + menú mobile en lista)
// por un menú de tarjetas expandibles, inspirado en el CardNav real que
// compartió el usuario (reactbits.dev, con GSAP) -- reimplementado con
// framer-motion (ya es la librería de animación de todo el sitio, evita
// sumar una dependencia nueva solo para esto) y con los colores/rutas/i18n
// reales del sitio en vez de los datos de ejemplo. Rama experimental
// (`feature/cardnav-navbar`), pedido explícito del usuario para "verlo".
// La versión clásica queda respaldada fuera de src/ (no en git) por si el
// usuario prefiere volver atrás -- este archivo reemplaza a Navbar.tsx
// directamente, sin tocar los ~15 lugares que ya importan `Navbar` por
// nombre en toda la app.

type CardLink = { label: React.ReactNode; path: string; external?: boolean };
type NavCard = { label: React.ReactNode; accent: string; links: CardLink[] };

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const { language, setLanguage, translate } = useLanguage();

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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Cierra el menú al cambiar de ruta -- click en un link ya lo hace a mano,
  // pero esto cubre navegación por atrás/adelante del navegador también.
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  // Mismas 3 categorías que ya usaba el dropdown "Compañía" + el resto del
  // menú mobile, ahora como tarjetas -- cada una con un acento de color real
  // de la marca (tokens de index.css, no hex fijo, para que ambos temas se
  // vean bien) en vez de los colores de ejemplo del componente original.
  const cards: NavCard[] = [
    {
      label: <T en="Company">Compañía</T>,
      accent: "var(--color-accent-purple)",
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
      links: [
        { label: <T en="Services">Servicios</T>, path: "/servicios" },
        { label: <T en="Portfolio">Portafolio</T>, path: "/portafolio" },
      ],
    },
    {
      label: <T en="Get in touch">Contacto</T>,
      accent: "var(--color-primary-base)",
      links: [
        { label: <T en="Contact">Contacto</T>, path: "/contacto" },
        { label: <T en="Client Portal">Portal de Cliente</T>, path: "/login" },
        { label: "Atlas Assistant", path: "/asistente" },
      ],
    },
  ];

  return (
    <>
      <div className="h-16 w-full shrink-0" aria-hidden="true" />
      <nav
        ref={navRef}
        className={`fixed left-0 right-0 top-0 z-50 mx-auto max-w-6xl px-3 pt-3 transition-transform duration-300`}
      >
        {/* Barra superior -- siempre una sola "tarjeta" real (logo + botón +
            CTA), el menú de tarjetas se expande DEBAJO de esta, no dentro. */}
        <div
          className={`flex items-center justify-between h-14 px-4 rounded-2xl border transition-colors duration-300 ${
            scrolled || isOpen
              ? "bg-[var(--color-surface-elevated)]/98 border-[var(--color-border-subtle)] shadow-lg backdrop-blur-xl"
              : "bg-[var(--color-surface-elevated)]/80 border-transparent backdrop-blur-md"
          }`}
        >
          <Link
            to="/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg"
            aria-label={translate("Polaris Web Studio - Inicio", "Polaris Web Studio - Home")}
          >
            <img src="/brand/lockup-horizontal-blanco.svg" alt="Polaris Web Studio" className="h-9 w-auto shrink-0 [.light_&]:hidden" />
            <img src="/brand/lockup-horizontal-color.svg" alt="Polaris Web Studio" className="h-9 w-auto shrink-0 hidden [.light_&]:block" />
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
            <button
              onClick={() => navigate("/cotizar")}
              onMouseEnter={() => prefetchRoute("/cotizar")}
              className="hidden sm:block px-5 py-2 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold text-sm hover:scale-95 transition-transform whitespace-nowrap"
            >
              <T en="Plan your Project">Planifica tu Proyecto</T>
            </button>
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

        {/* Panel de tarjetas -- se expande debajo de la barra, una tarjeta
            por categoría (grid en desktop, apiladas en mobile), cada una con
            su propio acento de color real de marca en el borde superior. */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              className="overflow-hidden"
            >
              {/* Bug real reportado en vivo (mobile, pantalla chica): con
                  las 3 tarjetas + la de ajustes apiladas, el panel entero
                  podía superar el alto de la pantalla -- como el <nav> es
                  `fixed`, eso obligaba a scrollear TODA la página (arrastrando
                  la barra fija con el contenido de atrás) en vez de solo el
                  menú, y el final quedaba tapado/inalcanzable sin ese scroll
                  raro. Fix: el propio panel de tarjetas tiene su tope real de
                  alto (lo que sobra de viewport debajo de la barra superior)
                  y scroll interno -- el menú queda 100% navegable sin
                  necesidad de tocar el scroll de la página de atrás. */}
              <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2 max-h-[calc(100dvh-6rem)] overflow-y-auto overscroll-contain pb-2">
                {cards.map((card, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                    className="rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/98 backdrop-blur-xl shadow-lg p-4 pt-3"
                    style={{ borderTopColor: card.accent, borderTopWidth: 3 }}
                  >
                    <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: card.accent }}>
                      {card.label}
                    </p>
                    <div className="flex flex-col gap-1">
                      {card.links.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          onTouchStart={() => prefetchRoute(link.path)}
                          onMouseEnter={() => prefetchRoute(link.path)}
                          className={`px-2 py-2 rounded-lg text-base font-bold transition-colors hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] ${
                            location.pathname === link.path ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-primary)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                ))}

                {/* Cuarta tarjeta -- ajustes reales (tema/idioma/tamaño de
                    texto) que antes vivían al fondo del menú mobile en lista;
                    acá quedan agrupados en su propia tarjeta. */}
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: cards.length * 0.06, ease: "easeOut" }}
                  className="sm:col-span-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/98 backdrop-blur-xl shadow-lg p-4 flex flex-wrap items-center gap-x-8 gap-y-3"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <T en="Theme">Tema</T>
                    </span>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <T en="Text size">Tamaño de texto</T>
                    </span>
                    <TextSizeToggle />
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
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
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/cotizar");
                    }}
                    className="sm:hidden ml-auto px-5 py-2.5 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold text-sm whitespace-nowrap"
                  >
                    <T en="Plan your Project">Planifica tu Proyecto</T>
                  </button>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
