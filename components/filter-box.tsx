"use client";

import { ChevronDown, SlidersHorizontal, X } from "lucide-react";

export function FilterBox({
  open,
  onToggle,
  activeFilters,
  onRemove,
  children,
}: {
  open: boolean;
  onToggle: () => void;
  activeFilters: Array<{ key: string; value: string }>;
  onRemove: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-3 rounded-lg border border-border-main bg-linen p-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold text-ink hover:bg-sand transition cursor-pointer"
          type="button"
          onClick={onToggle}
        >
          <SlidersHorizontal size={14} className="text-amber" />
          <span>Filters</span>
          <ChevronDown
            size={14}
            className={`text-slate transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          />
        </button>

        <div className="flex flex-wrap items-center gap-1.5">
          {activeFilters.length > 0 ? (
            activeFilters.map(({ key, value }) => (
              <button
                key={`${key}:${value}`}
                type="button"
                className="inline-flex items-center gap-1 rounded-full border border-amber/40 bg-amber/10 px-2.5 py-0.5 text-[11px] font-medium text-amber hover:bg-amber/20 transition cursor-pointer"
                onClick={() => onRemove(key)}
                title={`Remove filter: ${value}`}
              >
                <span>{value}</span>
                <X size={12} />
              </button>
            ))
          ) : (
            <span className="text-[11px] text-slate italic">
              No active filters
            </span>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 grid gap-3 border-t border-border-main/70 pt-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          {children}
        </div>
      )}
    </div>
  );
}

export default FilterBox;
