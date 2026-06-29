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
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "./hooks/useTheme";
import { LanguageProvider, T } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ScrollProgressBar from "./components/ScrollProgressBar";
import { prefetchAllRoutesIdle } from "./lib/routePrefetch";
import EasterEgg from "./components/EasterEgg";

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
import TerminalPage from "./pages/TerminalPage";

const GA_ID = import.meta.env.VITE_GA4_ID;

// Simple, beautiful high-fidelity micro-loader
function RouteLoader() {
  return (
    <div className="fixed inset-0 bg-[var(--color-surface-base)] flex items-center justify-center z-50">
      <div className="relative w-12 h-12 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full border-2 border-[var(--color-primary-base)]/20 animate-ping duration-1000" />
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-primary-base)] border-t-transparent animate-spin" />
      </div>
    </div>
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
    if (GA_ID) {
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
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: "easeInOut" }}
      >
        <Suspense fallback={<RouteLoader />}>
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
              element={
                <LegalPage
                  title={<T en="Privacy Policy">Política de Privacidad</T>}
                />
              }
            />
            <Route
              path="/terminos"
              element={
                <LegalPage
                  title={<T en="Terms and Conditions">Términos y Condiciones</T>}
                />
              }
            />
            <Route
              path="/cookies"
              element={
                <LegalPage
                  title={<T en="Cookie Policy">Política de Cookies</T>}
                />
              }
            />
          </Routes>
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
      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <svg
          width="48"
          height="48"
          viewBox="0 0 200 200"
          fill="none"
          className="opacity-80"
        >
          <defs>
            <linearGradient id="loader-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#6366f1" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
          </defs>
          <path
            d="M100 10 L108 85 L130 60 L115 92 L190 100 L115 108 L130 140 L108 115 L100 190 L92 115 L70 140 L85 108 L10 100 L85 92 L70 60 L92 85 Z"
            fill="url(#loader-grad)"
          />
          <circle cx="100" cy="100" r="8" fill="white" opacity="0.9" />
        </svg>
      </motion.div>

      {/* Brand */}
      <div className="text-center space-y-1">
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 0 ? 1 : 0 }}
          className="text-sm font-black tracking-[0.3em] uppercase text-[var(--color-text-primary)]"
        >
          Polaris
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: phase >= 1 ? 0.4 : 0 }}
          className="text-[10px] font-mono tracking-widest text-[var(--color-text-tertiary)] uppercase"
        >
          Web Studio · v1.0
        </motion.p>
      </div>

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

    // 2. Initialize trackers on first real interaction, or timing fallback
    let initialized = false;

    const initTrackers = () => {
      if (initialized) return;
      initialized = true;

      // Clean up event listeners
      cleanupListeners();

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

    return () => {
      clearTimeout(botTimer);
      clearTimeout(fallbackTimer);
      cleanupListeners();
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
