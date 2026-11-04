"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Archive,
  ChevronDown,
  FolderKanban,
  LayoutDashboard,
  Settings2,
  ShieldCheck,
  Flag,
  ThumbsDown,
} from "lucide-react";

export default function AdminSidebar({
  active,
  reviewCount = 0,
  reportCount = 0,
  poorCount = 0,
  onSettings,
}: {
  active?: string;
  reviewCount?: number;
  reportCount?: number;
  poorCount?: number;
  onSettings?: () => void;
}) {
  const pathname = usePathname();

  const nav = [
    { label: "Overview", href: "/admin", icon: LayoutDashboard },
    { label: "Papers", href: "/admin/papers", icon: Archive },
    {
      label: "Review queue",
      href: "/admin/review",
      icon: ShieldCheck,
      count: reviewCount,
    },
    {
      label: "Reports",
      href: "/admin/reports",
      icon: Flag,
      count: reportCount,
    },
    {
      label: "Poor performing",
      href: "/admin/poor-performing",
      icon: ThumbsDown,
      count: poorCount,
    },
    { label: "Boards & classes", href: "/admin/boards", icon: FolderKanban },
  ];

  return (
    <aside className="sticky top-0 flex h-screen w-[196px] shrink-0 flex-col overflow-y-auto border-r border-border-main bg-linen px-2.5 py-[22px] max-[720px]:hidden">
      <Link
        href="/"
        className="admin-brand mb-[34px] flex items-center gap-2.5 px-3 text-ink no-underline"
      >
        <img src="/logo.svg" alt="Papyrus logo" className="size-8" />
        <span>
          <strong className="block font-serif text-base">Papyrus</strong>
          <small className="mt-0.5 block font-mono text-[8px] tracking-wider text-slate">
            STUDIO
          </small>
        </span>
      </Link>

      <div className="sidebar-label px-3 pb-3 font-mono text-[9px] tracking-wider text-slate">
        WORKSPACE
      </div>

      <nav className="grid gap-1">
        {nav.map(({ label, href, icon: Icon, count }) => {
          const isSelected = active
            ? active.toLowerCase() === label.toLowerCase()
            : href === "/admin"
              ? pathname === "/admin"
              : pathname?.startsWith(href);

          return (
            <Link
              key={label}
              href={href}
              className={`flex min-h-[34px] w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left text-[11px] transition-colors ${
                isSelected
                  ? "border-amber bg-amber/10 font-semibold text-amber"
                  : "border-transparent text-slate hover:bg-sand hover:text-ink"
              }`}
            >
              <Icon size={17} />
              <span>{label}</span>
              {typeof count === "number" && count > 0 && <b>{count}</b>}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-border-main pt-4">
        {onSettings && (
          <button
            type="button"
            onClick={onSettings}
            className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[11px] text-slate transition hover:bg-sand hover:text-ink"
          >
            <Settings2 size={16} /> Quick Settings
          </button>
        )}
        <Link
          href="/"
          className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left text-[11px] text-slate transition hover:bg-sand hover:text-ink"
        >
          <ChevronDown size={15} /> Back to Archive
        </Link>
        <div className="mt-3 flex items-center gap-2 border-t border-border-main px-2 pt-4">
          <span className="grid size-8 place-items-center rounded-full border border-amber/40 bg-amber/10 font-mono text-[10px] font-bold text-amber">
            SR
          </span>
          <div>
            <strong className="block text-[11px]">Steve</strong>
            <small className="text-[10px] text-slate">Administrator</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
