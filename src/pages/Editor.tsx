import { useState } from "react";
import { Check, Plus, TrendingUp } from "lucide-react";

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

  const currentChapter = chapters.find((ch) => ch.id === currentChapterId)!;

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <header className="h-16 min-h-[64px] bg-background border-b flex items-center justify-between px-4">
        <div className="flex items-center gap-3">
          <span className="text-primary font-bold text-xl">ICHEN</span>
          <div className="w-px h-6 bg-border" />
          <span className="text-foreground text-sm">My First Novel</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="px-4 py-2 text-sm border border-border rounded-md text-foreground hover:bg-muted transition-colors">
            Export
          </button>
          <button className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity">
            Save
          </button>
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
                className={
                  isActive
                    ? "p-3 rounded-lg mb-2 border-2 bg-chapter-active border-chapter-active-border cursor-pointer transition-all duration-200"
                    : "p-3 rounded-lg mb-2 border border-chapter-inactive bg-chapter-inactive cursor-pointer hover:border-chapter-hover transition-all duration-200"
                }
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground">{chapter.title}</p>
                  {chapter.isComplete && (
                    <Check className="h-4 w-4 text-green-600 shrink-0" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
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
        <main className="flex-1 bg-background overflow-y-auto">
          <div className="max-w-3xl mx-auto px-12 py-8 prose prose-lg">
            <h1 className="text-3xl font-bold mb-6 text-foreground">{currentChapter.title}</h1>
            <p className="italic text-muted-foreground">Start writing your chapter here...</p>
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
              {currentChapter.wordCount.toLocaleString()} words today
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Editor;
