import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Papyrus — Exam practice made less stressful",
  description: "A calm archive for papers, boards, and better preparation.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
