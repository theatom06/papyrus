import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Admin login",
  description: "Sign in to manage the Papyrus archive.",
};

export default function LoginLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return children;
}
