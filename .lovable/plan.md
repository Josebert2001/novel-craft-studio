

# Full Backend Setup: Database, Auth, Protected Routes, and Editor Integration

## Overview

This plan covers everything needed to make ICHEN Manuscript production-ready with Supabase: database tables, authentication pages, protected routes, and user-specific data persistence.

---

## Step 1: Database Migration

Run a SQL migration to create three tables with Row Level Security:

**`profiles`** -- auto-created on signup via trigger
- `id` (uuid, PK, references auth.users ON DELETE CASCADE)
- `email` (text)
- `display_name` (text)
- `created_at` (timestamptz)

**`books`** -- stores book metadata per user
- `id` (uuid, PK, auto-generated)
- `user_id` (uuid, NOT NULL, references auth.users ON DELETE CASCADE)
- `title` (text, default 'My First Novel')
- `created_at`, `updated_at` (timestamptz)

**`chapters`** -- stores manuscript content
- `id` (uuid, PK, auto-generated)
- `book_id` (uuid, NOT NULL, references books ON DELETE CASCADE)
- `user_id` (uuid, NOT NULL, references auth.users ON DELETE CASCADE)
- `title`, `content`, `word_count`, `sort_order`
- `created_at`, `updated_at` (timestamptz)

**RLS Policies** (on all tables):
- Users can only SELECT, INSERT, UPDATE, DELETE their own rows (`auth.uid() = user_id` or `auth.uid() = id` for profiles)

**Triggers**:
- `handle_new_user` -- auto-creates a profile row when a user signs up
- `update_updated_at` -- auto-updates `updated_at` on books and chapters when modified

---

## Step 2: Authentication Page

**New file: `src/pages/Auth.tsx`**

A clean, centered auth card with:
- Toggle between Sign Up and Sign In modes
- Email + password inputs (confirm password for sign up)
- Supabase auth calls: `signUp()` / `signInWithPassword()`
- Error messages in red, loading states on buttons
- Redirect to `/editor` on success
- If already logged in, redirect to `/editor`
- ICHEN Manuscript logo at top

---

## Step 3: Auth Hook

**New file: `src/hooks/useAuth.ts`**

Exports `useAuth()` returning:
- `user` -- current Supabase user or null
- `loading` -- true while checking auth state
- `signOut()` -- calls `supabase.auth.signOut()`

Uses `onAuthStateChange` listener with proper cleanup.

---

## Step 4: Protected Routes

**Modified: `src/App.tsx`**

- Add `/auth` route pointing to `Auth.tsx`
- Create a `ProtectedRoute` wrapper component
- Wrap `/editor` with `ProtectedRoute` (redirects to `/auth` if not logged in, shows spinner while loading)
- Root `/` redirects to `/editor` (which then redirects to `/auth` if needed)

---

## Step 5: Logout + User Info in Editor

**Modified: `src/pages/Editor.tsx`**

- Import `useAuth` hook
- Show user email (truncated) in the header
- Add "Sign Out" button (uses `LogOut` icon from lucide-react)
- On sign out, redirect to `/auth`

---

## Step 6: Secure AI Proxy (Edge Function)

**New file: `supabase/functions/ai-analyze/index.ts`**

- Accepts POST `{ text, systemPrompt }`
- Reads `GEMINI_API_KEY` from Deno.env (stored as Supabase secret)
- Calls Gemini API server-side via fetch (no SDK needed)
- Returns `{ result }` or `{ error }`

**Modified: `src/lib/gemini.ts`**
- Replace direct Gemini SDK calls with `supabase.functions.invoke("ai-analyze", ...)`
- `getApiKeyStatus()` returns `true` always (key is server-side)

**Secret required**: `GEMINI_API_KEY` -- you will be prompted to provide it.

---

## Technical Summary

### Files to Create
- `src/pages/Auth.tsx`
- `src/hooks/useAuth.ts`
- `supabase/functions/ai-analyze/index.ts`

### Files to Modify
- `src/App.tsx` -- add auth route + protected routes
- `src/pages/Editor.tsx` -- add sign out button, user display
- `src/lib/gemini.ts` -- use edge function instead of direct API

### Database Migration
Single migration creating profiles, books, chapters tables with RLS and triggers.

### User Actions Required
- Set `GEMINI_API_KEY` as a Supabase secret (you will be prompted)
- Supabase email auth is enabled by default -- no dashboard action needed for email/password login

