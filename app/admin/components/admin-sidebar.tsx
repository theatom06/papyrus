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

export function AdminSidebar({
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
    <aside className="admin-sidebar">
      <Link href="/" className="admin-brand">
        <img src="/logo.svg" alt="Papyrus logo" className="brand-logo" />
        <span>
          <strong>Papyrus</strong>
          <small>STUDIO</small>
        </span>
      </Link>

      <div className="sidebar-label">WORKSPACE</div>

      <nav>
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
              className={isSelected ? "selected" : ""}
            >
              <Icon size={17} />
              <span>{label}</span>
              {typeof count === "number" && count > 0 && <b>{count}</b>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-bottom">
        {onSettings && (
          <button type="button" onClick={onSettings}>
            <Settings2 size={16} /> Quick Settings
          </button>
        )}
        <Link href="/">
          <ChevronDown size={15} /> Back to Archive
        </Link>
        <div className="admin-user">
          <span className="admin-avatar">SR</span>
          <div>
            <strong>Steve</strong>
            <small>Administrator</small>
          </div>
        </div>
      </div>
    </aside>
  );
}
