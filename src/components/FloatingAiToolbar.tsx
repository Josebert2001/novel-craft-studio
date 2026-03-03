import { useState, useEffect, useRef } from "react";
import { Loader2, Sparkles, X, Copy, Check, ChevronDown, ChevronUp } from "lucide-react";
import { AI_PERSONAS } from "../config/aiPersonas";
import { analyzeText, getApiKeyStatus } from "../lib/gemini";

interface FloatingAiToolbarProps {
  selectedText: string;
  position: { x: number; y: number } | null;
  totalAiRequests: number;
  aiRequestLimit: number;
  onDismiss: () => void;
  onAnalyze: (persona: string, feedback: string) => void;
  onApplySuggestion?: (text: string) => void;
}

export default function FloatingAiToolbar({
  selectedText,
  position,
  totalAiRequests,
  aiRequestLimit,
  onDismiss,
  onAnalyze,
  onApplySuggestion,
}: FloatingAiToolbarProps) {
  const [activePersona, setActivePersona] = useState<string | null>(null);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const toolbarRef = useRef<HTMLDivElement>(null);

  const hasApiKey = getApiKeyStatus();
  const personas = Object.values(AI_PERSONAS);
  const isLimitReached = totalAiRequests >= aiRequestLimit;

  useEffect(() => {
    setActivePersona(null);
    setFeedback("");
    setError("");
    setExpanded(false);
  }, [selectedText]);

  const handlePersonaClick = async (personaId: string) => {
    if (isLimitReached || !hasApiKey) return;

    const persona = personas.find((p) => p.id === personaId);
    if (!persona) return;

    setActivePersona(personaId);
    setLoading(true);
    setError("");
    setFeedback("");
    setExpanded(true);

    try {
      const result = await analyzeText(selectedText, persona.systemPrompt);
      if (result.limitReached) {
        setError("Daily limit reached.");
        return;
      }
      if (result.error) {
        setError(result.error);
        return;
      }
      setFeedback(result.result || "");
      onAnalyze(personaId, result.result || "");
    } catch {
      setError("Analysis failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(feedback);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!position || !selectedText) return null;

  const TOOLBAR_WIDTH = 320;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = position.x - TOOLBAR_WIDTH / 2;
  let top = position.y - 56;

  if (left < 8) left = 8;
  if (left + TOOLBAR_WIDTH > viewportWidth - 8) left = viewportWidth - TOOLBAR_WIDTH - 8;
  if (top < 8) top = position.y + 32;

  return (
    <div
      ref={toolbarRef}
      className="fixed z-[100] shadow-2xl rounded-xl border border-border bg-background overflow-hidden animate-fade-in"
      style={{ left, top, width: TOOLBAR_WIDTH }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Persona Buttons Row */}
      <div className="flex items-center gap-1 p-2 border-b border-border bg-muted/40">
        <Sparkles className="h-3.5 w-3.5 text-primary shrink-0 ml-1" />
        {personas.map((persona) => (
          <button
            key={persona.id}
            onClick={() => handlePersonaClick(persona.id)}
            disabled={loading || isLimitReached}
            title={isLimitReached ? "Daily limit reached" : persona.name}
            className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
              activePersona === persona.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <span>{persona.icon}</span>
            <span className="hidden sm:inline">{persona.name.split(" ")[1]}</span>
          </button>
        ))}
        <button
          onClick={onDismiss}
          className="ml-auto p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex items-center gap-2 px-3 py-3">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">Analyzing...</span>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="px-3 py-2">
          <p className="text-xs text-destructive">{error}</p>
        </div>
      )}

      {/* Feedback */}
      {feedback && !loading && (
        <div className="px-3 py-2.5">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              {personas.find((p) => p.id === activePersona)?.name}
            </span>
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
            </button>
          </div>
          <p
            className={`text-xs text-foreground leading-relaxed ${
              expanded ? "" : "line-clamp-3"
            }`}
          >
            {feedback}
          </p>
          <div className="flex gap-2 mt-2.5">
            {onApplySuggestion && (() => {
              const rewritePatterns = [
                /\*\*Try this instead:\*\*/i,
                /\*\*Polish it to:\*\*/i,
                /\*\*Fix it like this:\*\*/i,
                /"[^"]{10,}"/,
              ];
              const hasRewrite = rewritePatterns.some((p) => p.test(feedback));
              if (!hasRewrite) return null;
              const extractRewrite = (text: string): string => {
                const m = text.match(/\*\*(?:Try this instead|Polish it to|Fix it like this):\*\*\s*"([^"]+)"/i);
                if (m?.[1]) return m[1];
                const q = text.match(/"([^"]{10,})"/);
                return q?.[1] || text.replace(/\*\*/g, "").substring(0, 150).trim();
              };
              return (
                <button
                  onClick={() => onApplySuggestion(extractRewrite(feedback))}
                  className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
                >
                  <Check className="h-3 w-3" />
                  Apply
                </button>
              );
            })()}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium border border-border rounded-md hover:bg-muted transition-colors"
            >
              {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => handlePersonaClick(activePersona!)}
              disabled={loading}
              className="flex items-center gap-1 px-2.5 py-1 text-[10px] font-medium text-primary hover:underline disabled:opacity-50"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Limit bar */}
      {isLimitReached && (
        <div className="px-3 py-2 bg-destructive/5 border-t border-destructive/20">
          <p className="text-[10px] text-destructive">Daily limit reached ({aiRequestLimit}/day)</p>
        </div>
      )}
    </div>
  );
}
