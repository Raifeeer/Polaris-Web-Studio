import React from "react";
import { Play } from "lucide-react";

// <video loop muted playsInline> de un mockup de portafolio, con dos
// comportamientos reales pedidos por el usuario:
//
// 1. Arranca recién cuando la tarjeta entra en pantalla (IntersectionObserver
//    -- sin autoPlay) y se pausa al salir de pantalla. Sin esto, si el
//    visitante tarda en bajar hasta la tarjeta, el video ya viene
//    reproduciéndose "por el footer" del loop en vez de arrancar del
//    principio cuando por fin lo ve.
// 2. Si el video queda pausado por el navegador (Safari/iOS pausa los
//    <video> de una pestaña en segundo plano al cambiar de app, y no
//    siempre se reanuda solo) mientras la tarjeta sigue visible en
//    pantalla, se muestra un botón de play real para reanudarlo con un
//    toque -- nunca se asume en silencio que se resolvió solo. Bug real
//    corregido acá: la versión anterior solo armaba el botón dentro del
//    evento 'pause' chequeando document.visibilityState === 'visible' en
//    ese momento -- pero 'pause' dispara justo AL pasar a segundo plano,
//    cuando visibilityState casi siempre ya es 'hidden' en ese instante
//    exacto, así que el botón nunca se armaba. Ahora se arma en
//    cualquier reintento de reanudar (visibilitychange/pageshow/focus/
//    polling) que encuentre el video pausado con la tarjeta visible en
//    pantalla, no solo en el evento pause.
// 3. `poster` (un jpg/png real, un solo cuadro -- no un WebP/GIF animado):
//    Safari/iOS es conservador bajando los bytes reales del video incluso
//    con preload="auto", así que sin poster el recuadro queda vacío hasta
//    que el usuario scrollea hasta ahí -- se sentía como que el mockup
//    "aparecía de la nada" en vez de estar siempre ahí, ya animándose
//    recién al llegar. Con poster, ese primer cuadro está desde que carga
//    la página; el video retoma exactamente esa misma imagen al arrancar.
export default function AutoResumeVideo({
  src,
  poster,
  className,
  ariaLabel,
}: {
  src: string;
  poster?: string;
  className?: string;
  ariaLabel?: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [showResume, setShowResume] = React.useState(false);
  // "En pantalla" real (IntersectionObserver), distinto de "la pestaña
  // está visible" (document.visibilityState) -- necesitamos ambos: no
  // reproducir/reanudar una tarjeta que está scrolleada fuera de vista,
  // aunque la pestaña esté al frente.
  const isIntersectingRef = React.useRef(false);

  const attemptResume = React.useCallback(() => {
    const video = videoRef.current;
    if (!video || document.visibilityState !== "visible" || !isIntersectingRef.current) return;
    if (!video.paused) {
      setShowResume(false);
      return;
    }
    if (video.readyState === 0) video.load();
    video.play().then(() => setShowResume(false)).catch(() => setShowResume(true));
  }, []);

  React.useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        isIntersectingRef.current = entry.isIntersecting;
        if (entry.isIntersecting) {
          attemptResume();
        } else {
          // Pausar fuera de pantalla ahorra batería/CPU -- al volver a
          // entrar en pantalla, attemptResume lo retoma solo.
          videoRef.current?.pause();
          setShowResume(false);
        }
      },
      { threshold: 0.25 }
    );
    observer.observe(wrapper);
    return () => observer.disconnect();
  }, [attemptResume]);

  React.useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") attemptResume();
    };
    const interval = window.setInterval(attemptResume, 1000);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("pageshow", attemptResume);
    window.addEventListener("focus", attemptResume);
    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("pageshow", attemptResume);
      window.removeEventListener("focus", attemptResume);
    };
  }, [attemptResume]);

  return (
    <div ref={wrapperRef} className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        loop
        muted
        playsInline
        preload="auto"
        className={className}
        aria-label={ariaLabel}
        onPause={attemptResume}
        onPlay={() => setShowResume(false)}
      />
      {showResume && (
        <button
          type="button"
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.readyState === 0) video.load();
            video.play().then(() => setShowResume(false)).catch(() => {});
          }}
          aria-label="Reanudar video"
          className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer"
        >
          <span className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
            <Play size={22} className="text-[var(--color-primary-base,#6366f1)] translate-x-0.5" fill="currentColor" />
          </span>
        </button>
      )}
    </div>
  );
}
