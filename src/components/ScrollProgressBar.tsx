import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollProgressBar() {
  const { pathname } = useLocation();
  const progressRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    const updateProgress = () => {
      frameRef.current = null;
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = scrollableHeight > 0 ? window.scrollY / scrollableHeight : 0;
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
      }
    };

    const handleScroll = () => {
      if (frameRef.current === null) {
        frameRef.current = window.requestAnimationFrame(updateProgress);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      if (frameRef.current !== null) window.cancelAnimationFrame(frameRef.current);
    };
  }, [pathname]);

  return (
    <div className="fixed top-0 left-0 right-0 h-[3px] bg-transparent z-[9999] pointer-events-none overflow-hidden">
      <div
        ref={progressRef}
        className="h-full rounded-full bg-gradient-to-r from-blue-500 via-[var(--color-primary-base)] to-indigo-500 origin-[0%] shadow-[0_0_10px_rgba(99,102,241,0.6)] transform-gpu transition-[transform] duration-150 ease-out"
        style={{ transform: "scaleX(0)" }}
      />
    </div>
  );
}
