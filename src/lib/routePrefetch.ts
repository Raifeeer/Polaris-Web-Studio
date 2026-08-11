// Mapa de rutas a sus importadores lazy, en espejo de los lazy() de App.tsx.
// Permite precargar un chunk de página antes de que el usuario navegue a él.
const importers: Record<string, () => Promise<unknown>> = {
  "/": () => import("../pages/LandingPage"),
  "/servicios": () => import("../pages/Services"),
  "/proceso": () => import("../pages/Process"),
  "/portafolio": () => import("../pages/Portfolio"),
  "/nosotros": () => import("../pages/About"),
  "/blog": () => import("../pages/Blog"),
  "/cotizar": () => import("../pages/WizardQuote"),
  "/login": () => import("../pages/Login"),
  "/dashboard": () => import("../pages/ClientDashboard"),
};

const prefetched = new Set<string>();

// Instrumentación temporal (recopilador de rendimiento del navbar, ver
// navPerfDebug.ts) -- no-op si nadie está escuchando el evento.
function reportPrefetch(path: string, phase: "start" | "end", ms?: number) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("navdebug:prefetch", { detail: { path, phase, ms } }));
}

export function prefetchRoute(path: string) {
  if (prefetched.has(path)) return;
  const importer = importers[path];
  if (!importer) return;
  prefetched.add(path);
  const start = performance.now();
  reportPrefetch(path, "start");
  importer()
    .then(() => reportPrefetch(path, "end", Math.round(performance.now() - start)))
    .catch(() => {
      // Si falla (p. ej. sin red), permite reintentar en el próximo hover/idle
      prefetched.delete(path);
    });
}

// Bug real encontrado en vivo (10-11 de agosto, con datos reales de un
// usuario en Chrome/iPhone -- CriOS, motor WebKit): esta función ignoraba
// el `deadline` real que entrega requestIdleCallback y forzaba la
// ejecución cada 2000ms pase lo que pase, sin importar si el navegador
// tenía tiempo ocioso de verdad. Confirmado con un recopilador de
// rendimiento temporal (ver navPerfDebug.ts): cada vez que arrancaba un
// prefetchRoute() de esta lista, el hilo principal se bloqueaba casi
// exactamente el mismo tiempo que tardaba ese import() -- hasta 12.5s de
// bloqueo real en un caso, sintiéndose como que "la página se congela".
// Fix real: respetar `deadline.timeRemaining()` (solo procede si hay
// presupuesto ocioso real, o si `didTimeout` fuerza el último recurso) y
// un timeout mucho más generoso (8s en vez de 2s) para que el navegador
// tenga margen real de encontrar un hueco ocioso genuino en vez de forzar
// la ejecución cada 2 segundos sin importar el estado real de la página.
function scheduleIdle(cb: (deadline?: IdleDeadline) => void) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(
      (deadline: IdleDeadline) => {
        if (deadline.didTimeout || deadline.timeRemaining() > 0) {
          cb(deadline);
        } else {
          scheduleIdle(cb);
        }
      },
      { timeout: 8000 }
    );
  } else {
    setTimeout(() => cb(), 1000);
  }
}

// Precarga acumulativa en segundo plano: una ruta por cada slot de tiempo
// ocioso del navegador, hasta cubrir todas las páginas. No bloquea nada
// visible; simplemente va "calentando" los chunks que el usuario aún no visitó.
export function prefetchAllRoutesIdle() {
  const paths = Object.keys(importers);
  let index = 0;

  const prefetchNext = () => {
    if (index >= paths.length) return;
    prefetchRoute(paths[index++]);
    scheduleIdle(prefetchNext);
  };

  scheduleIdle(prefetchNext);
}
