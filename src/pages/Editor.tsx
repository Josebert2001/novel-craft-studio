import { useState, useRef, useEffect } from "react";
import { Check, FileText, Plus, TrendingUp, X } from "lucide-react";
import LexicalEditor from "../components/LexicalEditor";
import KeyboardShortcuts from "../components/KeyboardShortcuts";

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  content: string;
  isComplete: boolean;
}

const initialChapters: Chapter[] = [
  { id: "ch-1", title: "Chapter 1: The Beginning", wordCount: 1247, content: "", isComplete: false },
  { id: "ch-2", title: "Chapter 2: The Journey", wordCount: 543, content: "", isComplete: false },
  { id: "ch-3", title: "Chapter 3", wordCount: 0, content: "", isComplete: false },
];

const Editor = () => {
  const [chapters, setChapters] = useState<Chapter[]>(initialChapters);
  const [currentChapterId, setCurrentChapterId] = useState("ch-1");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const currentChapter = chapters.find((ch) => ch.id === currentChapterId);

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
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 min-h-[64px] bg-background border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold text-xl">ICHEN</span>
          <div className="w-px h-6 bg-border" />
          <span className="text-foreground text-sm">My First Novel</span>
        </div>
        <div className="flex items-center gap-4">
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Saved at {formatTime(lastSaved)}
            </span>
          )}
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 text-sm border border-border rounded-md text-foreground hover:bg-muted transition-colors">
              Export
            </button>
            <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
              Save
            </button>
          </div>
        </div>
      </header>

      {/* 3-Column Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <aside className="w-[250px] min-w-[250px] bg-sidebar border-r p-4 overflow-y-auto">
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
        <main className="flex-1 bg-background overflow-hidden flex flex-col">
          <div className="max-w-3xl mx-auto w-full px-12 py-8 flex flex-col flex-1">
            {currentChapter ? (
              <>
                <h1 className="text-3xl font-bold mb-2 text-foreground">{currentChapter.title}</h1>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mb-6">
                  <span>{currentChapter.wordCount.toLocaleString()} words</span>
                  <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                    currentChapter.isComplete
                      ? "bg-green-100 text-green-700"
                      : "bg-muted text-muted-foreground"
                  }`}>
                    {currentChapter.isComplete ? "Complete" : "Draft"}
                  </span>
                </div>
                <div className="flex-1 overflow-hidden">
                  <LexicalEditor
                    initialContent={currentChapter.content}
                    onChange={handleEditorChange}
                    onWordCountChange={handleWordCountChange}
                    placeholder="Start writing your chapter..."
                  />
                </div>
              </>
            ) : (
              <p className="text-muted-foreground">Select a chapter to start writing</p>
            )}
          </div>
        </main>

        {/* Right Sidebar */}
        <aside className="w-[300px] min-w-[300px] bg-muted border-l p-4 overflow-y-auto">
          <h2 className="font-semibold text-foreground mb-4">✨ Craft Coach</h2>

          {/* AI Suggestions Card */}
          <div className="bg-background border border-border rounded-lg p-4">
            <p className="text-sm text-muted-foreground">Select text to get AI suggestions</p>
          </div>

          {/* Progress Card */}
          <div className="bg-background border border-border rounded-lg p-4 mt-4">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-foreground" />
              <p className="text-sm font-medium text-foreground">Progress</p>
            </div>
            <p className="text-xs text-muted-foreground">
              {currentChapter ? `${currentChapter.wordCount.toLocaleString()} words today` : "0 words today"}
            </p>
          </div>

          {/* Keyboard Shortcuts */}
          <KeyboardShortcuts />
        </aside>
      </div>
    </div>
  );
};

export default Editor;
