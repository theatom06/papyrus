export type Theme = "light" | "dark" | "true-black";

const themes: Theme[] = ["light", "dark", "true-black"];

export function getStoredTheme(
  key = "papyrus-theme",
  fallback: Theme = "light",
): Theme {
  if (typeof window === "undefined") return fallback;
  const saved = localStorage.getItem(key);
  return saved && themes.includes(saved as Theme) ? (saved as Theme) : fallback;
}

export function applyTheme(target: Theme): void {
  const root = document.documentElement;
  root.classList.remove("dark", "true-black");

  if (target === "true-black") {
    root.classList.add("dark", "true-black");
  } else if (target === "dark") {
    root.classList.add("dark");
  }
}

export function nextTheme(current: Theme): Theme {
  return themes[(themes.indexOf(current) + 1) % themes.length];
}
