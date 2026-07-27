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
//    la página.
//    Bug real encontrado después: el swap NATIVO del navegador de poster a
//    video (automático, apenas arranca la reproducción) se ve como un
//    pestañeo breve -- el jpg del poster y el primer cuadro decodificado
//    del video no son bit-a-bit idénticos (compresión distinta, jpg vs.
//    espacio de color YUV420 del h264), y el navegador los intercambia de
//    golpe. Fix: el poster ya no es el atributo nativo del <video> -- es
//    una <img> propia superpuesta, que se desvanece con una transición
//    real (300ms) recién cuando el evento 'playing' confirma que el video
//    ya está decodificando cuadros de verdad, en vez de dejar que el
//    navegador decida el momento del corte.
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
  // Solo se muestra/desvanece una vez, al primer arranque real -- en
  // reanudaciones posteriores (volver de segundo plano, reentrar en
  // pantalla) el video ya no está en el cuadro 0, así que el poster ya no
  // coincide y no debe volver a mostrarse.
  const [posterVisible, setPosterVisible] = React.useState(!!poster);
  const hasStartedRef = React.useRef(false);
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
        loop
        muted
        playsInline
        preload="auto"
        className={className}
        aria-label={ariaLabel}
        onPause={attemptResume}
        onPlay={() => setShowResume(false)}
        onPlaying={() => {
          if (hasStartedRef.current) return;
          hasStartedRef.current = true;
          // Pequeño margen (120ms) para que ya haya un par de cuadros
          // reales decodificándose antes de desvanecer el poster -- si se
          // desvanece en el instante exacto de 'playing', a veces todavía
          // se alcanza a ver un cuadro negro/a medio decodificar debajo.
          window.setTimeout(() => setPosterVisible(false), 120);
        }}
      />
      {poster && (
        <img
          src={poster}
          alt=""
          aria-hidden="true"
          className="absolute inset-0 w-full h-full object-contain object-center pointer-events-none transition-opacity duration-300 ease-out"
          style={{ opacity: posterVisible ? 1 : 0 }}
        />
      )}
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
