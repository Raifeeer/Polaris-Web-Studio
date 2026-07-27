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
// 4. Esquinas redondeadas: CINCO técnicas distintas de recorte CSS
//    (overflow-hidden+border-radius simple, con y sin wrapper extra,
//    -webkit-mask-image con degradé real, con topes duros, y clip-path)
//    fueron probadas y confirmadas SIN EFECTO en el dispositivo real --
//    Safari/iOS, para este <video> en particular, simplemente no recorta
//    sus propias esquinas sin importar el mecanismo CSS usado. En vez de
//    seguir peleando con el recorte, se abandona del todo: las 4 esquinas
//    se "esconden" pintando por encima 4 parches sólidos con el mismo
//    color de fondo real que rodea al mockup (cornerBg), cada uno con un
//    radial-gradient de bordes duros que deja un cuarto de círculo
//    transparente hacia adentro -- el resultado visual es idéntico a un
//    recorte redondeado real, pero no depende de que el navegador sepa
//    recortar la capa de video compuesta por hardware, así que no puede
//    fallar por este bug.
const RADIUS = "1rem"; // debe coincidir con rounded-2xl (Tailwind)

function CornerPatches({ bg }: { bg: string }) {
  const base: React.CSSProperties = {
    position: "absolute",
    width: RADIUS,
    height: RADIUS,
    pointerEvents: "none",
    zIndex: 2,
  };
  return (
    <>
      <div
        style={{
          ...base,
          top: 0,
          left: 0,
          background: `radial-gradient(circle at bottom right, transparent ${RADIUS}, ${bg} ${RADIUS})`,
        }}
      />
      <div
        style={{
          ...base,
          top: 0,
          right: 0,
          background: `radial-gradient(circle at bottom left, transparent ${RADIUS}, ${bg} ${RADIUS})`,
        }}
      />
      <div
        style={{
          ...base,
          bottom: 0,
          left: 0,
          background: `radial-gradient(circle at top right, transparent ${RADIUS}, ${bg} ${RADIUS})`,
        }}
      />
      <div
        style={{
          ...base,
          bottom: 0,
          right: 0,
          background: `radial-gradient(circle at top left, transparent ${RADIUS}, ${bg} ${RADIUS})`,
        }}
      />
    </>
  );
}

// Métodos imperativos expuestos vía ref -- hoy solo `restart()`, usado por el
// botón de reinicio junto al toggle desktop/mobile en ProjectDetail.tsx. No
// alcanza con solo hacer `video.currentTime = 0` a secas -- se ve como un
// salto brusco (el cuadro cambia de golpe a mitad de lo que sea que el
// visitante estaba mirando). En su lugar: fade a negro/transparente (misma
// duración/easing que el crossfade del poster, 300ms), seek real a 0 recién
// con el video ya invisible, y fade de vuelta una vez que 'playing' confirma
// que el primer cuadro real ya se está decodificando -- mismo criterio ya
// usado para el swap poster→video, reaplicado acá.
export interface AutoResumeVideoHandle {
  restart: () => void;
}

const AutoResumeVideo = React.forwardRef<AutoResumeVideoHandle, {
  src: string;
  poster?: string;
  ariaLabel?: string;
  // Color de fondo real que rodea al mockup (ej. "var(--color-surface-elevated)")
  // -- los parches de esquina se pintan con este color para que se
  // mimeticen con lo que hay alrededor.
  cornerBg: string;
  // Proporción REAL del archivo de video (ej. "1200/750", "560/1212") --
  // obligatorio. Bug real encontrado: antes el mockup de escritorio usaba
  // "w-full h-full" confiando en que el alto ya calculado por el padre
  // (ProjectScreenshot, vía JS + un clamp de min/max altura) coincidiera
  // exacto con la proporción real del video -- casi nunca coincidía del
  // todo (el clamp lo desalinea en tarjetas angostas), así que
  // object-contain dejaba franjas vacías (letterbox) entre el video real
  // y el borde de la caja, y los parches de esquina (alineados a la caja,
  // no al video) quedaban tapando el aire en vez del video. El mockup
  // móvil nunca tuvo este problema porque ya pasaba su aspectRatio real a
  // mano. Ahora los dos casos usan el mismo mecanismo: aspect-ratio +
  // max-width/max-height:100% hace que ESTE div calcule su propio tamaño
  // exacto (el más grande que entra en el espacio disponible
  // manteniendo la proporción real), igual que un <img> con
  // max-width:100% -- así la caja SIEMPRE coincide exacto con el video
  // real, sin importar qué tan preciso sea el cálculo de alto del padre.
  aspectRatio: string;
  // Tope adicional de ancho, además del 100% del contenedor (ej. 260 para
  // el mockup angosto centrado de la vista móvil). Omitido para el
  // mockup de escritorio, que puede usar todo el ancho disponible.
  maxWidthPx?: number;
}>(function AutoResumeVideo({
  src,
  poster,
  ariaLabel,
  cornerBg,
  aspectRatio,
  maxWidthPx,
}, ref) {
  const [ratioW, ratioH] = React.useMemo(() => {
    const [w, h] = aspectRatio.split("/").map(Number);
    return [w || 1, h || 1];
  }, [aspectRatio]);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  // Tamaño del frame calculado a mano en JS (no vía CSS aspect-ratio +
  // max-width/max-height) -- bug real encontrado probando esto: cuando
  // max-width Y max-height terminan activándose a la vez (el mockup
  // angosto de móvil, más alto de lo que cabe en algunos contenedores),
  // Chromium no resuelve ambos límites en conjunto para mantener la
  // proporción -- cada uno se aplica por separado, dejando una caja que
  // NO respeta la proporción real del video (ej. 260x460 en vez de
  // 213x460), rompiendo la alineación de los parches de esquina otra
  // vez. Un ResizeObserver + la misma cuenta que hace object-fit:contain
  // a mano (comparar el ancho candidato contra el alto disponible y
  // usar el que corresponda) es la única forma de garantizar que la caja
  // SIEMPRE calce exacto con el video real, sin depender de que el
  // navegador resuelva bien un caso límite de CSS.
  const [frameSize, setFrameSize] = React.useState<{ width: number; height: number } | null>(null);
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
  // true durante el fade de reinicio (video oculto mientras se hace el seek
  // a 0) -- separado de `posterVisible` porque el poster solo se muestra en
  // el primer arranque, mientras que este fade se repite cada vez que se usa
  // el botón de reinicio.
  const [restarting, setRestarting] = React.useState(false);

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
    const compute = (availWidth: number, availHeight: number) => {
      let width = maxWidthPx ? Math.min(availWidth, maxWidthPx) : availWidth;
      let height = (width * ratioH) / ratioW;
      if (height > availHeight) {
        height = availHeight;
        width = (height * ratioW) / ratioH;
      }
      if (width > 0 && height > 0) setFrameSize({ width, height });
    };
    compute(wrapper.clientWidth, wrapper.clientHeight);
    const resizeObserver = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      compute(entry.contentRect.width, entry.contentRect.height);
    });
    resizeObserver.observe(wrapper);
    return () => resizeObserver.disconnect();
  }, [ratioW, ratioH, maxWidthPx]);

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

  React.useImperativeHandle(ref, () => ({
    restart: () => {
      const video = videoRef.current;
      if (!video) return;
      setRestarting(true);
      // 220ms para que el video termine de desvanecerse (mismo `duration`
      // que el CSS de abajo) antes de tocar currentTime -- si se hiciera el
      // seek con el video todavía visible, se vería el salto de cuadro en
      // pleno fade.
      window.setTimeout(() => {
        video.currentTime = 0;
        video.play().catch(() => {});
        // onPlaying ya se encarga de bajar `restarting` (mismo mecanismo
        // que ya usa para el poster) apenas el primer cuadro real del
        // reinicio esté decodificando -- evita un fade-in prematuro sobre
        // un cuadro todavía negro/a medio decodificar.
      }, 220);
    },
  }), []);

  const frameStyle: React.CSSProperties = {
    position: "relative",
    width: frameSize ? frameSize.width : 0,
    height: frameSize ? frameSize.height : 0,
    isolation: "isolate",
  };

  return (
    <div ref={wrapperRef} className="relative w-full h-full flex items-center justify-center">
      {/* isolation:isolate crea un contexto de apilamiento propio para este
          frame -- necesario porque en Safari/iOS real un <video>
          reproduciéndose a veces se compone en su propio plano de hardware
          por ENCIMA de hermanos normales del DOM, sin importar el orden en
          el documento (los parches de esquina, aunque van después en el
          DOM, quedaban tapados). transform: translateZ(0) en el <video>
          fuerza a que se componga como una capa normal dentro de este
          contexto en vez de ese plano especial, y z-index explícito en los
          3 hijos deja sin ambigüedad qué va arriba de qué.
          El ancho/alto ya vienen calculados a mano arriba (ResizeObserver
          + la misma cuenta de object-fit:contain) en vez de dejarlo en
          manos de aspect-ratio + max-width/max-height de CSS. */}
      <div style={frameStyle}>
        <video
          ref={videoRef}
          src={src}
          loop
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 w-full h-full object-contain object-center transition-opacity duration-[220ms] ease-out"
          style={{
            zIndex: 0,
            transform: "translateZ(0)",
            WebkitTransform: "translateZ(0)",
            opacity: restarting ? 0 : 1,
          }}
          aria-label={ariaLabel}
          onPause={attemptResume}
          onPlay={() => setShowResume(false)}
          onPlaying={() => {
            if (restarting) {
              // Mismo margen que el poster (ver más abajo) antes de
              // desvanecer de vuelta -- deja un par de cuadros reales ya
              // decodificándose para no revelar un cuadro negro/a medio
              // decodificar en pleno fade-in.
              window.setTimeout(() => setRestarting(false), 120);
            }
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
            style={{ opacity: posterVisible ? 1 : 0, zIndex: 1 }}
          />
        )}
        <CornerPatches bg={cornerBg} />
      </div>
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
});

export default AutoResumeVideo;
