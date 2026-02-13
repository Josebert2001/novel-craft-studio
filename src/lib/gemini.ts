import { GoogleGenerativeAI } from "@google/generative-ai";

/**
 * Get the API key from environment variable
 */
export const getApiKey = (): string | null => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  return envKey || null;
};

export const initGemini = (): GoogleGenerativeAI | null => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.warn("No Gemini API key configured. Set VITE_GEMINI_API_KEY.");
    return null;
  }
  return new GoogleGenerativeAI(apiKey);
};

export const analyzeText = async (
  text: string,
  systemPrompt: string
): Promise<string> => {
  try {
    const apiKey = getApiKey();
    if (!apiKey) {
      return "API key not configured. Contact the administrator.";
    }

    if (!text || text.trim().length === 0) {
      return "No text selected for analysis.";
    }

    const client = initGemini();
    if (!client) {
      return "Could not initialize Gemini. API key not configured.";
    }

    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${systemPrompt}\n\nAnalyze this text:\n\n${text}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Gemini API error:", errorMsg);

    if (errorMsg.includes("API key") || errorMsg.includes("401") || errorMsg.includes("403")) {
      return "Invalid API key. Please check the configuration.";
    }
    if (errorMsg.includes("network") || errorMsg.includes("ENOTFOUND")) {
      return "Network error. Please check your internet connection.";
    }

    return "Unable to analyze. Please try again.";
  }
};

export const getApiKeyStatus = (): boolean => {
  return !!getApiKey();
};
