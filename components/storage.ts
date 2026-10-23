"use client";

import { useEffect, useState } from "react";

export type PinItem = { id: string; groupId: string; pinnedAt: number };
export type Group = { id: string; name: string };

export const defaultGroups: Group[] = [
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

export function useStorage() {
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
