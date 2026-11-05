"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  Flag,
  GraduationCap,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Layers,
} from "lucide-react";
import Layout from "@/components/layout";
import PinButton from "@/components/pin-button";
import { apiRequest } from "@/lib/api-client";
import PdfViewer from "@/components/pdf-viewer";
import VotingWidget from "@/components/voting-widget";
import ReportPaperModal from "@/components/report-paper-modal";
import { formatDate, formatFileSize } from "@/util/format";

type PaperDetail = {
  id: string;
  title: string;
  description: string;
  year: number;
  duration: number;
  file_path: string;
  file_size_bytes: number;
  downloads: number;
  status: string;
  created_at: string;
  board_id: number;
  board_name: string;
  board: string;
  class_level_id: number;
  class_level: string;
  subject_id: number;
  subject: string;
  accent_color: string;
  resource_type_id: number;
  type: string;
};

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "Self-paced study";
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;
  }
  return `${minutes} mins`;
}

export function PaperPage() {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ paper?: PaperDetail }>(`/api/papers/${id}`)
      .then((data) => {
        setPaper(data.paper || null);
        setError("");
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Paper could not be loaded from the archive.",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(
        window.location.href.replace("/paper/", "/p/"),
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }

  }

  if (loading) {
    return (
      <Layout>
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <div className="flex flex-col gap-4">
            <div className="h-4 w-32 animate-pulse rounded bg-border-main" />
            <div className="h-6 w-24 animate-pulse rounded bg-border-main" />
            <div className="h-8 w-96 animate-pulse rounded bg-border-main" />
            <div className="h-96 animate-pulse rounded-xl bg-border-main" />
          </div>
        </main>
      </Layout>
    );
  }

  if (error || !paper) {
    return (
      <Layout>
        <main className="mx-auto max-w-6xl px-4 py-16 text-center sm:px-6">
          <Link className="mb-8 inline-flex items-center gap-1.5 text-xs font-medium text-slate hover:text-amber transition" href="/archive">
            <ArrowLeft size={14} /> Back to archive
          </Link>
          <h2 className="mt-4 font-serif text-2xl font-bold">Unable to load paper</h2>
          <p className="mt-2 text-sm text-slate">{error || "This paper does not exist or has been removed from the archive."}</p>
          <Link className="button-dark mt-6 inline-flex items-center gap-2 rounded-md bg-ink px-5 py-2.5 text-sm font-semibold text-sand hover:opacity-90" href="/archive">
            Browse archive
          </Link>
        </main>
      </Layout>
    );
  }

  const accentColor = paper.accent_color || "#a85d20";
  const downloadUrl = `/api/papers/${paper.id}/download`;
  const previewUrl = `/api/papers/${paper.id}/download?preview=true`;

  return (
    <>
      <Layout>
        <main
          className="mx-auto max-w-6xl px-4 py-8 sm:px-6"
          style={
            {
              "--subject-accent": accentColor,
              "--subject-color": accentColor,
            } as React.CSSProperties
          }
        >
          <nav className="mb-5 flex items-center justify-between gap-3 text-xs text-slate" aria-label="Paper navigation">
            <Link className="inline-flex items-center gap-1.5 rounded-md border border-border-main bg-linen px-3 py-2 font-medium text-ink transition hover:border-amber hover:text-amber" href="/archive">
              <ArrowLeft size={14} /> Back to archive
            </Link>

            <div className="hidden items-center gap-2 rounded-full border border-border-main bg-linen px-3 py-1.5 text-[11px] sm:flex">
              <Link className="hover:text-amber" href="/archive">Archive</Link>
              <span className="text-border-main">/</span>
              <Link className="hover:text-amber" href={`/archive?board=${encodeURIComponent(paper.board)}`}>
                {paper.board}
              </Link>
              <span className="text-border-main">/</span>
              <Link className="hover:text-amber"
                href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}`}
              >
                {paper.class_level}
              </Link>
              <span className="text-border-main">/</span>
              <Link
                className="font-medium text-ink"
                href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
              >
                {paper.subject}
              </Link>
            </div>

            <button
              type="button"
              className="inline-flex items-center gap-1.5 rounded-md border border-border-main bg-linen px-3 py-2 font-medium text-slate transition hover:border-amber hover:text-amber"
              onClick={handleShare}
              aria-label="Share paper link"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald" />
                  <span>Link copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  <span>Share</span>
                </>
              )}
            </button>
          </nav>

          <header className="mb-6 overflow-hidden rounded-xl border border-border-main bg-linen shadow-sm">
            <div className="border-b border-border-main/70 bg-sand/60 px-5 py-3 sm:px-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
                    className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                    style={{
                      background: `color-mix(in srgb, ${accentColor} 12%, var(--linen))`,
                      borderColor: accentColor,
                      color: accentColor,
                    }}
                  >
                    <span
                      className="size-1.5 rounded-full"
                      style={{ background: accentColor }}
                    />
                    {paper.subject}
                  </Link>
                  <Link
                    href={`/archive?type=${encodeURIComponent(paper.type)}`}
                    className="rounded-full border border-border-main bg-linen px-2.5 py-1 text-[11px] text-slate transition hover:border-amber hover:text-amber"
                  >
                    {paper.type}
                  </Link>
                  <Link
                    href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}`}
                    className="rounded-full border border-border-main bg-linen px-2.5 py-1 text-[11px] text-slate transition hover:border-amber hover:text-amber"
                  >
                    {paper.class_level}
                  </Link>
                  <Link
                    href={`/archive?board=${encodeURIComponent(paper.board)}`}
                    className="rounded-full border border-border-main bg-linen px-2.5 py-1 text-[11px] text-slate transition hover:border-amber hover:text-amber"
                  >
                    {paper.board}
                  </Link>
                </div>
                <div className="inline-flex items-center gap-1.5 rounded-full border border-emerald-600/30 bg-emerald-500/10 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck size={13} />
                  <span>Verified Material</span>
                </div>
              </div>
            </div>
            <div className="px-5 pb-5 pt-4 sm:px-6 sm:pb-6">
              <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-slate">
                {paper.subject} · {paper.type}
              </p>
              <h1 className="mt-2 max-w-3xl font-serif text-2xl font-bold leading-tight tracking-tight sm:text-4xl">
                {paper.title}
              </h1>
              <div className="mt-5 flex flex-wrap gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border-main bg-sand px-2.5 py-1 text-xs text-slate">
                <Calendar size={13} />
                <span>{paper.year} Exam</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border-main bg-sand px-2.5 py-1 text-xs text-slate">
                <Clock size={13} />
                <span>{formatDuration(paper.duration)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border-main bg-sand px-2.5 py-1 text-xs text-slate">
                <FileText size={13} />
                <span>{formatFileSize(paper.file_size_bytes)}</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border-main bg-sand px-2.5 py-1 text-xs text-slate">
                <Download size={13} />
                <span>{paper.downloads} downloads</span>
              </div>
              <div className="inline-flex items-center gap-1.5 rounded-md border border-border-main bg-sand px-2.5 py-1 text-xs text-slate">
                <GraduationCap size={13} />
                <span>{paper.board_name}</span>
              </div>
              </div>
            </div>
          </header>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
            <article className="flex min-w-0 flex-col gap-5">
              <div className="overflow-hidden rounded-lg border border-border-main bg-linen shadow-sm">
                <PdfViewer
                  src={previewUrl}
                  title={`${paper.title} (${paper.year})`}
                  downloadUrl={downloadUrl}
                />
              </div>

              <section className="rounded-lg border border-border-main bg-linen p-5 shadow-sm sm:p-6">
                <div className="flex items-center gap-2 border-b border-border-main/70 pb-3">
                  <span className="grid size-7 place-items-center rounded-md bg-amber/10 text-amber">
                    <BookOpen size={15} />
                  </span>
                  <h2 className="font-serif text-lg font-bold text-ink">
                    About this resource
                  </h2>
                </div>
                <p className="mt-4 text-sm leading-6 text-slate">
                  {paper.description ||
                    `Standard ${paper.type.toLowerCase()} for ${paper.subject} under the ${paper.board_name} (${paper.board}) curriculum for ${paper.class_level}. Recommended for authentic practice, revision, and mock exam simulations.`}
                </p>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-md border border-border-main/70 bg-sand/60 p-3">
                    <strong className="block text-xs font-semibold uppercase tracking-wide text-amber">
                      Recommended Session
                    </strong>
                    <p className="mt-2 text-xs leading-5 text-slate">
                      {paper.duration
                        ? `Sit for a focused ${formatDuration(paper.duration)} block under timed conditions to mirror authentic exam pacing.`
                        : "Work through problem sets section-by-section, identifying key terminology and core derivation steps."}
                    </p>
                  </div>
                  <div className="rounded-md border border-border-main/70 bg-sand/60 p-3">
                    <strong className="block text-xs font-semibold uppercase tracking-wide text-amber">
                      Curriculum Level
                    </strong>
                    <p className="mt-2 text-xs leading-5 text-slate">
                      {paper.class_level} — {paper.board_name}. Verified for
                      curriculum accuracy and syllabus relevance.
                    </p>
                  </div>
                </div>
              </section>
            </article>

            <aside className="flex flex-col gap-5">
              <section className="rounded-lg border border-border-main bg-linen p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 border-b border-border-main/70 pb-3">
                  <span className="grid size-7 place-items-center rounded-md bg-amber/10 text-amber">
                    <Sparkles size={14} />
                  </span>
                  <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">
                    Actions
                  </h2>
                </div>
                <a
                  className="flex w-full items-center justify-between gap-3 rounded-md bg-amber px-4 py-3 text-sm font-bold text-white transition hover:bg-amber-dark"
                  href={downloadUrl}
                  download
                >
                  <span className="inline-flex items-center gap-2">
                    <Download size={15} />
                    Download PDF
                  </span>
                  <span className="text-[10px] font-medium text-white/75">
                    {formatFileSize(paper.file_size_bytes)}
                  </span>
                </a>

                <div className="mt-3 grid gap-2">
                  <div className="flex w-full items-center justify-between rounded-md border border-border-main bg-sand px-3 py-2">
                    <span className="text-xs text-slate">Save for later</span>
                    <PinButton paperId={paper.id} />
                  </div>

                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-main bg-sand px-4 py-2 text-sm font-medium text-ink transition hover:border-amber hover:text-amber"
                    onClick={handleShare}
                  >
                    <Share2 size={13} />
                    <span>{copied ? "Link copied!" : "Share resource"}</span>
                  </button>

                  <button
                    type="button"
                    className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-border-main bg-linen px-4 py-2 text-sm font-medium text-slate transition hover:border-amber hover:text-amber"
                    onClick={() => setShowReport(true)}
                  >
                    <Flag size={13} />
                    <span>Report an issue</span>
                  </button>
                </div>
              </section>

              <div className="rounded-lg border border-border-main bg-linen p-4 shadow-sm">
                <h2 className="mb-3 border-b border-border-main/70 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">
                  Community rating
                </h2>
                <VotingWidget
                  paperId={paper.id}
                  downloads={paper.downloads}
                  createdAt={paper.created_at}
                />
              </div>

              <div className="rounded-lg border border-border-main bg-linen p-4 shadow-sm">
                <h2 className="mb-1 border-b border-border-main/70 pb-3 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">
                  Specifications
                </h2>

                <dl className="divide-y divide-border-main/70">
                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt>Subject</dt>
                    <dd>
                      <Link
                        href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
                        className="inline-flex items-center gap-1.5 text-right text-ink transition hover:text-amber"
                      >
                        <span
                          className="size-2 rounded-full"
                          style={{ background: accentColor }}
                        />
                        <strong>{paper.subject}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt>Board</dt>
                    <dd>
                      <Link
                        href={`/archive?board=${encodeURIComponent(paper.board)}`}
                        className="text-right text-ink transition hover:text-amber"
                      >
                        <strong>{paper.board}</strong>
                        <span className="block text-[10px] text-slate">{paper.board_name}</span>
                      </Link>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt>Level</dt>
                    <dd>
                      <Link
                        href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}`}
                        className="text-right text-ink transition hover:text-amber"
                      >
                        <strong>{paper.class_level}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt>Format</dt>
                    <dd>
                      <Link
                        href={`/archive?type=${encodeURIComponent(paper.type)}`}
                        className="text-right text-ink transition hover:text-amber"
                      >
                        <strong>{paper.type}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt>Exam Year</dt>
                    <dd>
                      <Link
                        href={`/archive?year=${encodeURIComponent(paper.year)}`}
                        className="text-right text-ink transition hover:text-amber"
                      >
                        <strong>{paper.year}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt className="text-slate">Reading Time</dt>
                    <dd className="text-right text-ink">
                      <strong>{formatDuration(paper.duration)}</strong>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt className="text-slate">File Size</dt>
                    <dd className="text-right text-ink">
                      <strong>{formatFileSize(paper.file_size_bytes)}</strong>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt className="text-slate">Total Downloads</dt>
                    <dd className="text-right text-ink">
                      <strong>{paper.downloads}</strong>
                    </dd>
                  </div>

                  <div className="flex items-start justify-between gap-3 py-2.5 text-xs">
                    <dt className="text-slate">Catalogued</dt>
                    <dd className="text-right text-ink">
                      <strong>{formatDate(paper.created_at)}</strong>
                    </dd>
                  </div>
                </dl>
              </div>

              <section className="rounded-lg border border-border-main bg-linen p-4 shadow-sm">
                <div className="mb-3 flex items-center gap-2 border-b border-border-main/70 pb-3">
                  <span className="grid size-7 place-items-center rounded-md bg-amber/10 text-amber">
                    <Layers size={14} />
                  </span>
                  <h2 className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">
                    Similar papers
                  </h2>
                </div>
                <div className="grid gap-2">
                  <Link
                    className="group flex items-center gap-3 rounded-md border border-border-main bg-sand px-3 py-2.5 text-xs text-ink transition hover:border-amber hover:text-amber"
                    href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
                  >
                    <BookOpen size={14} className="shrink-0 text-amber" />
                    <span className="min-w-0 flex-1">More {paper.subject} ({paper.class_level})</span>
                    <span className="text-slate transition group-hover:text-amber">→</span>
                  </Link>
                  <Link
                    className="group flex items-center gap-3 rounded-md border border-border-main bg-sand px-3 py-2.5 text-xs text-ink transition hover:border-amber hover:text-amber"
                    href={`/archive?subject=${encodeURIComponent(paper.subject)}&type=${encodeURIComponent(paper.type)}`}
                  >
                    <FileText size={14} className="shrink-0 text-amber" />
                    <span className="min-w-0 flex-1">{paper.type}s for {paper.subject}</span>
                    <span className="text-slate transition group-hover:text-amber">→</span>
                  </Link>
                  <Link
                    className="group flex items-center gap-3 rounded-md border border-border-main bg-sand px-3 py-2.5 text-xs text-ink transition hover:border-amber hover:text-amber"
                    href={`/archive?board=${encodeURIComponent(paper.board)}`}
                  >
                    <Layers size={14} className="shrink-0 text-amber" />
                    <span className="min-w-0 flex-1">Browse all {paper.board} papers</span>
                    <span className="text-slate transition group-hover:text-amber">→</span>
                  </Link>
                  <Link className="group flex items-center gap-3 rounded-md border border-dashed border-amber/50 bg-amber/5 px-3 py-2.5 text-xs text-amber transition hover:border-amber hover:bg-amber/10" href="/upload">
                    <Sparkles size={14} className="shrink-0" />
                    <span className="min-w-0 flex-1">Contribute a paper</span>
                    <span>→</span>
                  </Link>
                </div>
              </section>
            </aside>
          </div>
        </main>
      </Layout>

      {showReport && (
        <ReportPaperModal
          paperId={paper.id}
          paperTitle={paper.title}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}

export default PaperPage;
