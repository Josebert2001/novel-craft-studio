import { analyzeText, AnalyzeResult } from "@/lib/gemini";

const unwrap = async (promise: Promise<AnalyzeResult>): Promise<string> => {
  const res = await promise;
  if (res.error) throw new Error(res.error);
  return res.result || "No response generated.";
};

export const executeAnalyzeEmotions = (content: string): Promise<string> =>
  unwrap(analyzeText(content,
    `You are an emotional arc analyst. When analyzing text:

1. Rate each paragraph's emotional intensity (1-10)
2. Identify the dominant emotion (joy, tension, sadness, fear, surprise, anger)
3. SUGGEST how to amplify weak moments

Format:
**Paragraph [#]:** Intensity [X/10] — [Emotion]
**What's working:** [Brief note]
**To amplify:** "[Specific rewrite or technique]"

Highlight the strongest and weakest emotional moments. Keep under 200 words.`
  ));

export const executeSimulateReader = (content: string): Promise<string> =>
  unwrap(analyzeText(content,
    `You are a first-time reader. Be brutally honest about your experience:

1. Where did you get confused or bored?
2. What questions arose that weren't answered?
3. SUGGEST specific fixes for each issue

Format:
**Paragraph [#] — [Confused/Bored/Lost]:** [What happened]
**Fix it like this:** "[Your suggested change]"
**Why:** [Brief explanation]

Always suggest concrete fixes, not just observations. Keep under 200 words.`
  ));

export const executeExtractStoryBible = (content: string): Promise<string> =>
  unwrap(analyzeText(content,
    `Extract all story elements from this text in a structured format:

**Characters:**
- [Name]: [Brief description, key traits, relationships]

**Locations:**
- [Place]: [Atmosphere, sensory details established]

**Timeline:**
- [Event in order]: [When it happens relative to other events]

**Rules & Facts:**
- [Any world-building rules or established facts]

Be thorough. Flag any elements that feel underdeveloped with a ⚠️ marker.`
  ));

export const executeGenerateBranches = (text: string, count: number = 2): Promise<string> =>
  unwrap(analyzeText(text,
    `Generate ${count} alternate versions of this passage. Each must take a clearly different creative direction.

Format each version like this:
**Version [#] — [Approach, e.g. "More Intimate" or "Faster Paced"]**
"[Your full rewritten version]"
**What changed:** [Brief explanation of the creative choice]

Keep each version similar in length to the original. Make the differences bold and meaningful, not subtle.`
  ));

export const executeCritiqueProse = (content: string, focus?: string): Promise<string> =>
  unwrap(analyzeText(content,
    `You are a prose editor${focus ? ` focusing on ${focus}` : ""}. Find weak sentences and make them stronger.

Format:
**Weak sentence:** "[Quote it]"
**Polish it to:** "[Your improved version]"
**What improved:** [Brief explanation — rhythm, clarity, word choice, etc.]

Provide 2-3 concrete before/after examples. Keep under 150 words.`
  ));

export const executeCheckConsistency = (currentChapter: string, previousChapters?: string): Promise<string> => {
  const prompt = `You are a continuity editor. Find inconsistencies${previousChapters ? " between this chapter and previous ones" : " within this chapter"}.

Format:
**Inconsistency:** [What conflicts with what]
**Where:** [Paragraph or section reference]
**Fix it like this:** "[Your suggested correction]"
**Why it matters:** [Brief explanation]

If everything is consistent, say so and note what's well-maintained. Keep under 200 words.`;
  const content = previousChapters
    ? `CURRENT CHAPTER:\n${currentChapter}\n\nPREVIOUS CHAPTERS:\n${previousChapters}`
    : currentChapter;
  return unwrap(analyzeText(content, prompt));
};

export const executeAgentTool = async (
  toolName: string,
  args: Record<string, unknown>
): Promise<{ result?: string; error?: string }> => {
  try {
    let result: string;

    switch (toolName) {
      case "analyze_emotions":
        result = await executeAnalyzeEmotions(args.content as string);
        break;
      case "simulate_reader":
        result = await executeSimulateReader(args.content as string);
        break;
      case "extract_story_bible":
        result = await executeExtractStoryBible(args.content as string);
        break;
      case "generate_branches":
        result = await executeGenerateBranches(args.text as string, (args.count as number) || 2);
        break;
      case "critique_prose":
        result = await executeCritiqueProse(args.content as string, args.focus as string | undefined);
        break;
      case "check_consistency":
        result = await executeCheckConsistency(args.currentChapter as string, args.previousChapters as string | undefined);
        break;
      default:
        return { error: `Unknown tool: ${toolName}` };
    }

    return { result };
  } catch (error) {
    console.error(`Error executing tool ${toolName}:`, error);
    return { error: `Failed to execute ${toolName}` };
  }
};
