"use client";

import Link from "next/link";
import { Pin } from "lucide-react";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArchiveLayout, useArchiveStorage } from "@/components/archive-ui";

export default function PaperPage() {
  const { id } = useParams<{ id: string }>();
  const [resource, setResource] = useState<{
    id: string;
    title: string;
    description: string;
    year: number;
    subject: string;
    board: string;
    type: string;
    duration: number;
  } | null>(null);
  useEffect(() => {
    fetch(`/api/papers/${id}`)
      .then((response) => response.json())
      .then((data: { paper?: typeof resource }) =>
        setResource(data.paper || null),
      );
  }, [id]);
  const { pins, groups, save } = useArchiveStorage();
  if (!resource) {
    return (
      <ArchiveLayout>
        <main className="detail">
          <p className="lead">Loading paper...</p>
        </main>
      </ArchiveLayout>
    );
  }
  const pinned = pins.find((item) => item.id === resource.id);
  return (
    <ArchiveLayout>
      <main className="detail">
        <Link className="breadcrumb" href="/archive">
          ← Back to archive
        </Link>
        <div className="detail-layout">
          <article>
            <div className="document">
              <div className="doc-page">
                <span>CATALOGUE / {resource.year}</span>
                <h2>{resource.title}</h2>
                <p>{resource.description}</p>
                <hr />
                <h4>CONTENTS</h4>
                <p>
                  01. Overview
                  <br />
                  02. Core concepts
                  <br />
                  03. Practice questions
                  <br />
                  04. Further reading
                </p>
                <hr />
                <p className="fake-lines">
                  Definitions, examples, and carefully arranged prompts for
                  focused study.
                </p>
              </div>
            </div>
          </article>
          <aside className="sidebar">
            <section>
              <small>ABOUT THIS PAPER</small>
              <div className="metadata">
                <span>
                  Subject<strong>{resource.subject}</strong>
                </span>
                <span>
                  Board<strong>{resource.board}</strong>
                </span>
                <span>
                  Format<strong>{resource.type}</strong>
                </span>
                <span>
                  Reading time
                  <strong>
                    {resource.duration >= 60
                      ? `${resource.duration / 60} hrs`
                      : `${resource.duration} min`}
                  </strong>
                </span>
              </div>
              <a className="download" href="#">
                Download PDF
              </a>
              <button
                type="button"
                className={`pin-main ${pinned ? "pinned" : ""}`}
                onClick={() =>
                  save(
                    pinned
                      ? pins.filter((item) => item.id !== resource.id)
                      : [
                          ...pins,
                          {
                            id: resource.id,
                            groupId: groups[0]?.id || "study",
                            pinnedAt: Date.now(),
                          },
                        ],
                  )
                }
                aria-pressed={Boolean(pinned)}
              >
                <Pin size={14} /> {pinned ? "Pinned" : "Pin paper"}
              </button>
            </section>
          </aside>
        </div>
      </main>
    </ArchiveLayout>
  );
}
