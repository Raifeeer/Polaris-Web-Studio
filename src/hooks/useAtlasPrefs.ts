import { useState } from "react";

// Preferencias reales de Atlas Assistant, compartidas entre el widget
// flotante (QuoteBot.tsx) y la página completa (/asistente) -- viven en
// localStorage (mismo patrón que el resto del estado de Atlas en
// useAtlasChat.ts), así que cambiarlas en un lugar se refleja en el otro sin
// necesidad de que ambas superficies tengan su propia UI de ajustes.
export type AtlasFontSize = "sm" | "md" | "lg";
const FONT_SIZE_KEY = "atlas_font_size";
const SOUND_KEY = "atlas_sound_enabled";
const ENTER_TO_SEND_KEY = "atlas_enter_to_send";

// Clases reales de Tailwind por tamaño -- deben aparecer literales en algún
// archivo del proyecto para que el JIT las genere (acá mismo alcanza).
export const FONT_SIZE_CLASS: Record<AtlasFontSize, string> = { sm: "text-xs", md: "text-sm", lg: "text-base" };

export function useAtlasPrefs() {
  const [fontSize, setFontSizeState] = useState<AtlasFontSize>(() => {
    if (typeof window === "undefined") return "md";
    const v = localStorage.getItem(FONT_SIZE_KEY);
    return v === "sm" || v === "md" || v === "lg" ? v : "md";
  });
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(SOUND_KEY) === "1";
  });
  // Enter para enviar está ON por defecto en desktop (comportamiento ya
  // existente, ver AtlasChat.tsx) -- este ajuste deja apagarlo del todo para
  // quien prefiera que Enter SIEMPRE agregue una línea nueva, incluso en
  // desktop, y solo se envíe con el botón.
  const [enterToSend, setEnterToSendState] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    const v = localStorage.getItem(ENTER_TO_SEND_KEY);
    return v === null ? true : v === "1";
  });

  const setFontSize = (v: AtlasFontSize) => {
    setFontSizeState(v);
    try {
      localStorage.setItem(FONT_SIZE_KEY, v);
    } catch {
      // localStorage lleno/deshabilitado -- el ajuste sigue funcionando en memoria, solo no persiste
    }
  };
  const setSoundEnabled = (v: boolean) => {
    setSoundEnabledState(v);
    try {
      localStorage.setItem(SOUND_KEY, v ? "1" : "0");
    } catch {
      // ver arriba
    }
  };
  const setEnterToSend = (v: boolean) => {
    setEnterToSendState(v);
    try {
      localStorage.setItem(ENTER_TO_SEND_KEY, v ? "1" : "0");
    } catch {
      // ver arriba
    }
  };

  return { fontSize, setFontSize, soundEnabled, setSoundEnabled, enterToSend, setEnterToSend };
}

// Beep corto generado con Web Audio (sin archivo de audio externo que
// cargar) -- se reproduce cuando Atlas termina de responder, solo si el
// usuario activó el sonido. Nunca lanza -- Web Audio puede no estar
// disponible (o requerir un gesto del usuario que todavía no ocurrió), y
// eso no debe romper nada del chat.
export function playAtlasChime() {
  try {
    const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const ctx = new AudioCtxClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.25);
    osc.start();
    osc.stop(ctx.currentTime + 0.26);
    osc.onended = () => ctx.close();
  } catch {
    // Web Audio no disponible -- silencioso, no bloquea nada real del chat
  }
}
