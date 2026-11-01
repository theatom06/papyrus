import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paper details",
  description: "View, study, and rate an exam paper from the Papyrus archive.",
};

export default function PaperLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
