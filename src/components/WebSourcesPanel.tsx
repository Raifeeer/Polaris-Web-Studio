import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Globe, ExternalLink } from "lucide-react";
import { T, useLanguage } from "../context/LanguageContext";
import type { WebSearchSource } from "../hooks/useAtlasChat";

export function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

// Badge clicable ("Búsqueda web") que despliega, debajo suyo, la lista real
// de fuentes que usó la tool `web_search` para esa respuesta puntual --
// pedido explícito del usuario para poder verificar de dónde salió la
// información en vez de solo confiar en el aviso genérico.
export default function WebSourcesPanel({ sources, iconSize = 12 }: { sources: WebSearchSource[]; iconSize?: number }) {
  const [open, setOpen] = useState(false);
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
              {sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-2 px-3 py-2 hover:bg-[var(--color-surface-highlight)] transition-colors"
                >
                  <ExternalLink size={12} className="mt-0.5 shrink-0 text-[var(--color-text-tertiary)]" />
                  <span className="min-w-0">
                    <span className="block text-xs font-semibold text-[var(--color-text-primary)] truncate">{s.title}</span>
                    <span className="block text-[10px] text-[var(--color-text-tertiary)] truncate">{hostnameOf(s.url)}</span>
                  </span>
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
