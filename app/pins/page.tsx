"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import {
  ArchiveLayout,
  EmptyState,
  ResourceCard,
  type Resource,
  useArchiveStorage,
} from "@/components/archive-ui";

export default function PinsPage() {
  const { pins, groups, save } = useArchiveStorage();
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [resources, setResources] = useState<Resource[]>([]);
  useEffect(() => {
    fetch("/api/papers")
      .then((response) => response.json())
      .then((data: { papers?: Array<Record<string, unknown>> }) =>
        setResources(
          (data.papers || []).map((paper) => ({
            id: String(paper.id),
            title: String(paper.title),
            subject: String(paper.subject),
            year: String(paper.year),
            board: String(paper.board),
            classLevel: String(paper.class_level),
            type: String(paper.type),
            read: `${paper.duration} min`,
            summary: String(paper.description || ""),
          })),
        ),
      );
  }, []);
  const pinnedResources = useMemo(
    () =>
      resources.filter(
        (resource) =>
          pins.some(
            (pin) =>
              pin.id === resource.id &&
              (active === "all" || pin.groupId === active),
          ) && resource.title.toLowerCase().includes(query.toLowerCase()),
      ),
    [active, pins, query],
  );
  function addGroup() {
    const name = window.prompt("Name this pin group");
    if (name?.trim())
      save(pins, [...groups, { id: `group-${Date.now()}`, name: name.trim() }]);
  }
  return (
    <ArchiveLayout>
      <main className="pins-page">
        <p className="kicker">YOUR PERSONAL SHELF</p>
        <h1>
          Keep what
          <br />
          <em>matters.</em>
        </h1>
        <p className="lead">
          Pin useful papers into groups and make your next study session easier
          to start.
        </p>
        <div className="pins-toolbar">
          <label className="search-box">
            <Search size={15} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search your pins..."
            />
          </label>
          <button className="button button-soft" onClick={addGroup}>
            <Plus size={14} /> New group
          </button>
        </div>
        <div className="groups">
          <button
            className={`group-tab ${active === "all" ? "active" : ""}`}
            onClick={() => setActive("all")}
          >
            All pins<span>{pins.length} papers</span>
          </button>
          {groups.map((group) => (
            <button
              className={`group-tab ${active === group.id ? "active" : ""}`}
              key={group.id}
              onClick={() => setActive(group.id)}
            >
              {group.name}
              <span>
                {pins.filter((pin) => pin.groupId === group.id).length} papers
              </span>
            </button>
          ))}
        </div>
        {pinnedResources.length ? (
          <div className="resource-grid">
            {pinnedResources.map((resource) => (
              <ResourceCard key={resource.id} resource={resource} />
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </ArchiveLayout>
  );
}
