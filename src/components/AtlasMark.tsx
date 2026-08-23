type AtlasMarkVariant = "isotipo" | "wordmark";

const BLACK_SRC: Record<AtlasMarkVariant, string> = {
  isotipo: "/brand/atlas-isotipo-black.svg",
  wordmark: "/brand/atlas-wordmark-black.svg",
};
const WHITE_SRC: Record<AtlasMarkVariant, string> = {
  isotipo: "/brand/atlas-isotipo.svg",
  wordmark: "/brand/atlas-wordmark.svg",
};

// Mantiene las dos fuentes reales del asset para evitar parpadeos al cambiar
// de tema, pero las clases semánticas de abajo garantizan que CSS muestre
// únicamente una variante: negra con `.light` y blanca por defecto.
export default function AtlasMark({
  variant,
  className,
  label,
}: {
  variant: AtlasMarkVariant;
  className?: string;
  label?: string;
}) {
  return (
    <span className="contents" role={label ? "img" : undefined} aria-label={label}>
      <img src={BLACK_SRC[variant]} alt="" aria-hidden="true" className={`atlas-mark-image atlas-mark-black ${className || ""}`} />
      <img src={WHITE_SRC[variant]} alt="" aria-hidden="true" className={`atlas-mark-image atlas-mark-white ${className || ""}`} />
    </span>
  );
}
