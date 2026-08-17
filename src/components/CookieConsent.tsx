import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { T } from "../context/LanguageContext";
import {
  getCookieConsent,
  setCookieConsent,
  onCookieConsentChange,
  onCookieSettingsPanelOpenChange,
} from "../lib/cookieConsent";

function CookieIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px]">
      <path d="M12 3a9 9 0 1 0 9 9c0-.6-.06-1.19-.17-1.75A4.5 4.5 0 0 1 13.75 3.17 9.03 9.03 0 0 0 12 3Z" />
      <path d="M8.5 8.5h.01M12 13h.01M8 15.5h.01M15.5 8h.01" />
    </svg>
  );
}

export default function CookieConsent() {
  const [undecided, setUndecided] = useState(false);
  const [panelOpen, setPanelOpen] = useState(false);

  useEffect(() => {
    setUndecided(getCookieConsent() === null);
    const unsubscribeConsent = onCookieConsentChange((consent) => setUndecided(consent === null));
    const unsubscribePanel = onCookieSettingsPanelOpenChange(setPanelOpen);
    return () => {
      unsubscribeConsent();
      unsubscribePanel();
    };
  }, []);

  if (!undecided || panelOpen) return null;

  const decide = (analytics: boolean) => {
    setCookieConsent(analytics);
    setUndecided(false);
  };

  return (
    <div
      role="dialog"
      aria-live="polite"
      aria-label="Cookies"
      className="cookie-banner fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[150] glass-panel rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/95 backdrop-blur-xl shadow-2xl p-5"
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-base)]/10 flex items-center justify-center text-[var(--color-primary-base)]">
          <CookieIcon />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1"><T en="We use cookies">Usamos cookies</T></p>
          <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
            <T en="We use essential cookies for the site to work, and optional analytics cookies to understand how you use it. You can change your choice anytime from our">
              Usamos cookies esenciales para que el sitio funcione, y cookies analíticas opcionales para entender cómo lo usas. Puedes cambiar tu elección cuando quieras desde nuestra
            </T>{" "}
            <Link to="/cookies" className="text-[var(--color-primary-base)] underline hover:no-underline"><T en="Cookie Policy">Política de Cookies</T></Link>.
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-col sm:flex-row gap-2">
        <button onClick={() => decide(true)} className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer">
          <T en="Accept all">Aceptar todo</T>
        </button>
        <button onClick={() => decide(false)} className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--color-surface-highlight)] transition-colors cursor-pointer">
          <T en="Essential only">Solo esenciales</T>
        </button>
      </div>
    </div>
  );
}
