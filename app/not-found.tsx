import Link from "next/link";
import type { Metadata } from "next";
import { ArrowLeft, FileQuestion } from "lucide-react";
import { Layout } from "@/components/layout";

export const metadata: Metadata = {
  title: "Page not found",
  description: "The Papyrus page you requested could not be found.",
};

export default function NotFound() {
  return (
    <Layout>
      <main className="not-found-page">
        <div className="not-found-mark" aria-hidden="true">
          <span>4</span>
          <FileQuestion strokeWidth={1.2} />
          <span>4</span>
        </div>
        <p className="not-found-kicker">CATALOGUE / PAGE MISSING</p>
        <h1>
          That page has gone <br /> <em> off the shelf.</em>
        </h1>
        <p className="not-found-copy">
          We looked through the archive, but could not find the page you were
          after. It may have moved, or the address may be out of date.
          <br />
          If you believe this is an error, please contact us at{" "}
          <a href="/contact">support</a>.
        </p>
        <div className="not-found-actions">
          <Link className="button button-dark" href="/home">
            <ArrowLeft size={15} />
            Back to home
          </Link>
          <Link className="button button-ghost" href="/archive">
            Explore the archive
          </Link>
        </div>
        <div className="not-found-stamp" aria-hidden="true">
          <span>FILE NOT FOUND</span>
          <strong>404</strong>
          <span>TRY ANOTHER PATH</span>
        </div>
      </main>
    </Layout>
  );
}
