import { useEffect, type RefObject } from "react";

// iOS Safari (y otros navegadores) pausan automáticamente los <video> de
// una pestaña al pasar a segundo plano (cambiar de app, bloquear pantalla,
// etc.) para ahorrar batería/recursos -- a diferencia de un GIF/WebP
// animado, un <video> NO se reanuda solo al volver a primer plano, queda
// congelado en el último frame antes de salir. Este hook reanuda el
// autoplay/loop apenas la pestaña vuelve a ser visible.
export function useResumeVideoOnVisible(videoRef: RefObject<HTMLVideoElement | null>) {
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== "visible") return;
      const video = videoRef.current;
      if (video && video.paused) {
        video.play().catch(() => {
          // Autoplay puede rechazarse si el navegador todavía no registró
          // interacción del usuario en esta sesión -- no hay nada más que
          // hacer acá, el video simplemente queda pausado hasta que algo
          // más lo dispare.
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => document.removeEventListener("visibilitychange", handleVisibility);
  }, [videoRef]);
}
