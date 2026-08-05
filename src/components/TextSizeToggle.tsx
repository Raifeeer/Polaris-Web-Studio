import { CaseSensitive } from "lucide-react";
import { useTextSize } from "../hooks/useTextSize";
import { useLanguage } from "../context/LanguageContext";

const LABELS: Record<string, { es: string; en: string }> = {
  normal: { es: "Tamaño de texto normal, activar grande", en: "Normal text size, switch to large" },
  large: { es: "Tamaño de texto grande, activar extra grande", en: "Large text size, switch to extra large" },
  xlarge: { es: "Tamaño de texto extra grande, volver a normal", en: "Extra large text size, switch back to normal" },
};

export default function TextSizeToggle() {
  const { textSize, cycleTextSize } = useTextSize();
  const { translate } = useLanguage();

  return (
    <button
      onClick={cycleTextSize}
      className="p-2 rounded-lg bg-[var(--color-surface-highlight)] text-[var(--color-text-secondary)] hover:text-[var(--color-primary-base)] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary-base)]"
      aria-label={translate(LABELS[textSize].es, LABELS[textSize].en)}
    >
      <CaseSensitive
        size={20}
        strokeWidth={textSize === "normal" ? 2 : 2.75}
      />
    </button>
  );
}
