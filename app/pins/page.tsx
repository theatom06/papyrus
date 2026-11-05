"use client";

import { useEffect, useMemo, useState } from "react";
import { Download, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import EmptyState from "@/components/empty-state";
import ResourceCard from "@/components/resource-card";
import type { Resource } from "@/components/resource";
import { useStorage } from "@/components/storage";
import Layout from "@/components/layout";
import PageHeading from "@/components/page-heading";
import SearchBox from "@/components/search-box";
import Modal from "@/components/modal";
import Dropdown from "@/components/dropdown";
import { apiRequest } from "@/lib/api-client";
import calculateScore from "@/util/score";

export function PinsPage() {
  const { pins, groups, save } = useStorage();
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [sort, setSort] = useState("recent");
  const [groupDialog, setGroupDialog] = useState<{
    mode: "create" | "rename" | "delete";
    id?: string;
  } | null>(null);
  useEffect(() => {
    apiRequest<{ papers?: Array<Record<string, unknown>> }>("/api/papers")
      .then((data) =>
        setResources(
          (data.papers || []).map((paper) => ({
            id: String(paper.id),
            title: String(paper.title),
            subject: String(paper.subject),
            year: String(paper.year),
            board: String(paper.board),
            classLevel: String(paper.class_level),
            type: String(paper.type),
            downloads: Number(paper.downloads) || 0,
            upvotes: Number(paper.upvotes) || 0,
            downvotes: Number(paper.downvotes) || 0,
            createdAt: String(paper.created_at || ""),
            score: calculateScore(
              Number(paper.upvotes) || 0,
              Number(paper.downvotes) || 0,
              Number(paper.downloads) || 0,
              String(paper.created_at || new Date().toISOString()),
            ),
            read: paper.duration
              ? Number(paper.duration) >= 60
                ? `${Number(paper.duration) / 60} hrs`
                : `${paper.duration} min`
              : "Self-paced",
            summary: String(paper.description || ""),
            accentColor: String(paper.accent_color || ""),
          })),
        ),
      )
      .catch(() => setResources([]));
  }, []);

  const pinnedResources = useMemo(() => {
    const pinById = new Map(pins.map((pin) => [pin.id, pin]));
    return resources
      .filter(
        (resource) =>
          pinById.has(resource.id) &&
          (active === "all" || pinById.get(resource.id)?.groupId === active) &&
          resource.title.toLowerCase().includes(query.toLowerCase()),
      )
      .sort((left, right) => {
        if (sort === "title") return left.title.localeCompare(right.title);
        if (sort === "subject")
          return left.subject.localeCompare(right.subject);
        if (sort === "year") return Number(right.year) - Number(left.year);
        if (sort === "downloads") return right.downloads - left.downloads;
        if (sort === "score") return right.score - left.score;
        const pinnedDifference =
          (pinById.get(right.id)?.pinnedAt || 0) -
          (pinById.get(left.id)?.pinnedAt || 0);
        return sort === "oldest" ? -pinnedDifference : pinnedDifference;
      });
  }, [active, pins, query, resources, sort]);

  function downloadAll(groupId?: string) {
    const ids = pins
      .filter((pin) => !groupId || pin.groupId === groupId)
      .map((pin) => pin.id)
      .filter((id) => resources.some((resource) => resource.id === id));
    ids.forEach((id, index) => {
      window.setTimeout(() => {
        const link = document.createElement("a");
        link.href = `/api/papers/${encodeURIComponent(id)}/download`;
        link.download = "";
        document.body.appendChild(link);
        link.click();
        link.remove();
      }, index * 250);
    });
    setOpenMenu(null);
  }

  const renameGroup = (groupId: string) => {
    const group = groups.find((item) => item.id === groupId);
    setOpenMenu(null);
    if (group) setGroupDialog({ mode: "rename", id: groupId });
  };

  const deleteGroup = (groupId: string) => {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;
    setOpenMenu(null);
    setGroupDialog({ mode: "delete", id: groupId });
  };

  function applyGroupDialog(name?: string) {
    if (!groupDialog) return;
    if (groupDialog.mode === "create" && name?.trim()) {
      save(pins, [...groups, { id: `group-${Date.now()}`, name: name.trim() }]);
      setGroupDialog(null);
      return;
    }

    if (!groupDialog.id) return;
    const group = groups.find((item) => item.id === groupDialog.id);
    if (!group) return;
    if (groupDialog.mode === "rename" && name?.trim()) {
      save(
        pins,
        groups.map((item) =>
          item.id === group.id ? { ...item, name: name.trim() } : item,
        ),
      );
      setGroupDialog(null);
      return;
    }
    if (groupDialog.mode !== "delete") return;
    const groupId = group.id;
    const remaining = groups.filter((item) => item.id !== groupId);
    const fallback = remaining[0]?.id;
    save(
      pins
        .filter((pin) => pin.groupId !== groupId || !fallback)
        .map((pin) =>
          pin.groupId === groupId ? { ...pin, groupId: fallback! } : pin,
        ),
      remaining,
    );
    if (active === groupId) setActive("all");
    setGroupDialog(null);
  }

  return (
    <Layout>
      <main className="min-h-screen bg-sand text-ink">
        <section className="mx-auto w-full max-w-5xl px-5 pb-24 pt-12 sm:px-8 sm:pt-14">
          <PageHeading
            className="mx-0! max-w-155! px-0! pb-8! pt-0!"
            kicker="YOUR PERSONAL SHELF"
            title="Keep what"
            star="matters."
            description="Pin useful papers into groups and make your next study session easier to start."
          />
          <div className="rounded-xl border border-border-main bg-linen p-3 shadow-sm sm:p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
              <div className="min-w-0 flex-1">
                <SearchBox
                  value={query}
                  onChange={setQuery}
                  placeholder="Search your pins..."
                />
              </div>
              <div className="flex flex-wrap items-end gap-2">
                <button
                  className="inline-flex items-center gap-2 rounded-md border border-border-main bg-sand px-3 py-2 text-xs font-medium text-ink transition-colors hover:border-amber hover:text-amber"
                  onClick={() => setGroupDialog({ mode: "create" })}
                >
                  <Plus size={14} /> New group
                </button>
                <label className="grid gap-1 text-[10px] font-semibold uppercase tracking-wide text-slate">
                  Sort
                  <Dropdown
                    value={sort}
                    onChange={setSort}
                    options={[
                      { value: "recent", label: "Recently pinned" },
                      { value: "oldest", label: "Oldest pinned" },
                      { value: "year", label: "Exam year" },
                      { value: "title", label: "Title" },
                      { value: "subject", label: "Subject" },
                      { value: "downloads", label: "Most downloads" },
                      { value: "score", label: "Highest score" },
                    ]}
                  />
                </label>
              </div>
            </div>
          </div>
          <div className="mt-4 rounded-xl border border-border-main bg-linen p-3 shadow-sm sm:p-4">
            <div className="mb-3 flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-slate">Your groups</span>
              <span className="text-xs text-slate">{pins.length} pinned</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className="relative flex shrink-0">
                <button
                  className={`flex min-w-36 flex-col gap-1 rounded-l-md border px-3 py-2.5 text-left text-sm ${active === "all" ? "border-amber bg-amber/10 text-ink" : "border-border-main bg-sand text-slate"}`}
                  onClick={() => setActive("all")}
                >
                  All pins
                  <span className="font-mono text-[9px] text-slate">
                    {pins.length} papers
                  </span>
                </button>
                <button
                  className="min-w-9 rounded-r-md border border-l-0 border-border-main bg-sand text-slate transition hover:text-ink"
                  type="button"
                  aria-label="Manage all pins"
                  onClick={() => setOpenMenu(openMenu === "all" ? null : "all")}
                >
                  <MoreHorizontal size={15} />
                </button>
                <div
                  className={`absolute left-0 top-full z-30 mt-2 hidden min-w-40 rounded-md border border-border-main bg-linen p-1 shadow-xl ${openMenu === "all" ? "block!" : ""}`}
                >
                  <button
                    className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-slate hover:bg-sand disabled:opacity-40"
                    type="button"
                    disabled={!pins.length}
                    onClick={() => downloadAll()}
                  >
                    <Download size={13} /> Download all
                  </button>
                </div>
              </div>
              {groups.map((group) => (
                <div className="relative flex shrink-0" key={group.id}>
                  <button
                    className={`flex min-w-36 flex-col gap-1 rounded-l-md border px-3 py-2.5 text-left text-sm ${active === group.id ? "border-amber bg-amber/10 text-ink" : "border-border-main bg-sand text-slate"}`}
                    onClick={() => setActive(group.id)}
                  >
                    <span className="max-w-28 truncate">{group.name}</span>
                    <span className="font-mono text-[9px] text-slate">
                      {pins.filter((pin) => pin.groupId === group.id).length}{" "}
                      papers
                    </span>
                  </button>
                  <button
                    className="min-w-9 rounded-r-md border border-l-0 border-border-main bg-sand text-slate transition hover:text-ink"
                    type="button"
                    aria-label={`Manage ${group.name}`}
                    onClick={() =>
                      setOpenMenu(openMenu === group.id ? null : group.id)
                    }
                  >
                    <MoreHorizontal size={15} />
                  </button>
                  <div
                    className={`absolute left-0 top-full z-30 mt-2 hidden min-w-40 rounded-md border border-border-main bg-linen p-1 shadow-xl ${openMenu === group.id ? "block!" : ""}`}
                  >
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-slate hover:bg-sand disabled:opacity-40"
                      type="button"
                      disabled={!pins.some((pin) => pin.groupId === group.id)}
                      onClick={() => downloadAll(group.id)}
                    >
                      <Download size={13} /> Download all
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-slate hover:bg-sand"
                      type="button"
                      onClick={() => renameGroup(group.id)}
                    >
                      <Pencil size={13} /> Rename group
                    </button>
                    <button
                      className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-xs text-slate hover:bg-sand"
                      type="button"
                      onClick={() => deleteGroup(group.id)}
                    >
                      <Trash2 size={13} /> Delete group
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          {pinnedResources.length ? (
            <div className="mx-auto mt-6 grid w-full max-w-4xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {pinnedResources.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState
              className="mt-6 rounded-xl border border-dashed border-border-main bg-linen px-5 py-16 text-ink"
              title={query ? "No pinned papers match." : "Your shelf is empty."}
              description={
                query
                  ? "Try a different search term or choose another group."
                  : "Pin useful papers from the archive to keep them close."
              }
            />
          )}
        </section>
      </main>
      {groupDialog && (
        <Modal
          title={
            groupDialog.mode === "create"
              ? "Create pin group"
              : groupDialog.mode === "rename"
                ? "Rename pin group"
                : "Delete pin group"
          }
          eyebrow="YOUR PERSONAL SHELF"
          onClose={() => setGroupDialog(null)}
        >
          {groupDialog.mode === "create" || groupDialog.mode === "rename" ? (
            <form
              className="grid gap-4"
              onSubmit={(event) => {
                event.preventDefault();
                applyGroupDialog(
                  String(new FormData(event.currentTarget).get("name") || ""),
                );
              }}
            >
              <label className="grid gap-2 text-sm font-medium text-ink">
                Group name
                <input
                  className="rounded-md border border-border-main bg-sand px-3 py-2 text-sm text-ink outline-none focus:border-amber"
                  name="name"
                  autoFocus
                  required
                  defaultValue={
                    groupDialog.id
                      ? groups.find((item) => item.id === groupDialog.id)?.name
                      : undefined
                  }
                />
              </label>
              <button className="button-dark" type="submit">
                {groupDialog.mode === "create" ? "Create group" : "Save name"}
              </button>
            </form>
          ) : (
            <div className="flex justify-end gap-2">
              <button
                className="button-ghost"
                onClick={() => setGroupDialog(null)}
              >
                Cancel
              </button>
              <button
                className="button-dark"
                onClick={() => applyGroupDialog()}
              >
                Delete group
              </button>
            </div>
          )}
        </Modal>
      )}
    </Layout>
  );
}

export default PinsPage;
