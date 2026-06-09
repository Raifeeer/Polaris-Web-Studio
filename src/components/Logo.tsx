import React from "react";
import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  stacked?: boolean;
}

export default function Logo({
  size = 40,
  showText = true,
  className = "",
  stacked = false,
}: LogoProps) {
  return (
    <div
      className={`flex items-center ${stacked ? "flex-col justify-center text-center gap-2" : "gap-4"} group ${className}`}
    >
      <div
        className="relative flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-[var(--color-primary-base)] blur-2xl md:blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />

        {/* Perfectly Symmetrical 8-Pointed Star (Compass Rose) */}
        <svg
          viewBox="0 0 32 32"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full relative z-10"
        >
          <defs>
            <linearGradient
              id="logo-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="100%"
            >
              <stop stopColor="var(--color-primary-base)" />
              <stop offset="1" stopColor="#818cf8" />
            </linearGradient>
          </defs>

          {/* Combined Star Shape - Mathematically Symmetrical */}
          <motion.path
            d="M 16 2 
               L 17.5 13.5
               L 21.5 10.5
               L 18.5 14.5
               L 30 16 
               L 18.5 17.5
               L 21.5 21.5
               L 17.5 18.5
               L 16 30 
               L 14.5 18.5
               L 10.5 21.5
               L 13.5 17.5
               L 2 16 
               L 13.5 14.5
               L 10.5 10.5
               L 14.5 13.5
               Z"
            fill="url(#logo-gradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />

          {/* Precision Core */}
          <circle cx="16" cy="16" r="1.5" fill="white" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-display font-black text-xl tracking-tighter uppercase text-[var(--color-text-primary)] whitespace-nowrap">
            Polaris
          </span>
          <span className="text-[9px] font-black uppercase text-[var(--color-primary-base)] opacity-70 tracking-[0.22em] pl-[0.22em] whitespace-nowrap block">
            Web Studio
          </span>
        </div>
      )}
    </div>
  );
}
