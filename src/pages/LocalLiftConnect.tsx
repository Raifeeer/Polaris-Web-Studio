import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export default function LocalLiftConnect() {
  const { leadId } = useParams<{ leadId: string }>();
  const [status, setStatus] = useState<"loading" | "ready" | "notfound" | "notincluded">("loading");
  const [businessName, setBusinessName] = useState("");

  useDocumentTitle("Guía de implementación Ascenso | Polaris", "Rise implementation guide | Polaris", "", "");

  useEffect(() => {
    if (!leadId) {
      setStatus("notfound");
      return;
    }
    fetch("/api/local-lift-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "lookup", leadId }),
    })
      .then((response) => response.json())
      .then((leadData) => {
        if (!leadData.success) {
          setStatus("notfound");
          return;
        }
        setBusinessName(leadData.businessName || "");
        setStatus(leadData.tier === "ascenso" || leadData.tier === "implementado" ? "ready" : "notincluded");
      })
      .catch(() => setStatus("notfound"));
  }, [leadId]);

  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />
      <main className="max-w-lg mx-auto px-4 sm:px-6 py-16 md:py-24">
        {status === "loading" && (
          <div className="flex items-center justify-center py-20"><Loader2 size={28} className="animate-spin text-[var(--color-primary-base)]" /></div>
        )}

        {status === "notfound" && (
          <div className="text-center rounded-[var(--radius-bento)] glass-panel p-10 border border-[var(--color-border-subtle)]">
            <AlertCircle size={28} className="mx-auto text-red-400" />
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en="We couldn't find this link. Please return to Local Lift and open your client portal.">No pudimos encontrar este enlace. Regresa a Local Lift y abre tu portal de cliente.</T></p>
          </div>
        )}

        {status === "notincluded" && (
          <div className="text-center rounded-[var(--radius-bento)] glass-panel p-10 border border-[var(--color-border-subtle)]">
            <ShieldCheck size={28} className="mx-auto text-[var(--color-primary-base)]" />
            <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-secondary)]"><T en="This guide is available for Rise clients. Boost includes prepared content for you to apply yourself.">Esta guía está disponible para clientes Ascenso. Impulso incluye el contenido preparado para que tú lo apliques.</T></p>
          </div>
        )}

        {status === "ready" && (
          <div className="rounded-[var(--radius-bento)] glass-panel p-8 border border-[var(--color-primary-base)]/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Local Lift · Rise">Local Lift · Ascenso</T></p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-[-0.03em]">
              <T en="Your implementation guide is ready">Tu acompañamiento empieza con una guía clara</T>
            </h1>
            {businessName && <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{businessName}</p>}

            <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <T en="Rise does not require you to connect your Google account to Polaris. We prepare the content, show you where each change goes and guide you step by step.">
                Ascenso no requiere que conectes tu cuenta de Google con Polaris. Preparamos el contenido, te mostramos dónde va cada cambio y te guiamos paso a paso.
              </T>
            </p>

            <div className="mt-6 space-y-3">
              {[
                ["Revisar", "Lee el paquete y la guía antes de aplicar cambios."],
                ["Acompañar", "Coordina tu sesión 1:1 para resolver dudas y avanzar con orden."],
                ["Revisar de nuevo", "Si necesitas ajustes al material, puedes solicitar hasta tres rondas agrupadas."],
              ].map(([title, text]) => (
                <div key={title} className="flex items-start gap-3 rounded-xl border border-[var(--color-border-subtle)] bg-[var(--color-surface-base)]/40 p-3 text-left">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--color-primary-base)]" />
                  <div><p className="text-xs font-black text-[var(--color-text-primary)]">{title}</p><p className="mt-0.5 text-xs leading-relaxed text-[var(--color-text-tertiary)]">{text}</p></div>
                </div>
              ))}
            </div>

            <p className="mt-6 flex items-start gap-1.5 text-[11px] leading-relaxed text-[var(--color-text-tertiary)]">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" />
              <T en="The current service works through instructions and accompaniment: you apply each approved change and Polaris guides you through the process.">
                El servicio actual funciona con instrucciones y acompañamiento: tú aplicas cada cambio aprobado y Polaris te guía durante el proceso.
              </T>
            </p>
          </div>
        )}

        <div className="mt-8 text-center"><Link to="/local-lift" className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-primary-base)]"><T en="Back to Local Lift">Volver a Local Lift</T></Link></div>
      </main>
      <Footer />
    </div>
  );
}
