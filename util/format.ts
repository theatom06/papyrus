export function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "PDF document";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatDate(
  isoString?: string,
  options: Intl.DateTimeFormatOptions = { month: "short", year: "numeric" },
): string {
  if (!isoString) return "Recent";
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return "Recent";
    return date.toLocaleDateString("en-US", options);
  } catch {
    return "Recent";
  }
}
