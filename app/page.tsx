import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ArchiveLayout } from "@/components/archive-ui";

export default async function Home() {
  if ((await cookies()).get("papyrus-default-view")?.value === "archive") {
    redirect("/archive");
  }
  return (
    <ArchiveLayout>
      <main>
        <section className="hero">
          <p className="eyebrow">THE STUDENT ARCHIVE / EST. 2026</p>
          <h1>
            Good work
            <br />
            <em>deserves</em> good
            <br />
            company.
          </h1>
          <p className="hero-copy">
            Papyrus is a living archive of papers — shared by students, for
            students.
          </p>
          <div className="hero-actions">
            <Link className="button button-dark" href="/archive">
              Explore the archive →
            </Link>
            <Link className="button button-ghost" href="/upload">
              Share a resource
            </Link>
          </div>
          <div className="hero-stamp">
            <span>CATALOGUE NO. 001</span>
            <strong>AUTHENTIC PAPERS</strong>
            <span>OPEN ACCESS</span>
          </div>
        </section>
        <section className="intro">
          <div>
            <p className="kicker">A BETTER WAY TO PREPARE</p>
            <h2>
              Less searching.
              <br />
              <em>More finding.</em>
            </h2>
          </div>
          <p>
            Skip the noisy group chats and scattered folders. Papyrus brings the
            good stuff into one calm, searchable place.
          </p>
        </section>
        <section className="principles">
          <article>
            <b>▤</b>
            <h3>Collected with care</h3>
            <p>
              Every resource is catalogued with its subject, year, and paper
              type.
            </p>
          </article>
          <article>
            <b>⌖</b>
            <h3>Keep your own shelf</h3>
            <p>Pin papers into focused groups for your next study session.</p>
          </article>
          <article>
            <b>⌕</b>
            <h3>Find your thread</h3>
            <p>
              Search by topic, board, year, or the exact phrase you remember.
            </p>
          </article>
        </section>
        <section className="quote">
          <blockquote>
            “The archive is not a graveyard. It is a map of where we have been —
            and where we might go next.”
          </blockquote>
          <small>— CATALOGUE NOTE 01</small>
        </section>
      </main>
    </ArchiveLayout>
  );
}
