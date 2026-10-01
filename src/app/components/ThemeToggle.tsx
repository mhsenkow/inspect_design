"use client";

import React, { useEffect, useState } from "react";

import {
  DEFAULT_THEME,
  THEMES,
  THEME_LABEL,
  migrateTheme,
  type Theme,
} from "../../theme/system";

function getStoredTheme(): Theme | null {
  try {
    return migrateTheme(localStorage.getItem("inspect-theme"));
  } catch {
    return null;
  }
}

function storeTheme(theme: Theme) {
  try {
    localStorage.setItem("inspect-theme", theme);
  } catch {
    /* ignore */
  }
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("data-theme", theme);
}

const ThemeToggle = (): React.JSX.Element => {
  const [theme, setTheme] = useState<Theme>(DEFAULT_THEME);

  useEffect(() => {
    const currentTheme = migrateTheme(
      document.documentElement.getAttribute("data-theme"),
    );
    const stored = getStoredTheme();
    const initial: Theme = currentTheme || stored || DEFAULT_THEME;
    setTheme(initial);
    applyTheme(initial);
    storeTheme(initial);
  }, []);

  useEffect(() => {
    applyTheme(theme);
    storeTheme(theme);
  }, [theme]);

  function cycleTheme() {
    const idx = THEMES.indexOf(theme);
    const next = THEMES[(idx + 1) % THEMES.length];
    setTheme(next);
  }

  return (
    <div className="masthead-theme">
      <button
        type="button"
        className="masthead-orb-btn"
        aria-label={`theme: ${THEME_LABEL[theme]}`}
        title={`theme: ${THEME_LABEL[theme]} (click to cycle)`}
        onClick={cycleTheme}
        data-theme-face={theme}
      >
        <span className="theme-orb" aria-hidden="true" />
      </button>
    </div>
  );
};

export default ThemeToggle;
