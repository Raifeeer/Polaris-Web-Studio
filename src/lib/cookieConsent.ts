// Consentimiento de cookies analíticas (GA4 + Microsoft Clarity). Las
// cookies/almacenamiento estrictamente necesarios (tema, idioma, sesión del
// portal, progreso del cotizador) no requieren opt-in bajo ningún marco
// legal relevante y siguen funcionando siempre -- esto solo controla los
// trackers de analítica de terceros, ver /cookies.
const STORAGE_KEY = "polaris_cookie_consent";
const CONSENT_EVENT = "polaris-cookie-consent-changed";
// Subir este número si el conjunto de trackers cambia de forma sustancial y
// hace falta volver a pedir consentimiento aunque el usuario ya hubiera
// decidido antes.
const CONSENT_VERSION = 1;

export interface CookieConsent {
  analytics: boolean;
  version: number;
  decidedAt: string;
}

export function getCookieConsent(): CookieConsent | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CookieConsent;
    if (parsed.version !== CONSENT_VERSION) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function setCookieConsent(analytics: boolean) {
  const consent: CookieConsent = {
    analytics,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
}

/** Borra la decisión guardada -- usado por "Configurar cookies" para volver a mostrar el banner. */
export function resetCookieConsent() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: null }));
}

export function onCookieConsentChange(handler: (consent: CookieConsent | null) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<CookieConsent | null>).detail ?? null);
  window.addEventListener(CONSENT_EVENT, listener);
  return () => window.removeEventListener(CONSENT_EVENT, listener);
}
