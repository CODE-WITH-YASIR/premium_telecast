"use client";

import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

export type ToastType = "success" | "error" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  description?: string;
}

interface ToastContextValue {
  showToast: (message: string, options?: { type?: ToastType; description?: string; duration?: number }) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, options?: { type?: ToastType; description?: string; duration?: number }) => {
      const id = "toast_" + Math.random().toString(36).substring(2, 9);
      const type = options?.type ?? "success";
      const description = options?.description;
      const duration = options?.duration ?? 3500;

      const item: ToastItem = { id, type, message, description };
      setToasts((prev) => [...prev.slice(-3), item]); // keep maximum 4 toasts

      setTimeout(() => {
        removeToast(id);
      }, duration);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div
        aria-live="polite"
        className="pointer-events-none fixed bottom-5 right-5 z-50 flex max-w-sm flex-col gap-2.5 sm:bottom-6 sm:right-6"
      >
        {toasts.map((toast) => {
          const Icon =
            toast.type === "success"
              ? CheckCircle2
              : toast.type === "error"
              ? AlertCircle
              : Info;

          return (
            <div
              key={toast.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 animate-in fade-in slide-in-from-bottom-5",
                toast.type === "success" &&
                  "border-emerald-500/30 bg-emerald-950/40 text-emerald-100 shadow-emerald-950/50",
                toast.type === "error" &&
                  "border-rose-500/30 bg-rose-950/40 text-rose-100 shadow-rose-950/50",
                toast.type === "info" &&
                  "border-primary/30 bg-stone-900/80 text-white shadow-black/60"
              )}
            >
              <Icon
                className={cn(
                  "mt-0.5 h-5 w-5 shrink-0",
                  toast.type === "success" && "text-emerald-400",
                  toast.type === "error" && "text-rose-400",
                  toast.type === "info" && "text-primary"
                )}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold leading-tight">{toast.message}</p>
                {toast.description && (
                  <p className="mt-1 text-xs text-white/70">{toast.description}</p>
                )}
              </div>
              <button
                type="button"
                onClick={() => removeToast(toast.id)}
                className="shrink-0 text-white/50 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
