"use client";

import "@/app/admin/style.css";
import "@/app/paper/[id]/style.css";

import { useEffect, useState, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Download,
  ExternalLink,
  FileText,
  Save,
  Trash2,
  X,
  Sun,
  Moon,
  ShieldCheck,
  Clock,
  Calendar,
  Layers,
  GraduationCap,
  BookOpen,
  AlertTriangle,
  Flag,
  ThumbsUp,
  ThumbsDown,
  CheckCircle2,
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { Dropdown } from "@/components/dropdown";
import { PdfViewer } from "@/components/pdf-viewer";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";

type PaperDetail = {
  id: string;
  title: string;
  description: string;
  year: number;
  duration: number;
  file_path: string;
  file_size_bytes: number;
  downloads: number;
  upvotes?: number;
  downvotes?: number;
  status: "review" | "approved" | "hidden" | "soft_delete";
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
  contributor_email?: string;
  contributor_comments?: string;
};

type BoardOption = {
  id: number;
  name: string;
  code: string;
  classLevels: Array<{ id: number; name: string; slug?: string }>;
  subjects: Array<{
    id: number;
    name: string;
    slug?: string;
    accent_color?: string;
    class_level_id: number;
  }>;
  types: Array<{ id: number; name: string }>;
};

type PaperReport = {
  id: number;
  paper_id: string;
  reason: string;
  details: string | null;
  reporter_email: string | null;
  status: "pending" | "resolved" | "dismissed";
  created_at: string;
};

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "PDF document";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(isoString?: string): string {
  if (!isoString) return "Recent";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Recent";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
}

export default function AdminPaperPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { showToast } = useToast();

  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dark, setDark] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);
  const [pendingNav, setPendingNav] = useState<string | null>(null);

  // User Reports & Reviews state
  const [reports, setReports] = useState<PaperReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState<PaperDetail["status"]>("review");
  const [boardId, setBoardId] = useState<number>(0);
  const [classLevelId, setClassLevelId] = useState<number>(0);
  const [subjectId, setSubjectId] = useState<number>(0);
  const [resourceTypeId, setResourceTypeId] = useState<number>(0);
  const [year, setYear] = useState<number>(2026);
  const [duration, setDuration] = useState<number>(60);
  const [downloads, setDownloads] = useState<number>(0);

  // Track saved state for dirty detection
  const [savedTitle, setSavedTitle] = useState("");
  const [savedDescription, setSavedDescription] = useState("");
  const [savedStatus, setSavedStatus] =
    useState<PaperDetail["status"]>("review");
  const [savedBoardId, setSavedBoardId] = useState(0);
  const [savedClassLevelId, setSavedClassLevelId] = useState(0);
  const [savedSubjectId, setSavedSubjectId] = useState(0);
  const [savedResourceTypeId, setSavedResourceTypeId] = useState(0);
  const [savedYear, setSavedYear] = useState(2026);
  const [savedDuration, setSavedDuration] = useState(60);

  const isDirty =
    title !== savedTitle ||
    description !== savedDescription ||
    status !== savedStatus ||
    boardId !== savedBoardId ||
    classLevelId !== savedClassLevelId ||
    subjectId !== savedSubjectId ||
    resourceTypeId !== savedResourceTypeId ||
    year !== savedYear ||
    duration !== savedDuration;

  useEffect(() => {
    const saved = localStorage.getItem("papyrus-admin-theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("admin-dark", saved);

    Promise.all([
      apiRequest<{ paper?: PaperDetail }>(`/api/papers/${id}?scope=admin`),
      apiRequest<{ boards?: BoardOption[] }>("/api/boards"),
      apiRequest<{ reports?: PaperReport[] }>(
        `/api/reports?paperId=${id}`,
      ).catch(() => ({ reports: [] as PaperReport[] })),
    ])
      .then(([paperData, boardsData, reportsData]) => {
        if (paperData.paper) {
          const p = paperData.paper;
          setPaper(p);
          setTitle(p.title);
          setDescription(p.description || "");
          setStatus(p.status);
          setBoardId(p.board_id);
          setClassLevelId(p.class_level_id);
          setSubjectId(p.subject_id);
          setResourceTypeId(p.resource_type_id);
          setYear(Number(p.year) || 2026);
          setDuration(Number(p.duration) || 60);
          setDownloads(Number(p.downloads) || 0);
          // Sync saved state for dirty tracking
          setSavedTitle(p.title);
          setSavedDescription(p.description || "");
          setSavedStatus(p.status);
          setSavedBoardId(p.board_id);
          setSavedClassLevelId(p.class_level_id);
          setSavedSubjectId(p.subject_id);
          setSavedResourceTypeId(p.resource_type_id);
          setSavedYear(Number(p.year) || 2026);
          setSavedDuration(Number(p.duration) || 60);
        }
        if (boardsData.boards) {
          setBoards(boardsData.boards);
        }
        if (reportsData.reports) {
          setReports(reportsData.reports);
        }
      })
      .catch((err) => {
        showToast(
          err instanceof Error ? err.message : "Failed to load paper details",
          "error",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  function toggleDarkMode() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("admin-dark", next);
    localStorage.setItem("papyrus-admin-theme", next ? "dark" : "light");
  }

  function loadReports() {
    setReportsLoading(true);
    apiRequest<{ reports?: PaperReport[] }>(`/api/reports?paperId=${id}`)
      .then((data) => setReports(data.reports || []))
      .catch(() => {})
      .finally(() => setReportsLoading(false));
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
      showToast("Failed to resolve report.", "error");
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

  // Dependent dropdown lists
  const currentBoard = useMemo(
    () => boards.find((b) => b.id === boardId),
    [boards, boardId],
  );

  const classLevelOptions = useMemo(() => {
    return (currentBoard?.classLevels || []).map((level) => ({
      value: String(level.id),
      label: level.name,
    }));
  }, [currentBoard]);

  const subjectOptions = useMemo(() => {
    return (currentBoard?.subjects || [])
      .filter((s) => s.class_level_id === classLevelId)
      .map((s) => ({
        value: String(s.id),
        label: s.name,
      }));
  }, [currentBoard, classLevelId]);

  const resourceTypeOptions = useMemo(() => {
    return (currentBoard?.types || []).map((t) => ({
      value: String(t.id),
      label: t.name,
    }));
  }, [currentBoard]);

  function handleBoardChange(newBoardId: number) {
    setBoardId(newBoardId);
    const targetBoard = boards.find((b) => b.id === newBoardId);
    if (targetBoard) {
      const firstClass = targetBoard.classLevels[0];
      if (firstClass) {
        setClassLevelId(firstClass.id);
        const firstSubject = targetBoard.subjects.find(
          (s) => s.class_level_id === firstClass.id,
        );
        if (firstSubject) setSubjectId(firstSubject.id);
      }
      const firstType = targetBoard.types[0];
      if (firstType) setResourceTypeId(firstType.id);
    }
  }

  function handleClassLevelChange(newClassLevelId: number) {
    setClassLevelId(newClassLevelId);
    const firstSubject = (currentBoard?.subjects || []).find(
      (s) => s.class_level_id === newClassLevelId,
    );
    if (firstSubject) setSubjectId(firstSubject.id);
  }

  useEffect(() => {
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  async function handleSave(
    newStatusOverride?: PaperDetail["status"],
  ): Promise<boolean> {
    setSaving(true);
    const targetStatus = newStatusOverride || status;
    try {
      await apiRequest(`/api/papers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          status: targetStatus,
          boardId,
          classLevelId,
          subjectId,
          resourceTypeId,
          examYear: Number(year),
          duration: Number(duration),
          downloads: Number(downloads),
        }),
      });

      if (newStatusOverride) setStatus(newStatusOverride);
      showToast("Paper successfully saved and updated!", "success");

      // Sync saved state so isDirty resets
      setSavedTitle(title.trim());
      setSavedDescription(description.trim());
      setSavedStatus(newStatusOverride || status);
      setSavedBoardId(boardId);
      setSavedClassLevelId(classLevelId);
      setSavedSubjectId(subjectId);
      setSavedResourceTypeId(resourceTypeId);
      setSavedYear(year);
      setSavedDuration(duration);

      // Refresh paper state
      const updated = await apiRequest<{ paper?: PaperDetail }>(
        `/api/papers/${id}?scope=admin`,
      );
      if (updated.paper) setPaper(updated.paper);
      return true;
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : "Failed to update paper.",
        "error",
      );
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function handleSoftDelete() {
    if (!confirm("Are you sure you want to soft delete this paper?")) return;
    await handleSave("soft_delete");
  }

  if (loading) {
    return (
      <div
        className="admin-app"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <p style={{ color: "var(--slate)", font: "500 14px var(--mono)" }}>
          Loading paper studio...
        </p>
      </div>
    );
  }

  if (!paper) {
    return (
      <div
        className="admin-app"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>Paper not found</h2>
          <Link
            href="/admin"
            className="button button-dark"
            style={{ marginTop: 16 }}
          >
            Back to Admin
          </Link>
        </div>
      </div>
    );
  }

  const previewUrl = `/api/papers/${paper.id}/download?scope=admin&preview=1`;
  const downloadUrl = `/api/papers/${paper.id}/download?scope=admin`;
  const accentColor = paper.accent_color || "#c97732";

  return (
    <div className="admin-app" style={{ display: "block", minHeight: "100vh" }}>
      {/* Top Navigation Bar */}
      <header
        className="admin-topbar"
        style={{ position: "sticky", top: 0, zIndex: 30 }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <Link
            href="/admin"
            className="icon-button"
            title="Back to Admin"
            onClick={(e) => {
              if (isDirty) {
                e.preventDefault();
                setShowUnsavedModal(true);
                setPendingNav("/admin");
              }
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mobile-kicker" style={{ padding: 0 }}>
                PAPYRUS / ADMIN / PAPERS
              </span>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--mono)",
                  padding: "2px 8px",
                  borderRadius: 99,
                  textTransform: "uppercase",
                  fontWeight: 600,
                  background:
                    status === "approved"
                      ? "#2f7c5722"
                      : status === "review"
                        ? "#c9773222"
                        : status === "hidden"
                          ? "#746b6322"
                          : "#b04c3d22",
                  color:
                    status === "approved"
                      ? "#2f7c57"
                      : status === "review"
                        ? "var(--amber-dark)"
                        : status === "hidden"
                          ? "var(--slate)"
                          : "#b04c3d",
                  border: "1px solid currentColor",
                }}
              >
                {status}
              </span>
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 20 }}>{paper.title}</h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href={`/paper/${paper.id}`}
            target="_blank"
            className="button button-soft"
            title="View public paper page"
          >
            <ExternalLink size={14} /> View Live
          </Link>
          <button
            type="button"
            className="button button-dark"
            onClick={() => handleSave()}
            disabled={saving}
          >
            <Save size={14} /> {saving ? "Saving..." : "Save changes"}
          </button>
          <button
            type="button"
            className="icon-button"
            onClick={toggleDarkMode}
            aria-label="Toggle dark mode"
          >
            {dark ? <Sun size={17} /> : <Moon size={17} />}
          </button>
        </div>
      </header>

      {/* Main Content Area - Wide Layout */}
      <main
        className="detail-page-container"
        style={{ padding: "28px 4.5vw 60px", maxWidth: 1400, margin: "0 auto" }}
      >
        <div
          className="detail-layout"
          style={{
            gridTemplateColumns: "minmax(0, 1.35fr) minmax(340px, 440px)",
            gap: 32,
          }}
        >
          {/* Main Column: PDF Preview + Title & Description Editors */}
          <article
            className="detail-main"
            style={{ display: "flex", flexDirection: "column", gap: 24 }}
          >
            {/* Live PDF Viewer */}
            <div
              className="detail-viewer-wrapper"
              style={{ boxShadow: "0 6px 24px var(--card-shadow)" }}
            >
              <PdfViewer
                src={previewUrl}
                title={paper.title}
                downloadUrl={downloadUrl}
              />
            </div>

            {/* Editable Title & Description Card */}
            <section
              style={{
                background: "var(--linen)",
                border: "1px solid var(--border)",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 4px 16px var(--card-shadow)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <BookOpen size={16} style={{ color: "var(--amber-dark)" }} />
                <h2 style={{ margin: 0, font: "600 18px var(--serif)" }}>
                  Resource Details
                </h2>
              </div>

              <div style={{ display: "grid", gap: 16 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                      color: "var(--slate)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}
                  >
                    Paper Title
                  </label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    style={{
                      width: "100%",
                      padding: "11px 14px",
                      borderRadius: 9,
                      border: "1px solid var(--border)",
                      background: "var(--sand)",
                      color: "var(--ink)",
                      fontSize: 15,
                      fontFamily: "var(--sans)",
                      fontWeight: 600,
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 11,
                      fontFamily: "var(--mono)",
                      color: "var(--slate)",
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                      marginBottom: 6,
                    }}
                  >
                    Description & Syllabus Overview
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={5}
                    placeholder="Provide authentic context, syllabus coverage, recommended study pacing..."
                    style={{
                      width: "100%",
                      padding: "12px 14px",
                      borderRadius: 9,
                      border: "1px solid var(--border)",
                      background: "var(--sand)",
                      color: "var(--ink)",
                      fontSize: 13,
                      fontFamily: "var(--sans)",
                      lineHeight: 1.6,
                      outline: "none",
                      resize: "vertical",
                    }}
                  />
                </div>
              </div>
            </section>

            {/* Contributor Submission Details if available */}
            {(paper.contributor_email || paper.contributor_comments) && (
              <section
                style={{
                  background: "var(--linen)",
                  border: "1px solid var(--border)",
                  borderRadius: 16,
                  padding: 24,
                  boxShadow: "0 4px 16px var(--card-shadow)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    marginBottom: 16,
                  }}
                >
                  <ShieldCheck
                    size={16}
                    style={{ color: "var(--amber-dark)" }}
                  />
                  <h2 style={{ margin: 0, font: "600 18px var(--serif)" }}>
                    Contributor Submission
                  </h2>
                </div>

                <div style={{ display: "grid", gap: 12 }}>
                  <div>
                    <span
                      style={{
                        fontSize: 11,
                        fontFamily: "var(--mono)",
                        color: "var(--slate)",
                      }}
                    >
                      CONTRIBUTOR EMAIL
                    </span>
                    <p
                      style={{
                        margin: "4px 0 0",
                        font: "500 13px var(--mono)",
                        color: "var(--ink)",
                      }}
                    >
                      {paper.contributor_email || "Anonymous submission"}
                    </p>
                  </div>
                  {paper.contributor_comments && (
                    <div>
                      <span
                        style={{
                          fontSize: 11,
                          fontFamily: "var(--mono)",
                          color: "var(--slate)",
                        }}
                      >
                        CONTRIBUTOR NOTES / COMMENTS
                      </span>
                      <p
                        style={{
                          margin: "4px 0 0",
                          fontSize: 13,
                          lineHeight: 1.5,
                          color: "var(--slate)",
                          background: "var(--sand)",
                          padding: 12,
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                        }}
                      >
                        {paper.contributor_comments}
                      </p>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Community Rating & User Reports Card */}
            <section
              style={{
                background: "var(--linen)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: "24px 28px",
                boxShadow: "0 4px 20px var(--card-shadow)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 18,
                  paddingBottom: 14,
                  borderBottom: "1px solid var(--border)",
                }}
              >
                <div>
                  <div
                    className="eyebrow"
                    style={{ color: "var(--amber-dark)" }}
                  >
                    COMMUNITY FEEDBACK & AUDIT
                  </div>
                  <h3
                    style={{
                      margin: "4px 0 0",
                      fontSize: 18,
                      color: "var(--ink)",
                    }}
                  >
                    Reviews & User Reports
                  </h3>
                </div>
                <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background:
                        "color-mix(in srgb, #2f7c57 12%, var(--linen))",
                      color: "#2f7c57",
                      padding: "5px 10px",
                      borderRadius: 8,
                      font: "600 12px var(--mono)",
                      border: "1px solid #2f7c5730",
                    }}
                  >
                    <ThumbsUp size={13} /> {paper.upvotes || 0}
                  </div>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      background:
                        "color-mix(in srgb, #b04c3d 12%, var(--linen))",
                      color: "#b04c3d",
                      padding: "5px 10px",
                      borderRadius: 8,
                      font: "600 12px var(--mono)",
                      border: "1px solid #b04c3d30",
                    }}
                  >
                    <ThumbsDown size={13} /> {paper.downvotes || 0}
                  </div>
                </div>
              </div>

              {/* Reports list for this paper */}
              <div>
                <h4
                  style={{
                    fontSize: 12,
                    fontFamily: "var(--mono)",
                    textTransform: "uppercase",
                    letterSpacing: "0.08em",
                    color: "var(--slate)",
                    margin: "0 0 12px",
                  }}
                >
                  Submitted Issue Reports ({reports.length})
                </h4>

                {reportsLoading ? (
                  <p style={{ color: "var(--slate)", fontSize: 12 }}>
                    Loading reports...
                  </p>
                ) : reports.length > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: 12,
                    }}
                  >
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        style={{
                          padding: 16,
                          borderRadius: 10,
                          border: "1px solid var(--border)",
                          background: "var(--sand)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            marginBottom: 8,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 8,
                            }}
                          >
                            <span
                              className={`report-badge ${report.status}`}
                              style={{
                                fontSize: 10,
                                fontFamily: "var(--mono)",
                                textTransform: "uppercase",
                                fontWeight: 700,
                                padding: "3px 8px",
                                borderRadius: 6,
                              }}
                            >
                              {report.status}
                            </span>
                            <strong
                              style={{ fontSize: 13, color: "var(--ink)" }}
                            >
                              {report.reason}
                            </strong>
                          </div>

                          {report.status === "pending" && (
                            <div style={{ display: "flex", gap: 6 }}>
                              <button
                                type="button"
                                className="button button-primary"
                                style={{ fontSize: 11, padding: "5px 10px" }}
                                onClick={() => resolveReport(report.id)}
                              >
                                <Check size={12} /> Resolve
                              </button>
                              <button
                                type="button"
                                className="button button-ghost"
                                style={{ fontSize: 11, padding: "5px 10px" }}
                                onClick={() => dismissReport(report.id)}
                              >
                                <X size={12} /> Dismiss
                              </button>
                            </div>
                          )}
                        </div>

                        {report.details && (
                          <p
                            style={{
                              margin: "6px 0",
                              fontSize: 12,
                              lineHeight: 1.5,
                              color: "var(--ink)",
                            }}
                          >
                            {report.details}
                          </p>
                        )}

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            marginTop: 10,
                            fontSize: 11,
                            fontFamily: "var(--mono)",
                            color: "var(--slate)",
                          }}
                        >
                          <span>
                            {report.reporter_email
                              ? `Reporter: ${report.reporter_email}`
                              : "Anonymous student"}
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
                    style={{
                      padding: "20px 16px",
                      borderRadius: 10,
                      background: "var(--sand)",
                      border: "1px dashed var(--border)",
                      textAlign: "center",
                      color: "var(--slate)",
                      fontSize: 12,
                    }}
                  >
                    <CheckCircle2
                      size={20}
                      color="#2f7c57"
                      style={{ margin: "0 auto 6px", display: "block" }}
                    />
                    No issue reports for this paper. Everything is in good
                    standing!
                  </div>
                )}
              </div>
            </section>
          </article>

          {/* Sidebar Column: All Metadata Controls */}
          <aside
            className="detail-sidebar"
            style={{ display: "flex", flexDirection: "column", gap: 20 }}
          >
            {/* Status & Quick Actions Card */}
            <div className="sidebar-card">
              <small className="sidebar-label">PUBLICATION STATUS</small>
              <div style={{ display: "grid", gap: 12, marginTop: 10 }}>
                <Dropdown
                  label="Catalog Status"
                  value={status}
                  onChange={(val) => setStatus(val as PaperDetail["status"])}
                  options={[
                    { value: "review", label: "Pending Review" },
                    { value: "approved", label: "Approved & Live" },
                    { value: "hidden", label: "Hidden from Archive" },
                    { value: "soft_delete", label: "Soft Deleted" },
                  ]}
                />

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 8,
                    marginTop: 4,
                  }}
                >
                  {status !== "approved" && (
                    <button
                      type="button"
                      className="button button-primary"
                      onClick={() => handleSave("approved")}
                      disabled={saving}
                      style={{ fontSize: 11 }}
                    >
                      <Check size={13} /> Approve
                    </button>
                  )}
                  {status !== "review" && (
                    <button
                      type="button"
                      className="button button-soft"
                      onClick={() => handleSave("review")}
                      disabled={saving}
                      style={{ fontSize: 11 }}
                    >
                      Hold for review
                    </button>
                  )}
                  {status !== "hidden" && (
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={() => handleSave("hidden")}
                      disabled={saving}
                      style={{ fontSize: 11 }}
                    >
                      Hide paper
                    </button>
                  )}
                  {status !== "soft_delete" && (
                    <button
                      type="button"
                      className="button button-ghost"
                      onClick={handleSoftDelete}
                      disabled={saving}
                      style={{
                        fontSize: 11,
                        color: "#b04c3d",
                        borderColor: "#b04c3d40",
                      }}
                    >
                      <Trash2 size={13} /> Soft delete
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Taxonomy & Hierarchy Matrix */}
            <div className="sidebar-card">
              <small className="sidebar-label">CURRICULUM & TAXONOMY</small>
              <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
                <Dropdown
                  label="Education Board"
                  value={String(boardId)}
                  onChange={(val) => handleBoardChange(Number(val))}
                  options={boards.map((b) => ({
                    value: String(b.id),
                    label: `${b.code} — ${b.name}`,
                  }))}
                />

                <Dropdown
                  label="Class Level"
                  value={String(classLevelId)}
                  onChange={(val) => handleClassLevelChange(Number(val))}
                  options={classLevelOptions}
                />

                <Dropdown
                  label="Subject"
                  value={String(subjectId)}
                  onChange={(val) => setSubjectId(Number(val))}
                  options={subjectOptions}
                />

                <Dropdown
                  label="Resource Format"
                  value={String(resourceTypeId)}
                  onChange={(val) => setResourceTypeId(Number(val))}
                  options={resourceTypeOptions}
                />
              </div>
            </div>

            {/* Exam Parameters Card */}
            <div className="sidebar-card">
              <small className="sidebar-label">EXAM PARAMETERS</small>
              <div style={{ display: "grid", gap: 14, marginTop: 12 }}>
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontFamily: "var(--mono)",
                      color: "var(--slate)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    Exam Year
                  </label>
                  <input
                    type="number"
                    min={1900}
                    max={2100}
                    value={year}
                    onChange={(e) => setYear(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--sand)",
                      color: "var(--ink)",
                      fontSize: 13,
                      fontFamily: "var(--mono)",
                      outline: "none",
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontFamily: "var(--mono)",
                      color: "var(--slate)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    Pacing Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={duration}
                    onChange={(e) => setDuration(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--sand)",
                      color: "var(--ink)",
                      fontSize: 13,
                      fontFamily: "var(--mono)",
                      outline: "none",
                    }}
                  />
                  <small
                    style={{
                      color: "var(--slate)",
                      fontSize: 10,
                      marginTop: 4,
                      display: "block",
                    }}
                  >
                    Approx.{" "}
                    {duration >= 60
                      ? `${(duration / 60).toFixed(1)} hrs`
                      : `${duration} mins`}
                  </small>
                </div>

                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: 10,
                      fontFamily: "var(--mono)",
                      color: "var(--slate)",
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                      marginBottom: 6,
                    }}
                  >
                    Download Count
                  </label>
                  <input
                    type="number"
                    min={0}
                    value={downloads}
                    onChange={(e) => setDownloads(Number(e.target.value))}
                    style={{
                      width: "100%",
                      padding: "10px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--sand)",
                      color: "var(--ink)",
                      fontSize: 13,
                      fontFamily: "var(--mono)",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Storage & Metadata Specs Card */}
            <div className="sidebar-card specs-card">
              <small className="sidebar-label">FILE SYSTEM & AUDIT</small>
              <dl className="specs-list" style={{ marginTop: 12 }}>
                <div className="spec-row">
                  <dt>Paper ID</dt>
                  <dd
                    style={{ font: "10px var(--mono)", wordBreak: "break-all" }}
                  >
                    {paper.id}
                  </dd>
                </div>
                <div className="spec-row">
                  <dt>File Size</dt>
                  <dd>
                    <strong>{formatFileSize(paper.file_size_bytes)}</strong>
                  </dd>
                </div>
                <div className="spec-row">
                  <dt>Storage Path</dt>
                  <dd
                    style={{ font: "9px var(--mono)", wordBreak: "break-all" }}
                  >
                    {paper.file_path}
                  </dd>
                </div>
                <div className="spec-row">
                  <dt>Catalogued</dt>
                  <dd>{formatDate(paper.created_at)}</dd>
                </div>
              </dl>

              <div
                style={{
                  marginTop: 18,
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <a
                  className="button button-soft"
                  href={downloadUrl}
                  download
                  style={{ width: "100%" }}
                >
                  <Download size={14} /> Download Original PDF
                </a>
              </div>
            </div>
          </aside>
        </div>
      </main>

      {showUnsavedModal && (
        <Modal
          title="Unsaved Changes"
          eyebrow="STUDIO WARNING"
          onClose={() => setShowUnsavedModal(false)}
        >
          <div style={{ padding: "8px 0" }}>
            <p
              style={{
                margin: "0 0 20px",
                color: "var(--slate)",
                fontSize: 14,
                lineHeight: 1.5,
              }}
            >
              You have unsaved changes in this paper studio. Leaving now without
              saving will discard any edits you made.
            </p>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                flexWrap: "wrap",
              }}
            >
              <button
                type="button"
                className="button button-ghost"
                onClick={() => setShowUnsavedModal(false)}
              >
                Keep Editing
              </button>
              <button
                type="button"
                className="button button-soft"
                style={{ color: "#b04c3d", borderColor: "#b04c3d40" }}
                onClick={() => {
                  setShowUnsavedModal(false);
                  router.push(pendingNav || "/admin");
                }}
              >
                Discard & Leave
              </button>
              <button
                type="button"
                className="button button-dark"
                onClick={async () => {
                  const success = await handleSave();
                  if (success) {
                    setShowUnsavedModal(false);
                    router.push(pendingNav || "/admin");
                  }
                }}
              >
                <Save size={14} /> Save & Leave
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
