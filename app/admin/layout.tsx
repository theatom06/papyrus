import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin Studio",
  description: "Manage the Papyrus archive and review community submissions.",
};

export default function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
