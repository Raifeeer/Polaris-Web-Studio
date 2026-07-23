import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Terminal as TerminalIcon, ChevronDown } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

interface Line {
  type: "input" | "output";
  text: string;
}

const BANNER = String.raw`
 ____       _            _
|  _ \ ___ | | __ _ _ __(_)___
| |_) / _ \| |/ _\` | '__| / __|
|  __/ (_) | | (_| | |  | \__ \
|_|   \___/|_|\__,_|_|  |_|___/
`;

// Mini terminal del footer -- un guiño, no un producto. Comandos fijos y
// respuestas de texto plano, sin IA ni backend (a diferencia del viejo
// Atlas Terminal de página completa, retirado). Colapsada por defecto como
// un dropdown -- se abre al hacer click en la barra, para no ocupar
// espacio del footer hasta que alguien la quiera usar. El easter egg
// "grande" del sitio (mini-juego al escribir "polaris" en cualquier lado)
// sigue viviendo en EasterEgg.tsx, independiente de esto; acá solo hay un
// puñado de guiños chicos propios (ver comandos "matrix"/"42"/"vim"/"coffee").
export default function FooterTerminal() {
  const { language } = useLanguage();
  const es = language === "es";
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [lines, setLines] = useState<Line[]>([
    {
      type: "output",
      text: es
        ? 'Terminal de Polaris. Escribe "help" para ver los comandos disponibles.'
        : 'Polaris terminal. Type "help" to see the available commands.',
    },
  ]);
  const [input, setInput] = useState("");
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number | null>(null);
  const outputRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
  }, [open]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: "smooth" });
  }, [lines]);

  const print = (raw: string, output: string) =>
    setLines((prev) => [...prev, { type: "input", text: raw }, { type: "output", text: output }]);

  const run = (raw: string) => {
    const cmd = raw.trim().toLowerCase();
    if (!cmd) return;
    setHistory((prev) => [...prev, raw]);
    setHistoryIndex(null);

    let output: string;
    switch (cmd) {
      case "help":
      case "?":
        output = es
          ? "help · whoami · stack · services · cotizar · contact · about · blog · portfolio · ls · pwd · date · uptime · history · coffee · matrix · sudo · vim · 42 · clear"
          : "help · whoami · stack · services · quote · contact · about · blog · portfolio · ls · pwd · date · uptime · history · coffee · matrix · sudo · vim · 42 · clear";
        break;
      case "whoami":
        output = es
          ? "visitante@polarisweb.studio -- con buen criterio para elegir estudio."
          : "visitor@polarisweb.studio -- with good taste in web studios.";
        break;
      case "stack":
        output = "React 19 · TypeScript · Vite 6 · Tailwind CSS v4 · Firebase · Express";
        break;
      case "services":
      case "servicios":
        output = es
          ? "Destello $299 · Constelación $699 · Nova $1,299 -- ver /servicios"
          : "Flash $299 · Constellation $699 · Nova $1,299 -- see /servicios";
        break;
      case "cotizar":
      case "quote":
        output = es ? "Abriendo el cotizador..." : "Opening the quote wizard...";
        window.setTimeout(() => navigate("/cotizar"), 500);
        break;
      case "contact":
      case "contacto":
        output = es
          ? "hola@polarisweb.studio · +1 (829) 920-0544 · o directo en /contacto"
          : "hola@polarisweb.studio · +1 (829) 920-0544 · or straight to /contacto";
        window.setTimeout(() => navigate("/contacto"), 700);
        break;
      case "about":
      case "nosotros":
        output = es ? "Abriendo Nosotros..." : "Opening About...";
        window.setTimeout(() => navigate("/nosotros"), 500);
        break;
      case "blog":
        output = es ? "Abriendo el blog..." : "Opening the blog...";
        window.setTimeout(() => navigate("/blog"), 500);
        break;
      case "portfolio":
      case "portafolio":
        output = es ? "Abriendo el portafolio..." : "Opening the portfolio...";
        window.setTimeout(() => navigate("/portafolio"), 500);
        break;
      case "sudo":
        output = es
          ? "Permiso denegado: acá nadie necesita ser root, solo un buen brief."
          : "Permission denied: nobody needs root here, just a good brief.";
        break;
      case "date":
        output = new Date().toString();
        break;
      case "pwd":
        output = "/home/visitante/polaris-web-studio";
        break;
      case "uptime":
        output = es
          ? "Este estudio no se cae -- 100% uptime, café ilimitado."
          : "This studio doesn't go down -- 100% uptime, unlimited coffee.";
        break;
      case "history":
        output = history.length
          ? history.map((h, i) => `${i + 1}  ${h}`).join("\n")
          : es
            ? "Todavía no escribiste nada."
            : "You haven't typed anything yet.";
        break;
      case "ls":
      case "ls -la":
        output = "home  services  process  portfolio  blog  about  contacto";
        break;
      case "cd":
      case "cd ..":
        output = es
          ? "No hay a dónde ir -- ya estás en el mejor directorio."
          : "Nowhere to go -- you're already in the best directory.";
        break;
      case "coffee":
        output = [
          "      )  (",
          "     (   ) )",
          "      ) ( (",
          "    _______)_",
          " .-'---------|",
          "( C|/\\/\\/\\/\\/|",
          " '-./\\/\\/\\/\\/|",
          "   '_________'",
          "    '-------'",
          es ? "Compilando ideas..." : "Compiling ideas...",
        ].join("\n");
        break;
      case "matrix":
        output = es
          ? "Wake up, Neo... no existe la cuchara, solo buen código."
          : "Wake up, Neo... there is no spoon, only good code.";
        break;
      case "vim":
      case "vi":
        output = es
          ? "Entraste a Vim. Nadie sabe cómo salir. Prueba con :q, :wq o Ctrl+C."
          : "You entered Vim. Nobody knows how to leave. Try :q, :wq or Ctrl+C.";
        break;
      case ":q":
      case ":wq":
      case ":q!":
        output = es ? "Saliste de Vim con vida. Pocos lo logran." : "You escaped Vim alive. Few do.";
        break;
      case "42":
        output = es
          ? "La respuesta a la vida, el universo y todo lo demás. La pregunta sigue pendiente."
          : "The answer to life, the universe, and everything. The question is still pending.";
        break;
      case "rm -rf /":
      case "rm -rf *":
        output = es
          ? "Bloqueado. Este sitio sobrevive a curiosos y a bots por igual."
          : "Blocked. This site survives curious visitors and bots alike.";
        break;
      case "hack":
      case "hack nasa":
        output = es
          ? "Acceso denegado. Intenta cotizar un proyecto en su lugar: /cotizar"
          : "Access denied. Try quoting a project instead: /cotizar";
        break;
      case "banner":
      case "polaris --version":
        output = `${BANNER.trim()}\n${es ? "v1.0 -- ingeniería digital de precisión" : "v1.0 -- precision digital engineering"}`;
        break;
      case "wordpress":
        output = es
          ? "comando no encontrado: WordPress no vive acá."
          : "command not found: WordPress doesn't live here.";
        break;
      case "clear":
      case "cls":
        setLines([]);
        setInput("");
        return;
      case "exit":
      case "logout":
        output = es ? "No hay salida, solo scroll." : "There's no exit, only scroll.";
        setTimeout(() => setOpen(false), 600);
        break;
      case "polaris":
        output = es
          ? "Esa secuencia no es acá adentro. Pruébala en cualquier otra parte del sitio."
          : "That sequence isn't in here. Try typing it anywhere else on the site.";
        break;
      default:
        output = es
          ? `comando no encontrado: ${cmd} (prueba "help")`
          : `command not found: ${cmd} (try "help")`;
    }

    print(raw, output);
    setInput("");
  };

  return (
    <div className="mt-10 pt-8 border-t border-[var(--color-border-subtle)]">
      <div className="rounded-lg border border-[var(--color-border-subtle)] bg-[var(--color-surface-highlight)] font-mono text-[11px] overflow-hidden shadow-sm">
        {/* Barra tipo dropdown -- clickeable para abrir/cerrar */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="w-full flex items-center justify-between gap-1.5 px-3 py-1.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-1.5">
            <span className="flex gap-1 mr-1">
              <span className="w-2 h-2 rounded-full bg-red-400/70" />
              <span className="w-2 h-2 rounded-full bg-yellow-400/70" />
              <span className="w-2 h-2 rounded-full bg-green-400/70" />
            </span>
            <TerminalIcon size={11} />
            <span>polaris@studio:~</span>
          </span>
          <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
            <ChevronDown size={12} />
          </motion.span>
        </button>

        <AnimatePresence initial={false}>
          {open && (
            <motion.div
              key="terminal-body"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="border-t border-[var(--color-border-subtle)] overflow-hidden"
            >
              <div
                onClick={() => inputRef.current?.focus()}
                ref={outputRef}
                className="max-h-40 overflow-y-auto px-3 py-2 space-y-1 cursor-text"
              >
                {lines.map((line, i) => (
                  <div
                    key={i}
                    className={
                      line.type === "input"
                        ? "text-[var(--color-text-secondary)] whitespace-pre-wrap"
                        : "text-[var(--color-text-tertiary)] whitespace-pre-wrap"
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
                    if (e.key === "ArrowUp") {
                      e.preventDefault();
                      if (!history.length) return;
                      const nextIndex =
                        historyIndex === null ? history.length - 1 : Math.max(0, historyIndex - 1);
                      setHistoryIndex(nextIndex);
                      setInput(history[nextIndex]);
                    }
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      if (historyIndex === null) return;
                      const nextIndex = historyIndex + 1;
                      if (nextIndex >= history.length) {
                        setHistoryIndex(null);
                        setInput("");
                      } else {
                        setHistoryIndex(nextIndex);
                        setInput(history[nextIndex]);
                      }
                    }
                  }}
                  placeholder={es ? "escribe help..." : "type help..."}
                  spellCheck={false}
                  autoComplete="off"
                  className="flex-1 bg-transparent outline-none text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)]/60"
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
