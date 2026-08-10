import { AnimatePresence, motion } from "framer-motion";
import type { ThinkingMessage } from "../hooks/useAtlasChat";

// Reemplaza los 3 puntos + frase fija por una sola frase con efecto de
// reflejo (shimmer) que va cambiando sola mientras se espera la respuesta --
// técnica de máscara real (dos capas de texto superpuestas: una tenue fija
// abajo, una brillante arriba revelada solo donde pasa un gradiente de
// máscara en movimiento), pedida explícita por el usuario para reemplazar el
// enfoque anterior (background-clip:text). Rotación de frases cada 1.5s en
// useAtlasChat.ts. Una palabra de la frase (marcada con `**...**`) queda
// siempre sólida con el color de marca, sin el barrido -- se logra dejándola
// invisible en la capa que se mueve, para que el barrido nunca "la toque" y
// la versión sólida de la capa base de abajo sea la única visible ahí.
function renderParts(text: string, layer: "base" | "sweep") {
  const parts = text.split(/\*\*(.+?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={`font-black text-[var(--color-primary-base)] ${layer === "sweep" ? "opacity-0" : ""}`}>
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
        className={`relative inline-block text-xs font-bold whitespace-nowrap ${className}`}
      >
        {/* Capa base -- siempre visible, color tenue (mismo texto que la capa
            de arriba, sirve de "fondo" cuando el barrido no está encima). */}
        <span className="text-[var(--color-text-tertiary)]">{renderParts(text, "base")}</span>
        {/* Capa que barre -- mismo texto, color pleno, revelado solo donde
            pasa la máscara en movimiento (gradiente transparente-negro-
            transparente, desplazada de derecha a izquierda en loop). */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-0 text-[var(--color-text-primary)]"
          style={{
            WebkitMaskImage: "linear-gradient(90deg, transparent 0%, black 50%, transparent 100%)",
            maskImage: "linear-gradient(90deg, transparent 0%, black 50%, transparent 100%)",
            WebkitMaskSize: "200% 100%",
            maskSize: "200% 100%",
          }}
          // framer-motion no tipa propiedades CSS de máscara en su target de
          // `animate` (aunque las anima bien en runtime) -- `as any` puntual,
          // mismo criterio ya usado en esta cuenta para otros casos donde el
          // tipo no modela bien una forma real y válida.
          animate={{ WebkitMaskPosition: ["150% 0%", "-50% 0%"], maskPosition: ["150% 0%", "-50% 0%"] } as any}
          transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
        >
          {renderParts(text, "sweep")}
        </motion.span>
      </motion.span>
    </AnimatePresence>
  );
}
