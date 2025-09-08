"use client";

import styles from "../../styles/components/theme-switcher.module.css";
import React, { useState, useEffect } from "react";

interface ThemeSwitcherProps {
  className?: string;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ className = "" }) => {
  const [currentTheme, setCurrentTheme] = useState("");
  const [currentSpacing, setCurrentSpacing] = useState("");
  const [currentRadius, setCurrentRadius] = useState("");
  const [currentShadow, setCurrentShadow] = useState("");
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { name: "Default (Blue)", class: "" },
    { name: "Blue", class: "theme-blue" },
    { name: "Green", class: "theme-green" },
    { name: "Purple", class: "theme-purple" },
    { name: "Orange", class: "theme-orange" },
    { name: "Red", class: "theme-red" },
    { name: "Teal", class: "theme-teal" },
    { name: "Dark", class: "theme-dark" },
  ];

  const spacingOptions = [
    { name: "Default", class: "" },
    { name: "Compact", class: "spacing-compact" },
    { name: "Relaxed", class: "spacing-relaxed" },
  ];

  const radiusOptions = [
    { name: "Default", class: "" },
    { name: "Sharp", class: "radius-sharp" },
    { name: "Rounded", class: "radius-rounded" },
    { name: "Pill", class: "radius-pill" },
  ];

  const shadowOptions = [
    { name: "Default", class: "" },
    { name: "Subtle", class: "shadow-subtle" },
    { name: "Bold", class: "shadow-bold" },
  ];

  useEffect(() => {
    // Load saved preferences from localStorage
    const savedTheme = localStorage.getItem("theme") || "";
    const savedSpacing = localStorage.getItem("spacing") || "";
    const savedRadius = localStorage.getItem("radius") || "";
    const savedShadow = localStorage.getItem("shadow") || "";
    const savedIsOpen = localStorage.getItem("themeSwitcherOpen") === "true";

    setCurrentTheme(savedTheme);
    setCurrentSpacing(savedSpacing);
    setCurrentRadius(savedRadius);
    setCurrentShadow(savedShadow);
    setIsOpen(savedIsOpen);

    // Apply saved theme to body
    applyTheme(savedTheme, savedSpacing, savedRadius, savedShadow);
  }, []);

  const applyTheme = (
    theme: string,
    spacing: string,
    radius: string,
    shadow: string,
  ) => {
    const body = document.body;

    // Remove all theme classes
    body.classList.remove(
      "theme-blue",
      "theme-green",
      "theme-purple",
      "theme-orange",
      "theme-red",
      "theme-teal",
      "theme-dark",
      "spacing-compact",
      "spacing-relaxed",
      "radius-sharp",
      "radius-rounded",
      "radius-pill",
      "shadow-subtle",
      "shadow-bold",
    );

    // Add new theme classes (only if not empty string)
    if (theme && theme !== "") body.classList.add(theme);
    if (spacing && spacing !== "") body.classList.add(spacing);
    if (radius && radius !== "") body.classList.add(radius);
    if (shadow && shadow !== "") body.classList.add(shadow);
  };

  const handleThemeChange = (themeClass: string) => {
    setCurrentTheme(themeClass);
    localStorage.setItem("theme", themeClass);
    applyTheme(themeClass, currentSpacing, currentRadius, currentShadow);
  };

  const handleSpacingChange = (spacingClass: string) => {
    setCurrentSpacing(spacingClass);
    localStorage.setItem("spacing", spacingClass);
    applyTheme(currentTheme, spacingClass, currentRadius, currentShadow);
  };

  const handleRadiusChange = (radiusClass: string) => {
    setCurrentRadius(radiusClass);
    localStorage.setItem("radius", radiusClass);
    applyTheme(currentTheme, currentSpacing, radiusClass, currentShadow);
  };

  const handleShadowChange = (shadowClass: string) => {
    setCurrentShadow(shadowClass);
    localStorage.setItem("shadow", shadowClass);
    applyTheme(currentTheme, currentSpacing, currentRadius, shadowClass);
  };

  return (
    <div className={`${styles.themeSwitcher} ${className} relative`}>
      <button
        onClick={() => {
          const newIsOpen = !isOpen;
          setIsOpen(newIsOpen);
          localStorage.setItem("themeSwitcherOpen", newIsOpen.toString());
        }}
        className={styles.dropdownButton}
        aria-label="Theme Switcher"
      >
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v6m0 6v6" />
          <path d="M12 1a11 11 0 0 0-11 11c0 6.075 4.925 11 11 11s11-4.925 11-11-4.925-11-11-11z" />
        </svg>
      </button>

      {isOpen && (
        <div className={styles.dropdownMenu}>
          <h3 className="text-lg font-semibold text-text-primary mb-4">
            Theme Switcher
          </h3>

          <div className="grid gap-4">
            {/* Color Themes */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Color Theme:
              </label>
              <div className="flex gap-2 flex-wrap">
                {themes.map((theme) => (
                  <button
                    key={theme.class}
                    onClick={() => handleThemeChange(theme.class)}
                    className={`btn btn-sm ${
                      currentTheme === theme.class
                        ? "btn-primary"
                        : theme.class === "theme-dark"
                          ? "btn-secondary"
                          : "btn-ghost"
                    }`}
                  >
                    {theme.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Spacing */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Spacing:
              </label>
              <div className="flex gap-2 flex-wrap">
                {spacingOptions.map((option) => (
                  <button
                    key={option.class}
                    onClick={() => handleSpacingChange(option.class)}
                    className={`btn btn-sm ${
                      currentSpacing === option.class
                        ? "btn-primary"
                        : "btn-ghost"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Border Radius */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Border Radius:
              </label>
              <div className="flex gap-2 flex-wrap">
                {radiusOptions.map((option) => (
                  <button
                    key={option.class}
                    onClick={() => handleRadiusChange(option.class)}
                    className={`btn btn-sm ${
                      currentRadius === option.class
                        ? "btn-primary"
                        : "btn-ghost"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Shadows */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Shadows:
              </label>
              <div className="flex gap-2 flex-wrap">
                {shadowOptions.map((option) => (
                  <button
                    key={option.class}
                    onClick={() => handleShadowChange(option.class)}
                    className={`btn btn-sm ${
                      currentShadow === option.class
                        ? "btn-primary"
                        : "btn-ghost"
                    }`}
                  >
                    {option.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-secondary rounded-md">
            <p className="text-sm text-secondary">
              <strong>Current Theme:</strong>{" "}
              {themes.find((t) => t.class === currentTheme)?.name || "Default"}
              {currentSpacing &&
                ` + ${spacingOptions.find((s) => s.class === currentSpacing)?.name}`}
              {currentRadius &&
                ` + ${radiusOptions.find((r) => r.class === currentRadius)?.name}`}
              {currentShadow &&
                ` + ${shadowOptions.find((sh) => sh.class === currentShadow)?.name}`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeSwitcher;
