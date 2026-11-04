"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Flag, Settings2, X } from "lucide-react";
import AdminShell from "../components/admin-shell";
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
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">USER FEEDBACK & AUDIT</div>
            <h2 className="mt-2 font-serif text-[29px] tracking-[-0.035em]">
              Paper Reports <span className="ml-1 inline-flex rounded-full border border-amber/40 bg-amber/10 px-2 py-0.5 align-middle font-mono text-[10px] text-amber">{reports.length}</span>
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
          <div className="grid gap-4">
            {reports.map((report) => (
              <div className="rounded-lg border border-border-main bg-linen p-5 shadow-sm" key={report.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <span
                      className={`inline-flex w-fit rounded-full border px-2 py-1 font-mono text-[9px] uppercase ${
                        report.status === "pending"
                          ? "border-amber/40 bg-amber/10 text-amber"
                          : "border-emerald-600/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                      }`}
                    >
                      {report.status}
                    </span>
                    <h3
                      className="mt-2 cursor-pointer font-serif text-lg font-semibold hover:text-amber"
                      onClick={() =>
                        router.push(`/admin/papers/${report.paper_id}`)
                      }
                    >
                      {report.paper_title}
                    </h3>
                    <small className="mt-1 block font-mono text-[11px] text-slate">
                      {report.subject_name} · {report.board_code} ·{" "}
                      {report.class_level} · {report.paper_year}
                    </small>
                  </div>
                  <div className="flex flex-wrap gap-2">
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

                <div className="mt-4 rounded-md border border-border-main bg-sand p-3 text-sm text-ink">
                  <strong>Reported issue: {report.reason}</strong>
                  {report.details && <p>{report.details}</p>}
                </div>

                <div className="mt-4 flex flex-wrap justify-between gap-2 border-t border-border-main pt-3 text-xs text-slate">
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
