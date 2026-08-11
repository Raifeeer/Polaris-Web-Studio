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

function scheduleIdle(cb: () => void) {
  if (typeof window === "undefined") return;
  if ("requestIdleCallback" in window) {
    (window as any).requestIdleCallback(cb, { timeout: 2000 });
  } else {
    setTimeout(cb, 300);
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
