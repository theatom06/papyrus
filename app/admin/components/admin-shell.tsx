"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ExternalLink, Moon, Sun, LogOut, Sparkles } from "lucide-react";
import { AdminSidebar } from "./admin-sidebar";
import { Modal } from "@/components/modal";
import { apiRequest } from "@/lib/api-client";
import {
  applyTheme,
  getStoredTheme,
  nextTheme,
  type Theme,
} from "@/util/theme";

export function AdminShell({
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
  const [theme, setTheme] = useState<Theme>("light");
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
    const savedTheme = getStoredTheme();
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
    <div className="admin-app">
      <AdminSidebar
        active={active}
        reviewCount={reviewCount}
        reportCount={reportCount}
        poorCount={poorCount}
        onSettings={() => setShowSettings(true)}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="mobile-kicker">{kicker}</span>
            <h1>{title}</h1>
          </div>
          <div className="top-actions">
            {actions}
            <Link
              href="/"
              target="_blank"
              className="button button-secondary"
              style={{ fontSize: 12, padding: "8px 14px" }}
            >
              <ExternalLink size={13} /> View Archive
            </Link>
            <button
              type="button"
              className="icon-button"
              onClick={toggleDark}
              aria-label="Toggle theme mode"
              title={
                theme === "light"
                  ? "Switch to dark mode"
                  : theme === "dark"
                    ? "Switch to true-black mode"
                    : "Switch to light mode"
              }
            >
              {theme === "light" ? (
                <Moon size={16} />
              ) : theme === "dark" ? (
                <Sun size={16} />
              ) : (
                <Sparkles size={16} />
              )}
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
          <div className="admin-quick-settings">
            <div className="setting-row">
              <div>
                <strong>Interface Theme</strong>
                <p>
                  Select your visual presentation style for the admin studio.
                </p>
              </div>
              <div className="theme-toggle-group">
                <button
                  type="button"
                  className={`theme-option-btn ${theme === "light" ? "active" : ""}`}
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  type="button"
                  className={`theme-option-btn ${theme === "dark" ? "active" : ""}`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon size={14} /> Dark
                </button>
                <button
                  type="button"
                  className={`theme-option-btn ${theme === "true-black" ? "active" : ""}`}
                  onClick={() => handleThemeChange("true-black")}
                >
                  True Black
                </button>
              </div>
            </div>

            <div className="setting-row">
              <div>
                <strong>Account Session</strong>
                <p>Currently logged in as Administrator (Steve).</p>
              </div>
              <button
                type="button"
                className="button button-danger"
                style={{ fontSize: 12, padding: "8px 14px" }}
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
