import { ArrowLeft, ShieldCheck } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T } from "../context/LanguageContext";
import LocalLiftPolicyContent from "../components/LocalLiftPolicyContent";

const LAST_UPDATED = "20 de agosto de 2026";

export default function LocalLiftPolicies() {
  return (
    <div className="min-h-screen bg-[var(--color-surface-base)] text-[var(--color-text-primary)]">
      <Navbar />
      <main className="mx-auto max-w-4xl px-5 pb-20 pt-32 sm:px-8">
        <Link to="/local-lift" className="mb-8 inline-flex items-center gap-2 text-xs font-bold text-[var(--color-text-secondary)] transition-colors hover:text-[#16C8C1]">
          <ArrowLeft size={14} />
          <T en="Back to Local Lift">Volver a Local Lift</T>
        </Link>

        <header className="mb-14 max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#16C8C1]/25 bg-[#16C8C1]/[0.08] px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-[#16C8C1]">
            <ShieldCheck size={13} />
            <T en="Local Lift policies">Políticas Local Lift</T>
          </div>
          <h1 className="mt-5 font-display text-4xl font-black tracking-tight text-[var(--color-text-primary)] md:text-6xl">
            <T en="Clear scope. Guided implementation. Defined support.">Alcance claro. Implementación guiada. Soporte definido.</T>
          </h1>
          <p className="mt-5 text-base leading-relaxed text-[var(--color-text-secondary)] md:text-lg">
            <T en="These policies explain what each Local Lift package includes, how reviews work, and where the service ends. Acceptance happens during checkout before payment.">
              Estas políticas explican qué incluye cada paquete Local Lift, cómo funcionan las revisiones y dónde termina el servicio. La aceptación se realiza durante el checkout antes del pago.
            </T>
          </p>
          <p className="mt-4 text-xs text-[var(--color-text-tertiary)]">Última actualización: {LAST_UPDATED}</p>
        </header>

        <LocalLiftPolicyContent />
      </main>
      <Footer />
    </div>
  );
}
