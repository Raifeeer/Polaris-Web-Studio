import { useEffect, type RefObject } from "react";

// iOS Safari (y otros navegadores) pausan automáticamente los <video> de
// una pestaña al pasar a segundo plano (cambiar de app, bloquear pantalla,
// etc.) para ahorrar batería/recursos -- a diferencia de un GIF/WebP
// animado, un <video> NO se reanuda solo al volver a primer plano, queda
// congelado en el último frame antes de salir. Este hook reanuda el
// autoplay/loop apenas la pestaña vuelve a ser visible.
export function useResumeVideoOnVisible(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const resume = () => {
      const video = videoRef.current;
      if (!video || !video.paused) return;
      // Bajo presión de memoria real, iOS Safari puede llegar a descartar
      // por completo los datos ya bufferizados de un <video> en segundo
      // plano (no solo pausarlo) -- ahí un simple .play() falla en
      // silencio porque no hay nada que reproducir. readyState 0
      // (HAVE_NOTHING) es la señal de que el recurso se perdió; hace
      // falta recargarlo con .load() antes de poder reproducir de nuevo.
      if (video.readyState === 0) {
        video.load();
      }
      video.play().catch(() => {
        // Autoplay puede rechazarse si el navegador todavía no registró
        // interacción del usuario en esta sesión -- no hay nada más que
        // hacer acá, el video simplemente queda pausado hasta que algo
        // más lo dispare.
      });
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") resume();
    };
    // visibilitychange cubre la mayoría de los casos (cambiar de pestaña o
    // de app y volver); pageshow con persisted:true cubre el caso de que
    // Safari restaure la página completa desde su caché de retroceso
    // (bfcache) en vez de solo des-ocultar la pestaña -- ahí visibilitychange
    // puede no disparar, pero pageshow sí.
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", resume);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", resume);
    };
  }, [videoRef]);
}
