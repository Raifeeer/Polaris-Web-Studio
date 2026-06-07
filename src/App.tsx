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
import { useEffect, lazy, Suspense } from "react";
import ReactGA from "react-ga4";
import QuoteBot from "./components/QuoteBot";
import { useTheme } from "./hooks/useTheme";
import { LanguageProvider, T } from "./context/LanguageContext";

// Dynamic lazy imports for optimized code-splitting and small core bundle size
const LandingPage = lazy(() => import("./pages/LandingPage"));
const Services = lazy(() => import("./pages/Services"));
const Process = lazy(() => import("./pages/Process"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetail = lazy(() => import("./pages/ProjectDetail"));
const About = lazy(() => import("./pages/About"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const WizardQuote = lazy(() => import("./pages/WizardQuote"));
const Login = lazy(() => import("./pages/Login"));
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));

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
        ReactGA.send({ hitType: "pageview", page: pathname + hash });
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

  useEffect(() => {
    // 1. Defer Google Analytics Initialization
    const gaTimer = setTimeout(() => {
      if (GA_ID) {
        try {
          ReactGA.initialize(GA_ID);
        } catch (err) {
          console.warn("ReactGA initialization deferred:", err);
        }
      }
    }, 1500);

    // 2. Defer Microsoft Clarity Initialization
    const clarityTimer = setTimeout(() => {
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
          y.parentNode.insertBefore(t, y);
        })(window, document, "clarity", "script", "x23wgnxw13");
      } catch (err) {
        console.warn("Clarity lazy initialization failed:", err);
      }
    }, 2500);

    return () => {
      clearTimeout(gaTimer);
      clearTimeout(clarityTimer);
    };
  }, []);

  return (
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
              <Route path="/cotizar" element={<WizardQuote />} />
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
          <QuoteBot />
        </div>
      </Router>
    </LanguageProvider>
  );
}
