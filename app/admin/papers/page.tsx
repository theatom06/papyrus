"use client";

import "@/app/admin/style.css";
import "./style.css";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Settings2, Trash2 } from "lucide-react";
import { AdminShell } from "../components/admin-shell";
import { SearchBox } from "@/components/search-box";
import { Dropdown } from "@/components/dropdown";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import type { Paper } from "../components/types";

export default function AdminPapersPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [papers, setPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | Paper["status"]>(
    "all",
  );

  useEffect(() => {
    loadPapers();
  }, []);

  function loadPapers() {
    setLoading(true);
    apiRequest<{ papers?: Array<Record<string, unknown>> }>(
      "/api/papers?scope=admin",
    )
      .then((data) => {
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
      })
      .catch(() =>
        showToast("Could not load papers from the archive database.", "error"),
      )
      .finally(() => setLoading(false));
  }

  const filteredPapers = useMemo(() => {
    const q = query.trim().toLowerCase();
    const terms = q ? q.split(/\s+/) : [];
    return papers.filter((paper) => {
      const searchString =
        `${paper.title} ${paper.subject} ${paper.board} ${paper.classLevel} ${paper.year} ${paper.type} ${paper.contributorEmail} ${paper.id}`.toLowerCase();
      const matchesQuery =
        terms.length === 0 ||
        terms.every((term) => searchString.includes(term));
      const matchesStatus =
        statusFilter === "all" || paper.status === statusFilter;
      return matchesQuery && matchesStatus;
    });
  }, [papers, query, statusFilter]);

  async function publish(id: string) {
    try {
      await apiRequest(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });
      setPapers((current) =>
        current.map((paper) =>
          paper.id === id ? { ...paper, status: "approved" } : paper,
        ),
      );
      showToast("Paper approved and published to the archive.", "success");
    } catch {
      showToast("The paper could not be approved.", "error");
    }
  }

  async function deletePaper(id: string) {
    if (!confirm("Are you sure you want to soft delete this paper?")) return;
    try {
      await apiRequest(`/api/papers/${id}`, { method: "DELETE" });
      setPapers((current) =>
        current.map((paper) =>
          paper.id === id ? { ...paper, status: "soft_delete" } : paper,
        ),
      );
      showToast("Paper moved to soft delete.", "info");
    } catch {
      showToast("The paper could not be deleted.", "error");
    }
  }

  return (
    <AdminShell title="Papers" active="Papers">
      <div className="dashboard-content">
        <div className="view-heading">
          <div>
            <div className="eyebrow">CONTENT ARCHIVE</div>
            <h2>
              All Papers{" "}
              <span className="count-pill">{filteredPapers.length}</span>
            </h2>
            <p>
              Search, filter, inspect, and moderate past examination papers
              across all curricula.
            </p>
          </div>
        </div>

        <div className="table-tools">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search by title, subject, board, level, year, contributor..."
          />
          <Dropdown
            className="admin-filter-dropdown"
            value={statusFilter}
            onChange={(value) =>
              setStatusFilter(value as "all" | Paper["status"])
            }
            options={[
              { value: "all", label: "All statuses" },
              { value: "review", label: "Review" },
              { value: "approved", label: "Approved" },
              { value: "hidden", label: "Hidden" },
              { value: "soft_delete", label: "Soft delete" },
            ]}
          />
        </div>

        <div className="panel table-panel">
          <div className="paper-table header-row">
            <span>Paper</span>
            <span>Board</span>
            <span>Level</span>
            <span>Year</span>
            <span>Status</span>
            <span>Downloads</span>
            <span style={{ textAlign: "right" }}>Actions</span>
          </div>

          {loading ? (
            <p
              className="panel-empty"
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "var(--slate)",
              }}
            >
              Loading papers…
            </p>
          ) : filteredPapers.length ? (
            filteredPapers.map((paper) => (
              <div className="paper-table" key={paper.id}>
                <div
                  className="table-paper"
                  style={{ cursor: "pointer" }}
                  onClick={() => router.push(`/admin/papers/${paper.id}`)}
                >
                  <div className="file-icon">
                    <BookOpen size={16} />
                  </div>
                  <span>
                    <strong>{paper.title}</strong>
                    <small>
                      {paper.subject} · {paper.type}
                      {paper.contributorEmail && ` · ${paper.contributorEmail}`}
                    </small>
                  </span>
                </div>

                <span>{paper.board}</span>
                <span>{paper.classLevel}</span>
                <span>{paper.year}</span>
                <span
                  className={`status ${paper.status === "approved" ? "published" : paper.status}`}
                >
                  {paper.status.replace("_", " ")}
                </span>
                <span>{paper.downloads.toLocaleString()}</span>
                <span className="row-actions">
                  <button
                    type="button"
                    onClick={() => router.push(`/admin/papers/${paper.id}`)}
                    title="Inspect and edit paper"
                    aria-label={`Inspect ${paper.title}`}
                  >
                    <Settings2 size={15} />
                  </button>
                  {paper.status === "review" && (
                    <button
                      type="button"
                      onClick={() => publish(paper.id)}
                      title="Approve paper"
                      style={{ color: "var(--status-approved)" }}
                      aria-label="Approve"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deletePaper(paper.id)}
                    title="Soft delete paper"
                    style={{ color: "var(--status-danger)" }}
                    aria-label="Soft delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            ))
          ) : (
            <p
              className="panel-empty"
              style={{
                padding: "48px 20px",
                textAlign: "center",
                color: "var(--slate)",
              }}
            >
              No papers match the current filters.
            </p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
