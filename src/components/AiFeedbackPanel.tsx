import { useState } from "react";
import { Loader2, X, Check, Copy } from "lucide-react";
import { AI_PERSONAS, AiPersona } from "../config/aiPersonas";
import { analyzeText, getApiKeyStatus } from "../lib/gemini";

interface AiFeedbackPanelProps {
  selectedText: string;
  totalAiRequests?: number;
  aiRequestLimit?: number;
  onApplySuggestion?: (text: string) => void;
  onDismiss?: () => void;
  onAnalyze?: (persona: string, feedback: string) => void;
}

export default function AiFeedbackPanel({
  selectedText,
  totalAiRequests = 0,
  aiRequestLimit = 10,
  onApplySuggestion,
  onDismiss: onDismissCallback,
  onAnalyze,
}: AiFeedbackPanelProps) {
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const hasApiKey = getApiKeyStatus();
  const personas = Object.values(AI_PERSONAS);

  const handlePersonaClick = async (persona: AiPersona) => {
    if (!hasApiKey) {
      setError("API key not configured. Contact the administrator.");
      return;
    }

    if (totalAiRequests >= aiRequestLimit) {
      setError(`Daily analysis limit reached (${aiRequestLimit}/day). Upgrade to continue.`);
      return;
    }

    if (activePersona === persona.id && feedback) {
      setFeedback("");
    } else {
      setActivePersona(persona.id);
    }

    if (!selectedText) {
      setError("No text selected");
      return;
    }

    setLoading(true);
    setError("");
    setFeedback("");

    try {
      const result = await analyzeText(selectedText, persona.systemPrompt);
      
      if (result.limitReached) {
        setError(result.error || "Daily AI limit reached. Resets tomorrow at midnight.");
        return;
      }

      if (result.error) {
        setError(result.error);
        return;
      }

      const responseText = result.result || "No response generated.";
      setFeedback(responseText);
      setActivePersona(persona.id);
      onAnalyze?.(persona.id, responseText);
    } catch (err) {
      setError("Unable to analyze. Please try again.");
      console.error("Analysis error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setActivePersona(null);
    setFeedback("");
    setError("");
    onDismissCallback?.();
  };

  const handleCopyFeedback = async () => {
    try {
      await navigator.clipboard.writeText(feedback);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const detectIfRewrite = (text: string): boolean => {
    return text.includes('"') || text.includes("'") || text.includes("`") || text.includes("**");
  };

  const extractRewriteFromFeedback = (text: string): string => {
    const quoteMatch = text.match(/"([^"]+)"/);
    if (quoteMatch && quoteMatch[1]) return quoteMatch[1];
    const backtickMatch = text.match(/`([^`]+)`/);
    if (backtickMatch && backtickMatch[1]) return backtickMatch[1];
    return text.replace(/\*\*/g, "").substring(0, 150).trim();
  };

  const textPreview = selectedText.length > 100 ? selectedText.substring(0, 100) + "..." : selectedText;

  const getPersonaColor = (color: string): { border: string; bg: string } => {
    const colors: Record<string, { border: string; bg: string }> = {
      blue: { border: "border-blue-500", bg: "bg-blue-50" },
      red: { border: "border-red-500", bg: "bg-red-50" },
      purple: { border: "border-purple-500", bg: "bg-purple-50" },
      green: { border: "border-green-500", bg: "bg-green-50" },
    };
    return colors[color] || { border: "border-gray-500", bg: "bg-gray-50" };
  };

  return (
    <div className="bg-background border border-border rounded-lg p-4">
      {!selectedText ? (
        <p className="text-sm text-muted-foreground italic">
          Select text to get AI feedback
        </p>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedText.length} characters selected
            </p>
            <p className="text-sm text-foreground bg-muted p-2 rounded">
              {textPreview}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {personas.map((persona) => {
              const disabledReason =
                !hasApiKey
                  ? "API key not configured"
                  : totalAiRequests >= aiRequestLimit
                    ? `Daily limit reached (${aiRequestLimit}/day)`
                    : null;

              return (
                <button
                  key={persona.id}
                  onClick={() => handlePersonaClick(persona)}
                  disabled={loading || !!disabledReason}
                  title={disabledReason}
                  className={`p-3 rounded-lg border-2 transition-all ${
                    activePersona === persona.id
                      ? `${getPersonaColor(persona.color).border} bg-white`
                      : "border-border bg-background hover:border-muted-foreground/50"
                  } disabled:opacity-50 disabled:cursor-not-allowed ${
                    disabledReason ? "disabled:hover:border-border" : ""
                  }`}
                >
                  <div className="text-lg mb-1">{persona.icon}</div>
                  <div className="text-xs font-medium text-foreground">{persona.name}</div>
                </button>
              );
            })}
          </div>

          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">Analyzing...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">{error}</p>
              {activePersona && (
                <button
                  onClick={() => {
                    const personaKey = Object.keys(AI_PERSONAS).find(
                      (key) => AI_PERSONAS[key].id === activePersona
                    );
                    if (personaKey) handlePersonaClick(AI_PERSONAS[personaKey]);
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {feedback && (
            <div className="bg-white border border-border rounded p-3 shadow-sm">
              <div className="flex items-start justify-between mb-2">
                <p className="text-xs font-semibold text-foreground">
                  {activePersona && (() => {
                    const personaKey = Object.keys(AI_PERSONAS).find(
                      (key) => AI_PERSONAS[key].id === activePersona
                    );
                    return personaKey ? AI_PERSONAS[personaKey].name + " Feedback" : "Feedback";
                  })()}
                </p>
                <button onClick={handleDismiss} className="text-muted-foreground hover:text-foreground transition-colors">
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed mb-4">{feedback}</p>

              <div className="flex flex-col gap-2 border-t border-border pt-3">
                <div className="flex gap-2">
                  {detectIfRewrite(feedback) && (
                    <button
                      onClick={() => {
                        const rewrite = extractRewriteFromFeedback(feedback);
                        onApplySuggestion?.(rewrite);
                        handleDismiss();
                      }}
                      className="flex-1 px-3 py-2 bg-green-600 text-white text-xs font-medium rounded hover:bg-green-700 transition-colors"
                    >
                      Apply Suggestion
                    </button>
                  )}
                  <button
                    onClick={handleCopyFeedback}
                    className="flex items-center justify-center gap-1 px-3 py-2 border border-border text-xs font-medium text-foreground rounded hover:bg-muted transition-colors flex-1"
                  >
                    {copied ? (<><Check size={14} /> Copied!</>) : (<><Copy size={14} /> Copy</>)}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button onClick={handleDismiss} className="flex-1 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    Dismiss
                  </button>
                  <button
                    onClick={() => {
                      const personaKey = Object.keys(AI_PERSONAS).find(
                        (key) => AI_PERSONAS[key].id === activePersona
                      );
                      if (personaKey) handlePersonaClick(AI_PERSONAS[personaKey]);
                    }}
                    disabled={loading}
                    className="flex-1 text-xs font-medium text-primary hover:text-primary/80 transition-colors underline disabled:opacity-50"
                  >
                    Try another
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
