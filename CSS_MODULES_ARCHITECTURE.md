# CSS Modules Architecture

## Overview

This project has been migrated from a monolithic CSS approach to a modular CSS Modules architecture. This provides better maintainability, scoped styling, and improved developer experience.

## Directory Structure

```
src/styles/
├── index.css                    # Main entry point - imports all styles
├── tokens/
│   └── design-tokens.css        # CSS custom properties (design tokens)
├── utilities/
│   └── utility-classes.css      # Utility classes (like Tailwind)
├── components/
│   ├── button.css               # Button component styles
│   ├── client-side-page.module.css  # ClientSidePage component styles
│   ├── theme-switcher.module.css     # ThemeSwitcher component styles
│   └── login-register-links.module.css # LoginRegisterLinks component styles
├── themes/
│   └── theme-variations.css     # Theme variations (colors, spacing, etc.)
└── legacy/
    └── legacy-styles.css        # Legacy styles (to be migrated)
```

## Key Features

### 1. Design Tokens

- **Location**: `src/styles/tokens/design-tokens.css`
- **Purpose**: Centralized CSS custom properties for colors, typography, spacing, etc.
- **Usage**: All components reference these tokens for consistency

### 2. CSS Modules

- **Naming Convention**: `*.module.css`
- **Scoping**: Styles are automatically scoped to components
- **Import**: `import styles from './component.module.css'`
- **Usage**: `className={styles.className}`

### 3. Utility Classes

- **Location**: `src/styles/utilities/utility-classes.css`
- **Purpose**: Reusable utility classes (similar to Tailwind CSS)
- **Usage**: Direct className usage in JSX

### 4. Theme System

- **Location**: `src/styles/themes/theme-variations.css`
- **Features**: Color themes, spacing scales, border radius, shadows, typography
- **Usage**: Applied to `document.body` via ThemeSwitcher component

## Migration Status

### ✅ Completed

- [x] Design tokens extraction
- [x] CSS Modules structure creation
- [x] ClientSidePage component migration
- [x] ThemeSwitcher component migration
- [x] LoginRegisterLinks component migration
- [x] Button system migration
- [x] Layout.tsx updates
- [x] Build verification

### 🔄 In Progress

- [ ] FactsTable component migration
- [ ] RichTextEditor component migration
- [ ] Other component migrations

### 📋 Pending

- [ ] Legacy styles cleanup
- [ ] Component-specific CSS modules for remaining components
- [ ] Performance optimization
- [ ] Documentation updates

## Usage Examples

### CSS Modules

```tsx
import styles from "./component.module.css";

function MyComponent() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Hello World</h1>
    </div>
  );
}
```

### Utility Classes

```tsx
function MyComponent() {
  return (
    <div className="flex items-center justify-between p-4">
      <span className="text-lg font-semibold">Title</span>
      <button className="btn btn-primary">Action</button>
    </div>
  );
}
```

### Theme Switching

```tsx
// Themes are applied to document.body
document.body.classList.add("theme-blue", "spacing-compact");
```

## Benefits

1. **Scoped Styles**: CSS Modules prevent style conflicts
2. **Maintainability**: Clear separation of concerns
3. **Reusability**: Design tokens ensure consistency
4. **Performance**: Better CSS optimization and tree-shaking
5. **Developer Experience**: Better IntelliSense and autocomplete
6. **Scalability**: Easy to add new components and themes

## Best Practices

1. **Use CSS Modules for component-specific styles**
2. **Use utility classes for layout and common patterns**
3. **Reference design tokens for colors, spacing, etc.**
4. **Keep component styles focused and minimal**
5. **Use semantic class names in CSS Modules**
6. **Leverage CSS custom properties for theming**

## Migration Guide

When migrating a component to CSS Modules:

1. Create a `component-name.module.css` file
2. Move component-specific styles from global CSS
3. Update component imports: `import styles from './component.module.css'`
4. Replace className strings with `styles.className`
5. Test the component thoroughly
6. Remove old styles from global CSS files

## Future Improvements

- [ ] Add CSS-in-JS support for dynamic styling
- [ ] Implement CSS custom property fallbacks
- [ ] Add CSS linting and formatting rules
- [ ] Create component style documentation
- [ ] Implement CSS performance monitoring
