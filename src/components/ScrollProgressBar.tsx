import { motion, useScroll, useSpring } from "framer-motion";

export default function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();

  // Premium physics preset for fluid momentum responsiveness
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 150,
    damping: 25,
    restDelta: 0.001,
  });

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[9999] pointer-events-none overflow-hidden">
      <motion.div
        className="h-full bg-gradient-to-r from-blue-500 via-[var(--color-primary-base)] to-indigo-500 origin-[0%] shadow-[0_0_10px_rgba(99,102,241,0.6)]"
        style={{ scaleX }}
      />
    </div>
  );
}

