import { motion } from "framer-motion";

// Check que se "dibuja" con el trazo (pathLength 0 -> 1) al copiar, con el
// color de marca -- reemplaza el ícono estático de lucide-react solo para
// este momento puntual, el resto del ícono normal sigue siendo <Copy>.
export default function AnimatedCheckIcon({ size = 12 }: { size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--color-primary-base)"
      strokeWidth={3}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <motion.path
        d="M20 6L9 17l-5-5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
      />
    </motion.svg>
  );
}
