"use client";
import { useMemo, useState } from "react";
import { Bookmark, Download, SlidersHorizontal } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import {
  boards,
  levels,
  papers,
  subjects,
  types,
} from "@/components/papyrus-data";

export default function PapersPage() {
  const [subject, setSubject] = useState("All subjects");
  const [level, setLevel] = useState("All levels");
  const [board, setBoard] = useState("All boards");
  const [type, setType] = useState("All types");
  const [saved, setSaved] = useState<string[]>([]);

  const filtered = useMemo(
    () =>
      papers.filter(
        (p) =>
          (subject === "All subjects" || p.subject === subject) &&
          (level === "All levels" || p.level === level) &&
          (board === "All boards" || p.board === board) &&
          (type === "All types" || p.type === type),
      ),
    [subject, level, board, type],
  );

  return (
    <main>
      <SiteHeader />

      <section className="page-hero">
        <p className="eyebrow">THE EXAM PAPER LIBRARY</p>
        <h1>
          Practise with purpose.
          <br />
          <em>Get exam ready.</em>
        </h1>
        <p className="hero-copy">
          Past papers, mock papers, and mark schemes organised so you can spend
          less time searching and more time learning.
        </p>
      </section>

      <section className="archive-shell">
        <div className="archive-head">
          <div>
            <p className="eyebrow">{filtered.length} PAPERS TO PRACTISE</p>
            <h2>Find your next paper</h2>
          </div>

          <button className="filter-button">
            <SlidersHorizontal /> Filters
          </button>
        </div>

        <div className="filter-bar">
          <div className="filter-group">
            {subjects.map((s) => (
              <button
                key={s}
                onClick={() => setSubject(s)}
                className={subject === s ? "active" : ""}
              >
                {s}
              </button>
            ))}
          </div>

          <select
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            aria-label="Filter by level"
          >
            {levels.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <select
            value={board}
            onChange={(e) => setBoard(e.target.value)}
            aria-label="Filter by exam board"
          >
            {boards.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>

          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            aria-label="Filter by paper type"
          >
            {types.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </div>

        <div className="paper-list">
          {filtered.map((p, i) => (
            <article className="paper-row" key={p.title}>
              <div className={`paper-number ${p.accent}`}>
                {String(i + 1).padStart(2, "0")}
              </div>

              <div className="paper-info">
                <div className="paper-meta">
                  <span>{p.subject}</span>
                  <span>·</span>
                  <span>{p.level}</span>
                  <span>·</span>
                  <span>{p.board}</span>
                  <span>·</span>
                  <span>{p.year}</span>
                </div>

                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div className="paper-author">
                  {p.type} · {p.duration} · {p.marks}
                </div>
              </div>

              <div className="paper-actions">
                <button
                  aria-label={`Save ${p.title}`}
                  onClick={() =>
                    setSaved((x) =>
                      x.includes(p.title)
                        ? x.filter((y) => y !== p.title)
                        : [...x, p.title],
                    )
                  }
                  className={saved.includes(p.title) ? "saved" : ""}
                >
                  <Bookmark
                    fill={saved.includes(p.title) ? "currentColor" : "none"}
                  />
                </button>

                <button aria-label={`Download ${p.title}`}>
                  <Download />
                </button>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
