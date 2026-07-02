import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Terminal as TerminalIcon, 
  Cpu, 
  Layers, 
  HelpCircle, 
  Zap, 
  Code, 
  Activity, 
  User, 
  Globe, 
  Wifi, 
  Compass, 
  DollarSign, 
  Briefcase, 
  Clock, 
  Sparkles,
  Download,
  Flame,
  FileText,
  MousePointerClick,
  Lock,
  Phone
} from "lucide-react";
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
function BuildSimulator({ es, onComplete, onBusyChange }: { es: boolean; onComplete: () => void; onBusyChange?: (busy: boolean) => void }) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Deps vacías a propósito: el padre re-renderiza cada ~2s (telemetría del
  // HUD) pasando un onComplete/onBusyChange con referencia nueva cada vez; si
  // entraran en las deps, la simulación se reiniciaría desde 0% en cada tick.
  useEffect(() => {
    onBusyChange?.(true);
    // Dispara onBusyChange(false) una sola vez, con lo que ocurra primero: la
    // finalización natural de la simulación o el desmontaje del componente.
    // Antes solo se avisaba "libre" al desmontar — pero estas tarjetas se
    // quedan montadas en el historial para siempre, así que la telemetría del
    // HUD se quedaba "ocupada" (CPU alta) de forma permanente tras un build.
    let idleSignaled = false;
    const signalIdle = () => {
      if (idleSignaled) return;
      idleSignaled = true;
      onBusyChange?.(false);
    };
    let p = 0;
    const iv = setInterval(() => {
      const inc = Math.floor(Math.random() * 12) + 6;
      p = Math.min(p + inc, 100);
      setProgress(p);
      if (p < 40) setStep(0);
      else if (p < 65) setStep(1);
      else if (p < 85) setStep(2);
      else if (p < 100) setStep(3);
      else { setStep(4); clearInterval(iv); setTimeout(() => onCompleteRef.current?.(), 400); signalIdle(); }
    }, 150);
    return () => { clearInterval(iv); signalIdle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
function MatrixRain({ onComplete, onBusyChange }: { onComplete: () => void; onBusyChange?: (busy: boolean) => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // Deps vacías a propósito (ver BuildSimulator): evita que la lluvia se
  // reinicie desde cero cada ~2s por el re-render de la telemetría del HUD.
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
    onBusyChange?.(true);
    // Ver comentario equivalente en BuildSimulator: sin esto, la telemetría
    // se quedaba "ocupada" para siempre tras la finalización natural de la
    // lluvia (el componente sigue montado en el historial, no se desmonta).
    let idleSignaled = false;
    const signalIdle = () => {
      if (idleSignaled) return;
      idleSignaled = true;
      onBusyChange?.(false);
    };
    let fId: number;
    let stopped = false;
    // Antes la animación seguía corriendo indefinidamente en segundo plano
    // (requestAnimationFrame sin condición de salida) por cada vez que se
    // ejecutaba "matrix", incluso ya scrolleada fuera de vista. Ahora se
    // detiene sola a los 8s.
    const stopTimer = setTimeout(() => {
      stopped = true;
      cancelAnimationFrame(fId);
      onCompleteRef.current?.();
      signalIdle();
    }, 8000);
    const draw = () => {
      if (stopped) return;
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
    return () => { stopped = true; cancelAnimationFrame(fId); clearTimeout(stopTimer); signalIdle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
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
function HackAnimation({ es, onComplete, onBusyChange }: { es: boolean; onComplete: () => void; onBusyChange?: (busy: boolean) => void }) {
  const [lines, setLines] = useState<string[]>([]);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  // onComplete queda fuera de las deps a propósito (ver BuildSimulator): con
  // el padre re-renderizando cada ~2s por la telemetría, este efecto se
  // reiniciaba en cada tick — pero como `lines` solo se acumulaba (nunca se
  // vaciaba en el reinicio), la secuencia de 9 líneas se repetía sin parar,
  // empujando el input hacia abajo hasta sacarlo de la pantalla.
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
    onBusyChange?.(true);
    // Ver comentario equivalente en BuildSimulator/MatrixRain: sin esto la
    // telemetría se quedaba "ocupada" para siempre tras terminar la secuencia.
    let idleSignaled = false;
    const signalIdle = () => {
      if (idleSignaled) return;
      idleSignaled = true;
      onBusyChange?.(false);
    };
    setLines([]);
    const iv = setInterval(() => {
      // Índice derivado de prev.length (no un `let i` externo mutado aparte):
      // ese patrón permitía que, si el closure del updater se resolvía después
      // de que un tick posterior ya hubiera incrementado `i`, se leyera o
      // repitiera la línea equivocada de `sequence` (mismo tipo de condición de
      // carrera que afectaba a TypedText con "Comandos" → "Cmandos").
      setLines(prev => {
        if (prev.length >= sequence.length) {
          clearInterval(iv);
          return prev;
        }
        const next = [...prev, sequence[prev.length]];
        if (next.length >= sequence.length) {
          clearInterval(iv);
          setTimeout(() => onCompleteRef.current?.(), 300);
          signalIdle();
        }
        return next;
      });
    }, 400);
    return () => { clearInterval(iv); signalIdle(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [es]);
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
  // Ref en vez de dependencia directa: si el padre pasa un onComplete nuevo en
  // cada render, no debe reiniciar la animación de tipeo a medio camino.
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    setDisplayed("");
    const iv = setInterval(() => {
      // Se deriva el siguiente prefijo directamente de `text` y la longitud ya
      // mostrada (estado autoritativo de React) en vez de un contador externo
      // mutado por separado: eso permitía que, si dos ticks del interval se
      // ejecutaban muy próximos entre sí (a 2ms de intervalo el navegador
      // puede encadenarlos), el closure leyera el índice ya incrementado por
      // el siguiente tick antes de que React aplicara la actualización,
      // saltándose el carácter intermedio (p. ej. "Comandos" → "Cmandos").
      setDisplayed(prev => {
        if (prev.length >= text.length) {
          clearInterval(iv);
          return prev;
        }
        const next = text.slice(0, prev.length + 1);
        if (next.length >= text.length) {
          clearInterval(iv);
          onCompleteRef.current?.();
        }
        return next;
      });
    }, speed);
    return () => clearInterval(iv);
  }, [text, speed]);

  return <span className="whitespace-pre-wrap leading-relaxed">{displayed}</span>;
}

// ── AtlasTyped (respuesta IA con indicador) ───────────────────────────────
function AtlasTyped({ text, es }: { text: string; es: boolean }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="my-3 border border-cyan-500/20 bg-cyan-950/10 rounded-xl p-4 relative overflow-hidden backdrop-blur-md shadow-lg shadow-cyan-950/20"
    >
      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-cyan-400 to-indigo-500" />
      <div className="flex items-center justify-between mb-2 text-[10px] uppercase tracking-widest text-cyan-400 font-bold select-none border-b border-cyan-500/10 pb-1.5">
        <div className="flex items-center gap-2">
          <Sparkles size={12} className="animate-pulse text-cyan-400" />
          <span>▲ {es ? "CANAL ATLAS COPROCESADOR" : "ATLAS COPROCESSOR LINK"}</span>
        </div>
        <span className="text-white/30 text-[9px]">DEC_CORE_V1.1</span>
      </div>
      <div className="text-white/90 pl-1 leading-relaxed text-xs">
        <TypedText text={text} speed={8} />
      </div>
    </motion.div>
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

  // Cantidad de "efectos pesados" corriendo a la vez (build/matrix/hack) —
  // permite que el panel de telemetría reaccione de verdad al trabajo en
  // curso en vez de solo fluctuar al azar sin relación con lo que se ejecuta.
  const [activeFx, setActiveFx] = useState(0);
  const handleFxBusyChange = useCallback((busy: boolean) => {
    setActiveFx(c => Math.max(0, c + (busy ? 1 : -1)));
  }, []);

  // Telemetría simulada en tiempo real
  const [metrics, setMetrics] = useState({
    cpu: 14,
    ram: 8.35,
    ping: 36,
    temp: 32,
    uptime: "00:00:00"
  });

  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Ref en vez de leer activeFx/isAiLoading directo dentro del interval de
  // abajo: ese efecto solo se monta una vez ([] deps) para no reiniciar el
  // reloj de uptime, así que necesita una vía sin closures obsoletos para
  // enterarse del estado "busy" más reciente en cada tick.
  const busyRef = useRef(false);
  useEffect(() => {
    busyRef.current = activeFx > 0 || isAiLoading;
  }, [activeFx, isAiLoading]);

  // Reloj de uptime y actualización de telemetría
  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const diff = Date.now() - start;
      const secs = Math.floor(diff / 1000) % 60;
      const mins = Math.floor(diff / 60000) % 60;
      const hrs = Math.floor(diff / 3600000);
      const uptimeStr = `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;

      // Con un comando "pesado" corriendo (build/matrix/hack) o Atlas
      // procesando, el HUD sube a rangos de carga real en vez de fluctuar
      // random sin relación con lo que está pasando en la consola.
      const busy = busyRef.current;
      setMetrics(prev => ({
        ...prev,
        cpu: busy ? Math.floor(Math.random() * 25) + 55 : Math.floor(Math.random() * 26) + 8,
        ping: busy ? Math.floor(Math.random() * 30) + 42 : Math.floor(Math.random() * 18) + 24,
        temp: busy ? Math.floor(Math.random() * 6) + 37 : Math.floor(Math.random() * 4) + 31,
        ram: busy ? parseFloat((9.4 + Math.random() * 1.1).toFixed(2)) : parseFloat((8.1 + Math.random() * 0.4).toFixed(2)),
        uptime: uptimeStr
      }));
    }, 2000);
    return () => clearInterval(interval);
  }, []);

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

  const handleQuickCommand = (cmdStr: string) => {
    processCommand(cmdStr);
    inputRef.current?.focus();
  };

  // Botones de accesos rápidos para móvil y panel lateral
  const QUICK_CHIPS = [
    { cmd: "help", label: "help", icon: <HelpCircle size={12} className="text-cyan-400" />, desc: es ? "Comandos" : "Commands" },
    { cmd: "neofetch", label: "neofetch", icon: <Cpu size={12} className="text-violet-400" />, desc: es ? "Especificaciones" : "System specs" },
    { cmd: "matrix", label: "matrix", icon: <Code size={12} className="text-emerald-400" />, desc: es ? "Lluvia código" : "Matrix rain" },
    { cmd: "build", label: "build", icon: <Zap size={12} className="text-amber-400" />, desc: es ? "Despliegue" : "Sim build" },
    { cmd: "services", label: "services", icon: <Layers size={12} className="text-indigo-400" />, desc: es ? "Precios y planes" : "Services info" },
    { cmd: "estimate", label: "estimate", icon: <DollarSign size={12} className="text-rose-400" />, desc: es ? "Calculador" : "Quick estimate" },
    { cmd: "hack", label: "hack", icon: <Lock size={12} className="text-red-400" />, desc: es ? "Secuencia hack" : "Bypass firewall" },
    { cmd: "fortune", label: "fortune", icon: <Sparkles size={12} className="text-teal-400" />, desc: es ? "Dato aleatorio" : "Random tip" },
    { cmd: "contact", label: "contact", icon: <Phone size={12} className="text-sky-400" />, desc: es ? "WhatsApp" : "Direct reach" },
  ];

  return (
    <div
      className="min-h-dvh bg-[#020205] text-[#d1d5db] flex flex-col font-mono text-xs overflow-hidden relative selection:bg-cyan-500/30 selection:text-white"
      onClick={() => inputRef.current?.focus()}
      style={{ transform: isFlipped ? "rotate(180deg)" : "none", transition: "transform 0.5s ease" }}
    >
      {/* Patrones de rejilla de fondo para un efecto cyberpunk holográfico */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,_rgba(0,0,0,0.2)_50%)] bg-[size:100%_4px] pointer-events-none opacity-40 z-10" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06)_0%,rgba(0,0,0,0)_80%)] pointer-events-none z-0" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-cyan-500/5 blur-[120px] rounded-full pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-violet-500/5 blur-[100px] rounded-full pointer-events-none z-0" />

      {/* Header unificado con aspecto HUD */}
      <header className="flex items-center justify-between px-4 py-3.5 border-b border-white/5 bg-[#08080f]/90 backdrop-blur-md shrink-0 z-20">
        <button
          onClick={(e) => { e.stopPropagation(); navigate(-1); }}
          className="flex items-center gap-2 text-white/50 hover:text-cyan-400 transition-all duration-300 text-[11px] border border-white/10 hover:border-cyan-500/30 rounded-lg px-2.5 py-1.5 bg-white/5 active:scale-95"
        >
          <ArrowLeft size={13} className="text-cyan-400" />
          <span className="tracking-wide uppercase text-[10px] font-bold">{es ? "Volver" : "Back"}</span>
        </button>

        {/* Atlas Terminal title */}
        <div className="flex items-center gap-2 select-none">
          <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="text-white/80 font-black text-sm tracking-widest uppercase">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 font-bold">ATLAS TERMINAL</span>
          </span>
          <motion.span
            animate={{ opacity: [1, 1, 0, 0], scale: [1, 1.2, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 1.5, times: [0, 0.4, 0.5, 1], ease: "linear" }}
            className="text-cyan-400 font-bold text-xs"
          >✦</motion.span>
        </div>

        {/* System signals */}
        <div className="flex items-center gap-4 text-[10px] text-white/30 select-none">
          <div className="hidden sm:flex items-center gap-1.5 border-r border-white/10 pr-3">
            <Wifi size={11} className="text-emerald-400" />
            <span className="text-[10px] text-emerald-400/80 font-bold uppercase tracking-wider">SECURE_LINK</span>
          </div>
          <div className="flex gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-500/70 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
            <div className="w-2 h-2 rounded-full bg-yellow-500/70 shadow-[0_0_8px_rgba(234,179,8,0.5)]" />
            <div className="w-2 h-2 rounded-full bg-green-500/70 shadow-[0_0_8px_rgba(34,197,94,0.5)] animate-pulse" />
          </div>
        </div>
      </header>

      {/* Main Layout Area */}
      <div className="flex-1 flex overflow-hidden z-15 relative">
        
        {/* PANEL IZQUIERDO: La pantalla del terminal retro */}
        <div className="flex-1 flex flex-col p-3 md:p-4 overflow-hidden">
          
          {/* El marco simulado de pantalla CRT */}
          <div className="flex-1 flex flex-col bg-[#040409]/95 border border-cyan-500/10 rounded-2xl relative overflow-hidden shadow-[inset_0_0_30px_rgba(6,182,212,0.06),0_12px_40px_rgba(0,0,0,0.8)] backdrop-blur-sm">
            
            {/* Esquinas decorativas Cyberpunk */}
            <div className="absolute top-2 left-2 text-[10px] font-bold text-cyan-400/30 select-none">┌</div>
            <div className="absolute top-2 right-2 text-[10px] font-bold text-cyan-400/30 select-none">┐</div>
            <div className="absolute bottom-2 left-2 text-[10px] font-bold text-cyan-400/30 select-none">└</div>
            <div className="absolute bottom-2 right-2 text-[10px] font-bold text-cyan-400/30 select-none">┘</div>

            {/* Micro-visor status bar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#06060c]/80 text-[10px] text-white/40 select-none shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span>SHELL: <span className="text-cyan-400">atlas_sh_v1.0</span></span>
              </div>
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline">TTY: <span className="text-white/60">pts/0</span></span>
                <span>MODEL: <span className="text-violet-400 font-bold">GEMINI_FLASH_LITE</span></span>
              </div>
            </div>

            {/* Cuerpo del terminal con scroll */}
            <div 
              ref={scrollRef} 
              className="flex-1 overflow-y-auto p-4 md:p-5 space-y-4 font-mono leading-relaxed relative bg-gradient-to-b from-transparent to-cyan-950/2"
              style={{ contentVisibility: "auto" }}
            >
              
              {/* Mensaje de bienvenida super premium */}
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-2 border-b border-white/5 pb-4"
              >
                <div className="flex items-center gap-2">
                  <TerminalIcon className="text-cyan-400 animate-pulse" size={16} />
                  <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-400 to-rose-400 font-black text-sm tracking-widest">
                    ATLAS COMMAND CONSOLE v1.0
                  </h1>
                </div>
                <p className="text-white/40 text-[11px] leading-relaxed max-w-2xl">
                  {es
                    ? 'Explora las capacidades de Polaris Web Studio con comandos interactivos. Escribe "help" para ver un catálogo de servicios, estimaciones rápidas de costos, simulaciones de despliegues o habla directamente con el coprocesador de Inteligencia Artificial.'
                    : 'Explore Polaris Web Studio via interactive terminal commands. Type "help" to list capabilities, project pricing estimates, simulate compiled builds, or dialogue with the AI Coprocessor.'}
                </p>
                <div className="flex flex-wrap gap-2 text-[9px] text-cyan-400/60 font-bold uppercase select-none mt-1">
                  <span className="bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">⚡ React 19</span>
                  <span className="bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">🧱 Vite 6</span>
                  <span className="bg-cyan-950/40 border border-cyan-500/20 px-2 py-0.5 rounded">✨ Premium UX</span>
                </div>
              </motion.div>

              {/* Historial de Comandos ejecutados */}
              {history.map(entry => (
                <div key={entry.id} className="space-y-1">
                  {entry.type === "input" ? (
                    <div className="flex items-start gap-2.5 my-2">
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-bold select-none shrink-0">
                        atlas@polaris:~$
                      </span>
                      <span className="text-white font-bold tracking-wide break-all">{entry.text}</span>
                    </div>
                  ) : entry.type === "atlas" ? (
                    <AtlasTyped text={entry.text} es={es} />
                  ) : entry.type === "build" ? (
                    <div className="my-2 p-3 border border-cyan-500/10 bg-cyan-950/5 rounded-xl">
                      <BuildSimulator es={es} onBusyChange={handleFxBusyChange} onComplete={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }} />
                    </div>
                  ) : entry.type === "matrix" ? (
                    <div className="my-2">
                      <MatrixRain onBusyChange={handleFxBusyChange} onComplete={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }} />
                    </div>
                  ) : entry.type === "neofetch" ? (
                    <div className="my-2 p-4 border border-violet-500/10 bg-violet-950/5 rounded-xl">
                      <NeofetchDisplay />
                    </div>
                  ) : entry.type === "hack" ? (
                    <div className="my-2 p-4 border border-red-500/10 bg-red-950/5 rounded-xl">
                      <HackAnimation es={es} onBusyChange={handleFxBusyChange} onComplete={() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }} />
                    </div>
                  ) : entry.type === "polaris-egg" ? (
                    <PolarisEgg />
                  ) : (
                    <div className="text-gray-300 pl-4 border-l border-white/5 whitespace-pre-wrap text-xs font-mono my-2 py-1 leading-relaxed">
                      <TypedText text={entry.text} speed={2} />
                    </div>
                  )}
                </div>
              ))}

              {/* Indicador de carga de IA */}
              {isAiLoading && (
                <div className="pl-4 flex items-center gap-2.5 text-cyan-400/70 font-bold select-none my-3 bg-cyan-950/10 py-2 px-3 rounded-lg border border-cyan-500/10 inline-flex">
                  <motion.div 
                    animate={{ rotate: 360 }} 
                    transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                    className="w-3.5 h-3.5 border-2 border-t-transparent border-cyan-400 rounded-full shrink-0"
                  />
                  <span>{es ? "Atlas decodificando señal..." : "Atlas deciphering signal..."}</span>
                </div>
              )}
            </div>

            {/* Mobile Dock de comandos rápidos (scrollable horizontalmente) */}
            <div className="px-4 py-2 border-t border-white/5 bg-[#06060b]/90 backdrop-blur-md select-none">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold flex items-center gap-1">
                  <MousePointerClick size={10} className="text-cyan-400" />
                  {es ? "Acciones rápidas (1-tap)" : "Quick macro execution"}
                </span>
                <span className="text-[9px] text-cyan-400/50">TAB / ARROW_RIGHT</span>
              </div>
              <div className="flex gap-1.5 overflow-x-auto pb-1.5 pt-0.5 no-scrollbar scroll-smooth -mx-2 px-2">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip.cmd}
                    onClick={(e) => { e.stopPropagation(); handleQuickCommand(chip.cmd); }}
                    className="flex items-center gap-1.5 shrink-0 px-2.5 py-1.5 rounded-lg border border-white/5 hover:border-cyan-500/30 bg-white/5 text-[10px] text-white/80 hover:text-cyan-400 transition-all duration-300 font-bold active:scale-95 hover:shadow-[0_0_12px_rgba(6,182,212,0.1)]"
                  >
                    {chip.icon}
                    <span>{chip.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Input Line Area */}
            <div className="p-3 md:p-4 border-t border-white/5 bg-[#06060b] shrink-0">
              <div className="flex items-center gap-2.5 relative bg-white/[0.02] border border-white/5 rounded-xl px-3 py-2.5 focus-within:border-cyan-500/30 focus-within:shadow-[0_0_15px_rgba(6,182,212,0.06)] transition-all duration-300">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-400 font-bold shrink-0 select-none font-mono">
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
                    <span className="text-white/90 font-medium">{input}</span>
                    <motion.span
                      animate={{ opacity: [1, 1, 0, 0] }}
                      transition={{ repeat: Infinity, duration: 0.9, times: [0, 0.5, 0.5, 1], ease: "linear" }}
                      className="text-cyan-400 font-bold mx-[1px]"
                    >█</motion.span>
                    {suggestion && <span className="text-white/20 select-none">{suggestion}</span>}
                  </div>
                </div>
                {/* Send Button */}
                <button
                  onClick={() => { if (input.trim() || pendingInputType) processCommand(input); }}
                  disabled={isAiLoading || (!input.trim() && !pendingInputType)}
                  className="px-2.5 py-1 rounded bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase transition-all duration-300 active:scale-95 disabled:opacity-30 disabled:pointer-events-none"
                >
                  {es ? "Enviar" : "Send"}
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* PANEL DERECHO: El panel de control HUD interactivo de telemetría (Oculto en móvil) */}
        <aside className="hidden lg:flex w-80 xl:w-96 border-l border-white/5 bg-[#030307]/90 backdrop-blur-md p-4 flex-col justify-between shrink-0 z-10 overflow-y-auto">
          
          <div className="space-y-5">
            {/* Cabecera del Panel */}
            <div className="border-b border-white/5 pb-3">
              <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-1.5">
                <Activity size={12} className="text-cyan-400" />
                {es ? "Panel de Control HUD" : "Tactical HUD Dashboard"}
              </span>
              <h2 className="text-white/80 font-bold text-xs uppercase tracking-wider mt-1">{es ? "Monitor de Telemetría" : "System Telemetry"}</h2>
            </div>

            {/* Métricas del Sistema Interactivos */}
            <div className="space-y-3 bg-white/[0.01] border border-white/5 rounded-xl p-3">
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold block mb-1">{es ? "Hardware Virtual" : "Virtual Hardware Core"}</span>
              
              {/* CPU Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50 flex items-center gap-1.5"><Cpu size={11} className="text-cyan-400" /> CPU Core</span>
                  <span className="text-cyan-400 font-bold">{metrics.cpu}%</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${metrics.cpu}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 rounded-full"
                  />
                </div>
              </div>

              {/* Memory Pool */}
              <div className="space-y-1 mt-2">
                <div className="flex justify-between text-[10px]">
                  <span className="text-white/50 flex items-center gap-1.5"><Layers size={11} className="text-violet-400" /> MEM Pool</span>
                  <span className="text-violet-400 font-bold">{metrics.ram} GB / 16.0 GB</span>
                </div>
                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    animate={{ width: `${(metrics.ram / 16) * 100}%` }}
                    className="h-full bg-gradient-to-r from-violet-400 to-rose-400 rounded-full"
                  />
                </div>
              </div>

              {/* Grid 2-column info */}
              <div className="grid grid-cols-2 gap-2.5 pt-2 text-[10px] border-t border-white/5 mt-3 select-none">
                <div className="bg-[#05050b] p-2 rounded border border-white/5">
                  <span className="text-white/30 block text-[9px] uppercase">{es ? "Latencia" : "Latency"}</span>
                  <span className="text-white/80 font-bold text-xs mt-0.5 block flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block animate-ping" />
                    {metrics.ping} ms
                  </span>
                </div>
                <div className="bg-[#05050b] p-2 rounded border border-white/5">
                  <span className="text-white/30 block text-[9px] uppercase">{es ? "Temp Núcleo" : "Core Temp"}</span>
                  <span className="text-white/80 font-bold text-xs mt-0.5 block flex items-center gap-1">
                    <Flame size={11} className="text-amber-500 animate-pulse" />
                    {metrics.temp}°C
                  </span>
                </div>
                <div className="bg-[#05050b] p-2 rounded border border-white/5">
                  <span className="text-white/30 block text-[9px] uppercase">Node GPS</span>
                  <span className="text-white/70 font-semibold block text-[10px] truncate">18.56°N, 68.37°W</span>
                </div>
                <div className="bg-[#05050b] p-2 rounded border border-white/5">
                  <span className="text-white/30 block text-[9px] uppercase">Uptime</span>
                  <span className="text-cyan-400 font-bold block text-[10px] font-mono">{metrics.uptime}</span>
                </div>
              </div>
            </div>

            {/* Árbol Ejecutable de Comandos (Directorio interactivo de scripts) */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-1.5">
                  <Code size={12} className="text-cyan-400" />
                  {es ? "Ejecutables (/bin)" : "Executables (/bin)"}
                </span>
                <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded border border-cyan-500/20 font-bold">ACTIVE</span>
              </div>

              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1 no-scrollbar text-[11px]">
                {QUICK_CHIPS.map(chip => (
                  <button
                    key={chip.cmd}
                    onClick={(e) => { e.stopPropagation(); handleQuickCommand(chip.cmd); }}
                    className="w-full flex items-center justify-between p-2 rounded-xl bg-white/[0.01] border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-950/10 transition-all duration-300 text-left group active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-2">
                      <span className="p-1 rounded bg-white/5 text-white/60 group-hover:text-cyan-400 transition-colors">
                        {chip.icon}
                      </span>
                      <div>
                        <span className="font-bold text-white/80 group-hover:text-cyan-300 transition-colors">{chip.cmd}</span>
                        <span className="block text-[9px] text-white/30 group-hover:text-cyan-400/50 transition-colors leading-none mt-0.5">{chip.desc}</span>
                      </div>
                    </div>
                    <span className="text-[9px] text-white/30 uppercase opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center gap-0.5 bg-cyan-950/40 border border-cyan-500/20 px-1 py-0.5 rounded font-black text-cyan-400">
                      RUN
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Coordenadas o dato aleatorio del día */}
            <div className="bg-[#05050b]/80 border border-white/5 p-3 rounded-xl select-none relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/5 blur-xl rounded-full" />
              <span className="text-[9px] uppercase tracking-widest text-white/30 font-bold flex items-center gap-1 mb-1">
                <Compass size={11} className="text-violet-400" />
                {es ? "Ubicación Geodésica" : "Geodesic Location"}
              </span>
              <p className="text-[10px] text-white/60 leading-relaxed font-semibold">
                Punta Cana, Rep. Dominicana <br />
                <span className="text-white/30 font-mono text-[9px]">PUNTA_CANA_OFFICE_EAST_COAST</span>
              </p>
            </div>

          </div>

          {/* Footer del HUD */}
          <div className="border-t border-white/5 pt-3.5 space-y-2 text-[10px]">
            <div className="flex items-center justify-between text-white/40">
              <span>{es ? "Estado de Enlace" : "Link Connection"}</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
                {es ? "ONLINE" : "ESTABLISHED"}
              </span>
            </div>
            
            <button
              onClick={() => navigate("/cotizar")}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold uppercase tracking-wider text-[10px] transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.3)] hover:opacity-90 active:scale-95"
            >
              <Briefcase size={12} />
              <span>{es ? "Iniciar Cotización" : "Start Project Quote"}</span>
            </button>
          </div>

        </aside>
      </div>
    </div>
  );
}
