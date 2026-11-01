"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Moon,
  Settings,
  Sun,
  Upload,
  House,
  LibraryBig,
  Pin,
  Sparkle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStorage } from "./storage";
import { applyTheme, getStoredTheme, type Theme } from "@/util/theme";

export function SiteChrome() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<Theme>("light");
  const { pins } = useStorage();

  useEffect(() => {
    const saved = getStoredTheme();
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function cycleTheme() {
    const order: Theme[] = ["light", "dark", "true-black"];
    const nextIdx = (order.indexOf(theme) + 1) % order.length;
    const nextTheme = order[nextIdx];
    setTheme(nextTheme);
    applyTheme(nextTheme);
    localStorage.setItem("papyrus-theme", nextTheme);
  }

  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <img src="/logo.svg" alt="Papyrus logo" className="brand-logo" />
        <span>
          <strong>Papyrus</strong>
          <small>Built for the prep. Driven by students.</small>
        </span>
      </Link>
      <nav>
        <Link
          className={pathname === "/home" || pathname === "/" ? "active" : ""}
          href="/home"
        >
          <House size={14} />
          <span>Home</span>
        </Link>
        <Link
          className={
            pathname.startsWith("/archive") || pathname.startsWith("/paper/")
              ? "active"
              : ""
          }
          href="/archive"
        >
          <LibraryBig size={14} />
          <span>Archive</span>
        </Link>
        <Link
          className={pathname.startsWith("/pins") ? "active" : ""}
          href="/pins"
        >
          <Pin size={14} />
          <span>Pins</span>
          <b className="pin-count">{pins.length || ""}</b>
        </Link>
        <Link
          className={pathname.startsWith("/upload") ? "active" : ""}
          href="/upload"
        >
          <Upload size={14} />
          <span>Upload</span>
        </Link>
      </nav>
      <div className="theme-button-wrapper">
        <button
          className="theme-button"
          onClick={cycleTheme}
          aria-label={`Current theme: ${theme}. Click to switch theme.`}
          title={`Theme: ${theme.replace("-", " ")}`}
        >
          {theme === "light" ? (
            <Moon size={18} />
          ) : theme === "dark" ? (
            <Sun size={18} />
          ) : (
            <Sparkle size={18} />
          )}
        </button>
        <Link
          className={`settings-link ${pathname.startsWith("/settings") ? "active" : ""}`}
          href="/settings"
        >
          <Settings size={18} />
        </Link>
      </div>
    </header>
  );
}
