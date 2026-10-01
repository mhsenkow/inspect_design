"use client";

import React, { useEffect, useRef, useState } from "react";
import styles from "../../styles/components/fab.module.css";

export type FabAction = {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
};

const PlusIcon = (): React.JSX.Element => (
  <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6V5z" fill="currentColor" />
  </svg>
);

const FloatingActionMenu = ({
  actions,
  menuId = "inspect-fab-menu",
}: {
  actions: FabAction[];
  menuId?: string;
}): React.JSX.Element | null => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null;
      if (rootRef.current && target && !rootRef.current.contains(target)) {
        setOpen(false);
      }
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div
      ref={rootRef}
      className={`${styles.fabRoot} ${open ? styles.fabRootOpen : ""}`}
    >
      <div
        id={menuId}
        className={styles.fabMenu}
        role="menu"
        aria-hidden={!open}
      >
        {actions.map((action, index) => (
          <button
            key={action.id}
            type="button"
            role="menuitem"
            className={styles.fabSecondary}
            style={{ transitionDelay: open ? `${index * 40}ms` : "0ms" }}
            onClick={() => {
              setOpen(false);
              action.onClick();
            }}
          >
            <span className={styles.fabSecondaryLabel}>{action.label}</span>
            <span className={styles.fabSecondaryIcon} aria-hidden>
              {action.icon}
            </span>
          </button>
        ))}
      </div>

      <button
        type="button"
        className={styles.fabPrimary}
        aria-label={open ? "Close actions" : "Open actions"}
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className={styles.fabPrimaryIcon} aria-hidden>
          <PlusIcon />
        </span>
      </button>
    </div>
  );
};

export default FloatingActionMenu;
