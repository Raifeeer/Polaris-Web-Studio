import React, { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Check, AlertCircle, Send } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle, useJsonLd } from "../hooks/useDocumentTitle";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Página real de "Contacto" -- antes esto solo existía como un mailto:
// suelto en el footer, sin URL propia ni link en el nav (bug real de SEO
// encontrado el 23 de julio: sin un destino "Contacto" estable, Google no
// tenía nada consistente que ofrecer como sitelink). A pedido explícito
// del usuario: solo un formulario de correo, sin ningún botón de WhatsApp
// acá (eso ya vive en /nosotros#contacto y en el footer).
export default function Contacto() {
  const { language, translate } = useLanguage();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [company, setCompany] = useState(""); // honeypot, invisible
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useDocumentTitle(
    "Contacto | Polaris Web Studio",
    "Contact | Polaris Web Studio",
    "Escríbenos y te respondemos por correo. Cuéntanos sobre tu proyecto y armamos una propuesta real.",
    "Write to us and we'll reply by email. Tell us about your project and we'll put together a real proposal.",
    { path: "/contacto" }
  );

  useJsonLd("jsonld-contacto-breadcrumb", {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: translate("Inicio", "Home"), item: "https://polarisweb.studio/" },
      { "@type": "ListItem", position: 2, name: translate("Contacto", "Contact"), item: "https://polarisweb.studio/contacto" },
    ],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanMessage = message.trim();

    if (!cleanName || !cleanEmail || !cleanMessage) {
      setErrorMsg(translate("Completa todos los campos.", "Please fill in every field."));
      return;
    }
    if (!EMAIL_REGEX.test(cleanEmail)) {
      setErrorMsg(translate("Ingresa un correo electrónico válido.", "Please enter a valid email address."));
      return;
    }

    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: cleanName, email: cleanEmail, message: cleanMessage, company }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || `contact failed: ${res.status}`);
      }
      setStatus("success");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      console.error("Error enviando mensaje de contacto:", err);
      setStatus("error");
      setErrorMsg(translate("Ocurrió un error al enviar tu mensaje. Intenta nuevamente.", "Something went wrong sending your message. Please try again."));
    }
  };

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)]">
      <Navbar />

      <main className="max-w-3xl mx-auto px-6 md:px-12 pt-32 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="space-y-3 mb-12 text-center"
        >
          <span className="inline-block text-[var(--color-primary-base)] text-xs font-black uppercase tracking-[0.2em] bg-[var(--color-surface-highlight)] px-4 py-1.5 rounded-full border border-[var(--color-border-subtle)]">
            <T en="Get in touch">Escríbenos</T>
          </span>
          <h1 className="text-4xl md:text-5xl font-display font-black tracking-tighter text-[var(--color-text-primary)]">
            <T en="Contact">Contacto</T>
          </h1>
          <p className="text-[var(--color-text-secondary)] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
            <T en="Tell us about your project. We reply by email, usually within one business day.">
              Cuéntanos sobre tu proyecto. Te respondemos por correo, normalmente dentro de un día hábil.
            </T>
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="glass-panel rounded-2xl p-6 md:p-10 relative overflow-hidden"
        >
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {status === "success" ? (
            <div className="relative z-10 flex flex-col items-center text-center gap-3 py-10">
              <div className="w-14 h-14 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <Check className="w-7 h-7" />
              </div>
              <h2 className="font-display font-black text-xl text-[var(--color-text-primary)]">
                <T en="Message sent">Mensaje enviado</T>
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
                <T en="Thanks for writing to us. We'll get back to you by email soon.">
                  Gracias por escribirnos. Te contactaremos por correo a la brevedad.
                </T>
              </p>
              <button
                type="button"
                onClick={() => setStatus("idle")}
                className="mt-2 text-sm font-bold text-[var(--color-primary-base)] hover:underline"
              >
                <T en="Send another message">Enviar otro mensaje</T>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="relative z-10 space-y-5">
              {/* Honeypot -- invisible para una persona real, un bot que
                  autocompleta formularios sí suele rellenarlo. */}
              <input
                type="text"
                name="company"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                autoComplete="off"
                tabIndex={-1}
                aria-hidden="true"
                className="absolute -left-[9999px] w-px h-px opacity-0"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                    <T en="Name">Nombre</T>
                  </label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    disabled={status === "loading"}
                    placeholder={translate("Tu nombre", "Your name")}
                    className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-all disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                    <T en="Email">Correo</T>
                  </label>
                  <input
                    type="email"
                    required
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={status === "loading"}
                    placeholder="tu@correo.com"
                    className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-all disabled:opacity-50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
                  <T en="Message">Mensaje</T>
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  disabled={status === "loading"}
                  placeholder={translate("Contanos sobre tu proyecto...", "Tell us about your project...")}
                  className="glass-input w-full rounded-xl px-4 py-3 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] transition-all disabled:opacity-50 resize-none"
                />
              </div>

              {errorMsg && (
                <div className="flex items-center gap-1.5 text-red-500 text-xs">
                  <AlertCircle size={14} />
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full bg-[var(--color-primary-base)] hover:brightness-110 disabled:opacity-50 text-[var(--color-on-primary)] rounded-xl py-3.5 px-4 text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2"
              >
                {status === "loading" ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Send size={16} />
                    <T en="Send message">Enviar mensaje</T>
                  </>
                )}
              </button>

              <p className="flex items-center justify-center gap-1.5 text-xs text-[var(--color-text-tertiary)] pt-1">
                <Mail size={12} />
                <T en="Prefer email directly? Write to">¿Prefieres escribir directo? Contáctanos a</T>{" "}
                <a href="mailto:hola@polarisweb.studio" className="font-bold hover:text-[var(--color-primary-base)]">
                  hola@polarisweb.studio
                </a>
              </p>
            </form>
          )}
        </motion.div>
      </main>

      <Footer />
    </div>
  );
}
