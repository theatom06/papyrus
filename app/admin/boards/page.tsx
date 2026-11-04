"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Plus } from "lucide-react";
import AdminShell from "../components/admin-shell";
import Modal from "@/components/modal";
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
          className="button-primary"
          onClick={() => setShowBoardForm(true)}
          style={{ fontSize: 12, padding: "8px 14px" }}
        >
          <Plus size={14} /> New Board
        </button>
      }
    >
      <div className="mx-auto w-full max-w-[1035px] px-5 pb-24 pt-8 sm:px-[4.5vw]">
        <div className="mb-7 flex items-end justify-between gap-5 max-[720px]:flex-col max-[720px]:items-stretch">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.12em] text-amber">
              ARCHIVE HIERARCHY
            </div>
            <h2 className="mt-2 font-[Georgia] text-[29px] tracking-[-0.035em]">
              Curriculum Boards & Classes
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-6 text-slate">
              Control examination boards, grade levels, subjects, subject
              accents, and resource types.
            </p>
          </div>
          <button
            type="button"
            className="button-primary"
            onClick={() => setShowBoardForm(true)}
          >
            <Plus size={15} /> New Board
          </button>
        </div>

        {loading ? (
          <p className="p-12 text-center text-sm text-slate">
            Loading examination boards…
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {boards.map((board) => (
              <div
                className="flex cursor-pointer items-center gap-4 rounded-md border border-border-main bg-linen p-5 transition hover:border-amber"
                key={board.id}
                style={{ cursor: "pointer" }}
                onClick={() => router.push(`/admin/boards/${board.id}`)}
              >
                <div className="grid size-12 shrink-0 place-items-center rounded-md bg-amber/10 font-mono text-xs font-bold text-amber">
                  {board.code}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-[Georgia] text-base">{board.name}</h3>
                  <p className="mt-1 text-xs leading-5 text-slate">
                    {board.class_count} grade levels · {board.paper_count}{" "}
                    papers
                  </p>
                </div>
                <button
                  type="button"
                  className="grid size-8 place-items-center rounded-md border border-border-main text-slate hover:border-amber hover:text-amber"
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
          <form
            className="grid gap-4 rounded-md border border-border-main bg-linen p-5"
            onSubmit={handleCreateBoard}
          >
            <label className="text-xs font-medium">
              Board name
              <input
                className="mt-2 w-full rounded-md border border-border-main bg-sand px-3 py-2.5 text-sm text-ink outline-none focus:border-amber"
                name="name"
                placeholder="e.g. Cambridge Assessment International Education"
                required
              />
            </label>
            <label className="text-xs font-medium">
              Short code
              <input
                className="mt-2 w-full rounded-md border border-border-main bg-sand px-3 py-2.5 text-sm text-ink outline-none focus:border-amber"
                name="code"
                placeholder="e.g. CAIE"
                required
              />
            </label>
            <label className="text-xs font-medium">
              Initial class level
              <input
                className="mt-2 w-full rounded-md border border-border-main bg-sand px-3 py-2.5 text-sm text-ink outline-none focus:border-amber"
                name="className"
                placeholder="e.g. IGCSE, O-Level, A-Level"
              />
            </label>
            <label className="text-xs font-medium">
              Initial subject
              <input
                className="mt-2 w-full rounded-md border border-border-main bg-sand px-3 py-2.5 text-sm text-ink outline-none focus:border-amber"
                name="subjectName"
                placeholder="e.g. Mathematics, Physics"
              />
            </label>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                className="rounded-md border border-border-main px-3.5 py-2 text-xs text-ink hover:border-amber"
                onClick={() => setShowBoardForm(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="button-primary"
              >
                Create Board
              </button>
            </div>
          </form>
        </Modal>
      )}
    </AdminShell>
  );
}
