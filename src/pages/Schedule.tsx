import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import BookingScheduler from "../components/BookingScheduler";
import { T, useLanguage } from "../context/LanguageContext";

// Página dedicada de agendado (/agendar) -- versión standalone del mismo
// BookingScheduler ya usado embebido en el paso 4 de /cotizar y en el modal
// de /proceso. Existe para que cualquier link "Agendar una llamada" que
// viva fuera de una página real del sitio (ej. el CTA del PDF/correo del
// reporte mensual de tráfico, que hasta ahora apuntaba directo a
// cal.com/cristian-dicen) lleve al mismo flujo propio de Polaris -- sin eso,
// esos correos rompían la promesa de la Fase 22 (el cliente solo ve
// correos/superficies de Polaris, nunca cal.com directo).
export default function Schedule() {
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const initialName = searchParams.get("name") || "";
  const initialEmail = searchParams.get("email") || "";
  // Contexto opcional para que Cristian sepa de dónde vino la reserva sin
  // depender de memoria -- ej. ?src=reporte-trafico desde el PDF/correo.
  const src = searchParams.get("src") || "";
  // Tipo de evento real -- ver el mismo prop en BookingScheduler.tsx. Default
  // "consultoria" para cualquier link genérico que no especifique tipo.
  const rawType = searchParams.get("type") || "consultoria";
  const type = (["consultoria", "alineacion", "reporte"].includes(rawType) ? rawType : "consultoria") as
    | "consultoria"
    | "alineacion"
    | "reporte";
  const notes =
    (language === "en"
      ? "Direct consultation booked from the standalone scheduling page."
      : "Consulta directa programada desde la página de agendado independiente.") +
    (src ? ` (src: ${src})` : "");

  const copyByType = {
    consultoria: {
      title: <T en="Let's talk about your project">Hablemos de tu proyecto</T>,
      body: (
        <T en="Pick a time that works for you. You'll get a confirmation email from Polaris with a real Google Meet link, no third-party emails involved.">
          Elige el horario que mejor te acomode. Recibirás un correo de
          confirmación de Polaris con un link real de Google Meet, sin
          correos de terceros de por medio.
        </T>
      ),
    },
    alineacion: {
      title: <T en="Quick 15-minute alignment call">Llamada rápida de 15 minutos</T>,
      body: (
        <T en="Pick a time that works for you for a short call to align on goals and timelines.">
          Elige el horario que mejor te acomode para una llamada corta y
          definir metas y fechas de entrega.
        </T>
      ),
    },
    reporte: {
      title: <T en="Let's talk about your report">Hablemos de tu reporte</T>,
      body: (
        <T en="Pick a time so we can review your traffic numbers together and adjust your digital strategy.">
          Elige el horario que mejor te acomode para revisar juntos las
          cifras de tu reporte y ajustar tu estrategia digital.
        </T>
      ),
    },
  } as const;

  return (
    <div className="min-h-[100svh] flex flex-col bg-[var(--color-surface-base)] relative overflow-hidden">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-24 md:py-32">
        <div className="w-full max-w-xl">
          <div className="text-center mb-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--color-primary-base)] mb-3">
              <T en="Schedule a call">Agenda una llamada</T>
            </div>
            <h1 className="text-3xl md:text-4xl font-display font-black text-[var(--color-text-primary)] mb-3">
              {copyByType[type].title}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
              {copyByType[type].body}
            </p>
          </div>

          <div className="bg-[var(--color-surface-elevated)] border border-[var(--color-border-subtle)] rounded-2xl overflow-hidden">
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-8 md:p-12 text-center space-y-6 flex flex-col items-center justify-center min-h-[400px]"
              >
                <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-2 animate-bounce">
                  <Check size={32} />
                </div>
                <h2 className="text-2xl font-display font-black text-[var(--color-text-primary)]">
                  <T en="Call scheduled!">¡Llamada agendada!</T>
                </h2>
                <p className="text-sm text-[var(--color-text-secondary)] max-w-md mx-auto leading-relaxed">
                  <T en="We registered your session successfully. A Google Meet invitation has been sent to your email. See you soon!">
                    Registramos tu sesión con éxito. Te enviamos una
                    invitación con el link de Google Meet a tu correo. ¡Nos
                    vemos pronto!
                  </T>
                </p>
              </motion.div>
            ) : (
              <BookingScheduler
                type={type}
                notes={notes}
                initialName={initialName}
                initialEmail={initialEmail}
                onBooked={() => setIsSuccess(true)}
              />
            )}
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
