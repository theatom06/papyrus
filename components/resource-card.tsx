import Link from "next/link";
import { PinButton } from "./pin-button";
import type { Resource } from "./resource";

export function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <article
      className={`resource-card subject-${resource.subject.toLowerCase().replaceAll(" ", "-")}`}
      data-paper-id={resource.id}
      style={
        {
          "--subject-accent": resource.accentColor,
          "--subject-color": resource.accentColor,
        } as React.CSSProperties
      }
    >
      <div className="paper-thumb">
        <span className="paper-year">{resource.year}</span>
        <span className="paper-lines" />
        <small>{resource.type}</small>
      </div>
      <div className="resource-info">
        <div className="resource-meta">
          <span>{resource.board}</span>
          <span>{resource.read} read</span>
          <span>{resource.downloads} downloads</span>
        </div>
        <div className="card-subject-row">
          <span className="subject-chip">{resource.subject}</span>
          <span className="resource-type">{resource.type}</span>
        </div>
        <h3>{resource.title}</h3>
        <p>{resource.summary}</p>
        <div className="resource-footer">
          <Link className="text-link" href={`/paper/${resource.id}`}>
            View paper →
          </Link>
          <PinButton paperId={resource.id} />
        </div>
      </div>
    </article>
  );
}
