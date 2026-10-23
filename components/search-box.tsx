"use client";

import { Search, X } from "lucide-react";

type SearchBoxProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  onSubmit?: () => void;
  large?: boolean;
  boardLabel?: string;
  onBoardClick?: () => void;
};

export function SearchBox({
  value,
  onChange,
  placeholder,
  onSubmit,
  large = false,
  boardLabel,
  onBoardClick,
}: SearchBoxProps) {
  return (
    <div className={`search-box${large ? " search-box-large" : ""}`}>
      <span className="search-lead-icon" aria-hidden="true">
        <Search size={large ? 18 : 15} />
      </span>
      <input
        className="search-input"
        autoFocus={large}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") onSubmit?.();
        }}
        placeholder={placeholder}
      />
      {value && (
        <button
          className="search-clear-btn"
          type="button"
          onClick={() => onChange("")}
          aria-label="Clear search"
        >
          <X size={15} />
        </button>
      )}
      {boardLabel && onBoardClick && (
        <button
          className="search-board-pill"
          type="button"
          onClick={onBoardClick}
          title="Filter by board"
        >
          <span>{boardLabel}</span>
        </button>
      )}
      {large && onSubmit && (
        <button
          className="search-submit"
          type="button"
          onClick={onSubmit}
          aria-label="Search archive"
        >
          <Search size={16} />
        </button>
      )}
    </div>
  );
}
