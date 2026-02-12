import { useState, useRef, useEffect } from "react";
import { Check, FileText, Plus, X, Settings, PanelLeftClose, PanelLeftOpen, PanelRightClose, PanelRightOpen } from "lucide-react";
import LexicalEditor from "../components/LexicalEditor";
import KeyboardShortcuts from "../components/KeyboardShortcuts";
import AiFeedbackPanel from "../components/AiFeedbackPanel";
import SettingsModal from "../components/SettingsModal";
import RecentFeedback, { FeedbackRecord } from "../components/RecentFeedback";
import EmotionHeatmap from "../components/EmotionHeatmap";
import WhatIfBranching from "../components/WhatIfBranching";
import GhostReader from "../components/GhostReader";
import StoryBible from "../components/StoryBible";

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  content: string;
  isComplete: boolean;
}

const initialChapters: Chapter[] = [
  { id: "ch-1", title: "Chapter 1", wordCount: 0, content: "", isComplete: false },
];

const Editor = () => {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [currentChapterId, setCurrentChapterId] = useState("ch-1");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"coach" | "heatmap" | "ghost" | "branch" | "bible">("coach");
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Settings and API Key state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>(() => {
    return localStorage.getItem("ichen_gemini_key") || "";
  });

  // AI Usage tracking
  const [totalAiRequests, setTotalAiRequests] = useState<number>(() => {
    const stored = localStorage.getItem("ichen_ai_usage");
    if (stored) {
      const data = JSON.parse(stored);
      // Reset if date is different
      if (data.date !== new Date().toDateString()) {
        return 0;
      }
      return data.count || 0;
    }
    return 0;
  });

  // Feedback history
  const [feedbackHistory, setFeedbackHistory] = useState<FeedbackRecord[]>(() => {
    const stored = localStorage.getItem("ichen_feedback_history");
    return stored ? JSON.parse(stored) : [];
  });

  const currentChapter = chapters.find((ch) => ch.id === currentChapterId);

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("ichen_gemini_key", key);
    setSettingsOpen(false);
  };

  const incrementAiUsage = () => {
    const newCount = totalAiRequests + 1;
    setTotalAiRequests(newCount);
    localStorage.setItem(
      "ichen_ai_usage",
      JSON.stringify({
        count: newCount,
        date: new Date().toDateString(),
      })
    );
  };

  const addFeedbackToHistory = (
    persona: string,
    selectedTextStr: string,
    feedback: string
  ) => {
    const newRecord: FeedbackRecord = {
      id: Date.now().toString(),
      persona,
      timestamp: Date.now(),
      selectedText: selectedTextStr,
      feedback,
    };

    const updated = [newRecord, ...feedbackHistory].slice(0, 5);
    setFeedbackHistory(updated);
    localStorage.setItem("ichen_feedback_history", JSON.stringify(updated));
  };

  const deleteFeedbackRecord = (id: string) => {
    const updated = feedbackHistory.filter((r) => r.id !== id);
    setFeedbackHistory(updated);
    localStorage.setItem("ichen_feedback_history", JSON.stringify(updated));
  };

  const clearFeedbackHistory = () => {
    setFeedbackHistory([]);
    localStorage.removeItem("ichen_feedback_history");
  };

  const formatTime = (date: Date): string => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  const handleEditorChange = (content: string) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === currentChapterId ? { ...ch, content } : ch
      )
    );

    // Clear existing timeout
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    // Set new timeout for debounced save
    autoSaveTimeoutRef.current = setTimeout(() => {
      console.log("Auto-saving...");
      setLastSaved(new Date());
    }, 2000);
  };

  useEffect(() => {
    // Cleanup timeout on unmount
    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleSelectionChange = () => {
      const selection = window.getSelection();
      if (selection) {
        const text = selection.toString().trim();
        if (text.length > 10) {
          setSelectedText(text);
        } else {
          setSelectedText("");
        }
      }
    };

    const handleClickOrType = () => {
      // Clear selection when user clicks elsewhere or starts typing
      const selection = window.getSelection();
      if (!selection || selection.toString().length === 0) {
        setSelectedText("");
      }
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    document.addEventListener("click", handleClickOrType);
    document.addEventListener("keydown", handleClickOrType);

    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      document.removeEventListener("click", handleClickOrType);
      document.removeEventListener("keydown", handleClickOrType);
    };
  }, []);

  const handleDeleteChapter = (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    if (chapters.length <= 1) {
      alert("You must have at least one chapter");
      return;
    }
    const updated = chapters.filter((ch) => ch.id !== chapterId);
    setChapters(updated);
    if (currentChapterId === chapterId) {
      setCurrentChapterId(updated[0].id);
    }
  };

  const handleWordCountChange = (wordCount: number) => {
    setChapters((prev) =>
      prev.map((ch) =>
        ch.id === currentChapterId ? { ...ch, wordCount } : ch
      )
    );
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* API Key Missing Banner */}
      {!apiKey && (
        <div
          onClick={() => setSettingsOpen(true)}
          className="bg-amber-50 border-b border-amber-200 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between cursor-pointer hover:bg-amber-100 transition-colors"
        >
          <p className="text-xs sm:text-sm text-amber-900 truncate mr-2">
            Add your Gemini API key to enable AI features
          </p>
          <button className="text-xs sm:text-sm font-medium text-amber-700 hover:text-amber-900 whitespace-nowrap shrink-0">
            Configure →
          </button>
        </div>
      )}

      {/* Header */}
      <header className="h-12 sm:h-16 min-h-[48px] sm:min-h-[64px] bg-background border-b flex items-center justify-between px-2 sm:px-4 shrink-0">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted shrink-0"
            title={leftSidebarOpen ? "Hide chapters" : "Show chapters"}
          >
            {leftSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <img src="/logo.png" alt="Novel Craft Studio" className="h-8 sm:h-10 w-auto shrink-0" />
          <div className="w-px h-5 sm:h-6 bg-border hidden sm:block" />
          <span className="text-foreground text-sm truncate hidden sm:inline">My First Novel</span>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          {lastSaved && (
            <span className="text-[10px] sm:text-xs text-muted-foreground hidden md:inline">
              Saved {formatTime(lastSaved)}
            </span>
          )}
          <button className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted" onClick={() => setSettingsOpen(true)} title="Settings">
            <Settings size={16} />
          </button>
          <button className="hidden sm:inline-flex px-3 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-muted transition-colors">
            Export
          </button>
          <button className="px-3 py-1.5 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
            Save
          </button>
          <button
            onClick={() => setRightSidebarOpen(!rightSidebarOpen)}
            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
            title={rightSidebarOpen ? "Hide AI panel" : "Show AI panel"}
          >
            {rightSidebarOpen ? <PanelRightClose size={18} /> : <PanelRightOpen size={18} />}
          </button>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Left Sidebar Overlay on mobile */}
        {leftSidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setLeftSidebarOpen(false)} />
        )}

        {/* Left Sidebar */}
        <aside className={`bg-sidebar border-r overflow-y-auto transition-all duration-300 shrink-0 z-30 ${
          leftSidebarOpen
            ? "w-[250px] min-w-[250px] p-4 fixed md:relative top-0 bottom-0 left-0 md:inset-auto md:top-auto md:bottom-auto md:left-auto"
            : "w-0 min-w-0 p-0 overflow-hidden border-r-0"
        }`}>
          <h2 className="font-semibold text-lg text-sidebar-foreground mb-4">Chapters</h2>

          {chapters.map((chapter) => {
            const isActive = chapter.id === currentChapterId;
            return (
              <div
                key={chapter.id}
                onClick={() => setCurrentChapterId(chapter.id)}
                className={`group p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "border-2 bg-chapter-active border-chapter-active-border"
                    : "border border-chapter-inactive bg-chapter-inactive hover:border-chapter-hover"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    <p className="text-sm font-medium text-foreground truncate">{chapter.title}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {chapter.isComplete && (
                      <Check className="h-4 w-4 text-green-600" />
                    )}
                    <button
                      onClick={(e) => handleDeleteChapter(e, chapter.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
                    >
                      <X className="h-3.5 w-3.5 text-muted-foreground hover:text-destructive" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-6">
                  {chapter.wordCount.toLocaleString()} words
                </p>
              </div>
            );
          })}

          {/* Add Chapter Button */}
          <button
            onClick={() => {
              const newChapter: Chapter = {
                id: "ch-" + Date.now(),
                title: "Chapter " + (chapters.length + 1),
                wordCount: 0,
                content: "",
                isComplete: false,
              };
              setChapters((prev) => [...prev, newChapter]);
              setCurrentChapterId(newChapter.id);
            }}
            className="w-full p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground transition-all duration-200 cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Add Chapter
          </button>

          {/* Living Codex Section */}
          <div className="border-t border-border mt-6 pt-4">
            <h3 className="font-semibold text-sm text-sidebar-foreground mb-3">Living Codex</h3>
            <div className="space-y-2">
              <button className="w-full flex items-center gap-2 p-2 rounded text-sm text-foreground bg-background hover:bg-muted transition-colors cursor-pointer text-left">
                <span>👤</span>
                <span>Characters (0)</span>
              </button>
              <button className="w-full flex items-center gap-2 p-2 rounded text-sm text-foreground bg-background hover:bg-muted transition-colors cursor-pointer text-left">
                <span>📍</span>
                <span>Locations (0)</span>
              </button>
            </div>
          </div>
        </aside>

        {/* Center Editor */}
        <main className="flex-1 bg-muted/30 overflow-hidden flex flex-col">
          {currentChapter ? (
            <>
              {/* Chapter header - outside the canvas */}
              <div className="px-6 py-3 border-b border-border bg-muted/50">
                <h1 className="text-base font-semibold text-foreground">{currentChapter.title}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {currentChapter.wordCount.toLocaleString()} words • {currentChapter.isComplete ? "Complete" : "Draft"}
                </p>
              </div>

              {/* Editor canvas - Word-like blank page */}
              <div className="flex-1 overflow-y-auto flex justify-center py-4 sm:py-8 px-2 sm:px-0">
                <div className="w-full max-w-[800px]">
                  <LexicalEditor
                    initialContent={currentChapter.content}
                    onChange={handleEditorChange}
                    onWordCountChange={handleWordCountChange}
                    placeholder="Start writing..."
                  />
                </div>
              </div>
            </>
          ) : (
              <p className="text-muted-foreground p-6">Select a chapter to start writing</p>
            )}
        </main>

        {/* Right Sidebar Overlay on mobile */}
        {rightSidebarOpen && (
          <div className="fixed inset-0 bg-black/30 z-20 md:hidden" onClick={() => setRightSidebarOpen(false)} />
        )}

        {/* Right Sidebar */}
        <aside className={`bg-muted border-l overflow-hidden transition-all duration-300 flex flex-col shrink-0 z-30 ${
          rightSidebarOpen
            ? "w-[300px] sm:w-[320px] min-w-[300px] sm:min-w-[320px] xl:w-[380px] xl:min-w-[380px] 2xl:w-[420px] 2xl:min-w-[420px] fixed md:relative top-0 bottom-0 right-0 md:inset-auto md:top-auto md:bottom-auto md:right-auto"
            : "w-0 min-w-0 overflow-hidden border-l-0"
        }`}>
          {/* Tab Bar */}
          <div className="flex border-b border-border bg-background shrink-0 overflow-x-auto">
            {[
              { id: "coach" as const, label: "✨", title: "Coach" },
              { id: "heatmap" as const, label: "🎨", title: "Heatmap" },
              { id: "ghost" as const, label: "👁️", title: "Ghost" },
              { id: "branch" as const, label: "🔀", title: "Branch" },
              { id: "bible" as const, label: "📖", title: "Bible" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setRightTab(tab.id)}
                className={`flex-1 px-2 py-2.5 text-[10px] font-medium transition-colors ${
                  rightTab === tab.id
                    ? "text-primary border-b-2 border-primary bg-muted/50"
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title={tab.title}
              >
                <span className="text-sm block">{tab.label}</span>
                <span className="block mt-0.5">{tab.title}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div key={rightTab} className="flex-1 overflow-y-auto p-4 animate-fade-in">
            {rightTab === "coach" && (
              <>
                <h2 className="font-semibold text-foreground mb-4">✨ Craft Coach</h2>

                {/* Stats Card */}
                <div className="bg-background border border-border rounded-lg p-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Words Selected</span>
                      <span className="text-sm font-semibold text-foreground">
                        {selectedText.split(/\s+/).filter(Boolean).length}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Chapter Words</span>
                      <span className="text-sm font-semibold text-foreground">
                        {currentChapter?.wordCount.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">AI Analyses</span>
                      <span className={`text-sm font-semibold ${
                        totalAiRequests >= 10 ? "text-destructive" : "text-foreground"
                      }`}>
                        {totalAiRequests}/10
                      </span>
                    </div>
                    {totalAiRequests >= 10 && (
                      <p className="text-xs text-destructive mt-2">
                        Daily limit reached. Upgrade for more analyses.
                      </p>
                    )}
                    {totalAiRequests >= 8 && totalAiRequests < 10 && (
                      <p className="text-xs text-amber-600 mt-2">
                        {10 - totalAiRequests} analyses remaining today
                      </p>
                    )}
                  </div>
                </div>

                {/* AI Feedback Panel */}
                <div className="mb-4">
                  <AiFeedbackPanel
                    selectedText={selectedText}
                    apiKey={apiKey}
                    totalAiRequests={totalAiRequests}
                    aiRequestLimit={10}
                    onApplySuggestion={(text) => {
                      console.log("Applying suggestion:", text);
                    }}
                    onDismiss={() => {
                      setSelectedText("");
                    }}
                    onAnalyze={(persona, feedback) => {
                      if (totalAiRequests < 10) {
                        incrementAiUsage();
                        addFeedbackToHistory(persona, selectedText, feedback);
                      }
                    }}
                  />
                </div>

                {/* Recent Feedback Section */}
                <div className="border-t border-border pt-4">
                  <RecentFeedback
                    history={feedbackHistory}
                    onDelete={deleteFeedbackRecord}
                    onClearAll={clearFeedbackHistory}
                  />
                </div>
              </>
            )}

            {rightTab === "heatmap" && (
              <EmotionHeatmap
                chapterContent={currentChapter?.content || ""}
                apiKey={apiKey}
                onAnalyze={incrementAiUsage}
              />
            )}

            {rightTab === "ghost" && (
              <GhostReader
                chapterContent={currentChapter?.content || ""}
                apiKey={apiKey}
                onAnalyze={incrementAiUsage}
              />
            )}

            {rightTab === "branch" && (
              <WhatIfBranching
                selectedText={selectedText}
                apiKey={apiKey}
                onApply={(text) => {
                  console.log("Apply branch:", text);
                }}
                onAnalyze={incrementAiUsage}
              />
            )}

            {rightTab === "bible" && (
              <StoryBible
                chapterContent={currentChapter?.content || ""}
                apiKey={apiKey}
                onAnalyze={incrementAiUsage}
              />
            )}
          </div>
        </aside>
      </div>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        onSave={handleSaveApiKey}
        initialApiKey={apiKey}
      />
    </div>
  );
};

export default Editor;
