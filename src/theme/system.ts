/**
 * Portfolio/wordcount theme catalog for Inspect.
 * Visual values live in `src/styles/tokens/ibm-tokens.css`.
 */

export const THEMES = [
  "light",
  "dark",
  "contrast",
  "paper",
  "glass",
  "frost",
  "brutal",
  "loom",
  "tank",
  "nes",
] as const;

export type Theme = (typeof THEMES)[number];

export const THEME_LABEL: Record<Theme, string> = {
  light: "light",
  dark: "dark",
  contrast: "contrast",
  paper: "paper",
  glass: "glass",
  frost: "frost",
  brutal: "brutal",
  loom: "loom",
  tank: "tank",
  nes: "nes",
};

export const THEME_LEGACY: Record<string, Theme> = {
  hc: "contrast",
  electric: "frost",
  forest: "tank",
  "theme-blue": "light",
  "theme-green": "tank",
  "theme-purple": "frost",
  "theme-orange": "paper",
  "theme-red": "brutal",
  "theme-teal": "tank",
  "theme-dark": "dark",
};

export const DEFAULT_THEME: Theme = "light";

export function migrateTheme(raw: string | null | undefined): Theme | null {
  if (!raw) return null;
  if (THEME_LEGACY[raw]) return THEME_LEGACY[raw];
  if ((THEMES as readonly string[]).includes(raw)) return raw as Theme;
  return null;
}
