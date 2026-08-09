import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formato de fecha consistente para todo el sitio: dd/mm/aaaa en español,
 * mm/dd/aaaa en inglés (vía Intl real, no concatenación manual). Acepta un
 * string "YYYY-MM-DD" (se interpreta como fecha local, sin desfasar por
 * timezone), un ISO datetime completo, o un objeto Date ya construido.
 * `opts` permite pedir un formato distinto (ej. "16 de julio de 2026") sin
 * perder el idioma correcto -- por defecto es el numérico dd/mm vs mm/dd.
 */
export function formatDate(
  dateInput: string | Date,
  language: "es" | "en",
  opts: Intl.DateTimeFormatOptions = { day: "2-digit", month: "2-digit", year: "numeric" }
): string {
  let date: Date;
  if (dateInput instanceof Date) {
    date = dateInput;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split("-").map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateInput);
  }
  if (isNaN(date.getTime())) return typeof dateInput === "string" ? dateInput : "";
  return date.toLocaleDateString(language === "en" ? "en-US" : "es-ES", opts);
}

/**
 * Fecha corta relativa, estilo Gemini: "Ayer"/"Anteayer" (ES) o "Yesterday"
 * (EN) para los últimos 2 días, y "{mes abreviado} {día}" el resto (ej.
 * "ago 9", "jul 16" en ES; "Aug 9" en EN) -- nunca año, pensado para listas
 * de historial donde el año casi siempre es el actual. Compara por fecha de
 * calendario local (medianoche a medianoche), no por horas transcurridas,
 * para que algo de las 23:50 de ayer siga diciendo "Ayer" y no "hace 1 día".
 */
export function formatRelativeShort(dateInput: string | number | Date, language: "es" | "en"): string {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput);
  if (isNaN(date.getTime())) return "";
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const diffDays = Math.round((startOfDay(new Date()) - startOfDay(date)) / 86400000);
  if (diffDays === 0) return language === "en" ? "Today" : "Hoy";
  if (diffDays === 1) return language === "en" ? "Yesterday" : "Ayer";
  if (diffDays === 2 && language === "es") return "Anteayer";
  return date.toLocaleDateString(language === "en" ? "en-US" : "es-ES", { month: "short", day: "numeric" }).replace(/\.$/, "");
}
