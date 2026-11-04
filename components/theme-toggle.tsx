"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { getTheme, toggleTheme, type Theme } from "@/util/theme";

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    setTheme(getTheme());
  }, []);

  function handleToggle() {
    toggleTheme();
    setTheme(getTheme());
  }

  return (
    <button
      type="button"
      className="grid size-8 place-items-center rounded-md border border-border-main bg-linen text-slate transition hover:border-amber hover:text-amber"
      onClick={handleToggle}
      aria-label={`Current theme: ${theme}. Click to switch theme.`}
      title={`Switch theme (currently ${theme})`}
    >
      {theme === "light" ? <Moon size={15} /> : <Sun size={15} />}
    </button>
  );
}
