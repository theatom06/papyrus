"use client";

import { Check, ChevronDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export type DropdownOption = { value: string; label: string; meta?: string };

export function Dropdown({
  value,
  options,
  placeholder = "Choose an option",
  onChange,
  name,
  label,
  required = false,
  className = "",
}: {
  value: string;
  options: DropdownOption[];
  placeholder?: string;
  onChange: (value: string) => void;
  name?: string;
  label?: string;
  required?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    function close(event: MouseEvent) {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className={`relative ${className}`} ref={ref}>
      {label && (
        <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate">
          {label}
        </span>
      )}
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}
      <button
        type="button"
        className={`flex h-10 w-full items-center justify-between gap-2 rounded-md border border-border-main bg-linen px-3 text-left text-xs font-medium text-ink shadow-xs transition hover:border-amber cursor-pointer focus:outline-none focus:ring-1 focus:ring-amber ${
          !selected ? "text-slate" : ""
        }`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span className="truncate">{selected?.label || placeholder}</span>
        <ChevronDown size={14} className="shrink-0 text-slate" aria-hidden="true" />
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 top-full z-40 mt-1 max-h-60 overflow-y-auto rounded-md border border-border-main bg-linen p-1 shadow-lg"
          role="listbox"
        >
          {options.length === 0 ? (
            <div className="p-2 text-center text-xs text-slate">No options available</div>
          ) : (
            options.map((option) => {
              const isSelected = option.value === value;
              return (
                <button
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  className={`flex w-full items-center justify-between gap-2 rounded px-2.5 py-2 text-left text-xs transition cursor-pointer ${
                    isSelected
                      ? "bg-amber/10 font-semibold text-amber"
                      : "text-ink hover:bg-sand"
                  }`}
                  key={option.value}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                >
                  <span className="truncate">{option.label}</span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    {option.meta && (
                      <span className="font-mono text-[10px] text-slate">{option.meta}</span>
                    )}
                    {isSelected && <Check size={14} className="text-amber" />}
                  </div>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

export default Dropdown;
