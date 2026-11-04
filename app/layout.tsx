import "./global.css";
import type { Metadata } from "next";
import { ToastProvider } from "@/components/toast";

export const metadata: Metadata = {
  title: {
    default: "Home | Papyrus",
    template: "%s | Papyrus",
  },
  description: "A student-powered archive for finding and sharing exam papers.",
  icons: {
    icon: "/logo.svg",
    shortcut: "/logo.svg",
    apple: "/logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
