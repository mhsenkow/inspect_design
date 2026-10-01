# Design System & Theming (Inspect)

Inspect uses the **ibm.io** token/theme system shared with [wordcount](https://ibm.io/wordcount) and the portfolio site.

## Source of truth

| Concern | Path |
|---------|------|
| Theme palettes (`data-theme`) | `src/styles/tokens/ibm-tokens.css` |
| Inspect aliases + base body | `src/styles/tokens/design-tokens.css` |
| Motion | `src/styles/tokens/motion.css` |
| Shell / orb / auth forms | `src/styles/components/ibm-ui.css` |
| Theme catalog | `src/theme/system.ts` |
| Theme control (orb) | `src/app/components/ThemeToggle.tsx` |

## Themes

Set on `<html data-theme="…">`. Cycle with the header orb.

`light` · `dark` · `contrast` · `paper` · `glass` · `frost` · `brutal` · `loom` · `tank` · `nes`

Default: **light** (warm paper `#f2f2f0`, Braun accent `#c45c26`).

Preference is stored in `localStorage` key `inspect-theme`.

## Core tokens

```css
--color-bg, --color-bg-elev, --color-text, --color-muted
--color-accent, --color-accent-2
--border-weak / --border / --border-strong
--space-*, --radius-*, --shadow-*, --motion-*
```

Legacy Inspect names (`--color-text-primary`, `--color-background-*`, `--spacing-*`, `--color-base-*`) are aliased in `design-tokens.css` so older modules keep working.

## Usage

Prefer semantic ibm tokens and `.btn` / `.form-input` / `.auth-card` / `.glass-card`. Avoid hard-coded hex and Bootstrap brand colors for new UI.
