type AtlasMarkVariant = "isotipo" | "wordmark";

const BLACK_SRC: Record<AtlasMarkVariant, string> = {
  isotipo: "/brand/atlas-isotipo-black.svg",
  wordmark: "/brand/atlas-wordmark-black.svg",
};
const WHITE_SRC: Record<AtlasMarkVariant, string> = {
  isotipo: "/brand/atlas-isotipo.svg",
  wordmark: "/brand/atlas-wordmark.svg",
};

// Selecciona la variante negra (tema claro, clase `.light`) o blanca (tema
// oscuro, default) del isotipo/wordmark real de Atlas -- mismo mecanismo de
// tema que useTheme.ts (oscuro es la ausencia de clase, claro es `.light`
// en <html>). Renderiza ambas imágenes superpuestas y deja que CSS muestre
// solo la que corresponde, sin lógica en JS ni parpadeo al cambiar de tema.
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
      <img src={BLACK_SRC[variant]} alt="" aria-hidden="true" className={`hidden [.light_&]:block ${className || ""}`} />
      <img src={WHITE_SRC[variant]} alt="" aria-hidden="true" className={`block [.light_&]:hidden ${className || ""}`} />
    </span>
  );
}
