"use client";
import React, { useState } from "react";
import Link from "next/link";
import { ArrowRight, Search, Sparkles, Check, Upload } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { papers } from "@/components/papyrus-data";

const subjects = [
  ["Mathematics", "248 papers", "∑", "coral"],
  ["Physics", "184 papers", "ϕ", "mint"],
  ["English Literature", "129 papers", "Aa", "lilac"],
  ["Biology", "96 papers", "✦", "peach"],
] as const;

export default function Home() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <main>
      <SiteHeader />

      <section className="page-hero" id="top">
        <div className="eyebrow">YOUR FRIENDLY EXAM PRACTICE HUB</div>

        <h1>
          Prepare well.
          <br />
          <em>Feel ready.</em>
        </h1>

        <p className="hero-copy">
          Find real exam papers, practise under timed conditions, and build the
          confidence to walk into your next exam ready.
        </p>

        <Link
          href="/search"
          className="search-box"
          style={{
            textDecoration: "none",
            color: "var(--muted-foreground)",
            marginTop: 32,
          }}
        >
          <Search />
          <span style={{ flex: 1 }}>Search by subject, board, or year...</span>
          <ArrowRight style={{ color: "var(--primary)" }} />
        </Link>

        <div className="hero-note">
          <Sparkles /> Made for students who want to practise with purpose.
        </div>
      </section>

      <section className="archive-shell">
        <div className="archive-head">
          <div>
            <p className="eyebrow">START REVISING</p>
            <h2>Pick a subject</h2>
          </div>

          <Link href="/papers" className="header-search">
            See all exam papers <ArrowRight />
          </Link>
        </div>

        <div className="result-grid" style={{ marginTop: 32 }}>
          {subjects.map(([name, count, mark, tone]) => (
            <Link
              href={`/papers?subject=${name}`}
              className="result-card"
              key={name}
            >
              <div className={`result-art ${tone}`}>
                <span
                  style={{ fontSize: 32, fontFamily: "var(--font-newsreader)" }}
                >
                  {mark}
                </span>
                <ArrowRight />
              </div>

              <h3>{name}</h3>
              <p>{count}</p>
            </Link>
          ))}
        </div>
      </section>

      <section
        className="archive-shell"
        style={{ background: "var(--background)" }}
      >
        <div className="archive-head">
          <div>
            <p className="eyebrow">GOOD NEXT STEPS</p>
            <h2>Practise a paper</h2>
          </div>

          <Link href="/papers" className="header-search">
            Browse library <ArrowRight />
          </Link>
        </div>

        <div className="paper-list">
          {papers.slice(0, 3).map((p, i) => (
            <Link
              href="/papers"
              className="paper-row"
              key={p.title}
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className={`paper-number ${p.accent}`}>
                {String(i + 1).padStart(2, "0")}
              </div>

              <div className="paper-info">
                <div className="paper-meta">
                  <span>{p.subject}</span>
                  <span>·</span>
                  <span>{p.level}</span>
                  <span>·</span>
                  <span>{p.year}</span>
                </div>

                <h3>{p.title}</h3>
                <p>{p.description}</p>
                <div className="paper-author">
                  {p.board} · {p.duration} · {p.marks}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section className="contribute" id="contribute">
        <div>
          <p className="eyebrow">HELP YOUR CLASSMATES</p>
          <h2>Have a paper we&apos;re missing?</h2>
          <p>
            Share a paper and help make practice easier for the next student.
          </p>
        </div>
        {submitted ? (
          <div className="submitted">
            <Check /> Thanks for helping students practise.
          </div>
        ) : (
          <button onClick={() => setSubmitted(true)} className="button-primary">
            <Upload /> Share a paper
          </button>
        )}
      </section>

      <footer className="site-footer">
        <span>© 2025 Papyrus</span>
        <span>Exam practice, made less stressful.</span>
      </footer>
    </main>
  );
}
