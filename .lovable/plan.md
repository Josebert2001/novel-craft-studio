

## Implement 5 Missing Features

### 1. Add Password Reset Flow
- **`src/pages/Auth.tsx`**: Add a "Forgot password?" link below the sign-in form that calls `supabase.auth.resetPasswordForEmail()` with a simple inline flow (enter email, submit, show success message).
- **`src/pages/ResetPassword.tsx`**: New page that handles the Supabase recovery redirect. Lets user enter a new password and calls `supabase.auth.updateUser({ password })`.
- **`src/App.tsx`**: Add `/reset-password` route.

### 2. Integrate Keyboard Shortcuts into Editor
- **`src/pages/Editor.tsx`**: Import and render `KeyboardShortcuts` at the bottom of the left sidebar (below the chapter list). Also wire up global `keydown` listeners for Ctrl+S (save), Escape (exit focus mode), and Ctrl+Shift+F (toggle focus mode) since those are referenced in the UI but may not be fully connected.

### 3. Add Chapter Completion Toggle
- **`src/pages/Editor.tsx`**: Add a small checkbox or toggle icon next to each chapter in the sidebar to mark it as complete. Update the `isComplete` field in local state and persist to Supabase on toggle. Show a subtle visual indicator (e.g., strikethrough or check icon) for completed chapters.

### 4. Add Dark Mode Toggle
- **`src/pages/Editor.tsx`**: Add a Sun/Moon icon button in the header bar. Clicking it toggles `document.documentElement.classList.toggle('dark')` and persists the preference to `localStorage`.

### 5. Fix Mobile Editor Padding
- **`src/App.css`**: Add a media query to reduce `.lexical-content-editable` padding on small screens (e.g., `padding: 32px 16px` below 640px) and adjust `.lexical-placeholder` to match.

### Technical Details

All changes use existing patterns: Tailwind classes, Supabase client calls, localStorage for preferences, Lucide icons. No new dependencies needed. The reset password page reuses the Auth page's styling patterns.

