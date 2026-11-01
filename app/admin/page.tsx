"use client";

import "./style.css";

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
import { AdminShell } from "./components/admin-shell";
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

  useEffect(() => {
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

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

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
      <div className="dashboard-content">
        <div className="welcome-row">
          <div>
            <div className="eyebrow">{formattedDate}</div>
            <h2>
              Welcome back, Steve <span>✦</span>
            </h2>
            <p>
              Manage examinations, moderation queue, user audit reports, and
              curriculum structures.
            </p>
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon amber">
              <BookOpen size={18} />
            </div>
            <div className="stat-label">Total Papers</div>
            <strong>{loading ? "…" : papers.length.toLocaleString()}</strong>
            <small>{approvedCount} active in archive</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon blue">
              <BarChart3 size={18} />
            </div>
            <div className="stat-label">Total Downloads</div>
            <strong>{loading ? "…" : totalDownloads.toLocaleString()}</strong>
            <small>Public student access</small>
          </div>

          <div className="stat-card">
            <div className="stat-icon rose">
              <ShieldCheck size={18} />
            </div>
            <div className="stat-label">Awaiting Review</div>
            <strong>{loading ? "…" : String(reviewCount)}</strong>
            <small className={reviewCount > 0 ? "attention" : ""}>
              {reviewCount > 0 ? "Pending moderation" : "All caught up"}
            </small>
          </div>

          <div className="stat-card">
            <div
              className={`stat-icon ${pendingReportCount > 0 ? "rose" : "amber"}`}
            >
              <Flag size={18} />
            </div>
            <div className="stat-label">Pending Reports</div>
            <strong>{loading ? "…" : String(pendingReportCount)}</strong>
            <small className={pendingReportCount > 0 ? "attention" : ""}>
              {pendingReportCount > 0
                ? "User issue reports"
                : "No open reports"}
            </small>
          </div>
        </div>

        <div className="dashboard-columns">
          <section className="panel">
            <div className="panel-heading">
              <div>
                <div className="eyebrow">ACTION NEEDED</div>
                <h3>Moderation Queue</h3>
              </div>
              <Link href="/admin/review" className="text-button">
                View all <ArrowRight size={14} />
              </Link>
            </div>

            {loading ? (
              <p
                className="panel-empty"
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
                  <div className="review-row" key={paper.id}>
                    <div className="file-icon">
                      <BookOpen size={16} />
                    </div>
                    <div
                      className="review-details"
                      style={{ cursor: "pointer" }}
                      onClick={() => router.push(`/admin/papers/${paper.id}`)}
                    >
                      <strong>{paper.title}</strong>
                      <small>
                        {paper.subject} · {paper.board} · {paper.year}
                        {paper.contributorEmail
                          ? ` · ${paper.contributorEmail}`
                          : ""}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="approve-button"
                      onClick={() => quickApprove(paper.id)}
                      title="Approve and make visible"
                    >
                      <Check size={14} /> Approve
                    </button>
                    <button
                      type="button"
                      className="icon-button"
                      onClick={() => router.push(`/admin/papers/${paper.id}`)}
                      aria-label={`Inspect ${paper.title}`}
                      title="Inspect paper in studio"
                    >
                      <MoreHorizontal size={16} />
                    </button>
                  </div>
                ))
            ) : (
              <div className="queue-empty">
                <Check size={16} /> All caught up, review queue is clear!
              </div>
            )}
          </section>

          <section className="panel recent-panel" style={{ marginTop: 0 }}>
            <div className="panel-heading">
              <div>
                <div className="eyebrow">QUALITY MONITOR</div>
                <h3>Attention Required</h3>
              </div>
              {poorCount > 0 && (
                <Link href="/admin/poor-performing" className="text-button">
                  View all ({poorCount}) <ArrowRight size={14} />
                </Link>
              )}
            </div>

            <div className="recent-list">
              {pendingReportCount > 0 ? (
                <Link
                  href="/admin/reports"
                  className="recent-item"
                  style={{
                    textDecoration: "none",
                    borderLeft: "3px solid #b04c3d",
                  }}
                >
                  <div className="file-icon" style={{ color: "#b04c3d" }}>
                    <Flag size={16} />
                  </div>
                  <div>
                    <strong>
                      {pendingReportCount} Paper{" "}
                      {pendingReportCount === 1 ? "Report" : "Reports"}
                    </strong>
                    <small>
                      Students reported issues with archive materials
                    </small>
                  </div>
                  <span className="status review">Needs action</span>
                </Link>
              ) : null}

              {papers.slice(0, 4).map((paper) => (
                <div
                  className="recent-item"
                  key={paper.id}
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/admin/papers/${paper.id}`)}
                >
                  <div className="file-icon">
                    <BookOpen size={16} />
                  </div>
                  <div>
                    <strong>{paper.title}</strong>
                    <small>
                      {paper.subject} · {paper.board} · {paper.year}
                    </small>
                  </div>
                  <span
                    className={`status ${paper.status === "approved" ? "published" : paper.status}`}
                  >
                    {paper.status.replace("_", " ")}
                  </span>
                  <button
                    type="button"
                    className="icon-button"
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
