import { useState, useEffect } from "react";
import { ChevronDown, Trash2 } from "lucide-react";
import { AI_PERSONAS } from "../config/aiPersonas";

export interface FeedbackRecord {
  id: string;
  persona: string;
  timestamp: number;
  selectedText: string;
  feedback: string;
}

interface RecentFeedbackProps {
  history: FeedbackRecord[];
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

export default function RecentFeedback({
  history,
  onDelete,
  onClearAll,
}: RecentFeedbackProps) {
  const [expanded, setExpanded] = useState<string | null>(null);

  const getTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  const getPersonaInfo = (personaId: string) => {
    const persona = Object.values(AI_PERSONAS).find((p) => p.id === personaId);
    return persona || { name: "Unknown", icon: "?" };
  };

  if (history.length === 0) {
    return (
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground italic">No feedback yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold text-foreground">
          Recent Feedback
        </h3>
        {history.length > 0 && (
          <button
            onClick={onClearAll}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-1 max-h-64 overflow-y-auto">
        {history.map((record) => {
          const persona = getPersonaInfo(record.persona);
          const textPreview =
            record.selectedText.length > 50
              ? record.selectedText.substring(0, 50) + "..."
              : record.selectedText;
          const feedbackPreview =
            record.feedback.length > 100
              ? record.feedback.substring(0, 100) + "..."
              : record.feedback;
          const isExpanded = expanded === record.id;

          return (
            <div
              key={record.id}
              className="border border-border rounded bg-muted/30 hover:bg-muted/50 transition-colors"
            >
              <button
                onClick={() =>
                  setExpanded(isExpanded ? null : record.id)
                }
                className="w-full p-2 text-left flex items-start gap-2"
              >
                <ChevronDown
                  size={14}
                  className={`mt-0.5 flex-shrink-0 transition-transform ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm">{persona.icon}</span>
                    <span className="text-xs font-medium text-foreground">
                      {persona.name}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(record.timestamp)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    "{textPreview}"
                  </p>
                </div>
              </button>

              {isExpanded && (
                <div className="border-t border-border p-3 bg-background space-y-2">
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Original text:
                    </p>
                    <p className="text-xs text-foreground bg-muted p-2 rounded">
                      {record.selectedText}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Feedback:
                    </p>
                    <p className="text-xs text-foreground bg-muted p-2 rounded max-h-32 overflow-y-auto">
                      {record.feedback}
                    </p>
                  </div>
                  <button
                    onClick={() => onDelete(record.id)}
                    className="w-full mt-2 flex items-center justify-center gap-2 px-2 py-1 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
