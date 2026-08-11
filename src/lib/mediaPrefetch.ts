import { projects } from "../constants/projects";

// Assets pesados del portafolio (mockups en video/WebP/GIF de escritorio y
// móvil) -- se calientan en el caché HTTP del navegador desde el momento en
// que el visitante entra a cualquier página del sitio, no recién cuando
// llega a /portafolio. Pensado para escalar: a medida que se agreguen más
// mockups grabados (mismo patrón que Lúmina Sky) para otros proyectos, esta
// lista los recoge solos sin tocar este archivo. previewVideo tiene
// prioridad sobre desktopImg (mismo criterio que el render real en
// Portfolio.tsx/ProjectDetail.tsx) -- si existe video, no tiene sentido
// gastarle datos al visitante precargando también la imagen de respaldo
// que no se va a mostrar.
const MEDIA_URLS: string[] = Array.from(
  new Set(
    projects.flatMap((p) =>
      [p.previewPoster, p.previewVideo || p.desktopImg, p.mobilePoster, p.mobileVideo || p.mobileImg].filter(
        (u): u is string => !!u
      )
    )
  )
);

const prefetched = new Set<string>();

function hasSlowConnection(): boolean {
  const conn = (navigator as any).connection;
  if (!conn) return false;
  if (conn.saveData) return true;
  const slow = new Set(["slow-2g", "2g"]);
  return slow.has(conn.effectiveType);
}

function prefetchOne(url: string) {
  if (prefetched.has(url)) return;
  prefetched.add(url);
  // no-cors: no necesitamos leer la respuesta, solo que el navegador la
  // guarde en su caché HTTP (respeta el Cache-Control real del objeto de
  // Storage) -- así funciona incluso contra un bucket sin CORS habilitado.
  fetch(url, { mode: "no-cors", credentials: "omit" }).catch(() => {
    prefetched.delete(url);
  });
}

// Mismo fix real que routePrefetch.ts (ver ese archivo): respetar el
// `deadline` real de requestIdleCallback en vez de forzar la ejecución
// pase lo que pase -- de paso, la detección de conexión lenta de arriba
// (hasSlowConnection) es un no-op en Safari/WebKit (iOS nunca implementó
// la Network Information API, navigator.connection es undefined ahí), así
// que en iPhone el único guard real contra saturar el hilo principal es
// este -- respetar el tiempo ocioso genuino.
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

// Precarga acumulativa en segundo plano, un archivo por cada slot de tiempo
// ocioso -- nunca compite con la carga/render inicial de la página real.
// Se salta por completo con Ahorro de Datos activado o conexión lenta
// (2G/slow-2G), para no gastarle datos al visitante sin necesidad.
export function prefetchPortfolioMediaIdle() {
  if (hasSlowConnection()) return;

  let index = 0;
  const prefetchNext = () => {
    if (index >= MEDIA_URLS.length) return;
    prefetchOne(MEDIA_URLS[index++]);
    scheduleIdle(prefetchNext);
  };

  scheduleIdle(prefetchNext);
}
