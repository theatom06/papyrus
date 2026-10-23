"use client";

import "./style.css";

import { useEffect, useMemo, useState } from "react";
import { Download, MoreHorizontal, Pencil, Plus, Trash2 } from "lucide-react";
import { EmptyState } from "@/components/empty-state";
import { ResourceCard } from "@/components/resource-card";
import type { Resource } from "@/components/resource";
import { useStorage } from "@/components/storage";
import { Layout } from "@/components/layout";
import { PageHeading } from "@/components/page-heading";
import { SearchBox } from "@/components/search-box";
import { Modal } from "@/components/modal";
import { PageTitle } from "@/components/page-title";
import { Dropdown } from "@/components/dropdown";
import { apiRequest } from "@/lib/api-client";

export default function PinsPage() {
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
  function addGroup() {
    setGroupDialog({ mode: "create" });
  }
  function renameGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);
    setOpenMenu(null);
    if (group) setGroupDialog({ mode: "rename", id: groupId });
  }
  function deleteGroup(groupId: string) {
    const group = groups.find((item) => item.id === groupId);
    if (!group) return;
    setOpenMenu(null);
    setGroupDialog({ mode: "delete", id: groupId });
  }
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
      <PageTitle title="Pins" />
      <main className="pins-page">
        <PageHeading
          kicker="YOUR PERSONAL SHELF"
          title={
            <>
              Keep what
              <br />
              <em>matters.</em>
            </>
          }
          description="Pin useful papers into groups and make your next study session easier to start."
        />
        <div className="pins-toolbar">
          <SearchBox
            value={query}
            onChange={setQuery}
            placeholder="Search your pins..."
          />
          <button className="button button-soft" onClick={addGroup}>
            <Plus size={14} /> New group
          </button>
          <div className="pins-sort">
            <span className="pins-sort-label">Sort</span>
            <Dropdown
              value={sort}
              onChange={setSort}
              options={[
                { value: "recent", label: "Recently pinned" },
                { value: "oldest", label: "Oldest pinned" },
                { value: "year", label: "Exam year" },
                { value: "title", label: "Title" },
                { value: "subject", label: "Subject" },
              ]}
            />
          </div>
        </div>
        <div className="groups">
          <div className="group-menu-wrap">
            <button
              className={`group-tab ${active === "all" ? "active" : ""}`}
              onClick={() => setActive("all")}
            >
              All pins<span>{pins.length} papers</span>
            </button>
            <button
              className="group-menu-trigger"
              type="button"
              aria-label="Manage all pins"
              onClick={() => setOpenMenu(openMenu === "all" ? null : "all")}
            >
              <MoreHorizontal size={15} />
            </button>
            <div className={`group-menu ${openMenu === "all" ? "open" : ""}`}>
              <button
                type="button"
                disabled={!pins.length}
                onClick={() => downloadAll()}
              >
                <Download size={13} /> Download all
              </button>
            </div>
          </div>
          {groups.map((group) => (
            <div className="group-menu-wrap" key={group.id}>
              <button
                className={`group-tab ${active === group.id ? "active" : ""}`}
                onClick={() => setActive(group.id)}
              >
                {group.name}
                <span>
                  {pins.filter((pin) => pin.groupId === group.id).length} papers
                </span>
              </button>
              <button
                className="group-menu-trigger"
                type="button"
                aria-label={`Manage ${group.name}`}
                onClick={() =>
                  setOpenMenu(openMenu === group.id ? null : group.id)
                }
              >
                <MoreHorizontal size={15} />
              </button>
              <div
                className={`group-menu ${openMenu === group.id ? "open" : ""}`}
              >
                <button
                  type="button"
                  disabled={!pins.some((pin) => pin.groupId === group.id)}
                  onClick={() => downloadAll(group.id)}
                >
                  <Download size={13} /> Download all
                </button>
                <button type="button" onClick={() => renameGroup(group.id)}>
                  <Pencil size={13} /> Rename group
                </button>
                <button type="button" onClick={() => deleteGroup(group.id)}>
                  <Trash2 size={13} /> Delete group
                </button>
              </div>
            </div>
          ))}
        </div>
        {pinnedResources.length ? (
          <div className="resource-grid">
            {pinnedResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <EmptyState
            title={query ? "No pinned papers match." : "Your shelf is empty."}
            description={
              query
                ? "Try a different search term or choose another group."
                : "Pin useful papers from the archive to keep them close."
            }
          />
        )}
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
              className="modal-form"
              onSubmit={(event) => {
                event.preventDefault();
                applyGroupDialog(
                  String(new FormData(event.currentTarget).get("name") || ""),
                );
              }}
            >
              <label>
                Group name
                <input
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
              <button className="button button-dark" type="submit">
                {groupDialog.mode === "create" ? "Create group" : "Save name"}
              </button>
            </form>
          ) : (
            <div className="modal-actions">
              <button
                className="button button-ghost"
                onClick={() => setGroupDialog(null)}
              >
                Cancel
              </button>
              <button
                className="button button-dark"
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
