import React from "react";
import { Play } from "lucide-react";
import { useResumeVideoOnVisible } from "../hooks/useResumeVideoOnVisible";

// <video autoPlay loop muted playsInline> de un mockup de portafolio.
// Además de los reintentos automáticos de useResumeVideoOnVisible
// (visibilitychange/pageshow/focus/polling), acá se agrega una salida
// visible garantizada: si el video queda pausado mientras la pestaña está
// visible (reportado real en dispositivo -- cambiar de app y volver lo
// deja congelado pese a los reintentos automáticos), se muestra un botón
// de play encima para reanudarlo con un toque, sin depender de que algún
// evento del navegador dispare a tiempo.
export default function AutoResumeVideo({
  src,
  className,
  ariaLabel,
}: {
  src: string;
  className?: string;
  ariaLabel?: string;
}) {
  const videoRef = React.useRef<HTMLVideoElement>(null);
  useResumeVideoOnVisible(videoRef);
  const [showResume, setShowResume] = React.useState(false);

  const handleResumeClick = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.readyState === 0) video.load();
    video.play().then(() => setShowResume(false)).catch(() => {});
  };

  return (
    <div className="relative w-full h-full">
      <video
        ref={videoRef}
        src={src}
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        className={className}
        aria-label={ariaLabel}
        onPause={() => {
          if (document.visibilityState === "visible") setShowResume(true);
        }}
        onPlay={() => setShowResume(false)}
      />
      {showResume && (
        <button
          type="button"
          onClick={handleResumeClick}
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
