import iconUrl from "../assets/icons/temporary-chat.png";

// Ícono real de "chat temporal" (icons8, fluency-systems-filled/dashed-chat),
// pedido explícito del usuario en vez del VenetianMask de lucide. Es un PNG
// monocromo con canal alfa -- se aplica como CSS mask (no <img>) para que
// siga heredando currentColor y se comporte igual que un ícono de lucide en
// cualquier contexto de color (activo/inactivo, claro/oscuro).
export default function TemporaryChatIcon({ size = 16, className = "" }: { size?: number; className?: string }) {
  return (
    <span
      role="img"
      aria-hidden="true"
      className={`inline-block shrink-0 bg-current ${className}`}
      style={{
        width: size,
        height: size,
        WebkitMaskImage: `url(${iconUrl})`,
        maskImage: `url(${iconUrl})`,
        WebkitMaskSize: "contain",
        maskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        maskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskPosition: "center",
      }}
    />
  );
}
