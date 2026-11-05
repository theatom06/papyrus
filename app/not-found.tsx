import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FileQuestion } from "lucide-react";
import Layout from "@/components/layout";
import ThemeToggle from "@/components/theme-toggle";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The Papyrus page you requested could not be found.",
};

export default function NotFound() {
  return (
    <Layout>
      <main className="relative flex min-h-[80vh] flex-col items-center justify-center px-4 py-16 text-center">
        <div className="absolute right-5 top-5">
          <ThemeToggle />
        </div>
        <div className="flex items-center justify-center gap-2 font-serif font-bold text-amber" style={{ fontSize: "clamp(60px, 14vw, 120px)" }}>
          <span>4</span>
          <FileQuestion strokeWidth={1.2} className="text-ink" style={{ width: "0.65em", height: "0.65em", transform: "rotate(-8deg)" }} />
          <span>4</span>
        </div>

        <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-widest text-amber">
          CATALOGUE / PAGE MISSING
        </p>

        <h1 className="mt-3 font-serif text-3xl font-bold tracking-tight sm:text-4xl">
          That page has gone{" "}
          <em className="font-normal italic text-amber">off the shelf.</em>
        </h1>

        <p className="mx-auto mt-4 max-w-md text-sm leading-relaxed text-slate">
          We looked through the archive, but could not find the page you were
          after. It may have moved, or the address may be out of date.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-sand shadow-sm hover:opacity-90 transition"
            href="/home"
          >
            <ArrowLeft size={15} />
            Back to home
          </Link>
          <Link
            className="inline-flex items-center gap-2 rounded-md border border-border-main bg-linen px-5 py-2.5 text-sm font-semibold text-ink hover:border-amber hover:text-amber transition"
            href="/archive"
          >
            Explore the archive
          </Link>
        </div>

        <div className="mt-16 flex items-center gap-4 font-mono text-[9px] uppercase tracking-widest text-border-main">
          <span>FILE NOT FOUND</span>
          <strong className="text-sm text-border-main">404</strong>
          <span>TRY ANOTHER PATH</span>
        </div>
      </main>
    </Layout>
  );
}
