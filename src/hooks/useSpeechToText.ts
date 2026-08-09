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
// Idioma del DICTADO: deliberadamente separado del idioma de la interfaz
// del sitio (ver `voiceLang`, nunca toca el toggle ES/EN global). El Web
// Speech API no soporta cambiar el idioma A MITAD de una grabación en
// curso -- `switchVoiceLang()` por eso hace pausa+reinicio real: detiene el
// reconocimiento actual (conservando lo ya transcrito) y arranca uno nuevo
// con el idioma nuevo -- el usuario solo necesita volver a hablar después
// de tocar el botón, sin perder lo ya dicho. Arranca con el idioma real
// del dispositivo (`navigator.language`) o el último usado (recordado en
// localStorage), nunca con el toggle de la interfaz.
const VOICE_LANG_KEY = "atlas_voice_lang";
const BAR_COUNT = 24;

// Mismo canal de diagnóstico que useTextToSpeech.ts -- pedido explícito del
// usuario tras bugs de voz reportados en vivo que no se podían reproducir
// por curl (dependen del dispositivo/navegador real).
function logClientEvent(event: Record<string, unknown>) {
  try {
    const body = JSON.stringify({ scope: "speech-to-text", ...event, ua: navigator.userAgent, t: Date.now() });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/client-log", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/client-log", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
    }
  } catch {
    // nunca romper el dictado por un log
  }
}

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
  const [voiceLang, setVoiceLangState] = useState<"es" | "en">(() => getStartLang(fallbackLang));

  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const transcriptRef = useRef("");
  // Espejo del texto combinado (finalizado + provisional) que ya se venía
  // mostrando en pantalla -- se usa para confirmar en vez de transcriptRef
  // (que solo junta los fragmentos que el navegador marcó "final"). Con
  // abort() (ver stopWithFallback) el navegador descarta cualquier
  // resultado todavía provisional -- sin este espejo, tocar el check justo
  // mientras la última palabra seguía sin finalizar borraba todo el texto y
  // no llenaba el input (bug real reportado en vivo).
  const latestTextRef = useRef("");
  const cancelledRef = useRef(false);
  // true mientras un stop() fue disparado por switchVoiceLang (reinicio real
  // con otro idioma), no por el usuario confirmando/cancelando -- así
  // `onend` sabe si debe reiniciar en vez de cerrar el dictado.
  const restartingRef = useRef(false);
  const voiceLangRef = useRef(voiceLang);
  // Respaldo real contra un bug conocido de WebKit/iOS Safari: llamar
  // recognition.stop() mientras hay una grabación `continuous` en curso a
  // veces nunca dispara onend/onerror -- sin este timeout, los botones de
  // cancelar/cambiar idioma se quedan "sin hacer nada" porque el evento que
  // dispara handleEnd() simplemente nunca llega, no porque el click no se
  // haya registrado.
  const forceStopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    voiceLangRef.current = voiceLang;
  }, [voiceLang]);

  useEffect(() => {
    const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSupported(!!SR);
  }, []);

  const setVoiceLang = (lang: "es" | "en") => {
    setVoiceLangState(lang);
    try {
      localStorage.setItem(VOICE_LANG_KEY, lang);
    } catch {
      // sin localStorage -- no crítico
    }
  };

  const stopAudioViz = () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setLevels(new Array(BAR_COUNT).fill(0.08));
  };

  // Visualización real del volumen del micrófono (onda tipo Claude) --
  // aparte de SpeechRecognition, que no expone niveles de audio. Si el
  // usuario niega el permiso o falla, el dictado real sigue funcionando
  // igual, solo sin la onda animada. Sigue corriendo durante un cambio de
  // idioma (no se corta/reinicia solo por eso).
  const startAudioViz = async () => {
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
      // Throttle real a ~12 actualizaciones/seg -- leer el nivel de audio
      // sigue corriendo cada frame (barato, no toca React), pero setLevels()
      // (un render de React + reanimar 24 <motion.span>) antes corría a los
      // 60fps completos del rAF. En un dispositivo real eso satura tanto el
      // hilo principal que los toques en los botones de al lado (cancelar/
      // confirmar/cambiar idioma) dejaban de registrar a tiempo -- bug real
      // encontrado en vivo (botones "sin hacer nada" en iPhone).
      const LEVELS_INTERVAL_MS = 80;
      let lastUpdate = 0;
      const tick = (now: number) => {
        analyser.getByteFrequencyData(data);
        if (now - lastUpdate >= LEVELS_INTERVAL_MS) {
          lastUpdate = now;
          const next: number[] = [];
          for (let i = 0; i < BAR_COUNT; i++) next.push(Math.max(0.08, data[i * step] / 255));
          setLevels(next);
        }
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    } catch {
      // sin permiso/soporte para la onda visual -- no bloquea el dictado real.
    }
  };

  // `createAndStartRecognition` y `handleEnd` se referencian entre sí (el
  // reinicio por cambio de idioma vuelve a llamar a la primera desde la
  // segunda) -- por eso van como funciones planas, no useCallback: se
  // recrean en cada render y cierran siempre sobre las últimas variables,
  // sin el problema de dependencias circulares que tendría memoizarlas.
  const createAndStartRecognition = (lang: "es" | "en") => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition = new SR();
    recognition.lang = lang === "en" ? "en-US" : "es-ES";
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
      const combined = `${transcriptRef.current}${interimChunk}`.trim();
      latestTextRef.current = combined;
      setInterimText(combined);
    };
    // El navegador puede disparar tanto `onerror` como `onend` para la
    // MISMA sesión al llamar stop() a mitad de una frase -- sin este
    // chequeo de identidad, el segundo evento (tardío, de la instancia
    // vieja ya reemplazada por el reinicio del primero) cerraba el
    // dictado recién reiniciado con el idioma nuevo, dando la sensación
    // de que cambiar de idioma "salía del modo voz".
    const onEndOrError = (e?: any) => {
      if (recognitionRef.current !== recognition) return;
      if (e?.error) logClientEvent({ event: "recognition_error", errorCode: e.error, lang });
      handleEnd();
    };
    recognition.onend = onEndOrError;
    recognition.onerror = onEndOrError;
    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (err: any) {
      // recognition.start() puede lanzar de forma síncrona (ej. "already
      // started", permiso denegado) -- sin este catch quedaba como excepción
      // no capturada y la UI se quedaba en "escuchando" para siempre, sin
      // ninguna pista de qué pasó.
      logClientEvent({ event: "start_threw", message: err?.message || String(err), lang });
      recognitionRef.current = null;
      setListening(false);
      stopAudioViz();
    }
  };

  function handleEnd() {
    if (forceStopTimerRef.current) {
      clearTimeout(forceStopTimerRef.current);
      forceStopTimerRef.current = null;
    }
    if (restartingRef.current) {
      restartingRef.current = false;
      createAndStartRecognition(voiceLangRef.current);
      return;
    }
    setListening(false);
    stopAudioViz();
    const text = latestTextRef.current.trim();
    if (text && !cancelledRef.current) {
      onResult(text);
      setVoiceLang(detectLang(text));
    }
    setInterimText("");
    transcriptRef.current = "";
    latestTextRef.current = "";
  }

  const start = useCallback(() => {
    if (!supported) return;
    cancelledRef.current = false;
    restartingRef.current = false;
    transcriptRef.current = "";
    latestTextRef.current = "";
    setInterimText("");
    startAudioViz();
    createAndStartRecognition(voiceLangRef.current);
    setListening(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supported]);

  // Datos reales de los logs de producción (Chrome iOS / WebKit) confirman
  // que recognition.stop() prácticamente NUNCA dispara onend/onerror en ese
  // navegador -- cada cierre real venía del respaldo forzado a los 900ms,
  // nunca del evento nativo. recognition.abort(), en cambio, SÍ dispara
  // onerror (code "aborted") de forma confiable. Por eso ahora se llama
  // abort() directo -- ya no hay que esperar en vano esos ~900ms muertos en
  // cada cambio de idioma o cancelación, que es justo lo que se sentía como
  // "queda trabado". Queda solo un respaldo corto (STOP_TIMEOUT_MS) por si
  // algún navegador tampoco reacciona a abort().
  const STOP_TIMEOUT_MS = 400;
  const stopWithFallback = (recognition: any) => {
    if (forceStopTimerRef.current) clearTimeout(forceStopTimerRef.current);
    try {
      recognition.abort();
    } catch {
      recognition.stop();
    }
    forceStopTimerRef.current = setTimeout(() => {
      forceStopTimerRef.current = null;
      if (recognitionRef.current !== recognition) return; // ya se cerró por el evento real
      logClientEvent({ event: "abort_fallback_triggered", stopTimeoutMs: STOP_TIMEOUT_MS });
      handleEnd();
    }, STOP_TIMEOUT_MS);
  };

  const stop = useCallback(() => {
    if (recognitionRef.current) stopWithFallback(recognitionRef.current);
  }, []);

  // Descarta la grabación en curso sin llenar el input -- distinto de
  // `stop()`, que confirma lo transcrito hasta ahí.
  const cancel = useCallback(() => {
    cancelledRef.current = true;
    if (recognitionRef.current) stopWithFallback(recognitionRef.current);
  }, []);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  // Pausa el reconocimiento actual y lo reinicia con el otro idioma --
  // conserva lo ya dictado, pero el usuario tiene que volver a hablar
  // después de tocar el botón (el navegador no soporta cambiar de idioma
  // sin reiniciar la sesión de reconocimiento en curso).
  const switchVoiceLang = useCallback(() => {
    const next = voiceLangRef.current === "es" ? "en" : "es";
    setVoiceLang(next);
    if (listening && recognitionRef.current) {
      restartingRef.current = true;
      stopWithFallback(recognitionRef.current);
    }
  }, [listening]);

  useEffect(() => stop, [stop]);

  return { listening, supported, interimText, levels, voiceLang, toggle, stop, cancel, switchVoiceLang };
}
