import { useState } from "react";
import { X, Settings } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export interface AgentSettings {
  responseStyle: "concise" | "balanced" | "detailed";
  autoRunTools: boolean;
  enabledTools: string[];
  contextWindow: "full" | "selection";
}

export const DEFAULT_AGENT_SETTINGS: AgentSettings = {
  responseStyle: "balanced",
  autoRunTools: true,
  enabledTools: [
    "analyze_emotions",
    "simulate_reader",
    "extract_story_bible",
    "generate_branches",
    "critique_prose",
    "check_consistency",
    "analyze_pacing",
    "summarize_chapter",
    "analyze_dialogue",
  ],
  contextWindow: "full",
};

const ALL_TOOLS = [
  { id: "analyze_emotions", label: "Emotion Analysis" },
  { id: "simulate_reader", label: "Reader Simulation" },
  { id: "extract_story_bible", label: "Story Bible" },
  { id: "critique_prose", label: "Prose Critique" },
  { id: "check_consistency", label: "Consistency Check" },
  { id: "generate_branches", label: "Branch Generation" },
  { id: "analyze_pacing", label: "Pacing Analysis" },
  { id: "summarize_chapter", label: "Chapter Summary" },
  { id: "analyze_dialogue", label: "Dialogue Analysis" },
];

const loadSettings = (): AgentSettings => {
  try {
    const raw = localStorage.getItem("ichen_agent_settings");
    if (!raw) return DEFAULT_AGENT_SETTINGS;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_AGENT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_AGENT_SETTINGS;
  }
};

export const useAgentSettings = () => {
  const [settings, setSettings] = useState<AgentSettings>(loadSettings);

  const updateSettings = (newSettings: AgentSettings) => {
    setSettings(newSettings);
    localStorage.setItem("ichen_agent_settings", JSON.stringify(newSettings));
  };

  return { settings, updateSettings };
};

interface AgentSettingsDialogProps {
  settings: AgentSettings;
  onSave: (settings: AgentSettings) => void;
}

export default function AgentSettingsDialog({ settings, onSave }: AgentSettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<AgentSettings>(settings);

  const handleOpen = (isOpen: boolean) => {
    if (isOpen) setDraft(settings);
    setOpen(isOpen);
  };

  const handleSave = () => {
    onSave(draft);
    setOpen(false);
  };

  const toggleTool = (toolId: string) => {
    setDraft((prev) => ({
      ...prev,
      enabledTools: prev.enabledTools.includes(toolId)
        ? prev.enabledTools.filter((t) => t !== toolId)
        : [...prev.enabledTools, toolId],
    }));
  };

  return (
    <Dialog open={open} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <button
          className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
          title="Agent settings"
        >
          <Settings className="h-3.5 w-3.5" />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[380px] p-0 gap-0">
        <DialogHeader className="px-4 py-3 border-b border-border">
          <DialogTitle className="text-sm font-semibold">Agent Settings</DialogTitle>
        </DialogHeader>

        <div className="px-4 py-4 space-y-5 max-h-[60vh] overflow-y-auto">
          {/* Response Style */}
          <fieldset>
            <legend className="text-xs font-semibold text-foreground mb-2">Response Style</legend>
            <div className="space-y-1.5">
              {(["concise", "balanced", "detailed"] as const).map((style) => (
                <label key={style} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="responseStyle"
                    checked={draft.responseStyle === style}
                    onChange={() => setDraft((p) => ({ ...p, responseStyle: style }))}
                    className="accent-[hsl(var(--primary))]"
                  />
                  <span className="text-sm capitalize text-foreground group-hover:text-primary transition-colors">
                    {style}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="border-t border-border" />

          {/* Tool Preferences */}
          <fieldset>
            <legend className="text-xs font-semibold text-foreground mb-2">Tool Preferences</legend>
            <div className="space-y-1.5">
              {ALL_TOOLS.map((tool) => (
                <label key={tool.id} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={draft.enabledTools.includes(tool.id)}
                    onChange={() => toggleTool(tool.id)}
                    className="accent-[hsl(var(--primary))] rounded"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {tool.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="border-t border-border" />

          {/* Context Window */}
          <fieldset>
            <legend className="text-xs font-semibold text-foreground mb-2">Context</legend>
            <div className="space-y-1.5">
              {([
                { value: "full" as const, label: "Full chapter" },
                { value: "selection" as const, label: "Selected text only" },
              ]).map((opt) => (
                <label key={opt.value} className="flex items-center gap-2 cursor-pointer group">
                  <input
                    type="radio"
                    name="contextWindow"
                    checked={draft.contextWindow === opt.value}
                    onChange={() => setDraft((p) => ({ ...p, contextWindow: opt.value }))}
                    className="accent-[hsl(var(--primary))]"
                  />
                  <span className="text-sm text-foreground group-hover:text-primary transition-colors">
                    {opt.label}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 px-4 py-3 border-t border-border">
          <button
            onClick={() => setOpen(false)}
            className="px-3 py-1.5 text-xs font-medium border border-border rounded-md hover:bg-muted transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-3 py-1.5 text-xs font-medium bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Save
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
