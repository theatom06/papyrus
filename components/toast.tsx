"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  Info,
  AlertTriangle,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "info" | "warning";

export type ToastItem = {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
};

type ToastContextType = {
  toasts: ToastItem[];
  addToast: (
    messageOrOptions:
      | string
      | {
          message: string;
          title?: string;
          type?: ToastType;
          duration?: number;
        },
    type?: ToastType,
  ) => void;
  removeToast: (id: string) => void;
};

const ToastContext = createContext<ToastContextType | null>(null);

let globalAddToast:
  | ((options: {
      message: string;
      title?: string;
      type?: ToastType;
      duration?: number;
    }) => void)
  | null = null;

export const toast = {
  success(message: string, title?: string) {
    if (globalAddToast) globalAddToast({ message, title, type: "success" });
  },
  error(message: string, title?: string) {
    if (globalAddToast) globalAddToast({ message, title, type: "error" });
  },
  info(message: string, title?: string) {
    if (globalAddToast) globalAddToast({ message, title, type: "info" });
  },
  warning(message: string, title?: string) {
    if (globalAddToast) globalAddToast({ message, title, type: "warning" });
  },
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((current) => current.filter((item) => item.id !== id));
  }, []);

  const addToast = useCallback(
    (
      messageOrOptions:
        | string
        | {
            message: string;
            title?: string;
            type?: ToastType;
            duration?: number;
          },
      explicitType: ToastType = "info",
    ) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      const options =
        typeof messageOrOptions === "string"
          ? { message: messageOrOptions, type: explicitType, duration: 4000 }
          : {
              message: messageOrOptions.message,
              title: messageOrOptions.title,
              type: messageOrOptions.type || explicitType,
              duration: messageOrOptions.duration ?? 4000,
            };

      setToasts((current) => [...current, { id, ...options }]);

      if (options.duration && options.duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, options.duration);
      }
    },
    [removeToast],
  );

  useEffect(() => {
    globalAddToast = addToast;
    return () => {
      globalAddToast = null;
    };
  }, [addToast]);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} onDismiss={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      addToast: (msg: string, type?: ToastType) => {
        if (type === "success") toast.success(msg);
        else if (type === "error") toast.error(msg);
        else if (type === "warning") toast.warning(msg);
        else toast.info(msg);
      },
      showToast: (msg: string, type?: ToastType) => {
        if (type === "success") toast.success(msg);
        else if (type === "error") toast.error(msg);
        else if (type === "warning") toast.warning(msg);
        else toast.info(msg);
      },
      removeToast: () => {},
    };
  }
  return {
    ...ctx,
    showToast: ctx.addToast,
  };
}

function ToastContainer({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((item) => (
        <div key={item.id} className={`toast toast-${item.type}`} role="alert">
          <span className="toast-icon">
            {item.type === "success" && <CheckCircle2 size={18} />}
            {item.type === "error" && <AlertCircle size={18} />}
            {item.type === "warning" && <AlertTriangle size={18} />}
            {item.type === "info" && <Info size={18} />}
          </span>
          <div className="toast-content">
            {item.title && (
              <strong className="toast-title">{item.title}</strong>
            )}
            <span className="toast-message">{item.message}</span>
          </div>
          <button
            type="button"
            className="toast-close"
            onClick={() => onDismiss(item.id)}
            aria-label="Dismiss notification"
          >
            <X size={15} />
          </button>
        </div>
      ))}
    </div>
  );
}
