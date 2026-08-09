import { useState, useEffect, useCallback } from "react";
import { stripMarkdownForSpeech } from "../lib/utils";

// Leer en voz alta una respuesta puntual del chat -- Web Speech API
// (SpeechSynthesis) nativa del navegador, sin costo ni backend. Cada
// mensaje tiene su propio botón/estado, pero solo puede sonar uno a la
// vez -- `speechSynthesis.cancel()` corta cualquier lectura anterior
// (de este mensaje u otro) antes de arrancar una nueva.
export function useTextToSpeech(text: string, lang: "es" | "en") {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Si el usuario dispara la lectura de OTRO mensaje (u otra parte del
  // sitio cancela speechSynthesis), este mensaje deja de mostrarse como
  // "hablando" -- se detecta con el evento nativo, no con un flag propio.
  useEffect(() => {
    if (!supported) return;
    const check = () => {
      if (!window.speechSynthesis.speaking) setSpeaking(false);
    };
    const interval = setInterval(check, 300);
    return () => clearInterval(interval);
  }, [supported]);

  const toggle = useCallback(() => {
    if (!supported) return;
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(stripMarkdownForSpeech(text));
    utterance.lang = lang === "en" ? "en-US" : "es-ES";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }, [lang, speaking, supported, text]);

  useEffect(() => {
    return () => {
      if (speaking && typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { speaking, supported, toggle };
}
