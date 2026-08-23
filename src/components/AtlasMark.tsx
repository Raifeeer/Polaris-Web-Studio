import { useTheme } from "../hooks/useTheme";

type AtlasMarkVariant = "isotipo" | "wordmark";

const BLACK_SRC: Record<AtlasMarkVariant, string> = {
  isotipo: "/brand/atlas-isotipo-black.svg",
  wordmark: "/brand/atlas-wordmark-black.svg",
};
const WHITE_SRC: Record<AtlasMarkVariant, string> = {
  isotipo: "/brand/atlas-isotipo.svg",
  wordmark: "/brand/atlas-wordmark.svg",
};

export default function AtlasMark({
  variant,
  className,
  label,
}: {
  variant: AtlasMarkVariant;
  className?: string;
  label?: string;
}) {
  const { theme } = useTheme();
  const src = theme === "light" ? BLACK_SRC[variant] : WHITE_SRC[variant];

  return (
    <img
      src={src}
      alt={label || ""}
      aria-hidden={label ? undefined : true}
      className={className}
    />
  );
}

export type { AtlasMarkVariant };
