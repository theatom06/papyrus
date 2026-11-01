import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your Papyrus preferences and display settings.",
};

export default function SettingsLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
