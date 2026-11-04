"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Settings,
  Upload,
  House,
  LibraryBig,
  Pin,
} from "lucide-react";
import { useStorage } from "./storage";
import ThemeToggle from "./theme-toggle";

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { pins } = useStorage();

  const isActive = (path: string) => {
    if (path === "/home" && (pathname === "/" || pathname === "/home")) return true;
    if (path === "/archive" && (pathname.startsWith("/archive") || pathname.startsWith("/paper/"))) return true;
    if (path === "/pins" && pathname.startsWith("/pins")) return true;
    if (path === "/upload" && pathname.startsWith("/upload")) return true;
    if (path === "/settings" && pathname.startsWith("/settings")) return true;
    return pathname === path;
  };

  const navClass = (path: string) =>
    `flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
      isActive(path)
        ? "bg-amber/10 text-amber font-semibold"
        : "text-slate hover:text-ink hover:bg-border-main/40"
    }`;

  return (
    <div className="min-h-screen bg-sand text-ink flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border-main bg-sand/90 backdrop-blur-md px-4 sm:px-6">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4">
          <Link className="flex shrink-0 items-center gap-3" href="/home">
            <img
              src="/logo.svg"
              alt="Papyrus logo"
              className="size-8 rounded-md"
            />
            <span className="flex flex-col">
              <strong className="font-serif text-base font-bold leading-tight">
                Papyrus
              </strong>
              <small className="text-[10px] tracking-wide text-slate">
                Student Paper Archive
              </small>
            </span>
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <Link className={navClass("/home")} href="/home">
              <House size={15} />
              <span className="hidden sm:inline">Home</span>
            </Link>
            <Link className={navClass("/archive")} href="/archive">
              <LibraryBig size={15} />
              <span className="hidden sm:inline">Archive</span>
            </Link>
            <Link className={navClass("/pins")} href="/pins">
              <Pin size={15} />
              <span className="hidden sm:inline">Pins</span>
              {pins.length > 0 && (
                <span className="ml-1 rounded-full bg-amber/20 px-1.5 py-0.2 text-[10px] font-bold text-amber">
                  {pins.length}
                </span>
              )}
            </Link>
            <Link className={navClass("/upload")} href="/upload">
              <Upload size={15} />
              <span className="hidden sm:inline">Upload</span>
            </Link>
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link
              className={`grid size-8 place-items-center rounded-md border border-border-main bg-linen text-slate transition hover:border-amber hover:text-amber ${
                isActive("/settings") ? "border-amber text-amber" : ""
              }`}
              href="/settings"
              aria-label="Settings"
              title="Settings"
            >
              <Settings size={15} />
            </Link>
          </div>
        </div>
      </header>

      <div className="flex-1">
        {children}
      </div>

      <footer className="border-t border-border-main bg-linen/50 py-6 text-xs text-slate">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-4 sm:flex-row sm:px-6">
          <p>© {new Date().getFullYear()} Papyrus — Student-driven past exam paper archive.</p>
          <div className="flex items-center gap-4 text-xs">
            <Link href="/archive" className="hover:text-amber">Archive</Link>
            <Link href="/upload" className="hover:text-amber">Upload</Link>
            <Link href="/login" className="hover:text-amber">Admin</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Layout;
