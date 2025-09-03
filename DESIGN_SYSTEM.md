# Design System & Theming Documentation

## Overview

This project now includes a comprehensive design system built with CSS custom properties (variables) that allows for easy theming and consistent design across the entire application.

## Files Structure

```
src/app/
├── design-system.css    # Core design tokens and variables
├── themes.css          # Theme configurations and variations
├── style.css           # Original styles (to be updated)
└── components/
    └── ThemeSwitcher.tsx  # Interactive theme switcher component
```

## Design Tokens

### Colors

The system includes a complete color palette with semantic naming:

- **Primary Colors**: Blue scale (default), with variations for other colors
- **Neutral Colors**: Grayscale for text, backgrounds, and borders
- **Semantic Colors**: Success, warning, error states
- **Semantic Variables**: Text, background, border, and link colors

### Typography

- **Font Families**: Sans-serif, serif, and monospace options
- **Font Sizes**: 10px to 60px scale
- **Font Weights**: Light to extra bold
- **Line Heights**: Tight, normal, and relaxed options

### Spacing

- **Scale**: 0 to 128px in consistent increments
- **Variables**: `--spacing-1` through `--spacing-32`
- **Responsive**: Scales with font size

### Border Radius

- **Scale**: 0 to 48px
- **Variables**: `--radius-sm` through `--radius-3xl`
- **Special**: `--radius-full` for circular elements

### Shadows

- **Intensities**: XS to 2XL
- **Variables**: `--shadow-xs` through `--shadow-2xl`
- **Special**: `--shadow-inner` for inset shadows

### Transitions

- **Speeds**: Fast (150ms), base (250ms), slow (350ms)
- **Easing**: In-out, out, and in curves

## Available Themes

### Color Themes

Apply to `<body>` or any container:

- `.theme-default` - Blue (default)
- `.theme-green` - Green
- `.theme-purple` - Purple
- `.theme-orange` - Orange
- `.theme-red` - Red
- `.theme-teal` - Teal

### Spacing Scales

- `.spacing-compact` - Tighter spacing
- `.spacing-comfortable` - More generous spacing

### Border Radius Styles

- `.radius-sharp` - No rounded corners
- `.radius-rounded` - More rounded corners
- `.radius-pill` - Pill-shaped corners

### Shadow Intensities

- `.shadow-subtle` - Lighter shadows
- `.shadow-bold` - Stronger shadows

## Usage Examples

### Basic Component Styling

```css
.my-component {
  background-color: var(--color-background-primary);
  color: var(--color-text-primary);
  padding: var(--spacing-4);
  border-radius: var(--radius-md);
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--color-border-primary);
}
```

### Using Utility Classes

```html
<div class="card p-4 m-2 rounded shadow">
  <h2 class="text-primary font-semibold">Title</h2>
  <p class="text-secondary">Content</p>
  <button class="btn btn-primary">Action</button>
</div>
```

### Applying Themes

```html
<!-- Apply a color theme -->
<body class="theme-purple">

<!-- Apply multiple theme variations -->
<body class="theme-green spacing-compact radius-rounded shadow-bold">
```

## Theme Switcher Component

The `ThemeSwitcher` component provides an interactive way to test different theme combinations:

```tsx
import ThemeSwitcher from './components/ThemeSwitcher';

// Use in any component
<ThemeSwitcher className="fixed top-4 right-4 z-50" />
```

### Features

- **Color Themes**: Switch between 6 different color schemes
- **Spacing**: Adjust the overall spacing scale
- **Border Radius**: Change corner roundness
- **Shadows**: Adjust shadow intensity
- **Persistence**: Saves preferences to localStorage
- **Real-time**: Updates apply immediately

## Updating Existing Styles

To migrate existing styles to use the design system:

1. **Replace hardcoded colors** with semantic variables:
   ```css
   /* Before */
   color: #333;
   
   /* After */
   color: var(--color-text-primary);
   ```

2. **Replace hardcoded spacing** with spacing variables:
   ```css
   /* Before */
   padding: 16px;
   
   /* After */
   padding: var(--spacing-4);
   ```

3. **Replace hardcoded border radius** with radius variables:
   ```css
   /* Before */
   border-radius: 8px;
   
   /* After */
   border-radius: var(--radius-lg);
   ```

4. **Replace hardcoded shadows** with shadow variables:
   ```css
   /* Before */
   box-shadow: 0 2px 4px rgba(0,0,0,0.1);
   
   /* After */
   box-shadow: var(--shadow-sm);
   ```

## Creating Custom Themes

To create a new color theme:

1. Add the theme class to `themes.css`:
   ```css
   .theme-custom {
     --color-primary-50: #f0f9ff;
     --color-primary-100: #e0f2fe;
     /* ... continue through 950 */
   }
   ```

2. Add it to the ThemeSwitcher component:
   ```tsx
   const themes = [
     // ... existing themes
     { name: 'Custom', class: 'theme-custom' },
   ];
   ```

## Best Practices

1. **Always use variables** instead of hardcoded values
2. **Use semantic color names** (e.g., `--color-text-primary` not `--color-gray-900`)
3. **Test with different themes** to ensure contrast and readability
4. **Consider dark mode** when choosing colors
5. **Use consistent spacing** throughout components
6. **Document custom additions** to the design system

## Browser Support

The design system uses CSS custom properties which are supported in:
- Chrome 49+
- Firefox 31+
- Safari 9.1+
- Edge 15+

For older browsers, consider using a CSS custom properties polyfill.

## Performance

- CSS custom properties are very performant
- No JavaScript required for basic theming
- Theme switching is instant
- Minimal CSS overhead

## Next Steps

1. **Update existing components** to use the design system
2. **Add more theme variations** as needed
3. **Create component-specific tokens** for complex components
4. **Add animation tokens** for consistent motion
5. **Create a design token export** for design tools
