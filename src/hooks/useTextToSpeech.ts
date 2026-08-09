import { useState, useEffect, useCallback, useRef } from "react";
import { stripMarkdownForSpeech } from "../lib/utils";

const VOICE_KEY_PREFIX = "atlas_tts_voice_"; // + "es" | "en" -> voiceURI elegido a mano

// Voces del navegador (Web Speech API) suelen cargar de forma asíncrona --
// vacío al primer render, se llenan tras el evento `voiceschanged` (a veces
// nunca dispara en Chrome si ya estaban listas, por eso también se pide
// una vez de entrada).
function useAvailableVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const load = () => setVoices(window.speechSynthesis.getVoices());
    load();
    window.speechSynthesis.addEventListener("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener("voiceschanged", load);
  }, []);
  return voices;
}

// Español por default trae acento de España (es-ES) en la mayoría de
// navegadores -- pedido explícito del usuario: preferir un acento
// latinoamericano/neutro, más cercano al público real de Polaris (RD).
// Prioridad real: es-DO/es-419 (si el sistema los trae) > es-US > es-MX >
// cualquier es-* que no sea es-ES > es-ES como último recurso (mejor que
// nada si es la única voz de español instalada).
function pickDefaultVoice(voices: SpeechSynthesisVoice[], lang: "es" | "en"): SpeechSynthesisVoice | undefined {
  const prefix = lang === "en" ? "en" : "es";
  const pool = voices.filter((v) => v.lang.toLowerCase().startsWith(prefix));
  if (lang === "en") {
    return pool.find((v) => v.lang.toLowerCase() === "en-us") || pool[0];
  }
  const priority = ["es-do", "es-419", "es-us", "es-mx", "es-co", "es-ar"];
  for (const code of priority) {
    const match = pool.find((v) => v.lang.toLowerCase() === code);
    if (match) return match;
  }
  const nonSpain = pool.find((v) => v.lang.toLowerCase() !== "es-es");
  return nonSpain || pool[0];
}

function getStoredVoiceURI(lang: "es" | "en"): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem(`${VOICE_KEY_PREFIX}${lang}`);
  } catch {
    return null;
  }
}

export function setStoredVoiceURI(lang: "es" | "en", voiceURI: string) {
  try {
    localStorage.setItem(`${VOICE_KEY_PREFIX}${lang}`, voiceURI);
  } catch {
    // sin localStorage -- se pierde la preferencia entre sesiones, no crítico
  }
}

// Devuelve las voces disponibles para un idioma + la voz actualmente
// elegida (guardada a mano, o el mejor default automático) -- usado por el
// selector de voz junto al botón de "Escuchar".
export function useVoiceOptions(lang: "es" | "en") {
  const voices = useAvailableVoices();
  const pool = voices.filter((v) => v.lang.toLowerCase().startsWith(lang));
  const stored = getStoredVoiceURI(lang);
  const current = pool.find((v) => v.voiceURI === stored) || pickDefaultVoice(voices, lang);
  return { options: pool, current };
}

// Leer en voz alta una respuesta puntual del chat -- Web Speech API
// (SpeechSynthesis) nativa del navegador, sin costo ni backend. Cada
// mensaje tiene su propio botón/estado, pero solo puede sonar uno a la
// vez -- `speechSynthesis.cancel()` corta cualquier lectura anterior
// (de este mensaje u otro) antes de arrancar una nueva.
export function useTextToSpeech(text: string, lang: "es" | "en") {
  const [speaking, setSpeaking] = useState(false);
  const [supported, setSupported] = useState(false);
  const voices = useAvailableVoices();
  const voicesRef = useRef(voices);
  voicesRef.current = voices;

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
    const stored = getStoredVoiceURI(lang);
    const pool = voicesRef.current.filter((v) => v.lang.toLowerCase().startsWith(lang));
    const voice = pool.find((v) => v.voiceURI === stored) || pickDefaultVoice(voicesRef.current, lang);
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === "en" ? "en-US" : "es-ES";
    }
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
