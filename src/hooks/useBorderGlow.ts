import { useRef, useCallback } from "react";

// Adaptado de React Bits BorderGlow (https://reactbits.dev/components/border-glow):
// mismo cálculo de proximidad al borde + ángulo del cursor, pero acá se aplica
// a un wrapper exterior con overflow:visible en vez de reemplazar el fondo de
// la card del hero -- así el efecto puede desbordar el borde redondeado sin
// pelear con el overflow-hidden que la card ya necesita para recortar el
// canvas 3D y el logo decorativo.
export function useBorderGlow() {
  const wrapRef = useRef<HTMLDivElement>(null);

  const getCenter = useCallback((el: HTMLElement): [number, number] => {
    const { width, height } = el.getBoundingClientRect();
    return [width / 2, height / 2];
  }, []);

  const getEdgeProximity = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenter(el);
      const dx = x - cx;
      const dy = y - cy;
      let kx = Infinity;
      let ky = Infinity;
      if (dx !== 0) kx = cx / Math.abs(dx);
      if (dy !== 0) ky = cy / Math.abs(dy);
      return Math.min(Math.max(1 / Math.min(kx, ky), 0), 1);
    },
    [getCenter],
  );

  const getCursorAngle = useCallback(
    (el: HTMLElement, x: number, y: number) => {
      const [cx, cy] = getCenter(el);
      const dx = x - cx;
      const dy = y - cy;
      if (dx === 0 && dy === 0) return 0;
      const radians = Math.atan2(dy, dx);
      let degrees = radians * (180 / Math.PI) + 90;
      if (degrees < 0) degrees += 360;
      return degrees;
    },
    [getCenter],
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const wrap = wrapRef.current;
      if (!wrap) return;
      const rect = wrap.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const edge = getEdgeProximity(wrap, x, y);
      const angle = getCursorAngle(wrap, x, y);
      wrap.style.setProperty("--edge-proximity", `${(edge * 100).toFixed(3)}`);
      wrap.style.setProperty("--cursor-angle", `${angle.toFixed(3)}deg`);
    },
    [getEdgeProximity, getCursorAngle],
  );

  return { wrapRef, handlePointerMove };
}
