

## Tutorial Overlay -- Interactive 3-Step Onboarding

### What We're Building
A step-by-step tutorial overlay that highlights key areas of the editor on first use, guiding the user through: (1) writing in the canvas, (2) selecting text, and (3) clicking an AI persona. It uses spotlight-style highlighting with a tooltip at each step.

### New File
**`src/components/TutorialOverlay.tsx`**
- 3 steps with title, description, and a target area indicator
- Step 1: "Start Writing" -- points to the editor canvas area (center)
- Step 2: "Select Your Text" -- points to the editor canvas with instruction to highlight text
- Step 3: "Get AI Feedback" -- points to the right sidebar / AI persona buttons
- Each step shows a card with text, a step indicator (1/3, 2/3, 3/3), and Next/Skip buttons
- Uses a semi-transparent backdrop with a "spotlight" cutout effect (CSS box-shadow trick)
- "Don't show again" is stored in `localStorage` key `ichen_tutorial_completed`
- On final step, button says "Start Writing" and dismisses

### Editor Integration
**`src/pages/Editor.tsx`**
- Import `TutorialOverlay`
- Add state: `const [showTutorial, setShowTutorial] = useState(false)`
- After WelcomeModal closes, check if tutorial has been completed (`ichen_tutorial_completed` in localStorage). If not, show the tutorial
- Modify `WelcomeModal`'s `onClose` to trigger tutorial: `onClose={() => { setShowWelcome(false); if (!localStorage.getItem('ichen_tutorial_completed')) setShowTutorial(true); }}`
- Render `<TutorialOverlay open={showTutorial} onClose={() => setShowTutorial(false)} />` after the WelcomeModal

### Design
- Overlay: fixed full-screen, `z-[200]`, dark backdrop (`bg-black/60`)
- Tooltip card: white card with rounded corners, positioned near the highlighted area
- Step indicator: small dots or "Step 1 of 3" text
- Animations: fade-in for overlay, slide-up for tooltip card
- Consistent with existing Tailwind styling (uses `bg-background`, `text-foreground`, `border-border`)

