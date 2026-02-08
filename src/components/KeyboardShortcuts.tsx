import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function KeyboardShortcuts() {
  const [isExpanded, setIsExpanded] = useState(false);

  const shortcuts = [
    { label: "Bold", keys: "Ctrl/Cmd + B" },
    { label: "Italic", keys: "Ctrl/Cmd + I" },
    { label: "Underline", keys: "Ctrl/Cmd + U" },
    { label: "Heading 2", keys: "## + Space" },
    { label: "Heading 3", keys: "### + Space" },
    { label: "Bullet List", keys: "- + Space" },
    { label: "Numbered List", keys: "1. + Space" },
  ];

  return (
    <div className="bg-background border border-border rounded-lg p-3 mt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between mb-0 hover:bg-muted/50 p-2 rounded transition-colors"
      >
        <span className="text-sm font-medium text-foreground">⌨️ Shortcuts</span>
        <ChevronDown
          size={16}
          className={`text-muted-foreground transition-transform duration-200 ${
            isExpanded ? "rotate-180" : ""
          }`}
        />
      </button>

      {isExpanded && (
        <div className="space-y-2 mt-3 pt-3 border-t border-border">
          {shortcuts.map((shortcut) => (
            <div key={shortcut.label} className="flex justify-between items-start">
              <span className="text-xs font-medium text-foreground">
                {shortcut.label}
              </span>
              <span className="text-xs text-muted-foreground text-right">
                {shortcut.keys}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
