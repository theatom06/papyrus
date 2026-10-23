import { X } from "lucide-react";

export function EmptyState({
  title = "Nothing in this drawer.",
  description = "Try a broader search or clear the filters.",
  actionLabel = "Clear search",
  onAction,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="empty">
      <h2>{title}</h2>
      <p>{description}</p>
      {onAction && (
        <button className="button button-soft" onClick={onAction}>
          <X size={14} /> {actionLabel}
        </button>
      )}
    </div>
  );
}
