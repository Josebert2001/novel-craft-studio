import { useState, useRef, useEffect, useCallback } from "react";
import { Send, Loader2, Bot, Trash2, Download } from "lucide-react";
import { runAgentLoop, type ToolExecution } from "@/lib/agentLoop";
import AgentSettingsDialog, { useAgentSettings } from "@/components/AgentSettings";

interface Message {
  id: string;
  role: "user" | "agent";
  content: string;
  toolsUsed?: string[];
  timestamp: number;
}

interface WritingAgentProps {
  chapterContent: string;
  chapterId?: string;
  chapterTitle?: string;
  selectedText?: string;
}

const STORAGE_PREFIX = "ichen_agent_conversation_";
const MAX_MESSAGES = 20;
const STALE_DAYS = 7;

const loadMessages = (chapterId: string): Message[] => {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}${chapterId}`);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (m: unknown): m is Message =>
        typeof m === "object" && m !== null && "id" in m && "role" in m && "content" in m && "timestamp" in m
    );
  } catch {
    return [];
  }
};

const saveMessages = (chapterId: string, messages: Message[]) => {
  try {
    localStorage.setItem(`${STORAGE_PREFIX}${chapterId}`, JSON.stringify(messages.slice(-MAX_MESSAGES)));
  } catch (err) {
    console.error("Failed to save agent conversation:", err);
  }
};

const isConversationStale = (messages: Message[]): boolean => {
  if (messages.length === 0) return false;
  const last = messages[messages.length - 1];
  const daysSince = (Date.now() - last.timestamp) / (1000 * 60 * 60 * 24);
  return daysSince > STALE_DAYS;
};

export default function WritingAgent({ chapterContent, chapterId, chapterTitle, selectedText }: WritingAgentProps) {
  const { settings, updateSettings } = useAgentSettings();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTools, setActiveTools] = useState<ToolExecution[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [showStalePrompt, setShowStalePrompt] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const storageKey = chapterId || "default";

  // Load conversation on mount / chapter change
  useEffect(() => {
    const loaded = loadMessages(storageKey);
    if (loaded.length > 0 && isConversationStale(loaded)) {
      setMessages(loaded);
      setShowStalePrompt(true);
    } else {
      setMessages(loaded);
    }
  }, [storageKey]);

  // Persist on change
  const persistMessages = useCallback(
    (msgs: Message[]) => {
      saveMessages(storageKey, msgs);
    },
    [storageKey]
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, activeTools]);

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text,
      timestamp: Date.now(),
    };

    const updated = [...messages, userMessage];
    setMessages(updated);
    persistMessages(updated);
    setInput("");
    setIsLoading(true);
    setActiveTools([]);

    try {
      const history = messages.map((m) => ({
        role: m.role === "user" ? "user" as const : "assistant" as const,
        content: m.content,
      }));
      const result = await runAgentLoop(
        text,
        chapterContent,
        history,
        (tool) => {
          setActiveTools((prev) => {
            const existing = prev.find((t) => t.toolName === tool.toolName);
            if (existing) {
              return prev.map((t) => (t.toolName === tool.toolName ? tool : t));
            }
            return [...prev, tool];
          });
        }
      );

      const agentMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: result.response || result.error || "I couldn't generate a response.",
        toolsUsed: result.toolsUsed,
        timestamp: Date.now(),
      };

      setMessages((prev) => {
        const next = [...prev, agentMessage];
        persistMessages(next);
        return next;
      });
    } catch (error) {
      console.error("Agent error:", error);
      const errMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "agent",
        content: "Sorry, I encountered an error while analyzing your chapter.",
        timestamp: Date.now(),
      };
      setMessages((prev) => {
        const next = [...prev, errMsg];
        persistMessages(next);
        return next;
      });
    } finally {
      setIsLoading(false);
      setActiveTools([]);
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem(`${STORAGE_PREFIX}${storageKey}`);
    setShowClearConfirm(false);
  };

  const handleExport = () => {
    const title = chapterTitle || "Untitled Chapter";
    const date = new Date().toLocaleDateString();
    let text = `ICHEN Manuscript - Agent Conversation\nChapter: ${title}\nDate: ${date}\n\n---\n\n`;

    for (const msg of messages) {
      if (msg.role === "user") {
        text += `User: ${msg.content}\n\n`;
      } else {
        text += `Agent: ${msg.content}\n`;
        if (msg.toolsUsed && msg.toolsUsed.length > 0) {
          text += `Tools used: ${msg.toolsUsed.join(", ")}\n`;
        }
        text += "\n";
      }
      text += "---\n\n";
    }

    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `agent-conversation-${title.replace(/\s+/g, "-").toLowerCase()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleResumeStale = (resume: boolean) => {
    if (!resume) {
      handleClear();
    }
    setShowStalePrompt(false);
  };

  const quickActions = selectedText
    ? [
        { label: "Rewrite this", prompt: `Rewrite this passage in different ways: "${selectedText.slice(0, 300)}"` },
        { label: "What's wrong?", prompt: `What's wrong with this passage and how do I fix it: "${selectedText.slice(0, 300)}"` },
        { label: "Make stronger", prompt: `How can I make this more impactful: "${selectedText.slice(0, 300)}"` },
      ]
    : [
        { label: "Analyze chapter", prompt: "Analyze my chapter for plot, emotion, and pacing" },
        { label: "Check consistency", prompt: "Check this chapter for any plot holes or inconsistencies" },
        { label: "Improve prose", prompt: "Help me improve the prose quality of this chapter" },
      ];

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-background border border-border rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-muted/30">
        <div className="flex items-center gap-2">
          <Bot className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold text-foreground">Writing Agent</span>
        </div>
        <div className="flex items-center gap-0.5">
          {messages.length > 0 && (
            <>
              <button
                onClick={handleExport}
                className="p-1 text-muted-foreground hover:text-foreground rounded transition-colors"
                title="Export conversation"
              >
                <Download className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => setShowClearConfirm(true)}
                className="p-1 text-muted-foreground hover:text-destructive rounded transition-colors"
                title="Clear conversation"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </>
          )}
          <AgentSettingsDialog settings={settings} onSave={updateSettings} />
        </div>
      </div>

      {/* Clear confirmation */}
      {showClearConfirm && (
        <div className="px-3 py-2.5 bg-destructive/5 border-b border-destructive/20 animate-fade-in">
          <p className="text-xs text-foreground mb-2">Clear this conversation? This can't be undone.</p>
          <div className="flex gap-2">
            <button
              onClick={handleClear}
              className="px-2.5 py-1 text-xs font-medium bg-destructive text-destructive-foreground rounded hover:opacity-90 transition-opacity"
            >
              Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-2.5 py-1 text-xs font-medium border border-border rounded hover:bg-muted transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Stale conversation prompt */}
      {showStalePrompt && (
        <div className="px-3 py-2.5 bg-muted/50 border-b border-border animate-fade-in">
          <p className="text-xs text-foreground mb-2">This conversation is over 7 days old. Resume or start fresh?</p>
          <div className="flex gap-2">
            <button
              onClick={() => handleResumeStale(true)}
              className="px-2.5 py-1 text-xs font-medium bg-primary text-primary-foreground rounded hover:opacity-90 transition-opacity"
            >
              Resume
            </button>
            <button
              onClick={() => handleResumeStale(false)}
              className="px-2.5 py-1 text-xs font-medium border border-border rounded hover:bg-muted transition-colors"
            >
              Start Fresh
            </button>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-8">
            <Bot className="h-8 w-8 text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              Ask me anything about your chapter.
            </p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              I'll use multiple tools to give you strategic feedback.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} animate-fade-in`}
          >
            <div
              className={`max-w-[85%] rounded-lg px-3 py-2 ${
                msg.role === "user"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-foreground"
              }`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              {msg.toolsUsed && msg.toolsUsed.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2 pt-1.5 border-t border-border/30">
                  {msg.toolsUsed.map((tool) => (
                    <span
                      key={tool}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-background/50 text-muted-foreground"
                    >
                      {tool.replace(/_/g, " ")}
                    </span>
                  ))}
                </div>
              )}
              <p className="text-[10px] mt-1 opacity-50">{formatTime(msg.timestamp)}</p>
            </div>
          </div>
        ))}

        {/* Active tools indicator */}
        {isLoading && activeTools.length > 0 && (
          <div className="flex justify-start animate-fade-in">
            <div className="max-w-[85%] rounded-lg px-3 py-2 bg-muted text-foreground">
              <div className="space-y-1">
                {activeTools.map((tool) => (
                  <div key={tool.toolName} className="flex items-center gap-2 text-xs">
                    {tool.status === "running" && (
                      <Loader2 className="h-3 w-3 animate-spin text-primary" />
                    )}
                    {tool.status === "complete" && (
                      <span className="text-primary text-xs">✓</span>
                    )}
                    {tool.status === "error" && (
                      <span className="text-destructive text-xs">✗</span>
                    )}
                    <span className="text-muted-foreground">
                      {tool.status === "running" && "Running "}
                      {tool.toolName.replace(/_/g, " ")}
                      {tool.status === "complete" && " complete"}
                      {tool.status === "error" && " failed"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Typing indicator */}
        {isLoading && activeTools.length === 0 && (
          <div className="flex justify-start animate-fade-in">
            <div className="rounded-lg px-3 py-2 bg-muted">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground/50 animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Quick actions */}
      <div className="px-3 py-1.5 border-t border-border">
        <div className="flex flex-wrap gap-1.5">
          {quickActions.map((action) => (
            <button
              key={action.label}
              onClick={() => handleSend(action.prompt)}
              disabled={isLoading}
              className="text-xs px-2.5 py-1 rounded-full bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground transition-colors disabled:opacity-50"
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>

      {/* Input */}
      <div className="px-3 py-2 border-t border-border">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Ask me about your chapter..."
            disabled={isLoading}
            className="flex-1 px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !input.trim()}
            className="px-3 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
