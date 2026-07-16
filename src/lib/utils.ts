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
