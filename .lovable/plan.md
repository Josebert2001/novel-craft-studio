

# Color Scheme Update

Updating the design system to use the specified brand palette across the entire application.

## Color Mapping

| Role | Current | New | Hex |
|------|---------|-----|-----|
| Primary | Blue-600 | Deep Blue | #1e40af |
| Accent/Secondary | Gray tones | Warm Gold | #f59e0b |
| Muted/Gray | Default gray | Soft Gray | #6b7280 |
| Background | Pure white | Off-white | #fafaf9 |

## Files to Change

### 1. `src/index.css` -- CSS Custom Properties (Light Mode)

Update the `:root` variables to the new palette (all values converted to HSL):

- `--background`: 40 33% 98% (off-white #fafaf9)
- `--foreground`: 224 71% 20% (deep navy for text contrast)
- `--primary`: 224 72% 40% (deep blue #1e40af)
- `--primary-foreground`: 0 0% 100% (white text on blue)
- `--secondary`: 38 92% 50% (warm gold #f59e0b)
- `--secondary-foreground`: 224 71% 15% (dark text on gold)
- `--muted`: 40 20% 94% (light warm gray)
- `--muted-foreground`: 220 9% 46% (soft gray #6b7280)
- `--accent`: 38 92% 50% (gold accent)
- `--accent-foreground`: 224 71% 15%
- `--border`: 40 15% 88%
- `--ring`: 224 72% 40%
- `--card` and `--popover`: off-white to match background
- Sidebar variables updated to complement the palette

Dark mode variables will also be adjusted to use darker variants of the same hues for consistency.

### 2. `src/App.css` -- Editor Styles

- Update `.lexical-content-editable` background from `white` to the off-white (`#fafaf9` / `hsl(40, 33%, 98%)`)
- Update `.lexical-editor-container` background similarly

### 3. `src/pages/Editor.tsx` -- Inline Color References

- Verify and update any hardcoded color classes (e.g., `bg-white`) to use the design system tokens (`bg-background`) for consistency with the new palette

No structural or behavioral changes -- purely a color/theming update.

