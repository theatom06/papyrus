"use client";

import "./style.css";

import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  BarChart3,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  MoreHorizontal,
  Plus,
  Settings2,
  ShieldCheck,
  Trash2,
  Users,
  X,
  Moon,
  Sun,
  LogOut,
  FolderKanban,
  ArrowRight,
  Flag,
  ThumbsDown,
  ThumbsUp,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/modal";
import { AdminSidebar } from "./components/admin-sidebar";
import { SearchBox } from "@/components/search-box";
import { apiRequest } from "@/lib/api-client";
import { Dropdown } from "@/components/dropdown";
import { useToast } from "@/components/toast";

type Paper = {
  id: string;
  title: string;
  subject: string;
  board: string;
  classLevel: string;
  year: string;
  type: string;
  description: string;
  duration: number;
  boardId: number;
  classLevelId: number;
  subjectId: number;
  resourceTypeId: number;
  status: "review" | "approved" | "soft_delete" | "hidden";
  downloads: number;
  upvotes: number;
  downvotes: number;
  contributorEmail: string;
  contributorComments: string;
};

type BoardOption = {
  id: number;
  name: string;
  code: string;
  class_count: number;
  paper_count: number;
};

type PaperReport = {
  id: number;
  paper_id: string;
  reason: string;
  details: string | null;
  reporter_email: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
  paper_title: string;
  paper_year: number;
  board_code: string;
  board_name: string;
  subject_name: string;
  class_level: string;
};

const sectionPaths: Record<string, string> = {
  Overview: "/admin",
  Papers: "/admin/papers",
  "Review queue": "/admin/review",
  Reports: "/admin/reports",
  "Poor performing": "/admin/poor-performing",
  "Boards & classes": "/admin/boards",
};

export default function AdminPage({
  initialSection = "Overview",
}: {
  initialSection?: string;
} = {}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [active, setActive] = useState(initialSection);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [reports, setReports] = useState<PaperReport[]>([]);
  const [poorPapers, setPoorPapers] = useState<Array<Record<string, unknown>>>(
    [],
  );
  const [boardOptions, setBoardOptions] = useState<BoardOption[]>([]);
  const [query, setQuery] = useState("");
  const [showBoardForm, setShowBoardForm] = useState(false);
  const [dark, setDark] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"all" | Paper["status"]>(
    "all",
  );
  const [loading, setLoading] = useState(true);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [poorLoading, setPoorLoading] = useState(false);

  function handleNavigate(section: string) {
    setActive(section);
    const targetPath = sectionPaths[section];
    if (
      targetPath &&
      typeof window !== "undefined" &&
      window.location.pathname !== targetPath
    ) {
      router.push(targetPath);
    }
  }

  useEffect(() => {
    const saved = localStorage.getItem("papyrus-admin-theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("admin-dark", saved);
    loadPapers();
    loadBoards();
    loadReports();
    loadPoorPapers();
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
        showToast("Could not load papers from the database.", "error"),
      )
      .finally(() => setLoading(false));
  }

  function loadBoards() {
    apiRequest<{ boards?: BoardOption[] }>("/api/boards")
      .then((data) => setBoardOptions(data.boards || []))
      .catch(() => showToast("Could not load board options.", "error"));
  }

  function loadReports() {
    setReportsLoading(true);
    apiRequest<{ reports?: PaperReport[] }>("/api/reports")
      .then((data) => setReports(data.reports || []))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
  }

  function loadPoorPapers() {
    setPoorLoading(true);
    apiRequest<{ papers?: Array<Record<string, unknown>> }>(
      "/api/papers/poor-performing",
    )
      .then((data) => setPoorPapers(data.papers || []))
      .catch(() => {})
      .finally(() => setPoorLoading(false));
  }

  const reviewCount = papers.filter(
    (paper) => paper.status === "review",
  ).length;
  const pendingReportCount = reports.filter(
    (r) => r.status === "pending",
  ).length;

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
    } catch {
      showToast("The paper could not be approved.", "error");
      return;
    }
    setPapers((current) =>
      current.map((paper) =>
        paper.id === id ? { ...paper, status: "approved" } : paper,
      ),
    );
    showToast("Paper approved and published to the archive.", "success");
  }

  async function deletePaper(id: string) {
    if (!confirm("Are you sure you want to soft delete this paper?")) return;
    try {
      await apiRequest(`/api/papers/${id}`, { method: "DELETE" });
    } catch {
      showToast("The paper could not be deleted.", "error");
      return;
    }
    setPapers((current) =>
      current.map((paper) =>
        paper.id === id ? { ...paper, status: "soft_delete" } : paper,
      ),
    );
    showToast("Paper moved to soft delete.", "info");
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
      showToast("Report marked as resolved", "success");
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

  function toggleDarkMode() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("admin-dark", next);
    localStorage.setItem("papyrus-admin-theme", next ? "dark" : "light");
  }

  async function logout() {
    await apiRequest("/api/auth/login", { method: "DELETE" });
    window.location.assign("/login");
  }

  return (
    <div className="admin-app">
      <AdminSidebar
        active={active}
        reviewCount={reviewCount}
        reportCount={pendingReportCount}
        poorCount={poorPapers.length}
        onNavigate={handleNavigate}
        onSettings={() => setShowSettings(true)}
      />

      <main className="admin-main">
        <header className="admin-topbar">
          <div>
            <span className="mobile-kicker">PAPYRUS / ADMIN</span>
            <h1>{active}</h1>
          </div>
          <div className="top-actions">
            <Link
              href="/"
              target="_blank"
              className="button button-ghost"
              style={{ fontSize: 11 }}
            >
              <ExternalLink size={13} /> View Public Archive
            </Link>
            <button
              className="icon-button"
              onClick={toggleDarkMode}
              aria-label="Toggle admin dark mode"
              title="Toggle theme"
            >
              {dark ? <Sun size={17} /> : <Moon size={17} />}
            </button>
          </div>
        </header>

        {active === "Overview" && (
          <Overview
            papers={papers}
            reviewCount={reviewCount}
            reportCount={pendingReportCount}
            poorCount={poorPapers.length}
            onReview={() => handleNavigate("Review queue")}
            onReports={() => handleNavigate("Reports")}
            onPoor={() => handleNavigate("Poor performing")}
            onPublish={publish}
            onInspect={(paper) => router.push(`/admin/papers/${paper.id}`)}
          />
        )}

        {active === "Papers" && (
          <PapersView
            papers={filteredPapers}
            loading={loading}
            query={query}
            setQuery={setQuery}
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            onEdit={(paper) => router.push(`/admin/papers/${paper.id}`)}
            onPublish={publish}
            onDelete={deletePaper}
          />
        )}

        {active === "Review queue" && (
          <ReviewView
            papers={papers.filter((paper) => paper.status === "review")}
            onPublish={publish}
            onInspect={(paper) => router.push(`/admin/papers/${paper.id}`)}
          />
        )}

        {active === "Reports" && (
          <ReportsView
            reports={reports}
            loading={reportsLoading}
            onResolve={resolveReport}
            onDismiss={dismissReport}
            onInspect={(paperId) => router.push(`/admin/papers/${paperId}`)}
          />
        )}

        {active === "Poor performing" && (
          <PoorPerformingView
            papers={poorPapers}
            loading={poorLoading}
            onInspect={(paperId) => router.push(`/admin/papers/${paperId}`)}
          />
        )}

        {active === "Boards & classes" && (
          <BoardsView
            boards={boardOptions}
            onAdd={() => setShowBoardForm(true)}
            onManage={(boardId) => router.push(`/admin/boards/${boardId}`)}
          />
        )}
      </main>

      {showBoardForm && (
        <Modal
          title="Add a board"
          variant="form"
          eyebrow="PAPYRUS / ADMIN"
          onClose={() => setShowBoardForm(false)}
        >
          <form
            className="admin-form"
            onSubmit={async (event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              try {
                const res = await apiRequest<{ id: number }>("/api/boards", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    name: String(form.get("name") || "").trim(),
                    code: String(form.get("code") || "")
                      .trim()
                      .toUpperCase(),
                    className: String(form.get("className") || "").trim(),
                    subjectName: String(form.get("subjectName") || "").trim(),
                  }),
                });
                setShowBoardForm(false);
                showToast("Board added to your catalogue.", "success");
                loadBoards();
                if (res?.id) {
                  router.push(`/admin/boards/${res.id}`);
                }
              } catch {
                showToast(
                  "Board could not be added. Check its name and code.",
                  "error",
                );
              }
            }}
          >
            <label>
              Board name
              <input
                name="name"
                placeholder="e.g. Cambridge International"
                required
              />
            </label>
            <label>
              Short code
              <input name="code" placeholder="e.g. CAIE" required />
            </label>
            <label>
              First grade level
              <input name="className" placeholder="e.g. Grade 10" required />
            </label>
            <label>
              First subject
              <input
                name="subjectName"
                placeholder="e.g. Mathematics"
                required
              />
            </label>
            <button
              className="button button-dark"
              type="submit"
              style={{ marginTop: 12 }}
            >
              <Plus size={16} /> Create board
            </button>
          </form>
        </Modal>
      )}

      {showSettings && (
        <Modal
          title="Quick Settings"
          eyebrow="PAPYRUS / ADMIN"
          onClose={() => setShowSettings(false)}
        >
          <div className="admin-quick-settings">
            <div className="setting-row">
              <div>
                <strong>Theme mode</strong>
                <p>Toggle between light parchment and dark study room.</p>
              </div>
              <button className="button button-soft" onClick={toggleDarkMode}>
                {dark ? "Switch to Light" : "Switch to Dark"}
              </button>
            </div>
            <div className="setting-row">
              <div>
                <strong>Session</strong>
                <p>Signed in as Administrator.</p>
              </div>
              <button
                className="button button-ghost"
                onClick={logout}
                style={{ color: "#b04c3d" }}
              >
                <LogOut size={14} /> Log out
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

function Overview({
  papers,
  reviewCount,
  reportCount,
  poorCount,
  onReview,
  onReports,
  onPoor,
  onPublish,
  onInspect,
}: {
  papers: Paper[];
  reviewCount: number;
  reportCount: number;
  poorCount: number;
  onReview: () => void;
  onReports: () => void;
  onPoor: () => void;
  onPublish: (id: string) => void;
  onInspect: (paper: Paper) => void;
}) {
  const downloads = papers.reduce((sum, paper) => sum + paper.downloads, 0);
  const approvedCount = papers.filter(
    (paper) => paper.status === "approved",
  ).length;

  return (
    <div className="dashboard-content">
      <div className="welcome-row">
        <div>
          <div className="eyebrow">
            {new Intl.DateTimeFormat("en", {
              weekday: "long",
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date())}
          </div>
          <h2>
            Welcome back, Steve <span>✦</span>
          </h2>
          <p>
            Manage examinations, moderations, user reports, and curriculum
            hierarchies.
          </p>
        </div>
      </div>

      <div className="stats-grid">
        <Stat
          icon={BookOpen}
          label="Total Papers"
          value={papers.length.toLocaleString()}
          change={`${approvedCount} active in archive`}
          tone="amber"
        />
        <Stat
          icon={BarChart3}
          label="Total Downloads"
          value={downloads.toLocaleString()}
          change="Public student access"
          tone="blue"
        />
        <Stat
          icon={ShieldCheck}
          label="Awaiting Review"
          value={String(reviewCount)}
          change={reviewCount ? "Pending moderation" : "All caught up"}
          tone="rose"
        />
        <Stat
          icon={Flag}
          label="Pending Reports"
          value={String(reportCount)}
          change={reportCount ? "User issue reports" : "No open reports"}
          tone={reportCount > 0 ? "rose" : "green"}
        />
      </div>

      <div className="dashboard-columns">
        <section className="panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">ACTION NEEDED</div>
              <h3>Moderation Queue</h3>
            </div>
            <button className="text-button" onClick={onReview}>
              View all <ArrowRight size={14} />
            </button>
          </div>

          {papers
            .filter((paper) => paper.status === "review")
            .slice(0, 5)
            .map((paper) => (
              <ReviewRow
                key={paper.id}
                paper={paper}
                onPublish={() => onPublish(paper.id)}
                onInspect={() => onInspect(paper)}
              />
            ))}

          <div className="queue-empty">
            <Check size={16} />{" "}
            {reviewCount
              ? `${reviewCount} papers pending review`
              : "All caught up, queue is clear!"}
          </div>
        </section>

        <section className="panel recent-panel" style={{ marginTop: 0 }}>
          <div className="panel-heading">
            <div>
              <div className="eyebrow">QUALITY MONITOR</div>
              <h3>Attention Required</h3>
            </div>
            {poorCount > 0 && (
              <button className="text-button" onClick={onPoor}>
                View all ({poorCount}) <ArrowRight size={14} />
              </button>
            )}
          </div>

          <div className="recent-list">
            {reportCount > 0 ? (
              <div
                className="recent-item"
                style={{ cursor: "pointer", borderLeft: "3px solid #b04c3d" }}
                onClick={onReports}
              >
                <div className="file-icon" style={{ color: "#b04c3d" }}>
                  <Flag size={16} />
                </div>
                <div>
                  <strong>
                    {reportCount} Paper{" "}
                    {reportCount === 1 ? "Report" : "Reports"}
                  </strong>
                  <small>Students reported issues with archive materials</small>
                </div>
                <span className="status review">Needs action</span>
              </div>
            ) : null}

            {papers.slice(0, 4).map((paper) => (
              <div
                className="recent-item"
                key={paper.id}
                style={{ cursor: "pointer" }}
                onClick={() => onInspect(paper)}
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
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onInspect(paper);
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
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  change,
  tone,
}: {
  icon: typeof BookOpen;
  label: string;
  value: string;
  change: string;
  tone: "amber" | "blue" | "rose" | "green";
}) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}>
        <Icon size={18} />
      </div>
      <div className="stat-label">{label}</div>
      <strong>{value}</strong>
      <small className={tone === "rose" ? "attention" : ""}>{change}</small>
    </div>
  );
}

function ReviewRow({
  paper,
  onPublish,
  onInspect,
}: {
  paper: Paper;
  onPublish: () => void;
  onInspect: () => void;
}) {
  return (
    <div className="review-row">
      <div className="file-icon">
        <BookOpen size={16} />
      </div>
      <div
        className="review-details"
        style={{ cursor: "pointer" }}
        onClick={onInspect}
      >
        <strong>{paper.title}</strong>
        <small>
          {paper.subject} · {paper.board} · {paper.year}
          {paper.contributorEmail ? ` · ${paper.contributorEmail}` : ""}
        </small>
      </div>
      <button
        className="approve-button"
        onClick={onPublish}
        title="Approve and make visible"
      >
        <Check size={14} /> Approve
      </button>
      <button
        className="icon-button"
        onClick={onInspect}
        aria-label="Inspect paper"
        title="Inspect and edit paper"
      >
        <MoreHorizontal size={16} />
      </button>
    </div>
  );
}

function PapersView({
  papers,
  loading,
  query,
  setQuery,
  statusFilter,
  setStatusFilter,
  onEdit,
  onPublish,
  onDelete,
}: {
  papers: Paper[];
  loading: boolean;
  query: string;
  setQuery: (value: string) => void;
  statusFilter: "all" | Paper["status"];
  setStatusFilter: (value: "all" | Paper["status"]) => void;
  onEdit: (paper: Paper) => void;
  onPublish: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">CONTENT LIBRARY</div>
          <h2>
            All Papers <span className="count-pill">{papers.length}</span>
          </h2>
          <p>
            Click any paper to open the comprehensive inspection and editing
            studio.
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
              padding: "36px 20px",
              textAlign: "center",
              color: "var(--slate)",
            }}
          >
            Loading papers…
          </p>
        ) : papers.length ? (
          papers.map((paper) => (
            <div className="paper-table" key={paper.id}>
              <div
                className="table-paper"
                style={{ cursor: "pointer" }}
                onClick={() => onEdit(paper)}
              >
                <div className="file-icon">
                  <BookOpen size={15} />
                </div>
                <span>
                  <strong style={{ transition: "color 0.15s ease" }}>
                    {paper.title}
                  </strong>
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
              <span>{paper.downloads}</span>
              <span className="row-actions">
                <button
                  type="button"
                  onClick={() => onEdit(paper)}
                  title="Inspect and edit paper"
                  aria-label="Inspect"
                >
                  <Settings2 size={15} />
                </button>
                {paper.status === "review" && (
                  <button
                    type="button"
                    onClick={() => onPublish(paper.id)}
                    title="Approve paper"
                    style={{ color: "#2f7c57" }}
                  >
                    <Check size={15} />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onDelete(paper.id)}
                  title="Soft delete paper"
                  style={{ color: "#b04c3d" }}
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
              padding: "36px 20px",
              textAlign: "center",
              color: "var(--slate)",
            }}
          >
            No papers match the current filters.
          </p>
        )}
      </div>
    </div>
  );
}

function ReviewView({
  papers,
  onPublish,
  onInspect,
}: {
  papers: Paper[];
  onPublish: (id: string) => void;
  onInspect: (paper: Paper) => void;
}) {
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">MODERATION</div>
          <h2>
            Review Queue <span className="count-pill">{papers.length}</span>
          </h2>
          <p>
            Inspect metadata, view PDF preview, and approve before papers become
            visible.
          </p>
        </div>
      </div>

      <div className="review-grid">
        {papers.length ? (
          papers.map((paper) => (
            <div className="review-card" key={paper.id}>
              <div
                className="review-cover"
                style={{ cursor: "pointer" }}
                onClick={() => onInspect(paper)}
              >
                <BookOpen size={28} />
                <span>PDF PREVIEW</span>
              </div>
              <div className="review-card-content">
                <span className="status review">
                  {paper.status.replace("_", " ")}
                </span>
                <h3
                  style={{ cursor: "pointer", transition: "color 0.15s ease" }}
                  onClick={() => onInspect(paper)}
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
                      marginTop: 4,
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      color: "var(--amber-dark)",
                    }}
                  >
                    Submitted by: {paper.contributorEmail}
                  </p>
                )}
                <div className="review-card-actions">
                  <button
                    className="button button-soft"
                    onClick={() => onInspect(paper)}
                    style={{ fontSize: 11 }}
                  >
                    <Settings2 size={14} /> Full Studio
                  </button>
                  <button
                    className="button button-primary"
                    onClick={() => onPublish(paper.id)}
                    style={{ fontSize: 11 }}
                  >
                    <Check size={14} /> Approve & Publish
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <p
            className="panel-empty"
            style={{
              gridColumn: "1 / -1",
              padding: "40px",
              textAlign: "center",
              color: "var(--slate)",
            }}
          >
            No papers are currently waiting for moderation.
          </p>
        )}
      </div>
    </div>
  );
}

function ReportsView({
  reports,
  loading,
  onResolve,
  onDismiss,
  onInspect,
}: {
  reports: PaperReport[];
  loading: boolean;
  onResolve: (id: number) => void;
  onDismiss: (id: number) => void;
  onInspect: (paperId: string) => void;
}) {
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">USER FEEDBACK & AUDIT</div>
          <h2>
            Paper Reports <span className="count-pill">{reports.length}</span>
          </h2>
          <p>
            Reports submitted by students regarding content accuracy, scan
            quality, or issues.
          </p>
        </div>
      </div>

      {loading ? (
        <p
          className="panel-empty"
          style={{ padding: 40, textAlign: "center", color: "var(--slate)" }}
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
                    onClick={() => onInspect(report.paper_id)}
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
                    className="button button-soft"
                    style={{ fontSize: 11 }}
                    onClick={() => onInspect(report.paper_id)}
                  >
                    <Settings2 size={13} /> Studio
                  </button>
                  {report.status === "pending" && (
                    <>
                      <button
                        className="button button-primary"
                        style={{ fontSize: 11 }}
                        onClick={() => onResolve(report.id)}
                      >
                        <Check size={13} /> Resolve
                      </button>
                      <button
                        className="button button-ghost"
                        style={{ fontSize: 11 }}
                        onClick={() => onDismiss(report.id)}
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
                <span>{new Date(report.created_at).toLocaleDateString()}</span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p
          className="panel-empty"
          style={{ padding: 40, textAlign: "center", color: "var(--slate)" }}
        >
          No reported papers. Everything looks clear!
        </p>
      )}
    </div>
  );
}

function PoorPerformingView({
  papers,
  loading,
  onInspect,
}: {
  papers: Array<Record<string, unknown>>;
  loading: boolean;
  onInspect: (paperId: string) => void;
}) {
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">QUALITY AUDIT</div>
          <h2>
            Poor Performing Papers{" "}
            <span className="count-pill">{papers.length}</span>
          </h2>
          <p>
            Papers with low community ratings, high downvotes, or open
            moderation reports.
          </p>
        </div>
      </div>

      {loading ? (
        <p
          className="panel-empty"
          style={{ padding: 40, textAlign: "center", color: "var(--slate)" }}
        >
          Analyzing performance metrics…
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
                  onClick={() => onInspect(String(p.id))}
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
                    className="button button-soft"
                    style={{ fontSize: 11 }}
                    onClick={() => onInspect(String(p.id))}
                  >
                    <Settings2 size={13} /> Inspect in Studio
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <p
          className="panel-empty"
          style={{ padding: 40, textAlign: "center", color: "var(--slate)" }}
        >
          Great news! No papers currently have poor ratings or negative
          feedback.
        </p>
      )}
    </div>
  );
}

function BoardsView({
  boards,
  onAdd,
  onManage,
}: {
  boards: BoardOption[];
  onAdd: () => void;
  onManage: (id: number) => void;
}) {
  return (
    <div className="dashboard-content">
      <div className="view-heading">
        <div>
          <div className="eyebrow">ARCHIVE HIERARCHY</div>
          <h2>Curriculum Boards & Classes</h2>
          <p>
            Control board details, grade levels, subjects, subject accents, and
            resource types.
          </p>
        </div>
        <button className="button button-dark" onClick={onAdd}>
          <Plus size={16} /> New Board
        </button>
      </div>

      <div className="board-grid">
        {boards.map((board) => (
          <div
            className="board-card"
            key={board.id}
            style={{
              cursor: "pointer",
              transition:
                "transform 0.15s ease, box-shadow 0.15s ease, border-color 0.15s ease",
            }}
            onClick={() => onManage(board.id)}
          >
            <div className="board-mark blue">{board.code}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h3 style={{ margin: "0 0 4px", fontSize: 16 }}>{board.name}</h3>
              <p>
                {board.class_count} grade levels · {board.paper_count} papers
              </p>
            </div>
            <button
              className="icon-button"
              onClick={(e) => {
                e.stopPropagation();
                onManage(board.id);
              }}
              title={`Configure ${board.name}`}
              aria-label={`Open ${board.name}`}
            >
              <ArrowRight size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
