"use client";

import { useEffect, useState } from "react";
import { Moon, Sun, GraduationCap } from "lucide-react";
import Layout from "@/components/layout";
import PageHeading from "@/components/page-heading";
import SettingsCard from "./components/settings-card";
import { useToast } from "@/components/toast";
import { apiRequest } from "@/lib/api-client";
import { applyTheme, getStoredTheme, type Theme } from "@/util/theme";

type BoardOption = {
  id: number;
  name: string;
  code: string;
};

export function SettingsPage() {
  const { showToast } = useToast();
  const [theme, setThemeState] = useState<Theme>("light");
  const [defaultView, setDefaultView] = useState("home");
  const [defaultBoard, setDefaultBoard] = useState("");
  const [boards, setBoards] = useState<BoardOption[]>([]);

  useEffect(() => {
    const savedTheme = getStoredTheme();
    setThemeState(savedTheme);
    applyTheme(savedTheme);

    const savedView = localStorage.getItem("papyrus-default-view") || "home";
    setDefaultView(savedView);

    const savedBoard = localStorage.getItem("papyrus-default-board") || "";
    setDefaultBoard(savedBoard);

    apiRequest<{ boards?: BoardOption[] }>("/api/boards")
      .then((data) => {
        if (data.boards && data.boards.length > 0) {
          setBoards(data.boards);
        }

      })
      .catch(() => {
        setBoards([
          { id: 1, name: "Central Board of Secondary Education", code: "CBSE" },
          {
            id: 2,
            name: "Indian Certificate of Secondary Education",
            code: "ICSE",
          },
          { id: 3, name: "State Board", code: "PU" },
        ]);
      });
  }, []);

  function handleThemeChange(val: Theme) {
    setThemeState(val);
    applyTheme(val);
    localStorage.setItem("papyrus-theme", val);
    showToast(
      `Theme updated to ${val.charAt(0).toUpperCase() + val.slice(1)}`,
      "success",
    );
  }

  function handleDefaultViewChange(view: string) {
    setDefaultView(view);
    localStorage.setItem("papyrus-default-view", view);
    showToast(
      `Start page set to ${view === "home" ? "Homepage" : "Archive"}`,
      "success",
    );
  }

  function handleDefaultBoardChange(boardCode: string) {
    setDefaultBoard(boardCode);
    if (boardCode) {
      localStorage.setItem("papyrus-default-board", boardCode);
      showToast(`Default curriculum board set to ${boardCode}`, "success");
    } else {
      localStorage.removeItem("papyrus-default-board");
      showToast("Default board cleared — showing all boards", "info");
    }
  }

  return (
    <Layout>
      <main className="min-h-screen bg-sand text-ink">
        <section className="mx-auto w-full max-w-3xl px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
          <PageHeading
            className="!mx-0 !max-w-none !px-0 !pb-8 !pt-0"
            kicker="PAPYRUS PREFERENCES"
            title="Make it"
            star="yours."
            description="Small controls for a calmer study space."
          />

          <SettingsCard
            className="mb-4! rounded-lg! border-border-main! bg-linen! p-4! shadow-none!"
            title="Appearance"
          >
            <div className="flex flex-wrap items-center justify-between gap-5 border-t border-border-main pt-4">
              <div>
                <strong className="block text-sm">Colour mode</strong>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate">
                  Choose between light parchment or dark study room.
                </p>
              </div>
              <div className="flex shrink-0 overflow-hidden rounded-md border border-border-main">
                <button
                  type="button"
                  className={`flex items-center gap-1 px-2.5 py-2 text-xs ${theme === "light" ? "bg-amber/10 text-ink" : "text-slate"}`}
                  onClick={() => handleThemeChange("light")}
                >
                  <Sun size={14} /> Light
                </button>
                <button
                  type="button"
                  className={`flex items-center gap-1 border-l border-border-main px-2.5 py-2 text-xs ${theme === "dark" ? "bg-amber/10 text-ink" : "text-slate"}`}
                  onClick={() => handleThemeChange("dark")}
                >
                  <Moon size={14} /> Dark
                </button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            className="mb-4! rounded-lg! border-border-main! bg-linen! p-4! shadow-none!"
            title="Curriculum Preferences"
          >
            <div className="flex items-center justify-between gap-5 border-t border-border-main pt-4">
              <div>
                <strong className="block text-sm">
                  Default curriculum board
                </strong>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate">
                  Automatically filter the archive to your chosen board when you
                  open the archive page.
                </p>
              </div>
              <div className="flex max-w-xs flex-wrap justify-end gap-1">
                <button
                  type="button"
                  className={`rounded border border-border-main px-2.5 py-2 text-xs ${defaultBoard === "" ? "bg-amber/10 text-ink" : "text-slate"}`}
                  onClick={() => handleDefaultBoardChange("")}
                >
                  All boards
                </button>
                {boards.map((b) => (
                  <button
                    key={b.code}
                    type="button"
                    className={`rounded border border-border-main px-2.5 py-2 text-xs ${defaultBoard === b.code ? "bg-amber/10 text-ink" : "text-slate"}`}
                    onClick={() => handleDefaultBoardChange(b.code)}
                    title={b.name}
                  >
                    <GraduationCap size={13} /> {b.code}
                  </button>
                ))}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            className="mb-4! rounded-lg! border-border-main! bg-linen! p-4! shadow-none!"
            title="Start page"
          >
            <div className="flex flex-wrap items-center justify-between gap-5 border-t border-border-main pt-4">
              <div>
                <strong className="block text-sm">Default page</strong>
                <p className="mt-1 max-w-xs text-xs leading-5 text-slate">
                  Choose whether Papyrus opens on the homepage or the archive
                  when you visit the site.
                </p>
              </div>
              <div className="flex overflow-hidden rounded-md border border-border-main">
                <button
                  type="button"
                  className={`px-3 py-2 text-xs ${defaultView === "home" ? "bg-amber/10 text-ink" : "text-slate"}`}
                  onClick={() => handleDefaultViewChange("home")}
                >
                  Home
                </button>
                <button
                  type="button"
                  className={`border-l border-border-main px-3 py-2 text-xs ${defaultView === "archive" ? "bg-amber/10 text-ink" : "text-slate"}`}
                  onClick={() => handleDefaultViewChange("archive")}
                >
                  Archive
                </button>
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            className="mb-4! rounded-lg! border-border-main! bg-linen! p-4! shadow-none!"
            title="About Papyrus"
          >
            <div className="flex justify-between border-t border-border-main pt-4 text-sm">
              <strong>Version</strong>
              <span className="text-slate">1.0.0 / Archive edition</span>
            </div>
            <div className="mt-5 flex justify-between text-sm">
              <strong>Storage</strong>
              <span className="text-slate">Local to this browser</span>
            </div>
          </SettingsCard>
        </section>
      </main>
    </Layout>
  );
}

export default SettingsPage;
