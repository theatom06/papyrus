"use client";

import "./style.css";

import { useEffect, useState } from "react";
import { Moon, Sun, Sparkles, GraduationCap } from "lucide-react";
import { Layout } from "@/components/layout";
import { PageHeading } from "@/components/page-heading";
import { PageTitle } from "@/components/page-title";
import { SettingsCard } from "./components/settings-card";
import { useToast } from "@/components/toast";
import { apiRequest } from "@/lib/api-client";

type BoardOption = {
  id: number;
  name: string;
  code: string;
};

export default function SettingsPage() {
  const { showToast } = useToast();
  const [theme, setThemeState] = useState<"light" | "dark" | "true-black">(
    "light",
  );
  const [defaultView, setDefaultView] = useState("home");
  const [defaultBoard, setDefaultBoard] = useState("");
  const [boards, setBoards] = useState<BoardOption[]>([]);

  useEffect(() => {
    const savedTheme =
      (localStorage.getItem("papyrus-theme") as
        "light" | "dark" | "true-black") || "light";
    setThemeState(savedTheme);
    applyThemeClass(savedTheme);

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

  function applyThemeClass(val: "light" | "dark" | "true-black") {
    const root = document.documentElement;
    if (val === "true-black") {
      root.classList.add("dark", "true-black");
    } else if (val === "dark") {
      root.classList.add("dark");
      root.classList.remove("true-black");
    } else {
      root.classList.remove("dark", "true-black");
    }
  }

  function handleThemeChange(val: "light" | "dark" | "true-black") {
    setThemeState(val);
    applyThemeClass(val);
    localStorage.setItem("papyrus-theme", val);
    showToast(
      `Theme updated to ${
        val === "true-black"
          ? "True Black"
          : val.charAt(0).toUpperCase() + val.slice(1)
      }`,
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
      <PageTitle title="Settings" />
      <main className="settings">
        <PageHeading
          kicker="PAPYRUS PREFERENCES"
          title={
            <>
              Make it
              <br />
              <em>yours.</em>
            </>
          }
          description="Small controls for a calmer study space."
        />

        <SettingsCard title="Appearance">
          <div className="setting">
            <div>
              <strong>Colour mode</strong>
              <p>
                Choose between light parchment, dark study room, or pure OLED
                black.
              </p>
            </div>
            <div className="mode-buttons">
              <button
                type="button"
                className={theme === "light" ? "active" : ""}
                onClick={() => handleThemeChange("light")}
              >
                <Sun size={14} /> Light
              </button>
              <button
                type="button"
                className={theme === "dark" ? "active" : ""}
                onClick={() => handleThemeChange("dark")}
              >
                <Moon size={14} /> Dark
              </button>
              <button
                type="button"
                className={theme === "true-black" ? "active" : ""}
                onClick={() => handleThemeChange("true-black")}
              >
                <Sparkles size={14} /> True Black
              </button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Curriculum Preferences">
          <div className="setting">
            <div>
              <strong>Default curriculum board</strong>
              <p>
                Automatically filter the archive to your chosen board when you
                open the archive page.
              </p>
            </div>
            <div className="mode-buttons" style={{ flexWrap: "wrap" }}>
              <button
                type="button"
                className={defaultBoard === "" ? "active" : ""}
                onClick={() => handleDefaultBoardChange("")}
              >
                All boards
              </button>
              {boards.map((b) => (
                <button
                  key={b.code}
                  type="button"
                  className={defaultBoard === b.code ? "active" : ""}
                  onClick={() => handleDefaultBoardChange(b.code)}
                  title={b.name}
                >
                  <GraduationCap size={13} /> {b.code}
                </button>
              ))}
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="Start page">
          <div className="setting">
            <div>
              <strong>Default page</strong>
              <p>
                Choose whether Papyrus opens on the homepage or the archive when
                you visit the site.
              </p>
            </div>
            <div className="mode-buttons">
              <button
                type="button"
                className={defaultView === "home" ? "active" : ""}
                onClick={() => handleDefaultViewChange("home")}
              >
                Home
              </button>
              <button
                type="button"
                className={defaultView === "archive" ? "active" : ""}
                onClick={() => handleDefaultViewChange("archive")}
              >
                Archive
              </button>
            </div>
          </div>
        </SettingsCard>

        <SettingsCard title="About Papyrus">
          <div className="setting">
            <strong>Version</strong>
            <span>1.0.0 / Archive edition</span>
          </div>
          <div className="setting">
            <strong>Storage</strong>
            <span>Local to this browser</span>
          </div>
        </SettingsCard>
      </main>
    </Layout>
  );
}
