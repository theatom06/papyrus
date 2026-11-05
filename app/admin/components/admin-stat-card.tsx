import type { LucideIcon } from "lucide-react";

export default function AdminStatCard({
  icon: Icon,
  label,
  value,
  detail,
  tone = "amber",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
  tone?: "amber" | "sky" | "rose";
}) {
  const toneClasses = {
    amber: "bg-amber/10 text-amber",
    sky: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
    rose: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  };

  return (
    <div className="min-h-36 rounded-md border border-border-main bg-linen p-4">
      <div className={`grid size-8 place-items-center rounded-md ${toneClasses[tone]}`}>
        <Icon size={18} />
      </div>
      <div className="mt-3 font-mono text-[9px] uppercase tracking-[0.12em] text-slate">
        {label}
      </div>
      <strong className="mt-2 block font-[Georgia] text-[26px] leading-none">
        {value}
      </strong>
      <small className="mt-3 block font-mono text-[9px] text-amber">
        {detail}
      </small>
    </div>
  );
}
