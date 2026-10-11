"use client";

import { useState } from "react";
import Link from "next/link";
import { ArchiveLayout } from "@/components/archive-ui";

export default function UploadPage() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  return (
    <ArchiveLayout>
      <main className="upload">
        <p className="kicker">COMMUNITY CONTRIBUTION</p>
        <h1>
          Put something
          <br />
          <em>good back.</em>
        </h1>
        <p className="lead">
          Share a paper, guide, or note that made a difference to your prep.
        </p>
        {submitted ? (
          <section className="settings-card success">
            <div>✓</div>
            <h2>Thank you for contributing.</h2>
            <p>Your resource has joined the moderation queue.</p>
            <Link className="button button-soft" href="/archive">
              Return to archive
            </Link>
          </section>
        ) : (
          <form
            className="settings-card"
            onSubmit={async (event) => {
              event.preventDefault();
              setError("");
              const form = new FormData(event.currentTarget);
              const file = form.get("file");
              const response = await fetch("/api/papers", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  title: form.get("title"),
                  description: form.get("description"),
                  subject: form.get("subject"),
                  board: form.get("board"),
                  type: form.get("type"),
                  examYear: Number(form.get("year")),
                  duration: Number(form.get("duration")) || undefined,
                  filePath: file instanceof File ? file.name : "",
                  fileSizeBytes: file instanceof File ? file.size : 0,
                }),
              });
              if (!response.ok) {
                setError(
                  "We could not submit this resource. Check the details and try again.",
                );
                return;
              }
              setSubmitted(true);
            }}
          >
            <label>
              Paper title
              <input
                name="title"
                required
                placeholder="e.g. Physics — Paper 2"
              />
            </label>
            <label>
              Subject
              <select name="subject">
                <option>Physics</option>
                <option>Mathematics</option>
                <option>Chemistry</option>
                <option>English Literature</option>
              </select>
            </label>
            <label>
              Board
              <select name="board">
                <option>CBSE</option>
                <option>ICSE</option>
                <option>PU</option>
              </select>
            </label>
            <label>
              Exam year
              <input
                name="year"
                type="number"
                min="1900"
                required
                defaultValue="2026"
              />
            </label>
            <label>
              Resource type
              <select name="type">
                <option>Exam paper</option>
                <option>Worksheet</option>
                <option>Revision guide</option>
                <option>Chapter notes</option>
              </select>
            </label>
            <label>
              Reading time in minutes
              <input name="duration" type="number" min="1" placeholder="60" />
            </label>
            <label>
              Description
              <textarea
                name="description"
                placeholder="What will students find here?"
              />
            </label>
            <label>
              Choose a file
              <input
                name="file"
                type="file"
                accept="application/pdf"
                required
              />
            </label>
            {error && <p className="login-error">{error}</p>}
            <button className="button button-dark">Submit resource →</button>
          </form>
        )}
      </main>
    </ArchiveLayout>
  );
}
