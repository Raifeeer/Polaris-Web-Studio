import { motion, useScroll, useSpring } from "framer-motion";
import { useLayoutEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollProgressBar() {
  const { pathname } = useLocation();
  const { scrollYProgress } = useScroll();

  // Premium physics preset for fluid momentum responsiveness
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 25,
    restDelta: 0.001,
  });

  // Al cambiar de ruta, la página nueva monta con una altura distinta antes de
  // que se restablezca el scroll a 0, lo que hace que scrollYProgress salte a 1
  // momentáneamente (página corta + scrollY heredado de la página anterior).
  // jump() corta ese salto en seco en vez de dejar que el spring lo persiga.
  useLayoutEffect(() => {
    scrollYProgress.jump(0);
    scaleX.jump(0);
  }, [pathname, scrollYProgress, scaleX]);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[9999] pointer-events-none overflow-hidden">
      <motion.div
        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-[var(--color-primary-base)] to-indigo-500 origin-[0%] shadow-[0_0_10px_rgba(99,102,241,0.6)]"
        style={{ scaleX }}
      />
    </div>
  );
}

