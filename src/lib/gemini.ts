import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiInstance: GoogleGenerativeAI | null = null;

/**
 * Get the API key from localStorage (user-provided) or environment variable
 * Priority: localStorage > environment variable
 */
export const getApiKey = (): string | null => {
  // First check localStorage (user-provided via settings)
  const storedKey = localStorage.getItem("ichen_gemini_key");
  if (storedKey) {
    return storedKey;
  }

  // Fall back to environment variable (for production/CI)
  const envKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (envKey) {
    return envKey;
  }

  return null;
};

export const initGemini = (): GoogleGenerativeAI | null => {
  const apiKey = getApiKey();

  if (!apiKey) {
    console.warn(
      "No Gemini API key found. User must configure one in Settings."
    );
    return null;
  }

  // Create new instance with the provided key (don't cache to support key updates)
  return new GoogleGenerativeAI(apiKey);
};

export const analyzeText = async (
  text: string,
  systemPrompt: string
): Promise<string> => {
  try {
    // Validate API key exists
    const apiKey = getApiKey();
    if (!apiKey) {
      return "Please configure your Gemini API key in Settings to enable AI features.";
    }

    // Validate text exists
    if (!text || text.trim().length === 0) {
      return "No text selected for analysis.";
    }

    const client = initGemini();
    if (!client) {
      return "Could not initialize Gemini. Please check your API key in Settings.";
    }

    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });
    const fullPrompt = `${systemPrompt}\n\nAnalyze this text:\n\n${text}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const feedback = response.text();

    return feedback;
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    console.error("Gemini API error:", errorMsg);

    // Provide helpful error messages
    if (
      errorMsg.includes("API key") ||
      errorMsg.includes("401") ||
      errorMsg.includes("403")
    ) {
      return "Invalid API key. Please check your key in Settings.";
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
