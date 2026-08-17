import { X } from "lucide-react";

// Overlay simple de pantalla completa para ver una foto más grande -- usado
// por la ficha de negocio del panel admin de Local Lift y por las fotos
// reales de los candidatos en el diagnóstico público. Sin librería externa,
// solo un fixed + click para cerrar.
export default function ImageLightbox({ url, onClose }: { url: string; onClose: () => void }) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 p-4 cursor-zoom-out"
    >
      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 transition-colors"
      >
        <X size={20} />
      </button>
      <img
        src={url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-full rounded-lg object-contain cursor-default"
      />
    </div>
  );
}
