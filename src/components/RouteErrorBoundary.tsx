import { Component, type ReactNode } from "react";
import { T } from "../context/LanguageContext";

// Sin esto, un lazy import que falla (chunk viejo tras un deploy nuevo de
// Vercel mientras la pestaña seguía abierta, o un glitch de red) tira un
// error no capturado -- y como no había NINGÚN error boundary en todo el
// árbol, React desmonta todo hasta la raíz y deja la pantalla en negro
// hasta que el usuario refresca a mano. Caso real reportado por el usuario
// (19 de julio): justo al terminar de agendar la llamada (BookingScheduler
// -> onBooked -> navigate("/gracias")), que dispara la carga del chunk lazy
// de Gracias.tsx en ese momento.
const CHUNK_ERROR_PATTERN = /Failed to fetch dynamically imported module|Loading chunk|dynamically imported module/i;
const RELOAD_FLAG = "polaris_chunk_reload_attempted";

interface State {
  hasError: boolean;
  isChunkError: boolean;
}

interface Props {
  children: ReactNode;
}

export default class RouteErrorBoundary extends Component<Props, State> {
  props: Props;
  state: State = { hasError: false, isChunkError: false };

  constructor(props: Props) {
    super(props);
    this.props = props;
  }

  static getDerivedStateFromError(error: unknown): State {
    const message = error instanceof Error ? error.message : String(error);
    return { hasError: true, isChunkError: CHUNK_ERROR_PATTERN.test(message) };
  }

  componentDidCatch(error: unknown) {
    if (this.state.isChunkError) {
      // Un solo reintento automático -- si ya recargamos una vez en esta
      // sesión y el chunk sigue fallando, es un error real, no uno viejo:
      // se muestra el fallback en vez de recargar en loop.
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
        return;
      }
    }
    console.error("RouteErrorBoundary capturó un error:", error);
  }

  render() {
    if (this.state.hasError) {
      const alreadyReloaded = sessionStorage.getItem(RELOAD_FLAG);
      if (this.state.isChunkError && !alreadyReloaded) {
        // componentDidCatch ya disparó location.reload() -- no mostrar nada
        // mientras tanto, evita un parpadeo del fallback justo antes de recargar.
        return null;
      }
      return (
        <div className="min-h-dvh flex flex-col items-center justify-center gap-4 bg-[var(--color-surface-base)] text-[var(--color-text-primary)] px-6 text-center">
          <p className="text-lg font-bold">
            <T en="Something didn't load correctly.">Algo no cargó correctamente.</T>
          </p>
          <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
            <T en="Please reload the page to continue.">Por favor recarga la página para continuar.</T>
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 rounded-xl bg-[var(--color-primary-base)] text-white font-bold text-sm border-none cursor-pointer"
          >
            <T en="Reload">Recargar</T>
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
