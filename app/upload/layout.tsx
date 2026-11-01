import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Upload",
  description: "Share an exam paper with the Papyrus student archive.",
};

export default function UploadLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
