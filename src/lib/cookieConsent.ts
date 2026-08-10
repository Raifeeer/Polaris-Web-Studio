import { doc, setDoc, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";

// Consentimiento de cookies analíticas (GA4 + Microsoft Clarity). Las
// cookies/almacenamiento estrictamente necesarios (tema, idioma, sesión del
// portal, progreso del cotizador) no requieren opt-in bajo ningún marco
// legal relevante y siguen funcionando siempre -- esto solo controla los
// trackers de analítica de terceros, ver /cookies.
const STORAGE_KEY = "polaris_cookie_consent";
const CONSENT_ID_KEY = "polaris_cookie_consent_id";
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

/** ID estable por navegador (no identifica a la persona) usado como ID del
 * documento en Firestore, así la primera decisión crea el registro y las
 * decisiones posteriores del mismo navegador lo actualizan en vez de crear
 * uno nuevo. */
function getOrCreateConsentId(): string {
  let id = localStorage.getItem(CONSENT_ID_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(CONSENT_ID_KEY, id);
  }
  return id;
}

/** Trunca el último octeto (IPv4) o los últimos grupos (IPv6) antes de
 * guardar, para quedarnos con evidencia de la decisión sin retener la IP
 * completa del visitante. */
function truncateIp(ip: string): string {
  if (ip.includes(":")) {
    const groups = ip.split(":");
    return groups.slice(0, 4).join(":") + "::";
  }
  const parts = ip.split(".");
  if (parts.length === 4) {
    parts[3] = "0";
    return parts.join(".");
  }
  return "unknown";
}

/** Registra la decisión de consentimiento en Firestore como evidencia por si
 * hace falta demostrarla más adelante — decision, version, timestamp del
 * servidor e IP truncada. Escribe en dos lugares:
 * - `cookie_consents/{consentId}`: snapshot de la decisión ACTUAL (se
 *   sobreescribe en cada cambio), para consultar rápido el estado vigente.
 * - `cookie_consents/{consentId}/history`: un documento NUEVO por cada
 *   decisión, nunca se sobreescribe — así queda registro de que alguien
 *   cambió de opinión (por ejemplo, aceptó todo y después revocó), no solo
 *   cuál es su elección de hoy.
 * No bloquea la UI: si falla (red, IP no disponible), solo lo loguea. */
async function logConsentToFirestore(analytics: boolean) {
  try {
    let ip = "unknown";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (res.ok) {
        const data = (await res.json()) as { ip: string };
        ip = truncateIp(data.ip);
      }
    } catch {
      // Sin IP disponible, igual dejamos registro de la decisión.
    }

    const consentId = getOrCreateConsentId();
    const entry = {
      decision: analytics,
      version: CONSENT_VERSION,
      timestamp: serverTimestamp(),
      ip,
    };
    await setDoc(doc(db, "cookie_consents", consentId), entry, { merge: true });
    await addDoc(collection(db, "cookie_consents", consentId, "history"), entry);
  } catch (error) {
    console.error("No se pudo registrar el consentimiento en Firestore:", error);
  }
}

export function setCookieConsent(analytics: boolean) {
  const consent: CookieConsent = {
    analytics,
    version: CONSENT_VERSION,
    decidedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
  // App.tsx escucha este evento y activa/desactiva GA4 y Clarity en caliente
  // (ga-disable-* de Google, consent() de Clarity) -- no hace falta recargar
  // la página para que el cambio surta efecto.
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: consent }));
  void logConsentToFirestore(analytics);
}

export function onCookieConsentChange(handler: (consent: CookieConsent | null) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<CookieConsent | null>).detail ?? null);
  window.addEventListener(CONSENT_EVENT, listener);
  return () => window.removeEventListener(CONSENT_EVENT, listener);
}

const PANEL_OPEN_EVENT = "polaris-cookie-panel-open-changed";

/** El panel "Configurar mis cookies" (en /cookies) avisa acá cuando se abre
 * o se cierra. El banner global (CookieConsent.tsx) lo escucha para
 * ocultarse mientras el panel está abierto — si no, quedaban los dos
 * visibles a la vez y competían por la misma decisión (tocar un botón del
 * banner no actualizaba el toggle del panel, y viceversa). */
export function setCookieSettingsPanelOpen(open: boolean) {
  window.dispatchEvent(new CustomEvent(PANEL_OPEN_EVENT, { detail: open }));
}

export function onCookieSettingsPanelOpenChange(handler: (open: boolean) => void) {
  const listener = (e: Event) => handler(Boolean((e as CustomEvent<boolean>).detail));
  window.addEventListener(PANEL_OPEN_EVENT, listener);
  return () => window.removeEventListener(PANEL_OPEN_EVENT, listener);
}
