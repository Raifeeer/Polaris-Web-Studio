import React, { useState, useMemo, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  BookOpen, 
  Tag, 
  SlidersHorizontal, 
  Sparkles, 
  Command, 
  Share2, 
  Check, 
  ChevronLeft,
  X,
  ArrowUpDown,
  BookMarked
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BLOG_POSTS, querySemanticBlog, BlogPost } from "../data/blogData";
import { T, useLanguage } from "../context/LanguageContext";

export default function Blog() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { language } = useLanguage();

  // Search, Categories, Sort, Date range Filter states
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [sortBy, setSortBy] = useState<string>("newest"); // newest, oldest, readTimeAsc, readTimeDesc, titleAsc, titleDesc
  const [dateRange, setDateRange] = useState<string>("all"); // all, 30days, 90days, year2026, year2025
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Sync state to URL params for query parameter sharing & backward-compatibility redirect
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== searchQuery) {
      setSearchQuery(q);
    }
    const cat = searchParams.get("category");
    if (cat) {
      setActiveCategory(cat);
    }
    const postSlug = searchParams.get("read");
    if (postSlug) {
      navigate(`/blog/${postSlug}`, { replace: true });
    }
  }, [searchParams, searchQuery, navigate]);

  const handleQueryChange = (val: string) => {
    setSearchQuery(val);
    const newParams = new URLSearchParams(searchParams);
    if (val) {
      newParams.set("q", val);
    } else {
      newParams.delete("q");
    }
    setSearchParams(newParams);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    const newParams = new URLSearchParams(searchParams);
    if (cat !== "All") {
      newParams.set("category", cat);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams);
  };

  const handlePostClick = (post: BlogPost) => {
    navigate(`/blog/${post.slug}`);
  };

  const handleShare = (post: BlogPost, e: React.MouseEvent) => {
    e.stopPropagation();
    const url = `${window.location.origin}/blog/${post.slug}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(post.id);
      setTimeout(() => setCopiedId(null), 2000);
    }).catch(() => {
      // Sin permiso de portapapeles: evitar rechazo de promesa no manejado.
    });
  };

  // 1. Process Blog data utilizing the Semantic Search engine or default list
  const processedPosts = useMemo(() => {
    let list: { post: BlogPost; score: number; matchReason?: string; matchReasonEn?: string }[] = [];

    if (searchQuery.trim()) {
      list = querySemanticBlog(searchQuery);
    } else {
      list = BLOG_POSTS.map(p => ({
        post: p,
        score: 100,
        matchReason: "Artículo listado por orden cronológico.",
        matchReasonEn: "Article displayed in chronological order."
      }));
    }

    // Filter by Category
    if (activeCategory !== "All") {
      list = list.filter(item => {
        const cat = item.post.category;
        const catEn = item.post.categoryEn;
        return cat === activeCategory || catEn === activeCategory;
      });
    }

    // Filter by Date window constraints
    const now = new Date();
    list = list.filter(item => {
      const pubDate = new Date(item.post.publishedAt);
      const diffTime = Math.abs(now.getTime() - pubDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (dateRange === "30days") return diffDays <= 30;
      if (dateRange === "90days") return diffDays <= 90;
      if (dateRange === "year2026") return pubDate.getFullYear() === 2026;
      if (dateRange === "year2025") return pubDate.getFullYear() === 2025;
      return true;
    });

    // Sorters
    list.sort((a, b) => {
      if (sortBy === "newest") {
        return new Date(b.post.publishedAt).getTime() - new Date(a.post.publishedAt).getTime();
      }
      if (sortBy === "oldest") {
        return new Date(a.post.publishedAt).getTime() - new Date(b.post.publishedAt).getTime();
      }
      if (sortBy === "readTimeAsc") {
        return a.post.readTime - b.post.readTime;
      }
      if (sortBy === "readTimeDesc") {
        return b.post.readTime - a.post.readTime;
      }
      if (sortBy === "titleAsc") {
        const titleA = language === "en" ? a.post.titleEn : a.post.title;
        const titleB = language === "en" ? b.post.titleEn : b.post.title;
        return titleA.localeCompare(titleB);
      }
      if (sortBy === "titleDesc") {
        const titleA = language === "en" ? a.post.titleEn : a.post.title;
        const titleB = language === "en" ? b.post.titleEn : b.post.title;
        return titleB.localeCompare(titleA);
      }
      return 0;
    });

    return list;
  }, [searchQuery, activeCategory, sortBy, dateRange, language]);

  // Categories list based on translation
  const categories = [
    { key: "All", es: "Todos", en: "All" },
    { key: "Performance", es: "Performance", en: "Performance" },
    { key: "SEO", es: "SEO", en: "SEO" },
    { key: "Desarrollo", es: "Desarrollo", en: "Development" },
    { key: "Comercio Electrónico", es: "Comercio Electrónico", en: "E-commerce" },
    { key: "Inteligencia Artificial", es: "Inteligencia Artificial", en: "Artificial Intelligence" },
  ];

  // Helper format date
  const formatDate = (isoStr: string) => {
    const parts = isoStr.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  return (
    <div className="min-h-dvh flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden" id="blog-section-main">
      <Navbar />

      {/* Hero Header */}
      <main className="max-w-7xl mx-auto w-full px-6 md:px-10 py-16 md:py-24 relative z-10 flex-grow">
        <section className="text-center space-y-4 mb-16 relative select-none">
          <span className="text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] block">
            <T en="EDUCATIONAL HUB & ARTICLE LIBRARY">BIBLIOTECA DE CONOCIMIENTO DIGITAL</T>
          </span>
          <h1 className="text-5xl md:text-7xl font-display font-black tracking-tighter max-w-4xl mx-auto leading-[1.1] md:leading-[1.05] text-[var(--color-text-primary)]">
            <T
              en={
                <>
                  Polaris <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                    Insights
                  </span>
                </>
              }
            >
              Polaris <br className="hidden md:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-primary-base)] to-[var(--color-accent-blue)] inline-block pb-1 pr-1">
                Insights
              </span>
            </T>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-lg md:text-xl max-w-2xl mx-auto">
            <T en="Articles, concepts, and technical demystifications. Learn about speed optimizations, semantic structures, clean rendering, and modern web growth.">
              Artículos completos, aclaraciones conceptuales y desmitificación técnica. Aprende de rendimiento, estructuras semánticas, indexación en buscadores y captación digital libre de basura.
            </T>
          </p>
        </section>

        {/* Dynamic Search & Filters Toolbar */}
        <section className="bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] rounded-2xl p-6 md:p-8 mb-12 shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* Semantic Search Input Element */}
            <div className="relative w-full flex-grow">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] pointer-events-none">
                <Search size={18} />
              </span>
              <input
                id="blog-search-input"
                type="text"
                placeholder={language === "en" ? "Search conceptually (e.g. 'speed', 'google ranking', 'shopify')..." : "Busca conceptualmente (ej: 'rapidez', 'posicionar en google', 'vender')..."}
                value={searchQuery}
                onChange={(e) => handleQueryChange(e.target.value)}
                className="glass-input w-full text-[var(--color-text-primary)] border border-[var(--color-border-subtle)] focus:border-indigo-500 rounded-xl py-3.5 pl-12 pr-28 text-sm placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1 bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 rounded-lg text-[9px] font-mono tracking-widest font-black uppercase">
                <Sparkles size={8} className="animate-spin" style={{ animationDuration: "3s" }} />
                SEMANTIC
              </span>
            </div>

            {/* Sub Tools Toggle Controls */}
            <div className="flex w-full md:w-auto gap-3 shrink-0">
              <button
                id="blog-toggle-filters-btn"
                onClick={() => setShowFilters(!showFilters)}
                className={`w-full md:w-auto px-4 py-3.5 rounded-xl border flex items-center justify-center gap-2.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  showFilters || dateRange !== "all" || sortBy !== "newest"
                    ? "bg-indigo-550 border-indigo-500 text-white dark:bg-indigo-950/40 dark:text-indigo-400"
                    : "bg-[var(--color-surface-base)] border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                }`}
              >
                <SlidersHorizontal size={14} />
                <T en="Filters & Sorting">Filtros y Orden</T>
              </button>
            </div>
          </div>

          {/* Expanded Filter Panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.25 }}
                className="overflow-hidden border-t border-[var(--color-border-subtle)]/40 pt-6 space-y-6"
                id="expanded-filter-panel"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {/* Sorting Widget */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                      <ArrowUpDown size={12} className="text-indigo-500" />
                      <T en="Order Articles By">Ordenar Artículos Por</T>
                    </label>
                    <div className="relative">
                      <select
                        id="blog-sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="glass-input w-full border border-[var(--color-border-subtle)] focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs font-medium text-[var(--color-text-primary)]"
                      >
                        <option value="newest">{language === "en" ? "Publication Date: Newest First" : "Fecha de publicación: Más Reciente"}</option>
                        <option value="oldest">{language === "en" ? "Publication Date: Oldest First" : "Fecha de publicación: Más Antiguo"}</option>
                        <option value="readTimeAsc">{language === "en" ? "Read Time: Shortest First" : "Tiempo de lectura: Más Corto"}</option>
                        <option value="readTimeDesc">{language === "en" ? "Read Time: Longest First" : "Tiempo de lectura: Más Largo"}</option>
                        <option value="titleAsc">{language === "en" ? "Title: A-Z" : "Título: A-Z"}</option>
                        <option value="titleDesc">{language === "en" ? "Title: Z-A" : "Título: Z-A"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Filter by Publish Date Widget */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-mono font-black uppercase tracking-wider text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                      <Calendar size={12} className="text-indigo-500" />
                      <T en="Publication Date Range">Rango de Publicación</T>
                    </label>
                    <div className="relative">
                      <select
                        id="blog-daterange-select"
                        value={dateRange}
                        onChange={(e) => setDateRange(e.target.value)}
                        className="glass-input w-full border border-[var(--color-border-subtle)] focus:border-indigo-500 focus:outline-none rounded-xl p-3 text-xs font-medium text-[var(--color-text-primary)]"
                      >
                        <option value="all">{language === "en" ? "Display All Articles" : "Mostrar Todos los Artículos"}</option>
                        <option value="30days">{language === "en" ? "Last 30 Days Only" : "Últimos 30 días"}</option>
                        <option value="90days">{language === "en" ? "Last 90 Days Only" : "Últimos 90 días"}</option>
                        <option value="year2026">{language === "en" ? "Year 2026 Only" : "Solo Año 2026"}</option>
                        <option value="year2025">{language === "en" ? "Year 2025 Only" : "Solo Año 2025"}</option>
                      </select>
                    </div>
                  </div>

                  {/* Active Diagnostics Panel */}
                  <div className="sm:col-span-2 lg:col-span-1 border border-indigo-500/10 bg-indigo-500/[0.02] rounded-xl p-4 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-[9px] font-mono font-black text-indigo-500 uppercase tracking-widest">
                        <Command size={10} className="animate-spin" />
                        SYSTEM LOGS: SEMANTIC RESOLVER
                      </div>
                      <p className="text-[11px] text-[var(--color-text-secondary)] mt-1.5 leading-relaxed">
                        {searchQuery.trim() ? (
                          <T en={`Decoded query '${searchQuery}' using localized synonyms. Mapped relevance to content tokens, implicit concepts, and specific categories.`}>
                            Query '{searchQuery}' decodificada mediante mapeo léxico y sinonimia conceptual. Puntuando concordancia en etiquetas, descripciones y categorías.
                          </T>
                        ) : (
                          <T en="Awaiting user search query... The compiler evaluates search intent, token densities, and mapped tags automatically.">
                            Esperando término de consulta... El compilador evaluará semántica, densidad de tokens y relaciones lógicas integradas.
                          </T>
                        )}
                      </p>
                    </div>
                    {searchQuery.trim() && (
                      <span className="glass-badge inline-flex max-w-fit items-center gap-1 text-[9px] px-2 py-0.5 rounded text-emerald-500 border border-emerald-500/20 font-mono font-bold uppercase mt-2">
                        STATE: FULLY ALIGNED
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Quick Categories Bar */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-[var(--color-border-subtle)]/30">
            {categories.map((cat) => {
              const displayCat = language === "es" ? cat.es : cat.en;
                
              return (
                <button
                  id={`blog-cat-btn-${cat.key.toLowerCase().replace(/\s+/g, '-')}`}
                  key={cat.key}
                  onClick={() => handleCategoryChange(cat.key)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                    activeCategory === cat.key
                      ? "bg-[var(--color-text-primary)] text-[var(--color-surface-base)]"
                      : "bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-elevated)]"
                  }`}
                >
                  {displayCat}
                </button>
              );
            })}
          </div>
        </section>

        {/* Live HUD box highlighting how keyword search mapped concepts */}
        {searchQuery.trim() && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 rounded-xl flex items-start gap-3"
            id="semantic-intelligence-hud"
          >
            <div className="p-2 bg-indigo-500 text-white rounded-lg shrink-0 mt-0.5">
              <Sparkles size={16} />
            </div>
            <div className="space-y-1">
              <h4 className="text-xs font-mono font-black text-indigo-500 uppercase tracking-widest flex items-center gap-1">
                <T en="SEMANTIC MAPPING DIAGNOSTICS">DIAGNÓSTICO DEL BUSCADOR INTELIGENTE</T>
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                <T
                  en={
                    <>
                      We resolved your search query <span className="text-indigo-500 font-bold">"{searchQuery}"</span>. It maps conceptually to our educational categories. 
                      Showing matching results sorted by calculated relevance below:
                    </>
                  }
                >
                  Interpretamos tu búsqueda <span className="text-indigo-500 font-bold">"{searchQuery}"</span> de manera conceptual. Buscamos coincidencias con sinónimos e intenciones relacionales de software. 
                  Mostrando resultados ordenados por relevancia calculada:
                </T>
              </p>
            </div>
          </motion.div>
        )}

        {/* Core Articles Grid */}
        {processedPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-16">
            {processedPosts.map(({ post, score, matchReason, matchReasonEn }, i) => (
              <motion.article
                id={`blog-post-card-${post.id}`}
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => handlePostClick(post)}
                className="group relative bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] hover:border-indigo-500/20 rounded-2xl overflow-hidden flex flex-col h-full hover:shadow-xl bento-glow-hover cursor-pointer transition-all duration-300"
              >
                {/* Article Card Body */}
                <div className="p-6 md:p-8 flex flex-col flex-grow space-y-4">
                  {/* Category and Read time tag */}
                  <div className="flex justify-between items-center text-[10px] font-mono font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-indigo-500">
                        {language === "en" ? post.categoryEn : post.category}
                      </span>
                      {searchQuery.trim() && (
                        <span className="inline-flex items-center px-2 py-0.5 bg-emerald-500 text-white font-mono font-black rounded-md text-[8px] tracking-wider shadow-sm">
                          {score}% RELEVANCIA
                        </span>
                      )}
                    </div>
                    <span className="flex items-center gap-1 shrink-0">
                      <Clock size={11} />
                      {post.readTime} MIN
                    </span>
                  </div>

                  {/* Title & metadata */}
                  <div className="space-y-2 flex-grow">
                    <h3 className="text-lg md:text-xl font-display font-black group-hover:text-indigo-500 transition-colors leading-tight text-[var(--color-text-primary)]">
                      {language === "en" ? post.titleEn : post.title}
                    </h3>
                    <p className="text-xs md:text-sm text-[var(--color-text-secondary)] leading-relaxed line-clamp-3">
                      {language === "en" ? post.summaryEn : post.summary}
                    </p>
                  </div>

                  {/* Semantic Reasoning Footer Log (If matching searchQuery) */}
                  {searchQuery.trim() && matchReason && (
                    <div className="text-[10px] bg-slate-100 dark:bg-slate-900/60 text-[var(--color-text-tertiary)] dark:text-[var(--color-text-secondary)] p-2.5 rounded-lg border border-[var(--color-border-subtle)]/40 font-mono scale-[0.98] origin-left italic flex items-start gap-1.5">
                      <Sparkles size={11} className="text-indigo-500 shrink-0 mt-0.5" />
                      <span>{language === "en" ? matchReasonEn : matchReason}</span>
                    </div>
                  )}

                  {/* Bottom Author Line */}
                  <div className="pt-4 border-t border-[var(--color-border-subtle)]/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <img
                        src={post.author.avatar}
                        alt={post.author.name}
                        className="w-7 h-7 rounded-full object-cover border border-[var(--color-border-subtle)]"
                      />
                      <div className="text-left">
                        <p className="text-[10px] font-black uppercase text-[var(--color-text-primary)] leading-tight">
                          {post.author.name}
                        </p>
                        <p className="text-[9px] font-mono text-[var(--color-text-tertiary)] leading-none mt-0.5">
                          {formatDate(post.publishedAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-[var(--color-text-secondary)] group-hover:text-indigo-500 group-hover:translate-x-1.5 transition-all">
                      <T en="Read">Leer</T>
                      <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : (
          /* Empty search state */
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-16 text-center border border-dashed border-[var(--color-border-subtle)] rounded-2xl max-w-lg mx-auto"
            id="empty-blog-search-state"
          >
            <div className="w-12 h-12 bg-slate-100 dark:bg-slate-900 border border-[var(--color-border-subtle)] rounded-xl flex items-center justify-center mx-auto text-[var(--color-text-tertiary)] mb-4">
              <Search size={22} />
            </div>
            <h3 className="text-lg font-black tracking-tight text-[var(--color-text-primary)]">
              <T en="No articles match your criteria">No encontramos ningún artículo</T>
            </h3>
            <p className="text-xs text-[var(--color-text-secondary)] mt-2 max-w-xs mx-auto leading-relaxed">
              <T en="Our semantic analyzer couldn't find matching concepts. Try searching with terms like 'speed', 'google', 'custom code', or reset filters.">
                Nuestro analizador lógico no encontró correspondencias sobre tu consulta. Intenta buscar términos como 'rapidez', 'google', 'diseño exclusivo' o limpia los filtros.
              </T>
            </p>
            <button
              id="clear-blog-filters-btn"
              onClick={() => {
                setSearchQuery("");
                setActiveCategory("All");
                setDateRange("all");
                setSortBy("newest");
                setSearchParams({});
              }}
              className="mt-6 px-4 py-2 bg-indigo-500 hover:scale-95 transition-all text-white font-bold text-xs rounded-lg"
            >
              <T en="Reset Filters">Limpiar Todos los Filtros</T>
            </button>
          </motion.div>
        )}
      </main>

      <Footer />
    </div>
  );
}
