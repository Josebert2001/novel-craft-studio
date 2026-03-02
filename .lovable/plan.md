

## Redesign the Writing Canvas to Match Reference

The reference image shows a clean, elevated white card sitting on a light gray background — like a real sheet of paper. The text area has generous padding, a subtle border/shadow, and rounded corners. Currently, the editor canvas has no card-like container; it's just a flat white area.

### Changes

**1. `src/pages/Editor.tsx` (line ~873-874)** — Wrap the editor in a card-like container with shadow, border, and rounded corners:
- The outer scrollable area gets a light muted background (`bg-muted/30`) to create contrast
- The inner `div` holding `LexicalEditor` gets `bg-white rounded-xl border shadow-sm` styling to create the elevated paper effect
- Add generous horizontal padding inside the card

**2. `src/App.css` (`.lexical-content-editable`)** — Increase padding to ~`60px 48px` for more breathing room inside the card, matching the spacious feel in the reference. Adjust placeholder position to match.

**3. `src/App.css` (`.lexical-editor-container`)** — Set `background-color: white` and add `border-radius: inherit` so it respects the card's rounded corners.

### Visual Result
- Light gray/muted background behind the writing area (like the reference)
- White, rounded, subtly shadowed card containing the text — feels like paper
- Generous internal padding for a premium, distraction-free writing feel
- Toolbar floats above the card as it already does

