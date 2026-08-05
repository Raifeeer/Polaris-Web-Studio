import { useState, useEffect } from "react";

type TextSize = "normal" | "large" | "xlarge";

const SIZES: TextSize[] = ["normal", "large", "xlarge"];

export function useTextSize() {
  const [textSize, setTextSize] = useState<TextSize>(() => {
    const saved = localStorage.getItem("polaris-text-size") as TextSize;
    return saved && SIZES.includes(saved) ? saved : "normal";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove("text-size-large", "text-size-xlarge");
    if (textSize !== "normal") {
      root.classList.add(`text-size-${textSize}`);
    }
    localStorage.setItem("polaris-text-size", textSize);
  }, [textSize]);

  const cycleTextSize = () => {
    setTextSize((prev) => SIZES[(SIZES.indexOf(prev) + 1) % SIZES.length]);
  };

  return { textSize, cycleTextSize };
}
