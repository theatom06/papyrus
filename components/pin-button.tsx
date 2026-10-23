"use client";

import { ChevronDown, Pin, Plus, Check } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useStorage } from "./storage";
import { Modal } from "./modal";

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

  // Close menu on click outside
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
        className={`pin-control ${compact ? "pin-compact" : ""} ${className}`}
        ref={controlRef}
      >
        <button
          type="button"
          className={`pin-main ${pinned ? "pinned" : ""}`}
          onClick={togglePin}
          aria-pressed={Boolean(pinned)}
          title={pinned ? `Pinned in ${group?.name || "shelf"}` : "Pin paper"}
        >
          <Pin size={13} className={pinned ? "fill-current" : ""} />
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
          className={`pin-menu-trigger ${pinned ? "pinned" : ""}`}
          aria-label="Choose pin group"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <ChevronDown size={13} />
        </button>

        {menuOpen && (
          <div className="pin-menu open">
            <small>{pinned ? "Move to shelf" : "Pin to shelf"}</small>
            {groups.map((item) => {
              const isSelected = item.id === pinned?.groupId;
              return (
                <button
                  type="button"
                  key={item.id}
                  className={isSelected ? "active" : ""}
                  onClick={() => assignGroup(item.id)}
                >
                  <span className="pin-menu-item-text">{item.name}</span>
                  {isSelected && <Check size={12} />}
                </button>
              );
            })}
            <button type="button" className="new-group" onClick={addGroup}>
              <Plus size={13} /> New shelf
            </button>
          </div>
        )}
      </div>

      {showGroupModal && (
        <Modal
          title="Create pin group"
          eyebrow="YOUR PERSONAL SHELF"
          onClose={() => setShowGroupModal(false)}
        >
          <form
            className="modal-form"
            onSubmit={(event) => {
              event.preventDefault();
              createGroup(
                String(new FormData(event.currentTarget).get("name") || ""),
              );
            }}
          >
            <label>
              Group name
              <input
                name="name"
                autoFocus
                required
                placeholder="e.g. Finals Prep"
              />
            </label>
            <button className="button button-dark" type="submit">
              Create group
            </button>
          </form>
        </Modal>
      )}
    </>
  );
}
