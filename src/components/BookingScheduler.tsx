import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { T, useLanguage } from "../context/LanguageContext";

// Agendador propio vía la Cloud Function calcom-booking (repo Meridian) —
// reemplaza el formulario embebido de Cal.com en todo el sitio. Motivo real
// (18 de julio): con el embed, quien agendaba recibía siempre dos correos
// ajenos (la confirmación de hello@cal.com y la invitación de Google Calendar
// desde el Gmail personal) imposibles de apagar sin pagar Cal.com. Reservando
// por API, el asistente en Cal.com es el buzón interno (hola@polarisweb.studio,
// donde quedan esos correos como registro) y el cliente recibe uno solo: el de
// Polaris, con el link real de Google Meet y la invitación .ics adjunta.
const BOOKING_URL = "https://calcom-booking-wdvfac6mgq-ue.a.run.app";
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function BookingScheduler({
  notes,
  initialName = "",
  initialEmail = "",
  phone = "",
  // Tipo de evento real de Cal.com a reservar -- "consultoria" (30 min,
  // default, wizard + CTA final de la landing), "alineacion" (15 min,
  // /proceso) o "reporte" (30 min, reporte mensual de tráfico). Cada uno
  // tiene su propio tipo de evento en Cal.com (calcom-booking, Meridian) en
  // vez de reusar siempre el mismo -- evita el bug real de copy que promete
  // "15 minutos" pero reserva el evento de 30.
  type = "consultoria",
  onBooked,
}: {
  notes: string;
  initialName?: string;
  initialEmail?: string;
  phone?: string;
  type?: "consultoria" | "alineacion" | "reporte";
  // Recibe el nombre/correo con el que el cliente terminó confirmando la
  // reserva -- puede diferir de initialName/initialEmail si lo corrigió acá
  // mismo (caso real: typo en el nombre al enviar la cotización, arreglado
  // recién al agendar). El wizard usa esto para sincronizar el lead ya
  // guardado en Firestore, en vez de dejarlo con el dato viejo para siempre.
  onBooked: (name: string, email: string) => void;
}) {
  const { language, translate } = useLanguage();
  const locale = language === "en" ? "en-US" : "es-DO";

  // Horarios agrupados por día LOCAL del navegador (no por el día UTC que
  // devuelve Cal), para que un slot de las 8pm UTC no caiga en el día
  // equivocado en América.
  const [slotsByDay, setSlotsByDay] = useState<Record<string, string[]> | null>(null);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [slotsError, setSlotsError] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState(initialName);
  const [email, setEmail] = useState(initialEmail);
  const [clientNote, setClientNote] = useState("");
  const [emailError, setEmailError] = useState("");
  const [nameError, setNameError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [bookingError, setBookingError] = useState<"slot" | "generic" | null>(null);

  useEffect(() => {
    if (slotsByDay || slotsLoading) return;
    setSlotsLoading(true);
    setSlotsError(false);
    fetch(`${BOOKING_URL}?action=slots&days=21&type=${type}`)
      .then((res) => res.json())
      .then((data) => {
        const grouped: Record<string, string[]> = {};
        Object.values(data.slots || {}).forEach((daySlots) => {
          (daySlots as { start: string }[]).forEach(({ start }) => {
            const d = new Date(start);
            const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            (grouped[key] = grouped[key] || []).push(start);
          });
        });
        Object.values(grouped).forEach((times) => times.sort());
        setSlotsByDay(grouped);
        setSelectedDay(Object.keys(grouped).sort()[0] || null);
      })
      .catch(() => setSlotsError(true))
      .finally(() => setSlotsLoading(false));
  }, [slotsByDay, slotsLoading]);

  const handleConfirm = async () => {
    if (!name.trim()) {
      setNameError(translate("Ingresa tu nombre.", "Enter your name."));
      return;
    }
    if (!EMAIL_REGEX.test(email.trim())) {
      setEmailError(translate("Ingresa un email válido.", "Enter a valid email."));
      return;
    }
    if (!selectedSlot) return;
    setNameError("");
    setEmailError("");
    setSubmitting(true);
    setBookingError(null);
    try {
      const res = await fetch(BOOKING_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          start: selectedSlot,
          timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          language,
          notes: clientNote.trim()
            ? `${notes}\n\n${translate("Comentario del cliente:", "Client comment:")} ${clientNote.trim()}`
            : notes,
          phone,
          type,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        onBooked(name.trim(), email.trim());
        return;
      }
      if (res.status === 409) {
        // Alguien tomó ese horario primero — recargar horarios y pedir otro.
        setBookingError("slot");
        setSlotsByDay(null);
        setSelectedSlot(null);
        return;
      }
      setBookingError("generic");
    } catch {
      setBookingError("generic");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-w-0 bg-[var(--color-surface-base)] rounded-2xl border border-[var(--color-border-subtle)] p-5 md:p-7 space-y-6">
      {slotsLoading && (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-spin w-6 h-6 border-2 border-[var(--color-primary-base)] border-t-transparent rounded-full" />
        </div>
      )}

      {!slotsLoading && slotsError && (
        <div className="text-center py-10 space-y-4">
          <p className="text-sm text-[var(--color-text-secondary)]">
            <T en="We couldn't load the available times. Please try again.">No pudimos cargar los horarios disponibles. Inténtalo de nuevo.</T>
          </p>
          <button
            type="button"
            onClick={() => { setSlotsError(false); setSlotsByDay(null); }}
            className="py-2.5 px-6 rounded-xl bg-[var(--color-primary-base)] text-white font-bold text-sm border-none cursor-pointer"
          >
            <T en="Retry">Reintentar</T>
          </button>
        </div>
      )}

      {!slotsLoading && !slotsError && slotsByDay && (
        <>
          <div className="min-w-0">
            <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-[var(--color-text-secondary)]">
              <T en="Pick a day">Elige un día</T>
            </label>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1" style={{ WebkitOverflowScrolling: "touch" }}>
              {Object.keys(slotsByDay).sort().map((day) => {
                const label = new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }).format(new Date(`${day}T12:00:00`));
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => { setSelectedDay(day); setSelectedSlot(null); }}
                    className={`shrink-0 px-4 py-2.5 rounded-xl border text-sm font-semibold capitalize transition-all cursor-pointer ${
                      selectedDay === day
                        ? "bg-[var(--color-primary-base)] text-white border-transparent"
                        : "bg-transparent border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {selectedDay && slotsByDay[selectedDay] && (
            <div className="min-w-0">
              <label className="block text-xs font-bold uppercase tracking-wider mb-3 text-[var(--color-text-secondary)]">
                <T en="Pick a time (your local time)">Elige una hora (tu hora local)</T>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                {slotsByDay[selectedDay].map((iso) => (
                  <button
                    key={iso}
                    type="button"
                    onClick={() => setSelectedSlot(iso)}
                    className={`min-w-0 px-2 py-2.5 rounded-xl border text-sm font-semibold transition-all cursor-pointer ${
                      selectedSlot === iso
                        ? "bg-[var(--color-primary-base)] text-white border-transparent"
                        : "bg-transparent border-[var(--color-border-strong)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                    }`}
                  >
                    {new Intl.DateTimeFormat(locale, { hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso))}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <input
                type="text"
                required
                autoComplete="name"
                placeholder={translate("Tu nombre *", "Your name *")}
                value={name}
                onChange={(e) => { setName(e.target.value); setNameError(""); }}
                onBlur={() => {
                  if (!name.trim()) setNameError(translate("Ingresa tu nombre.", "Enter your name."));
                }}
                className={`glass-input w-full px-4 py-3 rounded-xl border text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-base md:text-sm transition-all ${nameError ? "border-red-500" : "border-[var(--color-border-strong)]"}`}
              />
              {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
            </div>
            <div>
              <input
                type="email"
                required
                autoComplete="email"
                placeholder={translate("tu@correo.com *", "your@email.com *")}
                value={email}
                onChange={(e) => { setEmail(e.target.value); setEmailError(""); }}
                onBlur={() => {
                  if (email.trim() && !EMAIL_REGEX.test(email.trim())) {
                    setEmailError(translate("Ingresa un email válido.", "Enter a valid email."));
                  }
                }}
                className={`glass-input w-full px-4 py-3 rounded-xl border text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-base md:text-sm transition-all ${emailError ? "border-red-500" : "border-[var(--color-border-strong)]"}`}
              />
              {emailError && <p className="text-xs text-red-500 mt-1">{emailError}</p>}
            </div>
          </div>

          <div>
            <textarea
              rows={3}
              placeholder={translate(
                "¿Algo que quieras contarnos antes de la llamada? (opcional)",
                "Anything you'd like us to know before the call? (optional)"
              )}
              value={clientNote}
              onChange={(e) => setClientNote(e.target.value)}
              maxLength={500}
              className="glass-input w-full px-4 py-3 rounded-xl border border-[var(--color-border-strong)] text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-base)] text-base md:text-sm transition-all resize-none"
            />
          </div>

          {bookingError === "slot" && (
            <p className="text-xs text-amber-500">
              <T en="That time was just taken — pick another one, the times were refreshed.">Ese horario acaba de ocuparse — elige otro, los horarios se actualizaron.</T>
            </p>
          )}
          {bookingError === "generic" && (
            <p className="text-xs text-red-500">
              <T en="We couldn't book the meeting. Please try again or email us at hola@polarisweb.studio.">No pudimos agendar la reunión. Inténtalo de nuevo o escríbenos a hola@polarisweb.studio.</T>
            </p>
          )}

          <button
            type="button"
            disabled={submitting || !selectedSlot || !name.trim() || !EMAIL_REGEX.test(email.trim())}
            onClick={handleConfirm}
            className="w-full flex items-center justify-center gap-2 py-3.5 px-4 bg-[var(--color-primary-base)] hover:brightness-110 active:scale-[0.98] text-white font-bold rounded-xl transition-all text-sm cursor-pointer border-none shadow-none disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                <T en="Booking your meeting...">Agendando tu reunión...</T>
              </>
            ) : (
              <T en="Confirm meeting">Confirmar reunión</T>
            )}
          </button>

          <p className="text-xs text-[var(--color-text-tertiary)] text-center leading-relaxed">
            <T en="You'll receive the confirmation with the Google Meet link and a calendar invite by email.">Recibirás la confirmación con el enlace de Google Meet y la invitación de calendario por correo.</T>
          </p>
        </>
      )}
    </div>
  );
}
