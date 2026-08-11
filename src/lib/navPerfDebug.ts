// Recopilador temporal de rendimiento del navbar (CardNav) -- pedido
// explícito del usuario (10 de agosto), que reportó que en Chrome mobile
// real se sigue sintiendo lento/se traba, sin acceso a su PC para abrir
// las DevTools. Envía beacons a la Cloud Function `nav-perf-log`
// (Meridian, pública, sin datos sensibles) para poder diagnosticar el
// problema real leyendo Cloud Logging después.
//
// Solo se activa con `?navdebug=1` en la URL (una vez, persiste en
// localStorage para sobrevivir la navegación de la SPA) -- nunca corre
// para un visitante normal. Es temporal: se puede borrar este archivo y
// su import una vez diagnosticado el problema real.
const ENDPOINT = "https://nav-perf-log-wdvfac6mgq-ue.a.run.app";
const FLAG_KEY = "navPerfDebug";

function send(payload: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ sessionId, ...payload });
    // Bug real encontrado (10 de agosto): un Blob con type "application/json"
    // hace que sendBeacon dispare un preflight CORS (OPTIONS) que nunca
    // termina en el POST real -- confirmado en Cloud Logging, solo
    // llegaban OPTIONS, nunca datos. "text/plain" es un content-type
    // "simple" (no dispara preflight), y el servidor igual lo parsea a
    // mano si hace falta.
    if (navigator.sendBeacon) {
      navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "text/plain" }));
    } else {
      fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "text/plain" }, keepalive: true }).catch(() => {});
    }
  } catch {
    // silencioso -- esto es un diagnóstico, nunca debe afectar la app real
  }
}

let sessionId = "";
let started = false;

export function initNavPerfDebug() {
  if (started || typeof window === "undefined") return;

  const params = new URLSearchParams(window.location.search);
  if (params.get("navdebug") === "1") {
    localStorage.setItem(FLAG_KEY, "1");
  }
  if (localStorage.getItem(FLAG_KEY) !== "1") return;

  started = true;
  sessionId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const nav = navigator as Navigator & {
    deviceMemory?: number;
    connection?: { effectiveType?: string; downlink?: number; rtt?: number };
  };

  send({
    type: "session-start",
    userAgent: navigator.userAgent,
    deviceMemory: nav.deviceMemory,
    hardwareConcurrency: navigator.hardwareConcurrency,
    connection: nav.connection
      ? { effectiveType: nav.connection.effectiveType, downlink: nav.connection.downlink, rtt: nav.connection.rtt }
      : null,
    screen: { width: window.screen.width, height: window.screen.height, dpr: window.devicePixelRatio },
    url: window.location.href,
  });

  // Long tasks: cualquier trabajo del hilo principal que bloquee por más de
  // 50ms -- exactamente lo que se siente como "se traba"/"se congela".
  // OJO: la Long Tasks API es exclusiva de motores basados en Chromium
  // (Blink) -- Safari/WebKit nunca la implementó, y como Chrome en iOS
  // (CriOS) usa WebKit por obligación de Apple (nunca Blink), esto NO
  // captura nada ahí. Confirmado en vivo el 10 de agosto: cero eventos
  // "longtask" pese a un freeze real medido por otro lado (ver abajo).
  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        send({
          type: "longtask",
          duration: Math.round(entry.duration),
          startTime: Math.round(entry.startTime),
          name: entry.name,
        });
      }
    });
    observer.observe({ type: "longtask", buffered: true });
  } catch {
    // longtask no soportado en este navegador -- no hay nada más que hacer
  }

  // Detector de bloqueo real del hilo principal, funciona en cualquier
  // motor (no depende de la Long Tasks API): agenda un setTimeout(0) en
  // loop y mide cuánto tarda de más en dispararse -- si el hilo principal
  // está trabado con otra cosa, este timer se atrasa exactamente esa
  // cantidad de tiempo. Es la señal que sí confirmó el freeze real en
  // WebKit cuando "longtask" no reportó nada.
  (function watchMainThreadBlock() {
    let last = performance.now();
    const tick = () => {
      const now = performance.now();
      const drift = now - last - 0; // delay esperado del setTimeout(0) es ~0-4ms
      if (drift > 100) {
        send({ type: "main-thread-block", blockedMs: Math.round(drift) });
      }
      last = now;
      setTimeout(tick, 0);
    };
    setTimeout(tick, 0);
  })();

  // Correlación real: qué chunk de ruta se está precargando en segundo
  // plano (prefetchAllRoutesIdle, App.tsx) justo cuando ocurre un freeze --
  // parsear/evaluar un chunk grande (WizardQuote ~147kb, ClientDashboard
  // ~223kb) es trabajo síncrono real del hilo principal.
  window.addEventListener("navdebug:prefetch", ((e: CustomEvent) => {
    send({ type: "route-prefetch", path: e.detail?.path, phase: e.detail?.phase, ms: e.detail?.ms });
  }) as EventListener);

  // Muestreo de FPS real durante 6s después de cada apertura/cierre del
  // navbar (evento custom disparado desde Navbar.tsx), para ver caídas de
  // frame reales durante la animación del panel, no solo tareas largas.
  window.addEventListener("navdebug:toggle", ((e: CustomEvent) => {
    const isOpen = e.detail?.isOpen;
    let frames = 0;
    let dropped = 0;
    let lastT = performance.now();
    const startT = lastT;
    const sample = (t: number) => {
      frames++;
      const delta = t - lastT;
      if (delta > 32) dropped++; // más de ~2 frames a 60fps = frame perdido
      lastT = t;
      if (t - startT < 6000) {
        requestAnimationFrame(sample);
      } else {
        send({ type: "fps-sample", isOpen, frames, dropped, durationMs: Math.round(t - startT) });
      }
    };
    requestAnimationFrame(sample);
  }) as EventListener);
}
