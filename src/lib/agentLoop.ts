import { executeAgentTool } from "@/lib/agentExecutor";
import { AGENT_TOOLS } from "@/config/agentTools";
import { analyzeText } from "@/lib/gemini";

export interface AgentMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ToolExecution {
  toolName: string;
  status: "running" | "complete" | "error";
  result?: string;
}

export interface AgentLoopResult {
  response: string;
  toolsUsed: string[];
  iterations: number;
  usedMemory: boolean;
  error?: string;
}

const selectTools = (message: string): string[] => {
  const lower = message.toLowerCase();
  const tools: string[] = [];

  if (lower.includes("emotion") || lower.includes("feel") || lower.includes("impact")) {
    tools.push("analyze_emotions");
  }
  if (lower.includes("reader") || lower.includes("confus") || lower.includes("engage")) {
    tools.push("simulate_reader");
  }
  if (lower.includes("character") || lower.includes("location") || lower.includes("timeline")) {
    tools.push("extract_story_bible");
  }
  if (lower.includes("prose") || lower.includes("style") || lower.includes("writing")) {
    tools.push("critique_prose");
  }
  if (lower.includes("consistent") || lower.includes("plot hole") || lower.includes("contradict")) {
    tools.push("check_consistency");
  }
  if (lower.includes("branch") || lower.includes("alternate") || lower.includes("version")) {
    tools.push("generate_branches");
  }

  // Broad requests → multi-tool
  if (
    (lower.includes("analyze") || lower.includes("check") || lower.includes("review")) &&
    tools.length === 0
  ) {
    tools.push("simulate_reader", "critique_prose", "analyze_emotions");
  }

  // Fallback
  if (tools.length === 0) {
    tools.push("simulate_reader");
  }

  return tools;
};

export const runAgentLoop = async (
  userMessage: string,
  chapterContent: string,
  conversationHistory: AgentMessage[] = [],
  onToolUpdate?: (tool: ToolExecution) => void,
  maxIterations: number = 5
): Promise<AgentLoopResult> => {
  const toolsUsed: string[] = [];
  let iterations = 0;

  const hasMemory = conversationHistory.length > 0;

  const systemPrompt = `You are an expert book editor with memory of our ongoing conversation. You remember what we've discussed before and can build on previous analysis.

Available tools:
${AGENT_TOOLS.map((t) => `- ${t.name}: ${t.description}`).join("\n")}

When the user asks a question:
1. Decide which tools would best answer it
2. Use the tools to gather information
3. Synthesize the results into clear, actionable advice

When answering follow-up questions:
- Reference previous findings when relevant
- Don't repeat analysis you've already done unless asked
- Build on earlier insights to provide deeper, evolving feedback

IMPORTANT RULES:
- Use tools strategically - don't call every tool for every question
- If a question is simple, answer directly without tools
- When you use tools, explain what you found and why it matters
- Be concise but thorough
- Always explain WHY something needs fixing, not just WHAT to fix
- Respect the author's voice - suggest, don't dictate
- If building on previous analysis, briefly mention what you're referencing

Current chapter content is provided below. Use this context when analyzing.`;

  try {
    const toolsToUse = selectTools(userMessage);
    console.log("[AgentLoop] Selected tools:", toolsToUse);

    const toolResults: Record<string, string> = {};

    for (const toolName of toolsToUse) {
      iterations++;
      if (iterations > maxIterations) {
        console.log("[AgentLoop] Max iterations reached, stopping.");
        break;
      }

      console.log(`[AgentLoop] Executing tool: ${toolName}`);
      onToolUpdate?.({ toolName, status: "running" });
      toolsUsed.push(toolName);

      const args: Record<string, unknown> = {};
      if (toolName === "generate_branches") {
        args.text = chapterContent.slice(0, 500);
        args.count = 2;
      } else if (toolName === "check_consistency") {
        args.currentChapter = chapterContent;
      } else {
        args.content = chapterContent;
      }

      const { result, error } = await executeAgentTool(toolName, args);

      if (error) {
        console.error(`[AgentLoop] Tool ${toolName} failed:`, error);
        onToolUpdate?.({ toolName, status: "error", result: error });
        continue;
      }

      console.log(`[AgentLoop] Tool ${toolName} complete.`);
      toolResults[toolName] = result || "";
      onToolUpdate?.({ toolName, status: "complete", result });
    }

    // Build conversation memory (last 3 pairs)
    let conversationContext = "";
    if (conversationHistory.length > 0) {
      const recent = conversationHistory.slice(-6); // last 3 pairs max
      conversationContext = "\n\nPREVIOUS CONVERSATION:\n" +
        recent.map((m) => `${m.role === "user" ? "User" : "Agent"}: ${m.content}`).join("\n\n") +
        "\n\n---\n";
    }

    // Synthesize
    const synthesisPrompt = `${systemPrompt}\n\nCHAPTER CONTENT:\n${chapterContent}${conversationContext}\n\n---\n\nUser question: ${userMessage}\n\nTool Results:\n${Object.entries(toolResults)
      .map(([tool, res]) => `${tool}:\n${res}`)
      .join("\n\n---\n\n")}\n\nBased on these tool results and the conversation context, provide a clear, actionable response to the user's question. Synthesize the findings and explain what matters most. Keep it under 200 words.`;

    console.log("[AgentLoop] Synthesizing results...");
    const synthesisResult = await analyzeText("Synthesize", synthesisPrompt);

    return {
      response: synthesisResult.result || "I analyzed your chapter but couldn't generate a response.",
      toolsUsed,
      iterations,
      usedMemory: hasMemory,
    };
  } catch (error) {
    console.error("[AgentLoop] Error:", error);
    return {
      response: "",
      toolsUsed,
      iterations,
      usedMemory: hasMemory,
      error: "An error occurred while analyzing your chapter.",
    };
  }
};
