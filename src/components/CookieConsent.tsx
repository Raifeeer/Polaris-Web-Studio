import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Cookie } from "lucide-react";
import { T } from "../context/LanguageContext";
import { getCookieConsent, setCookieConsent, onCookieConsentChange } from "../lib/cookieConsent";

export default function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(getCookieConsent() === null);
    // Si se reabre desde "Configurar cookies" (política de Cookies), la
    // decisión guardada se borra y hay que volver a mostrar el banner sin
    // necesitar un refresh de página.
    return onCookieConsentChange((consent) => {
      if (consent === null) setVisible(true);
    });
  }, []);

  if (!visible) return null;

  const decide = (analytics: boolean) => {
    setCookieConsent(analytics);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.3, delay: 0.5 }}
        role="dialog"
        aria-live="polite"
        aria-label="Cookies"
        className="fixed bottom-4 left-4 right-4 md:left-6 md:right-auto md:max-w-md z-[150] glass-panel rounded-2xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)]/95 backdrop-blur-xl shadow-2xl p-5"
      >
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-base)]/10 flex items-center justify-center text-[var(--color-primary-base)]">
            <Cookie size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-[var(--color-text-primary)] mb-1">
              <T en="We use cookies">Usamos cookies</T>
            </p>
            <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
              <T en="We use essential cookies for the site to work, and optional analytics cookies to understand how you use it. You can change your choice anytime from our">
                Usamos cookies esenciales para que el sitio funcione, y cookies analíticas
                opcionales para entender cómo lo usa. Puede cambiar su elección cuando quiera
                desde nuestra
              </T>{" "}
              <Link
                to="/cookies"
                className="text-[var(--color-primary-base)] underline hover:no-underline"
              >
                <T en="Cookie Policy">Política de Cookies</T>
              </Link>
              .
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => decide(true)}
            className="flex-1 px-4 py-2.5 rounded-xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] text-xs font-bold uppercase tracking-wider hover:opacity-90 transition-opacity cursor-pointer"
          >
            <T en="Accept all">Aceptar todo</T>
          </button>
          <button
            onClick={() => decide(false)}
            className="flex-1 px-4 py-2.5 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider hover:bg-[var(--color-surface-highlight)] transition-colors cursor-pointer"
          >
            <T en="Essential only">Solo esenciales</T>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
