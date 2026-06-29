import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "../context/LanguageContext";

interface Star {
  id: number;
  x: number;
  y: number;
  size: number;
  speed: number;
}

interface Obstacle {
  id: number;
  x: number;
  y: number;
  rotation: number;
}

export default function EasterEgg() {
  const [activated, setActivated] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [playerY, setPlayerY] = useState(50);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [stars, setStars] = useState<Star[]>([]);
  const gameRef = useRef<HTMLDivElement>(null);
  const animFrameRef = useRef<number>(0);
  const scoreRef = useRef(0);
  const { language } = useLanguage();

  // Secret sequence detector: "polaris"
  useEffect(() => {
    const sequence = "polaris";
    let buffer = "";
    let timeout: ReturnType<typeof setTimeout>;

    const handleKey = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      buffer += e.key.toLowerCase();
      clearTimeout(timeout);
      timeout = setTimeout(() => (buffer = ""), 2000);

      if (buffer.includes(sequence)) {
        buffer = "";
        setActivated(true);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      clearTimeout(timeout);
    };
  }, []);

  // Game loop
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(() => {
      setObstacles((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: 105,
          y: Math.random() * 80 + 10,
          rotation: Math.random() * 360,
        },
      ]);
    }, 1200);

    const starInterval = setInterval(() => {
      setStars((prev) => [
        ...prev,
        {
          id: Date.now(),
          x: 105,
          y: Math.random() * 100,
          size: Math.random() * 2 + 1,
          speed: Math.random() * 0.5 + 0.3,
        },
      ]);
    }, 200);

    const gameLoop = () => {
      setObstacles((prev) => {
        const updated = prev
          .map((o) => ({ ...o, x: o.x - 0.6, rotation: o.rotation + 1 }))
          .filter((o) => o.x > -10);

        // Collision detection
        updated.forEach((o) => {
          const dist = Math.sqrt(
            Math.pow(15 - o.x, 2) + Math.pow(playerY - o.y, 2)
          );
          if (dist < 7) {
            setGameOver(true);
          }
        });

        return updated;
      });

      setStars((prev) =>
        prev
          .map((s) => ({ ...s, x: s.x - s.speed }))
          .filter((s) => s.x > -5)
      );

      scoreRef.current += 1;
      if (scoreRef.current % 10 === 0) {
        setScore(Math.floor(scoreRef.current / 10));
      }

      animFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      clearInterval(spawnInterval);
      clearInterval(starInterval);
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameStarted, gameOver, playerY]);

  // Player movement
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowUp" || e.key === "w") {
        setPlayerY((p) => Math.max(5, p - 5));
      }
      if (e.key === "ArrowDown" || e.key === "s") {
        setPlayerY((p) => Math.min(95, p + 5));
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [gameStarted, gameOver]);

  // Touch controls for mobile
  const handleTouch = useCallback(
    (e: React.TouchEvent) => {
      if (!gameStarted || gameOver) return;
      const rect = gameRef.current?.getBoundingClientRect();
      if (!rect) return;
      const touchY = ((e.touches[0].clientY - rect.top) / rect.height) * 100;
      setPlayerY(Math.max(5, Math.min(95, touchY)));
    },
    [gameStarted, gameOver]
  );

  const resetGame = () => {
    setScore(0);
    scoreRef.current = 0;
    setGameOver(false);
    setObstacles([]);
    setPlayerY(50);
    setGameStarted(true);
  };

  // WordPress "W" SVG path for obstacles
  const wpPath =
    "M3 3h18v18H3V3zm3.5 4.5l2.5 8 2-5.5 2 5.5 2.5-8h-1.8l-1.2 4.5-1.8-5-1.8 5-1.2-4.5H6.5z";

  return (
    <AnimatePresence>
      {activated && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-md flex items-center justify-center"
          onClick={(e) => {
            if (e.target === e.currentTarget && !gameStarted) setActivated(false);
          }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="w-full max-w-lg mx-4"
          >
            {/* Close button */}
            <button
              onClick={() => {
                setActivated(false);
                setGameStarted(false);
                setGameOver(false);
                setObstacles([]);
                setScore(0);
                scoreRef.current = 0;
              }}
              className="absolute top-6 right-6 text-white/30 hover:text-white/70 text-sm font-mono cursor-pointer"
            >
              ESC
            </button>

            {!gameStarted && !gameOver ? (
              // Start screen
              <div className="text-center space-y-6">
                <motion.div
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <svg
                    width="64"
                    height="64"
                    viewBox="0 0 200 200"
                    fill="none"
                    className="mx-auto"
                  >
                    <path
                      d="M100 10 L108 85 L130 60 L115 92 L190 100 L115 108 L130 140 L108 115 L100 190 L92 115 L70 140 L85 108 L10 100 L85 92 L70 60 L92 85 Z"
                      fill="#6366f1"
                    />
                    <circle cx="100" cy="100" r="8" fill="white" />
                  </svg>
                </motion.div>
                <div>
                  <h3 className="text-white font-black text-xl tracking-tight font-sans">
                    POLARIS DEFENDER
                  </h3>
                  <p className="text-white/40 text-xs font-mono mt-2">
                    Esquiva los logos de WordPress
                  </p>
                  <p className="text-white/20 text-[10px] font-mono mt-1">
                    ↑↓ o W/S para moverte · Touch en móvil
                  </p>
                </div>
                <button
                  onClick={() => {
                    setGameStarted(true);
                    setPlayerY(50);
                  }}
                  className="px-8 py-3 rounded-lg bg-[#6366f1] text-white font-bold text-sm hover:bg-[#818cf8] transition-colors cursor-pointer"
                >
                  JUGAR
                </button>
              </div>
            ) : (
              // Game area
              <div>
                <div className="flex justify-between items-center mb-3 px-1">
                  <span className="text-white/30 text-[10px] font-mono">
                    POLARIS DEFENDER
                  </span>
                  <span className="text-[#6366f1] text-sm font-black font-mono">
                    {score}
                  </span>
                </div>
                <div
                  ref={gameRef}
                  onTouchMove={handleTouch}
                  className="relative w-full aspect-[16/9] bg-[#0a0a1a] rounded-lg border border-white/10 overflow-hidden"
                >
                  {/* Stars background */}
                  {stars.map((s) => (
                    <div
                      key={s.id}
                      className="absolute bg-white/20 rounded-full"
                      style={{
                        left: `${s.x}%`,
                        top: `${s.y}%`,
                        width: s.size,
                        height: s.size,
                      }}
                    />
                  ))}

                  {/* Player — Polaris star */}
                  <motion.div
                    animate={{ top: `${playerY}%` }}
                    transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    className="absolute left-[12%]"
                    style={{ translateY: "-50%" }}
                  >
                    <svg
                      width="28"
                      height="28"
                      viewBox="0 0 200 200"
                      fill="none"
                    >
                      <path
                        d="M100 10 L108 85 L130 60 L115 92 L190 100 L115 108 L130 140 L108 115 L100 190 L92 115 L70 140 L85 108 L10 100 L85 92 L70 60 L92 85 Z"
                        fill="#6366f1"
                      />
                      <circle cx="100" cy="100" r="8" fill="white" />
                    </svg>
                  </motion.div>

                  {/* Obstacles — WordPress logos */}
                  {obstacles.map((o) => (
                    <div
                      key={o.id}
                      className="absolute"
                      style={{
                        left: `${o.x}%`,
                        top: `${o.y}%`,
                        transform: `translate(-50%, -50%) rotate(${o.rotation}deg)`,
                      }}
                    >
                      <svg
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="#3b82f6"
                        opacity="0.6"
                      >
                        <path d={wpPath} />
                      </svg>
                    </div>
                  ))}

                  {/* Game Over overlay */}
                  {gameOver && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-4"
                    >
                      <p className="text-white/60 text-xs font-mono uppercase tracking-wider">
                        WordPress te atrapó
                      </p>
                      <p className="text-3xl font-black text-white font-mono">
                        {score}
                      </p>
                      <button
                        onClick={resetGame}
                        className="px-6 py-2 rounded-lg bg-[#6366f1] text-white text-xs font-bold hover:bg-[#818cf8] transition-colors cursor-pointer"
                      >
                        REINTENTAR
                      </button>
                    </motion.div>
                  )}
                </div>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
