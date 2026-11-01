import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Board details",
  description: "Edit an exam board and its associated subjects and resources.",
};

export default function AdminBoardLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
