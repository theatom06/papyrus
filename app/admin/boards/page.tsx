"use client";

import "@/app/admin/style.css";
import "./style.css";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import { AdminShell } from "../components/admin-shell";
import { Modal } from "@/components/modal";
import { apiRequest } from "@/lib/api-client";
import { useToast } from "@/components/toast";
import type { BoardOption } from "../components/types";

export default function AdminBoardsPage() {
  const router = useRouter();
  const { showToast } = useToast();
  const [boards, setBoards] = useState<BoardOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showBoardForm, setShowBoardForm] = useState(false);

  useEffect(() => {
    loadBoards();
  }, []);

  function loadBoards() {
    setLoading(true);
    apiRequest<{ boards?: BoardOption[] }>("/api/boards")
      .then((data) => setBoards(data.boards || []))
      .catch(() => showToast("Could not load examination boards.", "error"))
      .finally(() => setLoading(false));
  }

  async function handleCreateBoard(event: React.FormEvent<HTMLFormElement>) {
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
        "Board could not be added. Check name and short code.",
        "error",
      );
    }
  }

  return (
    <AdminShell
      title="Boards & Classes"
      active="Boards & classes"
      actions={
        <button
          type="button"
          className="button button-primary"
          onClick={() => setShowBoardForm(true)}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          <Plus size={14} /> New Board
        </button>
      }
    >
      <div className="dashboard-content">
        <div className="view-heading">
          <div>
            <div className="eyebrow">ARCHIVE HIERARCHY</div>
            <h2>Curriculum Boards & Classes</h2>
            <p>
              Control examination boards, grade levels, subjects, subject
              accents, and resource types.
            </p>
          </div>
          <button
            type="button"
            className="button button-primary"
            onClick={() => setShowBoardForm(true)}
          >
            <Plus size={15} /> New Board
          </button>
        </div>

        {loading ? (
          <p
            className="panel-empty"
            style={{ padding: 48, textAlign: "center", color: "var(--slate)" }}
          >
            Loading examination boards…
          </p>
        ) : (
          <div className="board-grid">
            {boards.map((board) => (
              <div
                className="board-card"
                key={board.id}
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/admin/boards/${board.id}`)}
              >
                <div className="board-mark">{board.code}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <h3>{board.name}</h3>
                  <p>
                    {board.class_count} grade levels · {board.paper_count}{" "}
                    papers
                  </p>
                </div>
                <button
                  type="button"
                  className="icon-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/admin/boards/${board.id}`);
                  }}
                  title={`Configure ${board.name}`}
                  aria-label={`Open ${board.name}`}
                >
                  <ArrowRight size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {showBoardForm && (
        <Modal
          title="Add a board"
          variant="form"
          eyebrow="PAPYRUS / ADMIN"
          onClose={() => setShowBoardForm(false)}
        >
          <form className="admin-form" onSubmit={handleCreateBoard}>
            <label>
              Board name
              <input
                name="name"
                placeholder="e.g. Cambridge Assessment International Education"
                required
              />
            </label>
            <label>
              Short code
              <input name="code" placeholder="e.g. CAIE" required />
            </label>
            <label>
              Initial class level
              <input
                name="className"
                placeholder="e.g. IGCSE, O-Level, A-Level"
              />
            </label>
            <label>
              Initial subject
              <input
                name="subjectName"
                placeholder="e.g. Mathematics, Physics"
              />
            </label>
            <div className="form-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setShowBoardForm(false)}
              >
                Cancel
              </button>
              <button type="submit" className="button button-primary">
                Create Board
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
