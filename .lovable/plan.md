

# Plan: Chapter CRUD Operations + Welcome Modal

## What Already Works
The Editor already has Supabase-connected add, delete, and content saving for chapters. The remaining gaps are: **chapter title editing**, **drag-and-drop reordering**, **loading states during operations**, and the **Welcome Modal**.

## Changes

### 1. Chapter Title Editing (Editor.tsx)
- Add inline title editing in the left sidebar (click chapter title to edit)
- On save, UPDATE the `chapters` table with the new title
- Update local state simultaneously

### 2. Loading States for Chapter Operations (Editor.tsx)
- Add a `chapterLoading` state (e.g., `"adding" | "deleting" | null`)
- Disable the "Add Chapter" button and show a spinner while inserting
- Show a brief loading indicator on the chapter being deleted
- Replace the `alert()` on single-chapter delete with a toast notification

### 3. Drag-and-Drop Chapter Reordering (Editor.tsx)
- Use native HTML5 drag-and-drop (no new dependencies needed)
- Add `draggable` attribute and drag event handlers to chapter items
- On drop, reorder the local chapters array
- Batch update `sort_order` for all affected chapters in Supabase

### 4. Welcome Modal (new file: src/components/WelcomeModal.tsx)
- Create a modal component shown when:
  - The user has no existing books (first signup)
  - localStorage key `ichen_welcome_dismissed` is not set
- Content: Welcome message, 3-point interface guide (left sidebar, center canvas, right AI coach), "Start Writing" button
- Checkbox: "Don't show this again" saves to localStorage
- Styling: centered overlay with backdrop blur, white card, fade-in animation, ICHEN logo

### 5. Integration in Editor.tsx
- After data loads, check if this is a first-time user (book was just created, no chapters existed)
- Show `WelcomeModal` if conditions are met
- Pass `onClose` handler to dismiss and set localStorage flag

## Technical Details

### Files Modified
- `src/pages/Editor.tsx` -- Add chapter title editing UI, drag-and-drop handlers, loading states, welcome modal integration

### Files Created
- `src/components/WelcomeModal.tsx` -- Welcome modal component

### No Database Changes Required
All necessary tables and RLS policies already exist. Chapter title updates use the existing `chapters` UPDATE policy. Reordering updates `sort_order` using the same policy.

### Chapter Title Edit Flow
```text
Click title --> Show inline input
  --> On Enter/blur --> UPDATE chapters SET title = ? WHERE id = ? AND user_id = auth.uid()
  --> Update local state
  --> On Escape --> Cancel edit
```

### Drag-and-Drop Flow
```text
Drag chapter item --> Track drag index
  --> Drop on target --> Reorder local array
  --> Batch UPDATE sort_order for all chapters in Supabase
  --> Fallback: revert on error
```

