import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { AlertCircle, Check, ExternalLink, Loader2, ShieldCheck } from "lucide-react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { T, useLanguage } from "../context/LanguageContext";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

// Página pública donde el CLIENTE REAL (dueño del negocio, no el admin de
// Polaris) conecta su propia cuenta de Google Business Profile para que
// Local Lift pueda publicar el contenido aprobado o responder reseñas en su
// nombre -- solo con su consentimiento explícito de OAuth, nunca con su
// contraseña. Mientras la app no esté verificada por Google, el propio
// Google va a mostrar una pantalla de advertencia ("app no verificada")
// antes del consentimiento -- normal en esta etapa, desaparece cuando
// termine la revisión.

export default function LocalLiftConnect() {
  const { leadId } = useParams<{ leadId: string }>();
  const [searchParams] = useSearchParams();
  const { language } = useLanguage();
  const gbpParam = searchParams.get("gbp");

  const [status, setStatus] = useState<"loading" | "ready" | "notfound">("loading");
  const [connected, setConnected] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState("");

  useDocumentTitle("Conectar Google Business Profile | Polaris", "Connect Google Business Profile | Polaris", "", "");

  const refreshStatus = () => {
    if (!leadId) return;
    Promise.all([
      fetch(`/api/gbp-oauth-callback?action=status&leadId=${leadId}`).then((r) => r.json()),
      fetch("/api/local-lift-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "lookup", leadId }),
      }).then((r) => r.json()),
    ])
      .then(([statusData, leadData]) => {
        if (!leadData.success) {
          setStatus("notfound");
          return;
        }
        setBusinessName(leadData.businessName);
        setConnected(!!statusData.connected);
        setStatus("ready");
      })
      .catch(() => setStatus("notfound"));
  };

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [leadId]);

  useEffect(() => {
    if (gbpParam === "denied") setError(language === "en" ? "You cancelled the Google authorization." : "Cancelaste la autorización de Google.");
    if (gbpParam === "error" || gbpParam === "invalid_state" || gbpParam === "not_configured") {
      setError(language === "en" ? "Something went wrong connecting your account. Please try again." : "Algo salió mal al conectar tu cuenta. Intenta de nuevo.");
    }
  }, [gbpParam, language]);

  const handleConnect = async () => {
    if (!leadId) return;
    setConnecting(true);
    setError("");
    try {
      const res = await fetch(`/api/gbp-oauth-callback?action=start&leadId=${leadId}`);
      const data = await res.json();
      if (!res.ok || !data.url) {
        setError(data.error || (language === "en" ? "Couldn't start the connection." : "No pudimos iniciar la conexión."));
        setConnecting(false);
        return;
      }
      window.location.href = data.url;
    } catch {
      setError(language === "en" ? "Something went wrong. Please try again." : "Algo salió mal. Intenta de nuevo.");
      setConnecting(false);
    }
  };

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
            <p className="mt-4 text-sm text-[var(--color-text-secondary)]"><T en="We couldn't find this link. Write us on WhatsApp and we'll help you directly.">No pudimos encontrar este enlace. Escríbenos por WhatsApp y te ayudamos directo.</T></p>
          </div>
        )}

        {status === "ready" && (
          <div className="rounded-[var(--radius-bento)] glass-panel p-8 border border-[var(--color-primary-base)]/20">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-[var(--color-primary-base)]"><T en="Local Lift">Local Lift</T></p>
            <h1 className="mt-2 text-2xl md:text-3xl font-display font-black tracking-[-0.03em]">
              <T en="Connect your Google Business Profile">Conecta tu Google Business Profile</T>
            </h1>
            {businessName && <p className="mt-1 text-sm text-[var(--color-text-tertiary)]">{businessName}</p>}

            <p className="mt-5 text-sm leading-relaxed text-[var(--color-text-secondary)]">
              <T en="This lets us publish content you've already approved — or reply to reviews on your behalf — directly on your real Google listing. We never see or ask for your Google password, and you can disconnect at any time.">
                Esto nos permite publicar contenido que ya aprobaste — o responder reseñas en tu nombre — directamente en tu ficha real de Google. Nunca vemos ni pedimos tu contraseña de Google, y puedes desconectar en cualquier momento.
              </T>
            </p>

            {connected ? (
              <div className="mt-7 flex items-center gap-2 text-emerald-500 text-sm font-black">
                <Check size={18} /> <T en="Connected. We'll only publish or reply to something after you approve it.">Conectado. Solo publicamos o respondemos algo después de que tú lo apruebes.</T>
              </div>
            ) : (
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--color-primary-base)] px-6 py-4 text-sm font-black text-white shadow-lg shadow-indigo-500/20 transition-transform hover:-translate-y-0.5 disabled:opacity-60"
              >
                {connecting ? <Loader2 size={18} className="animate-spin" /> : <ExternalLink size={18} />}
                <T en="Connect with Google">Conectar con Google</T>
              </button>
            )}

            {error && (
              <div className="mt-4 flex items-start gap-2 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2.5">
                <AlertCircle size={15} className="mt-0.5 shrink-0" /><span>{error}</span>
              </div>
            )}

            <p className="mt-6 flex items-start gap-1.5 text-[11px] text-[var(--color-text-tertiary)]">
              <ShieldCheck size={13} className="mt-0.5 shrink-0" />
              <T en="While Google finishes reviewing this app, you may see an 'app not verified' warning screen — that's normal at this stage, it doesn't mean anything is wrong.">
                Mientras Google termina de revisar esta app, es posible que veas una pantalla de advertencia de "app no verificada" — es normal en esta etapa, no significa que algo esté mal.
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
