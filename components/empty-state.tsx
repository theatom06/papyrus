import { X } from "lucide-react";

export function EmptyState({
  title = "No papers found.",
  description = "Try adjusting your search terms or clearing some filters.",
  actionLabel = "Clear search",
  onAction,
  className = "",
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}) {
  return (
    <div
      className={`rounded-lg border border-dashed border-border-main bg-linen/50 px-6 py-12 text-center ${className}`}
    >
      <h2 className="font-serif text-lg font-bold text-ink">{title}</h2>
      <p className="mx-auto mt-1.5 max-w-md text-xs leading-relaxed text-slate">{description}</p>
      {onAction && (
        <button
          className="mt-4 inline-flex items-center gap-1.5 rounded-md border border-border-main bg-linen px-3.5 py-1.5 text-xs font-semibold text-ink shadow-xs hover:border-amber hover:text-amber transition-colors cursor-pointer"
          onClick={onAction}
        >
          <X size={13} /> {actionLabel}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
