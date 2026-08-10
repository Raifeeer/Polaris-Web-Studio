import React, { useState, useMemo, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  ArrowUpRight,
  ExternalLink,
  Code,
  Search,
  Grid,
  ChevronLeft,
  ChevronRight,
  Shield,
  Zap,
  Info,
  Clock,
  X,
  Compass,
  Layout,
  Trophy,
  ArrowRight,
  Layers,
  Star,
  Monitor,
  Smartphone,
  CirclePlay,
  SkipForward,
  SkipBack,
  RotateCcw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useDocumentTitle, useJsonLd } from "../hooks/useDocumentTitle";
import { projects, Project } from "../constants/projects";
import { T, useLanguage } from "../context/LanguageContext";
import MockupFrame, { hasMockupContent } from "../components/MockupFrame";
import AutoResumeVideo, { type AutoResumeVideoHandle } from "../components/AutoResumeVideo";

// El frame de celular de MockupFrame es de tamaño fijo (280x580) -- misma
// relación de aspecto que usa la ventana de escritorio (aspect-video, 16/9)
// para que el cálculo de alto de la tarjeta (basado en aspecto) siga
// funcionando igual que con las capturas estáticas, sin tener que medir
// una imagen real (no hay imagen: el mockup se renderiza en vivo).
const MOCKUP_DESKTOP_ASPECT = 16 / 9;
const MOCKUP_MOBILE_ASPECT = 280 / 580;

const CINEMA_STATE_KEY = "polaris_portfolio_cinema_state";

// Si el usuario regresa desde la página de detalle (ver caso de estudio) u otra
// ruta, restaura el proyecto/modo cine que estaba viendo en vez de reiniciar al mosaico.
function readRestoredCinemaIndex(): number | null {
  try {
    const saved = sessionStorage.getItem(CINEMA_STATE_KEY);
    if (!saved) return null;
    const parsed = JSON.parse(saved) as { viewMode?: "bento" | "cinema"; slug?: string };
    if (parsed.viewMode !== "cinema" || !parsed.slug) return null;
    const idx = projects.findIndex(p => p.slug === parsed.slug);
    return idx >= 0 ? idx : null;
  } catch {
    return null;
  }
}

const MOCKUP_MIN_HEIGHT = 200;
const MOCKUP_MAX_HEIGHT = 640;
const MOCKUP_MOBILE_MAX_WIDTH = 260;

function ProjectScreenshot({ project, onExit, fillParent, fixedHeights, onSwipeProject }: { project: Project; onExit?: () => void; fillParent?: boolean; fixedHeights?: { desktop: number; mobile: number }; onSwipeProject?: (direction: 1 | -1) => void }) {
  const { translate } = useLanguage();
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = React.useState(0);
  const interactive = hasMockupContent(project.slug);
  const [desktopAspect, setDesktopAspect] = React.useState<number | null>(
    interactive ? MOCKUP_DESKTOP_ASPECT : null
  );
  const [mobileAspect, setMobileAspect] = React.useState<number | null>(
    interactive ? MOCKUP_MOBILE_ASPECT : null
  );
  // Color de fondo real detrás del mockup, para los parches de esquina de
  // AutoResumeVideo -- tanto la tarjeta del bento grid como el panel de
  // modo cine usan el mismo fondo liso (bg-[var(--color-surface-elevated)]),
  // así que un solo valor exacto alcanza en los dos casos (el modo cine
  // ya no tiene el glow/vignette decorativo que antes lo desviaba, ver
  // el rediseño del panel más abajo).
  const cornerBg = "var(--color-surface-elevated)";
  // Refs a los <video> real de cada vista -- el botón de reinicio de al
  // lado del toggle solo necesita reiniciar el que está activo (mismo
  // mecanismo que ProjectDetail.tsx).
  const desktopVideoRef = React.useRef<AutoResumeVideoHandle>(null);
  const mobileVideoRef = React.useRef<AutoResumeVideoHandle>(null);
  // Grados acumulados del ícono de reinicio -- incrementa 360 en cada click
  // (nunca vuelve a 0) para que framer-motion siempre anime un giro
  // completo hacia adelante, en vez de saltar de vuelta a 0deg de golpe.
  const [restartIconRotation, setRestartIconRotation] = React.useState(0);

  React.useEffect(() => {
    if (fixedHeights) return;
    const el = containerRef.current;
    if (!el) return;
    const observer = new ResizeObserver(entries => {
      const width = entries[0]?.contentRect.width;
      if (width) setContainerWidth(width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [fixedHeights]);

  // Precarga las imágenes y captura su proporción real para que el recuadro
  // del mockup encaje exacto con la foto, sin franjas vacías (object-contain
  // dentro de una caja con altura distinta a la foto se veía "metida en un div").
  // Si ya viene una altura fija (modo cine: calculada una sola vez en el padre
  // para que no cambie de tamaño entre un proyecto y otro), esto no hace falta.
  React.useEffect(() => {
    if (fixedHeights || interactive) return;
    if (project.previewVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => setDesktopAspect(video.videoWidth / video.videoHeight);
      video.src = project.previewVideo;
    } else if (project.desktopImg) {
      const img = new Image();
      img.onload = () => setDesktopAspect(img.naturalWidth / img.naturalHeight);
      img.src = project.desktopImg;
    }
    if (project.mobileVideo) {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => setMobileAspect(video.videoWidth / video.videoHeight);
      video.src = project.mobileVideo;
    } else if (project.mobileImg) {
      const img = new Image();
      img.onload = () => setMobileAspect(img.naturalWidth / img.naturalHeight);
      img.src = project.mobileImg;
    }
  }, [project.previewVideo, project.desktopImg, project.mobileVideo, project.mobileImg, fixedHeights]);

  let targetHeight: number;
  if (fixedHeights) {
    targetHeight = view === "mobile" ? fixedHeights.mobile : fixedHeights.desktop;
  } else if (view === "mobile") {
    const renderWidth = Math.min(MOCKUP_MOBILE_MAX_WIDTH, containerWidth || MOCKUP_MOBILE_MAX_WIDTH);
    targetHeight = mobileAspect ? renderWidth / mobileAspect : 480;
  } else {
    const renderWidth = containerWidth || 760;
    targetHeight = desktopAspect ? renderWidth / desktopAspect : 460;
  }
  targetHeight = Math.min(MOCKUP_MAX_HEIGHT, Math.max(MOCKUP_MIN_HEIGHT, targetHeight));

  return (
    <div className="w-full relative flex flex-col gap-4" ref={containerRef}>
      {/* El toggle Desktop/Mobile vive siempre en su propia fila, nunca
          flotando encima del mockup -- pedido explícito del usuario: cuando
          flotaba sobre el contenido interactivo (bento), tapaba la barra de
          navegación real del sitio que se estaba mostrando. Antes solo se
          comportaba así fuera de "fillParent" (bento); ahora es uniforme. */}
      <div className="flex items-center justify-between w-full px-1">
        <div className="flex items-center gap-2">
          {/* Device selection tabs with matching styling cues */}
          <div className="flex bg-[var(--color-surface-base)]/80 backdrop-blur-sm border border-[var(--color-border-subtle)] rounded-full p-1 shadow-sm gap-0.5">
            <button
              onClick={() => setView("desktop")}
              className="p-1.5 rounded-full transition-all cursor-pointer"
              style={{
                color: view === "desktop" ? "white" : "var(--color-text-tertiary)",
                backgroundColor: view === "desktop" ? "var(--cinema-color, #6366f1)" : "transparent",
                boxShadow: view === "desktop" ? `0 2px 8px rgba(var(--cinema-color-rgb, 99, 102, 241), 0.45)` : "none"
              }}
            >
              <Monitor size={13} />
            </button>
            <button
              onClick={() => setView("mobile")}
              className="p-1.5 rounded-full transition-all cursor-pointer"
              style={{
                color: view === "mobile" ? "white" : "var(--color-text-tertiary)",
                backgroundColor: view === "mobile" ? "var(--cinema-color, #6366f1)" : "transparent",
                boxShadow: view === "mobile" ? `0 2px 8px rgba(var(--cinema-color-rgb, 99, 102, 241), 0.45)` : "none"
              }}
            >
              <Smartphone size={13} />
            </button>
          </div>

          {/* Reinicia con fade el <video> de la vista activa -- solo tiene
              sentido si esa vista es un video real (no el mockup
              interactivo de Lúmina ni una captura estática). */}
          {!interactive && ((view === "desktop" && project.previewVideo) || (view === "mobile" && project.mobileVideo)) && (
            <button
              onClick={() => {
                (view === "desktop" ? desktopVideoRef : mobileVideoRef).current?.restart();
                setRestartIconRotation((r) => r - 360);
              }}
              className="p-2.5 rounded-full bg-[var(--color-surface-base)]/80 backdrop-blur-sm border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--cinema-color,_#6366f1)] hover:border-[var(--cinema-color,_#6366f1)]/40 transition-all cursor-pointer shadow-sm"
              aria-label={translate("Reiniciar video", "Restart video")}
              title={translate("Reiniciar video", "Restart video")}
            >
              <motion.span
                className="flex"
                animate={{ rotate: restartIconRotation }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
              >
                <RotateCcw size={13} />
              </motion.span>
            </button>
          )}

          {/* Abre el sitio en vivo del proyecto en una pestaña nueva -- solo en
              modo cine: en mosaico bento ya existe este botón afuera de la tarjeta. */}
          {!fillParent && project.liveUrl && (
            <button
              onClick={() => window.open(project.liveUrl, "_blank")}
              className="p-2.5 rounded-full bg-[var(--color-surface-base)]/80 backdrop-blur-sm border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-[var(--cinema-color,_#6366f1)] hover:border-[var(--cinema-color,_#6366f1)]/40 transition-all cursor-pointer shadow-sm"
              aria-label={translate("Ver proyecto en una pestaña nueva", "Open project in a new tab")}
              title={translate("Ver proyecto en vivo", "View live project")}
            >
              <ExternalLink size={13} />
            </button>
          )}
        </div>

        {/* Exit cinema button cleanly separated with soft active feedback */}
        {onExit && (
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--color-surface-base)]/80 border border-[var(--color-border-subtle)] hover:border-red-500/20 hover:bg-red-500/10 text-[var(--color-text-tertiary)] hover:text-red-400 text-[10px] font-black uppercase tracking-wider transition-all duration-200 cursor-pointer shadow-sm z-15"
          >
            <X size={11} />
            <span><T en="Exit">Salir</T></span>
          </button>
        )}
      </div>

      <motion.div
        initial={false}
        animate={{ height: targetHeight }}
        transition={{
          duration: 0.4,
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        drag={onSwipeProject ? "x" : false}
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.15}
        onDragEnd={onSwipeProject ? (e, { offset, velocity }) => {
          const swipe = Math.abs(offset.x) * velocity.x;
          if (swipe < -8000) onSwipeProject(1);
          else if (swipe > 8000) onSwipeProject(-1);
        } : undefined}
        className={`relative w-full overflow-hidden rounded-xl bg-transparent ${onSwipeProject ? "cursor-grab active:cursor-grabbing" : ""}`}
      >
        {/* Concurrent image container with modern GPU crossfade transitions */}
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Desktop View Wrapper.
              Sin "scale" en animate a propósito: aunque en reposo valga 1,
              Framer Motion deja un transform inline PERMANENTE en el
              elemento (no solo durante la transición) -- ese transform en
              un ancestro, por encima de un descendiente con overflow-hidden
              + border-radius (el frame del mockup), es justo la combinación
              que rompe el redondeo de esquinas en WebKit/iOS real (bug
              confirmado en dispositivo, invisible en Chromium). Opacity
              sola no fuerza ese transform. */}
          <motion.div
            initial={false}
            animate={{ opacity: view === "desktop" ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: view === "desktop" ? "auto" : "none", willChange: "opacity" }}
          >
            {interactive ? (
              <div className="w-full px-2">
                <MockupFrame type="browser" projectSlug={project.slug} />
              </div>
            ) : project.previewVideo ? (
              <AutoResumeVideo
                ref={desktopVideoRef}
                src={project.previewVideo}
                poster={project.previewPoster}
                cornerBg={cornerBg}
                aspectRatio="1200/750"
                ariaLabel={`${project.title} Desktop`}
              />
            ) : project.desktopImg ? (
              <img
                src={project.desktopImg}
                alt={`${project.title} Desktop`}
                className="w-full h-full object-contain object-center bg-transparent"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)]">
                <Monitor size={20} />
                <span className="text-xs">{project.title}</span>
              </div>
            )}
          </motion.div>

          {/* Mobile View Wrapper -- ver nota en el wrapper de escritorio
              sobre por qué "scale" no va en animate acá tampoco. */}
          <motion.div
            initial={false}
            animate={{ opacity: view === "mobile" ? 1 : 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: view === "mobile" ? "auto" : "none", willChange: "opacity" }}
          >
            {interactive ? (
              (() => {
                // El frame de celular de MockupFrame mide 280x580 fijo -- se
                // escala para caber en targetHeight (la caja variable de la
                // tarjeta), igual que en ProjectDetail.tsx. Con bisel real
                // (border-8, 16px total) sí hace falta reservar ese margen.
                const mobileScale = Math.min(1, (targetHeight - 16) / 580);
                return (
                  <div style={{ width: 280 * mobileScale, height: 580 * mobileScale }}>
                    <div
                      style={{
                        width: 280,
                        height: 580,
                        transform: `scale(${mobileScale})`,
                        transformOrigin: "top left",
                      }}
                    >
                      <MockupFrame type="mobile" projectSlug={project.slug} />
                    </div>
                  </div>
                );
              })()
            ) : project.mobileVideo ? (
              <AutoResumeVideo
                ref={mobileVideoRef}
                src={project.mobileVideo}
                poster={project.mobilePoster}
                cornerBg={cornerBg}
                aspectRatio="560/1212"
                maxWidthPx={260}
                ariaLabel={`${project.title} Mobile`}
              />
            ) : project.mobileImg ? (
              <img
                src={project.mobileImg}
                alt={`${project.title} Mobile`}
                className="h-full w-auto max-w-[260px] object-contain mx-auto bg-transparent rounded-2xl"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)]">
                <Smartphone size={20} />
                <span className="text-xs">{project.title}</span>
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}

export default function Portfolio() {
  const navigate = useNavigate();
  const { language, translate } = useLanguage();

  useDocumentTitle(
    "Nuestro Portafolio de Proyectos Web | Casos de Éxito",
    "Our Web Projects Portfolio | Live Demos & Success Cases",
    "Explora proyectos reales impecablemente optimizados: Lúmina Sky, Nexus Realty, y Chroma Tech Store construidos en código limpio.",
    "Explore high-fidelity, real-world custom projects: Lumina Sky, Nexus Realty, and Chroma Tech Store meticulously engineered.",
  );
  useJsonLd("jsonld-portafolio-breadcrumb", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: translate("Inicio", "Home"), item: "https://polarisweb.studio/" },
      { "@type": "ListItem", position: 2, name: translate("Portafolio", "Portfolio"), item: "https://polarisweb.studio/portafolio" },
    ],
  });

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"bento" | "cinema">(() => readRestoredCinemaIndex() !== null ? "cinema" : "bento");

  // Cinema Showcase Slider State
  const [activeCinemaIndex, setActiveCinemaIndex] = useState(() => readRestoredCinemaIndex() ?? 0);
  // Modo Historia: 3 "slides" por proyecto (mockup / resultados / stack+CTA),
  // formato tipo Instagram Stories -- reemplaza el viejo panel estático de
  // dos columnas. Se resetea a 0 cada vez que cambia el proyecto activo.
  const [storySlide, setStorySlide] = useState(0);
  const STORY_SLIDE_COUNT = 3;
  const STORY_SLIDE_DURATION_MS = 25000;
  // Progreso 0-1 dentro del slide actual, para animar el relleno de la
  // franja como en Instagram (en vez de saltar directo a lleno). Se
  // resetea a 0 en cada cambio de slide/proyecto y avanza vía rAF.
  const [storyProgress, setStoryProgress] = useState(0);
  const [storyPaused, setStoryPaused] = useState(false);
  const storyTouchStartX = useRef<number | null>(null);
  const storyTouchStartY = useRef<number | null>(null);
  // Toggle Desktop/Mobile del mockup del slide 0, mismo patrón que
  // ProjectScreenshot (bento/modo cine viejo) -- se resetea a "desktop" al
  // cambiar de proyecto, no al cambiar de slide (así si el usuario ya
  // había elegido "mobile" y avanza y vuelve al slide 0 del mismo
  // proyecto, sigue en mobile).
  const [storyView, setStoryView] = useState<"desktop" | "mobile">("desktop");
  const storyBoxRef = useRef<HTMLDivElement>(null);
  const [storyBoxHeight, setStoryBoxHeight] = useState(0);
  // Refs a los <video> del slide 0 del modo Story -- el botón de reinicio
  // de la barra superior solo reinicia el que está activo (mismo mecanismo
  // que ProjectScreenshot/ProjectDetail.tsx).
  const storyDesktopVideoRef = useRef<AutoResumeVideoHandle>(null);
  const storyMobileVideoRef = useRef<AutoResumeVideoHandle>(null);
  // Grados acumulados del ícono de reinicio del modo Story -- mismo
  // mecanismo que en ProjectScreenshot/ProjectDetail.tsx, estado propio
  // porque este vive en un componente distinto (Portfolio, no ProjectScreenshot).
  const [storyRestartIconRotation, setStoryRestartIconRotation] = useState(0);
  // Sentido del último avance (1 = siguiente, -1 = anterior) -- controla de
  // qué lado entra/sale el slide en la animación tipo carrusel (como si
  // fuese girando un cubo), tanto al cambiar de slide como de proyecto.
  const [storyDirection, setStoryDirection] = useState(1);

  // Quick View Overlay State
  const [selectedProjectForQuickView, setSelectedProjectForQuickView] = useState<Project | null>(null);

  // Type definitions/categories for filter pills
  const availableTypes = useMemo(() => {
    const types = new Set<string>();
    projects.forEach(p => {
      // Extract main category by splitting dot or taking full type
      const mainCategory = p.type.split("·")[0].trim();
      types.add(mainCategory);
    });
    return ["ALL", ...Array.from(types)];
  }, []);

  const plans = ["ALL", "Nova", "Constelación", "Destello"];

  // Filtered Projects List
  const filteredProjects = useMemo(() => {
    return projects.filter(project => {
      const pTitle = project.title.toLowerCase();
      const pDesc = (project.shortDesc || "").toLowerCase();
      const pDescEn = (project.shortDescEN || "").toLowerCase();
      const pType = project.type.toLowerCase();
      const pTypeEn = (project.typeEN || "").toLowerCase();
      const matchesSearch =
        pTitle.includes(searchQuery.toLowerCase()) ||
        pDesc.includes(searchQuery.toLowerCase()) ||
        pDescEn.includes(searchQuery.toLowerCase()) ||
        pType.includes(searchQuery.toLowerCase()) ||
        pTypeEn.includes(searchQuery.toLowerCase());

      const matchesPlan =
        selectedPlan === "ALL" ||
        project.plan.toLowerCase() === selectedPlan.toLowerCase() ||
        (selectedPlan === "Destello" && project.planEN === "Flash");

      const matchesType =
        selectedType === "ALL" ||
        project.type.toLowerCase().includes(selectedType.toLowerCase());

      return matchesSearch && matchesPlan && matchesType;
    });
  }, [searchQuery, selectedPlan, selectedType]);

  // Adjust Cinema active index if filtered array changes
  const cinemaProjects = filteredProjects.length > 0 ? filteredProjects : projects;
  const currentCinemaProject = cinemaProjects[activeCinemaIndex % cinemaProjects.length] || cinemaProjects[0];

  // Al cambiar los filtros, la lista del modo cine se acorta y activeCinemaIndex
  // puede quedar fuera de rango: los dots (que comparan idx === activeCinemaIndex
  // sin módulo) se desincronizan del slide visible. Lo reseteamos a 0 en ese caso.
  useEffect(() => {
    setActiveCinemaIndex((prev) => (prev >= cinemaProjects.length ? 0 : prev));
  }, [cinemaProjects.length]);

  // Ir a un proyecto puntual (dots/salto directo) -- siempre arranca en el
  // primer slide de su historia.
  const goToCinemaProject = (idx: number) => {
    setStoryDirection(idx > activeCinemaIndex ? 1 : -1);
    setActiveCinemaIndex(idx);
    setStorySlide(0);
  };

  const handleNextCinema = () => {
    setStoryDirection(1);
    setActiveCinemaIndex(prev => (prev + 1) % cinemaProjects.length);
    setStorySlide(0);
  };

  const handlePrevCinema = () => {
    setStoryDirection(-1);
    setActiveCinemaIndex(prev => (prev - 1 + cinemaProjects.length) % cinemaProjects.length);
    setStorySlide(0);
  };

  // Avanzar dentro de la historia del proyecto actual -- al pasar el
  // último slide, salta al primer slide del SIGUIENTE proyecto (mismo
  // comportamiento que Instagram al llegar al final de una historia).
  const handleStoryNext = () => {
    setStoryDirection(1);
    if (storySlide < STORY_SLIDE_COUNT - 1) {
      setStorySlide(s => s + 1);
    } else {
      handleNextCinema();
    }
  };

  // Retroceder -- en el primer slide, salta al ÚLTIMO slide del proyecto
  // anterior (no al primero, para no tener que volver a avanzar 3 veces).
  // Setea storySlide explícito DESPUÉS de activeCinemaIndex, en el mismo
  // handler -- sin un useEffect de por medio que lo pudiera pisar de
  // vuelta a 0 en el siguiente render.
  const handleStoryPrev = () => {
    setStoryDirection(-1);
    if (storySlide > 0) {
      setStorySlide(s => s - 1);
    } else {
      setActiveCinemaIndex(prev => (prev - 1 + cinemaProjects.length) % cinemaProjects.length);
      setStorySlide(STORY_SLIDE_COUNT - 1);
    }
  };

  // Avance automático estilo Instagram: cada slide corre un timer de
  // STORY_SLIDE_DURATION_MS, animando storyProgress de 0 a 1 vía rAF (no
  // setInterval, para que la franja de progreso se rellene fluida en vez
  // de a saltos). Se reinicia en cada cambio de slide/proyecto y se
  // pausa mientras el usuario mantiene presionado el contenido (storyPaused).
  useEffect(() => {
    if (viewMode !== "cinema" || storyPaused) return;
    setStoryProgress(0);
    let raf = 0;
    const start = performance.now();
    const tick = (now: number) => {
      const elapsed = now - start;
      const pct = Math.min(1, elapsed / STORY_SLIDE_DURATION_MS);
      setStoryProgress(pct);
      if (pct >= 1) {
        handleStoryNext();
        return;
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode, storySlide, activeCinemaIndex, storyPaused]);

  // Bloquea el scroll vertical de la página de fondo mientras el modo
  // historia está activo -- de otro modo, un swipe/scroll dentro del
  // overlay (que ocupa toda la pantalla) también desplazaba el portafolio
  // detrás de él.
  // Además marca <body> con una clase (mismo patrón que .light en <html>)
  // para poder ocultar por CSS el botón flotante de Atlas Assistant (QuoteBot),
  // que vive en un div propio con z-[100] -- por encima del overlay de
  // historia (z-[90]) -- así que sin esto quedaba flotando sobre el modo
  // historia en vez de escondido detrás.
  useEffect(() => {
    if (viewMode !== "cinema") return;
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("story-mode-active");
    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.classList.remove("story-mode-active");
    };
  }, [viewMode]);

  useEffect(() => {
    setStoryView("desktop");
  }, [activeCinemaIndex]);

  // Mide el alto real del recuadro del mockup (slide 0) para poder escalar
  // el frame de celular (280x580 fijo, mismo componente MockupFrame que usa
  // ProjectScreenshot) a ese alto exacto -- se reconecta cada vez que el
  // slide 0 se vuelve a montar (cambia de proyecto o se regresa a él).
  useEffect(() => {
    const el = storyBoxRef.current;
    if (!el) return;
    const observer = new ResizeObserver((entries) => {
      const h = entries[0]?.contentRect.height;
      if (h) setStoryBoxHeight(h);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, [storySlide, activeCinemaIndex]);

  // Swipe horizontal para cambiar de slide (izq = siguiente, der =
  // anterior, mismo sentido que Instagram) -- umbral de 40px para no
  // interferir con taps normales. Pausa el timer mientras el dedo está
  // apoyado, para que un swipe lento no compita con el avance automático.
  const handleStoryTouchStart = (e: React.TouchEvent) => {
    storyTouchStartX.current = e.touches[0].clientX;
    storyTouchStartY.current = e.touches[0].clientY;
    setStoryPaused(true);
  };
  const handleStoryTouchEnd = (e: React.TouchEvent) => {
    setStoryPaused(false);
    const startX = storyTouchStartX.current;
    const startY = storyTouchStartY.current;
    storyTouchStartX.current = null;
    storyTouchStartY.current = null;
    if (startX === null || startY === null) return;
    const dx = e.changedTouches[0].clientX - startX;
    const dy = e.changedTouches[0].clientY - startY;
    if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)) return;
    if (dx < 0) {
      handleStoryNext();
    } else {
      handleStoryPrev();
    }
  };

  // Precarga en segundo plano (idle) la captura del proyecto que se mostrará
  // en modo cine. Antes esta precarga solo ocurría dentro de ProjectScreenshot,
  // es decir, justo cuando se monta el panel -- por eso la primera vez que se
  // entra a modo cine se nota un pequeño tirón mientras la imagen se descarga
  // y decodifica al mismo tiempo que corren las animaciones de entrada.
  useEffect(() => {
    const imageSources = [
      currentCinemaProject?.previewVideo ? undefined : currentCinemaProject?.desktopImg,
      currentCinemaProject?.mobileImg,
    ].filter((src): src is string => Boolean(src));
    const videoSrc = currentCinemaProject?.previewVideo;
    if (imageSources.length === 0 && !videoSrc) return;
    const preload = () => {
      imageSources.forEach((src) => {
        const img = new Image();
        img.src = src;
      });
      if (videoSrc) {
        const video = document.createElement("video");
        video.preload = "auto";
        video.src = videoSrc;
      }
    };
    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(preload);
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(preload, 200);
    return () => window.clearTimeout(id);
  }, [currentCinemaProject?.desktopImg, currentCinemaProject?.mobileImg, currentCinemaProject?.previewVideo]);

  // Guarda el proyecto/modo actual para poder restaurarlo si el usuario
  // navega a "ver caso de estudio" y luego regresa al portafolio.
  useEffect(() => {
    try {
      sessionStorage.setItem(
        CINEMA_STATE_KEY,
        JSON.stringify(
          viewMode === "cinema" && currentCinemaProject
            ? { viewMode: "cinema", slug: currentCinemaProject.slug }
            : { viewMode: "bento" }
        )
      );
    } catch {
      // sessionStorage no disponible (modo privado, etc.) -- no es crítico
    }
  }, [viewMode, currentCinemaProject]);

  // Si el modo cine se restauró al montar (usuario volviendo desde el caso
  // de estudio), no hay animación de colapso de header de por medio, así
  // que el scroll puede hacerse de inmediato.
  useEffect(() => {
    if (viewMode === "cinema") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (viewMode !== "cinema") {
      document.documentElement.style.removeProperty("--cinema-color");
      document.documentElement.style.removeProperty("--cinema-color-rgb");
      return;
    }
    const color = currentCinemaProject?.cinemaColor || "#6366f1";
    document.documentElement.style.setProperty("--cinema-color", color);
    // Convertir hex a RGB para usar con opacity
    const r = parseInt(color.slice(1,3), 16);
    const g = parseInt(color.slice(3,5), 16);
    const b = parseInt(color.slice(5,7), 16);
    document.documentElement.style.setProperty("--cinema-color-rgb", `${r}, ${g}, ${b}`);
    return () => {
      document.documentElement.style.removeProperty("--cinema-color");
      document.documentElement.style.removeProperty("--cinema-color-rgb");
    };
  }, [currentCinemaProject, viewMode, activeCinemaIndex]);

  return (
    <div className="min-h-[100svh] flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden transition-colors duration-300">
      <Navbar />

      {/* Decorative premium gradients in background */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[var(--color-primary-base)]/5 rounded-full blur-[140px] pointer-events-none z-0" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[160px] pointer-events-none z-0" />

      <main className="max-w-7xl mx-auto w-full px-4 md:px-10 py-12 md:py-20 relative z-10 flex-grow">
        <motion.div
          animate={{
            opacity: viewMode === "cinema" ? 0 : 1,
            height: viewMode === "cinema" ? 0 : "auto",
            overflow: "hidden",
            marginBottom: viewMode === "cinema" ? 0 : undefined,
          }}
          transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          onAnimationComplete={() => {
            // Recién aquí el header terminó de colapsar (toggle manual a modo
            // cine); antes de esto el panel todavía no está en su posición
            // final, así que hacer scroll antes dejaría la vista descuadrada.
            if (viewMode === "cinema") {
              window.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
        >
          {/* Header */}
          <section className="text-center space-y-4 mb-12 relative select-none">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] block"
          >
            <T en="Interactive Showcase">Galería Interactiva de Diseño y Desarrollo</T>
          </motion.div>
          
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter max-w-4xl mx-auto leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
            <T
              en={
                <>
                  Creative <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    Portfolio
                  </span>
                </>
              }
            >
              Nuestro <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                Portafolio
              </span>
            </T>
          </h1>
          
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
            <T en="Explore a selection of concepts, interfaces, and functional prototypes created to demonstrate the scope of our development and visual design.">
              Explora una selección de conceptos, interfaces y prototipos
              funcionales creados para demostrar el alcance de nuestro desarrollo y
              diseño visual.
            </T>
          </p>
          <p className="text-[var(--color-text-tertiary)] text-xs font-medium max-w-xl mx-auto">
            <T en="Demonstration projects — client portfolio coming soon">
              Proyectos de demostración — portafolio de clientes próximamente
            </T>
          </p>
        </section>

        {/* Filters/Search Control Deck & View Switcher */}
        <div className="bg-[var(--color-surface-elevated)] p-4 rounded-3xl border border-[var(--color-border-subtle)] backdrop-blur-md shadow-lg space-y-4 mb-10">
          
          <div className="flex flex-col lg:flex-row gap-4 items-center justify-between">
            {/* Search Input */}
            <div className="relative w-full lg:max-w-xs">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] w-4 h-4" />
              <input
                type="text"
                placeholder={language === "es" ? "Buscar por proyecto o tecnología..." : "Search project or tech..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)]/25 focus:border-[var(--color-primary-base)]"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* View Mode Switcher (Bento vs Cinema) */}
            <div className="flex bg-[var(--color-surface-base)] p-1 rounded-xl border border-[var(--color-border-subtle)] w-full sm:w-auto">
              <button
                onClick={() => setViewMode("bento")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${
                  viewMode === "bento"
                    ? "bg-[var(--color-primary-base)] text-[var(--color-on-primary)] shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <Grid size={14} />
                <T en="Bento Grid">Mosaico Bento</T>
              </button>
              <button
                onClick={() => setViewMode("cinema")}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all flex-1 justify-center ${
                  viewMode === "cinema"
                    ? "bg-[var(--color-primary-base)] text-[var(--color-on-primary)] shadow-md"
                    : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                }`}
              >
                <CirclePlay size={14} />
                <T en="Story Mode">Modo Historia</T>
              </button>
            </div>
          </div>

          {/* Tag filters block */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[var(--color-border-subtle)]/50">
            {/* Plan filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[var(--color-text-tertiary)] tracking-wider mr-2">
                <T en="Scale Plan:">Paquete de Escala:</T>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {plans.map((plan) => (
                  <button
                    key={plan}
                    onClick={() => setSelectedPlan(plan)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedPlan === plan
                        ? plan === "Nova"
                          ? "bg-purple-500/15 text-purple-400 border border-purple-500/35"
                          : plan === "Destello"
                            ? "bg-amber-500/15 text-amber-500 border border-amber-500/35"
                            : "bg-indigo-500/15 text-indigo-400 border border-indigo-500/35"
                        : "bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {plan === "ALL"
                      ? (language === "es" ? "Todos los Paquetes" : "All Plans")
                      : (language === "es" ? `Paquete ${plan}` : `Plan ${plan}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[var(--color-text-tertiary)] tracking-wider mr-2">
                <T en="Industry:">Industria:</T>
              </span>
              <div className="flex flex-wrap gap-1.5">
                {availableTypes.map((type) => (
                  <button
                    key={type}
                    onClick={() => setSelectedType(type)}
                    className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      selectedType === type
                        ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/35"
                        : "bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] border border-[var(--color-border-subtle)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {type === "ALL" ? (language === "es" ? "Todas las Áreas" : "All Industries") : type}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        </motion.div>

        {/* Empty Search Result Warning */}
        {filteredProjects.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20 px-6 rounded-3xl border border-dashed border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] max-w-lg mx-auto"
          >
            <Info size={32} className="text-indigo-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">
              <T en="No projects match filters">Sin resultados de búsqueda</T>
            </h3>
            <p className="text-[var(--color-text-secondary)] text-sm mb-6">
              <T en="Try selecting other metrics, cleaning the search query, or resetting filters.">
                Prueba buscando otro término de tecnología, o restablece los filtros haciendo clic abajo.
              </T>
            </p>
            <button
              onClick={() => {
                setSearchQuery("");
                setSelectedPlan("ALL");
                setSelectedType("ALL");
              }}
              className="px-5 py-2 rounded-xl text-xs font-bold bg-[var(--color-primary-base)] text-white hover:scale-105 transition-all"
            >
              <T en="Reset Filters">Restaurar Filtros</T>
            </button>
          </motion.div>
        )}

        {/* 1. VIEW MODE: BENTO GRID */}
        {viewMode === "bento" && filteredProjects.length > 0 && (
          <motion.div
            layout
            className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[minmax(550px,auto)] pb-24"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, i) => (
                <motion.div
                  key={project.slug}
                  layout
                  // Sin "scale" en initial/animate/exit a propósito -- esta
                  // tarjeta es ancestro (varios niveles arriba) del <video>
                  // del mockup, que recorta sus propias esquinas con
                  // overflow-hidden + border-radius. Framer Motion deja un
                  // transform inline permanente (incluso en scale:1 de
                  // reposo, tras terminar la animación de entrada) que,
                  // como ancestro de CUALQUIER descendiente con
                  // overflow-hidden + border-radius, rompe el redondeo de
                  // esquinas en WebKit/iOS real -- confirmado en vivo:
                  // ningún fix aplicado directo sobre el <video> (mask,
                  // clip-path) funcionó mientras esta tarjeta seguía
                  // animando scale. Mismo bug ya documentado más abajo para
                  // el wrapper de hover -- acá la causa real estaba en este
                  // nivel, no en el <video> mismo.
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-[var(--radius-bento)] p-6 lg:p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col group overflow-hidden relative bento-glow-hover transition-colors duration-500 ${
                    i === filteredProjects.length - 1 && filteredProjects.length % 2 !== 0 ? "md:col-span-2" : ""
                  } ${
                    // El mockup interactivo crece de alto real al cambiar a
                    // vista Mobile (aspecto de celular, mucho más angosto y
                    // alto que el 16:9 de escritorio) -- pedido explícito del
                    // usuario ("el div debería alargarse al cambiar de
                    // vista"). self-start saca esta tarjeta puntual del
                    // stretch por default del grid, así solo ella crece con
                    // su propio contenido sin forzar a las demás tarjetas
                    // (que sí quedan uniformes a 550px) a estirarse también.
                    // Bug real encontrado en vivo: con el prefijo "md:" esto
                    // nunca se activaba en mobile (<768px, donde igual el
                    // grid es de 1 columna) -- la tarjeta se quedaba pegada
                    // a los 550px del grid aunque el mockup necesitara
                    // mucho menos, dejando ese sobrante como espacio vacío
                    // real dentro del propio borde de la tarjeta.
                    hasMockupContent(project.slug) ? "self-start" : ""
                  }`}
                >
                  {/* Decorative faint background glow */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none z-0`}
                  />

                  {/* Header metadata */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                      <div
                        className={`text-[10px] font-black uppercase tracking-[0.2em] flex flex-col leading-none ${
                          project.plan === "Destello"
                            ? "text-amber-500"
                            : project.plan === "Constelación"
                              ? "text-indigo-400"
                              : "text-purple-400"
                        }`}
                      >
                        <span>
                          <T en="Plan">Paquete</T>
                        </span>
                        <span className="mt-[2px]">
                          <T en={project.planEN || project.plan}>{project.plan}</T>
                        </span>
                      </div>
                      <p className="text-[var(--color-text-tertiary)] text-[10px] font-black uppercase tracking-widest leading-none pt-0.5">
                        <T en={project.typeEN || project.type}>{project.type}</T>
                      </p>
                    </div>

                    <div className="flex gap-2 items-center">
                      {project.isConcept && (
                        <span className="px-3 py-1 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-full text-[9px] font-extrabold text-[var(--color-text-tertiary)] uppercase tracking-wider leading-none">
                          <T en="Demo">Demo</T>
                        </span>
                      )}
                      
                      {/* Live site and arrow buttons */}
                      {project.liveUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.liveUrl, "_blank");
                          }}
                          className="p-2.5 rounded-full bg-indigo-500 text-white hover:bg-indigo-400 hover:scale-110 transition-all cursor-pointer shadow-md shadow-indigo-500/30"
                          title={language === "es" ? "Ver sitio en vivo" : "View live site"}
                        >
                          <ExternalLink size={16} />
                        </button>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProjectForQuickView(project);
                        }}
                        className="p-2.5 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-purple-400 hover:border-purple-400/30 transition-all cursor-pointer shadow-sm"
                        title={language === "es" ? "Lectura Completa Caso de Estudio" : "Read Case Study"}
                      >
                        <Info size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Title & Stats */}
                  <div className="relative z-10 pt-4 flex flex-col gap-3">
                    <div className="flex gap-2 items-center flex-wrap">
                      <span className="px-2.5 py-0.5 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-md text-[9px] font-black uppercase tracking-widest flex items-center">
                        <Star size={9} className="inline mr-1 text-indigo-400" />
                        <T en={project.keyResultEN || project.keyResult}>{project.keyResult}</T>
                      </span>
                    </div>

                    <h3 className="text-3xl md:text-4xl font-display font-black tracking-tighter text-[var(--color-text-primary)] group-hover:text-indigo-400 transition-colors duration-300">
                      {project.title}
                    </h3>

                    <p className="text-[var(--color-text-secondary)] text-xs md:text-sm max-w-md line-clamp-2 leading-relaxed">
                      <T en={project.shortDescEN || project.shortDesc}>
                        {project.shortDesc}
                      </T>
                    </p>
                  </div>

                  {/* Technology Tags footer inside card */}
                  <div className="relative z-10 flex flex-wrap gap-1.5 mt-3">
                    {project.techStack.slice(0, 3).map((tech) => (
                      <span
                        key={tech}
                        className="px-2 py-0.5 rounded bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] text-[10px] font-bold border border-[var(--color-border-subtle)]"
                      >
                        {tech}
                      </span>
                    ))}
                    {project.techStack.length > 3 && (
                      <span className="px-2 py-0.5 rounded bg-[var(--color-surface-base)] text-[var(--color-text-tertiary)] text-[10px] font-black">
                        +{project.techStack.length - 3}
                      </span>
                    )}
                  </div>

                  {/* Mockup Frame presentation con escala responsiva.
                      OJO: el transform de hover (group-hover:-translate-y-2) va
                      en un wrapper EXTERIOR sin overflow-hidden/rounded -- en
                      WebKit/iOS, un elemento con overflow-hidden + border-radius
                      que ADEMÁS tiene (o transiciona) un transform puede perder
                      el redondeo de las esquinas por completo. El div interior
                      (p-2, rounded-2xl, overflow-hidden) nunca se mueve, solo
                      recorta -- así el clip y el transform quedan separados. */}
                  <div className="relative z-10 w-full mt-6 transition-transform duration-500 group-hover:-translate-y-2 flex-grow flex flex-col">
                    {/* Sin opacity-90 en reposo -- ese "se aclara" de la
                        tarjeta antes de pasar el mouse era intencional para
                        mouse/hover real, pero en touch (donde no existe un
                        :hover real) se quedaba SIEMPRE atenuado -- el
                        usuario lo notó comparando este mockup (más claro)
                        contra el mismo mockup en ProjectDetail.tsx (sin
                        este atenuado, se ve más oscuro/nítido). Sacado del
                        todo para que ambas vistas se vean iguales. */}
                    <div className="w-full h-full p-2 rounded-2xl overflow-hidden flex-grow flex flex-col transition-opacity duration-500 border border-[var(--color-border-subtle)] bg-transparent">
                      <ProjectScreenshot project={project} fillParent />
                    </div>
                  </div>

                  {/* Click to open full details banner on hover */}
                  <div
                    onClick={() => navigate(`/portafolio/${project.slug}`)}
                    className="absolute bottom-0 inset-x-0 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider py-3.5 text-center flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 cursor-pointer z-20"
                  >
                    <span><T en="Explore Technical Breakdown">Análisis del Caso de Estudio</T></span>
                    <ArrowRight size={14} />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* 2. VIEW MODE: STORY (antes "Modo Cine") */}
        {/* Segundo rediseño real, pedido explícito del usuario ("reemplazá
            el modo cine por algo más interesante"): el panel estático de
            dos columnas (aunque ya sin el overlay negro del primer
            rediseño) seguía sin sentirse distinto a cualquier otra sección
            del sitio. Formato nuevo tipo Instagram/TikTok Stories --
            pantalla completa, 3 "slides" por proyecto (mockup /
            resultados / stack+CTA) con barra de progreso segmentada y
            navegación por toques en los bordes, en vez de un layout fijo
            de texto+mockup lado a lado. Renderizado vía portal a
            document.body (mismo patrón que el modal de Vista Rápida más
            abajo) para no depender del stacking context de <main>. */}
        {ReactDOM.createPortal(
          <AnimatePresence>
            {viewMode === "cinema" && filteredProjects.length > 0 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 z-[90] bg-[var(--color-surface-base)] flex flex-col"
              >
                {/* Barra de progreso segmentada (una franja por slide) +
                    cerrar. idx < storySlide: completado (lleno). idx ===
                    storySlide: se rellena en vivo con storyProgress (0-1),
                    animado vía rAF -- mismo efecto visual que Instagram.
                    idx > storySlide: vacío. */}
                <div className="shrink-0 px-4 pt-4 flex items-center gap-3">
                  <div className="flex-1 flex gap-1.5">
                    {Array.from({ length: STORY_SLIDE_COUNT }).map((_, i) => (
                      <div
                        key={i}
                        className="flex-1 h-1 rounded-full bg-[var(--color-border-subtle)] overflow-hidden"
                      >
                        <div
                          className="h-full rounded-full"
                          style={{
                            width:
                              i < storySlide
                                ? "100%"
                                : i === storySlide
                                ? `${storyProgress * 100}%`
                                : "0%",
                            backgroundColor: "var(--cinema-color, #6366f1)",
                          }}
                        />
                      </div>
                    ))}
                  </div>
                  {/* Toggle Desktop/Mobile del mockup -- pedido explícito
                      del usuario para que viva junto al botón de "siguiente
                      proyecto" en la barra superior, en vez de arriba del
                      mockup. Solo aplica al slide 0 (el del mockup). */}
                  {storySlide === 0 && (
                    <div className="flex bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-full p-1 gap-0.5">
                      <button
                        onClick={() => setStoryView("desktop")}
                        className="p-1.5 rounded-full transition-all cursor-pointer"
                        style={{
                          color: storyView === "desktop" ? "white" : "var(--color-text-tertiary)",
                          backgroundColor: storyView === "desktop" ? "var(--cinema-color, #6366f1)" : "transparent",
                        }}
                        aria-label={translate("Ver vista de escritorio", "View desktop preview")}
                        title={translate("Vista de escritorio", "Desktop view")}
                      >
                        <Monitor size={14} />
                      </button>
                      <button
                        onClick={() => setStoryView("mobile")}
                        className="p-1.5 rounded-full transition-all cursor-pointer"
                        style={{
                          color: storyView === "mobile" ? "white" : "var(--color-text-tertiary)",
                          backgroundColor: storyView === "mobile" ? "var(--cinema-color, #6366f1)" : "transparent",
                        }}
                        aria-label={translate("Ver vista móvil", "View mobile preview")}
                        title={translate("Vista móvil", "Mobile view")}
                      >
                        <Smartphone size={14} />
                      </button>
                    </div>
                  )}
                  {/* Abre el sitio en vivo del proyecto en una pestaña nueva --
                      pedido explícito del usuario para que viva en la barra
                      superior, donde antes estaba el botón de reinicio (ese
                      se movió junto a las flechas de navegación, abajo).
                      Relleno completo (no solo ícono/borde) con el
                      --cinema-color real del proyecto activo -- mismo valor
                      que ya tiñe el toggle desktop/mobile en su estado
                      activo (mismo patrón: fondo sólido + texto blanco +
                      sombra a juego), así que este botón no rompe la
                      paleta cuando se cambia de proyecto. */}
                  {currentCinemaProject.liveUrl && (
                    <button
                      onClick={() => window.open(currentCinemaProject.liveUrl, "_blank")}
                      className="p-2 rounded-full text-white cursor-pointer transition-colors"
                      style={{
                        backgroundColor: "var(--cinema-color, #6366f1)",
                        boxShadow: `0 2px 8px rgba(var(--cinema-color-rgb, 99, 102, 241), 0.45)`,
                      }}
                      aria-label={translate("Ver proyecto en vivo", "View live project")}
                      title={translate("Ver proyecto en vivo", "View live project")}
                    >
                      <ExternalLink size={16} />
                    </button>
                  )}
                  {/* Salta directo al proyecto anterior -- pedido explícito
                      del usuario, mismo criterio que "Siguiente proyecto"
                      (SkipForward) pero hacia atrás, no el slide anterior
                      dentro del mismo proyecto (eso ya lo cubren las
                      flechas de abajo). */}
                  <button
                    onClick={handlePrevCinema}
                    className="p-2 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    aria-label={translate("Proyecto anterior", "Previous project")}
                    title={translate("Proyecto anterior", "Previous project")}
                  >
                    <SkipBack size={18} />
                  </button>
                  <button
                    onClick={handleNextCinema}
                    className="p-2 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    aria-label={translate("Siguiente proyecto", "Next project")}
                    title={translate("Siguiente proyecto", "Next project")}
                  >
                    <SkipForward size={18} />
                  </button>
                  <button
                    onClick={() => setViewMode("bento")}
                    className="p-2 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] cursor-pointer"
                    aria-label={translate("Cerrar historia", "Close story")}
                  >
                    <X size={18} />
                  </button>
                </div>

                {/* Título + posición dentro de la lista de proyectos */}
                <div className="shrink-0 px-4 pt-3 flex items-center justify-between">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--color-text-secondary)]">
                    {currentCinemaProject.title}
                  </span>
                  <span className="text-[10px] font-bold text-[var(--color-text-tertiary)]">
                    {activeCinemaIndex + 1} / {cinemaProjects.length}
                  </span>
                </div>

                {/* Contenido del slide actual. Sin zonas de navegación
                    superpuestas -- las flechas ahora viven debajo del
                    mockup (ver más abajo) para no taparle nada al slide.
                    Transición tipo "cara de cubo": el slide saliente y el
                    entrante se animan a la vez (sin mode="wait"), cada uno
                    corriéndose horizontalmente según storyDirection -- así
                    ya se alcanza a ver el siguiente proyecto entrando
                    mientras el actual todavía está saliendo, como en
                    Instagram. */}
                <div
                  className="relative flex-1 min-h-0 overflow-hidden"
                  onTouchStart={handleStoryTouchStart}
                  onTouchEnd={handleStoryTouchEnd}
                >
                  <AnimatePresence custom={storyDirection} initial={false}>
                    <motion.div
                      key={`${currentCinemaProject.slug}-${storySlide}`}
                      custom={storyDirection}
                      variants={{
                        enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
                        center: { x: 0 },
                        exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
                      }}
                      initial="enter"
                      animate="center"
                      exit="exit"
                      transition={{ duration: 0.35, ease: [0.32, 0.72, 0, 1] }}
                      className="absolute inset-0 overflow-y-auto"
                    >
                      {storySlide === 0 && (
                        <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 md:p-10">
                          {/* El toggle Desktop/Mobile vive en la barra
                              superior, junto al botón de "siguiente
                              proyecto" (pedido explícito del usuario) --
                              storyView se controla desde ahí. */}
                          {/* Sin caja visible alrededor (ni fondo ni
                              borde) -- pedido explícito del usuario: se
                              veía como un contenedor de más rodeando el
                              video, en vez del video "flotando" sobre la
                              página como el resto de las slides. El alto
                              real (vh + tope en px, no aspect-ratio de CSS)
                              se mantiene -- es lo que corrigió el bug real
                              de Safari donde el video quedaba corrido hacia
                              un lado -- pero ya no se nota como caja porque
                              no tiene ni fondo ni borde propios; cornerBg
                              pasa a coincidir con el fondo real de la
                              slide (--color-surface-base), no con
                              --color-surface-elevated. */}
                          <div ref={storyBoxRef} className="relative w-full max-w-3xl h-[42vh] max-h-[500px]">
                            {storyView === "desktop" ? (
                              hasMockupContent(currentCinemaProject.slug) ? (
                                <div className="w-full h-full px-2">
                                  <MockupFrame type="browser" projectSlug={currentCinemaProject.slug} />
                                </div>
                              ) : currentCinemaProject.previewVideo ? (
                                <AutoResumeVideo
                                  ref={storyDesktopVideoRef}
                                  src={currentCinemaProject.previewVideo}
                                  poster={currentCinemaProject.previewPoster}
                                  cornerBg="var(--color-surface-base)"
                                  aspectRatio="1200/750"
                                  ariaLabel={`${currentCinemaProject.title} Desktop`}
                                />
                              ) : currentCinemaProject.desktopImg ? (
                                <img
                                  src={currentCinemaProject.desktopImg}
                                  alt={`${currentCinemaProject.title} Desktop`}
                                  className="w-full h-full object-contain"
                                />
                              ) : (
                                <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)]">
                                  <Monitor size={28} />
                                </div>
                              )
                            ) : hasMockupContent(currentCinemaProject.slug) ? (
                              (() => {
                                const mobileScale = Math.min(1, Math.max(0, (storyBoxHeight - 16)) / 580);
                                return (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <div style={{ width: 280 * mobileScale, height: 580 * mobileScale }}>
                                      <div
                                        style={{
                                          width: 280,
                                          height: 580,
                                          transform: `scale(${mobileScale})`,
                                          transformOrigin: "top left",
                                        }}
                                      >
                                        <MockupFrame type="mobile" projectSlug={currentCinemaProject.slug} />
                                      </div>
                                    </div>
                                  </div>
                                );
                              })()
                            ) : currentCinemaProject.mobileVideo ? (
                              <AutoResumeVideo
                                ref={storyMobileVideoRef}
                                src={currentCinemaProject.mobileVideo}
                                poster={currentCinemaProject.mobilePoster}
                                cornerBg="var(--color-surface-base)"
                                aspectRatio="560/1212"
                                maxWidthPx={260}
                                ariaLabel={`${currentCinemaProject.title} Mobile`}
                              />
                            ) : currentCinemaProject.mobileImg ? (
                              <img
                                src={currentCinemaProject.mobileImg}
                                alt={`${currentCinemaProject.title} Mobile`}
                                className="h-full w-auto max-w-[260px] object-contain mx-auto"
                              />
                            ) : (
                              <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[var(--color-text-tertiary)]">
                                <Smartphone size={28} />
                              </div>
                            )}
                          </div>
                          <div className="text-center space-y-2 max-w-xl">
                            <span
                              className={`inline-block px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
                                currentCinemaProject.plan === "Nova"
                                  ? "bg-violet-500/10 border-violet-500/30 text-violet-400"
                                  : currentCinemaProject.plan === "Constelación"
                                  ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                                  : "bg-amber-500/10 border-amber-500/30 text-amber-400"
                              }`}
                            >
                              <T en={currentCinemaProject.planEN ? `Package ${currentCinemaProject.planEN}` : (currentCinemaProject.plan ? `Package ${currentCinemaProject.plan}` : "")}>
                                {currentCinemaProject.plan ? `Paquete ${currentCinemaProject.plan}` : ""}
                              </T>
                            </span>
                            <h2 className="text-3xl md:text-5xl font-display font-black tracking-tighter text-[var(--color-text-primary)] leading-none">
                              {currentCinemaProject.title}
                            </h2>
                            <p className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed">
                              <T en={currentCinemaProject.shortDescEN || currentCinemaProject.shortDesc}>
                                {currentCinemaProject.shortDesc}
                              </T>
                            </p>
                          </div>
                        </div>
                      )}

                      {storySlide === 1 && (
                        <div className="min-h-full flex flex-col items-center justify-center gap-6 p-6 md:p-10">
                          <div className="w-full max-w-md rounded-2xl p-6 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] space-y-3">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] pb-2 border-b border-[var(--color-border-subtle)]">
                              <T en="Key Results">Resultados Clave</T>
                            </h4>
                            {currentCinemaProject.results.map((res, idx) => (
                              <div
                                key={idx}
                                className="flex justify-between items-center text-sm py-1.5 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0"
                              >
                                <span className="font-bold text-[var(--color-text-secondary)]">
                                  <T en={res.labelEN || res.label}>{res.label}</T>
                                </span>
                                <span className="font-black text-base" style={{ color: "var(--cinema-color)" }}>
                                  <T en={res.valueEN || res.value}>{res.value}</T>
                                </span>
                              </div>
                            ))}
                          </div>
                          <p className="text-[var(--color-text-secondary)] text-sm text-center max-w-md">
                            <T en={currentCinemaProject.shortDescEN || currentCinemaProject.shortDesc}>
                              {currentCinemaProject.shortDesc}
                            </T>
                          </p>
                        </div>
                      )}

                      {storySlide === 2 && (
                        <div className="min-h-full flex flex-col items-center justify-center gap-8 p-6 md:p-10">
                          <div className="space-y-3 text-center">
                            <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                              <T en="Engine Technologies">Tecnologías Principales:</T>
                            </p>
                            <div className="flex flex-wrap gap-1.5 justify-center max-w-md">
                              {currentCinemaProject.techStack.map((tech) => (
                                <span
                                  key={tech}
                                  className="px-2.5 py-1 rounded border text-[10px] font-bold bg-[var(--color-surface-elevated)] border-[var(--color-border-strong)]"
                                  style={{ color: `var(--cinema-color)` }}
                                >
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>

                          <div className="flex flex-col gap-3 w-full max-w-xs">
                            <button
                              onClick={() => navigate(`/portafolio/${currentCinemaProject.slug}`)}
                              className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <T en="See Case Study">Ver Caso de Estudio</T>
                              <ArrowRight size={14} />
                            </button>
                            <button
                              onClick={() => setSelectedProjectForQuickView(currentCinemaProject)}
                              className="px-5 py-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                            >
                              <T en="Quick Specs">Vista Rápida</T>
                            </button>
                            {currentCinemaProject.liveUrl && (
                              <button
                                onClick={() => window.open(currentCinemaProject.liveUrl, "_blank")}
                                className="px-5 py-3 rounded-xl bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-indigo-400 cursor-pointer flex items-center justify-center gap-1.5 text-xs font-black uppercase tracking-wider"
                              >
                                <T en="View Live Site">Ver Sitio en Vivo</T>
                                <ExternalLink size={14} />
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Flechas de navegación -- pedido explícito del usuario:
                    antes vivían superpuestas a los bordes del contenido y
                    tapaban el mockup; ahora van en su propia franja debajo
                    del contenido, sin superponerse a nada. El swipe sigue
                    funcionando igual desde el área de contenido. */}
                <div className="shrink-0 flex items-center justify-center gap-6 py-3">
                  <button
                    onClick={handleStoryPrev}
                    className="p-2.5 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:scale-110 transition-all cursor-pointer"
                    aria-label={translate("Anterior", "Previous")}
                  >
                    <ChevronLeft size={22} strokeWidth={2} />
                  </button>
                  {/* Reinicia con fade el <video> del slide 0 -- solo si la
                      vista activa es un video real, mismo criterio que en
                      ProjectScreenshot/ProjectDetail.tsx. Pedido explícito
                      del usuario: vive acá, entre las dos flechas, en vez
                      de en la barra superior. */}
                  {storySlide === 0 &&
                    !hasMockupContent(currentCinemaProject.slug) &&
                    ((storyView === "desktop" && currentCinemaProject.previewVideo) ||
                      (storyView === "mobile" && currentCinemaProject.mobileVideo)) && (
                      <button
                        onClick={() => {
                          (storyView === "desktop" ? storyDesktopVideoRef : storyMobileVideoRef).current?.restart();
                          setStoryRestartIconRotation((r) => r - 360);
                        }}
                        className="p-2.5 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:scale-110 transition-all cursor-pointer"
                        aria-label={translate("Reiniciar video", "Restart video")}
                        title={translate("Reiniciar video", "Restart video")}
                      >
                        <motion.span
                          className="flex"
                          animate={{ rotate: storyRestartIconRotation }}
                          transition={{ duration: 0.5, ease: "easeInOut" }}
                        >
                          <RotateCcw size={22} strokeWidth={2} />
                        </motion.span>
                      </button>
                    )}
                  <button
                    onClick={handleStoryNext}
                    className="p-2.5 rounded-full bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:scale-110 transition-all cursor-pointer"
                    aria-label={translate("Siguiente", "Next")}
                  >
                    <ChevronRight size={22} strokeWidth={2} />
                  </button>
                </div>

                {/* Dots de proyecto (salto directo entre historias) */}
                <div className="shrink-0 flex gap-1.5 justify-center py-4">
                  {cinemaProjects.map((proj, idx) => (
                    <button
                      key={proj.slug}
                      onClick={() => goToCinemaProject(idx)}
                      className={`h-2 rounded-full transition-all cursor-pointer ${
                        idx === activeCinemaIndex ? "w-6" : "w-2 bg-gray-700 hover:bg-gray-500"
                      }`}
                      style={{
                        backgroundColor: idx === activeCinemaIndex ? "var(--cinema-color)" : undefined,
                      }}
                      title={proj.title}
                    />
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Case Study Detail Quick view Modal */}
        {/* Renderizado vía portal a document.body: <main> es z-10 y crea su propio
            stacking context, así que un z-index alto puesto adentro (incluso z-50)
            nunca podía superar al Navbar (z-50 pero fuera de <main>) -- el modal
            quedaba atrapado detrás y su botón de cerrar no recibía los clicks.
            El portal va POR FUERA de AnimatePresence: si se devuelve un portal
            como hijo directo de AnimatePresence, framer-motion lo descarta al
            enumerar sus hijos y el modal no llega a montarse. */}
        {ReactDOM.createPortal(
          <AnimatePresence>
            {selectedProjectForQuickView && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              {/* Blur backdrop overlay */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedProjectForQuickView(null)}
                className="absolute inset-0 bg-black/75 backdrop-blur-sm"
              />

              {/* Modal Container */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-strong)] rounded-3xl w-full max-w-4xl p-6 md:p-8 overflow-y-auto max-h-[85vh] relative z-10 shadow-2xl space-y-8"
              >
                {/* Close Button top right */}
                <button
                  onClick={() => setSelectedProjectForQuickView(null)}
                  className="absolute top-4 right-4 p-2 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-white cursor-pointer transition-all"
                  aria-label={translate("Cerrar detalles", "Close details")}
                >
                  <X size={18} />
                </button>

                {/* Grid header inside Modal */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
                  
                  {/* Left Column: Metrics & Specs */}
                  <div className="md:col-span-8 space-y-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="px-3 py-1 text-[10px] font-black uppercase text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                          {language === "es" ? "Paquete" : "Plan"} {selectedProjectForQuickView.plan}
                        </span>
                        <span className="text-[10px] font-black uppercase text-[var(--color-text-tertiary)]">
                          <T en={selectedProjectForQuickView.typeEN || selectedProjectForQuickView.type}>
                            {selectedProjectForQuickView.type}
                          </T>
                        </span>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-display font-black tracking-tight text-[var(--color-text-primary)] leading-tight">
                        {selectedProjectForQuickView.title}
                      </h2>
                      <p className="text-[var(--color-text-secondary)] text-sm leading-relaxed">
                        <T en={selectedProjectForQuickView.contextEN || selectedProjectForQuickView.context}>
                          {selectedProjectForQuickView.context}
                        </T>
                      </p>
                    </div>

                    {/* Challenge & Solution details */}
                    <div className="space-y-4 pt-4 border-t border-[var(--color-border-subtle)]">
                      <div className="p-4 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)]">
                        <h4 className="font-extrabold uppercase text-[9px] tracking-[0.2em] text-red-500 mb-1">
                          <T en="Technical Challenge">Desafío Técnico</T>
                        </h4>
                        <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed italic border-l-2 border-red-500/30 pl-3">
                          "
                          <T en={selectedProjectForQuickView.challengeEN || selectedProjectForQuickView.challenge}>
                            {selectedProjectForQuickView.challenge}
                          </T>
                          "
                        </p>
                      </div>

                      <div className="p-4 rounded-xl bg-[var(--color-surface-base)] border border-indigo-500/20">
                        <h4 className="font-extrabold uppercase text-[9px] tracking-[0.2em] text-indigo-400 mb-1">
                          <T en="Studio Development Solution">Solución Web Aplicada</T>
                        </h4>
                        <p className="text-[var(--color-text-primary)] text-xs leading-relaxed">
                          <T en={selectedProjectForQuickView.solutionEN || selectedProjectForQuickView.solution}>
                            {selectedProjectForQuickView.solution}
                          </T>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Technologies & Metrics Box inside Modal */}
                  <div className="md:col-span-4 space-y-6">
                    
                    {/* Key Metric Indicators box */}
                    <div className="p-5 rounded-2xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                        <Trophy size={12} className="text-amber-500" />
                        <T en="Key Results">Resultados Clave</T>
                      </h4>
                      
                      <div className="space-y-3 pt-2">
                        {selectedProjectForQuickView.results.map((res, i) => (
                          <div key={i} className="flex flex-col border-b border-[var(--color-border-subtle)]/70 pb-3 last:border-0 last:pb-0 gap-0.5">
                            <span className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase">
                              <T en={res.labelEN || res.label}>{res.label}</T>
                            </span>
                            <span className="text-base font-display font-black text-indigo-400">
                              <T en={res.valueEN || res.value}>{res.value}</T>
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Technologies list */}
                    <div className="space-y-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)]">
                        <T en="Stack & Frameworks">Herramientas & Frameworks</T>
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedProjectForQuickView.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2.5 py-1 rounded bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[10px] font-bold text-[var(--color-text-secondary)]"
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Quick navigation and Booking trigger */}
                    <div className="space-y-2 pt-4">
                      <button
                        onClick={() => {
                          setSelectedProjectForQuickView(null);
                          navigate(`/portafolio/${selectedProjectForQuickView.slug}`);
                        }}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider text-center transition-all flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <T en="Read Full Case Study">Ver Caso Completo</T>
                        <ArrowUpRight size={14} />
                      </button>

                      <button
                        onClick={() => {
                          setSelectedProjectForQuickView(null);
                          navigate("/cotizar");
                        }}
                        className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs uppercase tracking-wider text-center transition-all cursor-pointer"
                      >
                        <T en="Quote Similar Project">Cotizar Proyecto Similar</T>
                      </button>
                    </div>

                  </div>
                </div>
              </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* CTA Footer Section */}
        <section className="mt-28 text-center space-y-10">
          <h2 className="text-4xl md:text-7xl font-display font-black tracking-tighter leading-none bg-gradient-to-r from-blue-500 to-indigo-500 bg-clip-text text-transparent">
            <T en="Is your project next?">¿Tu proyecto es el siguiente?</T>
          </h2>
          <p className="text-[var(--color-text-secondary)] max-w-lg mx-auto text-sm sm:text-base">
            <T en="Let's build a secure, hyper-optimized web platform with real-time sync, custom styles, and strict TypeScript logic. Get a budget in 3 minutes.">
              Construyamos una plataforma web ultra-optimizada con sincronización en tiempo real, diseño minimalista moderno y lógica robusta tipada. Obtén tu presupuesto en 3 minutos.
            </T>
          </p>
          <button
            onClick={() => navigate("/cotizar")}
            className="px-10 py-5 rounded-2xl bg-[var(--color-primary-base)] text-[var(--color-on-primary)] font-black text-xl hover:scale-105 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-500/10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[var(--color-primary-base)]/50 cursor-pointer inline-flex items-center gap-2"
          >
            <T en="Plan your project">Planifica tu proyecto</T>
            <ArrowRight size={20} />
          </button>
        </section>
      </main>

      <Footer />
    </div>
  );
}
