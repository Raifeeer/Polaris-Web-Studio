/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import ReactGA from 'react-ga4';
import LandingPage from './pages/LandingPage';
import Services from './pages/Services';
import Process from './pages/Process';
import Portfolio from './pages/Portfolio';
import ProjectDetail from './pages/ProjectDetail';
import About from './pages/About';
import LegalPage from './pages/LegalPage';
import WizardQuote from './pages/WizardQuote';
import Login from './pages/Login';
import ClientDashboard from './pages/ClientDashboard';
import QuoteBot from './components/QuoteBot';
import { useTheme } from './hooks/useTheme';

const GA_ID = import.meta.env.VITE_GA4_ID;
if (GA_ID) {
  ReactGA.initialize(GA_ID);
}

function ScrollHandler() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (GA_ID) {
      ReactGA.send({ hitType: "pageview", page: pathname + hash });
    }
    
    if (!hash) {
      window.scrollTo(0, 0);
    } else {
      const id = hash.replace('#', '');
      const element = document.getElementById(id);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [pathname, hash]);

  return null;
}

import { LanguageProvider, T } from './context/LanguageContext';

export default function App() {
  useTheme();
  
  return (
    <LanguageProvider>
      <Router>
        <ScrollHandler />
        <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
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
            <Route path="/privacidad" element={<LegalPage title={<T en="Privacy Policy">Política de Privacidad</T>} />} />
            <Route path="/terminos" element={<LegalPage title={<T en="Terms and Conditions">Términos y Condiciones</T>} />} />
            <Route path="/cookies" element={<LegalPage title={<T en="Cookie Policy">Política de Cookies</T>} />} />
          </Routes>
          <QuoteBot />
        </div>
      </Router>
    </LanguageProvider>
  );
}
