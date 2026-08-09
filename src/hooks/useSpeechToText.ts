import { useState, useRef, useCallback, useEffect } from "react";
import { detectLang } from "../lib/utils";

// Dictado por voz (Web Speech API) para el input del chat de Atlas --
// nativo del navegador, sin costo ni backend nuevo. Deliberadamente NO
// envía el mensaje solo: solo llena el texto del input (onResult) para que
// el usuario revise/edite antes de mandar, mismo criterio que cualquier
// otra acción real del chat (nunca automática sin confirmación).
//
// Transcripción en vivo: `interimResults: true` + `continuous: true`, así
// el texto aparece mientras se habla (no recién al soltar), igual que la
// app de Claude.
//
// Idioma: el Web Speech API NO soporta detección automática de idioma en
// tiempo real dentro de una misma grabación -- hay que fijar `lang` de
// antemano. Mitigación real (no una solución perfecta, documentada acá
// para que quede claro el límite): en vez de heredar el toggle ES/EN de la
// interfaz (que puede no reflejar en qué idioma va a hablar el usuario),
// arranca con el idioma real del dispositivo (`navigator.language`) y,
// después de cada grabación, detecta el idioma real de lo transcrito
// (`detectLang`) y lo guarda -- la próxima vez que se abra el micrófono
// arranca directo en ese idioma. Si el usuario cambia de idioma A MITAD de
// una misma grabación, esa grabación puntual sigue sesgada al idioma con el
// que arrancó (limitación real del navegador, no de esta implementación).
const VOICE_LANG_KEY = "atlas_voice_lang";
const BAR_COUNT = 24;

function getStartLang(fallback: "es" | "en"): "es" | "en" {
  if (typeof window === "undefined") return fallback;
  const stored = localStorage.getItem(VOICE_LANG_KEY);
  if (stored === "es" || stored === "en") return stored;
  if (typeof navigator !== "undefined" && navigator.language) {
    return navigator.language.toLowerCase().startsWith("en") ? "en" : "es";
  }
  return fallback;
}

export function useSpeechToText(onResult: (text: string) => void, fallbackLang: "es" | "en") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interimText, setInterimText] = useState("");
  const [levels, setLevels] = useState<number[]>(() => new Array(BAR_COUNT).fill(0.08));

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  const cancelledRef = useRef(false);

  useEffect(() => {
    const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSupported(!!SR);
  }, []);

  const stopAudioViz = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(new Array(BAR_COUNT).fill(0.08));
  }, []);

  // Visualización real del volumen del micrófono (onda tipo Claude) --
  // aparte de SpeechRecognition, que no expone niveles de audio. Si el
  // usuario niega el permiso o falla, el dictado real sigue funcionando
  // igual, solo sin la onda animada.
  const startAudioViz = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx: AudioContext = new AudioCtx();
      audioCtxRef.current = ctx;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      const data = new Uint8Array(analyser.frequencyBinCount);
      const step = Math.max(1, Math.floor(data.length / BAR_COUNT));
      const tick = () => {
        analyser.getByteFrequencyData(data);
        const next: number[] = [];
        for (let i = 0; i < BAR_COUNT; i++) next.push(Math.max(0.08, data[i * step] / 255));
        setLevels(next);
        rafRef.current = requestAnimationFrame(tick);
      };
      tick();
    } catch {
      // sin permiso/soporte para la onda visual -- no bloquea el dictado real.
    }
  }, []);

  const finish = useCallback(() => {
    setListening(false);
    stopAudioViz();
    const text = transcriptRef.current.trim();
    if (text && !cancelledRef.current) {
      onResult(text);
      const detected = detectLang(text);
      try {
        localStorage.setItem(VOICE_LANG_KEY, detected);
      } catch {
        // sin localStorage -- no crítico, solo no recuerda el idioma para la próxima
      }
    }
    setInterimText("");
    transcriptRef.current = "";
  }, [onResult, stopAudioViz]);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    cancelledRef.current = false;
    transcriptRef.current = "";
    setInterimText("");
    const recognition = new SR();
    recognition.lang = getStartLang(fallbackLang) === "en" ? "en-US" : "es-ES";
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      let finalChunk = "";
      let interimChunk = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const transcript = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalChunk += `${transcript} `;
        else interimChunk += transcript;
      }
      if (finalChunk) transcriptRef.current += finalChunk;
      setInterimText(`${transcriptRef.current}${interimChunk}`.trim());
    };
    recognition.onend = finish;
    recognition.onerror = finish;
    recognitionRef.current = recognition;
    startAudioViz();
    recognition.start();
    setListening(true);
  }, [fallbackLang, finish, startAudioViz]);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // Descarta la grabación en curso sin llenar el input -- distinto de
  // `stop()`, que confirma lo transcrito hasta ahí.
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    recognitionRef.current?.stop();
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => stop, [stop]);

  return { listening, supported, interimText, levels, toggle, stop, cancel };
}
