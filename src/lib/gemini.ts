import { GoogleGenerativeAI } from "@google/generative-ai";

let geminiInstance: GoogleGenerativeAI | null = null;

export const initGemini = (): GoogleGenerativeAI => {
  if (geminiInstance) {
    return geminiInstance;
  }

  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  
  if (!apiKey) {
    throw new Error("VITE_GEMINI_API_KEY environment variable is not set");
  }

  geminiInstance = new GoogleGenerativeAI(apiKey);
  return geminiInstance;
};

export const analyzeText = async (
  text: string,
  systemPrompt: string
): Promise<string> => {
  try {
    const client = initGemini();
    const model = client.getGenerativeModel({ model: "gemini-1.5-flash" });

    const fullPrompt = `${systemPrompt}\n\nAnalyze this text:\n\n${text}`;

    const result = await model.generateContent(fullPrompt);
    const response = await result.response;
    const feedback = response.text();

    return feedback;
  } catch (error) {
    console.error("Gemini API error:", error);
    return "Unable to analyze. Please try again.";
  }
};

export const getApiKeyStatus = (): boolean => {
  return !!import.meta.env.VITE_GEMINI_API_KEY;
};
