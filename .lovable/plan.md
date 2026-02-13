
# Editable Book Title + Remove Frontend API Key Prompt

Two changes: make the book title editable in the header, and remove all frontend API key input since the key will be provided via environment variable (`VITE_GEMINI_API_KEY`).

## 1. Editable Book Title

**`src/pages/Editor.tsx`**:
- Add state: `const [bookTitle, setBookTitle] = useState("My First Novel")` (persisted to `localStorage` under `ichen_book_title`)
- Replace the static `<span>My First Novel</span>` in the header (line 229) with an inline-editable input that:
  - Displays as plain text normally (click to edit)
  - On click, becomes an `<input>` field
  - On blur or Enter, saves the new title back to state and localStorage
  - Shows a subtle pencil icon on hover to hint editability

## 2. Remove Frontend API Key Prompt

Since the Gemini API key will be set as `VITE_GEMINI_API_KEY` in Vercel deployment secrets, we remove the user-facing key input:

**`src/pages/Editor.tsx`**:
- Remove the `apiKey` state variable and `handleSaveApiKey` function
- Remove the amber "API Key Missing" banner (lines 202-215)
- Remove the Settings button from the header (line 237-239)
- Remove the `<SettingsModal>` component usage
- Remove the `SettingsModal` import
- Update all `apiKey` prop references passed to child components -- pass empty string or remove prop (since `gemini.ts` already reads `VITE_GEMINI_API_KEY` from the environment)

**`src/lib/gemini.ts`**:
- Simplify `getApiKey()` to only read from `import.meta.env.VITE_GEMINI_API_KEY`
- Remove the localStorage check for `ichen_gemini_key`
- Update error messages to say "API key not configured" instead of "check Settings"

**`src/components/SettingsModal.tsx`**:
- Delete this file entirely (no longer needed)

**`src/components/AiFeedbackPanel.tsx`**, **`src/components/EmotionHeatmap.tsx`**, **`src/components/GhostReader.tsx`**, **`src/components/WhatIfBranching.tsx`**, **`src/components/StoryBible.tsx`**:
- Remove `apiKey` prop from their interfaces if they accept it
- Update internal logic to use `getApiKey()` / `getApiKeyStatus()` from `gemini.ts` directly instead of relying on a passed prop

## Technical Notes

- The book title will persist in `localStorage` under key `ichen_book_title` so it survives page reloads
- The env variable `VITE_GEMINI_API_KEY` is already supported in `gemini.ts` as a fallback -- we just make it the only source
- No Supabase or backend changes needed for this step
