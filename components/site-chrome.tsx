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
  Sparkle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStorage } from "./storage";

export function SiteChrome() {
  const pathname = usePathname();
  const [theme, setTheme] = useState<"light" | "dark" | "true-black">("light");
  const { pins } = useStorage();

  useEffect(() => {
    const saved =
      (localStorage.getItem("papyrus-theme") as
        "light" | "dark" | "true-black") || "light";
    setTheme(saved);
    applyTheme(saved);
  }, []);

  function applyTheme(target: "light" | "dark" | "true-black") {
    const root = document.documentElement;
    if (target === "true-black") {
      root.classList.add("dark", "true-black");
    } else if (target === "dark") {
      root.classList.add("dark");
      root.classList.remove("true-black");
    } else {
      root.classList.remove("dark", "true-black");
    }
  }

  function cycleTheme() {
    const order: Array<"light" | "dark" | "true-black"> = [
      "light",
      "dark",
      "true-black",
    ];
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
          <Sparkle size={14} />
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
