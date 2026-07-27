import React from "react";
import { Sun, Moon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "../hooks/useTheme";
import { useLanguage } from "../context/LanguageContext";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const { translate } = useLanguage();

  return (
    <button
      onClick={toggleTheme}
      // .cinema-mode (Portfolio.tsx): la caja casi blanca de este botón
      // quedaba con demasiado contraste sobre el overlay negro del modo
      // cine (pedido explícito del usuario) -- ahí pasa a un fondo
      // translúcido oscuro con blur en vez del surface-highlight sólido,
      // y el ícono a un blanco atenuado en vez del texto secundario.
      className="p-2 rounded-lg bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] [.cinema-mode_&]:bg-white/10 [.cinema-mode_&]:backdrop-blur-md [.cinema-mode_&]:text-white/75 hover:text-[var(--color-primary-base)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]"
      aria-label={
        theme === "dark"
          ? translate("Cambiar a modo claro", "Switch to light mode")
          : translate("Cambiar a modo oscuro", "Switch to dark mode")
      }
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -45 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 45 }}
          transition={{ duration: 0.2 }}
        >
          {theme === "dark" ? <Moon size={20} /> : <Sun size={20} />}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
