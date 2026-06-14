import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Ripple {
  id: number;
  x: number;
  y: number;
  size: number;
}

interface RippleButtonProps {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  whileTap?: any;
  title?: string;
  type?: "button" | "submit" | "reset";
  disabled?: boolean;
}

export default function RippleButton({
  children,
  onClick,
  className = "",
  whileTap = { scale: 0.97 },
  title,
  type = "button",
  disabled = false,
  ...props
}: RippleButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handlePointerDown = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 1.8;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple: Ripple = {
      id: Date.now() + Math.random(),
      x,
      y,
      size,
    };

    setRipples((prev) => [...prev, newRipple]);
  };

  useEffect(() => {
    if (ripples.length > 0) {
      const timer = setTimeout(() => {
        setRipples((prev) => prev.slice(1));
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [ripples]);

  return (
    <motion.button
      whileTap={disabled ? undefined : whileTap}
      onMouseDown={handlePointerDown}
      onClick={onClick}
      type={type}
      disabled={disabled}
      title={title}
      className={`relative overflow-hidden cursor-pointer ${className}`}
      {...props}
    >
      {/* Wrapper to ensure inner content stays above the absolute positioned ripples */}
      <span className="relative z-10 flex items-center justify-center gap-2 w-full h-full pointer-events-none">
        {children}
      </span>
      <AnimatePresence>
        {ripples.map((ripple) => (
          <motion.span
            key={ripple.id}
            initial={{ scale: 0, opacity: 0.35 }}
            animate={{ scale: 1, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="absolute rounded-full bg-white/45 pointer-events-none"
            style={{
              left: ripple.x,
              top: ripple.y,
              width: ripple.size,
              height: ripple.size,
            }}
          />
        ))}
      </AnimatePresence>
    </motion.button>
  );
}
