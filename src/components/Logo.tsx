import React from "react";
import { motion } from "framer-motion";

interface LogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
  stacked?: boolean;
}

// Distancia real entre la estrella y el texto, medida en píxeles sobre el
// logo oficial (isotipo + logotipo) diseñado en Canva -- 5.27% del tamaño
// del ícono en la variante horizontal (navbar), 4.03% en la variante
// apilada (stacked, usada en el login). Ambas expresadas como fracción de
// `size` para que el espaciado escale igual sin importar el tamaño pedido.
const HORIZONTAL_GAP_RATIO = 0.0527;
const STACKED_GAP_RATIO = 0.0403;

export default function Logo({
  size = 40,
  showText = true,
  className = "",
  stacked = false,
}: LogoProps) {
  const gap = size * (stacked ? STACKED_GAP_RATIO : HORIZONTAL_GAP_RATIO);

  return (
    <div
      className={`flex items-center ${stacked ? "flex-col justify-center text-center" : ""} group ${className}`}
      style={{ gap }}
    >
      <div
        className="relative flex items-center justify-center transition-transform duration-500 group-hover:scale-110 shrink-0"
        style={{ width: size, height: size }}
      >
        {/* Glow Effect */}
        <div className="absolute inset-0 bg-[var(--color-primary-base)] blur-2xl md:blur-3xl rounded-full opacity-20 group-hover:opacity-40 transition-opacity" />

        {/* Isotipo real -- estrella de 8 puntas (compás), trazado exacto
            extraído del logo oficial diseñado en Canva */}
        <svg
          viewBox="0 0 1486.28 1486.27"
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

          <motion.path
            d="M 912.917969 849.828125 L 1486.273437 744.0625 L 909.207031 645.71875 L 1066.925781 417.492188 L 846.117187 575.210938 L 742.207031 0 L 643.867187 578.921875 L 417.492187 417.492188 L 573.355469 645.71875 L 0 744.0625 L 573.355469 849.828125 L 417.492187 1068.777344 L 643.867187 912.914063 L 742.207031 1486.269531 L 847.972656 916.625 L 1066.925781 1068.777344 Z"
            fill="url(#logo-gradient)"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5, ease: "circOut" }}
          />

          {/* Precision Core */}
          <circle cx="744.988281" cy="733.605469" r="109.738281" fill="white" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col leading-none">
          <span className="font-display font-black text-xl tracking-tighter uppercase text-[var(--color-text-primary)] whitespace-nowrap">
            Polaris
          </span>
          <span className="text-[9px] font-black uppercase text-[var(--color-primary-base)] opacity-100 tracking-[0.23em] whitespace-nowrap block mt-[-5px]">
            Web Studio
          </span>
        </div>
      )}
    </div>
  );
}
