import { useEffect, useRef, useState } from "react";

export default function CountdownPill({
  targetDate,
  onExpire,
}: {
  targetDate: number;
  onExpire: () => void;
}) {
  const [timeLeft, setTimeLeft] = useState(targetDate - Date.now());
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = targetDate - Date.now();
      if (remaining <= 0) {
        setTimeLeft(0);
        clearInterval(timer);
        onExpireRef.current();
      } else {
        setTimeLeft(remaining);
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [targetDate]);

  const days = Math.floor(timeLeft / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeLeft % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeLeft % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeLeft % (1000 * 60)) / 1000);

  return (
    <div className="font-display font-black tracking-widest bg-[var(--color-surface-base)] border border-[var(--color-primary-base)] text-[var(--color-primary-base)] px-4 py-1.5 rounded-full shadow-inner tabular-nums text-xs md:text-sm uppercase">
      {`${days}d ${hours.toString().padStart(2, "0")}h ${minutes.toString().padStart(2, "0")}m ${seconds.toString().padStart(2, "0")}s`}
    </div>
  );
}
