"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BookOpen, Check, Settings2, Trash2 } from "lucide-react";
import AdminShell from "../components/admin-shell";
import SearchBox from "@/components/search-box";
import Dropdown from "@/components/dropdown";
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
      <div className="mx-auto w-full max-w-[1035px] px-5 pb-24 pt-8 sm:px-[4.5vw]">
        <div className="mb-7 flex items-end justify-between gap-5 max-[720px]:flex-col max-[720px]:items-stretch">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">
              CONTENT ARCHIVE
            </div>
            <h2 className="mt-2 font-[Georgia] text-[29px] tracking-[-0.035em]">
              All Papers{" "}
              <span className="inline-flex rounded-full border border-amber/40 bg-amber/10 px-2 py-1 font-mono text-[10px] text-amber">
                {filteredPapers.length}
              </span>
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate">
              Search, filter, inspect, and moderate past examination papers
              across all curricula.
            </p>
          </div>
        </div>

        <div className="mb-3 flex items-center gap-2 max-[720px]:flex-col max-[720px]:items-stretch">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search by title, subject, board, level, year, contributor..."
          />
          <Dropdown
            className="rounded-md border border-border-main bg-linen px-3 py-2 text-sm text-ink"
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

        <div className="overflow-x-auto rounded-md border border-border-main bg-linen p-5">
          <div className="hidden grid-cols-[2.4fr_.8fr_.8fr_.7fr_1fr_.8fr_.8fr] gap-3 border-b border-border-main pb-3 font-mono text-[10px] uppercase tracking-wider text-slate md:grid">
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
              className="p-12 text-center text-sm text-slate"
            >
              Loading papers…
            </p>
          ) : filteredPapers.length ? (
            filteredPapers.map((paper) => (
              <div
                className="grid gap-3 border-t border-border-main py-4 text-sm md:grid-cols-[2.4fr_.8fr_.8fr_.7fr_1fr_.8fr_.8fr] md:items-center"
                key={paper.id}
              >
                <div
                  className="flex min-w-[260px] cursor-pointer items-center gap-2.5"
                  onClick={() => router.push(`/admin/papers/${paper.id}`)}
                >
                  <div className="grid size-[30px] shrink-0 place-items-center rounded-md bg-amber/10 text-amber">
                    <BookOpen size={16} />
                  </div>
                  <span>
                    <strong className="block text-xs">{paper.title}</strong>
                    <small className="mt-0.5 block text-[10px] text-slate">
                      {paper.subject} · {paper.type}
                      {paper.contributorEmail && ` · ${paper.contributorEmail}`}
                    </small>
                  </span>
                </div>

                <span>{paper.board}</span>
                <span>{paper.classLevel}</span>
                <span>{paper.year}</span>
                <span
                  className={`w-fit rounded-full border px-2 py-1 font-mono text-[9px] uppercase ${paper.status === "approved" ? "border-emerald-600/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" : "border-amber/40 bg-amber/10 text-amber"}`}
                >
                  {paper.status.replace("_", " ")}
                </span>
                <span>{paper.downloads.toLocaleString()}</span>
                <span className="flex justify-end gap-1.5">
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
                      className="grid size-7 place-items-center rounded-md border border-emerald-600/30 text-emerald-600 hover:border-emerald-600 dark:text-emerald-400"
                      aria-label="Approve"
                    >
                      <Check size={15} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => deletePaper(paper.id)}
                    title="Soft delete paper"
                    className="grid size-7 place-items-center rounded-md border border-rose-600/30 text-rose-600 hover:border-rose-600 dark:text-rose-400"
                    aria-label="Soft delete"
                  >
                    <Trash2 size={15} />
                  </button>
                </span>
              </div>
            ))
          ) : (
            <p
              className="p-12 text-center text-sm text-slate"
            >
              No papers match the current filters.
            </p>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
