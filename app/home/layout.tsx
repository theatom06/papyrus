import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Home",
  description: "Explore Papyrus, a student-powered archive of exam papers.",
};

export default function HomeLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
