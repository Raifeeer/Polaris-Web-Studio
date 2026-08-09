import { useVoiceOptions, setStoredVoiceURI } from "../hooks/useTextToSpeech";
import { useLanguage } from "../context/LanguageContext";

// Selector de voz/acento para la lectura en voz alta (botón "Escuchar") --
// pedido explícito del usuario: el acento por default (es-ES, España) no
// le gustaba. useTextToSpeech ya elige un default más neutro/latino solo,
// pero esto deja elegir a mano entre TODAS las voces reales que el
// navegador/SO tenga instaladas para ese idioma. Preferencia global (no
// por mensaje) -- guardada en localStorage, aplica a la próxima lectura
// de cualquier respuesta en ese idioma.
export default function VoicePicker({ lang }: { lang: "es" | "en" }) {
  const { options, current } = useVoiceOptions(lang);
  const { translate } = useLanguage();
  if (options.length <= 1) return null;
  return (
    <select
      value={current?.voiceURI || ""}
      onClick={(e) => e.stopPropagation()}
      onChange={(e) => setStoredVoiceURI(lang, e.target.value)}
      aria-label={translate("Elegir voz", "Choose voice")}
      title={translate("Elegir voz para la lectura en voz alta", "Choose the voice used to read replies aloud")}
      className="max-w-[110px] truncate text-[10px] font-bold uppercase tracking-wider bg-transparent border border-[var(--color-border-subtle)] rounded-full px-2 py-0.5 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:border-[var(--color-primary-base)] transition-colors outline-none cursor-pointer"
    >
      {options.map((v) => (
        <option key={v.voiceURI} value={v.voiceURI}>
          {v.name.replace(/^Microsoft |^Google /, "")}
        </option>
      ))}
    </select>
  );
}
