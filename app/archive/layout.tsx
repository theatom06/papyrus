import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Archive",
  description: "Search and browse authentic exam papers shared by students.",
};

export default function ArchiveLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
