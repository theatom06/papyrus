import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poor-performing papers",
  description: "Identify papers that need attention in the Papyrus archive.",
};

export default function AdminPoorPerformingLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
