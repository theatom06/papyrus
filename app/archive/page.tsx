"use client";

import { useEffect, useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import {
  ArchiveLayout,
  EmptyState,
  ResourceCard,
  type Resource,
} from "@/components/archive-ui";

type FilterOption = { value: string; count: number };
export default function ArchivePage() {
  const [query, setQuery] = useState("");
  const [draftQuery, setDraftQuery] = useState("");
  const [sort, setSort] = useState("Newest first");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filter, setFilter] = useState({
    board: "",
    classLevel: "",
    subject: "",
    type: "",
    year: "",
  });
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  useEffect(() => {
    fetch("/api/papers?limit=20")
      .then((response) => response.json())
      .then(
        (data: {
          papers?: Array<Record<string, unknown>>;
          hasMore?: boolean;
        }) => {
          setResources(
            (data.papers || []).map((paper) => ({
              id: String(paper.id),
              title: String(paper.title),
              subject: String(paper.subject),
              year: String(paper.year),
              board: String(paper.board),
              classLevel: String(paper.class_level),
              type: String(paper.type),
              read: `${Number(paper.duration) >= 60 ? `${Number(paper.duration) / 60} hrs` : `${paper.duration} min`}`,
              summary: String(paper.description || ""),
            })),
          );
          setHasMore(Boolean(data.hasMore));
        },
      )
      .finally(() => setLoading(false));
  }, []);
  async function fetchMore() {
    setLoadingMore(true);
    const response = await fetch(
      `/api/papers?limit=20&offset=${resources.length}`,
    );
    const data = (await response.json()) as {
      papers?: Array<Record<string, unknown>>;
      hasMore?: boolean;
    };
    setResources((current) => [
      ...current,
      ...(data.papers || []).map((paper) => ({
        id: String(paper.id),
        title: String(paper.title),
        subject: String(paper.subject),
        year: String(paper.year),
        board: String(paper.board),
        classLevel: String(paper.class_level),
        type: String(paper.type),
        read: `${Number(paper.duration) >= 60 ? `${Number(paper.duration) / 60} hrs` : `${paper.duration} min`}`,
        summary: String(paper.description || ""),
      })),
    ]);
    setHasMore(Boolean(data.hasMore));
    setLoadingMore(false);
  }
  const list = useMemo(
    () =>
      resources
        .filter((resource) => {
          const matchesFilter =
            (!filter.board || resource.board === filter.board) &&
            (!filter.classLevel || resource.classLevel === filter.classLevel) &&
            (!filter.subject || resource.subject === filter.subject) &&
            (!filter.type || resource.type === filter.type) &&
            (!filter.year || resource.year === filter.year);
          return (
            `${resource.title} ${resource.year} ${resource.type} ${resource.board} ${resource.classLevel}`
              .toLowerCase()
              .includes(query.toLowerCase()) && matchesFilter
          );
        })
        .sort((a, b) => {
          if (sort === "Oldest first") return +a.year - +b.year;
          if (sort === "Title A-Z") return a.title.localeCompare(b.title);
          if (sort === "Title Z-A") return b.title.localeCompare(a.title);
          return +b.year - +a.year;
        }),
    [filter, query, resources, sort],
  );
  const availableFilterData = useMemo(() => {
    function optionsFor(key: keyof typeof filter): FilterOption[] {
      const compatible = resources.filter((resource) =>
        Object.entries(filter).every(
          ([filterKey, value]) =>
            filterKey === key ||
            !value ||
            resource[filterKey as keyof Resource] === value,
        ),
      );
      const counts = new Map<string, number>();
      compatible.forEach((resource) => {
        const value = String(resource[key]);
        counts.set(value, (counts.get(value) || 0) + 1);
      });
      return [...counts.entries()]
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value));
    }
    return {
      boards: optionsFor("board"),
      classLevels: optionsFor("classLevel"),
      subjects: optionsFor("subject"),
      types: optionsFor("type"),
      years: optionsFor("year").sort(
        (a, b) => Number(b.value) - Number(a.value),
      ),
    };
  }, [filter, resources]);
  const activeFilters = [
    ["board", filter.board],
    ["classLevel", filter.classLevel],
    ["subject", filter.subject],
    ["type", filter.type],
    ["year", filter.year],
  ].filter(([, value]) => value) as [string, string][];
  function applySearch() {
    setQuery(draftQuery.trim());
    setFiltersOpen(false);
  }
  function updateFilter(key: keyof typeof filter, value: string) {
    setFilter((current) => ({ ...current, [key]: value }));
  }
  return (
    <ArchiveLayout>
      <main>
        <section className="page-heading">
          <p className="kicker">THE COMMUNITY ARCHIVE / 2026</p>
          <h1>
            Find exactly what
            <br />
            <em>you need.</em>
          </h1>
          <p>
            Search the stack of authentic papers, prelims, and worksheets.
            Catalogued by students, for students.
          </p>
        </section>
        <section className="explorer">
          <div className="archive-search-area">
            <div className="search-box search-box-large">
              <button
                className="search-board-pill"
                type="button"
                onClick={() => setFiltersOpen(true)}
              >
                {filter.board || "All boards"}
              </button>
              <Search size={18} />
              <input
                autoFocus
                value={draftQuery}
                onChange={(event) => setDraftQuery(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") applySearch();
                }}
                placeholder="Search the archive..."
              />
              {draftQuery && (
                <button
                  onClick={() => setDraftQuery("")}
                  aria-label="Clear search"
                >
                  <X size={15} />
                </button>
              )}
              <button
                className="search-submit"
                type="button"
                onClick={applySearch}
                aria-label="Search archive"
              >
                <Search size={16} />
              </button>
            </div>
            <div className="search-help">
              <span>Try “2024 physics”</span>
              <span>
                {loading ? "Loading papers..." : `${list.length} papers found`}
              </span>
            </div>
          </div>
          <div className={`filter-panel ${filtersOpen ? "is-open" : ""}`}>
            <button
              className="filter-panel-toggle"
              type="button"
              onClick={() => setFiltersOpen((open) => !open)}
            >
              <ChevronDown size={15} /> <span>Filters</span>
            </button>
            <div className="active-filter-pills">
              {activeFilters.length ? (
                activeFilters.map(([key, value]) => (
                  <button
                    key={`${key}:${value}`}
                    type="button"
                    className="active-filter-pill"
                    onClick={() => updateFilter(key as keyof typeof filter, "")}
                  >
                    {value}
                    <X size={11} />
                  </button>
                ))
              ) : (
                <span className="active-filter-pill muted">All filters</span>
              )}
            </div>
            {filtersOpen && (
              <div className="filter-menu">
                <FilterSelect
                  label="Board"
                  value={filter.board}
                  options={availableFilterData.boards}
                  onChange={(value) => updateFilter("board", value)}
                />
                <FilterSelect
                  label="Class level"
                  value={filter.classLevel}
                  options={availableFilterData.classLevels}
                  onChange={(value) => updateFilter("classLevel", value)}
                />
                <FilterSelect
                  label="Subject"
                  value={filter.subject}
                  options={availableFilterData.subjects}
                  onChange={(value) => updateFilter("subject", value)}
                />
                <FilterSelect
                  label="Exam type"
                  value={filter.type}
                  options={availableFilterData.types}
                  onChange={(value) => updateFilter("type", value)}
                />
                <FilterSelect
                  label="Year"
                  value={filter.year}
                  options={availableFilterData.years}
                  onChange={(value) => updateFilter("year", value)}
                />
              </div>
            )}
          </div>
          <div className="catalog-line">
            <span>
              Showing {list.length} of {resources.length} resources
            </span>
            <label className="sort-control">
              Sort
              <select
                value={sort}
                onChange={(event) => setSort(event.target.value)}
              >
                <option>Newest first</option>
                <option>Oldest first</option>
                <option>Title A-Z</option>
                <option>Title Z-A</option>
              </select>
              <ChevronDown size={13} />
            </label>
          </div>
          {list.length ? (
            <div className="resource-grid">
              {list.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState
              onClear={() => {
                setQuery("");
                setDraftQuery("");
                setFilter({
                  board: "",
                  classLevel: "",
                  subject: "",
                  type: "",
                  year: "",
                });
              }}
            />
          )}
          {hasMore && (
            <div className="fetch-more">
              <button
                className="button button-soft"
                onClick={fetchMore}
                disabled={loadingMore}
              >
                {loadingMore ? "Loading..." : "Fetch 20 more papers"}
              </button>
            </div>
          )}
        </section>
      </main>
    </ArchiveLayout>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: FilterOption[];
  onChange: (value: string) => void;
}) {
  return (
    <label className="custom-filter-select">
      <span>{label}</span>
      <span className="custom-select-control">
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
        >
          <option value="">All {label.toLowerCase()}s</option>
          {options.map((option) => (
            <option key={`${label}:${option.value}`} value={option.value}>
              {option.value} ({option.count})
            </option>
          ))}
        </select>
        <ChevronDown size={14} aria-hidden="true" />
      </span>
    </label>
  );
}
