import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Globe,
  ArrowUpRight,
  ExternalLink,
  Code,
  Search,
  Grid,
  Film,
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
  Smartphone
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { projects, Project } from "../constants/projects";
import { T, useLanguage } from "../context/LanguageContext";

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

function ProjectScreenshot({ project, onExit }: { project: Project; onExit?: () => void }) {
  const [view, setView] = useState<"desktop" | "mobile">("desktop");
  const [windowWidth, setWindowWidth] = React.useState(typeof window !== "undefined" ? window.innerWidth : 1024);

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Preload desktop and mobile images automatically
  React.useEffect(() => {
    const desktop = new Image();
    if (project.desktopImg) desktop.src = project.desktopImg;
    const mobile = new Image();
    if (project.mobileImg) mobile.src = project.mobileImg;
  }, [project.desktopImg, project.mobileImg]);

  let targetHeight = 220;
  if (view === "mobile") {
    targetHeight = windowWidth >= 1024 ? 560 : (windowWidth >= 768 ? 480 : 320);
  } else {
    targetHeight = windowWidth >= 1024 ? 460 : (windowWidth >= 768 ? 380 : 200);
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Premium minimal floating HUD Bar above mockup */}
      <div className="flex items-center justify-between w-full px-1">
        {/* Device selection tabs with matching styling cues */}
        <div className="flex bg-[var(--color-surface-base)]/80 backdrop-blur-sm border border-[var(--color-border-subtle)] rounded-full p-1 shadow-sm gap-0.5">
          <button
            onClick={() => setView("desktop")}
            className="p-1.5 rounded-full transition-all cursor-pointer"
            style={{
              color: view === "desktop" ? "var(--cinema-color)" : "var(--color-text-tertiary)",
              backgroundColor: view === "desktop" ? `rgba(var(--cinema-color-rgb), 0.15)` : "transparent"
            }}
          >
            <Monitor size={13} />
          </button>
          <button
            onClick={() => setView("mobile")}
            className="p-1.5 rounded-full transition-all cursor-pointer"
            style={{
              color: view === "mobile" ? "var(--cinema-color)" : "var(--color-text-tertiary)",
              backgroundColor: view === "mobile" ? `rgba(var(--cinema-color-rgb), 0.15)` : "transparent"
            }}
          >
            <Smartphone size={13} />
          </button>
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
        animate={{ 
          height: targetHeight
        }}
        transition={{ 
          duration: 0.4, 
          ease: [0.25, 0.46, 0.45, 0.94]
        }}
        className="relative w-full overflow-hidden rounded-xl bg-transparent"
      >
        {/* Concurrent image container with modern GPU crossfade transitions */}
        <div className="w-full h-full relative flex items-center justify-center">
          {/* Desktop View Wrapper */}
          <motion.div
            initial={false}
            animate={{
              opacity: view === "desktop" ? 1 : 0,
              scale: view === "desktop" ? 1 : 0.96
            }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: view === "desktop" ? "auto" : "none" }}
          >
            {project.desktopImg ? (
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

          {/* Mobile View Wrapper */}
          <motion.div
            initial={false}
            animate={{
              opacity: view === "mobile" ? 1 : 0,
              scale: view === "mobile" ? 1 : 0.96
            }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="absolute inset-0 flex items-center justify-center"
            style={{ pointerEvents: view === "mobile" ? "auto" : "none" }}
          >
            {project.mobileImg ? (
              <img
                src={project.mobileImg}
                alt={`${project.title} Mobile`}
                className="h-full w-auto max-w-[260px] object-contain mx-auto bg-transparent"
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
  const { language } = useLanguage();

  // Search and Filter States
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>("ALL");
  const [selectedType, setSelectedType] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"bento" | "cinema">(() => readRestoredCinemaIndex() !== null ? "cinema" : "bento");

  // Cinema Showcase Slider State
  const [activeCinemaIndex, setActiveCinemaIndex] = useState(() => readRestoredCinemaIndex() ?? 0);
  const [direction, setDirection] = useState<1 | -1>(1);

  // Quick View Overlay State
  const [selectedProjectForQuickView, setSelectedProjectForQuickView] = useState<Project | null>(null);

  // Posición de scroll mientras está en modo cine, para que el overlay oscuro
  // se desvanezca gradualmente a medida que el usuario baja.
  const [cinemaScrollY, setCinemaScrollY] = useState(0);

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

  const handleNextCinema = () => {
    setDirection(1);
    setActiveCinemaIndex(prev => (prev + 1) % cinemaProjects.length);
  };

  const handlePrevCinema = () => {
    setDirection(-1);
    setActiveCinemaIndex(prev => (prev - 1 + cinemaProjects.length) % cinemaProjects.length);
  };

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
      // sessionStorage no disponible (modo privado, etc.) — no es crítico
    }
  }, [viewMode, currentCinemaProject]);

  // Si el modo cine se restauró al montar (usuario volviendo desde el caso
  // de estudio), no hay animación de colapso de header de por medio, así
  // que el scroll puede hacerse de inmediato.
  const cinemaPanelRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (viewMode === "cinema") {
      cinemaPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Rastrea el scroll mientras está en modo cine para desvanecer el overlay
  // oscuro a medida que el usuario avanza hacia la siguiente sección.
  useEffect(() => {
    if (viewMode !== "cinema") return;
    const handleScroll = () => setCinemaScrollY(window.scrollY);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [viewMode]);

  useEffect(() => {
    if (viewMode !== "cinema") {
      document.documentElement.style.removeProperty("--cinema-color");
      document.documentElement.style.removeProperty("--cinema-color-rgb");
      return;
    }
    const color = currentCinemaProject?.cinemaColor || "#6366f1";
    console.log("Cinema project:", currentCinemaProject?.slug, currentCinemaProject?.cinemaColor);
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
    <div className="min-h-screen flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden transition-colors duration-300">
      <Navbar />



      <AnimatePresence>
      </AnimatePresence>

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
              cinemaPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
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
                <Film size={14} />
                <T en="Cinema Mode">Sala Cinema</T>
              </button>
            </div>
          </div>

          {/* Tag filters block */}
          <div className="flex flex-col gap-3 pt-2 border-t border-[var(--color-border-subtle)]/50">
            {/* Plan filter */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase text-[var(--color-text-tertiary)] tracking-wider mr-2">
                <T en="Scale Plan:">Plan de Escala:</T>
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
                    {plan === "ALL" ? (language === "es" ? "Todos los Planes" : "All Plans") : `Plan ${plan}`}
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
                        ? type === "ALL"
                          ? "bg-indigo-500/15 text-indigo-400 border border-indigo-500/35"
                          : "bg-purple-500/15 text-purple-400 border border-purple-500/35"
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
            className="grid grid-cols-1 md:grid-cols-2 gap-6 auto-rows-[550px] pb-24"
          >
            <AnimatePresence mode="popLayout">
              {filteredProjects.map((project, i) => (
                <motion.div
                  key={project.slug}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.92 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4 }}
                  className={`rounded-[var(--radius-bento)] p-6 lg:p-8 border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] flex flex-col group overflow-hidden relative bento-glow-hover transition-colors duration-500 ${
                    i === filteredProjects.length - 1 && filteredProjects.length % 2 !== 0 ? "md:col-span-2" : ""
                  }`}
                >
                  {/* Decorative faint background glow */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${project.color} opacity-[0.02] group-hover:opacity-[0.08] transition-opacity duration-700 pointer-events-none z-0`}
                  />

                  {/* Header metadata */}
                  <div className="relative z-10 flex justify-between items-start">
                    <div className="space-y-1">
                      <span
                        className={`text-[10px] font-black uppercase tracking-[0.2em] ${
                          project.plan === "Destello"
                            ? "text-amber-500"
                            : project.plan === "Constelación"
                              ? "text-indigo-400"
                              : "text-purple-400"
                        }`}
                      >
                        <T en={`Plan ${project.planEN || project.plan}`}>
                          Plan {project.plan}
                        </T>
                      </span>
                      <p className="text-[var(--color-text-tertiary)] text-[10px] font-black uppercase tracking-widest leading-none pt-0.5">
                        <T en={project.typeEN || project.type}>{project.type}</T>
                      </p>
                    </div>

                    <div className="flex gap-2 items-start">
                      {project.isConcept && (
                        <span className="px-3 py-1 bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-full text-[9px] font-extrabold text-[var(--color-text-tertiary)] uppercase tracking-wider leading-none">
                          <T en="Prototype">Demo Interactiva</T>
                        </span>
                      )}
                      
                      {/* Live site and arrow buttons */}
                      {project.liveUrl && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(project.liveUrl, "_blank");
                          }}
                          className="p-2.5 rounded-full bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-indigo-400 hover:border-indigo-400/30 transition-all cursor-pointer shadow-sm"
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

                  {/* Mockup Frame presentation with custom responsive scale */}
                  <div className="relative z-10 w-full mt-6 rounded-2xl overflow-hidden shadow-2xl transition-all duration-500 group-hover:-translate-y-2 flex-grow flex flex-col opacity-90 group-hover:opacity-100 border border-b-0 border-[var(--color-border-subtle)] bg-transparent">
                    <ProjectScreenshot project={project} />
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

        {/* 2. VIEW MODE: CINEMA SHOWCASE (The spectacular full scale theater) */}
        {/* Oscurece toda la pantalla (efecto "sala de cine"). Su opacidad está
            ligada al scroll (cinemaScrollY) para que se aclare gradualmente
            apenas el usuario empieza a bajar hacia la siguiente sección. */}
        <AnimatePresence>
          {viewMode === "cinema" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: Math.max(0, 1 - cinemaScrollY / 200) }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black z-10 pointer-events-none"
            />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {viewMode === "cinema" && filteredProjects.length > 0 && (
            <motion.div
              ref={cinemaPanelRef}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="relative scroll-mt-20"
            >
            <div className="relative z-20">
              <motion.div
                animate={{
                  paddingTop: viewMode === "cinema" ? "0" : "2rem",
                }}
                transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-[var(--color-surface-elevated)] p-6 md:p-10 rounded-[2.5rem] border border-[var(--color-border-subtle)] relative overflow-hidden shadow-2xl pb-16 z-20"
                >
            {/* Background glowing ball matched to project accent */}
            <div className={`absolute top-0 right-0 w-80 h-80 bg-gradient-to-br ${currentCinemaProject.color} opacity-10 blur-[130px] rounded-full pointer-events-none`} />

            {/* Vignette izquierda */}
            <div
              className="absolute left-0 top-0 h-full w-40 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to right, rgba(var(--cinema-color-rgb), 0.35), transparent)` }}
            />

            {/* Vignette derecha */}
            <div
              className="absolute right-0 top-0 h-full w-40 z-10 pointer-events-none"
              style={{ background: `linear-gradient(to left, rgba(var(--cinema-color-rgb), 0.35), transparent)` }}
            />

            {/* Vignette arriba */}
            <div className="absolute top-0 left-0 w-full h-16 bg-gradient-to-b from-black/30 to-transparent z-10 pointer-events-none" />

            {/* Vignette abajo */}
            <div className="absolute bottom-0 left-0 w-full h-16 bg-gradient-to-t from-black/30 to-transparent z-10 pointer-events-none" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
              
              {/* Left Column: Details */}
              <div className="lg:col-span-5 space-y-6 relative z-10 order-last lg:order-first">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentCinemaProject.slug + "-info"}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="space-y-6"
                  >
                    {/* Upper Badge Line */}
                    <div className="flex flex-wrap gap-2 items-center">
                      <span
                        className={`px-3 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest ${
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
                      <span className="text-[var(--color-text-tertiary)] text-[9px] font-black uppercase tracking-widest">
                        <T en={currentCinemaProject.typeEN || currentCinemaProject.type}>
                          {currentCinemaProject.type}
                        </T>
                      </span>
                    </div>

                    {/* Title */}
                    <h2 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-[var(--color-text-primary)] leading-none">
                      {currentCinemaProject.title}
                    </h2>

                    {/* Quick Pitch Description */}
                    <p className="text-[var(--color-text-secondary)] text-sm md:text-base leading-relaxed">
                      <T en={currentCinemaProject.shortDescEN || currentCinemaProject.shortDesc}>
                        {currentCinemaProject.shortDesc}
                      </T>
                    </p>

                    {/* Performance progress metrics in Cinema layout */}
                    <div className="rounded-2xl p-4 border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)] space-y-3 relative z-20">
                      <h4
                        className="text-[10px] font-black uppercase tracking-widest text-[var(--color-text-tertiary)] pb-2 border-b border-[var(--color-border-subtle)]"
                      >
                        <T en="Key Results">Resultados Clave</T>
                      </h4>
                      
                      {currentCinemaProject.results.map((res, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs py-1 border-b border-[var(--color-border-subtle)] last:border-0 last:pb-0"
                        >
                          <span className="font-bold text-[var(--color-text-secondary)]">
                            <T en={res.labelEN || res.label}>{res.label}</T>
                          </span>
                          <span
                            className="font-black text-sm"
                            style={{ color: "var(--cinema-color)" }}
                          >
                            <T en={res.valueEN || res.value}>{res.value}</T>
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Tech Stack List */}
                    <div className="space-y-2">
                      <p className="text-[9px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                        <T en="Engine Technologies">Tecnologías Principales:</T>
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {currentCinemaProject.techStack.map((tech) => (
                          <span
                            key={tech}
                            className="px-2 py-1 rounded border text-[10px] font-bold bg-[var(--color-surface-elevated)] border-[var(--color-border-strong)]"
                            style={{ color: `var(--cinema-color)` }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Panel */}
                    <div className="flex flex-wrap gap-3 pt-4 items-center">
                      <button
                        onClick={() => navigate(`/portafolio/${currentCinemaProject.slug}`)}
                        className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
                      >
                        <T en="See Case Study">Ver Caso de Estudio</T>
                        <ArrowRight size={14} />
                      </button>

                      <button
                        onClick={() => setSelectedProjectForQuickView(currentCinemaProject)}
                        className="px-5 py-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-black text-xs uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <T en="Quick Specs">Vista Rápida</T>
                      </button>

                      {currentCinemaProject.liveUrl && (
                        <button
                          onClick={() => window.open(currentCinemaProject.liveUrl, "_blank")}
                          className="p-3 rounded-xl bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)] hover:text-indigo-400 cursor-pointer"
                        >
                          <ExternalLink size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Right Column: Large Dynamic Interactive Mockup */}
              <div className="lg:col-span-7 flex justify-center items-center relative z-10">
                <div className="w-full max-w-[550px] relative">
                  
                  {/* Mockup Frame presentation with custom responsive scale */}
                  <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                      key={currentCinemaProject.slug}
                      custom={direction}
                      initial={{ opacity: 0, x: direction * 40 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: direction * -40 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      layout={false}
                      className="relative w-full"
                      style={{
                        filter: `drop-shadow(0 0 60px rgba(var(--cinema-color-rgb), 0.55)) drop-shadow(0 0 120px rgba(var(--cinema-color-rgb), 0.25))`
                      }}
                    >
                      <div className="relative w-full">
                        {/* Glow solo aquí, scope reducido al mockup */}
                        <div
                          className="absolute inset-0 pointer-events-none -z-10 rounded-3xl"
                          style={{
                            background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(var(--cinema-color-rgb), 0.18) 0%, transparent 70%)`,
                            transition: "background 0.8s ease"
                          }}
                        />
                        {/* Mockup (laptop/imagen) va aquí, nada más */}
                        <ProjectScreenshot 
                          project={currentCinemaProject} 
                          onExit={() => setViewMode("bento")} 
                        />
                      </div>
                    </motion.div>
                  </AnimatePresence>
                  
                  {/* Step dots slider controls + Navigation chevrons on both sides */}
                  <div className="flex items-center justify-center gap-4 mt-6">
                    <button
                      onClick={handlePrevCinema}
                      className="p-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer active:scale-90"
                      aria-label="Previous project"
                    >
                      <ChevronLeft size={20} strokeWidth={1.5} />
                    </button>

                    <div className="flex gap-1.5 justify-center">
                      {cinemaProjects.map((proj, idx) => (
                        <button
                          key={proj.slug}
                          onClick={() => setActiveCinemaIndex(idx)}
                          className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                            idx === activeCinemaIndex ? "w-6" : "bg-gray-700 hover:bg-gray-500"
                          }`}
                          style={{
                            backgroundColor: idx === activeCinemaIndex ? "var(--cinema-color)" : undefined
                          }}
                          title={proj.title}
                        />
                      ))}
                    </div>

                    <button
                      onClick={handleNextCinema}
                      className="p-3 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all cursor-pointer active:scale-90"
                      aria-label="Next project"
                    >
                      <ChevronRight size={20} strokeWidth={1.5} />
                    </button>
                  </div>

                </div>
              </div>

            </div>

            </motion.div>
          </motion.div>
            </div>
          </motion.div>
          )}
        </AnimatePresence>

        {/* Case Study Detail Quick view Modal */}
        <AnimatePresence>
          {selectedProjectForQuickView && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
                  aria-label="Cerrar detalles"
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
                          Plan {selectedProjectForQuickView.plan}
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
        </AnimatePresence>

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
