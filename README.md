# Novel Craft Studio (ICHEN Manuscript)

Human-first AI-assisted writing environment for long-form fiction. The app combines a rich text editor, chapter management, and multiple AI analysis tools while keeping authors in control of final decisions.

## App Functions

### Authentication and Access

- Email/password sign up and sign in via Supabase Auth.
- Password strength meter and confirm-password validation during sign up.
- Protected `/editor` route that redirects unauthenticated users to `/auth`.
- Sign out directly from the editor header.

### Writing Workspace

- Rich text editing with Lexical.
- Text formatting: bold, italic, underline.
- Block formatting: Heading 1/2/3, bullet list, numbered list.
- Markdown shortcuts (for headings and lists).
- Custom scene break node (`scene-break`) rendered as a visual separator.
- Live chapter word count from editor state.
- Focus mode with keyboard shortcut (`Ctrl/Cmd + Shift + F`) and `Esc` to exit.

### Book and Chapter Management

- Automatic first-run bootstrap: creates a default book and chapter for new users.
- Editable book title.
- Chapter list with:
- Add chapter.
- Delete chapter (minimum one chapter enforced).
- Rename chapter inline.
- Drag-and-drop chapter reordering.
- Per-chapter word count display in sidebar and editor.

### Saving and Sync

- Debounced autosave to Supabase (about every 2 seconds after edits).
- Manual save button in the header.
- Sync status states:
- `loading`
- `syncing`
- `synced` (with timestamp)
- `local-only` fallback when remote sync fails.
- Local persistence fallbacks in `localStorage` for chapter content and title.

### AI Functions

All AI requests go through the Supabase Edge Function `ai-analyze` and Gemini (`gemini-2.0-flash`).

- AI persona coaching on selected text with 4 editorial personas:
- The Clarity Coach
- The Emotional Reader
- The Plot Hunter
- The Style Polisher
- Floating AI toolbar appears when selecting text (`>10` chars).
- Right-panel AI coaching tab with selection stats and usage meter.
- Emotion Heatmap:
- Paragraph-by-paragraph emotion scoring (joy, tension, sadness, fear).
- Visual emotional arc chart and dominant-emotion indicators.
- Ghost Reader:
- Simulates first-time reader engagement by paragraph.
- Engagement score and paragraph-level notes/suggestions.
- What-If Branching:
- Generates 3 alternative rewrites for selected text.
- Story Bible:
- Extracts structured characters, locations, and timeline events from chapter text.

### AI Usage and Limits

- Daily AI analysis limit: `10` requests per user (enforced server-side).
- Limit tracking stored in `rate_limits` table.
- UI usage tracker and warning states near the limit.
- Recent AI feedback history (last 5 entries) saved locally:
- Expand/collapse feedback records.
- Delete individual records.
- Clear all history.

### Onboarding and UX

- Landing page with product overview and feature highlights.
- Welcome modal for first-time users with "Don't show again" preference.
- Responsive left and right sidebars with mobile overlays.

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui + Radix UI
- Lexical editor
- Supabase (Auth, Postgres, Edge Functions)
- Gemini API (via edge function)
- TanStack Query
- Vitest + Testing Library

## Local Development

### Prerequisites

- Node.js 18+ (or newer LTS)
- npm
- Supabase project (for auth, DB, and edge functions)

### Install and Run

```bash
git clone <YOUR_GIT_URL>
cd novel-craft-studio
npm install
npm run dev
```

App runs on Vite default (`http://localhost:5173`).

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run build:dev` - development-mode build
- `npm run preview` - preview production build
- `npm run lint` - run ESLint
- `npm run test` - run tests once
- `npm run test:watch` - run tests in watch mode

## Supabase and AI Configuration

Frontend uses `src/integrations/supabase/client.ts` for project URL and anon key.

Edge function `supabase/functions/ai-analyze/index.ts` requires:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GEMINI_API_KEY`

The edge function also includes:

- Auth verification from bearer token
- Input size validation
- Prompt sanitization
- CORS allowlist handling

## Database Notes

Migrations define and secure core tables:

- `profiles`
- `books`
- `chapters`
- `rate_limits`

RLS policies are enabled for user-scoped access to manuscript data.

## Project Structure (Main App Areas)

- `src/pages/Index.tsx` - marketing/landing page
- `src/pages/Auth.tsx` - authentication UI
- `src/pages/Editor.tsx` - main writing app shell
- `src/components/LexicalEditor.tsx` - editor composition
- `src/components/AiFeedbackPanel.tsx` - AI persona feedback UI
- `src/components/FloatingAiToolbar.tsx` - selection-based quick AI actions
- `src/components/EmotionHeatmap.tsx` - emotion analysis view
- `src/components/GhostReader.tsx` - engagement simulation view
- `src/components/WhatIfBranching.tsx` - alternate rewrite generator
- `src/components/StoryBible.tsx` - structured story extraction view
- `supabase/functions/ai-analyze/index.ts` - server-side AI gateway and rate limiting
