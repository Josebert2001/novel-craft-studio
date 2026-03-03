

## Full UI/UX Audit -- ICHEN Manuscript

### Pages Reviewed
Landing (`/`), Auth (`/auth`), Editor (`/editor`), Install (`/install`), Reset Password (`/reset-password`), 404 (`/*`)

---

### Issues Found

#### Critical

1. **ErrorBoundary component was never created.** Previous conversation claimed it was added and wrapped around all AI components in `Editor.tsx`, but the file `src/components/ErrorBoundary.tsx` does not exist. No imports or usage of it exist anywhere in the codebase. If any AI component throws a rendering error, the entire editor will crash with a white screen.

2. **Export button does nothing.** The "Export" button in the editor header (line 703) has no `onClick` handler -- it is a dead button that will confuse users.

3. **"Open Editor" on landing page bypasses auth.** The hero links directly to `/editor` without auth. While `ProtectedRoute` redirects unauthenticated users, clicking "Open Editor" sends them to `/auth` with no context about why. This is a confusing UX flow -- it should link to `/auth` directly or show a tooltip.

#### High Priority

4. **Living Codex buttons are non-functional.** The "Characters (0)" and "Locations (0)" buttons in the left sidebar (lines 854-861) have no `onClick` handlers. They appear interactive but do nothing.

5. **`onApplySuggestion` only logs to console.** Both in the Coach tab (line 1066) and the Branch tab (line 1096), applying AI suggestions just calls `console.log` instead of actually inserting text into the editor.

6. **Mobile: sidebars lack top offset.** Left and right sidebars on mobile use `fixed top-0 bottom-0` (lines 762, 964) which means they overlap the header bar. On mobile, the sidebar covers the entire screen including the header, with no close button visible -- users must tap the overlay to dismiss.

7. **No loading skeleton for editor.** When switching chapters, the editor remounts (via `key={currentChapterId}`) causing a brief flash. No skeleton or transition smooths this.

#### Medium Priority

8. **Auth page: left panel is mostly empty space.** On desktop, the branding panel (left half) has feature bullet points positioned low, with a large empty gap above them. The vertical centering of the form on the right doesn't match the content height on the left.

9. **Landing page nav items crowd on small screens.** The nav has "Install", "Sign In", and "Start Free" inline. On screens around 400-500px wide (between mobile and tablet), these items can overlap or feel cramped. The mobile screenshot shows them tight but functional.

10. **404 page is too minimal.** It lacks the app logo, consistent branding, or navigation back to the editor. It feels disconnected from the rest of the app.

11. **Dark mode not applied on landing/auth pages.** The dark mode toggle only exists in the editor header. If a user sets dark mode and navigates to the landing page or auth page, those pages render in light mode regardless, creating an inconsistent experience.

12. **Tab labels use emoji as primary identifiers.** The right sidebar tabs (Agent, Coach, Heatmap, Ghost, Branch, Bible) use emoji as the primary visual element. On some platforms/browsers, these render inconsistently or may appear as squares.

#### Low Priority / Polish

13. **Word count animation fires on chapter switch.** The `wordCountJustChanged` animation triggers when loading a new chapter because `handleWordCountChange` is called, causing a brief pulse effect that wasn't user-triggered.

14. **No confirmation before deleting chapters.** `handleDeleteChapter` immediately deletes without a confirmation dialog, unlike the Writing Agent's clear conversation prompt.

15. **Reset password page works correctly** -- invalid/expired state, form validation, and success state are all properly handled.

16. **Install page is clean and well-structured.** No issues found.

---

### Recommended Fix Plan

**Phase 1 -- Critical Fixes**
- Create the `ErrorBoundary` component and wrap all AI components in `Editor.tsx`
- Wire up the Export button or remove it
- Change "Open Editor" link to go to `/auth` instead of `/editor`

**Phase 2 -- Functional Fixes**
- Remove or disable Living Codex buttons (they are PLANNED features per the project guidelines)
- Add actual text insertion for `onApplySuggestion` (requires Lexical editor API integration)
- Fix mobile sidebar positioning to account for header height (`top-12 sm:top-16`)
- Add chapter delete confirmation dialog

**Phase 3 -- Polish**
- Improve 404 page with branding and navigation
- Propagate dark mode to landing/auth pages
- Replace emoji tab labels with Lucide icons for consistency
- Suppress word count animation on chapter load
- Add editor skeleton/transition when switching chapters

