import { analyzeText, AnalyzeResult } from "@/lib/gemini";

const unwrap = async (promise: Promise<AnalyzeResult>): Promise<string> => {
  const res = await promise;
  if (res.error) throw new Error(res.error);
  return res.result || "No response generated.";
};

export const executeAnalyzeEmotions = (content: string): Promise<string> =>
  unwrap(analyzeText(content,
    "Analyze the emotional arc of this text. For each paragraph, rate the intensity (1-10) and identify the dominant emotion (joy, tension, sadness, fear). Return a structured analysis with specific paragraph numbers and scores. Be concise but specific."
  ));

export const executeSimulateReader = (content: string): Promise<string> =>
  unwrap(analyzeText(content,
    "You are a first-time reader experiencing this chapter. Point out exactly where you feel confused, what questions arise, and where your attention wanes. Be honest and specific about engagement issues. Use paragraph numbers to reference specific moments."
  ));

export const executeExtractStoryBible = (content: string): Promise<string> =>
  unwrap(analyzeText(content,
    "Extract all story elements from this text: 1) Characters (with brief descriptions), 2) Locations (with atmosphere notes), 3) Timeline events (in order), 4) Key facts or rules established. Be thorough and organized. Use bullet points for clarity."
  ));

export const executeGenerateBranches = (text: string, count: number = 2): Promise<string> =>
  unwrap(analyzeText(text,
    `Generate ${count} alternate versions of the following passage. Each version should take a different creative approach (e.g., more dramatic, more subtle, more descriptive, faster-paced). Clearly label each version (Version 1, Version 2, etc.). Keep similar length to the original.`
  ));

export const executeCritiqueProse = (content: string, focus?: string): Promise<string> =>
  unwrap(analyzeText(content,
    `Critique the prose quality of this text${focus ? `, focusing specifically on ${focus}` : ""}. Analyze: sentence structure, word choice, rhythm, clarity, and pacing. Provide specific examples with paragraph numbers. Suggest concrete improvements. Be constructive but honest.`
  ));

export const executeCheckConsistency = (currentChapter: string, previousChapters?: string): Promise<string> => {
  const prompt = `Compare this chapter to the context provided${previousChapters ? " from previous chapters" : ""}. Flag any inconsistencies in: character behavior, plot logic, timeline, established facts, or world rules. Be specific about what conflicts with what. If no previous context is provided, check for internal consistency within the chapter.`;
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
