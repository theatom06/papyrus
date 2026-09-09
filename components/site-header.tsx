import Link from "next/link";
import { BookOpen, Search, Sparkles } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header" role="banner">
      <div className="site-header-inner">
        <Link href="/" className="brand" aria-label="Papyrus home">
          <span className="brand-mark">
            <Sparkles />
          </span>
          <span>Papyrus</span>
        </Link>
        <nav aria-label="Main navigation">
          <Link href="/papers">
            <BookOpen /> Exam papers
          </Link>
          <Link href="/search">Find a paper</Link>
          <a href="/#contribute">Share a paper</a>
        </nav>
        <Link
          href="/search"
          className="header-search"
          aria-label="Find an exam paper"
        >
          <Search />
        </Link>
      </div>
    </header>
  );
}
