"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Download,
  FileText,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  ExternalLink,
} from "lucide-react";

export type PdfViewerProps = {
  file?: File | Blob | string;
  src?: string;
  title?: string;
  className?: string;
  showHeader?: boolean;
  downloadUrl?: string;
};

export function PdfViewer({
  file,
  src,
  title,
  className = "",
  showHeader = true,
  downloadUrl,
}: PdfViewerProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.2);
  const [viewMode, setViewMode] = useState<"single" | "all">("all");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const docRef = useRef<any>(null);

  // Monitor fullscreen state
  useEffect(() => {
    function onFullscreenChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onFullscreenChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
    };
  }, []);

  function toggleFullscreen() {
    if (!sectionRef.current) return;
    if (!document.fullscreenElement) {
      if (sectionRef.current.requestFullscreen) {
        sectionRef.current.requestFullscreen().catch(() => {
          setIsFullscreen((prev) => !prev);
        });
      } else {
        setIsFullscreen((prev) => !prev);
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      } else {
        setIsFullscreen(false);
      }
    }
  }

  function openInNewTab() {
    const targetUrl =
      effectiveDownloadUrl ||
      (typeof pdfSource === "string" ? pdfSource : undefined);
    if (targetUrl) {
      window.open(targetUrl, "_blank", "noopener,noreferrer");
    }
  }

  // Determine actual source URL
  const [pdfSource, setPdfSource] = useState<string>("");

  useEffect(() => {
    const raw = file ?? src;
    if (!raw) {
      setPdfSource("");
      return;
    }

    if (typeof raw === "string") {
      setPdfSource(raw);
      return;
    }

    if (raw instanceof Blob) {
      const url = URL.createObjectURL(raw);
      setPdfSource(url);
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file, src]);

  // Load PDF document
  useEffect(() => {
    if (!pdfSource) return;

    let cancelled = false;
    setLoading(true);
    setError("");

    async function loadDocument() {
      try {
        const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

        const loadingTask = pdfjs.getDocument(pdfSource);
        const doc = await loadingTask.promise;

        if (cancelled) return;
        docRef.current = doc;
        setNumPages(doc.numPages);
        setCurrentPage(1);
        setLoading(false);
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "This PDF could not be displayed. You can still download it.",
          );
          setLoading(false);
        }
      }
    }

    loadDocument();
    return () => {
      cancelled = true;
    };
  }, [pdfSource]);

  // Render pages when doc, scale, page, or viewMode changes
  useEffect(() => {
    const doc = docRef.current;
    if (!doc || !containerRef.current) return;

    let cancelled = false;
    const container = containerRef.current;

    async function renderPages() {
      container.replaceChildren();

      const pagesToRender: number[] = [];
      if (viewMode === "single") {
        pagesToRender.push(currentPage);
      } else {
        // Render up to max 10 pages at once for performance, or all if short
        const count = Math.min(doc.numPages, 10);
        for (let i = 1; i <= count; i++) {
          pagesToRender.push(i);
        }
      }

      for (const pageNum of pagesToRender) {
        if (cancelled) break;
        try {
          const page = await doc.getPage(pageNum);
          if (cancelled) break;

          const viewport = page.getViewport({ scale });
          const wrapper = document.createElement("div");
          wrapper.className = "pdf-page-wrapper";

          const canvas = document.createElement("canvas");
          canvas.className = "pdf-page";
          canvas.width = viewport.width;
          canvas.height = viewport.height;
          wrapper.appendChild(canvas);

          if (viewMode === "all" && doc.numPages > 1) {
            const label = document.createElement("span");
            label.className = "pdf-page-number";
            label.textContent = `Page ${pageNum} of ${doc.numPages}`;
            wrapper.appendChild(label);
          }

          container.appendChild(wrapper);
          await page.render({ canvas, viewport }).promise;
        } catch {
          // ignore rendering cancellation
        }
      }
    }

    renderPages();
    return () => {
      cancelled = true;
    };
  }, [numPages, currentPage, scale, viewMode]);

  const effectiveDownloadUrl =
    downloadUrl ||
    (typeof pdfSource === "string" && !pdfSource.startsWith("blob:")
      ? pdfSource.replace("?preview=1", "")
      : undefined);

  return (
    <section
      ref={sectionRef}
      className={`pdf-preview ${isFullscreen ? "pdf-fullscreen-active" : ""} ${className}`}
    >
      {showHeader && (
        <header className="pdf-preview-header">
          <div className="pdf-preview-title">
            <FileText size={15} />
            <strong>{title || "Document Preview"}</strong>
            {numPages > 0 && (
              <span className="pdf-page-count">
                {numPages} {numPages === 1 ? "page" : "pages"}
              </span>
            )}
          </div>

          <div className="pdf-preview-controls">
            {viewMode === "single" && numPages > 1 && (
              <div className="pdf-pager">
                <button
                  type="button"
                  className="pdf-tool-btn"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  aria-label="Previous page"
                >
                  <ChevronLeft size={14} />
                </button>
                <span>
                  {currentPage} / {numPages}
                </span>
                <button
                  type="button"
                  className="pdf-tool-btn"
                  disabled={currentPage >= numPages}
                  onClick={() =>
                    setCurrentPage((p) => Math.min(numPages, p + 1))
                  }
                  aria-label="Next page"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            )}

            {numPages > 1 && (
              <button
                type="button"
                className="pdf-tool-btn text-btn"
                onClick={() =>
                  setViewMode((mode) => (mode === "all" ? "single" : "all"))
                }
              >
                {viewMode === "all" ? "Single page" : "All pages"}
              </button>
            )}

            <div className="pdf-zoom">
              <button
                type="button"
                className="pdf-tool-btn"
                disabled={scale <= 0.8}
                onClick={() => setScale((s) => Math.max(0.7, s - 0.2))}
                aria-label="Zoom out"
                title="Zoom out"
              >
                <ZoomOut size={13} />
              </button>
              <button
                type="button"
                className="pdf-tool-btn"
                disabled={scale >= 2.0}
                onClick={() => setScale((s) => Math.min(2.0, s + 0.2))}
                aria-label="Zoom in"
                title="Zoom in"
              >
                <ZoomIn size={13} />
              </button>
            </div>

            <button
              type="button"
              className="pdf-tool-btn"
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize2 size={13} /> : <Maximize2 size={13} />}
            </button>

            {(effectiveDownloadUrl || pdfSource) && (
              <button
                type="button"
                className="pdf-tool-btn"
                onClick={openInNewTab}
                aria-label="Open PDF in new tab"
                title="Open PDF in new tab"
              >
                <ExternalLink size={13} />
              </button>
            )}

            {effectiveDownloadUrl && (
              <a
                className="button button-soft pdf-download-btn"
                href={effectiveDownloadUrl}
                download
              >
                <Download size={13} />
                <span>Download</span>
              </a>
            )}
          </div>
        </header>
      )}

      {loading && !error && (
        <div className="pdf-loading">
          <p>Rendering document preview…</p>
        </div>
      )}

      {error && (
        <div className="pdf-error">
          <p>{error}</p>
          {effectiveDownloadUrl && (
            <a
              className="button button-dark"
              href={effectiveDownloadUrl}
              download
            >
              <Download size={13} /> Download PDF instead
            </a>
          )}
        </div>
      )}

      <div
        className={`pdf-pages ${viewMode === "single" ? "single-page" : ""}`}
        ref={containerRef}
      />
    </section>
  );
}
