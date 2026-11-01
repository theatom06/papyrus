import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Papers",
  description: "Review and manage papers in the Papyrus archive.",
};

export default function AdminPapersLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
