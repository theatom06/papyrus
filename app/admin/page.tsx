"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  BarChart3,
  BookOpen,
  Check,
  ArrowRight,
  Flag,
  MoreHorizontal,
  ShieldCheck,
} from "lucide-react";
import AdminShell from "./components/admin-shell";
import AdminStatCard from "./components/admin-stat-card";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import type { Paper, PaperReport } from "./components/types";

export default function AdminOverviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reports, setReports] = useState<PaperReport[]>([]);
  const [poorCount, setPoorCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [formattedDate, setFormattedDate] = useState("");

  useEffect(() => {
    setFormattedDate(
      new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date()),
    );
    loadData();
  }, []);

  function loadData() {
    setLoading(true);
    Promise.all([
      apiRequest<{ papers?: Array<Record<string, unknown>> }>(
        "/api/papers?scope=admin",
      ).then((data) => {
        setPapers(
          (data.papers || []).map((paper) => ({
            id: String(paper.id),
            title: String(paper.title),
            subject: String(paper.subject),
            board: String(paper.board),
            classLevel: String(paper.class_level),
            year: String(paper.year),
            type: String(paper.type),
            description: String(paper.description || ""),
            duration: Number(paper.duration) || 0,
            boardId: Number(paper.board_id),
            classLevelId: Number(paper.class_level_id),
            subjectId: Number(paper.subject_id),
            resourceTypeId: Number(paper.resource_type_id),
            status: (paper.status as Paper["status"]) || "review",
            downloads: Number(paper.downloads) || 0,
            upvotes: Number(paper.upvotes) || 0,
            downvotes: Number(paper.downvotes) || 0,
            contributorEmail: String(paper.contributor_email || ""),
            contributorComments: String(paper.contributor_comments || ""),
          })),
        );
      }),
      apiRequest<{ reports?: PaperReport[] }>("/api/reports")
        .then((data) => setReports(data.reports || []))
        .catch(() => {}),
      apiRequest<{ papers?: Array<unknown> }>("/api/papers/poor-performing")
        .then((data) => setPoorCount((data.papers || []).length))
        .catch(() => {}),
    ])
      .catch(() => {
        showToast("Could not load overview statistics.", "error");
      })
      .finally(() => setLoading(false));
  }

  async function quickApprove(id: string) {
    try {
      await apiRequest(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setPapers((current) =>
        current.map((p) => (p.id === id ? { ...p, status: "approved" } : p)),
      );
      showToast("Paper approved and published to the archive.", "success");
    } catch {
      showToast("The paper could not be approved.", "error");
    }
  }

  const reviewCount = papers.filter((p) => p.status === "review").length;
  const pendingReportCount = reports.filter(
    (r) => r.status === "pending",
  ).length;
  const approvedCount = papers.filter((p) => p.status === "approved").length;
  const totalDownloads = papers.reduce((sum, p) => sum + p.downloads, 0);

  return (
    <AdminShell
      title="Overview"
      active="Overview"
      badges={{
        reviewCount,
        reportCount: pendingReportCount,
        poorCount,
      }}
    >
      <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-8 sm:px-[4.5vw]">
        <div className="mb-5">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">
              {formattedDate || "Today"}
            </div>
            <h2 className="mt-2 font-[Georgia] text-[28px] tracking-[-0.04em]">
              Welcome back, Steve{" "}
              <span className="text-lg text-amber">✦</span>
            </h2>
            <p className="mt-1 text-xs text-slate">
              Manage examinations, moderation queue, user audit reports, and
              curriculum structures.
            </p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-1 gap-2 sm:grid-cols-2 xl:grid-cols-4">
          <AdminStatCard
            icon={BookOpen}
            label="Total Papers"
            value={loading ? "…" : papers.length.toLocaleString()}
            detail={`${approvedCount} active in archive`}
          />
          <AdminStatCard
            icon={BarChart3}
            label="Total Downloads"
            value={loading ? "…" : totalDownloads.toLocaleString()}
            detail="Public student access"
            tone="sky"
          />
          <AdminStatCard
            icon={ShieldCheck}
            label="Awaiting Review"
            value={loading ? "…" : String(reviewCount)}
            detail={reviewCount > 0 ? "Pending moderation" : "All caught up"}
            tone="rose"
          />
          <AdminStatCard
            icon={Flag}
            label="Pending Reports"
            value={loading ? "…" : String(pendingReportCount)}
            detail={pendingReportCount > 0 ? "User issue reports" : "No open reports"}
            tone={pendingReportCount > 0 ? "rose" : "amber"}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
          <section className="rounded-md border border-border-main bg-linen p-5">
            <div className="mb-3.5 flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">
                  ACTION NEEDED
                </div>
                <h3 className="mt-1.5 font-[Georgia] text-[17px]">
                  Moderation Queue
                </h3>
              </div>
              <Link
                href="/admin/review"
                className="inline-flex items-center gap-1 text-xs text-ink hover:text-amber"
              >
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <p
                className="p-6 text-center text-sm text-slate"
                style={{
                  padding: 24,
                  textAlign: "center",
                  color: "var(--slate)",
                }}
              >
                Loading moderation queue…
              </p>
            ) : papers.filter((p) => p.status === "review").length > 0 ? (
              papers
                .filter((p) => p.status === "review")
                .slice(0, 5)
                .map((paper) => (
                  <div
                    className="flex min-h-12 items-center gap-2.5 border-t border-border-main"
                    key={paper.id}
                  >
                    <div className="grid size-8 place-items-center rounded-md bg-amber/10 text-amber">
                      <BookOpen size={16} />
                    </div>
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => router.push(`/admin/papers/${paper.id}`)}
                    >
                      <strong className="block truncate text-xs">
                        {paper.title}
                      </strong>
                      <small className="mt-0.5 block truncate text-[10px] text-slate">
                        {paper.subject} · {paper.board} · {paper.year}
                        {paper.contributorEmail
                          ? ` · ${paper.contributorEmail}`
                          : ""}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 rounded border border-emerald-600/30 px-2 py-1.5 text-[10px] text-emerald-600 hover:bg-emerald-500/10 dark:text-emerald-400"
                      onClick={() => quickApprove(paper.id)}
                      title="Approve and make visible"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      className="grid size-7 place-items-center rounded-md border border-border-main text-slate hover:border-amber hover:text-amber"
                      onClick={() => router.push(`/admin/papers/${paper.id}`)}
                      aria-label={`Inspect ${paper.title}`}
                      title="Inspect paper in studio"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                ))
            ) : (
              <div className="flex items-center gap-2 rounded border border-emerald-600/30 bg-emerald-500/10 px-3 py-2 text-[11px] text-emerald-600 dark:text-emerald-400">
                <Check size={16} /> All caught up, review queue is clear!
              </div>
            )}
          </section>

          <section className="rounded-md border border-border-main bg-linen p-5">
            <div className="mb-3.5 flex items-start justify-between gap-3">
              <div>
                <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">
                  QUALITY MONITOR
                </div>
                <h3 className="mt-1.5 font-[Georgia] text-[17px]">
                  Attention Required
                </h3>
              </div>
              {poorCount > 0 && (
                <Link
                  href="/admin/poor-performing"
                  className="inline-flex items-center gap-1 text-xs text-ink hover:text-amber"
                >
                  View all ({poorCount}) <ArrowRight size={14} />
                </Link>
              )}
            </div>

            <div className="recent-list">
              {pendingReportCount > 0 ? (
                <Link
                  href="/admin/reports"
                  className="flex min-h-12 items-center gap-2.5 border-t border-border-main border-l-[3px] pl-2.5 no-underline"
                  style={{
                    textDecoration: "none",
                    borderLeft: "3px solid var(--amber-dark)",
                  }}
                >
                  <div className="grid size-8 place-items-center rounded-md bg-rose-500/10 text-rose-600 dark:text-rose-400">
                    <Flag size={16} />
                  </div>
                  <div>
                    <strong className="block text-xs">
                      {pendingReportCount} Paper{" "}
                      {pendingReportCount === 1 ? "Report" : "Reports"}
                    </strong>
                    <small className="mt-0.5 block text-[10px] text-slate">
                      Students reported issues with archive materials
                    </small>
                  </div>
                  <span className="rounded-full border border-rose-600/30 px-2 py-1 font-mono text-[9px] uppercase text-rose-600 dark:text-rose-400">
                    Needs action
                  </span>
                </Link>
              ) : null}

              {papers.slice(0, 4).map((paper) => (
                <div
                  className="flex min-h-12 cursor-pointer items-center gap-2.5 border-t border-border-main"
                  key={paper.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/admin/papers/${paper.id}`)}
                >
                  <div className="grid size-8 place-items-center rounded-md bg-amber/10 text-amber">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <strong className="block truncate text-xs">
                      {paper.title}
                    </strong>
                    <small className="mt-0.5 block truncate text-[10px] text-slate">
                      {paper.subject} · {paper.board} · {paper.year}
                    </small>
                  </div>
                  <span
                    className={`rounded-full border px-2 py-1 font-mono text-[9px] uppercase ${paper.status === "approved" ? "border-emerald-600/30 text-emerald-600 dark:text-emerald-400" : "border-amber/40 bg-amber/10 text-amber"}`}
                  >
                    {paper.status.replace("_", " ")}
                  </span>
                  <button
                    type="button"
                    className="grid size-7 place-items-center rounded-md border border-border-main text-slate hover:border-amber hover:text-amber"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/papers/${paper.id}`);
                    }}
                    aria-label={`Inspect ${paper.title}`}
                    title="Open paper editor"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </AdminShell>
  );
}
