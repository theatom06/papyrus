"use client";

import { useEffect } from "react";

export default function RootPage() {
  useEffect(() => {
    const defaultView = localStorage.getItem("papyrus-default-view");
    if (defaultView === "archive") {
      window.location.replace("/archive");
    } else {
      window.location.replace("/home");
    }
  }, []);

  return null;
}
