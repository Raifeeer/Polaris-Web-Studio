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
        // hacer acá, el polling de abajo lo va a reintentar solo.
      });
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") resume();
    };
    // visibilitychange + pageshow (restauración desde bfcache) cubren la
    // mayoría de los casos, pero en la práctica (reportado en dispositivo
    // real) no siempre alcanzan a disparar de forma confiable al volver
    // de cambiar de app en iOS -- como red de seguridad, se agrega un
    // chequeo periódico: mientras la pestaña esté visible y el video
    // siga pausado sin que el usuario lo haya pausado a propósito (acá
    // nunca hay un botón de pausa, así que cualquier pausa mientras está
    // visible es user-agent, no del usuario), se reintenta reanudar.
    const interval = window.setInterval(() => {
      if (document.visibilityState === "visible") resume();
    }, 1000);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", resume);
    window.addEventListener("focus", resume);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", resume);
      window.removeEventListener("focus", resume);
    };
  }, [videoRef]);
}
