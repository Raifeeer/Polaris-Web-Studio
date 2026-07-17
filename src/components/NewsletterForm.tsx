import React, { useState } from "react";
import { Mail, Check, AlertCircle } from "lucide-react";
import { getAppCheckToken } from "../lib/firebase";
import { T, useLanguage } from "../context/LanguageContext";
import { useToast } from "../context/ToastContext";

const SUBSCRIBE_URL = "https://newsletter-subscribe-wdvfac6mgq-ue.a.run.app";

export default function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const { success, error: toastError } = useToast();
  const { language } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = email.trim().toLowerCase();
    // Validación básica de formato en el cliente — el servidor la repite
    // igual, esto es solo para no gastar una llamada de red en algo obvio.
    if (!clean || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      setStatus("error");
      toastError(
        <T en="Please enter a valid email address.">Por favor, ingresa un correo electrónico válido.</T>
      );
      return;
    }

    setStatus("loading");
    try {
      const appCheckToken = await getAppCheckToken();
      const res = await fetch(SUBSCRIBE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(appCheckToken ? { "X-Firebase-AppCheck": appCheckToken } : {}),
        },
        body: JSON.stringify({ email: clean, language }),
      });

      if (res.status === 429) {
        setStatus("error");
        toastError(
          <T en="Too many attempts. Please try again later.">Demasiados intentos. Intenta de nuevo más tarde.</T>
        );
        return;
      }
      if (!res.ok) throw new Error(`subscribe failed: ${res.status}`);

      const data = await res.json();
      setStatus("success");
      setEmail("");
      if (data.alreadySubscribed) {
        success(
          <T en="You're already subscribed to our newsletter.">Ya estás suscrito a nuestro boletín.</T>
        );
      } else {
        success(
          <T en="Successfully subscribed to our newsletter! 🎉">¡Suscripción al boletín confirmada con éxito! 🎉</T>
        );
      }
    } catch (error) {
      console.error("Error subscribing: ", error);
      setStatus("error");
      toastError(
        <T en="An error occurred while subscribing. Please try again.">Ocurrió un error al suscribirte. Intenta nuevamente.</T>
      );
    }
  };

  return (
    <div className="glass-panel rounded-2xl p-6 md:p-8 mt-12 mb-8 relative overflow-hidden">
      <div className="absolute -top-10 -right-10 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />
      
      <div className="relative z-10 flex flex-col md:flex-row md:items-center gap-6 justify-between">
        <div className="flex-1 space-y-2 text-left">
          <div className="flex items-center gap-2 text-indigo-500 mb-1">
            <Mail size={18} />
            <span className="text-xs font-mono font-bold uppercase tracking-wider">
              <T en="Newsletter">Newsletter</T>
            </span>
          </div>
          <h4 className="text-xl md:text-2xl font-display font-black text-[var(--color-text-primary)] tracking-tight">
            <T en="Learn how to grow your business with technology">Aprende a hacer crecer tu negocio con tecnología</T>
          </h4>
          <p className="text-sm text-[var(--color-text-secondary)]">
            <T en="Join our list and receive actionable insights directly in your inbox. No spam, just value.">
              Únete a nuestra lista y recibe estrategias accionables en tu correo. Sin spam, solo valor real.
            </T>
          </p>
        </div>

        <div className="w-full md:w-auto md:min-w-[320px]">
          {status === "success" ? (
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 flex items-center justify-center gap-3 text-emerald-500">
              <Check className="w-5 h-5" />
              <p className="text-sm font-bold">
                <T en="Successfully subscribed!">¡Suscripción confirmada!</T>
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <div className="relative">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ejemplo@empresa.com"
                  disabled={status === "loading"}
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-all disabled:opacity-50"
                />
              </div>
              <button
                type="submit"
                disabled={status === "loading" || !email}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 text-white rounded-xl py-3 px-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center"
              >
                {status === "loading" ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <T en="Subscribe now">Suscribirme ahora</T>
                )}
              </button>
              {status === "error" && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs mt-1">
                  <AlertCircle size={12} />
                  <T en="An error occurred. Please try again.">Ocurrió un error. Intenta nuevamente.</T>
                </div>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
