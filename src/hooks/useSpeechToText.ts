import { useState, useRef, useCallback, useEffect } from "react";

// Dictado por voz (Web Speech API) para el input del chat de Atlas --
// nativo del navegador, sin costo ni backend nuevo. Deliberadamente NO
// envía el mensaje solo: solo llena el texto del input (onResult) para que
// el usuario revise/edite antes de mandar, mismo criterio que cualquier
// otra acción real del chat (nunca automática sin confirmación). Sin tipos
// oficiales en TS para SpeechRecognition -- se usa `any` acotado a este
// archivo, resto de la app tipado normal.
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  stop: () => void;
  onresult: ((e: any) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: any) => void) | null;
};

export function useSpeechToText(onResult: (text: string) => void, lang: "es" | "en") {
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    const SR = typeof window !== "undefined" && ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
    setSupported(!!SR);
  }, []);

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) return;
    const recognition: SpeechRecognitionLike = new SR();
    recognition.lang = lang === "en" ? "en-US" : "es-ES";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (e: any) => {
      const transcript = Array.from(e.results as any)
        .map((r: any) => r[0].transcript)
        .join(" ")
        .trim();
      if (transcript) onResult(transcript);
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognitionRef.current = recognition;
    recognition.start();
    setListening(true);
  }, [lang, onResult]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => stop, [stop]);

  return { listening, supported, toggle };
}
