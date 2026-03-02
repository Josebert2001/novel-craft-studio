

## Bug: Writing Agent Returns "Couldn't Generate a Response"

### Root Cause

The edge function `ai-analyze` enforces a **2,000 character limit** on the `systemPrompt` parameter (line 67). However, `agentLoop.ts` passes the entire synthesis prompt — which includes the system instructions, full chapter content, conversation history, AND tool results — as `systemPrompt` via:

```
analyzeText("Synthesize", synthesisPrompt)
```

This prompt easily exceeds 2,000 characters. The edge function returns a 400 error, `gemini.ts` swallows it as a generic error, and `agentLoop.ts` falls back to "I analyzed your chapter but couldn't generate a response."

The same issue affects the individual tool calls in `agentExecutor.ts` — they also pass chapter content as `systemPrompt`, which could exceed the limit for longer chapters.

### Fix (2 changes)

**1. Edge function (`supabase/functions/ai-analyze/index.ts`)**

- Increase `MAX_PROMPT_LENGTH` from `2000` to `50000` (same as text limit), since the synthesis prompt legitimately contains chapter content + tool results.
- Alternatively, remove the prompt length check entirely since Gemini handles its own context limits.

**2. Restructure the `analyzeText` call in `agentLoop.ts`**

- Swap the parameters so the large content goes into `text` (which already allows 50K chars) and keep a short system instruction as `systemPrompt`:

```typescript
// Before:
analyzeText("Synthesize", synthesisPrompt);

// After:
const systemInstruction = `${systemPrompt}\n\nKeep response under ${maxWords} words.`;
const userContent = `CHAPTER CONTENT:\n${contentToAnalyze}${conversationContext}\n\n---\n\nUser question: ${userMessage}\n\nTool Results:\n${toolResultsStr}`;
analyzeText(userContent, systemInstruction);
```

- Apply the same fix to `agentExecutor.ts` — the individual tool functions pass chapter content as `text` (first param) and the instruction as `systemPrompt` (second param), which is correct. No change needed there.

**3. Improve error visibility in `gemini.ts`**

- Log the actual error response body so future issues are easier to diagnose:

```typescript
if (data?.error) {
  console.error("AI error:", data.error); // Already exists, but ensure it logs the specific message
}
```

### Summary

The core fix is increasing `MAX_PROMPT_LENGTH` in the edge function to accommodate the agent's synthesis prompts, and restructuring the `analyzeText` call so large content goes in the `text` field. This will unblock all Writing Agent functionality.

