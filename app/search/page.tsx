"use client";
import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, Search as SearchIcon, X } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { papers, subjects } from "@/components/papyrus-data";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [subject, setSubject] = useState("All subjects");
  const results = useMemo(
    () =>
      papers.filter(
        (p) =>
          (subject === "All subjects" || p.subject === subject) &&
          (!query ||
            `${p.title} ${p.subject} ${p.board} ${p.level} ${p.year} ${p.type}`
              .toLowerCase()
              .includes(query.toLowerCase())),
      ),
    [query, subject],
  );
  return (
    <main>
      <SiteHeader />
      <section className="search-hero">
        <p className="eyebrow">FIND YOUR NEXT PRACTICE PAPER</p>
        <h1>
          Search exam
          <br />
          <em>papers.</em>
        </h1>
        <p className="hero-copy">
          Search across subjects, exam boards, years, and paper types to find
          exactly what you need to revise.
        </p>
        <div className="search-box">
          <SearchIcon />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try “maths”, “AQA”, or “2024”"
            aria-label="Search exam papers"
          />
          {query && (
            <button onClick={() => setQuery("")} aria-label="Clear search">
              <X />
            </button>
          )}
          <kbd>⌘ K</kbd>
        </div>
        <div className="popular">
          <span>Try searching:</span>
          {["Mathematics", "AQA", "GCSE", "2024"].map((x) => (
            <button key={x} onClick={() => setQuery(x)}>
              {x}
            </button>
          ))}
        </div>
      </section>
      <section className="search-results">
        <div className="results-top">
          <div>
            <p className="eyebrow">{results.length} MATCHES</p>
            <h2>
              {query ? (
                <>
                  Results for <em>“{query}”</em>
                </>
              ) : (
                "Recently added"
              )}
            </h2>
          </div>
          <div className="subject-pills">
            {subjects.slice(0, 4).map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={subject === s ? "active" : ""}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div className="result-grid">
          {results.map((p) => (
            <Link href="/papers" className="result-card" key={p.title}>
              <div className={`result-art ${p.accent}`}>
                <span>{p.subject}</span>
                <ArrowUpRight />
              </div>
              <div className="paper-meta">
                <span>{p.level}</span>
                <span>·</span>
                <span>{p.board}</span>
                <span>·</span>
                <span>{p.year}</span>
              </div>
              <h3>{p.title}</h3>
              <p>
                {p.type} · {p.duration} · {p.marks}
              </p>
            </Link>
          ))}
        </div>
        {!results.length && (
          <div className="empty-state">
            <h3>No matching exam papers</h3>
            <p>
              Try a subject, board, year, or level. You can also browse the full
              library.
            </p>
            <Link href="/papers" className="button-primary">
              Browse all papers
            </Link>
          </div>
        )}
      </section>
    </main>
  );
}
