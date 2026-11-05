"use client";

import Link from "next/link";
import Layout from "@/components/layout";
import { BookOpen, BookmarkCheck, Search, ShieldCheck } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 sm:py-16">
        <section className="mx-auto max-w-3xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-border-main bg-linen px-3 py-1 font-mono text-[11px] font-medium text-amber">
            <span>STUDENT ARCHIVE</span>
            <span className="text-slate">/</span>
            <span>EXAM REVISION</span>
          </div>

          <h1 className="mt-6 font-serif text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Past exam papers, <br />
            <span className="text-amber">organized for quick study.</span>
          </h1>

          <p className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-slate sm:text-base">
            Skip messy group chats and broken Google Drive links. Papyrus is a student-powered repository of past papers, mark schemes, and practice tests.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/archive"
              className="inline-flex items-center gap-2 rounded-md bg-amber px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-amber-dark transition-colors"
            >
              <Search size={16} />
              Browse past papers
            </Link>
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-md border border-border-main bg-linen px-5 py-3 text-sm font-semibold text-ink shadow-sm hover:border-amber hover:text-amber transition-colors"
            >
              Upload a paper
            </Link>
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-center gap-6 border-y border-border-main py-4 text-xs font-medium text-slate">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-emerald-500" />
              <span>Free & Open Access</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-amber" />
              <span>Moderated Papers</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full bg-blue-500" />
              <span>Full PDF Previews</span>
            </div>
          </div>
        </section>

        <section className="mt-16">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl font-bold sm:text-3xl">How Papyrus works</h2>
            <p className="mt-2 text-sm text-slate">A simple setup built for students revising under pressure.</p>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div className="rounded-lg border border-border-main bg-linen p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-md bg-amber/10 text-amber">
                <Search size={20} />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">Search by syllabus</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate">
                Filter by exam board, subject, class level, and year to find exactly the paper you need in seconds.
              </p>
            </div>

            <div className="rounded-lg border border-border-main bg-linen p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-md bg-amber/10 text-amber">
                <BookmarkCheck size={20} />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">Personal pin shelf</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate">
                Pin papers into custom groups for your upcoming exam or homework revision without needing an account.
              </p>
            </div>

            <div className="rounded-lg border border-border-main bg-linen p-6 shadow-sm">
              <div className="grid size-10 place-items-center rounded-md bg-amber/10 text-amber">
                <ShieldCheck size={20} />
              </div>
              <h3 className="mt-4 font-serif text-lg font-bold">Peer reviewed quality</h3>
              <p className="mt-2 text-xs leading-relaxed text-slate">
                Students upvote helpful papers and flag incomplete scans or answer sheets so only the best resources rank top.
              </p>
            </div>
          </div>
        </section>

        <section className="mt-16 rounded-xl border border-border-main bg-linen p-8 text-center sm:p-12">
          <h2 className="font-serif text-2xl font-bold">Have papers from your last term?</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-slate">
            Help out fellow students by uploading past prelims, unit tests, or official exam question papers.
          </p>
          <div className="mt-6">
            <Link
              href="/upload"
              className="inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-xs font-semibold text-sand hover:opacity-90 transition-opacity"
            >
              Share your papers
            </Link>
          </div>
        </section>
      </main>
    </Layout>
  );
}
