"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { ArchiveLayout } from "@/components/archive-ui";
import { HomeDefaultToggle } from "@/components/home-default-toggle";

export default function SettingsPage() {
  const [dark, setDark] = useState(false);
  useEffect(
    () => setDark(localStorage.getItem("papyrus-theme") === "dark"),
    [],
  );
  function setTheme(value: boolean) {
    setDark(value);
    document.documentElement.classList.toggle("dark", value);
    localStorage.setItem("papyrus-theme", value ? "dark" : "light");
  }
  return (
    <ArchiveLayout>
      <main className="settings">
        <p className="kicker">PAPYRUS PREFERENCES</p>
        <h1>
          Make it
          <br />
          <em>yours.</em>
        </h1>
        <p className="lead">Small controls for a calmer study space.</p>
        <section className="settings-card">
          <h2>Appearance</h2>
          <div className="setting">
            <div>
              <strong>Colour mode</strong>
              <p>Choose the atmosphere for your archive.</p>
            </div>
            <div className="mode-buttons">
              <button
                className={dark ? "" : "active"}
                onClick={() => setTheme(false)}
              >
                <Sun size={14} /> Light
              </button>
              <button
                className={dark ? "active" : ""}
                onClick={() => setTheme(true)}
              >
                <Moon size={14} /> Dark
              </button>
            </div>
          </div>
        </section>
        <section className="settings-card">
          <h2>Start page</h2>
          <div className="setting">
            <div>
              <strong>Default page</strong>
              <p>Choose whether Papyrus opens on the homepage or archive.</p>
            </div>
            <HomeDefaultToggle />
          </div>
        </section>
        <section className="settings-card">
          <h2>About Papyrus</h2>
          <div className="setting">
            <strong>Version</strong>
            <span>0.3 / Archive edition</span>
          </div>
          <div className="setting">
            <strong>Storage</strong>
            <span>Local to this browser</span>
          </div>
        </section>
      </main>
    </ArchiveLayout>
  );
}
