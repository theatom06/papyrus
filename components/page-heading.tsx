export function PageHeading({
  kicker,
  title,
  description,
}: {
  kicker: string;
  title: React.ReactNode;
  description: React.ReactNode;
}) {
  return (
    <section className="page-heading">
      <p className="kicker">{kicker}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}
