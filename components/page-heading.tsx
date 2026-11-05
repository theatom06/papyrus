export function PageHeading({
  kicker,
  title,
  star,
  description,
  className = "",
}: {
  kicker: string;
  title: string;
  star?: string;
  description: string;
  className?: string;
}) {
  return (
    <section className={`mx-auto w-full max-w-5xl py-8 ${className}`}>
      {kicker && (
        <p className="mb-2 font-mono text-[11px] font-medium uppercase tracking-wider text-amber">
          {kicker}
        </p>
      )}
      <h1 className="font-serif text-3xl font-bold tracking-tight text-ink sm:text-4xl">
        {title}{" "}
        {star && <span className="font-normal text-amber italic">{star}</span>}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-slate">
          {description}
        </p>
      )}
    </section>
  );
}

export default PageHeading;
