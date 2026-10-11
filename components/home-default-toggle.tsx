"use client";

import { useEffect, useState } from "react";

export function HomeDefaultToggle() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    setEnabled(document.cookie.includes("papyrus-default-view=archive"));
  }, []);
  function toggle() {
    const next = !enabled;
    document.cookie = `papyrus-default-view=${next ? "archive" : "home"}; path=/; max-age=31536000; SameSite=Lax`;
    setEnabled(next);
  }
  return (
    <button className="button button-ghost" type="button" onClick={toggle}>
      {enabled ? "Archive opens by default" : "Open archive by default"}
    </button>
  );
}
