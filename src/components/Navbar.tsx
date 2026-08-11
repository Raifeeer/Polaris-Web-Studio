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
  const [hidden, setHidden] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const navRef = useRef<HTMLElement>(null);
  const { language, setLanguage, translate } = useLanguage();

  useEffect(() => {
    document.body.classList.toggle("mobile-menu-open", isOpen);
    return () => document.body.classList.remove("mobile-menu-open");
  }, [isOpen]);

  // Recopilador temporal de rendimiento (ver navPerfDebug.ts) -- no-op
  // salvo que ya esté activado con ?navdebug=1 en este navegador.
  useEffect(() => {
    window.dispatchEvent(new CustomEvent("navdebug:toggle", { detail: { isOpen } }));
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

  // Mismo comportamiento que tenía el navbar clásico (pedido explícito del
  // usuario al notar que se había perdido al portar el componente): se
  // esconde al bajar, reaparece apenas se sube -- nunca mientras el menú de
  // tarjetas está abierto (no tendría sentido esconder la barra con el menú
  // desplegado debajo).
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
      <div className="h-16 md:h-[4.5rem] w-full shrink-0" aria-hidden="true" />
      {/* Pedido explícito del usuario, tres rondas de ajuste: primero ancho
          completo real (edge-to-edge, como el navbar clásico) -- no era lo
          que quería. Después el mismo max-w-7xl/px que el <main> del Hero,
          pero puesto directo en el elemento con borde/fondo -- terminaba
          40px más ancho a cada lado que la tarjeta real del Hero, porque en
          LandingPage.tsx el padding (px-4 md:px-10) vive en el <main>
          EXTERIOR, mientras el borde/fondo visible de la tarjeta está en un
          div hijo, más adentro. Fix real: replicar esa misma estructura acá
          -- un wrapper exterior con max-w-7xl/mx-auto/px (invisible, solo
          define el ancho) y un div interior con el borde/fondo real, medido
          y confirmado con Playwright que coincide en x/width exactos con
          `#inicio` (la tarjeta real del Hero) en 1600px de ancho. */}
      <nav
        ref={navRef}
        className={`fixed left-0 right-0 top-0 z-50 w-full transition-transform duration-300 ${hidden ? "-translate-y-full" : "translate-y-0"}`}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-10 pt-3 md:pt-4">
          {/* Barra superior -- el borde/fondo real vive acá, adentro del
              wrapper de arriba (mismo patrón que la tarjeta del Hero). El
              menú de tarjetas se expande DEBAJO de este mismo wrapper.
              Alto/margen levemente mayores solo en desktop (pedido explícito
              del usuario) -- en mobile queda igual que antes, tanto por
              tamaño de pantalla como por costo real de repintado.
              `backdrop-blur-none` fijo en mobile (solo se habilita desde
              `md:`): reportado en vivo por el usuario que el navbar se
              trababa específicamente en Chrome mobile, no en otros
              navegadores -- combinar `position: fixed` + `backdrop-filter`
              en un elemento que además anima transform (esconder/mostrar al
              scrollear) es un caso conocido donde Chrome mobile cae a un
              modo de composición mucho más caro que Safari/WebKit para el
              mismo CSS. Sin blur en mobile el navbar queda con fondo sólido
              semi-opaco (sigue viéndose bien) pero sin ese costo. */}
          <div
            className={`flex items-center justify-between h-16 md:h-[4.5rem] px-4 rounded-2xl border transition-colors duration-300 backdrop-blur-none ${
              scrolled || isOpen
                ? "bg-[var(--color-surface-elevated)]/98 border-[var(--color-border-subtle)] shadow-lg md:backdrop-blur-xl"
                : "bg-[var(--color-surface-elevated)]/80 border-transparent md:backdrop-blur-md"
            }`}
          >
          <Link
            to="/"
            className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] rounded-lg"
            aria-label={translate("Polaris Web Studio - Inicio", "Polaris Web Studio - Home")}
          >
            <img src="/brand/lockup-horizontal-blanco.svg" alt="Polaris Web Studio" className="h-12 w-auto shrink-0 [.light_&]:hidden" />
            <img src="/brand/lockup-horizontal-color.svg" alt="Polaris Web Studio" className="h-12 w-auto shrink-0 hidden [.light_&]:block" />
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
        </div>

        {/* Panel de tarjetas -- se expande debajo de la barra, una tarjeta
            por categoría (grid en desktop, apiladas en mobile), cada una con
            su propio acento de color real de marca en el borde superior.
            Bug real de rendimiento encontrado y corregido (pedido explícito
            del usuario, "los hover se sienten lentos"): las tarjetas tenían
            su propio `backdrop-blur-xl` cada una, además del que ya lleva la
            barra de arriba -- hasta 5 capas de blur simultáneas con el panel
            abierto (barra + 4 tarjetas), contra 1 sola que tenía el navbar
            clásico. A opacidad /98 el blur casi no se nota visualmente (el
            fondo ya es casi sólido), pero el navegador lo sigue recalculando
            en cada repintado -- quitado de las tarjetas, sin cambio visual
            real, con una ganancia de rendimiento real. */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              // Bug real y causa directa del freeze reportado (11 de agosto):
              // esto animaba `height: 0 -> "auto"`. Para resolver el "auto",
              // framer-motion tiene que MEDIR la altura natural del panel, lo
              // que fuerza un reflow síncrono -- y durante la carga inicial
              // ese reflow obliga al navegador a completar de golpe todo el
              // layout pendiente de la página (imágenes, tarjetas, etc.),
              // bloqueando el hilo principal por segundos en un teléfono.
              // Encima, `height` NO se compone en GPU: cada cuadro de la
              // animación recalculaba el layout de las 4 tarjetas. Coincide
              // exacto con el síntoma real: abrir el navbar apenas entrás
              // congela todo, abrirlo con la página ya cargada anda perfecto
              // (60 fps confirmados en los datos). Reemplazado por
              // transform + opacity, que sí se componen en GPU y no piden
              // layout en ningún momento.
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Mismo max-w-7xl/mx-auto/px que la barra de arriba y que el
                  Hero de la landing -- el panel queda alineado con ambos.
                  Bug real corregido acá también (mobile, pantalla chica): con
                  las 3 tarjetas + la de ajustes apiladas, el panel entero
                  podía superar el alto de la pantalla -- como el <nav> es
                  `fixed`, eso obligaba a scrollear TODA la página en vez de
                  solo el menú. Fix: tope real de alto (lo que sobra de
                  viewport debajo de la barra) + scroll interno.
                  Segunda ronda (pedido explícito del usuario, "debería verse
                  completo sin scroll"): en mobile las tarjetas pasan de 1
                  columna (cada una a todo el ancho) a 2 columnas -- reduce a
                  la mitad el alto total apilado. Padding/gaps también más
                  ajustados en mobile (md: los agranda de vuelta). */}
              <div className="max-w-7xl mx-auto px-4 md:px-10 mt-1.5 md:mt-2 grid grid-cols-2 sm:grid-cols-3 gap-1.5 md:gap-2 max-h-[calc(100dvh-6.5rem)] md:max-h-[calc(100dvh-7.5rem)] overflow-y-auto overscroll-contain pb-2">
                {cards.map((card, i) => {
                  // Con grid de 2 columnas en mobile y 3 tarjetas de
                  // categoría, la 3ra (Contacto) siempre queda sola en su
                  // fila -- dejaba un hueco vacío al lado (reportado por el
                  // usuario con captura real). En vez de inventar una 4ta
                  // categoría (más trabajo, requeriría secciones nuevas), se
                  // expande esta tarjeta a las 2 columnas y sus links pasan
                  // de columna a fila para aprovechar el ancho extra, sin
                  // dejarlo vacío. Vuelve a una columna normal desde `sm:`
                  // (3 columnas, ahí ya no sobra espacio).
                  const isLastAlone = i === cards.length - 1;
                  return (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.06, ease: "easeOut" }}
                    className={`${isLastAlone ? "col-span-2 sm:col-span-1" : ""} rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg p-2.5 pt-2 md:p-4 md:pt-3`}
                    style={{ borderTopColor: card.accent, borderTopWidth: 3 }}
                  >
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest mb-1.5 md:mb-3" style={{ color: card.accent }}>
                      {card.label}
                    </p>
                    <div className={isLastAlone ? "flex flex-row flex-wrap gap-x-4 gap-y-0.5 sm:flex-col sm:gap-1" : "flex flex-col gap-0.5 md:gap-1"}>
                      {card.links.map((link) => (
                        <Link
                          key={link.path}
                          to={link.path}
                          onClick={() => setIsOpen(false)}
                          onTouchStart={() => prefetchRoute(link.path)}
                          onMouseEnter={() => prefetchRoute(link.path)}
                          className={`px-1.5 py-1.5 md:px-2 md:py-2 rounded-lg text-sm md:text-base font-bold transition-colors hover:bg-[var(--color-surface-highlight)] hover:text-[var(--color-primary-base)] ${
                            location.pathname === link.path ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-primary)]"
                          }`}
                        >
                          {link.label}
                        </Link>
                      ))}
                    </div>
                  </motion.div>
                  );
                })}

                {/* Cuarta tarjeta -- ajustes reales (tema/idioma/tamaño de
                    texto) que antes vivían al fondo del menú mobile en lista;
                    acá quedan agrupados en su propia tarjeta. El botón "Planifica
                    tu Proyecto" (el más importante, pedido explícito del
                    usuario) va primero en mobile para que quede visible sin
                    depender de scroll -- el resto de los ajustes (idioma,
                    tema, tamaño de texto) quedan debajo, en una fila que
                    envuelve si hace falta. */}
                <motion.div
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: cards.length * 0.06, ease: "easeOut" }}
                  className="col-span-2 sm:col-span-3 rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg p-2.5 md:p-4 flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 sm:gap-x-8 sm:gap-y-3"
                >
                  <button
                    onClick={() => {
                      setIsOpen(false);
                      navigate("/cotizar");
                    }}
                    className="sm:hidden order-first w-full px-5 py-2.5 rounded-lg bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-bold text-sm whitespace-nowrap"
                  >
                    <T en="Plan your Project">Planifica tu Proyecto</T>
                  </button>
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <T en="Theme">Tema</T>
                    </span>
                    <ThemeToggle />
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-3">
                    <span className="text-xs font-bold uppercase tracking-widest text-[var(--color-text-tertiary)]">
                      <T en="Text size">Tamaño de texto</T>
                    </span>
                    <TextSizeToggle />
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-3">
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
                          {/* Antes esto era un `motion.span` con `layoutId`
                              (píldora que se deslizaba entre ES y EN). Un
                              `layoutId` obliga a framer-motion a medir
                              posiciones reales cada vez que el elemento monta
                              -- y este panel monta/desmonta en cada apertura
                              del menú, sumando trabajo de layout justo en el
                              momento más sensible. El deslizamiento es un
                              detalle mínimo; se cambia por un fondo simple
                              con transición de color, sin costo de layout. */}
                          {language === lng && (
                            <span className="absolute inset-0 bg-[var(--color-primary-base)] rounded-full -z-10" />
                          )}
                          {lng.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
