import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Review queue",
  description: "Review papers waiting for approval in the Papyrus archive.",
};

export default function AdminReviewLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
