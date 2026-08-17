import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info";

export interface Toast {
  id: string;
  message: React.ReactNode;
  type: ToastType;
}

interface ToastContextType {
  toast: (message: React.ReactNode, type?: ToastType, duration?: number) => void;
  success: (message: React.ReactNode, duration?: number) => void;
  error: (message: React.ReactNode, duration?: number) => void;
  info: (message: React.ReactNode, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

function StatusIcon({ type }: { type: ToastType }) {
  const color = type === "success" ? "#10b981" : type === "error" ? "#ef4444" : "#6366f1";
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      {type === "success" && <><circle cx="12" cy="12" r="10" /><path d="m9 12 2 2 4-4" /></>}
      {type === "error" && <><circle cx="12" cy="12" r="10" /><path d="M12 8v4" /><path d="M12 16h.01" /></>}
      {type === "info" && <><circle cx="12" cy="12" r="10" /><path d="M12 16v-4" /><path d="M12 8h.01" /></>}
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </svg>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: React.ReactNode, type: ToastType = "success", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      window.setTimeout(() => removeToast(id), duration);
    },
    [removeToast]
  );

  const success = useCallback((message: React.ReactNode, duration?: number) => toast(message, "success", duration), [toast]);
  const error = useCallback((message: React.ReactNode, duration?: number) => toast(message, "error", duration), [toast]);
  const info = useCallback((message: React.ReactNode, duration?: number) => toast(message, "info", duration), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div id="toast-container" className="fixed top-20 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`toast-item toast-item-${t.type} pointer-events-auto w-full glass-panel rounded-xl border border-[var(--color-border-subtle)] p-4 shadow-xl flex items-start gap-3.5 relative overflow-hidden backdrop-blur-md bg-[var(--color-surface-base)]/80 bento-glow`}
          >
            <div className={`absolute left-0 top-0 bottom-0 w-1 toast-accent-${t.type}`} />
            <div className="shrink-0 mt-0.5"><StatusIcon type={t.type} /></div>
            <div className="flex-1 text-sm font-medium text-[var(--color-text-primary)] pr-4 break-words leading-relaxed text-left">{t.message}</div>
            <button
              onClick={() => removeToast(t.id)}
              className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--color-surface-highlight)]"
              aria-label="Cerrar"
            >
              <CloseIcon />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) throw new Error("useToast must be used within a ToastProvider");
  return context;
}
