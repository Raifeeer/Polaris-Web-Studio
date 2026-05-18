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
import WhatsAppButton from './components/WhatsAppButton';
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

export default function App() {
  useTheme();
  
  return (
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
          <Route path="/privacidad" element={<LegalPage title="Política de Privacidad" />} />
          <Route path="/terminos" element={<LegalPage title="Términos y Condiciones" />} />
          <Route path="/cookies" element={<LegalPage title="Política de Cookies" />} />
        </Routes>
        <WhatsAppButton />
        <QuoteBot />
      </div>
    </Router>
  );
}
