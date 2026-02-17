import { supabase } from "@/integrations/supabase/client";

export const analyzeText = async (
  text: string,
  systemPrompt: string
): Promise<string> => {
  try {
    if (!text || text.trim().length === 0) {
      return "No text selected for analysis.";
    }

    const { data, error } = await supabase.functions.invoke("ai-analyze", {
      body: { text, systemPrompt },
    });

    if (error) {
      console.error("Edge function error:", error);
      return "Unable to analyze. Please try again.";
    }

    if (data?.error) {
      console.error("AI error:", data.error);
      return "Unable to analyze. Please try again.";
    }

    return data?.result || "No response generated.";
  } catch (error) {
    console.error("Analysis error:", error);
    return "Unable to analyze. Please try again.";
  }
};

export const getApiKeyStatus = (): boolean => {
  return true; // Key is managed server-side
};
