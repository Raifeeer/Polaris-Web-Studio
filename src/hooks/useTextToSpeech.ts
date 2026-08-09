import { useState, useCallback, useRef, useEffect } from "react";
import { stripMarkdownForSpeech } from "../lib/utils";

export type TtsProvider = "gemini" | "grok";

// Único audio reproduciéndose a la vez, en todo el chat -- si se dispara la
// lectura de otro mensaje, corta la anterior primero.
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

// Reporta un evento puntual a /api/client-log (best-effort, nunca bloquea ni
// rompe el flujo real) -- pedido explícito del usuario tras varios bugs de
// voz reportados en vivo que no se podían reproducir por curl (dependen de
// la red/dispositivo real). Con esto, un evento real queda consultable en
// los logs de Vercel en vez de tener que adivinar la causa.
function logClientEvent(event: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ scope: "tts", ...event, ua: navigator.userAgent, t: Date.now() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/client-log", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/client-log", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // nunca romper el chat por un log
  }
}

// El WAV crudo de Gemini TTS pesa ~3x más que un MP3 real (sin comprimir,
// PCM 24kHz) -- probado en vivo: una respuesta típica de ~30 palabras dio
// ~600KB con Gemini contra ~180KB con Grok (MP3 real). En una conexión móvil
// real eso es la diferencia entre "carga en unos segundos" y "se queda
// trabado" -- default cambiado a Grok tras confirmar esto con datos reales,
// no solo preferencia de voz. Gemini sigue disponible pasando provider
// explícito, para seguir comparando.
const DEFAULT_PROVIDER: TtsProvider = "grok";

// Si el fetch+play no resuelve en este tiempo, se fuerza un reset -- sin
// esto, un `audio.play()` que nunca resuelve ni rechaza (visto en algunos
// navegadores móviles con blobs grandes) deja el botón en "cargando" para
// siempre, sin ninguna señal de que algo salió mal.
const HARD_TIMEOUT_MS = 30_000;

export function useTextToSpeech(text: string, lang: "es" | "en", provider: TtsProvider = DEFAULT_PROVIDER) {
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const urlRef = useRef<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearHardTimeout = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const reset = useCallback(() => {
    clearHardTimeout();
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
      logClientEvent({ event: "cancel_manual", speaking, loading });
      stopCurrent();
      reset();
      return;
    }
    stopCurrent();
    setLoading(true);
    const startedAt = Date.now();
    timeoutRef.current = setTimeout(() => {
      logClientEvent({ event: "hard_timeout", provider, elapsedMs: Date.now() - startedAt });
      reset();
    }, HARD_TIMEOUT_MS);
    try {
      const clean = stripMarkdownForSpeech(text);
      const fetchStart = Date.now();
      const r = await fetch("/api/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: clean, lang, provider }),
      });
      const fetchMs = Date.now() - fetchStart;
      if (!r.ok) {
        logClientEvent({ event: "fetch_not_ok", provider, status: r.status, fetchMs });
        throw new Error(`tts request failed: ${r.status}`);
      }
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const audio = new Audio(url);
      audioRef.current = audio;
      urlRef.current = url;
      currentAudio = audio;
      currentReset = reset;
      audio.onended = () => {
        logClientEvent({ event: "ended", provider });
        reset();
      };
      audio.onerror = () => {
        logClientEvent({ event: "audio_error", provider, code: audio.error?.code, message: audio.error?.message });
        reset();
      };
      clearHardTimeout();
      setLoading(false);
      setSpeaking(true);
      logClientEvent({ event: "playing", provider, fetchMs, blobBytes: blob.size, blobType: blob.type, textChars: clean.length });
      await audio.play();
    } catch (err: any) {
      logClientEvent({ event: "error", provider, message: err?.message || String(err), elapsedMs: Date.now() - startedAt });
      reset();
    }
  }, [text, lang, provider, speaking, loading, reset]);

  useEffect(() => {
    return () => {
      clearHardTimeout();
      if (audioRef.current === currentAudio) stopCurrent();
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { speaking, loading, supported: true, toggle };
}
