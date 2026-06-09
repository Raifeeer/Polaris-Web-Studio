import React from "react";

export default function WhatsAppButton() {
  return (
    <div className="fixed bottom-6 right-6 z-[100]">
      <style>{`
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0; }
          40% { transform: scale(1.4); opacity: 0.4; }
          80%, 100% { transform: scale(1); opacity: 0; }
        }
        .animate-pulse-ring {
          animation: pulse-ring 4s ease-in-out infinite;
        }
      `}</style>
      <a
        href="https://wa.me/18299200544?text=Hola%2C%20vi%20tu%20página%20y%20me%20gustaría%20planificar%20un%20nuevo%20proyecto"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] rounded-full flex items-center justify-center shadow-2xl text-white relative group transition-transform duration-300 hover:scale-110 hover:-translate-y-1 active:scale-95"
        aria-label="Contactar por WhatsApp"
      >
        {/* Ultra-smooth Breathing Pulse */}
        <div className="absolute inset-0 bg-[#25D366] rounded-full pointer-events-none animate-pulse-ring" />

        <svg
          viewBox="0 0 24 24"
          fill="currentColor"
          className="w-8 h-8 relative z-10"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
          <path d="M12 0C5.373 0 0 5.373 0 12c0 1.876.43 3.65 1.196 5.23L0 24l6.938-1.176A11.955 11.955 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.368l-.36-.214-3.732.633.646-3.637-.235-.374A9.818 9.818 0 0112 2.182c5.424 0 9.818 4.394 9.818 9.818s-4.394 9.818-9.818 9.818z" />
        </svg>
      </a>
    </div>
  );
}
