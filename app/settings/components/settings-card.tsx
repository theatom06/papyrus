export function SettingsCard({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`settings-card ${className}`.trim()}>
      {title && <h2>{title}</h2>}
      {children}
    </section>
  );
}
