"use client";

import Link from "next/link";
import { Moon, Pin, Search, Settings, Sun, Upload, X } from "lucide-react";
import { useEffect, useState } from "react";

export type Resource = {
  id: string;
  title: string;
  subject: string;
  year: string;
  board: string;
  classLevel: string;
  type: string;
  read: string;
  summary: string;
};

export type PinItem = { id: string; groupId: string; pinnedAt: number };
export type Group = { id: string; name: string };

const defaultGroups: Group[] = [
  { id: "study", name: "Study list" },
  { id: "exam", name: "Exam week" },
  { id: "review", name: "Review later" },
  { id: "example", name: "Example papers" },
];

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    return JSON.parse(
      localStorage.getItem(key) || JSON.stringify(fallback),
    ) as T;
  } catch {
    return fallback;
  }
}

export function useArchiveStorage() {
  const [pins, setPins] = useState<PinItem[]>([]);
  const [groups, setGroups] = useState<Group[]>(defaultGroups);
  useEffect(() => {
    const sync = () => {
      setPins(read("papyrus-pins", []));
      setGroups(read("papyrus-groups", defaultGroups));
    };
    sync();
    window.addEventListener("papyrus-storage", sync);
    return () => window.removeEventListener("papyrus-storage", sync);
  }, []);
  const save = (nextPins: PinItem[], nextGroups = groups) => {
    setPins(nextPins);
    setGroups(nextGroups);
    localStorage.setItem("papyrus-pins", JSON.stringify(nextPins));
    localStorage.setItem("papyrus-groups", JSON.stringify(nextGroups));
    window.dispatchEvent(new Event("papyrus-storage"));
  };
  return { pins, groups, save };
}

export function SiteChrome() {
  const [dark, setDark] = useState(false);
  const { pins } = useArchiveStorage();
  useEffect(() => {
    const isDark = localStorage.getItem("papyrus-theme") === "dark";
    setDark(isDark);
    document.documentElement.classList.toggle("dark", isDark);
  }, []);
  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("papyrus-theme", next ? "dark" : "light");
  }
  return (
    <header className="site-header">
      <Link className="brand" href="/">
        <span className="brand-mark">P</span>
        <span>
          <strong>Papyrus</strong>
          <small>Built for the prep. Driven by students.</small>
        </span>
      </Link>
      <nav>
        <Link href="/">
          ⌂<span>Home</span>
        </Link>
        <Link href="/archive">
          ▤<span>Archive</span>
        </Link>
        <Link href="/pins">
          <Pin size={14} />
          <span>Pins</span>
          <b className="pin-count">{pins.length || ""}</b>
        </Link>
        <Link href="/upload">
          <Upload size={14} />
          <span>Community upload</span>
        </Link>
        <Link href="/settings">
          <Settings size={14} />
          <span>Settings</span>
        </Link>
      </nav>
      <button
        className="theme-button"
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
      >
        {dark ? <Sun size={16} /> : <Moon size={16} />}
      </button>
    </header>
  );
}

export function ArchiveFooter() {
  return (
    <footer>
      <span>© 2026 Papyrus Archive</span>
      <span>Made for curious students, everywhere.</span>
    </footer>
  );
}

export function ArchiveLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteChrome />
      {children}
      <ArchiveFooter />
    </>
  );
}

export function ResourceCard({ resource }: { resource: Resource }) {
  const { pins, groups, save } = useArchiveStorage();
  const pinned = pins.find((item) => item.id === resource.id);
  const group = groups.find((item) => item.id === pinned?.groupId);
  function togglePin() {
    save(
      pinned
        ? pins.filter((item) => item.id !== resource.id)
        : [
            ...pins,
            {
              id: resource.id,
              groupId: groups[0]?.id || "study",
              pinnedAt: Date.now(),
            },
          ],
    );
  }
  return (
    <article
      className={`resource-card subject-${resource.subject.toLowerCase().replaceAll(" ", "-")}`}
      data-paper-id={resource.id}
    >
      <div className="paper-thumb">
        <span className="paper-year">{resource.year}</span>
        <span className="paper-lines" />
        <small>{resource.type}</small>
      </div>
      <div className="resource-info">
        <div className="resource-meta">
          <span>{resource.board}</span>
          <span>{resource.read} read</span>
        </div>
        <div className="card-subject-row">
          <span className="subject-chip">{resource.subject}</span>
          <span className="resource-type">{resource.type}</span>
        </div>
        <h3>{resource.title}</h3>
        <p>{resource.summary}</p>
        <div className="resource-footer">
          <Link className="text-link" href={`/paper/${resource.id}`}>
            View paper →
          </Link>
          <button
            type="button"
            className={`pin-main ${pinned ? "pinned" : ""}`}
            onClick={togglePin}
            aria-pressed={Boolean(pinned)}
          >
            <Pin size={13} /> {pinned ? group?.name || "Pinned" : "Pin paper"}
          </button>
        </div>
      </div>
    </article>
  );
}

export function EmptyState({ onClear }: { onClear?: () => void }) {
  return (
    <div className="empty">
      <h2>Nothing in this drawer.</h2>
      <p>Try a broader search or clear the filters.</p>
      {onClear && (
        <button className="button button-soft" onClick={onClear}>
          <X size={14} /> Clear search
        </button>
      )}
    </div>
  );
}
