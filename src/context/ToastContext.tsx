import React, { createContext, useContext, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, AlertCircle, Info, X } from "lucide-react";

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

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: React.ReactNode, type: ToastType = "success", duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  const success = useCallback(
    (message: React.ReactNode, duration?: number) => {
      toast(message, "success", duration);
    },
    [toast]
  );

  const error = useCallback(
    (message: React.ReactNode, duration?: number) => {
      toast(message, "error", duration);
    },
    [toast]
  );

  const info = useCallback(
    (message: React.ReactNode, duration?: number) => {
      toast(message, "info", duration);
    },
    [toast]
  );

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      
      {/* Toast Portal Container */}
      <div 
        id="toast-container"
        className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none px-4 sm:px-0"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 30, scale: 0.9, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 0.9, y: 15, transition: { duration: 0.2 } }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="pointer-events-auto w-full glass-panel rounded-xl border border-[var(--color-border-subtle)] p-4 shadow-xl flex items-start gap-3.5 relative overflow-hidden backdrop-blur-md bg-[var(--color-surface-base)]/80 bento-glow"
            >
              {/* Left accent line */}
              <div 
                className={`absolute left-0 top-0 bottom-0 w-1 ${
                  t.type === "success" 
                    ? "bg-emerald-500" 
                    : t.type === "error" 
                    ? "bg-red-500" 
                    : "bg-indigo-500"
                }`}
              />

              {/* Status Icon */}
              <div className="shrink-0 mt-0.5">
                {t.type === "success" && (
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                )}
                {t.type === "error" && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                {t.type === "info" && (
                  <Info className="w-5 h-5 text-indigo-500" />
                )}
              </div>

              {/* Content */}
              <div className="flex-1 text-sm font-medium text-[var(--color-text-primary)] pr-4 break-words leading-relaxed text-left">
                {t.message}
              </div>

              {/* Dismiss Button */}
              <button
                onClick={() => removeToast(t.id)}
                className="shrink-0 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--color-surface-highlight)]"
                aria-label="Cerrar"
                style={{ cursor: "pointer" }}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
