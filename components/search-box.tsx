"use client";

import { Search, X } from "lucide-react";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  large?: boolean;
  onSubmit?: () => void;
  boardLabel?: string;
  onBoardClick?: () => void;
};

export function SearchBox({
  value,
  onChange,
  placeholder = "Search papers by subject, year, or title...",
  large = false,
  onSubmit,
  boardLabel,
  onBoardClick,
}: SearchBoxProps) {
  return (
    <div
      className={`flex w-full items-center gap-2.5 rounded-lg border border-border-main bg-linen px-3.5 shadow-xs transition focus-within:border-amber focus-within:ring-1 focus-within:ring-amber ${
        large ? "h-12 text-sm" : "h-10 text-xs"
      }`}
    >
      <span className="shrink-0 text-slate" aria-hidden="true">
        <Search size={large ? 18 : 15} />
      </span>

      <input
        className="min-w-0 flex-1 bg-transparent text-ink outline-none placeholder:text-slate"
        autoFocus={large}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && onSubmit) onSubmit();
        }}
        placeholder={placeholder}
      />

      {value && (
        <button
          className="grid size-6 shrink-0 place-items-center rounded text-slate hover:bg-sand hover:text-ink cursor-pointer"
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}

      {boardLabel && onBoardClick && (
        <button
          className="shrink-0 rounded bg-amber/10 px-2 py-0.5 text-[11px] font-semibold text-amber hover:bg-amber hover:text-white transition-colors cursor-pointer"
          type="button"
          onClick={onBoardClick}
          title="Filter by board"
        >
          {boardLabel}
        </button>
      )}

      {large && onSubmit && (
        <button
          className="shrink-0 rounded-md bg-amber px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-amber-dark transition-colors cursor-pointer"
          type="button"
          onClick={onSubmit}
          aria-label="Search archive"
        >
          Search
        </button>
      )}
    </div>
  );
}

export default SearchBox;
