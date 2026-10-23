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
      className={`modal-backdrop modal-${variant}`}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
      >
        <header>
          <div>
            {eyebrow && <div className="eyebrow">{eyebrow}</div>}
            <h2 id={titleId}>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </header>
        {children}
      </section>
    </div>
  );
}
