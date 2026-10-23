"use client";

import { ChevronDown, X } from "lucide-react";

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
    <div className={`filter-panel ${open ? "is-open" : ""}`}>
      <button className="filter-panel-toggle" type="button" onClick={onToggle}>
        <ChevronDown size={15} /> <span>Filters</span>
      </button>
      <div className="active-filter-pills">
        {activeFilters.length ? (
          activeFilters.map(({ key, value }) => (
            <button
              key={`${key}:${value}`}
              type="button"
              className="active-filter-pill"
              onClick={() => onRemove(key)}
            >
              {value}
              <X size={11} />
            </button>
          ))
        ) : (
          <span className="active-filter-pill muted">All filters</span>
        )}
      </div>
      {open && <div className="filter-menu">{children}</div>}
    </div>
  );
}
