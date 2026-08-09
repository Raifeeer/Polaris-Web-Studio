import { useState, useCallback, useRef, useEffect } from "react";
import { stripMarkdownForSpeech } from "../lib/utils";

export type TtsProvider = "gemini" | "grok";

// Única instancia de audio reproduciéndose a la vez, en todo el chat -- si
// se dispara la lectura de otro mensaje, corta la anterior primero.
let currentAudio: HTMLAudioElement | null = null;
let currentReset: (() => void) | null = null;

function stopCurrent() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
  }
  currentAudio = null;
  if (currentReset) currentReset();
  currentReset = null;
}

// Lectura en voz alta de una respuesta puntual del chat con voces neuronales
// reales, generadas server-side (Cloud Function `/api/tts`) -- reemplaza la
// SpeechSynthesis nativa del navegador (voces del sistema operativo, feas e
// inconsistentes entre dispositivos) a pedido explícito del usuario.
// `provider` elige el motor real: "gemini" (default, Gemini TTS) o "grok"
// (Grok TTS) -- ambos vía la misma key que la cuenta ya paga en otros
// endpoints, sin costo/cuenta nueva.
export function useTextToSpeech(text: string, lang: "es" | "en", provider: TtsProvider = "gemini") {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);

  const reset = useCallback(() => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = null;
    }
    audioRef.current = null;
    setSpeaking(false);
    setLoading(false);
  }, []);

  const toggle = useCallback(async () => {
    if (speaking || loading) {
      stopCurrent();
      reset();
      return;
    }
    stopCurrent();
    setLoading(true);
    try {
      const clean = stripMarkdownForSpeech(text);
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, lang, provider }),
      });
      if (!r.ok) throw new Error("tts request failed");
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;
      currentAudio = audio;
      currentReset = reset;
      audio.onended = reset;
      audio.onerror = reset;
      setLoading(false);
      setSpeaking(true);
      await audio.play();
    } catch {
      reset();
    }
  }, [text, lang, provider, speaking, loading, reset]);

  useEffect(() => {
    return () => {
      if (audioRef.current === currentAudio) stopCurrent();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { speaking, loading, supported: true, toggle };
}
