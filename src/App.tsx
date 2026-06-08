/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  BrowserRouter as Router,
  Routes,
  Route,
  useLocation,
} from "react-router-dom";
import { useEffect, lazy, Suspense, useState } from "react";
import { useTheme } from "./hooks/useTheme";
import { LanguageProvider, T } from "./context/LanguageContext";
import { AuthProvider } from "./context/AuthContext";

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

    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const id = hash.replace("#", "");
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, [pathname, hash]);

  return null;
}

export default function App() {
  useTheme();
  const [showBot, setShowBot] = useState(false);

  useEffect(() => {
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
    <AuthProvider>
      <LanguageProvider>
        <Router>
        <ScrollHandler />
        <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
          <Suspense fallback={<RouteLoader />}>
            <Routes>
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
                    title={
                      <T en="Terms and Conditions">Términos y Condiciones</T>
                    }
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
          {showBot && (
            <Suspense fallback={null}>
              <QuoteBot />
            </Suspense>
          )}
        </div>
      </Router>
    </LanguageProvider>
    </AuthProvider>
  );
}
