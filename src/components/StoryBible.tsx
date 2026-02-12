import { useState } from "react";
import { Loader2, BookOpen, User, MapPin, Clock, ChevronDown, ChevronRight } from "lucide-react";
import { analyzeText } from "../lib/gemini";

interface Character {
  name: string;
  description: string;
  traits: string[];
  firstMention: number;
}

interface Location {
  name: string;
  description: string;
  atmosphere: string;
}

interface TimelineEvent {
  order: number;
  event: string;
  characters: string[];
}

interface StoryBibleData {
  characters: Character[];
  locations: Location[];
  timeline: TimelineEvent[];
}

interface StoryBibleProps {
  chapterContent: string;
  apiKey: string;
  onAnalyze?: () => void;
}

const STORY_BIBLE_PROMPT = `You are a story bible creator. Extract all characters, locations, and timeline events from the text.

Return ONLY JSON:
{
  "characters": [{"name":"Name","description":"Brief description","traits":["trait1","trait2"],"firstMention":1}],
  "locations": [{"name":"Place","description":"Brief description","atmosphere":"mood word"}],
  "timeline": [{"order":1,"event":"What happens","characters":["Name"]}]
}

If none found for a category, return an empty array. Be thorough.`;

export default function StoryBible({ chapterContent, apiKey, onAnalyze }: StoryBibleProps) {
  const [data, setData] = useState<StoryBibleData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>({
    characters: true,
    locations: true,
    timeline: false,
  });

  const analyze = async () => {
    if (!apiKey || !chapterContent.trim()) {
      setError(!apiKey ? "Configure API key first" : "No content to analyze");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await analyzeText(chapterContent, STORY_BIBLE_PROMPT);
      const jsonMatch = result.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as StoryBibleData;
        setData(parsed);
        onAnalyze?.();
      } else {
        setError("Could not parse story data");
      }
    } catch {
      setError("Extraction failed. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const toggle = (key: string) => setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-1.5">
          <BookOpen className="h-3.5 w-3.5" /> Story Bible
        </h3>
        <button
          onClick={analyze}
          disabled={loading || !apiKey}
          className="px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:opacity-90 disabled:opacity-50 transition-opacity"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Extract"}
        </button>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      {data && (
        <div className="space-y-2">
          {/* Characters */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggle("characters")}
              className="w-full flex items-center gap-2 p-2.5 bg-background hover:bg-muted/50 transition-colors text-left"
            >
              {expanded.characters ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <User className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Characters ({data.characters.length})
              </span>
            </button>
            {expanded.characters && (
              <div className="border-t border-border">
                {data.characters.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground p-2 italic">No characters found</p>
                ) : (
                  data.characters.map((c, i) => (
                    <div key={i} className="p-2.5 border-b border-border last:border-b-0">
                      <p className="text-xs font-semibold text-foreground">{c.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{c.description}</p>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {c.traits.map((t, j) => (
                          <span
                            key={j}
                            className="px-1.5 py-0.5 text-[9px] rounded-full bg-primary/10 text-primary font-medium"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Locations */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggle("locations")}
              className="w-full flex items-center gap-2 p-2.5 bg-background hover:bg-muted/50 transition-colors text-left"
            >
              {expanded.locations ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <MapPin className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Locations ({data.locations.length})
              </span>
            </button>
            {expanded.locations && (
              <div className="border-t border-border">
                {data.locations.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground p-2 italic">No locations found</p>
                ) : (
                  data.locations.map((l, i) => (
                    <div key={i} className="p-2.5 border-b border-border last:border-b-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold text-foreground">{l.name}</p>
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-accent text-accent-foreground">
                          {l.atmosphere}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{l.description}</p>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggle("timeline")}
              className="w-full flex items-center gap-2 p-2.5 bg-background hover:bg-muted/50 transition-colors text-left"
            >
              {expanded.timeline ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              <Clock className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-medium text-foreground">
                Timeline ({data.timeline.length})
              </span>
            </button>
            {expanded.timeline && (
              <div className="border-t border-border">
                {data.timeline.length === 0 ? (
                  <p className="text-[10px] text-muted-foreground p-2 italic">No events found</p>
                ) : (
                  data.timeline.map((e, i) => (
                    <div key={i} className="p-2.5 border-b border-border last:border-b-0 flex gap-2">
                      <span className="text-[10px] font-bold text-muted-foreground shrink-0 w-4 text-right">
                        {e.order}
                      </span>
                      <div>
                        <p className="text-[11px] text-foreground">{e.event}</p>
                        {e.characters.length > 0 && (
                          <p className="text-[9px] text-muted-foreground mt-0.5">
                            {e.characters.join(", ")}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && !data && !error && (
        <p className="text-xs text-muted-foreground italic">
          Extract characters, locations, and timeline from your text
        </p>
      )}
    </div>
  );
}
