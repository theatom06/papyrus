"use client";

import "./style.css";

import { Suspense, useEffect, useMemo, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { type Resource } from "@/components/resource";
import { Layout } from "@/components/layout";
import { EmptyState } from "@/components/empty-state";
import { ResourceCard } from "@/components/resource-card";
import { FilterBox } from "@/components/filter-box";
import { FilterSelect, type FilterOption } from "@/components/filter-select";
import { PageHeading } from "@/components/page-heading";
import { SearchBox } from "@/components/search-box";
import { PageTitle } from "@/components/page-title";
import { apiRequest } from "@/lib/api-client";
import { Dropdown } from "@/components/dropdown";

function ArchiveContent() {
  const searchParams = useSearchParams();

  const [filter, setFilter] = useState(() => {
    const urlBoard = searchParams.get("board");
    const defaultBoard =
      typeof window !== "undefined"
        ? localStorage.getItem("papyrus-default-board") || ""
        : "";
    const activeBoard = urlBoard !== null ? urlBoard : defaultBoard;
    return {
      board: activeBoard,
      classLevel: searchParams.get("classLevel") || "",
      subject: searchParams.get("subject") || "",
      type: searchParams.get("type") || "",
      year: searchParams.get("year") || "",
    };
  });
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [draftQuery, setDraftQuery] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "Newest first");
  const [filtersOpen, setFiltersOpen] = useState(() => {
    const urlBoard = searchParams.get("board");
    const defaultBoard =
      typeof window !== "undefined"
        ? localStorage.getItem("papyrus-default-board") || ""
        : "";
    return Boolean(
      urlBoard ||
      defaultBoard ||
      searchParams.get("classLevel") ||
      searchParams.get("subject") ||
      searchParams.get("type") ||
      searchParams.get("year"),
    );
  });

  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Sync state when URL search params change
  useEffect(() => {
    const defaultBoard = localStorage.getItem("papyrus-default-board") || "";
    // If the board parameter is explicitly in searchParams (even empty "?board="), respect it.
    // Otherwise, if no board parameter at all was passed, default to saved defaultBoard.
    const hasExplicitBoard = searchParams.has("board");
    const b = hasExplicitBoard
      ? searchParams.get("board") || ""
      : searchParams.get("board") || defaultBoard;
    const cl = searchParams.get("classLevel") || "";
    const s = searchParams.get("subject") || "";
    const t = searchParams.get("type") || "";
    const y = searchParams.get("year") || "";
    const q = searchParams.get("q") || "";
    const sortVal = searchParams.get("sort") || "Newest first";

    setFilter({
      board: b,
      classLevel: cl,
      subject: s,
      type: t,
      year: y,
    });
    setQuery(q);
    setDraftQuery(q);
    if (sortVal) setSort(sortVal);
    if (b || cl || s || t || y) {
      setFiltersOpen(true);
    }
  }, [searchParams]);

  // Sync state back to URL parameters
  const syncToUrl = useCallback(
    (newFilter: typeof filter, newQuery: string, newSort: string) => {
      if (typeof window === "undefined") return;
      const params = new URLSearchParams();
      if (newFilter.board) params.set("board", newFilter.board);
      if (newFilter.classLevel) params.set("classLevel", newFilter.classLevel);
      if (newFilter.subject) params.set("subject", newFilter.subject);
      if (newFilter.type) params.set("type", newFilter.type);
      if (newFilter.year) params.set("year", newFilter.year);
      if (newQuery) params.set("q", newQuery);
      if (newSort && newSort !== "Newest first") params.set("sort", newSort);

      const qs = params.toString();
      const nextUrl = qs
        ? `${window.location.pathname}?${qs}`
        : window.location.pathname;
      window.history.replaceState(null, "", nextUrl);
    },
    [],
  );

  useEffect(() => {
    apiRequest<{
      papers?: Array<Record<string, unknown>>;
      hasMore?: boolean;
    }>("/api/papers?limit=20")
      .then((data) => {
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
        );
        setHasMore(Boolean(data.hasMore));
      })
      .catch(() => setResources([]))
      .finally(() => setLoading(false));
  }, []);

  async function fetchMore() {
    setLoadingMore(true);
    try {
      const data = await apiRequest<{
        papers?: Array<Record<string, unknown>>;
        hasMore?: boolean;
      }>(`/api/papers?limit=20&offset=${resources.length}`);
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
          downloads: Number(paper.downloads) || 0,
          read: paper.duration
            ? Number(paper.duration) >= 60
              ? `${Number(paper.duration) / 60} hrs`
              : `${paper.duration} min`
            : "Self-paced",
          summary: String(paper.description || ""),
          accentColor: String(paper.accent_color || ""),
        })),
      ]);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoadingMore(false);
    }
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

  const applySearch = () => {
    const trimmed = draftQuery.trim();
    setQuery(trimmed);
    syncToUrl(filter, trimmed, sort);
  };

  const updateFilter = (key: keyof typeof filter, value: string) => {
    const nextFilter = { ...filter, [key]: value };
    setFilter(nextFilter);
    syncToUrl(nextFilter, query, sort);
  };

  const handleSortChange = (newSort: string) => {
    setSort(newSort);
    syncToUrl(filter, query, newSort);
  };

  const clearAllFilters = () => {
    const emptyFilter = {
      board: "",
      classLevel: "",
      subject: "",
      type: "",
      year: "",
    };
    setFilter(emptyFilter);
    setQuery("");
    setDraftQuery("");
    syncToUrl(emptyFilter, "", sort);
  };

  return (
    <Layout>
      <PageTitle title="Archive" />
      <main>
        <PageHeading
          kicker="THE COMMUNITY ARCHIVE / 2026"
          title={
            <>
              Find exactly what
              <br />
              <em>you need.</em>
            </>
          }
          description="Search the stack of authentic papers, prelims, and worksheets. Catalogued by students, for students."
        />
        <section className="explorer">
          <div className="archive-top-bar">
            <SearchBox
              value={draftQuery}
              onChange={(val) => {
                setDraftQuery(val);
                if (!val && query) {
                  setQuery("");
                  syncToUrl(filter, "", sort);
                }
              }}
              placeholder="Search the archive..."
              onSubmit={applySearch}
              large
              boardLabel={filter.board || undefined}
              onBoardClick={() => setFiltersOpen(true)}
            />
            <div className="archive-sort-wrap">
              <Dropdown
                label="Sort"
                value={sort}
                onChange={handleSortChange}
                options={[
                  { value: "Newest first", label: "Newest first" },
                  { value: "Oldest first", label: "Oldest first" },
                  { value: "Title A-Z", label: "Title A-Z" },
                  { value: "Title Z-A", label: "Title Z-A" },
                ]}
              />
            </div>
          </div>
          <div className="search-help">
            <span>Try “2024 physics” or filter by exam type</span>
            <span>
              {loading ? "Loading papers..." : `${list.length} papers found`}
            </span>
          </div>
          <FilterBox
            open={filtersOpen}
            onToggle={() => setFiltersOpen((open) => !open)}
            activeFilters={activeFilters.map(([key, value]) => ({
              key,
              value,
            }))}
            onRemove={(key) => updateFilter(key as keyof typeof filter, "")}
          >
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
          </FilterBox>
          {list.length ? (
            <div className="resource-grid">
              {list.map((resource) => (
                <ResourceCard key={resource.id} resource={resource} />
              ))}
            </div>
          ) : (
            <EmptyState onAction={clearAllFilters} />
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
    </Layout>
  );
}

export default function ArchivePage() {
  return (
    <Suspense
      fallback={
        <Layout>
          <PageTitle title="Archive" />
          <main style={{ padding: "80px 20px", textAlign: "center" }}>
            <p>Loading archive...</p>
          </main>
        </Layout>
      }
    >
      <ArchiveContent />
    </Suspense>
  );
}
