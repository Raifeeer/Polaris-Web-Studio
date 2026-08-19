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
import { useTheme } from "./hooks/useTheme";
import { LanguageProvider } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./context/ToastContext";
import ScrollProgressBar from "./components/ScrollProgressBar";
import Logo from "./components/Logo";
import { initNavPerfDebug } from "./lib/navPerfDebug";
import CookieConsent from "./components/CookieConsent";
import { getCookieConsent, onCookieConsentChange } from "./lib/cookieConsent";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

// Dynamic lazy imports for optimized code-splitting and small core bundle size
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Services = lazy(() => import("./pages/Services"));
const Process = lazy(() => import("./pages/Process"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const About = lazy(() => import("./pages/About"));
const Contacto = lazy(() => import("./pages/Contacto"));
const LocalLift = lazy(() => import("./pages/LocalLift"));
const PolarisFlow = lazy(() => import("./pages/PolarisFlow"));
const LocalLiftPanel = lazy(() => import("./pages/LocalLiftPanel"));
const LocalLiftPay = lazy(() => import("./pages/LocalLiftPay"));
const LocalLiftConnect = lazy(() => import("./pages/LocalLiftConnect"));
const LocalLiftPolicies = lazy(() => import("./pages/LocalLiftPolicies"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPostDetail = lazy(() => import("./pages/BlogPostDetail"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const WizardQuote = lazy(() => import("./pages/WizardQuote"));
const Login = lazy(() => import("./pages/Login"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const Gracias = lazy(() => import("./pages/Gracias"));
const Schedule = lazy(() => import("./pages/Schedule"));
const AtlasChat = lazy(() => import("./pages/AtlasChat"));
const QuoteBot = lazy(() => import("./components/QuoteBot"));
const DeferredEasterEgg = lazy(() => import("./components/EasterEgg"));

const GA_ID = import.meta.env.VITE_GA4_ID;

// Micro-loader de ruta: el shell global usa transiciones CSS ligeras para no
// precargar ni ejecutar Framer Motion antes de que la página real lo necesite.

function RouteLoader() {
  return createPortal(
    <div className="route-loader fixed inset-0 bg-[var(--color-surface-base)] flex items-center justify-center z-50">
      <div className="route-loader-mark relative flex items-center justify-center">
        {/* Brillo con radial-gradient en vez de filter:blur -- blur() combinado
            con una animación de scale a veces renderiza con un borde
            cuadrado visible (bug de compositing de Safari/WebKit en iOS,
            intermitente). El gradiente radial da el mismo efecto de
            resplandor difuso sin usar filter, así que no tiene ese problema. */}
        <div
          className="route-loader-glow absolute -inset-8 rounded-full"
          style={{
            background:
              "radial-gradient(circle, var(--color-primary-base) 0%, transparent 70%)",
          }}
        />
        <div className="route-loader-logo">
          <Logo size={160} showText={false} />
        </div>
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
  if (!showBot || location.pathname === "/cotizar" || location.pathname === "/servicios" || location.pathname === "/asistente") return null;
  return (
    <Suspense fallback={null}>
      <QuoteBot />
    </Suspense>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
      <div
        key={location.pathname}
        className="route-transition-shell"
      >
        <RouteErrorBoundary>
        <Suspense fallback={<RouteLoader />}>
          <div key={`${location.pathname}${location.search}${location.hash}`} className="route-page-content">
          <Routes location={location}>
            <Route path="/" element={<LandingPage />} />
            <Route path="/servicios" element={<Services />} />
            <Route path="/proceso" element={<Process />} />
            <Route path="/portafolio" element={<Portfolio />} />
            <Route path="/portafolio/:slug" element={<ProjectDetail />} />
            <Route path="/nosotros" element={<About />} />
            <Route path="/contacto" element={<Contacto />} />
            <Route path="/local-lift" element={<LocalLift />} />
            <Route path="/flow" element={<PolarisFlow />} />
            <Route path="/local-lift/panel" element={<LocalLiftPanel />} />
            <Route path="/local-lift/pagar/:leadId" element={<LocalLiftPay />} />
            <Route path="/local-lift/conectar/:leadId" element={<LocalLiftConnect />} />
            <Route path="/local-lift/politicas" element={<LocalLiftPolicies />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<BlogPostDetail />} />
            <Route path="/cotizar" element={<WizardQuote />} />
            <Route path="/gracias" element={<Gracias />} />
            <Route path="/agendar" element={<Schedule />} />
            <Route path="/asistente" element={<AtlasChat />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<ClientDashboard />} />
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
          </div>
        </Suspense>
        </RouteErrorBoundary>
      </div>
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
    <div className="app-loader fixed inset-0 z-[99999] bg-[var(--color-surface-base)] flex flex-col items-center justify-center gap-6 select-none">
      {/* Logo real -- misma imagen combinada (estrella + letras juntas) que
          el portal de clientes, en vez de la estrella y el texto como
          elementos separados. */}
      <div className="app-loader-logo text-center space-y-2">
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
        <p
          style={{ opacity: phase >= 1 ? 0.4 : 0 }}
          className="text-[10px] font-mono tracking-widest text-[var(--color-text-tertiary)] uppercase transition-opacity duration-300"
        >
          v1.0
        </p>
      </div>

      {/* Progress bar */}
      <div className="w-48">
        <div className="h-[2px] w-full bg-[var(--color-border-subtle)] rounded-full overflow-hidden">
          <div
            className="h-full bg-[var(--color-primary-base)] rounded-full transition-[width] duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between mt-2">
          <span
            style={{ opacity: phase >= 2 ? 0.3 : 0 }}
            className="text-[9px] font-mono text-[var(--color-text-tertiary)] transition-opacity duration-300"
          >
            {phase === 2 && (language === "es" ? "Iniciando sistema..." : "Initializing...")}
            {phase === 3 && (language === "es" ? "Punta Cana, RD" : "Punta Cana, DR")}
          </span>
          <span className="text-[9px] font-mono text-[var(--color-text-tertiary)] opacity-30">
            {progress}%
          </span>
        </div>
      </div>
    </div>
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
    // Recopilador temporal de rendimiento del navbar -- no-op salvo que la
    // URL tenga ?navdebug=1 o ya se haya activado antes en este navegador.
    initNavPerfDebug();

    // Bug real de rendimiento encontrado y corregido en vivo (11 de agosto,
    // con datos reales de un usuario en Chrome/iPhone -- CriOS/WebKit):
    // esto precargaba las 9 páginas del sitio en segundo plano apenas
    // cargaba cualquier página, sin que el visitante hubiera mostrado
    // ningún interés real en ellas. Aun respetando el deadline real de
    // requestIdleCallback (fix anterior, ver routePrefetch.ts), cada
    // import() individual seguía tardando varios segundos reales en
    // resolver en este tipo de dispositivo/conexión -- y ese tiempo,
    // aunque debería ser asíncrono, bloqueaba el hilo principal por
    // completo mientras tanto. Confirmado con correlación casi exacta y
    // repetida (recopilador de rendimiento temporal, ver navPerfDebug.ts):
    // cada vez que arrancaba un prefetch, la página se congelaba casi
    // exactamente ese mismo tiempo. Quitado el barrido automático de las 9
    // rutas -- el prefetch real y liviano (hover/touch sobre un link
    // puntual, en Navbar.tsx, vía prefetchRoute()) sigue intacto, es
    // intencional y de bajo riesgo porque solo calienta UN chunk cuando el
    // visitante ya mostró interés real en esa página.
    //
    // Mismo criterio, y por la misma causa medida, para los mockups del
    // portafolio (`prefetchPortfolioMediaIdle`): descargaba en segundo
    // plano ~20 MB reales de video mp4 (los mockups de scroll de Lúmina,
    // Nexus, Chroma y Vitality: 6.03 MB solo el de Nexus mobile) en CADA
    // carga de CUALQUIER página, para un /portafolio que la mayoría de los
    // visitantes nunca abre. Su único guard contra hacerlo en conexiones
    // pobres era `navigator.connection`, que NO EXISTE en Safari/WebKit
    // (Apple nunca implementó la Network Information API) -- así que en
    // iPhone, justo donde más duele, no se saltaba nunca. Medido en vivo
    // con el recopilador: ~38 s de bloqueos encadenados del hilo principal
    // (3-4 frames por muestra) desde el arranque, y 60 fps limpios
    // (361 frames, 0-1 perdidos) apenas terminaba esa descarga. Ese era el
    // "se congela si abro el navbar apenas entro, pero anda bien si espero
    // a que cargue" que reportó el usuario -- el navbar solo quedaba
    // atrapado en un hilo principal ya saturado. La media del portafolio
    // ahora se carga cuando el visitante realmente llega a esa página.

    // 1. Defer chatbot to save initial bundles & execution cycles
    const botTimer = setTimeout(() => {
      setShowBot(true);
    }, 8000);

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

    // Fallback: load trackers only after a longer idle window. La interacción
    // real sigue activándolos inmediatamente cuando existe consentimiento.
    const fallbackTimer = setTimeout(initTrackers, 15000);

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
      {showLoader && <PolarisLoader onComplete={handleLoaderComplete} />}

      {!showLoader && (
        <div className="app-route-shell">
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
                      {showBot && (
                        <Suspense fallback={null}>
                          <DeferredEasterEgg />
                        </Suspense>
                      )}
                    </div>
                  </Router>
                </ToastProvider>
              </LanguageProvider>
            </AuthProvider>
        </div>
      )}
    </>
  );
}
