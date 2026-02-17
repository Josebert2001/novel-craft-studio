import { supabase } from "@/integrations/supabase/client";

export interface AnalyzeResult {
  result?: string;
  error?: string;
  limitReached?: boolean;
  resetAt?: string;
}

export const analyzeText = async (
  text: string,
  systemPrompt: string
): Promise<AnalyzeResult> => {
  try {
    if (!text || text.trim().length === 0) {
      return { result: "No text selected for analysis." };
    }

    const { data, error } = await supabase.functions.invoke("ai-analyze", {
      body: { text, systemPrompt },
    });

    if (error) {
      // Check for rate limit (FunctionsHttpError with 429)
      if (data?.limitReached) {
        return {
          error: data.error || "Daily AI limit reached. Resets tomorrow at midnight.",
          limitReached: true,
          resetAt: data.resetAt,
        };
      }
      console.error("Edge function error:", error);
      return { error: "Unable to analyze. Please try again." };
    }

    if (data?.limitReached) {
      return {
        error: data.error || "Daily AI limit reached.",
        limitReached: true,
        resetAt: data.resetAt,
      };
    }

    if (data?.error) {
      console.error("AI error:", data.error);
      return { error: "Unable to analyze. Please try again." };
    }

    return { result: data?.result || "No response generated." };
  } catch (error) {
    console.error("Analysis error:", error);
    return { error: "Unable to analyze. Please try again." };
  }
};

export const getApiKeyStatus = (): boolean => {
  return true; // Key is managed server-side
};
