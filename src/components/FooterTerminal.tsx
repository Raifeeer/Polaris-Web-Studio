import React from "react";
import { Link } from "react-router-dom";
import { Terminal as TerminalIcon } from "lucide-react";
import { motion } from "framer-motion";

export default function FooterTerminal() {
  return (
    <div className="mt-10 pt-8 border-t border-[var(--color-border-subtle)]">
      <Link
        to="/terminal"
        className="flex items-center gap-2 text-[11px] font-mono text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)] transition-colors cursor-pointer group"
      >
        <TerminalIcon size={12} className="group-hover:text-[var(--color-primary-base)]" />
        <span>polaris@studio:~$</span>
        <span className="text-[var(--color-text-tertiary)] group-hover:text-[var(--color-primary-base)] transition-colors">
          Abrir Atlas Terminal
        </span>
        <motion.span
          animate={{ opacity: [1, 1, 0, 0] }}
          transition={{ repeat: Infinity, duration: 1.0, times: [0, 0.5, 0.5, 1], ease: "linear" }}
          className="text-[var(--color-primary-base)] text-xs font-black"
        >
          ✦
        </motion.span>
      </Link>
    </div>
  );
}
