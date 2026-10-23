"use client";

import "./style.css";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Download,
  FileText,
  Flag,
  GraduationCap,
  Share2,
  Check,
  ShieldCheck,
  Sparkles,
  BookOpen,
  Layers,
} from "lucide-react";
import { Layout } from "@/components/layout";
import { PinButton } from "@/components/pin-button";
import { PageTitle } from "@/components/page-title";
import { apiRequest } from "@/lib/api-client";
import { PdfViewer } from "@/components/pdf-viewer";
import { VotingWidget } from "@/components/voting-widget";
import { ReportPaperModal } from "@/components/report-paper-modal";

type PaperDetail = {
  id: string;
  title: string;
  description: string;
  year: number;
  duration: number;
  file_path: string;
  file_size_bytes: number;
  downloads: number;
  status: string;
  created_at: string;
  board_id: number;
  board_name: string;
  board: string;
  class_level_id: number;
  class_level: string;
  subject_id: number;
  subject: string;
  accent_color: string;
  resource_type_id: number;
  type: string;
};

function formatFileSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "PDF document";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDuration(minutes?: number): string {
  if (!minutes || minutes <= 0) return "Self-paced study";
  if (minutes >= 60) {
    const hours = minutes / 60;
    return `${Number.isInteger(hours) ? hours : hours.toFixed(1)} hrs`;
  }
  return `${minutes} mins`;
}

function formatDate(isoString?: string): string {
  if (!isoString) return "Recent";
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "Recent";
    return date.toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  } catch {
    return "Recent";
  }
}

export default function PaperPage() {
  const { id } = useParams<{ id: string }>();
  const [paper, setPaper] = useState<PaperDetail | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiRequest<{ paper?: PaperDetail }>(`/api/papers/${id}`)
      .then((data) => {
        setPaper(data.paper || null);
        setError("");
      })
      .catch((reason: unknown) => {
        setError(
          reason instanceof Error
            ? reason.message
            : "Paper could not be loaded from the archive.",
        );
      })
      .finally(() => setLoading(false));
  }, [id]);

  function handleShare() {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  if (loading) {
    return (
      <Layout>
        <PageTitle title="Loading Paper" />
        <main className="detail-page-container">
          <div className="detail-loading-state">
            <div className="skeleton skeleton-breadcrumb" />
            <div className="skeleton skeleton-badge" />
            <div className="skeleton skeleton-title" />
            <div className="skeleton skeleton-viewer" />
          </div>
        </main>
      </Layout>
    );
  }

  if (error || !paper) {
    return (
      <Layout>
        <PageTitle title="Paper Not Found" />
        <main className="detail-page-container">
          <div className="detail-error-state">
            <Link className="back-breadcrumb" href="/archive">
              <ArrowLeft size={14} /> Back to archive
            </Link>
            <h2>Unable to load paper</h2>
            <p>{error || "This paper does not exist or has been archived."}</p>
            <Link className="button button-dark" href="/archive">
              Browse archive
            </Link>
          </div>
        </main>
      </Layout>
    );
  }

  const accentColor = paper.accent_color || "#a85d20";
  const downloadUrl = `/api/papers/${paper.id}/download`;
  const previewUrl = `/api/papers/${paper.id}/download?preview=1`;

  return (
    <>
      <Layout>
        <PageTitle title={`${paper.title} — ${paper.board}`} />
        <main
          className="detail-page-container"
          style={
            {
              "--subject-accent": accentColor,
              "--subject-color": accentColor,
            } as React.CSSProperties
          }
        >
          {/* Navigation & Breadcrumb Bar */}
          <nav className="detail-nav-bar" aria-label="Paper navigation">
            <Link className="back-breadcrumb" href="/archive">
              <ArrowLeft size={14} /> Back to archive
            </Link>

            <div className="detail-crumbs">
              <Link href="/archive">Archive</Link>
              <span className="crumb-sep">/</span>
              <Link href={`/archive?board=${encodeURIComponent(paper.board)}`}>
                {paper.board}
              </Link>
              <span className="crumb-sep">/</span>
              <Link
                href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}`}
              >
                {paper.class_level}
              </Link>
              <span className="crumb-sep">/</span>
              <Link
                className="crumb-current"
                href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
              >
                {paper.subject}
              </Link>
            </div>

            <button
              type="button"
              className="share-button"
              onClick={handleShare}
              aria-label="Share paper link"
            >
              {copied ? (
                <>
                  <Check size={13} className="text-emerald" />
                  <span>Link copied!</span>
                </>
              ) : (
                <>
                  <Share2 size={13} />
                  <span>Share</span>
                </>
              )}
            </button>
          </nav>

          {/* Paper Hero Header */}
          <header className="paper-hero">
            <div className="hero-top-row">
              <div className="hero-badges">
                <Link
                  href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
                  className="subject-chip"
                  style={{
                    background: `color-mix(in srgb, ${accentColor} 12%, var(--linen))`,
                    borderColor: accentColor,
                    color: accentColor,
                  }}
                >
                  <span
                    className="subject-dot"
                    style={{ background: accentColor }}
                  />
                  {paper.subject}
                </Link>
                <Link
                  href={`/archive?type=${encodeURIComponent(paper.type)}`}
                  className="hero-tag"
                >
                  {paper.type}
                </Link>
                <Link
                  href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}`}
                  className="hero-tag"
                >
                  {paper.class_level}
                </Link>
                <Link
                  href={`/archive?board=${encodeURIComponent(paper.board)}`}
                  className="hero-tag"
                >
                  {paper.board}
                </Link>
              </div>

              <div className="authenticity-stamp">
                <ShieldCheck size={13} />
                <span>Verified Material</span>
              </div>
            </div>

            <h1 className="hero-title">{paper.title}</h1>

            {/* Quick Metrics Strip */}
            <div className="hero-stats-strip">
              <div className="stat-pill">
                <Calendar size={13} />
                <span>{paper.year} Exam</span>
              </div>
              <div className="stat-pill">
                <Clock size={13} />
                <span>{formatDuration(paper.duration)}</span>
              </div>
              <div className="stat-pill">
                <FileText size={13} />
                <span>{formatFileSize(paper.file_size_bytes)}</span>
              </div>
              <div className="stat-pill">
                <Download size={13} />
                <span>{paper.downloads} downloads</span>
              </div>
              <div className="stat-pill">
                <GraduationCap size={13} />
                <span>{paper.board_name}</span>
              </div>
            </div>
          </header>

          {/* Two-Column Responsive Layout */}
          <div className="detail-layout">
            {/* Main Column */}
            <article className="detail-main">
              {/* Interactive PDF Viewer */}
              <div className="detail-viewer-wrapper">
                <PdfViewer
                  src={previewUrl}
                  title={`${paper.title} (${paper.year})`}
                  downloadUrl={downloadUrl}
                />
              </div>

              {/* Description & Syllabus Overview */}
              <section className="detail-card overview-card">
                <div className="card-heading">
                  <BookOpen size={16} />
                  <h2>About this resource</h2>
                </div>
                <p className="overview-text">
                  {paper.description ||
                    `Standard ${paper.type.toLowerCase()} for ${paper.subject} under the ${paper.board_name} (${paper.board}) curriculum for ${paper.class_level}. Recommended for authentic practice, revision, and mock exam simulations.`}
                </p>

                <div className="study-advice">
                  <div className="advice-item">
                    <strong>Recommended Session</strong>
                    <p>
                      {paper.duration
                        ? `Sit for a focused ${formatDuration(paper.duration)} block under timed conditions to mirror authentic exam pacing.`
                        : "Work through problem sets section-by-section, identifying key terminology and core derivation steps."}
                    </p>
                  </div>
                  <div className="advice-item">
                    <strong>Curriculum Level</strong>
                    <p>
                      {paper.class_level} — {paper.board_name}. Verified for
                      curriculum accuracy and syllabus relevance.
                    </p>
                  </div>
                </div>
              </section>
            </article>

            {/* Sidebar Column */}
            <aside className="detail-sidebar">
              {/* Action Box */}
              <div className="sidebar-card action-card">
                <small className="sidebar-label">ACTIONS</small>
                <a
                  className="button-download-primary"
                  href={downloadUrl}
                  download
                >
                  <Download size={15} />
                  <div className="download-text">
                    <strong>Download PDF</strong>
                    <span>{formatFileSize(paper.file_size_bytes)}</span>
                  </div>
                </a>

                <div className="sidebar-pin-wrap">
                  <PinButton paperId={paper.id} />
                </div>

                <button
                  type="button"
                  className="button-share-secondary"
                  onClick={handleShare}
                >
                  <Share2 size={13} />
                  <span>{copied ? "Link copied!" : "Share resource"}</span>
                </button>

                <button
                  type="button"
                  className="button-report-secondary"
                  onClick={() => setShowReport(true)}
                >
                  <Flag size={13} />
                  <span>Report an issue</span>
                </button>
              </div>

              {/* Voting Widget */}
              <div className="sidebar-card voting-card">
                <small className="sidebar-label">COMMUNITY RATING</small>
                <VotingWidget paperId={paper.id} />
              </div>

              {/* Specifications Matrix */}
              <div className="sidebar-card specs-card">
                <small className="sidebar-label">SPECIFICATIONS</small>

                <dl className="specs-list">
                  <div className="spec-row">
                    <dt>Subject</dt>
                    <dd>
                      <Link
                        href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
                        className="spec-link"
                      >
                        <span
                          className="spec-dot"
                          style={{ background: accentColor }}
                        />
                        <strong>{paper.subject}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>Board</dt>
                    <dd>
                      <Link
                        href={`/archive?board=${encodeURIComponent(paper.board)}`}
                        className="spec-link"
                      >
                        <strong>{paper.board}</strong>
                        <span className="spec-sub">{paper.board_name}</span>
                      </Link>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>Level</dt>
                    <dd>
                      <Link
                        href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}`}
                        className="spec-link"
                      >
                        <strong>{paper.class_level}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>Format</dt>
                    <dd>
                      <Link
                        href={`/archive?type=${encodeURIComponent(paper.type)}`}
                        className="spec-link"
                      >
                        <strong>{paper.type}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>Exam Year</dt>
                    <dd>
                      <Link
                        href={`/archive?year=${encodeURIComponent(paper.year)}`}
                        className="spec-link"
                      >
                        <strong>{paper.year}</strong>
                      </Link>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>Reading Time</dt>
                    <dd>
                      <strong>{formatDuration(paper.duration)}</strong>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>File Size</dt>
                    <dd>
                      <strong>{formatFileSize(paper.file_size_bytes)}</strong>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>Total Downloads</dt>
                    <dd>
                      <strong>{paper.downloads}</strong>
                    </dd>
                  </div>

                  <div className="spec-row">
                    <dt>Catalogued</dt>
                    <dd>
                      <strong>{formatDate(paper.created_at)}</strong>
                    </dd>
                  </div>
                </dl>
              </div>

              {/* Explore Next / Related */}
              <div className="sidebar-card explore-card">
                <small className="sidebar-label">SIMILAR PAPERS</small>
                <div className="explore-links">
                  <Link
                    className="explore-link"
                    href={`/archive?board=${encodeURIComponent(paper.board)}&classLevel=${encodeURIComponent(paper.class_level)}&subject=${encodeURIComponent(paper.subject)}`}
                  >
                    <BookOpen size={13} />
                    <span>
                      More {paper.subject} ({paper.class_level})
                    </span>
                  </Link>
                  <Link
                    className="explore-link"
                    href={`/archive?subject=${encodeURIComponent(paper.subject)}&type=${encodeURIComponent(paper.type)}`}
                  >
                    <FileText size={13} />
                    <span>
                      {paper.type}s for {paper.subject}
                    </span>
                  </Link>
                  <Link
                    className="explore-link"
                    href={`/archive?board=${encodeURIComponent(paper.board)}`}
                  >
                    <Layers size={13} />
                    <span>Browse all {paper.board} papers</span>
                  </Link>
                  <Link className="explore-link" href="/upload">
                    <Sparkles size={13} />
                    <span>Contribute a paper</span>
                  </Link>
                </div>
              </div>
            </aside>
          </div>
        </main>
      </Layout>

      {showReport && (
        <ReportPaperModal
          paperId={paper.id}
          paperTitle={paper.title}
          onClose={() => setShowReport(false)}
        />
      )}
    </>
  );
}
