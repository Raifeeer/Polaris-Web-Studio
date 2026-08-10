import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, ExternalLink, ChevronDown } from "lucide-react";
import { T, useLanguage } from "../context/LanguageContext";
import type { WebSearchSource } from "../hooks/useAtlasChat";

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// El grounding de Gemini devuelve la URL de cada fuente como un link de
// redirección propio de Google (`vertexaisearch.cloud.google.com/...`), no
// la URL real del sitio -- así exige mostrar la atribución Google, y el
// click igual termina en la página real tras el redirect. Mostrar esa URL
// larga y fea como subtítulo confunde (parece un link roto/sospechoso) --
// se oculta cuando el link es un redirect de Google, dejando solo el título
// real (que sí trae el dominio correcto en la metadata de grounding).
function isGoogleRedirect(url: string): boolean {
  try {
    return new URL(url).hostname.endsWith("vertexaisearch.cloud.google.com");
  } catch {
    return false;
  }
}

// Badge clicable ("Búsqueda web") que despliega, debajo suyo, la lista real
// de fuentes que usó la tool `web_search` para esa respuesta puntual --
// pedido explícito del usuario para poder verificar de dónde salió la
// información en vez de solo confiar en el aviso genérico.
const MAX_SOURCES_COLLAPSED = 3;

export default function WebSourcesPanel({ sources, iconSize = 12 }: { sources: WebSearchSource[]; iconSize?: number }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { translate } = useLanguage();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // El panel arranca siempre colapsado -- si se cierra y se vuelve a abrir
  // más tarde, muestra de nuevo solo las primeras 3.
  useEffect(() => {
    if (!open) setExpanded(false);
  }, [open]);

  // Sin fuentes reales (respuesta vieja persistida antes de este cambio, o
  // la tool no devolvió ninguna) -- se muestra el aviso igual pero sin
  // convertirlo en un botón clicable que abra un panel vacío.
  if (!sources.length) {
    return (
      <span
        className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)]"
        title={translate("Búsqueda web usada para esta respuesta", "Web search used for this reply")}
      >
        <Globe size={iconSize} />
        <T en="Web search">Búsqueda web</T>
      </span>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={translate("Ver fuentes consultadas", "View sources consulted")}
        title={translate("Ver fuentes consultadas", "View sources consulted")}
        className={`flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider transition-colors ${
          open ? "text-[var(--color-primary-base)]" : "text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"
        }`}
      >
        <Globe size={iconSize} />
        <T en="Web search">Búsqueda web</T>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 top-full mt-2 z-30 w-64 rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-elevated)] shadow-lg overflow-hidden"
          >
            <p className="px-3 pt-2.5 pb-1.5 text-[10px] font-black uppercase tracking-wider text-[var(--color-text-tertiary)]">
              <T en="Sources consulted">Fuentes consultadas</T>
            </p>
            <div className="max-h-56 overflow-y-auto">
              {(expanded ? sources : sources.slice(0, MAX_SOURCES_COLLAPSED)).map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 px-3 py-2 hover:bg-[var(--color-surface-highlight)] transition-colors"
                >
                  <ExternalLink size={12} className="mt-0.5 shrink-0 text-[var(--color-text-tertiary)]" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[var(--color-text-primary)] truncate">{s.title || hostnameOf(s.url)}</span>
                    {/* Si la URL es un redirect de Google (grounding de
                        Gemini), no se muestra -- ver isGoogleRedirect() arriba.
                        Para el resto (Grok, que no da título real), se muestra
                        la URL completa debajo para dar contexto real en vez de
                        repetir el mismo dominio dos veces. */}
                    {!isGoogleRedirect(s.url) && (
                      <span className="block text-[10px] text-[var(--color-text-tertiary)] truncate">{s.url}</span>
                    )}
                  </span>
                </a>
              ))}
              {/* Panel colapsado por defecto a 3 fuentes -- si hay más, un
                  toggle con chevron las despliega todas (pedido explícito
                  del usuario, 10 de agosto: mostrar todas las fuentes reales
                  sin recortar, pero sin saturar el panel de entrada). */}
              {sources.length > MAX_SOURCES_COLLAPSED && (
                <button
                  onClick={() => setExpanded((v) => !v)}
                  className="flex w-full items-center justify-center gap-1 border-t border-[var(--color-border-subtle)] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] transition-colors"
                >
                  {expanded ? (
                    <T en={`Show fewer`}>Mostrar menos</T>
                  ) : (
                    <T en={`Show ${sources.length - MAX_SOURCES_COLLAPSED} more`}>{`Ver ${sources.length - MAX_SOURCES_COLLAPSED} más`}</T>
                  )}
                  <ChevronDown size={12} className={`transition-transform ${expanded ? "rotate-180" : ""}`} />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
