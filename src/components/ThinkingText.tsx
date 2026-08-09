import { AnimatePresence, motion } from "framer-motion";
import type { ThinkingMessage } from "../hooks/useAtlasChat";

// Reemplaza los 3 puntos + frase fija por una sola frase con efecto de
// reflejo (shimmer, mismo patrón que Gemini/ChatGPT) que va cambiando sola
// mientras se espera la respuesta -- ver `.atlas-thinking-shimmer` en
// index.css y la rotación cada 1.5s en useAtlasChat.ts. Una palabra de la
// frase (marcada con `**...**`) se resalta en negrita con el color de marca,
// sin el efecto de reflejo, para que no quede transparente.
function renderWithHighlight(text: string) {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span
        key={i}
        className="font-black text-[var(--color-primary-base)]"
        style={{ WebkitTextFillColor: "currentColor", backgroundImage: "none" }}
      >
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}

export default function ThinkingText({ message, lang, className = "" }: { message: ThinkingMessage; lang: "es" | "en"; className?: string }) {
  const text = lang === "en" ? message.en : message.es;
  return (
    <AnimatePresence mode="wait">
      <motion.span
        key={text}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.35 }}
        className={`atlas-thinking-shimmer text-xs font-bold whitespace-nowrap ${className}`}
      >
        {renderWithHighlight(text)}
      </motion.span>
    </AnimatePresence>
  );
}
