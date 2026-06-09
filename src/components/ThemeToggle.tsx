import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../hooks/useTheme";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-lg bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)] relative overflow-hidden flex items-center justify-center w-9 h-9 group"
      aria-label={
        theme === "dark" ? "Cambiar a modo claro" : "Cambiar a modo oscuro"
      }
    >
      <div className={`transition-all duration-300 absolute ${theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 rotate-90 scale-50"}`}>
        <Moon size={20} />
      </div>
      <div className={`transition-all duration-300 absolute ${theme === "dark" ? "opacity-0 -rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`}>
        <Sun size={20} />
      </div>
    </button>
  );
}
