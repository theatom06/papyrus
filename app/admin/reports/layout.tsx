import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Reports",
  description: "Review reports submitted about Papyrus archive papers.",
};

export default function AdminReportsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
