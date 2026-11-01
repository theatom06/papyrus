"use client";

import "@/app/admin/style.css";
import "./style.css";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Settings2, X } from "lucide-react";
import { AdminShell } from "../components/admin-shell";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import type { PaperReport } from "../components/types";

export default function AdminReportsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [reports, setReports] = useState<PaperReport[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReports();
  }, []);

  function loadReports() {
    setLoading(true);
    apiRequest<{ reports?: PaperReport[] }>("/api/reports")
      .then((data) => setReports(data.reports || []))
      .catch(() => showToast("Could not load paper reports.", "error"))
      .finally(() => setLoading(false));
  }

  async function resolveReport(reportId: number) {
    try {
      await apiRequest(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "resolved" }),
      });
      setReports((prev) =>
        prev.map((r) => (r.id === reportId ? { ...r, status: "resolved" } : r)),
      );
      showToast("Report marked as resolved.", "success");
    } catch {
      showToast("Failed to update report status.", "error");
    }
  }

  async function dismissReport(reportId: number) {
    try {
      await apiRequest(`/api/reports/${reportId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "dismissed" }),
      });
      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId ? { ...r, status: "dismissed" } : r,
        ),
      );
      showToast("Report dismissed.", "info");
    } catch {
      showToast("Failed to dismiss report.", "error");
    }
  }

  const pendingCount = reports.filter((r) => r.status === "pending").length;

  return (
    <AdminShell
      title="Reports"
      active="Reports"
      badges={{ reportCount: pendingCount }}
    >
      <div className="dashboard-content">
        <div className="view-heading">
          <div>
            <div className="eyebrow">USER FEEDBACK & AUDIT</div>
            <h2>
              Paper Reports <span className="count-pill">{reports.length}</span>
            </h2>
            <p>
              Reports submitted by students and teachers regarding content
              accuracy, scan quality, or issues.
            </p>
          </div>
        </div>

        {loading ? (
          <p
            className="panel-empty"
            style={{ padding: 48, textAlign: "center", color: "var(--slate)" }}
          >
            Loading reports…
          </p>
        ) : reports.length ? (
          <div className="reports-list">
            {reports.map((report) => (
              <div className="report-card" key={report.id}>
                <div className="report-header">
                  <div className="report-title-area">
                    <span className={`report-badge ${report.status}`}>
                      {report.status}
                    </span>
                    <h3
                      style={{ cursor: "pointer" }}
                      onClick={() =>
                        router.push(`/admin/papers/${report.paper_id}`)
                      }
                    >
                      {report.paper_title}
                    </h3>
                    <small
                      style={{
                        color: "var(--slate)",
                        fontFamily: "var(--mono)",
                        fontSize: 11,
                      }}
                    >
                      {report.subject_name} · {report.board_code} ·{" "}
                      {report.class_level} · {report.paper_year}
                    </small>
                  </div>
                  <div className="report-actions">
                    <button
                      type="button"
                      className="button button-secondary"
                      style={{ fontSize: 12, padding: "8px 12px" }}
                      onClick={() =>
                        router.push(`/admin/papers/${report.paper_id}`)
                      }
                    >
                      <Settings2 size={13} /> Studio
                    </button>
                    {report.status === "pending" && (
                      <>
                        <button
                          type="button"
                          className="button button-primary"
                          style={{ fontSize: 12, padding: "8px 14px" }}
                          onClick={() => resolveReport(report.id)}
                        >
                          <Check size={13} /> Resolve
                        </button>
                        <button
                          type="button"
                          className="button button-secondary"
                          style={{ fontSize: 12, padding: "8px 14px" }}
                          onClick={() => dismissReport(report.id)}
                        >
                          <X size={13} /> Dismiss
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="report-reason-box">
                  <strong>Reported issue: {report.reason}</strong>
                  {report.details && <p>{report.details}</p>}
                </div>

                <div className="report-footer">
                  <span>
                    {report.reporter_email
                      ? `Submitted by: ${report.reporter_email}`
                      : "Submitted anonymously"}
                  </span>
                  <span>
                    {new Date(report.created_at).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
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
              <Flag size={20} />
            </div>
            <h3 style={{ margin: 0, font: "600 18px var(--serif)" }}>
              No Open Reports
            </h3>
            <p style={{ margin: 0, color: "var(--slate)", fontSize: 12 }}>
              Everything looks clear! No paper reports currently need
              moderation.
            </p>
          </div>
        )}
      </div>
    </AdminShell>
  );
}
