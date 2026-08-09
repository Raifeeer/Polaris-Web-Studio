import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

// Tooltip propio (pill redondeada, aparece pegada al ícono) -- pedido
// explícito del usuario tras ver el de Gemini, reemplaza el tooltip nativo
// del navegador (delay feo, sin estilo) en los botones de solo-ícono de
// escritorio (nuevo chat, chat temporal, inicio, cambiar idioma, buscar).
// Solo se activa con mouse real (`hover:` de Tailwind ya no dispara en
// touch), así que no hace falta ocultarla a mano en mobile.
export default function Tooltip({
  label,
  children,
  side = "bottom",
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  side?: "bottom" | "right";
  className?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className={`relative inline-flex ${className}`}
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
    >
      {children}
      <AnimatePresence>
        {visible && (
          <motion.span
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className={`pointer-events-none absolute z-50 whitespace-nowrap rounded-full bg-[var(--color-text-primary)] px-3 py-1.5 text-xs font-semibold text-[var(--color-surface-base)] shadow-lg hidden md:block ${
              side === "bottom"
                ? "top-full left-1/2 mt-2 -translate-x-1/2 origin-top"
                : "left-full top-1/2 ml-2 -translate-y-1/2 origin-left"
            }`}
          >
            {label}
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}
