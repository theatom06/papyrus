import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pins",
  description: "Keep your saved papers organized for your next study session.",
};

export default function PinsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
