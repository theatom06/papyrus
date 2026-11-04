export type Theme = "light" | "dark";

const themes: Theme[] = ["light", "dark"];

export function getTheme(): Theme {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("papyrus-theme");
  return saved && themes.includes(saved as Theme) ? (saved as Theme) : "light";
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.setAttribute("data-theme", theme);
  root.classList.toggle("dark", theme !== "light");
  localStorage.setItem("papyrus-theme", theme);
}

export function setCurrentTheme() {
  const theme = getTheme();
  setTheme(theme);
}

export function toggleTheme() {
  const currentTheme = getTheme();
  const nextTheme = currentTheme === "light" ? "dark" : "light";
  setTheme(nextTheme);
}

export const getStoredTheme = getTheme;
export const applyTheme = setTheme;

export function nextTheme(current: Theme): Theme {
  return current === "light" ? "dark" : "light";
}
