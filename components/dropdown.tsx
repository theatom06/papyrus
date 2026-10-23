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
    <div className={`dropdown ${className}`} ref={ref}>
      {label && <span className="dropdown-label">{label}</span>}
      {name && (
        <input type="hidden" name={name} value={value} required={required} />
      )}
      <button
        type="button"
        className={`dropdown-trigger ${!selected ? "placeholder" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{selected?.label || placeholder}</span>
        <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <div className="dropdown-menu" role="listbox">
          {options.map((option) => (
            <button
              type="button"
              role="option"
              aria-selected={option.value === value}
              className={option.value === value ? "selected" : ""}
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setOpen(false);
              }}
            >
              <span>{option.label}</span>
              {option.meta && <small>{option.meta}</small>}
              {option.value === value && <Check size={14} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
