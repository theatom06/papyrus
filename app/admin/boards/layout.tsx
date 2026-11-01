import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boards",
  description: "Manage exam boards and their archive structure.",
};

export default function AdminBoardsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
