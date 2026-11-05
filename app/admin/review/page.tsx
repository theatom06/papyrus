"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Settings2, ShieldCheck } from "lucide-react";
import AdminShell from "../components/admin-shell";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import type { Paper } from "../components/types";

export default function AdminReviewPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReviewPapers();
  }, []);

  function loadReviewPapers() {
    setLoading(true);
    apiRequest<{ papers?: Array<Record<string, unknown>> }>(
      "/api/papers?scope=admin",
    )
      .then((data) => {
        const reviewItems = (data.papers || [])
          .filter((p) => p.status === "review")
          .map((paper) => ({
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
            status: "review" as const,
            downloads: Number(paper.downloads) || 0,
            upvotes: Number(paper.upvotes) || 0,
            downvotes: Number(paper.downvotes) || 0,
            contributorEmail: String(paper.contributor_email || ""),
            contributorComments: String(paper.contributor_comments || ""),
          }));
        setPapers(reviewItems);
      })
      .catch(() => showToast("Could not load review queue papers.", "error"))
      .finally(() => setLoading(false));
  }

  async function publish(id: string) {
    try {
      await apiRequest(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setPapers((current) => current.filter((paper) => paper.id !== id));
      showToast("Paper approved and published to the archive.", "success");
    } catch {
      showToast("The paper could not be approved.", "error");
    }
  }

  return (
    <AdminShell
      title="Review Queue"
      active="Review queue"
      badges={{ reviewCount: papers.length }}
    >
      <div className="dashboard-content">
        <div className="view-heading">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">MODERATION WORKFLOW</div>
            <h2 className="mt-2 font-serif text-[29px] tracking-[-0.035em]">
              Review Queue <span className="ml-1 inline-flex rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 align-middle font-mono text-[10px] text-amber">{papers.length}</span>
            </h2>
            <p>
              Inspect metadata, verify documents, and approve submissions before
              they are publicly listed.
            </p>
          </div>
        </div>

        {loading ? (
          <p
            className="panel-empty"
            style={{ padding: 48, textAlign: "center", color: "var(--slate)" }}
          >
            Loading moderation queue…
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {papers.length ? (
              papers.map((paper) => (
                <div className="overflow-hidden rounded-lg border border-border-main bg-linen shadow-sm" key={paper.id}>
                  <div
                    className="flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 bg-sand text-slate"
                    style={{ cursor: "pointer" }}
                    onClick={() => router.push(`/admin/papers/${paper.id}`)}
                  >
                    <BookOpen size={28} />
                    <span>PDF PREVIEW</span>
                  </div>
                  <div className="grid gap-3 p-4">
                    <span className="status review">
                      {paper.status.replace("_", " ")}
                    </span>
                    <h3
                      style={{
                        cursor: "pointer",
                        transition: "color 0.15s ease",
                      }}
                      onClick={() => router.push(`/admin/papers/${paper.id}`)}
                    >
                      {paper.title}
                    </h3>
                    <p>
                      {paper.subject} · {paper.board} · {paper.classLevel} ·{" "}
                      {paper.year}
                    </p>
                    {paper.contributorEmail && (
                      <p
                        style={{
                          marginTop: 6,
                          fontFamily: "var(--mono)",
                          fontSize: 10,
                          color: "var(--amber-dark)",
                        }}
                      >
                        Submitted by: {paper.contributorEmail}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="button button-secondary"
                        onClick={() => router.push(`/admin/papers/${paper.id}`)}
                        style={{ fontSize: 12, padding: "8px 12px" }}
                      >
                        <Settings2 size={14} /> Full Studio
                      </button>
                      <button
                        type="button"
                        className="button button-primary"
                        onClick={() => publish(paper.id)}
                        style={{ fontSize: 12, padding: "8px 14px" }}
                      >
                        <Check size={14} /> Approve & Publish
                      </button>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div
                className="panel"
                style={{
                  gridColumn: "1 / -1",
                  padding: 48,
                  textAlign: "center",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: "50%",
                    background: "var(--status-approved-bg)",
                    color: "var(--status-approved)",
                    display: "grid",
                    placeItems: "center",
                  }}
                >
                  <ShieldCheck size={22} />
                </div>
                <h3 style={{ margin: 0, font: "600 18px var(--serif)" }}>
                  Queue is Empty
                </h3>
                <p style={{ margin: 0, color: "var(--slate)", fontSize: 12 }}>
                  No papers are currently waiting for moderation.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminShell>
  );
}
