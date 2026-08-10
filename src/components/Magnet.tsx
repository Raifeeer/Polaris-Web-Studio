import { useState, useEffect, useRef, type ReactNode, type HTMLAttributes } from "react";

// Efecto magnético real para el CTA del Hero -- pedido explícito del usuario
// ("más suave que el que tiene"), reemplaza el enfoque anterior (spring de
// framer-motion, stiffness/damping fijos, solo reacciona al hover directo
// sobre el botón). Diferencias reales de este enfoque:
// 1. Escucha mousemove en toda la ventana, no solo sobre el botón -- el
//    "imán" empieza a tirar del botón mientras el cursor todavía se está
//    acercando (dentro de `padding` px), no recién al tocarlo.
// 2. Transición CSS con easing (no física de resorte) -- se siente más
//    suave y predecible, sin el rebote característico de un spring.
export default function Magnet({
  children,
  padding = 100,
  disabled = false,
  magnetStrength = 2,
  activeTransition = "transform 0.3s ease-out",
  inactiveTransition = "transform 0.5s ease-in-out",
  wrapperClassName = "",
  innerClassName = "",
  ...props
}: {
  children: ReactNode;
  padding?: number;
  disabled?: boolean;
  magnetStrength?: number;
  activeTransition?: string;
  inactiveTransition?: string;
  wrapperClassName?: string;
  innerClassName?: string;
} & HTMLAttributes<HTMLDivElement>) {
  const [isActive, setIsActive] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const magnetRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (disabled) {
      setPosition({ x: 0, y: 0 });
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!magnetRef.current) return;

      const { left, top, width, height } = magnetRef.current.getBoundingClientRect();
      const centerX = left + width / 2;
      const centerY = top + height / 2;
      const maxX = width / 2 + padding;
      const maxY = height / 2 + padding;

      const distX = Math.abs(centerX - e.clientX);
      const distY = Math.abs(centerY - e.clientY);

      if (distX < maxX && distY < maxY) {
        setIsActive(true);
        // Escala el tirón por qué tan adentro de la zona de activación está
        // el cursor (0 justo en el borde, máximo cerca del centro) -- sin
        // esto, el offset saltaba de golpe al valor completo apenas el
        // cursor cruzaba el borde del padding, sintiéndose como un brinco
        // brusco en vez de una atracción gradual.
        const proximity = Math.min(1 - distX / maxX, 1 - distY / maxY);
        const offsetX = ((e.clientX - centerX) / magnetStrength) * proximity;
        const offsetY = ((e.clientY - centerY) / magnetStrength) * proximity;
        setPosition({ x: offsetX, y: offsetY });
      } else {
        setIsActive(false);
        setPosition({ x: 0, y: 0 });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [padding, disabled, magnetStrength]);

  const transitionStyle = isActive ? activeTransition : inactiveTransition;

  return (
    <div ref={magnetRef} className={wrapperClassName} style={{ position: "relative", display: "inline-block" }} {...props}>
      <div
        className={innerClassName}
        style={{
          transform: `translate3d(${position.x}px, ${position.y}px, 0)`,
          transition: transitionStyle,
          willChange: "transform",
        }}
      >
        {children}
      </div>
    </div>
  );
}
