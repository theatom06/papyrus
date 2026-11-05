"use client";

import { ChevronDown, Pin, Plus, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStorage } from "./storage";
import Modal from "./modal";

export type PinButtonProps = {
  paperId: string;
  compact?: boolean;
  className?: string;
};

export function PinButton({
  paperId,
  compact = false,
  className = "",
}: PinButtonProps) {
  const { pins, groups, save } = useStorage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const controlRef = useRef<HTMLDivElement>(null);

  const pinned = pins.find((item) => item.id === paperId);
  const group = groups.find((item) => item.id === pinned?.groupId);

  useEffect(() => {
    if (!menuOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (
        controlRef.current &&
        !controlRef.current.contains(event.target as Node)
      ) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);

  function togglePin() {
    save(
      pinned
        ? pins.filter((item) => item.id !== paperId)
        : [
            ...pins,
            {
              id: paperId,
              groupId: groups[0]?.id || "study",
              pinnedAt: Date.now(),
            },
          ],
    );
  }

  function assignGroup(groupId: string) {
    save(
      pinned
        ? pins.map((item) =>
            item.id === paperId ? { ...item, groupId } : item,
          )
        : [...pins, { id: paperId, groupId, pinnedAt: Date.now() }],
    );
    setMenuOpen(false);
  }

  function addGroup() {
    setShowGroupModal(true);
    setMenuOpen(false);
  }

  function createGroup(name: string) {
    if (!name.trim()) return;
    const groupId = `group-${Date.now()}`;
    save(
      [
        ...pins.filter((item) => item.id !== paperId),
        { id: paperId, groupId, pinnedAt: pinned?.pinnedAt || Date.now() },
      ],
      [...groups, { id: groupId, name: name.trim() }],
    );
    setShowGroupModal(false);
  }

  return (
    <>
      <div
        className={`relative inline-flex items-center rounded-md border border-border-main bg-linen shadow-2xs ${className}`}
        ref={controlRef}
      >
        <button
          type="button"
          className={`flex items-center gap-1.5 rounded-l-md px-2.5 py-1 text-xs font-semibold transition cursor-pointer ${
            pinned
              ? "bg-amber/15 text-amber hover:bg-amber/25"
              : "text-slate hover:text-ink hover:bg-sand/60"
          }`}
          onClick={togglePin}
          aria-pressed={Boolean(pinned)}
          title={pinned ? `Pinned in ${group?.name || "shelf"}` : "Pin paper"}
        >
          <Pin size={13} className={pinned ? "fill-current text-amber" : ""} />
          <span>
            {compact
              ? pinned
                ? "Pinned"
                : "Pin"
              : pinned
                ? group?.name || "Pinned"
                : "Pin paper"}
          </span>
        </button>

        <button
          type="button"
          className={`border-l border-border-main px-1.5 py-1 text-slate hover:text-ink hover:bg-sand/60 transition cursor-pointer rounded-r-md ${
            pinned ? "text-amber" : ""
          }`}
          aria-label="Choose pin shelf"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <ChevronDown size={13} />
        </button>

        {menuOpen && (
          <div className="absolute bottom-full right-0 z-40 mb-1 w-44 rounded-md border border-border-main bg-linen p-1 shadow-lg">
            <span className="block px-2.5 py-1 font-mono text-[10px] font-semibold uppercase tracking-wider text-slate">
              {pinned ? "Move to shelf" : "Pin to shelf"}
            </span>
            <div className="mt-1 flex flex-col gap-0.5">
              {groups.map((item) => {
                const isSelected = item.id === pinned?.groupId;
                return (
                  <button
                    type="button"
                    key={item.id}
                    className={`flex w-full items-center justify-between rounded px-2.5 py-1.5 text-left text-xs transition cursor-pointer ${
                      isSelected
                        ? "bg-amber/10 font-semibold text-amber"
                        : "text-ink hover:bg-sand"
                    }`}
                    onClick={() => assignGroup(item.id)}
                  >
                    <span className="truncate">{item.name}</span>
                    {isSelected && <Check size={13} className="text-amber shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="mt-1 border-t border-border-main/70 pt-1">
              <button
                type="button"
                className="flex w-full items-center gap-1.5 rounded px-2.5 py-1.5 text-left text-xs font-medium text-amber hover:bg-amber/10 transition cursor-pointer"
                onClick={addGroup}
              >
                <Plus size={13} /> New shelf
              </button>
            </div>
          </div>
        )}
      </div>

      {showGroupModal && (
        <Modal
          title="Create pin shelf"
          eyebrow="YOUR STUDY SHELF"
          onClose={() => setShowGroupModal(false)}
        >
          <form
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault();
              createGroup(
                String(new FormData(event.currentTarget).get("name") || ""),
              );
            }}
          >
            <div>
              <label className="block text-xs font-semibold text-slate">
                Shelf name
                <input
                  name="name"
                  autoFocus
                  required
                  placeholder="e.g. Physics Midterms"
                  className="mt-1 block w-full rounded-md border border-border-main bg-sand px-3 py-2 text-sm text-ink outline-none focus:border-amber focus:ring-1 focus:ring-amber"
                />
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                className="rounded-md border border-border-main px-4 py-2 text-xs font-medium text-slate hover:text-ink cursor-pointer"
                onClick={() => setShowGroupModal(false)}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-md bg-amber px-4 py-2 text-xs font-semibold text-white hover:bg-amber-dark cursor-pointer shadow-xs"
              >
                Create shelf
              </button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}

export default PinButton;
