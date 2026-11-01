import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Paper review",
  description: "Review and edit a paper submitted to the Papyrus archive.",
};

export default function AdminPaperLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
