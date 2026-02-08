import { useState } from "react";
import { Loader2, X } from "lucide-react";
import { AI_PERSONAS, AiPersona } from "../config/aiPersonas";
import { analyzeText } from "../lib/gemini";

interface AiFeedbackPanelProps {
  selectedText: string;
}

export default function AiFeedbackPanel({ selectedText }: AiFeedbackPanelProps) {
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const personas = Object.values(AI_PERSONAS);

  const handlePersonaClick = async (persona: AiPersona) => {
    if (activePersona === persona.id && feedback) {
      // If clicking the same persona, allow re-analysis
      // Reset to allow new analysis
      setFeedback("");
    } else {
      // New persona selected or first analysis
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
      const response = await analyzeText(selectedText, persona.systemPrompt);
      setFeedback(response);
      setActivePersona(persona.id);
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
  };

  const textPreview =
    selectedText.length > 100
      ? selectedText.substring(0, 100) + "..."
      : selectedText;

  const getPersonaColor = (
    color: string
  ): {
    border: string;
    bg: string;
  } => {
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
          {/* Text Preview */}
          <div>
            <p className="text-xs text-muted-foreground mb-2">
              {selectedText.length} characters selected
            </p>
            <p className="text-sm text-foreground bg-muted p-2 rounded">
              {textPreview}
            </p>
          </div>

          {/* Persona Buttons Grid */}
          <div className="grid grid-cols-2 gap-2">
            {personas.map((persona) => (
              <button
                key={persona.id}
                onClick={() => handlePersonaClick(persona)}
                disabled={loading}
                className={`p-3 rounded-lg border-2 transition-all ${
                  activePersona === persona.id
                    ? `${getPersonaColor(persona.color).border} bg-white`
                    : "border-border bg-background hover:border-muted-foreground/50"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-lg mb-1">{persona.icon}</div>
                <div className="text-xs font-medium text-foreground">
                  {persona.name}
                </div>
              </button>
            ))}
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-5 w-5 text-primary animate-spin" />
              <span className="ml-2 text-sm text-muted-foreground">
                Analyzing...
              </span>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <p className="text-sm text-red-700">{error}</p>
              {activePersona && (
                <button
                  onClick={() => {
                    const personaKey = Object.keys(AI_PERSONAS).find(
                      (key) => AI_PERSONAS[key].id === activePersona
                    );
                    if (personaKey) {
                      handlePersonaClick(AI_PERSONAS[personaKey]);
                    }
                  }}
                  className="mt-2 text-xs text-red-600 hover:text-red-700 underline"
                >
                  Try again
                </button>
              )}
            </div>
          )}

          {/* Feedback Card */}
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
                <button
                  onClick={handleDismiss}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X size={16} />
                </button>
              </div>
              <p className="text-sm text-foreground leading-relaxed">
                {feedback}
              </p>
              <button
                onClick={() => {
                  const personaKey = Object.keys(AI_PERSONAS).find(
                    (key) => AI_PERSONAS[key].id === activePersona
                  );
                  if (personaKey) {
                    handlePersonaClick(AI_PERSONAS[personaKey]);
                  }
                }}
                disabled={loading}
                className="mt-3 text-xs font-medium text-primary hover:text-primary/80 underline disabled:opacity-50"
              >
                Try another persona
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
