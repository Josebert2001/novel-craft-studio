import { useState } from "react";
import { Loader2, BarChart3 } from "lucide-react";
import { analyzeText, getApiKeyStatus } from "../lib/gemini";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

interface EmotionData {
  paragraph: number;
  joy: number;
  tension: number;
  sadness: number;
  fear: number;
  label: string;
}

interface EmotionHeatmapProps {
  chapterContent: string;
  onAnalyze?: () => void;
}

const EMOTION_COLORS: Record<string, string> = {
  joy: "hsl(48, 96%, 53%)",
  tension: "hsl(0, 84%, 60%)",
  sadness: "hsl(217, 91%, 60%)",
  fear: "hsl(270, 70%, 55%)",
};

const EMOTION_PROMPT = `You are an emotion analyzer. Analyze each paragraph of the following text and rate these emotions from 0-100: joy, tension, sadness, fear.

Return ONLY a JSON array like:
[{"paragraph":1,"joy":20,"tension":60,"sadness":10,"fear":30,"label":"Brief 3-word summary"}]

Include every paragraph. Be precise with scores.`;

export default function EmotionHeatmap({ chapterContent, onAnalyze }: EmotionHeatmapProps) {
  const [emotions, setEmotions] = useState<EmotionData[]>([]);
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
      const response = await analyzeText(chapterContent, EMOTION_PROMPT);
      if (response.limitReached || response.error) {
        setError(response.error || "Analysis failed.");
        return;
      }
      const jsonMatch = (response.result || "").match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as EmotionData[];
        setEmotions(parsed);
        onAnalyze?.();
      } else {
        setError("Could not parse emotion data");
      }
    } catch {
      setError("Analysis failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const getDominantEmotion = (d: EmotionData) => {
    const entries = [
      ["joy", d.joy],
      ["tension", d.tension],
      ["sadness", d.sadness],
      ["fear", d.fear],
    ] as [string, number][];
    return entries.reduce((a, b) => (b[1] > a[1] ? b : a))[0];
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <span>🎨</span> Emotion Heatmap
        </h3>
        <button
          onClick={analyze}
          disabled={loading || !hasApiKey}
          className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Analyze"}
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {emotions.length > 0 && (
        <>
          <div className="bg-background border border-border rounded-lg p-3">
            <p className="text-xs text-muted-foreground mb-2">Emotional Arc</p>
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={emotions}>
                <XAxis dataKey="paragraph" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} domain={[0, 100]} />
                <Tooltip contentStyle={{ fontSize: 11, borderRadius: 8 }} labelFormatter={(v) => `¶${v}`} />
                <Area type="monotone" dataKey="joy" stroke={EMOTION_COLORS.joy} fill={EMOTION_COLORS.joy} fillOpacity={0.2} strokeWidth={1.5} />
                <Area type="monotone" dataKey="tension" stroke={EMOTION_COLORS.tension} fill={EMOTION_COLORS.tension} fillOpacity={0.2} strokeWidth={1.5} />
                <Area type="monotone" dataKey="sadness" stroke={EMOTION_COLORS.sadness} fill={EMOTION_COLORS.sadness} fillOpacity={0.2} strokeWidth={1.5} />
                <Area type="monotone" dataKey="fear" stroke={EMOTION_COLORS.fear} fill={EMOTION_COLORS.fear} fillOpacity={0.2} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex gap-3 mt-2 justify-center">
              {Object.entries(EMOTION_COLORS).map(([key, color]) => (
                <span key={key} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                  <span className="w-2 h-2 rounded-full" style={{ background: color }} />
                  {key}
                </span>
              ))}
            </div>
          </div>

          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {emotions.map((d) => {
              const dominant = getDominantEmotion(d);
              return (
                <div key={d.paragraph} className="flex items-center gap-2 p-2 rounded border border-border bg-background">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ background: EMOTION_COLORS[dominant] }} />
                  <div className="min-w-0 flex-1">
                    <span className="text-xs font-medium text-foreground">¶{d.paragraph}</span>
                    <span className="text-[10px] text-muted-foreground ml-1.5">{d.label}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground capitalize">{dominant}</span>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && emotions.length === 0 && !error && (
        <p className="text-xs text-muted-foreground italic">
          Click Analyze to map your chapter's emotional journey
        </p>
      )}
    </div>
  );
}
