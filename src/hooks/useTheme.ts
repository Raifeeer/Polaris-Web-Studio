import { useState, useEffect } from "react";

type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(() => {
    const savedTheme = localStorage.getItem("polaris-theme") as Theme;
    if (savedTheme) return savedTheme;

    if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      return "light";
    }
    return "dark";
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === "light") {
      root.classList.add("light");
    } else {
      root.classList.remove("light");
    }
    localStorage.setItem("polaris-theme", theme);
  }, [theme]);

  // Keep independent hook instances synchronized, such as ThemeToggle and AtlasMark.
  useEffect(() => {
    const handleThemeChange = (event: Event) => {
      const nextTheme = (event as CustomEvent<Theme>).detail;
      if (nextTheme === "light" || nextTheme === "dark") setTheme(nextTheme);
    };

    window.addEventListener("polaris-theme-change", handleThemeChange);
    return () => window.removeEventListener("polaris-theme-change", handleThemeChange);
  }, []);

  // Synchronize with system preferences automatically
  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    
    const handleChange = (e: MediaQueryListEvent) => {
      const savedTheme = localStorage.getItem("polaris-theme");
      // If there is no saved user preference, synchronize with system theme automatically
      if (!savedTheme) {
        setTheme(e.matches ? "dark" : "light");
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener("change", handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener("change", handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme: Theme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    window.dispatchEvent(new CustomEvent<Theme>("polaris-theme-change", { detail: nextTheme }));
  };

  return { theme, toggleTheme };
}

