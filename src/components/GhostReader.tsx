import { useState } from "react";
import { Loader2, Eye } from "lucide-react";
import { analyzeText, getApiKeyStatus } from "../lib/gemini";

interface ReadingPoint {
  paragraph: number;
  engagement: "hooked" | "engaged" | "neutral" | "confused" | "bored";
  note: string;
  suggestion?: string;
}

interface GhostReaderProps {
  chapterContent: string;
  onAnalyze?: () => void;
}

const ENGAGEMENT_CONFIG: Record<string, { emoji: string; color: string; label: string }> = {
  hooked: { emoji: "🔥", color: "hsl(25, 95%, 53%)", label: "Hooked" },
  engaged: { emoji: "👍", color: "hsl(142, 71%, 45%)", label: "Engaged" },
  neutral: { emoji: "😐", color: "hsl(215, 16%, 47%)", label: "Neutral" },
  confused: { emoji: "❓", color: "hsl(48, 96%, 53%)", label: "Confused" },
  bored: { emoji: "😴", color: "hsl(0, 84%, 60%)", label: "Bored" },
};

const GHOST_READER_PROMPT = `You are simulating a first-time reader's experience. Read the text paragraph by paragraph and rate your engagement level at each point.

For each paragraph, provide:
- paragraph number (1-indexed)
- engagement level: "hooked", "engaged", "neutral", "confused", or "bored"
- a brief note explaining WHY (max 15 words)
- suggestion for improvement if engagement is "confused" or "bored" (max 20 words, optional)

Return ONLY a JSON array:
[{"paragraph":1,"engagement":"engaged","note":"Strong opening hook draws me in","suggestion":""}]

Be honest and critical. A real reader would get bored or confused sometimes.`;

export default function GhostReader({ chapterContent, onAnalyze }: GhostReaderProps) {
  const [points, setPoints] = useState<ReadingPoint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hasApiKey = getApiKeyStatus();

  const analyze = async () => {
    if (!hasApiKey || !chapterContent.trim()) {
      setError(!hasApiKey ? "API key not configured" : "No content to analyze");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await analyzeText(chapterContent, GHOST_READER_PROMPT);
      const jsonMatch = result.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as ReadingPoint[];
        setPoints(parsed);
        onAnalyze?.();
      } else {
        setError("Could not parse reader data");
      }
    } catch {
      setError("Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const engagementScore = points.length
    ? Math.round(
        (points.filter((p) => p.engagement === "hooked" || p.engagement === "engaged").length /
          points.length) *
          100
      )
    : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5" /> Ghost Reader
        </h3>
        <button
          onClick={analyze}
          disabled={loading || !hasApiKey}
          className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Simulate"}
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {points.length > 0 && (
        <>
          <div className="bg-background border border-border rounded-lg p-3 text-center">
            <p className="text-[10px] text-muted-foreground mb-1">Reader Engagement Score</p>
            <p className={`text-2xl font-bold ${
              engagementScore >= 70 ? "text-green-600" : engagementScore >= 40 ? "text-yellow-600" : "text-red-600"
            }`}>
              {engagementScore}%
            </p>
            <div className="flex justify-center gap-1 mt-2">
              {points.map((p, i) => (
                <span
                  key={i}
                  className="w-2 h-6 rounded-sm"
                  style={{
                    background: ENGAGEMENT_CONFIG[p.engagement]?.color || "hsl(215, 16%, 47%)",
                    opacity: 0.8,
                  }}
                  title={`¶${p.paragraph}: ${p.engagement}`}
                />
              ))}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 justify-center">
            {Object.entries(ENGAGEMENT_CONFIG).map(([key, val]) => (
              <span key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span>{val.emoji}</span> {val.label}
              </span>
            ))}
          </div>

          <div className="space-y-1.5 max-h-[250px] overflow-y-auto">
            {points.map((p) => {
              const config = ENGAGEMENT_CONFIG[p.engagement] || ENGAGEMENT_CONFIG.neutral;
              return (
                <div key={p.paragraph} className="p-2 rounded border border-border bg-background">
                  <div className="flex items-center gap-2">
                    <span>{config.emoji}</span>
                    <span className="text-xs font-medium text-foreground">¶{p.paragraph}</span>
                    <span
                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                      style={{ background: config.color + "20", color: config.color }}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mt-1 ml-6">{p.note}</p>
                  {p.suggestion && (
                    <p className="text-[10px] text-primary mt-1 ml-6 italic">💡 {p.suggestion}</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && points.length === 0 && !error && (
        <p className="text-xs text-muted-foreground italic">
          Simulate a reader's journey through your chapter
        </p>
      )}
    </div>
  );
}
