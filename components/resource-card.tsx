import Link from "next/link";
import PinButton from "./pin-button";
import type { Resource } from "./resource";
import { Download, Eye } from "lucide-react";

export function ResourceCard({ resource }: { resource: Resource }) {
  const accent = resource.accentColor || "#c46d23";

  return (
    <article
      className="group flex flex-col justify-between overflow-hidden rounded-lg border border-border-main bg-linen text-ink shadow-sm transition hover:border-amber/80 hover:shadow-md"
      data-paper-id={resource.id}
    >
      <div>
        {/* Card Header / Preview Strip */}
        <div
          className="relative flex h-24 flex-col justify-between p-3 text-white transition-opacity group-hover:opacity-95"
          style={{ backgroundColor: accent }}
        >
          <div className="flex items-center justify-between text-[11px] font-mono">
            <span className="rounded bg-black/25 px-1.5 py-0.5 font-semibold backdrop-blur-xs">
              {resource.board}
            </span>
            <span className="rounded bg-black/25 px-1.5 py-0.5 backdrop-blur-xs">
              {resource.year}
            </span>
          </div>
          <div className="text-[11px] font-medium tracking-wide">
            <span className="rounded bg-black/30 px-2 py-0.5 backdrop-blur-xs">
              {resource.type}
            </span>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className="inline-block rounded border px-2 py-0.5 text-[10px] font-semibold"
              style={{
                borderColor: `${accent}40`,
                backgroundColor: `${accent}15`,
                color: accent,
              }}
            >
              {resource.subject}
            </span>
            <span className="font-mono text-[10px] text-slate">
              {(resource.score * 100).toFixed(0)}% helpful
            </span>
          </div>

          <h3 className="mt-2.5 font-serif text-sm font-bold leading-snug line-clamp-2">
            <Link
              href={`/paper/${resource.id}`}
              className="hover:text-amber transition-colors"
            >
              {resource.title}
            </Link>
          </h3>

          <p className="mt-1.5 text-xs text-slate line-clamp-2 leading-relaxed">
            {resource.summary || "No summary provided."}
          </p>
        </div>
      </div>

      {/* Card Footer */}
      <div className="border-t border-border-main/70 bg-sand/30 px-4 py-2.5 flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-3 text-[11px] text-slate font-mono">
          <span className="flex items-center gap-1" title={`${resource.downloads} downloads`}>
            <Download size={12} /> {resource.downloads}
          </span>
          <span className="flex items-center gap-1" title={`${resource.read} views`}>
            <Eye size={12} /> {resource.read}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <PinButton paperId={resource.id} compact />
          <Link
            href={`/paper/${resource.id}`}
            className="rounded bg-amber/10 px-2.5 py-1 text-xs font-semibold text-amber hover:bg-amber hover:text-white transition-colors"
          >
            View →
          </Link>
        </div>
      </div>
    </article>
  );
}

export default ResourceCard;
