import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// Reemplaza el textarea/input del chat mientras se dicta por voz -- onda
// animada real (niveles de audio del micrófono, no decorativa) + texto
// transcrito en vivo, mismo lenguaje visual que el dictado de Claude/
// ChatGPT: X para descartar, check para confirmar y llenar el input.
export default function VoiceInputBar({
  levels,
  interimText,
  onCancel,
  onConfirm,
}: {
  levels: number[];
  interimText: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { translate } = useLanguage();
  return (
    <div className="flex-1 flex items-center gap-2 min-w-0 px-1">
      <button
        onClick={onCancel}
        aria-label={translate("Cancelar dictado", "Cancel dictation")}
        className="w-8 h-8 shrink-0 rounded-full flex items-center justify-center text-[var(--color-text-tertiary)] hover:bg-[var(--color-surface-base)] hover:text-[var(--color-text-primary)] transition-colors"
      >
        <X size={16} />
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[var(--color-text-primary)] truncate min-h-[1.25rem]">
          {interimText || <span className="text-[var(--color-text-tertiary)]">{translate("Escuchando…", "Listening…")}</span>}
        </p>
        <div className="flex items-center gap-[3px] h-4 mt-1" aria-hidden="true">
          {levels.map((v, i) => (
            <motion.span
              key={i}
              animate={{ height: `${6 + v * 16}px` }}
              transition={{ duration: 0.08 }}
              className="w-[3px] rounded-full bg-[var(--color-primary-base)]"
            />
          ))}
        </div>
      </div>
      <button
        onClick={onConfirm}
        aria-label={translate("Confirmar dictado", "Confirm dictation")}
        className="w-9 h-9 shrink-0 rounded-full bg-[var(--color-primary-base)] text-white flex items-center justify-center hover:brightness-110 transition-all"
      >
        <Check size={16} />
      </button>
    </div>
  );
}
