import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Terminal as TerminalIcon } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface Line {
  type: "input" | "output";
  text: string;
}

// Mini terminal del footer -- un guiño, no un producto. Comandos fijos y
// respuestas de texto plano, sin IA ni backend (a diferencia del viejo
// Atlas Terminal de página completa, retirado). El easter egg real del
// sitio (mini-juego al escribir "polaris" en cualquier lado) vive en
// EasterEgg.tsx, independiente de esto -- acá solo se le hace un guiño.
export default function FooterTerminal() {
  const { language } = useLanguage();
  const es = language === "es";
  const navigate = useNavigate();
  const [lines, setLines] = useState<Line[]>([
    {
      type: "output",
      text: es
        ? 'Mini terminal de Polaris. Escribe "help" para ver los comandos.'
        : 'Polaris mini terminal. Type "help" to see the commands.',
    },
  ]);
  const [input, setInput] = useState("");
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;

    let output: string;
    switch (cmd) {
      case "help":
        output = es
          ? "Comandos: help, whoami, services, cotizar, contact, sudo, date, ls, clear, polaris"
          : "Commands: help, whoami, services, quote, contact, sudo, date, ls, clear, polaris";
        break;
      case "whoami":
        output = es
          ? "guest@polarisweb.studio — un visitante con buen gusto."
          : "guest@polarisweb.studio — a visitor with good taste.";
        break;
      case "services":
      case "servicios":
        output = es
          ? "Destello $299 · Constelación $699 · Nova $1,299 — ver /servicios"
          : "Flash $299 · Constellation $699 · Nova $1,299 — see /servicios";
        break;
      case "cotizar":
      case "quote":
        output = es ? "Abriendo el cotizador..." : "Opening the quote wizard...";
        window.setTimeout(() => navigate("/cotizar"), 500);
        break;
      case "contact":
      case "contacto":
        output = "hola@polarisweb.studio · +1 (829) 920-0544";
        break;
      case "sudo":
        output = es
          ? "Bonito intento. Acá nadie necesita ser root — solo un buen brief."
          : "Nice try. Nobody needs root here — just a good brief.";
        break;
      case "date":
        output = new Date().toString();
        break;
      case "ls":
      case "ls -la":
        output = "home  services  process  portfolio  blog  about";
        break;
      case "wordpress":
        output = es
          ? "comando no encontrado: WordPress no vive acá."
          : "command not found: WordPress doesn't live here.";
        break;
      case "clear":
        setLines([]);
        setInput("");
        return;
      case "polaris":
        output = es
          ? "Esa secuencia no es acá adentro. Probala en cualquier otra parte del sitio 👀"
          : "That sequence isn't in here. Try it anywhere else on the site 👀";
        break;
      default:
        output = es
          ? `comando no encontrado: ${cmd} (probá "help")`
          : `command not found: ${cmd} (try "help")`;
    }

    setLines((prev) => [...prev, { type: "input", text: raw }, { type: "output", text: output }]);
    setInput("");
  };

  return (
    <div className="mt-10 pt-8 border-t border-[var(--color-border-subtle)]">
      <div
        onClick={() => inputRef.current?.focus()}
        className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-highlight)] font-mono text-[11px] overflow-hidden cursor-text"
      >
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-b border-[var(--color-border-subtle)] text-[var(--color-text-tertiary)]">
          <TerminalIcon size={11} />
          <span>polaris@studio:~</span>
        </div>
        <div ref={outputRef} className="max-h-24 overflow-y-auto px-3 py-2 space-y-1">
          {lines.map((line, i) => (
            <div
              key={i}
              className={
                line.type === "input"
                  ? "text-[var(--color-text-secondary)]"
                  : "text-[var(--color-text-tertiary)]"
              }
            >
              {line.type === "input" ? (
                <>
                  <span className="text-[var(--color-primary-base)]">$</span> {line.text}
                </>
              ) : (
                line.text
              )}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-1.5 px-3 py-1.5 border-t border-[var(--color-border-subtle)]">
          <span className="text-[var(--color-primary-base)]">$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") run(input);
            }}
            placeholder={es ? "escribe help..." : "type help..."}
            spellCheck={false}
            autoComplete="off"
            className="flex-1 bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]/60"
          />
        </div>
      </div>
    </div>
  );
}
