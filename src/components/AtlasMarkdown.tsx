import React from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Link } from "react-router-dom";

// Render compartido para las respuestas de Atlas (widget flotante + página
// completa /asistente) -- mismo look en los dos lugares. Los enlaces
// internos (rutas del sitio) usan <Link> del router en vez de <a> para no
// recargar la página; todo lo demás abre en pestaña nueva.
export default function AtlasMarkdown({ content }: { content: string }) {
  return (
    <div className="atlas-markdown text-sm leading-relaxed [&_p]:mb-2 [&_p:last-child]:mb-0 [&_ul]:mb-2 [&_ul]:mt-1 [&_ul]:space-y-1 [&_ul]:pl-4 [&_ol]:mb-2 [&_ol]:mt-1 [&_ol]:space-y-1 [&_ol]:pl-4 [&_li]:list-disc [&_ol_li]:list-decimal">
      <Markdown
        remarkPlugins={[remarkGfm]}
        components={{
          strong: ({ children }) => (
            <strong className="font-black text-[var(--color-text-primary)]">{children}</strong>
          ),
          a: ({ href, children }) => {
            const isInternal = href?.startsWith("/");
            const className =
              "font-bold text-[var(--color-primary-base)] underline decoration-[var(--color-primary-base)]/40 underline-offset-2 hover:decoration-[var(--color-primary-base)] transition-colors";
            if (isInternal && href) {
              return (
                <Link to={href} className={className}>
                  {children}
                </Link>
              );
            }
            return (
              <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
                {children}
              </a>
            );
          },
          p: ({ children }) => <p>{children}</p>,
          ul: ({ children }) => <ul>{children}</ul>,
          ol: ({ children }) => <ol>{children}</ol>,
          li: ({ children }) => <li className="marker:text-[var(--color-text-tertiary)]">{children}</li>,
        }}
      >
        {content}
      </Markdown>
    </div>
  );
}
