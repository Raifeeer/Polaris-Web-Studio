/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
  useNavigationType,
} from "react-router-dom";
import { useEffect, useLayoutEffect, lazy, Suspense, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./hooks/useTheme";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ScrollProgressBar from "./components/ScrollProgressBar";
import Logo from "./components/Logo";
import { prefetchAllRoutesIdle } from "./lib/routePrefetch";
import EasterEgg from "./components/EasterEgg";
import CookieConsent from "./components/CookieConsent";
import { getCookieConsent, onCookieConsentChange } from "./lib/cookieConsent";

// Dynamic lazy imports for optimized code-splitting and small core bundle size
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Services = lazy(() => import("./pages/Services"));
const Process = lazy(() => import("./pages/Process"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const WizardQuote = lazy(() => import("./pages/WizardQuote"));
const Login = lazy(() => import("./pages/Login"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const Gracias = lazy(() => import("./pages/Gracias"));
const QuoteBot = lazy(() => import("./components/QuoteBot"));
const TerminalPage = lazy(() => import("./pages/TerminalPage"));

const GA_ID = import.meta.env.VITE_GA4_ID;

// Simple, beautiful high-fidelity micro-loader -- se muestra en cada
// transición de ruta (el Suspense que envuelve <AnimatedRoutes /> lo
// dispara mientras se descarga el chunk lazy de la página siguiente).
// Se renderiza en un portal a document.body porque su ancestro directo
// (el motion.div de la transición de página en AnimatedRoutes) anima con
// transform -- eso crea un nuevo "containing block" para position:fixed,
// así que sin el portal el loader queda posicionado relativo a ese
// ancestro en movimiento en vez del viewport real, y "salta" mientras la
// página entra/sale.
// "Destello": la estrella pasa la mayor parte del ciclo en reposo (escala y
// brillo normales) y cada tanto hace un pulso rápido, como una estrella real
// titilando -- a diferencia de un giro infinito, que nunca tiene un punto de
// reposo natural y siempre se corta a mitad de vuelta quede como quede la
// carga real de la página, esto casi siempre se corta viéndose "quieto".
const TWINKLE_TIMES = [0, 0.55, 0.65, 0.78, 1];
const TWINKLE_TRANSITION = {
  duration: 2.4,
  times: TWINKLE_TIMES,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

function RouteLoader() {
  return createPortal(
    <div className="fixed inset-0 bg-[var(--color-surface-base)] flex items-center justify-center z-50">
      <div className="relative flex items-center justify-center">
        {/* Brillo con radial-gradient en vez de filter:blur -- blur() combinado
            con una animación de scale a veces renderiza con un borde
            cuadrado visible (bug de compositing de Safari/WebKit en iOS,
            intermitente). El gradiente radial da el mismo efecto de
            resplandor difuso sin usar filter, así que no tiene ese problema. */}
        <motion.div
          className="absolute -inset-8 rounded-full"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary-base) 0%, transparent 70%)",
          }}
          animate={{ opacity: [0.15, 0.15, 0.55, 0.55, 0.15], scale: [1, 1, 1.35, 1.35, 1] }}
          transition={TWINKLE_TRANSITION}
        />
        <motion.div
          animate={{ scale: [1, 1, 1.15, 1.15, 1], rotate: [0, 0, 12, -8, 0] }}
          transition={TWINKLE_TRANSITION}
        >
          <Logo size={160} showText={false} />
        </motion.div>
      </div>
    </div>,
    document.body,
  );
}

function ScrollHandler() {
  const { pathname, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    window.history.scrollRestoration = "manual";
  }, []);

  useLayoutEffect(() => {
    // Si es navegación POP (back/forward), restaurar scroll previo
    if (navigationType === "POP") {
      const savedPosition = sessionStorage.getItem(`scroll-pos-${pathname}`);
      if (savedPosition) {
        const position = parseInt(savedPosition, 10);
        window.scrollTo(0, position);
      } else {
        window.scrollTo(0, 0);
      }
    } else {
      // Para PUSH/REPLACE, scroll a hash o al inicio
      if (!hash) {
        window.scrollTo(0, 0);
      } else {
        const id = hash.replace("#", "");
        const element = document.getElementById(id);
        if (element) {
          element.scrollIntoView({ behavior: "smooth" });
        }
      }
    }
  }, [pathname, hash, navigationType]);

  // Guardar scroll position cuando el usuario scrollea (solo posiciones > 0)
  // Esto evita sobrescribir con 0 cuando ScrollHandler hace scrollTo(0,0)
  useEffect(() => {
    const handleScroll = () => {
      const currentScroll = window.scrollY;
      // Solo guardar si hay scroll positivo (usuario scrolleó hacia abajo)
      // Esto previene overwrite cuando se resetea a 0 en navegación
      if (currentScroll > 0) {
        sessionStorage.setItem(`scroll-pos-${pathname}`, String(currentScroll));
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [pathname]);

  useEffect(() => {
    // Sin consentimiento de cookies analíticas, ni siquiera se pide el
    // módulo de GA4 -- ver /cookies y src/lib/cookieConsent.ts.
    if (GA_ID && getCookieConsent()?.analytics) {
      try {
        import("react-ga4").then((module) => {
          module.default.send({ hitType: "pageview", page: pathname + hash });
        });
      } catch (e) {
        console.warn("GA send deferred:", e);
      }
    }
  }, [pathname, hash]);

  return null;
}

function ConditionalQuoteBot({ showBot }: { showBot: boolean }) {
  const location = useLocation();
  if (!showBot || location.pathname === "/cotizar" || location.pathname === "/servicios") return null;
  return (
    <Suspense fallback={null}>
      <QuoteBot />
    </Suspense>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* Este motion.div solo se usa para la animación de SALIDA de la
          página anterior (exit) -- no tiene initial/animate porque, al
          envolver también el Suspense, su "entrada" se disparaba en cuanto
          cambiaba la ruta (mientras se mostraba el RouteLoader), no cuando
          la página real terminaba de cargar. El fade-in real de la página
          vive en el motion.div de más abajo, DENTRO del Suspense, así que
          React recién lo monta (y dispara su propio `initial`) cuando el
          contenido de verdad está listo para mostrarse -- antes la página
          aparecía de golpe porque la animación de entrada ya se había
          consumido entera sobre el loader. */}
      <motion.div
        key={location.pathname}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        <Suspense fallback={<RouteLoader />}>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          >
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/proceso" element={<Process />} />
            <Route path="/portafolio" element={<Portfolio />} />
            <Route path="/portafolio/:slug" element={<ProjectDetail />} />
            <Route path="/nosotros" element={<About />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPostDetail />} />
            <Route path="/cotizar" element={<WizardQuote />} />
            <Route path="/gracias" element={<Gracias />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
            <Route path="/terminal" element={<TerminalPage />} />
            <Route
              path="/privacidad"
              element={<LegalPage page="privacy" />}
            />
            <Route
              path="/terminos"
              element={<LegalPage page="terms" />}
            />
            <Route
              path="/cookies"
              element={<LegalPage page="cookies" />}
            />
          </Routes>
          </motion.div>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  );
}

function PolarisLoader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(onComplete, 300);
          return 100;
        }
        // Acelera al final
        const increment = p < 60 ? 3 : p < 85 ? 5 : 8;
        return Math.min(p + increment, 100);
      });
    }, 40);
    return () => clearInterval(timer);
  }, [onComplete]);

  useEffect(() => {
    const phases = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 800),
      setTimeout(() => setPhase(3), 1200),
    ];
    return () => phases.forEach(clearTimeout);
  }, []);

  const language = navigator.language.startsWith("es") ? "es" : "en";

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 0.98, filter: "blur(8px)" }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed inset-0 z-[99999] bg-[var(--color-surface-base)] flex flex-col items-center justify-center gap-6 select-none"
    >
      {/* Logo real -- misma imagen combinada (estrella + letras juntas) que
          el portal de clientes, en vez de la estrella y el texto como
          elementos separados. */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="text-center space-y-2"
      >
        <img
          src="/brand/lockup-vertical-blanco.svg"
          alt="Polaris Web Studio"
          className="h-72 w-auto mx-auto [.light_&]:hidden"
        />
        <img
          src="/brand/lockup-vertical-color.svg"
          alt="Polaris Web Studio"
          className="h-72 w-auto mx-auto hidden [.light_&]:block"
        />
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 0.4 : 0 }}
          className="text-[10px] font-mono tracking-widest text-[var(--color-text-tertiary)] uppercase"
        >
          v1.0
        </motion.p>
      </motion.div>

      {/* Progress bar */}
      <div className="w-48">
        <div className="h-[2px] w-full bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[var(--color-primary-base)] rounded-full"
            initial={{ width: "0%" }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: phase >= 2 ? 0.3 : 0 }}
            className="text-[9px] font-mono text-[var(--color-text-tertiary)]"
          >
            {phase === 2 && (language === "es" ? "Iniciando sistema..." : "Initializing...")}
            {phase === 3 && (language === "es" ? "Punta Cana, RD" : "Punta Cana, DR")}
          </motion.span>
          <span className="text-[9px] font-mono text-[var(--color-text-tertiary)] opacity-30">
            {progress}%
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default function App() {
  useTheme();
  const [showBot, setShowBot] = useState(false);
  const [showLoader, setShowLoader] = useState(() => {
    if (typeof window === "undefined") return false;
    return !sessionStorage.getItem("polaris_loaded");
  });

  const handleLoaderComplete = useCallback(() => {
    sessionStorage.setItem("polaris_loaded", "1");
    setShowLoader(false);
  }, []);

  useEffect(() => {
    // Calienta en segundo plano los chunks de las demás páginas, sin
    // competir con la carga/render inicial (solo corre en tiempo ocioso).
    prefetchAllRoutesIdle();

    // 1. Defer chatbot to save initial bundles & execution cycles
    const botTimer = setTimeout(() => {
      setShowBot(true);
    }, 4500);

    // 2. Initialize analytics trackers on first real interaction, or timing
    // fallback -- pero SOLO si hay consentimiento de cookies analíticas (ver
    // /cookies y src/lib/cookieConsent.ts). Sin consentimiento, no se pide
    // ni GA4 ni Clarity, así que no se ponen sus cookies.
    let analyticsLoaded = false;

    const loadAnalyticsScripts = () => {
      if (analyticsLoaded) return;
      analyticsLoaded = true;

      // Initialize Google Analytics (GA4)
      if (GA_ID) {
        try {
          import("react-ga4").then((module) => {
            module.default.initialize(GA_ID);
          }).catch((err) => {
            console.warn("ReactGA initialization deferred:", err);
          });
        } catch (err) {
          console.warn("ReactGA initialization deferred:", err);
        }
      }

      // Initialize Microsoft Clarity
      try {
        (function (c: any, l: any, a: any, r: any, i: any, t?: any, y?: any) {
          c[a] =
            c[a] ||
            function () {
              (c[a].q = c[a].q || []).push(arguments);
            };
          t = l.createElement(r);
          t.async = 1;
          t.src = "https://www.clarity.ms/tag/" + i;
          y = l.getElementsByTagName(r)[0];
          if (y && y.parentNode) {
            y.parentNode.insertBefore(t, y);
          }
        })(window, document, "clarity", "script", "x23wgnxw13");
      } catch (err) {
        console.warn("Clarity lazy initialization failed:", err);
      }
    };

    // Apaga GA4/Clarity en caliente cuando el usuario revoca su consentimiento
    // (banner o "Configurar mis cookies"), sin recargar la página. GA4 usa la
    // bandera de opt-out documentada por Google (`ga-disable-<ID>`, leída por
    // gtag.js en cada llamada); Clarity tiene su propia API de consentimiento
    // (`clarity('consent', false)`) pensada exactamente para esto -- ambas
    // detienen el envío de datos nuevos de inmediato. También se borran las
    // cookies que ya hubieran quedado puestas, no solo las futuras.
    const disableAnalyticsScripts = () => {
      if (GA_ID) {
        (window as any)[`ga-disable-${GA_ID}`] = true;
      }
      if ((window as any).clarity) {
        try {
          (window as any).clarity("consent", false);
        } catch {
          // Clarity no disponible todavía, nada que desactivar.
        }
      }
      const domain = window.location.hostname;
      ["_ga", `_ga_${GA_ID?.replace(/^G-/, "")}`, "_gid", "_gat", "_clck", "_clsk", "CLID", "ANONCHK", "MR", "MUID", "SM"]
        .forEach((name) => {
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
          document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=.${domain};`;
        });
    };

    const enableAnalyticsScripts = () => {
      if (GA_ID) {
        (window as any)[`ga-disable-${GA_ID}`] = false;
      }
      if ((window as any).clarity) {
        try {
          (window as any).clarity("consent", true);
        } catch {
          // Clarity no disponible todavía, loadAnalyticsScripts la inicializa.
        }
      }
      loadAnalyticsScripts();
    };

    let interacted = false;
    const initTrackers = () => {
      if (interacted) return;
      interacted = true;
      cleanupListeners();
      if (getCookieConsent()?.analytics) enableAnalyticsScripts();
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];

    const cleanupListeners = () => {
      events.forEach((event) => {
        window.removeEventListener(event, initTrackers);
      });
    };

    // Attach listeners for fast interaction-based tracking
    events.forEach((event) => {
      window.addEventListener(event, initTrackers, { passive: true, once: true });
    });

    // Fallback: load trackers after 6 seconds anyway if user remains idle
    const fallbackTimer = setTimeout(initTrackers, 6000);

    // Reacciona en caliente a cualquier cambio de preferencia, venga del
    // banner o del panel "Configurar mis cookies" en /cookies.
    const unsubscribeConsent = onCookieConsentChange((consent) => {
      if (consent?.analytics) {
        enableAnalyticsScripts();
      } else if (consent && !consent.analytics) {
        disableAnalyticsScripts();
      }
    });

    return () => {
      clearTimeout(botTimer);
      clearTimeout(fallbackTimer);
      cleanupListeners();
      unsubscribeConsent();
    };
  }, []);

  return (
    <>
      <AnimatePresence mode="wait">
        {showLoader && <PolarisLoader onComplete={handleLoaderComplete} />}
      </AnimatePresence>

      {!showLoader && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <AuthProvider>
            <LanguageProvider>
              <ToastProvider>
                <Router>
                  <ScrollHandler />
                  <ScrollProgressBar />
                  <div className="min-h-dvh bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
                    <AnimatedRoutes />
                    <ConditionalQuoteBot showBot={showBot} />
                    <CookieConsent />
                    <EasterEgg />
                  </div>
                </Router>
              </ToastProvider>
            </LanguageProvider>
          </AuthProvider>
        </motion.div>
      )}
    </>
  );
}
