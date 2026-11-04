"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Moon, Sun, LogOut } from "lucide-react";
import AdminSidebar from "./admin-sidebar";
import Modal from "@/components/modal";
import { apiRequest } from "@/lib/api-client";
import { applyTheme, nextTheme, type Theme } from "@/util/theme";

export default function AdminShell({
  title,
  kicker = "PAPYRUS / ADMIN",
  active,
  actions,
  children,
  badges,
}: {
  title: string;
  kicker?: string;
  active: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  badges?: {
    reviewCount?: number;
    reportCount?: number;
    poorCount?: number;
  };
}) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [showSettings, setShowSettings] = useState(false);
  const [reviewCount, setReviewCount] = useState<number>(
    badges?.reviewCount ?? 0,
  );
  const [reportCount, setReportCount] = useState<number>(
    badges?.reportCount ?? 0,
  );
  const [poorCount, setPoorCount] = useState<number>(badges?.poorCount ?? 0);

  // Sync badge counts if passed from parent
  useEffect(() => {
    if (badges?.reviewCount !== undefined) setReviewCount(badges.reviewCount);
    if (badges?.reportCount !== undefined) setReportCount(badges.reportCount);
    if (badges?.poorCount !== undefined) setPoorCount(badges.poorCount);
  }, [badges?.reviewCount, badges?.reportCount, badges?.poorCount]);

  // Load badge counts if not provided
  useEffect(() => {
    if (badges?.reviewCount === undefined) {
      apiRequest<{ papers?: Array<{ status: string }> }>(
        "/api/papers?scope=admin",
      )
        .then((data) => {
          const revs = (data.papers || []).filter(
            (p) => p.status === "review",
          ).length;
          setReviewCount(revs);
        })
        .catch(() => {});
    }

    if (badges?.reportCount === undefined) {
      apiRequest<{ reports?: Array<{ status: string }> }>("/api/reports")
        .then((data) => {
          const repCount = (data.reports || []).filter(
            (r) => r.status === "pending",
          ).length;
          setReportCount(repCount);
        })
        .catch(() => {});
    }

    if (badges?.poorCount === undefined) {
      apiRequest<{ papers?: Array<unknown> }>("/api/papers/poor-performing")
        .then((data) => {
          setPoorCount((data.papers || []).length);
        })
        .catch(() => {});
    }
  }, [badges?.reviewCount, badges?.reportCount, badges?.poorCount]);

  // Theme synchronization
  useEffect(() => {
    const savedTheme =
      typeof window !== "undefined" &&
      (localStorage.getItem("papyrus-theme") === "light" ||
        localStorage.getItem("papyrus-theme") === "dark")
        ? (localStorage.getItem("papyrus-theme") as Theme)
        : "dark";
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  function handleThemeChange(target: Theme) {
    setTheme(target);
    applyTheme(target);
    localStorage.setItem("papyrus-theme", target);
  }

  function toggleDark() {
    handleThemeChange(nextTheme(theme));
  }

  async function logout() {
    try {
      await apiRequest("/api/auth/login", { method: "DELETE" });
    } catch {
      // ignore
    }
    window.location.assign("/login");
  }

  return (
    <div
      className={`flex min-h-screen bg-sand text-ink ${theme === "dark" ? "dark" : ""}`}
    >
      <AdminSidebar
        active={active}
        reviewCount={reviewCount}
        reportCount={reportCount}
        poorCount={poorCount}
        onSettings={() => setShowSettings(true)}
      />

      <main className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 flex min-h-[70px] items-center justify-between gap-5 border-b border-border-main bg-linen px-5 sm:px-[4.5vw]">
          <div>
            <span className="block font-mono text-[9px] uppercase tracking-[0.12em] text-slate">
              {kicker}
            </span>
            <h1 className="mt-1 font-[Georgia] text-2xl">{title}</h1>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <Link
              href="/"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-md border border-border-main px-3.5 py-2 text-xs text-ink transition hover:border-amber hover:text-amber"
            >
              <ExternalLink size={13} /> View Archive
            </Link>
            <button
              type="button"
              className="grid size-8 place-items-center rounded-md border border-border-main text-slate transition hover:border-amber hover:text-amber"
              onClick={toggleDark}
              aria-label="Toggle theme mode"
              title={
                theme === "light"
                  ? "Switch to dark mode"
                  : "Switch to light mode"
              }
            >
              {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
            </button>
          </div>
        </header>

        {children}
      </main>

      {showSettings && (
        <Modal
          title="Admin Settings"
          variant="settings"
          eyebrow="PAPYRUS / ADMIN"
          onClose={() => setShowSettings(false)}
        >
          <div className="grid gap-5">
            <div className="flex items-center justify-between gap-5 border-b border-border-main pb-5">
              <div>
                <strong className="block text-sm">Interface Theme</strong>
                <p className="mt-1 text-xs text-slate">
                  Select your visual presentation style for the admin studio.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs ${theme === "light" ? "border-amber text-amber" : "border-border-main text-slate"}`}
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  type="button"
                  className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs ${theme === "dark" ? "border-amber text-amber" : "border-border-main text-slate"}`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between gap-5">
              <div>
                <strong className="block text-sm">Account Session</strong>
                <p className="mt-1 text-xs text-slate">
                  Currently logged in as Administrator (Steve).
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-md border border-rose-600/30 px-3.5 py-2 text-xs text-rose-600 transition hover:bg-rose-500/10 dark:text-rose-400"
                onClick={logout}
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
