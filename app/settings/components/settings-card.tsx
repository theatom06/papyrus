export default function SettingsCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-md border border-border-main bg-linen p-5 shadow-sm sm:p-7 ${className}`.trim()}
    >
      {title && <h2 className="mb-5 font-serif text-xl">{title}</h2>}
      {children}
    </section>
  );
}
