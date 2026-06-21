import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
import { 
  Clock, 
  ChevronLeft, 
  Check, 
  Share2,
  BookMarked,
  ArrowRight,
  ArrowLeft
} from "lucide-react";
import { motion } from "framer-motion";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import AISparkleIcon from "../components/AISparkleIcon";
import NewsletterForm from "../components/NewsletterForm";
import { BLOG_POSTS, BlogPost } from "../data/blogData";
import { T, useLanguage } from "../context/LanguageContext";

interface LinkDef {
  slug: string;
  terms: string[];
}

const LINK_DEFINITIONS: LinkDef[] = [
  {
    slug: "landing-pages-conversion",
    terms: ["landing pages", "landing page", "landing-pages", "landing-page", "páginas de destino", "página de destino"]
  },
  {
    slug: "lead-capture-bot-automatizacion-rapida",
    terms: ["lead capture bot", "bot de respuestas rápidas", "bot de respuestas rapidas", "respuestas rápidas", "respuestas rapidas"]
  },
  {
    slug: "agente-de-ventas-ia-autonomo",
    terms: ["agente de ventas autónomo", "agente de ventas autonomo", "agente de ventas", "ia agent"]
  },
  {
    slug: "buscador-semantico-ia-experiencia-compra",
    terms: ["buscador semántico con ia", "buscador semantico con ia", "buscador semántico", "buscador semantico", "búsqueda semántica", "busqueda semantica", "semantic search"]
  },
  {
    slug: "asistente-de-contenido-ia-reputacion",
    terms: ["asistente de contenido y reseñas", "asistente de contenido y resenas", "asistente de contenido", "content & review assistant"]
  },
  {
    slug: "seo-on-page-guia-completa",
    terms: ["seo on-page", "seo onpage", "on-page seo"]
  },
  {
    slug: "seo-tecnico-guia-completa",
    terms: ["seo técnico", "seo tecnico", "technical seo"]
  },
  {
    slug: "seo-off-page-guia-completa",
    terms: ["seo off-page", "seo offpage", "off-page seo"]
  },
  {
    slug: "seo-contenidos-guia-completa",
    terms: ["seo de contenidos", "seo de contenido", "content seo"]
  },
  {
    slug: "seo-semantico-google",
    terms: ["seo semántico", "seo semantico", "seo"]
  },
  {
    slug: "core-web-vitals-ventas",
    terms: ["core web vitals", "web vitals", "vitals", "velocidad de carga"]
  },
  {
    slug: "postgresql-base-datos",
    terms: ["postgresql", "base de datos relacional", "postgres"]
  },
  {
    slug: "cloud-firebase-servidores",
    terms: ["firebase", "cloud firebase"]
  },
  {
    slug: "framer-motion-animaciones",
    terms: ["framer motion", "animaciones"]
  },
  {
    slug: "gemini-inteligencia-artificial",
    terms: ["gemini", "inteligencia artificial"]
  },
  {
    slug: "grok-modelo-ia",
    terms: ["grok"]
  },
  {
    slug: "ecommerce-alto-nivel",
    terms: ["ecommerce", "comercio electrónico", "comercio electronico", "tiendas online", "tienda online", "tiendas virtuales"]
  },
  {
    slug: "webs-corporativas-identidad",
    terms: ["web corporativa", "webs corporativas", "sitio web corporativo", "sitios web corporativos"]
  },
  {
    slug: "typescript-codigo-seguro",
    terms: ["typescript"]
  },
  {
    slug: "vite-desarrollo-veloz",
    terms: ["vite"]
  },
  {
    slug: "nextjs-arquitectura-optima",
    terms: ["next.js", "nextjs"]
  },
  {
    slug: "tailwind-diseno-rapido",
    terms: ["tailwind css", "tailwind"]
  },
  {
    slug: "react-libreria-componentes",
    terms: ["react"]
  },
  {
    slug: "google-business-profile-guia-completa",
    terms: ["google business profile", "google my business", "ficha de google", "mi negocio en google"]
  },
  {
    slug: "google-analytics-4-guia-completa",
    terms: ["google analytics 4", "google analytics", "ga4"]
  },
  {
    slug: "google-search-console-guia-completa",
    terms: ["google search console", "search console", "gsc"]
  }
];

function linkifyText(text: string, currentSlug: string, alreadyLinked: Set<string>, parentState?: any): React.ReactNode {
  if (!text || typeof text !== "string") return text;

  const activeDefs = LINK_DEFINITIONS.filter(def => {
    return def.slug !== currentSlug && !alreadyLinked.has(def.slug);
  });

  if (activeDefs.length === 0) return text;

  let earliestMatch: {
    index: number;
    length: number;
    slug: string;
    term: string;
  } | null = null;

  for (const def of activeDefs) {
    for (const term of def.terms) {
      const lowerText = text.toLowerCase();
      const lowerTerm = term.toLowerCase();
      
      let pos = -1;
      while ((pos = lowerText.indexOf(lowerTerm, pos + 1)) !== -1) {
        const charBefore = pos > 0 ? text[pos - 1] : "";
        const charAfter = pos + term.length < text.length ? text[pos + term.length] : "";
        
        const isWordChar = (char: string) => {
          return /[a-zA-Z0-9_áéíóúÁÉÍÓÚñÑ]/.test(char);
        };
        
        if (isWordChar(charBefore) || isWordChar(charAfter)) {
          continue;
        }

        if (earliestMatch === null || pos < earliestMatch.index || (pos === earliestMatch.index && term.length > earliestMatch.length)) {
          earliestMatch = {
            index: pos,
            length: term.length,
            slug: def.slug,
            term: term
          };
        }
        break;
      }
    }
  }

  if (!earliestMatch) {
    return text;
  }

  const matchIndex = earliestMatch.index;
  const matchLength = earliestMatch.length;
  const matchedText = text.substring(matchIndex, matchIndex + matchLength);
  const leftText = text.substring(0, matchIndex);
  const rightText = text.substring(matchIndex + matchLength);

  alreadyLinked.add(earliestMatch.slug);

  const leftNode = linkifyText(leftText, currentSlug, alreadyLinked, parentState);
  const rightNode = linkifyText(rightText, currentSlug, alreadyLinked, parentState);

  // Compute history array for the next navigated article
  const nextHistory = [...(parentState?.history || [])];
  const currentPath = `/blog/${currentSlug}`;
  if (!nextHistory.includes(currentPath)) {
    nextHistory.push(currentPath);
  }

  return (
    <>
      {leftNode}
      <Link
        to={`/blog/${earliestMatch.slug}`}
        state={{
          fromServices: parentState?.fromServices,
          fromTab: parentState?.fromTab,
          history: nextHistory,
          fromArticle: true,
          fromPath: currentPath
        }}
        className="text-indigo-400 hover:text-indigo-300 underline font-semibold transition-colors decoration-indigo-400/40 hover:decoration-indigo-300"
      >
        {matchedText}
      </Link>
      {rightNode}
    </>
  );
}

function renderFormattedAndLinkedText(text: string, currentSlug: string, alreadyLinked: Set<string>, parentState?: any): React.ReactNode {
  if (!text) return "";
  if (!text.includes("**")) {
    return linkifyText(text, currentSlug, alreadyLinked, parentState);
  }
  return text.split("**").map((textToken, tokenIdx) => {
    if (tokenIdx % 2 === 1) {
      return (
        <strong key={tokenIdx} className="text-[var(--color-text-primary)]">
          {linkifyText(textToken, currentSlug, alreadyLinked, parentState)}
        </strong>
      );
    } else {
      return (
        <React.Fragment key={tokenIdx}>
          {linkifyText(textToken, currentSlug, alreadyLinked, parentState)}
        </React.Fragment>
      );
    }
  });
}

export default function BlogPostDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { language, translate } = useLanguage();
  const [copied, setCopied] = useState(false);
  const alreadyLinked = new Set<string>();

  // Find matching blog post
  const post = BLOG_POSTS.find((p) => p.slug === slug);

  useEffect(() => {
    // If post not found, redirect after a short delay or stay on error screen
    if (!post) {
      const timer = setTimeout(() => {
        navigate("/blog");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [post, navigate]);

  const handleShare = () => {
    if (!post) return;
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {
      // Sin permiso de portapapeles (contexto no seguro, etc.): evitar rechazo no manejado.
    });
  };

  const formatDate = (isoStr: string) => {
    const parts = isoStr.split("-");
    const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return d.toLocaleDateString(language === "en" ? "en-US" : "es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  };

  if (!post) {
    return (
      <div className="min-h-dvh flex flex-col bg-[var(--color-surface-base)]" id="blog-not-found">
        <Navbar />
        <div className="flex-grow flex flex-col items-center justify-center p-10 text-center">
          <BookMarked size={48} className="text-red-500 animate-bounce mb-4" />
          <h1 className="text-3xl font-display font-black tracking-tighter">
            <T en="Article Not Found">Artículo no encontrado</T>
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-2 max-w-md">
            <T en="The article you are looking for does not exist or has been moved. Coding systems are redirecting you to our hub.">
              El artículo que buscas no existe o ha sido trasladado. Te estamos redirigiendo de vuelta al listado principal.
            </T>
          </p>
          <Link
            to="/blog"
            className="mt-6 px-6 py-3 bg-indigo-500 text-white font-bold text-xs rounded-lg uppercase tracking-wider hover:scale-95 transition-all"
          >
            <T en="Back to Blog">Volver al Blog</T>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  // Related posts (posts from the same category or random ones)
  const relatedPosts = BLOG_POSTS.filter(
    (bp) => bp.id !== post.id && (bp.category === post.category || bp.categoryEn === post.categoryEn)
  ).slice(0, 3);

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden" 
      id="blog-detail-root"
    >
      <Navbar />

      {/* Decorative ambient subtle background glows */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-[120px] pointer-events-none" />

      <main className="max-w-4xl mx-auto w-full px-6 py-12 md:py-20 relative z-10 flex-grow">
        
        {/* Navigation Header bar */}
        <div className="flex items-center justify-between gap-4 mb-10 pb-6 border-b border-[var(--color-border-subtle)]/30">
          {location.state?.history && location.state.history.length > 0 ? (
            <Link
              to={location.state.history[location.state.history.length - 1]}
              state={{
                fromServices: location.state.fromServices,
                fromTab: location.state.fromTab,
                history: location.state.history.slice(0, -1),
                fromArticle: true,
                fromPath: location.state.history.length > 1 ? location.state.history[location.state.history.length - 2] : undefined
              }}
              className="px-3.5 py-1.5 border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all"
              id="blog-detail-back-history-lnk"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <T en="BACK TO PREVIOUS ARTICLE">VOLVER AL ARTÍCULO ANTERIOR</T>
            </Link>
          ) : location.state && location.state.fromServices ? (
            <Link
              to="/servicios"
              state={{ fromTab: location.state.fromTab }}
              className="px-3.5 py-1.5 border border-indigo-500/30 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 hover:text-indigo-300 rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all"
              id="blog-detail-back-srv-lnk"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <T en="RETURN TO PLANS">VOLVER A SERVICIOS</T>
            </Link>
          ) : location.state && location.state.fromLanding ? (
            <button
              onClick={() => navigate(-1)}
              className="px-3.5 py-1.5 border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all"
              id="blog-detail-back-landing-btn"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <T en="BACK TO HOME">VOLVER AL INICIO</T>
            </button>
          ) : location.state && location.state.fromArticle ? (
            <Link
              to={location.state.fromPath || "/blog"}
              className="px-3.5 py-1.5 border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all"
              id="blog-detail-back-lnk"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <T en="BACK TO POST">VOLVER AL ARTÍCULO</T>
            </Link>
          ) : (
            <Link
              to="/blog"
              className="px-3.5 py-1.5 border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] rounded-lg text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 transition-all"
              id="blog-detail-back-lnk"
            >
              <ChevronLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
              <T en="BACK TO BLOG">VOLVER AL HUB</T>
            </Link>
          )}

          <button
            id={`share-blog-btn-${post.slug}`}
            onClick={handleShare}
            className="px-3.5 py-1.5 border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] rounded-lg text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all flex items-center gap-2 text-xs font-mono font-bold"
            title={translate("Copiar enlace del artículo", "Copy Article URL")}
          >
            {copied ? (
              <>
                <Check size={14} className="text-emerald-500 animate-scale" />
                <span className="text-emerald-500"><T en="COPIED">COPIADO</T></span>
              </>
            ) : (
              <>
                <Share2 size={14} />
                <span><T en="SHARE">COMPARTIR</T></span>
              </>
            )}
          </button>
        </div>

        {/* Primary Article Content */}
        <article className="space-y-8" id="blog-article-content-wrapper">
          {/* Metadata Block */}
          <div className="space-y-4 text-center md:text-left">
            <span className="inline-flex items-center gap-2.5 text-xs font-mono font-black uppercase text-indigo-500">
              <span>
                {language === "en" ? post.categoryEn : post.category}
              </span>
              <span className="text-[var(--color-border-subtle)]">•</span>
              <span className="flex items-center gap-1 text-[var(--color-text-tertiary)]">
                <Clock size={11} />
                {post.readTime} <T en="MIN READ">MIN LECTURA</T>
              </span>
            </span>
            <h1 className="text-3xl md:text-6xl font-display font-black tracking-tight leading-tight text-[var(--color-text-primary)]">
              {language === "en" ? post.titleEn : post.title}
            </h1>
            <p className="text-base md:text-lg text-[var(--color-text-secondary)] leading-relaxed italic border-l-2 border-indigo-500/40 pl-4 py-1">
              {language === "en" ? post.summaryEn : post.summary}
            </p>
          </div>

          {/* Author Block */}
          <div className="flex border-y border-[var(--color-border-subtle)]/40 py-5 items-center gap-4">
            <img
              src={post.author.avatar}
              alt={post.author.name}
              className="w-12 h-12 rounded-full object-cover border-2 border-indigo-500/20"
            />
            <div className="text-left">
              <h5 className="font-bold text-sm tracking-tight text-[var(--color-text-primary)]">
                {post.author.name}
              </h5>
              <p className="text-xs font-mono text-[var(--color-text-tertiary)] tracking-tight">
                {language === "en" ? post.author.roleEn : post.author.role} • {formatDate(post.publishedAt)}
              </p>
            </div>
          </div>

          {/* Body Content Blocks */}
          <div className="prose prose-slate dark:prose-invert max-w-none text-base leading-relaxed text-[var(--color-text-secondary)] space-y-6">
            {(language === "en" ? post.contentEn : post.content)
              .split("\n\n")
              .map((paragraph, pIdx) => {
                if (paragraph.startsWith("### ")) {
                  return (
                    <h3 key={pIdx} className="text-lg md:text-2xl font-display font-black text-[var(--color-text-primary)] mt-8 mb-3">
                      {paragraph.substring(4)}
                    </h3>
                  );
                }
                if (paragraph.startsWith("## ")) {
                  return (
                    <h2 key={pIdx} className="text-xl md:text-3xl font-display font-black text-[var(--color-text-primary)] mt-10 mb-4 pb-1 border-b border-[var(--color-border-subtle)]/20">
                      {paragraph.substring(3)}
                    </h2>
                  );
                }
                if (paragraph.startsWith("* ") || paragraph.startsWith("- ")) {
                  return (
                    <ul key={pIdx} className="list-disc pl-5 space-y-1.5 my-4">
                      {paragraph.split("\n").map((li, lIdx) => {
                        const match = li.match(/^[\*-]\s+\*\*(.*?)\*\*(.*)/);
                        return (
                          <li key={lIdx} className="text-[var(--color-text-secondary)]">
                            {match ? (
                              <>
                                <strong className="text-[var(--color-text-primary)]">
                                  {linkifyText(match[1], post.slug, alreadyLinked, location.state)}
                                </strong>
                                {renderFormattedAndLinkedText(match[2], post.slug, alreadyLinked, location.state)}
                              </>
                            ) : (
                              renderFormattedAndLinkedText(li.replace(/^[\*-]\s+/, ""), post.slug, alreadyLinked, location.state)
                            )}
                          </li>
                        );
                      })}
                    </ul>
                  );
                }
                if (paragraph.startsWith("1. ")) {
                  return (
                    <ol key={pIdx} className="list-decimal pl-5 space-y-2 my-4">
                      {paragraph.split("\n").map((li, lIdx) => {
                        const numMatch = li.match(/^\d+\.\s+\*\*(.*?)\*\*(.*)/);
                        return (
                          <li key={lIdx} className="text-[var(--color-text-secondary)]">
                            {numMatch ? (
                              <>
                                <strong className="text-[var(--color-text-primary)]">
                                  {linkifyText(numMatch[1], post.slug, alreadyLinked, location.state)}
                                </strong>
                                {renderFormattedAndLinkedText(numMatch[2], post.slug, alreadyLinked, location.state)}
                              </>
                            ) : (
                              renderFormattedAndLinkedText(li.replace(/^\d+\.\s+/, ""), post.slug, alreadyLinked, location.state)
                            )}
                          </li>
                        );
                      })}
                    </ol>
                  );
                }
                // Italic highlights / blockquotes
                if (paragraph.startsWith("*") && paragraph.endsWith("*")) {
                  return (
                    <blockquote key={pIdx} className="my-6 border-l-4 border-indigo-500 bg-indigo-500/[0.02] p-4 font-mono text-xs md:text-sm text-[var(--color-text-primary)] leading-normal rounded-r-lg">
                      {renderFormattedAndLinkedText(paragraph.replace(/^\*/, "").replace(/\*$/, ""), post.slug, alreadyLinked, location.state)}
                    </blockquote>
                  );
                }
                return (
                  <p key={pIdx} className="text-[var(--color-text-secondary)] text-left">
                    {renderFormattedAndLinkedText(paragraph, post.slug, alreadyLinked, location.state)}
                  </p>
                );
              })}
          </div>

          {/* Pitch CTA box inside the Article */}
          <div className="pt-10 border-t border-[var(--color-border-subtle)]/40 space-y-6">
            <div className="text-left space-y-2">
              <h4 className="text-sm font-black uppercase text-[var(--color-text-primary)]">
                <T en="Did you find this diagnostic logic valuable?">¿Te resultó de utilidad este contenido?</T>
              </h4>
              <p className="text-xs text-[var(--color-text-secondary)]">
                <T en="We develop digital systems aligned with these very performance principles. Let us build your high-conversion engine.">
                  Desarrollamos cada uno de nuestros proyectos aplicando estas estrictas pautas de ingeniería de software. Elevemos juntos el posicionamiento de tu negocio.
                </T>
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <button
                id="blog-detail-cta-quote"
                onClick={() => navigate("/cotizar")}
                className="px-6 py-3 rounded-xl bg-indigo-500 hover:scale-95 text-white text-xs font-black uppercase tracking-wider text-center transition-all"
              >
                <T en="Quote custom build">COTIZAR DESARROLLO A MEDIDA</T>
              </button>
              {location.state?.history && location.state.history.length > 0 ? (
                <Link
                  id="blog-detail-cta-back-history"
                  to={location.state.history[location.state.history.length - 1]}
                  state={{
                    fromServices: location.state.fromServices,
                    fromTab: location.state.fromTab,
                    history: location.state.history.slice(0, -1),
                    fromArticle: true,
                    fromPath: location.state.history.length > 1 ? location.state.history[location.state.history.length - 2] : undefined
                  }}
                  className="px-6 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider text-center transition-all inline-flex items-center justify-center gap-2 group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <T en="Back to Previous Article">VOLVER AL ARTÍCULO ANTERIOR</T>
                </Link>
              ) : location.state && location.state.fromServices ? (
                <Link
                  id="blog-detail-cta-back-srv"
                  to="/servicios"
                  state={{ fromTab: location.state.fromTab }}
                  className="px-6 py-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 hover:bg-indigo-500/30 text-indigo-400 hover:text-indigo-300 text-xs font-black uppercase tracking-wider text-center transition-all inline-flex items-center justify-center gap-2 group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <T en="Return to Services">VOLVER A SERVICIOS</T>
                </Link>
              ) : location.state && location.state.fromLanding ? (
                <button
                  id="blog-detail-cta-back-landing"
                  onClick={() => navigate(-1)}
                  className="px-6 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider text-center transition-all inline-flex items-center justify-center gap-2 group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <T en="Back to Home">VOLVER AL INICIO</T>
                </button>
              ) : location.state && location.state.fromArticle ? (
                <Link
                  id="blog-detail-cta-back"
                  to={location.state.fromPath || "/blog"}
                  className="px-6 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider text-center transition-all inline-flex items-center justify-center gap-2 group"
                >
                  <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                  <T en="Back to Previous Article">VOLVER AL ARTÍCULO</T>
                </Link>
              ) : (
                <Link
                  id="blog-detail-cta-back"
                  to="/blog"
                  className="px-6 py-3 rounded-xl border border-[var(--color-border-subtle)] hover:bg-[var(--color-surface-base)] text-[var(--color-text-secondary)] text-xs font-bold uppercase tracking-wider text-center transition-all"
                >
                  <T en="Back to Article List">VOLVER AL LISTADO</T>
                </Link>
              )}
            </div>
          </div>
        </article>
        {/* Newsletter Subscription */}
        <NewsletterForm />

        {/* Related Posts Section */}
        {relatedPosts.length > 0 && (
          <section className="mt-20 pt-10 border-t border-[var(--color-border-subtle)]/40 space-y-8" id="blog-detail-related-section">
            <h3 className="text-xl md:text-2xl font-display font-black tracking-tight text-[var(--color-text-primary)] text-left flex items-center gap-2">
              <AISparkleIcon size={18} className="text-indigo-500" />
              <T en="Recommended Insights">Lecturas Recomendadas</T>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((rp) => (
                <div
                  id={`related-post-card-${rp.id}`}
                  key={rp.id}
                  onClick={() => {
                    const nextHistory = [...(location.state?.history || [])];
                    const currentPath = `/blog/${post.slug}`;
                    if (!nextHistory.includes(currentPath)) {
                      nextHistory.push(currentPath);
                    }
                    navigate(`/blog/${rp.slug}`, {
                      state: {
                        fromServices: location.state?.fromServices,
                        fromTab: location.state?.fromTab,
                        history: nextHistory,
                        fromArticle: true,
                        fromPath: currentPath
                      }
                    });
                  }}
                  className="bg-[var(--color-surface-base)] border border-[var(--color-border-subtle)] hover:border-indigo-500/20 p-5 rounded-xl cursor-pointer hover:shadow-md transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-1.5 flex-grow">
                    <span className="text-[9px] font-mono font-black uppercase tracking-wider text-indigo-500">
                      {language === "en" ? rp.categoryEn : rp.category}
                    </span>
                    <h4 className="font-display font-bold text-sm text-[var(--color-text-primary)] line-clamp-2 hover:text-indigo-500 transition-colors text-left leading-tight">
                      {language === "en" ? rp.titleEn : rp.title}
                    </h4>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-[var(--color-border-subtle)]/20 text-[10px] font-mono uppercase text-[var(--color-text-tertiary)]">
                    <span>{rp.readTime} <T en="MIN READ">MIN LECTURA</T></span>
                    <ArrowRight size={10} className="text-[var(--color-text-secondary)]" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      <Footer />
    </motion.div>
  );
}
