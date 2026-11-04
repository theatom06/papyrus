"use client";

import { X } from "lucide-react";
import { useId } from "react";

export type ModalVariant = "default" | "form" | "settings" | "wide";

export function Modal({
  title,
  onClose,
  children,
  variant = "default",
  eyebrow,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  variant?: ModalVariant;
  eyebrow?: string;
}) {
  const titleId = useId();

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/60 backdrop-blur-xs p-4 sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className={`max-h-[90vh] w-full overflow-y-auto rounded-xl border border-border-main bg-linen p-5 text-ink shadow-2xl sm:p-6 ${
          variant === "wide" ? "max-w-3xl" : variant === "form" ? "max-w-xl" : "max-w-md"
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header className="mb-4 flex items-start justify-between gap-4 border-b border-border-main/70 pb-3">
          <div>
            {eyebrow && (
              <span className="block font-mono text-[10px] font-semibold uppercase tracking-wider text-amber">
                {eyebrow}
              </span>
            )}
            <h2 className="mt-0.5 font-serif text-lg font-bold text-ink" id={titleId}>
              {title}
            </h2>
          </div>
          <button
            className="grid size-7 place-items-center rounded-md border border-border-main text-slate hover:border-amber hover:text-amber cursor-pointer transition"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}

export default Modal;
