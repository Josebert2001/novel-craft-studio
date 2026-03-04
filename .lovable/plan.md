

## Plan: Inline Grammar Underlines (Grammarly-style)

### Approach

Use a **DOM overlay** technique rather than modifying Lexical nodes. This avoids conflicts with Lexical's internal state management and is how Grammarly itself works.

A new `GrammarHighlightPlugin` component (inside `LexicalComposer`) will:

1. Listen for `grammarIssues` changes (passed as a prop)
2. Walk the editor's DOM text nodes to find the character offsets matching each issue
3. Use `Range.getClientRects()` to get pixel positions of the error text
4. Render absolutely-positioned colored underline `<div>`s in an overlay container on top of the editor

### Files to change

**1. New file: `src/components/editor/GrammarHighlightPlugin.tsx`**
- Accepts `issues: GrammarIssue[]` as prop
- Uses `useLexicalComposerContext()` to access the editor DOM element via `editor.getRootElement()`
- Walks DOM text nodes, tracking global character offset to map each issue's `offset`/`length` to a DOM `Range`
- Calls `range.getClientRects()` to get bounding rectangles relative to the editor root
- Renders an overlay `<div>` (absolute positioned, pointer-events: none) containing colored underline divs for each rect
- Recalculates on: issues change, editor scroll, window resize, editor updates
- Color-codes by type: red wavy for grammar/spelling, blue for style, yellow for passive

**2. Update: `src/components/LexicalEditor.tsx`**
- Accept new optional prop: `grammarIssues?: GrammarIssue[]`
- Add `<GrammarHighlightPlugin issues={grammarIssues} />` inside the `LexicalComposer`

**3. Update: `src/pages/Editor.tsx`**
- Pass `grammarIssues={grammarIssues}` to the `<LexicalEditor>` component

**4. Update: `src/App.css`**
- Add styles for `.grammar-underline` (wavy/straight underlines using `background-image` repeating SVG pattern or `border-bottom`)
- Red for grammar/spelling, blue for style, yellow for passive/weak-verb
- `pointer-events: none` on the overlay container

### Key technical detail

The overlay recalculation uses `requestAnimationFrame` and listens to scroll/resize events so underlines stay in sync with text positions. Each underline div is ~3px tall, positioned at the bottom of the text rect.

