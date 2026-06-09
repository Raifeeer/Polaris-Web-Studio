import React, { useMemo, useEffect, useRef, useState } from "react";

interface BlobConfig {
  background: string;
  width: string;
  height: string;
  left: string;
  top: string;
  animationName: string;
  duration: number;
  opacity: number;
}

interface Star {
  left: number;
  top: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export default function Hero3D() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setMounted(true), 300);
    return () => clearTimeout(t);
  }, []);

  // Adaptar cantidad de estrellas al viewport
  const starCount =
    typeof window !== "undefined"
      ? window.innerWidth < 640
        ? 0
        : window.innerWidth < 768
        ? 15
        : 60
      : 0;

  const stars: Star[] = useMemo(() => {
    const result: Star[] = [];
    let seed = 123;
    function random() {
      const x = Math.sin(seed++) * 10000;
      return x - Math.floor(x);
    }
    for (let i = 0; i < starCount; i++) {
      result.push({
        left: random() * 100,
        top: random() * 100,
        size: random() * 1.5 + 1.0,
        opacity: random() * 0.4 + 0.3,
        duration: random() * 3 + 2,
        delay: random() * 5,
      });
    }
    return result;
  }, [starCount]);

  const blobs: BlobConfig[] = useMemo(
    () => [
      {
        background:
          "radial-gradient(circle, rgba(99, 102, 241, 0.85) 0%, rgba(99, 102, 241, 0) 70%)",
        width: "min(50vw, 550px)",
        height: "min(50vw, 550px)",
        left: "12%",
        top: "15%",
        animationName: "float-circle-1",
        duration: 14,
        opacity: 0.22,
      },
      {
        background:
          "radial-gradient(circle, rgba(192, 132, 252, 0.85) 0%, rgba(126, 34, 206, 0) 70%)",
        width: "min(55vw, 600px)",
        height: "min(55vw, 600px)",
        left: "48%",
        top: "10%",
        animationName: "float-circle-2",
        duration: 18,
        opacity: 0.18,
      },
      {
        background:
          "radial-gradient(circle, rgba(126, 34, 206, 0.9) 0%, rgba(126, 34, 206, 0) 70%)",
        width: "min(48vw, 500px)",
        height: "min(48vw, 500px)",
        left: "20%",
        top: "48%",
        animationName: "float-circle-3",
        duration: 20,
        opacity: 0.24,
      },
      {
        background:
          "radial-gradient(circle, rgba(129, 140, 248, 0.85) 0%, rgba(192, 132, 252, 0) 70%)",
        width: "min(60vw, 650px)",
        height: "min(60vw, 650px)",
        left: "52%",
        top: "42%",
        animationName: "float-circle-4",
        duration: 16,
        opacity: 0.16,
      },
    ],
    [],
  );

  // Interactivity Hook to handle highly smoothed cursor transitions on blobs with cached bounding rect to prevent forced layout / reflow
  useEffect(() => {
    let cachedRect: DOMRect | null = null;

    const updateRect = () => {
      const container = containerRef.current;
      if (container) {
        cachedRect = container.getBoundingClientRect();
      }
    };

    // Calculate once on mount
    updateRect();

    // Also update on scroll/resize and onmouseenter
    window.addEventListener("resize", updateRect, { passive: true });
    window.addEventListener("scroll", updateRect, { passive: true });

    const handleMouseMove = (e: MouseEvent) => {
      const container = containerRef.current;
      if (!container) return;

      if (!cachedRect) {
        updateRect();
      }
      const rect = cachedRect;
      if (!rect) return;

      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      // Approximate coordinates of the blob centers relative to viewport bounds
      const blobCenters = [
        { x: rect.width * 0.12 + 250, y: rect.height * 0.15 + 250 },
        { x: rect.width * 0.48 + 250, y: rect.height * 0.1 + 250 },
        { x: rect.width * 0.2 + 250, y: rect.height * 0.48 + 250 },
        { x: rect.width * 0.52 + 250, y: rect.height * 0.42 + 250 },
      ];

      let closestIdx = -1;
      let minDistance = Infinity;

      const calculated = blobCenters.map((center, idx) => {
        const dx = mouseX - center.x;
        const dy = mouseY - center.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < minDistance) {
          minDistance = dist;
          closestIdx = idx;
        }
        return { dx, dy, dist };
      });

      calculated.forEach((val, idx) => {
        // Nearest blob displaces up to 30px, others between 10px and 20px
        const maxMove = idx === closestIdx ? 30 : 10 + ((idx * 3.3) % 11);
        const dist = val.dist || 1;
        const factor = Math.min(dist / 300, 1); // smooth scaling limit

        const moveX = (val.dx / dist) * maxMove * factor;
        const moveY = (val.dy / dist) * maxMove * factor;

        container.style.setProperty(`--blob-${idx}-x`, `${moveX}px`);
        container.style.setProperty(`--blob-${idx}-y`, `${moveY}px`);
      });
    };

    const handleMouseLeave = () => {
      const container = containerRef.current;
      if (!container) return;
      for (let i = 0; i < 4; i++) {
        container.style.setProperty(`--blob-${i}-x`, "0px");
        container.style.setProperty(`--blob-${i}-y`, "0px");
      }
    };

    const handleMouseEnter = () => {
      updateRect();
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    window.addEventListener("mouseleave", handleMouseLeave, { passive: true });
    window.addEventListener("mouseenter", handleMouseEnter, { passive: true });

    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
      window.removeEventListener("mouseenter", handleMouseEnter);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 z-0 pointer-events-none overflow-hidden"
    >
      {/* Dynamic CSS animations tag injected cleanly inside module scope */}
      <style>{`
        @keyframes float-circle-1 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
          25% {
            transform: translate3d(60px, 40px, 0) rotate(90deg) scale(1.05);
          }
          50% {
            transform: translate3d(100px, -60px, 0) rotate(180deg) scale(0.95);
          }
          75% {
            transform: translate3d(-40px, -80px, 0) rotate(270deg) scale(1.02);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(360deg) scale(1);
          }
        }

        @keyframes float-circle-2 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1.02);
          }
          33% {
            transform: translate3d(-80px, 90px, 0) rotate(120deg) scale(0.95);
          }
          66% {
            transform: translate3d(70px, -50px, 0) rotate(240deg) scale(1.05);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(360deg) scale(1.02);
          }
        }

        @keyframes float-circle-3 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(0.98);
          }
          25% {
            transform: translate3d(-50px, -90px, 0) rotate(90deg) scale(1.02);
          }
          50% {
            transform: translate3d(80px, 30px, 0) rotate(180deg) scale(0.95);
          }
          75% {
            transform: translate3d(-20px, 70px, 0) rotate(270deg) scale(1.04);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(360deg) scale(0.98);
          }
        }

        @keyframes float-circle-4 {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg) scale(1);
          }
          33% {
            transform: translate3d(90px, -70px, 0) rotate(-120deg) scale(1.06);
          }
          66% {
            transform: translate3d(-60px, 100px, 0) rotate(-240deg) scale(0.94);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(-360deg) scale(1);
          }
        }

        @keyframes twinkle {
          0%, 100% {
            opacity: var(--star-opacity, 0.5);
          }
          50% {
            opacity: 0.05;
          }
        }

        @keyframes drift {
          0% {
            transform: translate3d(0, 0, 0);
          }
          100% {
            transform: translate3d(15px, -10px, 0);
          }
        }

        .starfield-drift {
          animation: drift 20s ease-in-out infinite alternate;
        }

        .gradient-mesh-blob {
          position: absolute;
          border-radius: 50%;
          mix-blend-mode: screen;
          will-change: transform;
          filter: blur(80px);
        }
      `}</style>

      {/* 2. Interactive Starfield Container with Drift & Twinkle effects */}
      <div className="absolute inset-0 w-full h-full starfield-drift pointer-events-none">
        {mounted && starCount > 0 && stars.map((star, idx) => (
          <div
            key={idx}
            className="absolute rounded-full bg-white"
            style={
              {
                left: `${star.left}%`,
                top: `${star.top}%`,
                width: `${star.size}px`,
                height: `${star.size}px`,
                animation: `twinkle ${star.duration}s ease-in-out infinite`,
                animationDelay: `${star.delay}s`,
                "--star-opacity": star.opacity,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* 3. Layered Gradient Mesh Blobs Container */}
      <div className="absolute inset-0 w-full h-full opacity-90">
        {mounted && blobs.map((blob, idx) => (
          <div
            key={idx}
            style={{
              position: "absolute",
              left: blob.left,
              top: blob.top,
              width: blob.width,
              height: blob.height,
              transform: `translate3d(var(--blob-${idx}-x, 0px), var(--blob-${idx}-y, 0px), 0)`,
              transition: "transform 0.8s ease-out",
            }}
          >
            <div
              className="gradient-mesh-blob w-full h-full"
              style={{
                background: blob.background,
                opacity: blob.opacity,
                animationName: blob.animationName,
                animationDuration: `${blob.duration}s`,
                animationTimingFunction: "ease-in-out",
                animationIterationCount: "infinite",
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
