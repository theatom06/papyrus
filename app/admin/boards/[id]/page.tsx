"use client";

import "@/app/admin/style.css";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Check,
  ChevronDown,
  ExternalLink,
  FolderKanban,
  GraduationCap,
  Layers,
  Moon,
  Pencil,
  Plus,
  Save,
  Sun,
  Trash2,
  X,
  Palette,
} from "lucide-react";
import { apiRequest } from "@/lib/api-client";
import { Modal } from "@/components/modal";
import { useToast } from "@/components/toast";

type Subject = {
  id: number;
  name: string;
  slug?: string;
  accent_color?: string;
  class_level_id: number;
};

type ClassLevel = {
  id: number;
  name: string;
  slug?: string;
};

type ResourceType = {
  id: number;
  name: string;
};

type Board = {
  id: number;
  name: string;
  code: string;
  class_count: number;
  paper_count: number;
  classLevels: ClassLevel[];
  subjects: Subject[];
  types: ResourceType[];
};

const PRESET_ACCENT_COLORS = [
  { name: "Papyrus Amber", hex: "#c97732" },
  { name: "Rust Terracotta", hex: "#a85d20" },
  { name: "Crimson Rose", hex: "#b04c3d" },
  { name: "Emerald Green", hex: "#2f7c57" },
  { name: "Deep Forest", hex: "#1e5631" },
  { name: "Ocean Teal", hex: "#1e7b85" },
  { name: "Royal Cobalt", hex: "#28559a" },
  { name: "Indigo Night", hex: "#4355b9" },
  { name: "Imperial Violet", hex: "#794eb3" },
  { name: "Slate Charcoal", hex: "#40515b" },
];

export default function AdminBoardDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const boardId = Number(id);
  const { showToast } = useToast();

  const [board, setBoard] = useState<Board | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dark, setDark] = useState(false);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // Board details edit state
  const [editingBoard, setEditingBoard] = useState(false);
  const [boardName, setBoardName] = useState("");
  const [boardCode, setBoardCode] = useState("");

  // Class level states
  const [addingClassLevel, setAddingClassLevel] = useState(false);
  const [newClassLevelName, setNewClassLevelName] = useState("");
  const [editingClassLevelId, setEditingClassLevelId] = useState<number | null>(
    null,
  );
  const [editClassLevelName, setEditClassLevelName] = useState("");

  // Subject states
  const [addingSubjectForLevel, setAddingSubjectForLevel] = useState<
    number | null
  >(null);
  const [newSubjectName, setNewSubjectName] = useState("");
  const [newSubjectAccent, setNewSubjectAccent] = useState("#c97732");

  const [editingSubjectId, setEditingSubjectId] = useState<number | null>(null);
  const [editSubjectName, setEditSubjectName] = useState("");
  const [editSubjectAccent, setEditSubjectAccent] = useState("#c97732");

  // Resource type states
  const [addingType, setAddingType] = useState(false);
  const [newTypeName, setNewTypeName] = useState("");
  const [editingTypeId, setEditingTypeId] = useState<number | null>(null);
  const [editTypeName, setEditTypeName] = useState("");

  const isDirty = useMemo(() => {
    if (
      editingBoard &&
      (boardName.trim() !== (board?.name || "") ||
        boardCode.trim() !== (board?.code || ""))
    ) {
      return true;
    }
    if (addingClassLevel && newClassLevelName.trim() !== "") return true;
    if (editingClassLevelId !== null) return true;
    if (addingSubjectForLevel !== null && newSubjectName.trim() !== "")
      return true;
    if (editingSubjectId !== null) return true;
    if (addingType && newTypeName.trim() !== "") return true;
    if (editingTypeId !== null) return true;
    return false;
  }, [
    editingBoard,
    boardName,
    boardCode,
    board,
    addingClassLevel,
    newClassLevelName,
    editingClassLevelId,
    addingSubjectForLevel,
    newSubjectName,
    editingSubjectId,
    addingType,
    newTypeName,
    editingTypeId,
  ]);

  useEffect(() => {
    const saved = localStorage.getItem("papyrus-admin-theme") === "dark";
    setDark(saved);
    document.documentElement.classList.toggle("admin-dark", saved);
    loadBoard();
  }, [boardId]);

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

  function toggleDarkMode() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("admin-dark", next);
    localStorage.setItem("papyrus-admin-theme", next ? "dark" : "light");
  }

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiRequest<{ board: Board }>(`/api/boards/${boardId}`);
      setBoard(data.board);
      setBoardName(data.board.name);
      setBoardCode(data.board.code);
      setError("");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Could not load board.",
      );
    } finally {
      setLoading(false);
    }
  }, [boardId]);

  function notify(type: "success" | "error", message: string) {
    showToast(message, type);
  }

  // --- Board Details Actions ---
  async function saveBoardDetails() {
    const name = boardName.trim();
    const code = boardCode.trim().toUpperCase();
    if (!name || !code) {
      notify("error", "Board name and code are required.");
      return;
    }
    try {
      await apiRequest(`/api/boards/${boardId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, code }),
      });
      setEditingBoard(false);
      notify("success", "Board details updated.");
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Failed to update board.",
      );
    }
  }

  // --- Class Level Actions ---
  async function addClassLevel() {
    const name = newClassLevelName.trim();
    if (!name) return;
    try {
      await apiRequest(`/api/boards/${boardId}/class-levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setAddingClassLevel(false);
      setNewClassLevelName("");
      notify("success", `Class level “${name}” created.`);
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Failed to create class level.",
      );
    }
  }

  async function saveClassLevel(levelId: number) {
    const name = editClassLevelName.trim();
    if (!name) return;
    try {
      await apiRequest(`/api/class-levels/${levelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setEditingClassLevelId(null);
      notify("success", "Class level name updated.");
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Failed to update class level.",
      );
    }
  }

  async function deleteClassLevel(levelId: number, levelName: string) {
    if (
      !confirm(`Delete grade level “${levelName}” and all subjects under it?`)
    )
      return;
    try {
      await apiRequest(`/api/class-levels/${levelId}`, { method: "DELETE" });
      notify("success", `Class level “${levelName}” deleted.`);
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : "Cannot delete class level while papers reference it.",
      );
    }
  }

  // --- Subject Actions ---
  async function addSubject(levelId: number) {
    const name = newSubjectName.trim();
    if (!name) return;
    try {
      await apiRequest(`/api/class-levels/${levelId}/subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accent_color: newSubjectAccent }),
      });
      setAddingSubjectForLevel(null);
      setNewSubjectName("");
      setNewSubjectAccent("#c97732");
      notify("success", `Subject “${name}” added.`);
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Failed to create subject.",
      );
    }
  }

  async function saveSubject(subjectId: number) {
    const name = editSubjectName.trim();
    if (!name) return;
    try {
      await apiRequest(`/api/subjects/${subjectId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, accent_color: editSubjectAccent }),
      });
      setEditingSubjectId(null);
      notify("success", "Subject updated.");
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Failed to update subject.",
      );
    }
  }

  async function deleteSubject(subjectId: number, subjectName: string) {
    if (!confirm(`Delete subject “${subjectName}”?`)) return;
    try {
      await apiRequest(`/api/subjects/${subjectId}`, { method: "DELETE" });
      notify("success", `Subject “${subjectName}” deleted.`);
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : "Cannot delete subject while papers reference it.",
      );
    }
  }

  // --- Resource Type Actions ---
  async function addResourceType() {
    const name = newTypeName.trim();
    if (!name) return;
    try {
      await apiRequest(`/api/boards/${boardId}/resource-types`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setAddingType(false);
      setNewTypeName("");
      notify("success", `Resource type “${name}” added.`);
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Failed to add resource type.",
      );
    }
  }

  async function saveResourceType(typeId: number) {
    const name = editTypeName.trim();
    if (!name) return;
    try {
      await apiRequest(`/api/resource-types/${typeId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      setEditingTypeId(null);
      notify("success", "Resource type updated.");
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error ? err.message : "Failed to update resource type.",
      );
    }
  }

  async function deleteResourceType(typeId: number, typeName: string) {
    if (!confirm(`Delete resource type “${typeName}”?`)) return;
    try {
      await apiRequest(`/api/resource-types/${typeId}`, { method: "DELETE" });
      notify("success", `Resource type “${typeName}” deleted.`);
      await loadBoard();
    } catch (err) {
      notify(
        "error",
        err instanceof Error
          ? err.message
          : "Cannot delete resource type while papers reference it.",
      );
    }
  }

  if (loading) {
    return (
      <div
        className="admin-app"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <p style={{ color: "var(--slate)", font: "500 14px var(--mono)" }}>
          Loading board management studio...
        </p>
      </div>
    );
  }

  if (!board || error) {
    return (
      <div
        className="admin-app"
        style={{ minHeight: "100vh", display: "grid", placeItems: "center" }}
      >
        <div style={{ textAlign: "center" }}>
          <h2>{error || "Board not found"}</h2>
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

  return (
    <div className="admin-app" style={{ display: "block", minHeight: "100vh" }}>
      {/* Top Header */}
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
              }
            }}
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mobile-kicker" style={{ padding: 0 }}>
                PAPYRUS / ADMIN / BOARDS
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "var(--mono)",
                  padding: "2px 8px",
                  borderRadius: 6,
                  fontWeight: 700,
                  background:
                    "color-mix(in srgb, var(--amber) 15%, var(--linen))",
                  color: "var(--amber-dark)",
                  border:
                    "1px solid color-mix(in srgb, var(--amber) 30%, transparent)",
                }}
              >
                {board.code}
              </span>
            </div>
            <h1 style={{ margin: "4px 0 0", fontSize: 22 }}>{board.name}</h1>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Link
            href={`/archive?board=${encodeURIComponent(board.code)}`}
            target="_blank"
            className="button button-soft"
            title="View papers for this board in archive"
          >
            <ExternalLink size={14} /> View in Archive
          </Link>
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

      {/* Main Container */}
      <main
        style={{ padding: "32px 4.5vw 80px", maxWidth: 1300, margin: "0 auto" }}
      >
        {/* Board Overview Card */}
        <section
          style={{
            background: "var(--linen)",
            border: "1px solid var(--border)",
            borderRadius: 16,
            padding: "24px 28px",
            boxShadow: "0 4px 18px var(--card-shadow)",
            marginBottom: 32,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            <div>
              <span
                style={{
                  fontSize: 10,
                  fontFamily: "var(--mono)",
                  color: "var(--slate)",
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                BOARD CONFIGURATION
              </span>
              <h2
                style={{ margin: "4px 0 8px", font: "600 24px var(--serif)" }}
              >
                {board.name}
              </h2>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  fontSize: 12,
                  color: "var(--slate)",
                }}
              >
                <span>
                  Code:{" "}
                  <strong
                    style={{ color: "var(--ink)", fontFamily: "var(--mono)" }}
                  >
                    {board.code}
                  </strong>
                </span>
                <span>•</span>
                <span>{board.classLevels.length} Grade Levels</span>
                <span>•</span>
                <span>{board.subjects.length} Subjects</span>
                <span>•</span>
                <span>{board.paper_count} Papers in Catalog</span>
              </div>
            </div>

            {editingBoard ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  flexWrap: "wrap",
                }}
              >
                <input
                  value={boardName}
                  onChange={(e) => setBoardName(e.target.value)}
                  placeholder="Board name"
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--sand)",
                    color: "var(--ink)",
                    fontSize: 13,
                    minWidth: 240,
                  }}
                  autoFocus
                />
                <input
                  value={boardCode}
                  onChange={(e) => setBoardCode(e.target.value.toUpperCase())}
                  placeholder="Short code (e.g. CBSE)"
                  style={{
                    padding: "9px 12px",
                    borderRadius: 8,
                    border: "1px solid var(--border)",
                    background: "var(--sand)",
                    color: "var(--ink)",
                    fontSize: 13,
                    width: 110,
                    textTransform: "uppercase",
                    fontFamily: "var(--mono)",
                  }}
                />
                <button
                  type="button"
                  className="button button-dark"
                  onClick={saveBoardDetails}
                >
                  <Save size={14} /> Save
                </button>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => {
                    setEditingBoard(false);
                    setBoardName(board.name);
                    setBoardCode(board.code);
                  }}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="button button-soft"
                onClick={() => setEditingBoard(true)}
              >
                <Pencil size={14} /> Edit Board Details
              </button>
            )}
          </div>
        </section>

        {/* Two-Column Grid: Left = Class Levels & Subjects, Right = Resource Types */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 2fr) minmax(320px, 1fr)",
            gap: 32,
          }}
        >
          {/* Left Column: Grade Levels & Subjects */}
          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: 0, font: "600 20px var(--serif)" }}>
                  Grade Levels & Subjects
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: "var(--slate)",
                  }}
                >
                  Organize curriculum subjects and color accents under each
                  grade level.
                </p>
              </div>
              {!addingClassLevel && (
                <button
                  type="button"
                  className="button button-dark"
                  onClick={() => setAddingClassLevel(true)}
                >
                  <Plus size={14} /> New Grade Level
                </button>
              )}
            </div>

            {/* Add Class Level Card */}
            {addingClassLevel && (
              <div
                style={{
                  background: "var(--linen)",
                  border: "2px dashed var(--amber)",
                  borderRadius: 14,
                  padding: 20,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 12px",
                    fontSize: 14,
                    font: "600 14px var(--sans)",
                  }}
                >
                  Add Grade / Class Level
                </h4>
                <div style={{ display: "flex", gap: 10 }}>
                  <input
                    value={newClassLevelName}
                    onChange={(e) => setNewClassLevelName(e.target.value)}
                    placeholder="e.g. Grade 10 or Class 12"
                    style={{
                      flex: 1,
                      padding: "9px 12px",
                      borderRadius: 8,
                      border: "1px solid var(--border)",
                      background: "var(--sand)",
                      color: "var(--ink)",
                      fontSize: 13,
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addClassLevel();
                    }}
                  />
                  <button
                    type="button"
                    className="button button-dark"
                    onClick={addClassLevel}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => {
                      setAddingClassLevel(false);
                      setNewClassLevelName("");
                    }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Class Levels List */}
            {board.classLevels.length === 0 ? (
              <div
                style={{
                  padding: "48px 20px",
                  textAlign: "center",
                  background: "var(--linen)",
                  borderRadius: 14,
                  border: "1px dashed var(--border)",
                  color: "var(--slate)",
                  fontSize: 13,
                }}
              >
                No grade levels added yet. Click &quot;New Grade Level&quot;
                above to begin.
              </div>
            ) : (
              board.classLevels.map((level) => {
                const levelSubjects = board.subjects.filter(
                  (s) => s.class_level_id === level.id,
                );
                const isEditingThisLevel = editingClassLevelId === level.id;
                const isAddingSubject = addingSubjectForLevel === level.id;

                return (
                  <div
                    key={level.id}
                    style={{
                      background: "var(--linen)",
                      border: "1px solid var(--border)",
                      borderRadius: 14,
                      padding: 22,
                      boxShadow: "0 2px 12px var(--card-shadow)",
                    }}
                  >
                    {/* Level Header */}
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        paddingBottom: 16,
                        borderBottom: "1px solid var(--border)",
                        marginBottom: 16,
                      }}
                    >
                      {isEditingThisLevel ? (
                        <div
                          style={{
                            display: "flex",
                            gap: 8,
                            flex: 1,
                            maxWidth: 360,
                          }}
                        >
                          <input
                            value={editClassLevelName}
                            onChange={(e) =>
                              setEditClassLevelName(e.target.value)
                            }
                            style={{
                              flex: 1,
                              padding: "6px 10px",
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                              background: "var(--sand)",
                              color: "var(--ink)",
                              fontSize: 13,
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveClassLevel(level.id);
                            }}
                          />
                          <button
                            type="button"
                            className="button button-dark"
                            onClick={() => saveClassLevel(level.id)}
                            style={{ padding: "6px 12px", fontSize: 11 }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="button button-ghost"
                            onClick={() => setEditingClassLevelId(null)}
                            style={{ padding: "6px 10px", fontSize: 11 }}
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <GraduationCap
                            size={18}
                            style={{ color: "var(--amber-dark)" }}
                          />
                          <h4
                            style={{ margin: 0, font: "600 17px var(--serif)" }}
                          >
                            {level.name}
                          </h4>
                          <span
                            style={{
                              fontSize: 10,
                              fontFamily: "var(--mono)",
                              color: "var(--slate)",
                              background: "var(--sand)",
                              padding: "2px 7px",
                              borderRadius: 99,
                            }}
                          >
                            {levelSubjects.length} subjects
                          </span>
                        </div>
                      )}

                      {!isEditingThisLevel && (
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => {
                              setEditingClassLevelId(level.id);
                              setEditClassLevelName(level.name);
                            }}
                            title="Rename grade level"
                          >
                            <Pencil size={13} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() =>
                              deleteClassLevel(level.id, level.name)
                            }
                            title="Delete grade level"
                            style={{ color: "#b04c3d" }}
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Subjects Grid */}
                    <div style={{ display: "grid", gap: 10 }}>
                      {levelSubjects.length === 0 ? (
                        <p
                          style={{
                            margin: "6px 0 12px",
                            fontSize: 12,
                            color: "var(--slate)",
                            fontStyle: "italic",
                          }}
                        >
                          No subjects listed under {level.name}.
                        </p>
                      ) : (
                        levelSubjects.map((subject) => {
                          const isEditingThisSubject =
                            editingSubjectId === subject.id;
                          const subjectAccent =
                            subject.accent_color || "#c97732";

                          if (isEditingThisSubject) {
                            return (
                              <div
                                key={subject.id}
                                style={{
                                  background: "var(--sand)",
                                  border: "1px solid var(--border)",
                                  borderRadius: 10,
                                  padding: 14,
                                  display: "grid",
                                  gap: 12,
                                }}
                              >
                                <div
                                  style={{
                                    display: "flex",
                                    gap: 10,
                                    alignItems: "center",
                                  }}
                                >
                                  <input
                                    value={editSubjectName}
                                    onChange={(e) =>
                                      setEditSubjectName(e.target.value)
                                    }
                                    placeholder="Subject name"
                                    style={{
                                      flex: 1,
                                      padding: "8px 10px",
                                      borderRadius: 6,
                                      border: "1px solid var(--border)",
                                      background: "var(--linen)",
                                      color: "var(--ink)",
                                      fontSize: 13,
                                    }}
                                    autoFocus
                                  />
                                  <div
                                    style={{
                                      display: "flex",
                                      alignItems: "center",
                                      gap: 6,
                                    }}
                                  >
                                    <label
                                      style={{
                                        display: "inline-flex",
                                        alignItems: "center",
                                        gap: 6,
                                        fontSize: 11,
                                        fontFamily: "var(--mono)",
                                        color: "var(--slate)",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <span>Accent:</span>
                                      <input
                                        type="color"
                                        value={editSubjectAccent}
                                        onChange={(e) =>
                                          setEditSubjectAccent(e.target.value)
                                        }
                                        style={{
                                          width: 28,
                                          height: 28,
                                          padding: 0,
                                          border: "1px solid var(--border)",
                                          borderRadius: 6,
                                          cursor: "pointer",
                                          background: "transparent",
                                        }}
                                      />
                                    </label>
                                  </div>
                                </div>

                                {/* Color Swatches */}
                                <div>
                                  <small
                                    style={{
                                      display: "block",
                                      fontSize: 10,
                                      fontFamily: "var(--mono)",
                                      color: "var(--slate)",
                                      marginBottom: 6,
                                    }}
                                  >
                                    RECOMMENDED ACCENT PALETTES
                                  </small>
                                  <div
                                    style={{
                                      display: "flex",
                                      gap: 6,
                                      flexWrap: "wrap",
                                    }}
                                  >
                                    {PRESET_ACCENT_COLORS.map((col) => (
                                      <button
                                        key={col.hex}
                                        type="button"
                                        onClick={() =>
                                          setEditSubjectAccent(col.hex)
                                        }
                                        title={col.name}
                                        style={{
                                          width: 22,
                                          height: 22,
                                          borderRadius: 4,
                                          background: col.hex,
                                          border:
                                            editSubjectAccent.toLowerCase() ===
                                            col.hex.toLowerCase()
                                              ? "2px solid var(--ink)"
                                              : "1px solid rgba(0,0,0,0.15)",
                                          cursor: "pointer",
                                          transform:
                                            editSubjectAccent.toLowerCase() ===
                                            col.hex.toLowerCase()
                                              ? "scale(1.15)"
                                              : "none",
                                        }}
                                      />
                                    ))}
                                  </div>
                                </div>

                                <div
                                  style={{
                                    display: "flex",
                                    gap: 8,
                                    justifyContent: "flex-end",
                                  }}
                                >
                                  <button
                                    type="button"
                                    className="button button-dark"
                                    onClick={() => saveSubject(subject.id)}
                                    style={{
                                      padding: "6px 14px",
                                      fontSize: 11,
                                    }}
                                  >
                                    Save
                                  </button>
                                  <button
                                    type="button"
                                    className="button button-ghost"
                                    onClick={() => setEditingSubjectId(null)}
                                    style={{
                                      padding: "6px 12px",
                                      fontSize: 11,
                                    }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            );
                          }

                          return (
                            <div
                              key={subject.id}
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "10px 14px",
                                background: "var(--sand)",
                                borderRadius: 8,
                                border: "1px solid var(--border)",
                              }}
                            >
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 10,
                                }}
                              >
                                <span
                                  style={{
                                    width: 14,
                                    height: 14,
                                    borderRadius: "50%",
                                    background: subjectAccent,
                                    flexShrink: 0,
                                    boxShadow: `0 0 0 3px color-mix(in srgb, ${subjectAccent} 25%, transparent)`,
                                  }}
                                  title={`Accent color: ${subjectAccent}`}
                                />
                                <strong
                                  style={{ fontSize: 13, color: "var(--ink)" }}
                                >
                                  {subject.name}
                                </strong>
                                <span
                                  style={{
                                    fontSize: 10,
                                    fontFamily: "var(--mono)",
                                    color: "var(--slate)",
                                  }}
                                >
                                  {subjectAccent}
                                </span>
                              </div>

                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 6,
                                }}
                              >
                                <button
                                  type="button"
                                  className="icon-button"
                                  style={{ width: 28, height: 28 }}
                                  onClick={() => {
                                    setEditingSubjectId(subject.id);
                                    setEditSubjectName(subject.name);
                                    setEditSubjectAccent(subjectAccent);
                                  }}
                                  title="Edit subject and accent color"
                                >
                                  <Pencil size={12} />
                                </button>
                                <button
                                  type="button"
                                  className="icon-button"
                                  style={{
                                    width: 28,
                                    height: 28,
                                    color: "#b04c3d",
                                  }}
                                  onClick={() =>
                                    deleteSubject(subject.id, subject.name)
                                  }
                                  title="Delete subject"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}

                      {/* Add Subject Section */}
                      {isAddingSubject ? (
                        <div
                          style={{
                            background: "var(--sand)",
                            border: "1px dashed var(--amber)",
                            borderRadius: 10,
                            padding: 14,
                            marginTop: 6,
                            display: "grid",
                            gap: 12,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              gap: 10,
                              alignItems: "center",
                            }}
                          >
                            <input
                              value={newSubjectName}
                              onChange={(e) =>
                                setNewSubjectName(e.target.value)
                              }
                              placeholder="e.g. Physics or Chemistry"
                              style={{
                                flex: 1,
                                padding: "8px 12px",
                                borderRadius: 6,
                                border: "1px solid var(--border)",
                                background: "var(--linen)",
                                color: "var(--ink)",
                                fontSize: 13,
                              }}
                              autoFocus
                            />
                            <label
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                fontSize: 11,
                                fontFamily: "var(--mono)",
                                color: "var(--slate)",
                                cursor: "pointer",
                              }}
                            >
                              <span>Color:</span>
                              <input
                                type="color"
                                value={newSubjectAccent}
                                onChange={(e) =>
                                  setNewSubjectAccent(e.target.value)
                                }
                                style={{
                                  width: 28,
                                  height: 28,
                                  padding: 0,
                                  border: "1px solid var(--border)",
                                  borderRadius: 6,
                                  cursor: "pointer",
                                  background: "transparent",
                                }}
                              />
                            </label>
                          </div>

                          {/* Quick Swatches */}
                          <div
                            style={{
                              display: "flex",
                              gap: 6,
                              flexWrap: "wrap",
                            }}
                          >
                            {PRESET_ACCENT_COLORS.map((col) => (
                              <button
                                key={col.hex}
                                type="button"
                                onClick={() => setNewSubjectAccent(col.hex)}
                                title={col.name}
                                style={{
                                  width: 22,
                                  height: 22,
                                  borderRadius: 4,
                                  background: col.hex,
                                  border:
                                    newSubjectAccent.toLowerCase() ===
                                    col.hex.toLowerCase()
                                      ? "2px solid var(--ink)"
                                      : "1px solid rgba(0,0,0,0.15)",
                                  cursor: "pointer",
                                  transform:
                                    newSubjectAccent.toLowerCase() ===
                                    col.hex.toLowerCase()
                                      ? "scale(1.15)"
                                      : "none",
                                }}
                              />
                            ))}
                          </div>

                          <div
                            style={{
                              display: "flex",
                              gap: 8,
                              justifyContent: "flex-end",
                            }}
                          >
                            <button
                              type="button"
                              className="button button-dark"
                              onClick={() => addSubject(level.id)}
                              style={{ padding: "6px 14px", fontSize: 11 }}
                            >
                              Add Subject
                            </button>
                            <button
                              type="button"
                              className="button button-ghost"
                              onClick={() => {
                                setAddingSubjectForLevel(null);
                                setNewSubjectName("");
                              }}
                              style={{ padding: "6px 12px", fontSize: 11 }}
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="button button-ghost"
                          onClick={() => {
                            setAddingSubjectForLevel(level.id);
                            setNewSubjectName("");
                            setNewSubjectAccent("#c97732");
                          }}
                          style={{
                            marginTop: 4,
                            borderStyle: "dashed",
                            justifyContent: "center",
                            fontSize: 12,
                          }}
                        >
                          <Plus size={13} /> Add subject to {level.name}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Resource Types */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h3 style={{ margin: 0, font: "600 20px var(--serif)" }}>
                  Resource Formats
                </h3>
                <p
                  style={{
                    margin: "4px 0 0",
                    fontSize: 12,
                    color: "var(--slate)",
                  }}
                >
                  Paper categories available for {board.code}.
                </p>
              </div>
              {!addingType && (
                <button
                  type="button"
                  className="button button-soft"
                  onClick={() => setAddingType(true)}
                  style={{ padding: "6px 12px", fontSize: 11 }}
                >
                  <Plus size={13} /> New Type
                </button>
              )}
            </div>

            {/* Add Resource Type */}
            {addingType && (
              <div
                style={{
                  background: "var(--linen)",
                  border: "2px dashed var(--amber)",
                  borderRadius: 14,
                  padding: 16,
                }}
              >
                <h4
                  style={{
                    margin: "0 0 10px",
                    fontSize: 13,
                    font: "600 13px var(--sans)",
                  }}
                >
                  Add Resource Format
                </h4>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    value={newTypeName}
                    onChange={(e) => setNewTypeName(e.target.value)}
                    placeholder="e.g. Past Paper, Worksheet"
                    style={{
                      flex: 1,
                      padding: "8px 10px",
                      borderRadius: 6,
                      border: "1px solid var(--border)",
                      background: "var(--sand)",
                      color: "var(--ink)",
                      fontSize: 13,
                    }}
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addResourceType();
                    }}
                  />
                  <button
                    type="button"
                    className="button button-dark"
                    onClick={addResourceType}
                    style={{ padding: "6px 12px", fontSize: 11 }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className="button button-ghost"
                    onClick={() => {
                      setAddingType(false);
                      setNewTypeName("");
                    }}
                    style={{ padding: "6px 10px", fontSize: 11 }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Resource Types Card */}
            <div
              style={{
                background: "var(--linen)",
                border: "1px solid var(--border)",
                borderRadius: 14,
                padding: 18,
                boxShadow: "0 2px 12px var(--card-shadow)",
              }}
            >
              <div style={{ display: "grid", gap: 8 }}>
                {board.types.length === 0 ? (
                  <p style={{ margin: 0, fontSize: 12, color: "var(--slate)" }}>
                    No resource types registered yet.
                  </p>
                ) : (
                  board.types.map((type) => {
                    const isEditingThisType = editingTypeId === type.id;

                    if (isEditingThisType) {
                      return (
                        <div
                          key={type.id}
                          style={{ display: "flex", gap: 6, padding: "4px 0" }}
                        >
                          <input
                            value={editTypeName}
                            onChange={(e) => setEditTypeName(e.target.value)}
                            style={{
                              flex: 1,
                              padding: "6px 8px",
                              borderRadius: 6,
                              border: "1px solid var(--border)",
                              background: "var(--sand)",
                              color: "var(--ink)",
                              fontSize: 12,
                            }}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveResourceType(type.id);
                            }}
                          />
                          <button
                            type="button"
                            className="button button-dark"
                            onClick={() => saveResourceType(type.id)}
                            style={{ padding: "4px 8px", fontSize: 11 }}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            className="button button-ghost"
                            onClick={() => setEditingTypeId(null)}
                            style={{ padding: "4px 8px", fontSize: 11 }}
                          >
                            Cancel
                          </button>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={type.id}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          padding: "9px 12px",
                          background: "var(--sand)",
                          borderRadius: 8,
                          border: "1px solid var(--border)",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 8,
                          }}
                        >
                          <Layers
                            size={13}
                            style={{ color: "var(--amber-dark)" }}
                          />
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 500,
                              color: "var(--ink)",
                            }}
                          >
                            {type.name}
                          </span>
                        </div>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 4,
                          }}
                        >
                          <button
                            type="button"
                            className="icon-button"
                            style={{ width: 26, height: 26 }}
                            onClick={() => {
                              setEditingTypeId(type.id);
                              setEditTypeName(type.name);
                            }}
                            title="Rename resource type"
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            type="button"
                            className="icon-button"
                            style={{ width: 26, height: 26, color: "#b04c3d" }}
                            onClick={() =>
                              deleteResourceType(type.id, type.name)
                            }
                            title="Delete resource type"
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Quick Helper Card */}
            <div
              style={{
                background: "color-mix(in srgb, var(--amber) 8%, var(--linen))",
                border:
                  "1px solid color-mix(in srgb, var(--amber) 25%, var(--border))",
                borderRadius: 14,
                padding: 18,
              }}
            >
              <h4
                style={{
                  margin: "0 0 6px",
                  fontSize: 12,
                  font: "600 12px var(--mono)",
                  color: "var(--amber-dark)",
                }}
              >
                BOARD HIERARCHY RULES
              </h4>
              <p
                style={{
                  margin: 0,
                  fontSize: 11,
                  lineHeight: 1.55,
                  color: "var(--slate)",
                }}
              >
                Papers must reference a valid combination of Board → Grade Level
                → Subject and Resource Format. Deleting an item with active
                papers is restricted to prevent orphaned papers.
              </p>
            </div>
          </div>
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
              You have unsaved changes or active edits in this curriculum
              studio. Leaving now without saving will discard your changes.
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
                  router.push("/admin");
                }}
              >
                Discard & Leave
              </button>
              {editingBoard && (
                <button
                  type="button"
                  className="button button-dark"
                  onClick={async () => {
                    await saveBoardDetails();
                    setShowUnsavedModal(false);
                    router.push("/admin");
                  }}
                >
                  <Save size={14} /> Save & Leave
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
