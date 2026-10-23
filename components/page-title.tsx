"use client";

import { useEffect } from "react";

export function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} | Papyrus`;
  }, [title]);
  return null;
}
