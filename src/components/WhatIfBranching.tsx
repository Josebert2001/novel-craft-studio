import { useState } from "react";
import { Loader2, GitBranch, Check, Copy, RefreshCw } from "lucide-react";
import { analyzeText, getApiKeyStatus } from "../lib/gemini";

interface Branch {
  id: string;
  text: string;
  style: string;
}

interface WhatIfBranchingProps {
  selectedText: string;
  onApply?: (text: string) => void;
  onAnalyze?: () => void;
}

const BRANCH_PROMPT = `You are a creative writing assistant. Generate 3 alternative versions of the given text, each with a different creative approach.

Return ONLY a JSON array:
[{"id":"1","text":"rewritten version...","style":"Brief style label like 'More dramatic' or 'Minimalist'"}]

Keep each version similar in length to the original. Be creative but maintain the core meaning.`;

export default function WhatIfBranching({ selectedText, onApply, onAnalyze }: WhatIfBranchingProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const hasApiKey = getApiKeyStatus();

  const generateBranches = async () => {
    if (!hasApiKey) {
      setError("API key not configured");
      return;
    }
    if (!selectedText || selectedText.trim().length < 10) {
      setError("Select more text to branch");
      return;
    }

    setLoading(true);
    setError("");
    setBranches([]);

    try {
      const response = await analyzeText(selectedText, BRANCH_PROMPT);
      if (response.limitReached || response.error) {
        setError(response.error || "Generation failed.");
        return;
      }
      const jsonMatch = (response.result || "").match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as Branch[];
        setBranches(parsed);
        onAnalyze?.();
      } else {
        setError("Could not generate branches");
      }
    } catch {
      setError("Generation failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <GitBranch className="h-3.5 w-3.5" /> What-If Branches
        </h3>
        <button
          onClick={generateBranches}
          disabled={loading || !hasApiKey || !selectedText}
          className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Branch"}
        </button>
      </div>

      {!selectedText && !branches.length && (
        <p className="text-xs text-muted-foreground italic">
          Select text to generate alternate versions
        </p>
      )}

      {selectedText && !branches.length && !loading && !error && (
        <div className="bg-background border border-border rounded p-2">
          <p className="text-[10px] text-muted-foreground mb-1">Selected text:</p>
          <p className="text-xs text-foreground line-clamp-3">{selectedText}</p>
        </div>
      )}

      {error && <p className="text-xs text-destructive">{error}</p>}

      {loading && (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">Forking reality...</span>
        </div>
      )}

      {branches.map((branch, i) => (
        <div key={branch.id} className="bg-background border border-border rounded-lg p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
              Branch {i + 1} • {branch.style}
            </span>
          </div>
          <p className="text-xs text-foreground leading-relaxed">{branch.text}</p>
          <div className="flex gap-1.5">
            <button
              onClick={() => onApply?.(branch.text)}
              className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium bg-primary/10 text-primary rounded hover:bg-primary/20 transition-colors"
            >
              <Check className="h-3 w-3" /> Merge
            </button>
            <button
              onClick={() => handleCopy(branch.text, branch.id)}
              className="flex items-center justify-center gap-1 px-2 py-1.5 text-[10px] font-medium border border-border rounded hover:bg-muted transition-colors"
            >
              {copiedId === branch.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
            </button>
          </div>
        </div>
      ))}

      {branches.length > 0 && (
        <button
          onClick={generateBranches}
          disabled={loading}
          className="w-full flex items-center justify-center gap-1 py-1.5 text-[10px] text-muted-foreground hover:text-foreground transition-colors"
        >
          <RefreshCw className="h-3 w-3" /> Regenerate branches
        </button>
      )}
    </div>
  );
}
