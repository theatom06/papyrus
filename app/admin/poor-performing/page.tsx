"use client";

import "@/app/admin/style.css";
import "./style.css";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Flag, Settings2, ThumbsDown, ThumbsUp } from "lucide-react";
import { AdminShell } from "../components/admin-shell";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";

export default function AdminPoorPerformingPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [papers, setPapers] = useState<Array<Record<string, unknown>>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPoorPapers();
  }, []);

  function loadPoorPapers() {
    setLoading(true);
    apiRequest<{ papers?: Array<Record<string, unknown>> }>(
      "/api/papers/poor-performing",
    )
      .then((data) => setPapers(data.papers || []))
      .catch(() => showToast("Could not load poor performing papers.", "error"))
      .finally(() => setLoading(false));
  }

  return (
    <AdminShell
      title="Poor Performing"
      active="Poor performing"
      badges={{ poorCount: papers.length }}
    >
      <div className="dashboard-content">
        <div className="view-heading">
          <div>
            <div className="eyebrow">QUALITY AUDIT</div>
            <h2>
              Poor Performing Papers{" "}
              <span className="count-pill">{papers.length}</span>
            </h2>
            <p>
              Papers with low community ratings, high downvotes, or open user
              moderation reports.
            </p>
          </div>
        </div>

        {loading ? (
          <p
            className="panel-empty"
            style={{ padding: 48, textAlign: "center", color: "var(--slate)" }}
          >
            Analyzing quality and rating metrics…
          </p>
        ) : papers.length ? (
          <div className="poor-grid">
            {papers.map((p) => {
              const up = Number(p.upvotes) || 0;
              const down = Number(p.downvotes) || 0;
              const total = up + down;
              const ratio = total > 0 ? Math.round((up / total) * 100) : 0;
              const reports = Number(p.pending_reports) || 0;

              return (
                <div className="poor-card" key={String(p.id)}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <span
                      className={`status ${p.status === "approved" ? "published" : String(p.status)}`}
                    >
                      {String(p.status).replace("_", " ")}
                    </span>
                    {reports > 0 && (
                      <span className="report-badge pending">
                        <Flag size={11} /> {reports}{" "}
                        {reports === 1 ? "report" : "reports"}
                      </span>
                    )}
                  </div>

                  <h3
                    style={{ cursor: "pointer", marginTop: 8 }}
                    onClick={() => router.push(`/admin/papers/${p.id}`)}
                  >
                    {String(p.title)}
                  </h3>
                  <small
                    style={{ color: "var(--slate)", font: "10px var(--mono)" }}
                  >
                    {String(p.subject)} · {String(p.board)} ·{" "}
                    {String(p.class_level)} · {String(p.year)}
                  </small>

                  <div className="vote-stat-strip">
                    <span className="vote-item up">
                      <ThumbsUp size={13} /> {up}
                    </span>
                    <span className="vote-item down">
                      <ThumbsDown size={13} /> {down}
                    </span>
                    <span className="vote-item score">
                      {total > 0 ? `${ratio}% helpful` : "No votes"}
                    </span>
                  </div>

                  <div
                    style={{
                      marginTop: "auto",
                      paddingTop: 8,
                      display: "flex",
                      gap: 8,
                      justifyContent: "flex-end",
                    }}
                  >
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: 12, padding: "8px 12px" }}
                      onClick={() => router.push(`/admin/papers/${p.id}`)}
                    >
                      <Settings2 size={13} /> Inspect in Studio
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div
            className="panel"
            style={{
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
              <ThumbsUp size={22} />
            </div>
            <h3 style={{ margin: 0, font: "600 18px var(--serif)" }}>
              High Quality Standing
            </h3>
            <p style={{ margin: 0, color: "var(--slate)", fontSize: 12 }}>
              Great news! No papers currently have poor ratings or negative
              student feedback.
            </p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
