import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// ── Tipos ──────────────────────────────────────────────────────────────────
type EntryType = "input" | "output" | "atlas" | "build" | "matrix" | "neofetch" | "hack" | "polaris-egg" | "flip";

interface TerminalEntry {
  id: string;
  type: EntryType;
  text: string;
  flipped?: boolean;
}

// ── Comandos disponibles (para autocomplete) ──────────────────────────────
const ALL_COMMANDS = [
  "help","whoami","services","portfolio","stack","contact","quote",
  "fortune","clear","build","estimate","matrix","polaris",
  "ping","hire","neofetch","hack","sudo","flip","download"
];

// ── Fortunes ─────────────────────────────────────────────────────────────
const FORTUNES_ES = [
  "Tu próximo cliente está buscando tu web ahora mismo. ¿La encontrará?",
  "El 70% de los consumidores dominicanos investigan online antes de comprar.",
  "Una web que carga en 3s pierde el 53% de sus visitantes.",
  "La mejor inversión digital es la que haces antes que tu competencia.",
  "No necesitas ser grande para tener presencia digital. Solo necesitas empezar.",
  "React es usado por el 40% de los desarrolladores profesionales del mundo.",
  "Un buen diseño web genera confianza en los primeros 0.05 segundos.",
];
const FORTUNES_EN = [
  "Your next client is searching for your website right now. Will they find it?",
  "70% of Dominican consumers research online before buying.",
  "A site that takes 3s to load loses 53% of its visitors.",
  "The best digital investment is the one you make before your competition.",
  "You don't need to be big to have a digital presence. You just need to start.",
  "React is used by 40% of professional developers worldwide.",
  "Good web design builds trust in the first 0.05 seconds.",
];

// ── BuildSimulator ────────────────────────────────────────────────────────
function BuildSimulator({ es, onComplete }: { es: boolean; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    let p = 0;
    const iv = setInterval(() => {
      const inc = Math.floor(Math.random() * 12) + 6;
      p = Math.min(p + inc, 100);
      setProgress(p);
      if (p < 40) setStep(0);
      else if (p < 65) setStep(1);
      else if (p < 85) setStep(2);
      else if (p < 100) setStep(3);
      else { setStep(4); clearInterval(iv); setTimeout(onComplete, 400); }
    }, 150);
    return () => clearInterval(iv);
  }, [onComplete]);
  const bar = (n: number) => "█".repeat(Math.floor(n / 10)) + "░".repeat(10 - Math.floor(n / 10));
  const steps = es
    ? ["Inicializando proyecto...","Instalando dependencias...","Compilando React + Vite...","Desplegando en Vercel..."]
    : ["Initializing project...","Installing dependencies...","Compiling React + Vite...","Deploying to Vercel..."];
  return (
    <div className="space-y-1 text-cyan-400 pl-4 font-mono leading-relaxed select-none">
      {[0,1,2,3].map(i => step >= i && (
        <div key={i} className="flex flex-wrap gap-2 items-center">
          <span>→ {steps[i]}</span>
          <span className="text-white/40">{step === i ? `${bar(progress)} ${progress}%` : `${bar([40,65,85,100][i])} ${[40,65,85,100][i]}%`}</span>
        </div>
      ))}
      {step === 4 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-emerald-400 space-y-1 mt-2 border-l-2 border-emerald-500/30 pl-3">
          <p>✦ {es ? "Sitio en producción: https://tu-negocio.vercel.app" : "Production URL: https://your-brand.vercel.app"}</p>
          <p className="text-white/40 text-[11px]">{es ? "  Tiempo total: 2.3s — sin WordPress, sin plantillas, puro metal." : "  Total time: 2.3s — zero WordPress, zero templates, pure performance."}</p>
        </motion.div>
      )}
    </div>
  );
}

// ── MatrixRain ────────────────────────────────────────────────────────────
function MatrixRain({ onComplete }: { onComplete: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext("2d"); if (!ctx) return;
    canvas.width = canvas.parentElement?.clientWidth || 600;
    canvas.height = 200;
    const snippets = ["useState(true)","useEffect(() => {}, [])","framer-motion","Vite 6 + Tailwind 4","<AnimatePresence>","PolarisWeb.studio","GoogleGenAI({ apiKey })","TypeScript","export default function","Punta Cana, RD","Cristian Dicen","atlas@terminal:~$"];
    const fontSize = 11;
    const cols = Math.floor(canvas.width / 60);
    const drops = Array(cols).fill(0);
    const dropSnippets = Array(cols).fill("").map(() => snippets[Math.floor(Math.random() * snippets.length)]);
    ctx.fillStyle = "rgba(10,10,15,1)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    let fId: number;
    const timer = setTimeout(onComplete, 8000);
    const draw = () => {
      ctx.fillStyle = "rgba(10,10,15,0.12)";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.font = `${fontSize}px "Fira Code", monospace`;
      for (let i = 0; i < drops.length; i++) {
        const hue = 180 + Math.random() * 60;
        ctx.fillStyle = `hsla(${hue}, 90%, 65%, ${Math.random() * 0.4 + 0.6})`;
        ctx.fillText(dropSnippets[i], i * (canvas.width / cols) + 2, drops[i] * fontSize + fontSize);
        if (drops[i] * fontSize > canvas.height && Math.random() > 0.95) { drops[i] = 0; dropSnippets[i] = snippets[Math.floor(Math.random() * snippets.length)]; }
        drops[i]++;
      }
      fId = requestAnimationFrame(draw);
    };
    fId = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(fId); clearTimeout(timer); };
  }, [onComplete]);
  return (
    <div className="relative rounded overflow-hidden border border-white/5 bg-[#0a0a0f] h-[200px]">
      <canvas ref={canvasRef} className="w-full h-full block" />
      <div className="absolute top-2 right-2 bg-cyan-500/20 text-[10px] text-cyan-300 px-1.5 py-0.5 rounded font-mono select-none">atlas_matrix.exe</div>
    </div>
  );
}

// ── NeofetchDisplay ───────────────────────────────────────────────────────
function NeofetchDisplay() {
  return (
    <div className="pl-4 font-mono text-xs space-y-1 leading-relaxed">
      <div className="flex gap-6">
        <div className="text-cyan-400 space-y-1 select-none">
          <p>{"    ✦    "}</p>
          <p>{"  ✦ ✦ ✦  "}</p>
          <p>{"✦ ✦ ✦ ✦ ✦"}</p>
          <p>{"  ✦ ✦ ✦  "}</p>
          <p>{"    ✦    "}</p>
        </div>
        <div className="space-y-1">
          <p><span className="text-cyan-400 font-bold">atlas</span><span className="text-white/40">@</span><span className="text-violet-400 font-bold">polaris-studio</span></p>
          <p className="text-white/20">──────────────────────</p>
          <p><span className="text-cyan-400">OS:</span> <span className="text-white/70">Polaris OS v1.0 (Caribbean Edition)</span></p>
          <p><span className="text-cyan-400">Kernel:</span> <span className="text-white/70">React 19 + Vite 6</span></p>
          <p><span className="text-cyan-400">Shell:</span> <span className="text-white/70">Atlas Terminal v1.0</span></p>
          <p><span className="text-cyan-400">CPU:</span> <span className="text-white/70">Gemini 3.1 Flash Lite</span></p>
          <p><span className="text-cyan-400">GPU:</span> <span className="text-white/70">Framer Motion 11</span></p>
          <p><span className="text-cyan-400">RAM:</span> <span className="text-white/70">sessionStorage (∞)</span></p>
          <p><span className="text-cyan-400">Location:</span> <span className="text-white/70">Punta Cana, RD 🌴</span></p>
          <p><span className="text-cyan-400">Uptime:</span> <span className="text-white/70">24/7/365</span></p>
          <p><span className="text-cyan-400">Stack:</span> <span className="text-white/70">TypeScript · Tailwind · Firebase</span></p>
        </div>
      </div>
    </div>
  );
}

// ── HackAnimation ─────────────────────────────────────────────────────────
function HackAnimation({ es, onComplete }: { es: boolean; onComplete: () => void }) {
  const [lines, setLines] = useState<string[]>([]);
  useEffect(() => {
    const sequence = es ? [
      "> Iniciando secuencia de acceso...",
      "> Escaneando puertos: 22, 80, 443, 3000...",
      "> Bypass firewall... [████████░░] 80%",
      "> ERROR: Acceso denegado.",
      "> Reintentando con credenciales alternativas...",
      "> Analizando vulnerabilidades...",
      "> ACCESO CONCEDIDO — just kidding 😄",
      "> No hay nada que hackear aquí.",
      "> Solo código limpio y React.",
    ] : [
      "> Initiating access sequence...",
      "> Scanning ports: 22, 80, 443, 3000...",
      "> Firewall bypass... [████████░░] 80%",
      "> ERROR: Access denied.",
      "> Retrying with alternate credentials...",
      "> Analyzing vulnerabilities...",
      "> ACCESS GRANTED — just kidding 😄",
      "> Nothing to hack here.",
      "> Just clean code and React.",
    ];
    let i = 0;
    const iv = setInterval(() => {
      if (i >= sequence.length) { clearInterval(iv); setTimeout(onComplete, 300); return; }
      setLines(prev => [...prev, sequence[i]]);
      i++;
    }, 400);
    return () => clearInterval(iv);
  }, [es, onComplete]);
  return (
    <div className="pl-4 font-mono text-xs space-y-0.5">
      {lines.map((l, i) => {
        if (!l) return null;
        const isGranted = l.includes("GRANTED") || l.includes("CONCEDIDO");
        const isError = l.includes("ERROR");
        return (
          <motion.p
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={isGranted ? "text-emerald-400" : isError ? "text-red-400" : "text-white/60"}
          >
            {l}
          </motion.p>
        );
      })}
    </div>
  );
}

// ── PolarisEgg ────────────────────────────────────────────────────────────
function PolarisEgg() {
  return (
    <div className="relative h-10 overflow-hidden select-none pointer-events-none pl-4">
      {Array.from({ length: 18 }, (_, i) => (
        <motion.span key={i} className="absolute text-cyan-400 text-xs font-black"
          initial={{ opacity: 1, x: Math.random() * 300, y: 0 }}
          animate={{ opacity: 0, y: -40 - Math.random() * 30, x: Math.random() * 300 }}
          transition={{ duration: 1.2 + Math.random() * 0.6, delay: Math.random() * 0.4, ease: "easeOut" }}
        >✦</motion.span>
      ))}
    </div>
  );
}

// ── TypedText ─────────────────────────────────────────────────────────────
function TypedText({ text, speed = 4, onComplete }: { text: string; speed?: number; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  useEffect(() => {
    let i = 0; setDisplayed("");
    const iv = setInterval(() => {
      setDisplayed(prev => prev + text.charAt(i)); i++;
      if (i >= text.length) { clearInterval(iv); onComplete?.(); }
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed, onComplete]);
  return <span className="whitespace-pre-wrap leading-relaxed">{displayed}</span>;
}

// ── AtlasTyped (respuesta IA con indicador) ───────────────────────────────
function AtlasTyped({ text }: { text: string }) {
  return (
    <div className="pl-4">
      <span className="text-cyan-400 font-bold font-mono text-xs">✦ Atlas &gt; </span>
      <TypedText text={text} speed={12} />
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────
export default function TerminalPage() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const es = language === "es";

  const [input, setInput] = useState("");
  const [history, setHistory] = useState<TerminalEntry[]>([]);
  const [pendingInputType, setPendingInputType] = useState<"estimate" | null>(null);
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [cmdHistoryIndex, setCmdHistoryIndex] = useState(-1);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiConvHistory, setAiConvHistory] = useState<{ role: string; content: string }[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [history]);

  const addEntry = (type: EntryType, text: string) => {
    setHistory(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type, text }]);
  };

  const getSuggestion = () => {
    if (!input || pendingInputType) return "";
    const match = ALL_COMMANDS.find(c => c.startsWith(input.toLowerCase()));
    return match && match !== input.toLowerCase() ? match.substring(input.length) : "";
  };
  const suggestion = getSuggestion();

  const processCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim().toLowerCase();
    setHistory(prev => [...prev, { id: `${Date.now()}-${Math.random()}`, type: "input", text: cmd }]);
    if (trimmed) { setCmdHistory(prev => [cmd, ...prev]); setCmdHistoryIndex(-1); }
    setInput("");

    // ── Estimate flow ──
    if (pendingInputType === "estimate") {
      const plans: Record<string, [string, string]> = {
        "1": [
          `→ Plan Destello desde $299 USD\n→ Entrega estimada: 1-2 semanas\n→ Escribe "hire" para iniciar.`,
          `→ Flash Plan from $299 USD\n→ Estimated delivery: 1-2 weeks\n→ Type "hire" to get started.`
        ],
        "2": [
          `→ Plan Constelación desde $699 USD\n→ Entrega estimada: 2-4 semanas\n→ Escribe "hire" para iniciar.`,
          `→ Constellation Plan from $699 USD\n→ Estimated delivery: 2-4 weeks\n→ Type "hire" to get started.`
        ],
        "3": [
          `→ Plan Nova desde $1,299 USD\n→ Entrega estimada: 4-6 semanas\n→ Escribe "hire" para iniciar.`,
          `→ Nova Plan from $1,299 USD\n→ Estimated delivery: 4-6 weeks\n→ Type "hire" to get started.`
        ],
        "4": [
          `→ Proyecto personalizado\n→ Escribe "hire" o visita /cotizar.`,
          `→ Custom project\n→ Type "hire" or visit /cotizar.`
        ],
      };
      if (plans[trimmed]) {
        addEntry("output", plans[trimmed][es ? 0 : 1]);
        if (trimmed === "4") setTimeout(() => navigate("/cotizar"), 1500);
      } else {
        addEntry("output", es ? "Elige 1, 2, 3 o 4." : "Choose 1, 2, 3 or 4.");
      }
      setPendingInputType(null);
      return;
    }

    switch (trimmed) {
      case "help":
        addEntry("output", es
          ? `Comandos disponibles:\n  help        — Esta lista\n  whoami      — Sobre Polaris\n  services    — Planes y precios\n  portfolio   — Proyectos demo\n  stack       — Stack tecnológico\n  contact     — Contacto\n  quote/hire  — Cotizador de proyectos\n  build       — Simular build\n  estimate    — Calculador de precios\n  matrix      — Lluvia de código\n  fortune     — Dato aleatorio\n  neofetch    — Specs del sistema\n  hack        — ...\n  sudo        — ...\n  flip        — ...\n  ping        — WhatsApp directo\n  download    — Brief descargable\n  polaris     — 🤫\n  clear       — Limpiar terminal`
          : `Available commands:\n  help        — This list\n  whoami      — About Polaris\n  services    — Plans & pricing\n  portfolio   — Demo projects\n  stack       — Tech stack\n  contact     — Contact info\n  quote/hire  — Project planner\n  build       — Simulate build\n  estimate    — Quick price calc\n  matrix      — Code rain\n  fortune     — Random fact\n  neofetch    — System specs\n  hack        — ...\n  sudo        — ...\n  flip        — ...\n  ping        — WhatsApp direct\n  download    — Downloadable brief\n  polaris     — 🤫\n  clear       — Clear terminal`
        ); break;

      case "whoami":
        addEntry("output", es
          ? `✦ Polaris Web Studio\n  Agencia de desarrollo web en Punta Cana, RD.\n  Fundada por Cristian Dicen.\n  React · TypeScript · Framer Motion · IA.\n  Misión: digitalizar negocios dominicanos con código premium.`
          : `✦ Polaris Web Studio\n  Bespoke web dev agency in Punta Cana, DR.\n  Founded by Cristian Dicen.\n  React · TypeScript · Framer Motion · AI.\n  Mission: upgrade local businesses with premium code.`
        ); break;

      case "services":
        addEntry("output", es
          ? `┌─────────────────────────────────────┐\n  │  ✦ Destello      │  desde $299 USD  │\n  ├─────────────────────────────────────┤\n  │  ✦ Constelación  │  desde $699 USD  │\n  ├─────────────────────────────────────┤\n  │  ✦ Nova          │  desde $1,299    │\n  └─────────────────────────────────────┘\n  → Escribe "estimate" para calcular`
          : `┌─────────────────────────────────────┐\n  │  ✦ Flash         │  from $299 USD   │\n  ├─────────────────────────────────────┤\n  │  ✦ Constellation │  from $699 USD   │\n  ├─────────────────────────────────────┤\n  │  ✦ Nova          │  from $1,299     │\n  └─────────────────────────────────────┘\n  → Type "estimate" to calculate`
        ); break;

      case "portfolio":
        addEntry("output", es
          ? `Proyectos:\n  1. Lúmina Sky      — Hotel boutique de lujo\n  2. Nexus Realty    — Bienes raíces premium\n  3. Chroma Store    — Audio audiófilo\n  4. Vitality Med    — Clínica estética\n  5. Tano Excursions — Tours en RD\n  → Escribe "hire" para empezar el tuyo.`
          : `Projects:\n  1. Lúmina Sky      — Luxury boutique hotel\n  2. Nexus Realty    — Premium real estate\n  3. Chroma Store    — Hi-Fi audio store\n  4. Vitality Med    — Aesthetic clinic\n  5. Tano Excursions — DR bespoke tours\n  → Type "hire" to start yours.`
        ); break;

      case "stack":
        addEntry("output",
          `⚡ React 19 + TypeScript + Vite 6\n  🎨 Tailwind CSS v4 + Framer Motion\n  🧱 Firebase · Firestore · Auth\n  🤖 Gemini Flash · Grok 4.3\n  💳 Stripe · PayPal\n  📊 Google Analytics 4 + Search Console`
        ); break;

      case "contact":
        addEntry("output", es
          ? `📧 hola@polarisweb.studio\n  📱 +1 (829) 920-0544\n  📸 @polariswebstudio\n  📍 Punta Cana, República Dominicana`
          : `📧 hola@polarisweb.studio\n  📱 +1 (829) 920-0544\n  📸 @polariswebstudio\n  📍 Punta Cana, Dominican Republic`
        ); break;

      case "quote":
      case "hire":
        addEntry("output", es ? "Iniciando cotizador..." : "Opening project planner...");
        setTimeout(() => navigate("/cotizar"), 800);
        break;

      case "fortune":
        const fortunes = es ? FORTUNES_ES : FORTUNES_EN;
        addEntry("output", `💡 ${fortunes[Math.floor(Math.random() * fortunes.length)]}`);
        break;

      case "build":
        addEntry("build", "");
        break;

      case "estimate":
        setPendingInputType("estimate");
        addEntry("output", es
          ? `¿Qué tipo de proyecto necesitas?\n  [1] Landing page\n  [2] Web corporativa\n  [3] E-commerce\n  [4] Personalizado / Enterprise`
          : `What type of project do you need?\n  [1] Landing page\n  [2] Corporate website\n  [3] E-commerce\n  [4] Custom / Enterprise`
        ); break;

      case "matrix":
        addEntry("matrix", "");
        break;

      case "polaris":
        addEntry("output", es
          ? `✦✦✦ POLARIS UNLOCKED ✦✦✦\n  Encontraste el easter egg secreto.\n  Aquí se construye el futuro digital de la RD.\n  Código limpio. Sin plantillas. Sin límites.\n  — Cristian Dicen, fundador`
          : `✦✦✦ POLARIS UNLOCKED ✦✦✦\n  You found the secret easter egg.\n  This is where DR's digital future is built.\n  Clean code. Zero templates. Zero limits.\n  — Cristian Dicen, founder`
        );
        addEntry("polaris-egg", "");
        break;

      case "ping":
        addEntry("output", es ? "Abriendo WhatsApp..." : "Opening WhatsApp...");
        setTimeout(() => window.open("https://wa.me/18299200544?text=Hola%20Polaris%2C%20vi%20Atlas%20Terminal%20y%20quiero%20saber%20más%20sobre%20sus%20servicios.", "_blank"), 600);
        break;

      case "neofetch":
        addEntry("neofetch", "");
        break;

      case "hack":
        addEntry("hack", "");
        break;

      case "sudo":
        addEntry("output", es
          ? `Permission denied.\nSolo Cristian tiene acceso root.`
          : `Permission denied.\nOnly Cristian has root access.`
        ); break;

      case "flip":
        setIsFlipped(prev => !prev);
        addEntry("output", es
          ? `Terminal ${isFlipped ? "restaurada" : "volteada"}. Escribe "flip" otra vez para revertir.`
          : `Terminal ${isFlipped ? "restored" : "flipped"}. Type "flip" again to revert.`
        ); break;

      case "download":
        addEntry("output", es
          ? `📄 Polaris Brief v1.0\n  → Próximamente disponible para descarga.\n  Por ahora escribe "contact" para hablar con nosotros.`
          : `📄 Polaris Brief v1.0\n  → Coming soon as a downloadable PDF.\n  For now type "contact" to reach us.`
        ); break;

      case "clear":
        setHistory([]);
        break;

      default:
        // ── Fallback IA ──
        if (!trimmed) break;
        setIsAiLoading(true);
        addEntry("output", es ? "✦ Atlas procesando..." : "✦ Atlas thinking...");
        try {
          const res = await fetch("/api/terminal-ai", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ message: cmd, history: aiConvHistory })
          });
          const data = await res.json();
          setHistory(prev => prev.slice(0, -1)); // quita "procesando..."
          if (data.reply) {
            addEntry("atlas", data.reply);
            setAiConvHistory(prev => [
              ...prev,
              { role: "user", content: cmd },
              { role: "assistant", content: data.reply }
            ]);
          } else {
            addEntry("output", es ? "Error de conexión con Atlas." : "Atlas connection error.");
          }
        } catch {
          setHistory(prev => prev.slice(0, -1));
          addEntry("output", es ? "Atlas no disponible en este momento." : "Atlas unavailable right now.");
        } finally {
          setIsAiLoading(false);
        }
    }
  }, [es, navigate, pendingInputType, isFlipped, aiConvHistory]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (!cmdHistory.length) return;
      const next = Math.min(cmdHistoryIndex + 1, cmdHistory.length - 1);
      setCmdHistoryIndex(next); setInput(cmdHistory[next]);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      if (cmdHistoryIndex <= 0) { setCmdHistoryIndex(-1); setInput(""); return; }
      const next = cmdHistoryIndex - 1;
      setCmdHistoryIndex(next); setInput(cmdHistory[next]);
    } else if (e.key === "Tab" || e.key === "ArrowRight") {
      if (suggestion) { e.preventDefault(); setInput(input + suggestion); }
    } else if (e.key === "Enter") {
      if (input.trim() || pendingInputType) processCommand(input);
    }
  };

  return (
    <div
      className="min-h-dvh bg-[#0a0a0f] flex flex-col font-mono text-xs overflow-hidden"
      onClick={() => inputRef.current?.focus()}
      style={{ transform: isFlipped ? "rotate(180deg)" : "none", transition: "transform 0.5s ease" }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/5 bg-[#111118] shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          className="flex items-center gap-2 text-white/40 hover:text-white/80 transition-colors text-[11px]"
        >
          <ArrowLeft size={14} />
          <span>{es ? "Volver" : "Back"}</span>
        </button>

        {/* Atlas Terminal title */}
        <div className="flex items-center gap-1.5 select-none">
          <span className="text-white/70 font-black text-sm tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">Atlas Term</span>
          </span>
          <motion.span
            animate={{ opacity: [1, 1, 0, 0], scale: [1, 1.2, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.2, times: [0, 0.4, 0.5, 1], ease: "linear" }}
            className="text-cyan-400 font-black text-sm"
          >✦</motion.span>
          <span className="text-white/70 font-black text-sm tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400">nal</span>
          </span>
        </div>

        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
        </div>
      </div>

      {/* Terminal body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Welcome */}
        <div className="text-cyan-400/80 space-y-1">
          <p className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 font-black text-sm">
            ✦ Atlas Terminal v1.0 — Polaris Web Studio
          </p>
          <p className="text-white/30 text-[11px]">
            {es
              ? 'Escribe "help" para explorar comandos. Prueba "neofetch", "hack", "matrix" o simplemente escribe lo que necesitas.'
              : 'Type "help" to explore. Try "neofetch", "hack", "matrix" or just type what you need.'}
          </p>
        </div>

        {/* History */}
        {history.map(entry => (
          <div key={entry.id} className="space-y-1">
            {entry.type === "input" ? (
              <div className="flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-bold">atlas@polaris:~$</span>
                <span className="text-white/80">{entry.text}</span>
              </div>
            ) : entry.type === "atlas" ? (
              <AtlasTyped text={entry.text} />
            ) : entry.type === "build" ? (
              <BuildSimulator es={es} onComplete={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }} />
            ) : entry.type === "matrix" ? (
              <MatrixRain onComplete={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }} />
            ) : entry.type === "neofetch" ? (
              <NeofetchDisplay />
            ) : entry.type === "hack" ? (
              <HackAnimation es={es} onComplete={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }} />
            ) : entry.type === "polaris-egg" ? (
              <PolarisEgg />
            ) : (
              <div className="text-white/60 pl-4">
                <TypedText text={entry.text} speed={3} />
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {isAiLoading && (
          <div className="pl-4 flex items-center gap-2 text-cyan-400/60">
            <motion.span animate={{ opacity: [0.3, 1, 0.3] }} transition={{ repeat: Infinity, duration: 1 }}>✦</motion.span>
            <span>{es ? "Atlas procesando..." : "Atlas thinking..."}</span>
          </div>
        )}

        {/* Input line */}
        <div className="flex items-center gap-2 relative">
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-violet-400 font-bold shrink-0 select-none">
            atlas@polaris:~$
          </span>
          <div className="flex-1 relative flex items-center min-h-[1.5rem]">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isAiLoading}
              className="w-full bg-transparent text-transparent outline-none caret-transparent z-10 font-mono text-xs py-0.5"
              spellCheck={false}
              autoComplete="off"
            />
            <div className="absolute left-0 top-0 bottom-0 right-0 pointer-events-none select-none flex items-center z-0 whitespace-pre overflow-hidden font-mono text-xs py-0.5">
              <span className="text-white/80">{input}</span>
              <motion.span
                animate={{ opacity: [1, 1, 0, 0] }}
                transition={{ repeat: Infinity, duration: 1.0, times: [0, 0.5, 0.5, 1], ease: "linear" }}
                className="text-cyan-400 font-black mx-[1px]"
              >✦</motion.span>
              {suggestion && <span className="text-white/20">{suggestion}</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
