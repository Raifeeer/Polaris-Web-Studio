import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, X } from "lucide-react";
import { T } from "../context/LanguageContext";

// Reglas reales que ya exige el backend (server.ts, hashPassword/validación
// de longitud mínima): 8 caracteres + al menos un número. El resto de los
// criterios (mayúscula, minúscula, símbolo, longitud extra) no son
// obligatorios -- solo suman al puntaje de fuerza, para no bloquear al
// cliente con reglas que el servidor no exige.
function getChecks(password: string) {
  return {
    length: password.length >= 8,
    number: /\d/.test(password),
    upperLower: /[a-z]/.test(password) && /[A-Z]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    longEnough: password.length >= 12,
  };
}

function getStrength(password: string): { score: number; ratio: number } {
  if (!password) return { score: 0, ratio: 0 };
  const c = getChecks(password);
  const score = [c.length, c.number, c.upperLower, c.special, c.longEnough].filter(Boolean).length;
  return { score, ratio: score / 5 };
}

const LEVELS = [
  { colorVar: "#ef4444", labelEs: "Muy débil", labelEn: "Very weak" },
  { colorVar: "#ef4444", labelEs: "Débil", labelEn: "Weak" },
  { colorVar: "#f59e0b", labelEs: "Regular", labelEn: "Fair" },
  { colorVar: "#eab308", labelEs: "Buena", labelEn: "Good" },
  { colorVar: "#22c55e", labelEs: "Fuerte", labelEn: "Strong" },
  { colorVar: "#10b981", labelEs: "Muy segura", labelEn: "Very strong" },
];

function Requirement({ met, children, en }: { met: boolean; children: ReactNode; en: ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <motion.span
        animate={{
          backgroundColor: met ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.1)",
          color: met ? "#10b981" : "#ef4444",
        }}
        transition={{ duration: 0.25 }}
        className="w-4 h-4 rounded-full flex items-center justify-center shrink-0"
      >
        {met ? <Check size={10} /> : <X size={10} />}
      </motion.span>
      <motion.span
        animate={{ color: met ? "var(--color-text-secondary)" : "var(--color-text-tertiary)" }}
        transition={{ duration: 0.25 }}
        className="text-[11px] font-medium"
      >
        <T en={en}>{children}</T>
      </motion.span>
    </div>
  );
}

export default function PasswordStrengthMeter({ password }: { password: string }) {
  const checks = getChecks(password);
  const { score, ratio } = getStrength(password);
  const level = LEVELS[score];

  return (
    <div className="mt-2 space-y-2.5">
      {/* Barra de fuerza -- ancho y color animan juntos con cada tecla, en vez
          de saltar de golpe, para que se sienta como un medidor "vivo" en
          vez de un simple estado on/off. */}
      <div className="space-y-1">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 6, backgroundColor: "var(--color-surface-highlight)" }}
        >
          <motion.div
            style={{ height: "100%", borderRadius: 9999 }}
            animate={{
              width: `${Math.max(ratio * 100, password ? 8 : 0)}%`,
              backgroundColor: level.colorVar,
            }}
            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          />
        </div>
        {password && (
          <motion.p
            key={score}
            initial={{ opacity: 0, y: -2 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="text-[11px] font-bold"
            style={{ color: level.colorVar }}
          >
            <T en={level.labelEn}>{level.labelEs}</T>
          </motion.p>
        )}
      </div>

      <div className="flex flex-wrap gap-x-4 gap-y-1.5">
        <Requirement met={checks.length} en="At least 8 characters">
          Mínimo 8 caracteres
        </Requirement>
        <Requirement met={checks.number} en="A number">
          Un número
        </Requirement>
      </div>
    </div>
  );
}
