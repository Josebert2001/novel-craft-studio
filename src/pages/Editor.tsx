import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Check, FileText, Plus, X, PanelLeftClose, PanelLeftOpen,
  PanelRightClose, PanelRightOpen, Pencil, LogOut, Cloud, CloudOff,
  Loader2, GripVertical, Maximize2, Minimize2, WifiOff, Sun, Moon,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import LexicalEditor from "../components/LexicalEditor";
import AiFeedbackPanel from "../components/AiFeedbackPanel";
import RecentFeedback, { FeedbackRecord } from "../components/RecentFeedback";
import EmotionHeatmap from "../components/EmotionHeatmap";
import WhatIfBranching from "../components/WhatIfBranching";
import GhostReader from "../components/GhostReader";
import StoryBible from "../components/StoryBible";
import { WelcomeModal } from "../components/WelcomeModal";
import FloatingAiToolbar from "../components/FloatingAiToolbar";
import KeyboardShortcuts from "../components/KeyboardShortcuts";

interface Chapter {
  id: string;
  title: string;
  wordCount: number;
  content: string;
  isComplete: boolean;
}

type SyncStatus = "synced" | "syncing" | "local-only" | "loading";

const Editor = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth", { replace: true });
  };

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapterId, setCurrentChapterId] = useState<string>("");
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [selectedText, setSelectedText] = useState<string>("");
  const [selectionPosition, setSelectionPosition] = useState<{ x: number; y: number } | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [rightTab, setRightTab] = useState<"coach" | "heatmap" | "ghost" | "branch" | "bible">("coach");
  const [syncStatus, setSyncStatus] = useState<SyncStatus>("loading");
  const [bookId, setBookId] = useState<string | null>(null);
  const [focusMode, setFocusMode] = useState(false);
  const [darkMode, setDarkMode] = useState(() => {
    const stored = localStorage.getItem("ichen_dark_mode");
    return stored === "true";
  });
  const [showFocusHint, setShowFocusHint] = useState(false);
  const autoSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(true);
  const selectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const focusHintTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Editable book title
  const [bookTitle, setBookTitle] = useState<string>("My First Novel");
  const [editingTitle, setEditingTitle] = useState(false);
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Chapter loading state
  const [chapterLoading, setChapterLoading] = useState<"adding" | "deleting" | null>(null);

  // Chapter title editing
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editingChapterTitle, setEditingChapterTitle] = useState("");
  const chapterTitleInputRef = useRef<HTMLInputElement>(null);

  // Drag-and-drop
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // Welcome modal
  const [showWelcome, setShowWelcome] = useState(false);

  // Online/offline status
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  // Word count animation
  const [wordCountJustChanged, setWordCountJustChanged] = useState(false);
  const wordCountTimerRef = useRef<NodeJS.Timeout | null>(null);

  // AI Usage tracking
  const [totalAiRequests, setTotalAiRequests] = useState<number>(() => {
    const stored = localStorage.getItem("ichen_ai_usage");
    if (stored) {
      const data = JSON.parse(stored);
      if (data.date !== new Date().toDateString()) return 0;
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

  // ─── Keyboard shortcuts (focus mode) ───
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === "f") {
        e.preventDefault();
        setFocusMode((v) => !v);
      }
      if (e.key === "Escape" && focusMode) {
        setFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [focusMode]);

  // Show focus hint briefly when entering focus mode
  useEffect(() => {
    if (focusMode) {
      setShowFocusHint(true);
      focusHintTimerRef.current = setTimeout(() => setShowFocusHint(false), 2500);
    } else {
      setShowFocusHint(false);
    }
    return () => {
      if (focusHintTimerRef.current) clearTimeout(focusHintTimerRef.current);
    };
  }, [focusMode]);

  // Close sidebars when entering focus mode
  useEffect(() => {
    if (focusMode) {
      setLeftSidebarOpen(false);
      setRightSidebarOpen(false);
    }
  }, [focusMode]);

  // ─── Load data from Supabase on mount ───
  useEffect(() => {
    isMountedRef.current = true;
    if (!user) return;

    const loadFromSupabase = async () => {
      setSyncStatus("loading");
      try {
        let { data: books, error: booksErr } = await supabase
          .from("books")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1);

        if (booksErr) throw booksErr;

        let currentBookId: string;
        let isNewUser = false;
        if (books && books.length > 0) {
          currentBookId = books[0].id;
          if (isMountedRef.current) setBookTitle(books[0].title);
        } else {
          isNewUser = true;
          const title = localStorage.getItem("ichen_book_title") || "My First Novel";
          const { data: newBook, error: insertErr } = await supabase
            .from("books")
            .insert({ user_id: user.id, title })
            .select()
            .single();
          if (insertErr || !newBook) throw insertErr || new Error("Failed to create book");
          currentBookId = newBook.id;
          if (isMountedRef.current) setBookTitle(newBook.title);
        }

        if (isMountedRef.current) setBookId(currentBookId);

        const { data: dbChapters, error: chapErr } = await supabase
          .from("chapters")
          .select("*")
          .eq("book_id", currentBookId)
          .eq("user_id", user.id)
          .order("sort_order", { ascending: true });

        if (chapErr) throw chapErr;

        if (dbChapters && dbChapters.length > 0) {
          const mapped: Chapter[] = dbChapters.map((ch) => ({
            id: ch.id,
            title: ch.title,
            wordCount: ch.word_count ?? 0,
            content: ch.content ?? "",
            isComplete: false,
          }));
          if (isMountedRef.current) {
            setChapters(mapped);
            setCurrentChapterId(mapped[0].id);
            setSyncStatus("synced");
          }
        } else {
          isNewUser = true;
          const { data: newChap, error: newChapErr } = await supabase
            .from("chapters")
            .insert({
              book_id: currentBookId,
              user_id: user.id,
              title: "Chapter 1",
              content: "",
              word_count: 0,
              sort_order: 0,
            })
            .select()
            .single();

          if (newChapErr || !newChap) throw newChapErr || new Error("Failed to create chapter");

          const ch: Chapter = {
            id: newChap.id,
            title: newChap.title,
            wordCount: 0,
            content: "",
            isComplete: false,
          };
          if (isMountedRef.current) {
            setChapters([ch]);
            setCurrentChapterId(ch.id);
            setSyncStatus("synced");
          }
        }

        if (isNewUser && !localStorage.getItem("ichen_welcome_dismissed") && isMountedRef.current) {
          setShowWelcome(true);
        }
      } catch (err) {
        console.error("Failed to load from Supabase:", err);
        if (isMountedRef.current) {
          setSyncStatus("local-only");
          const fallbackTitle = localStorage.getItem("ichen_book_title") || "My First Novel";
          setBookTitle(fallbackTitle);
          setChapters([{ id: "ch-1", title: "Chapter 1", wordCount: 0, content: "", isComplete: false }]);
          setCurrentChapterId("ch-1");
        }
      }
    };

    loadFromSupabase();
    return () => { isMountedRef.current = false; };
  }, [user]);

  // ─── Supabase save function ───
  const saveToSupabase = useCallback(
    async (chapterId: string, content: string, wordCount: number) => {
      if (!user) return;
      setSyncStatus("syncing");
      try {
        const { error } = await supabase
          .from("chapters")
          .update({ content, word_count: wordCount, updated_at: new Date().toISOString() })
          .eq("id", chapterId)
          .eq("user_id", user.id);
        if (error) throw error;
        if (isMountedRef.current) {
          setSyncStatus("synced");
          setLastSaved(new Date());
        }
      } catch (err) {
        console.error("Supabase save failed:", err);
        if (isMountedRef.current) setSyncStatus("local-only");
      }
    },
    [user]
  );

  // ─── Ctrl+S save shortcut ───
  useEffect(() => {
    const handleSaveShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        const ch = chapters.find((c) => c.id === currentChapterId);
        if (ch) saveToSupabase(ch.id, ch.content, ch.wordCount);
      }
    };
    window.addEventListener("keydown", handleSaveShortcut);
    return () => window.removeEventListener("keydown", handleSaveShortcut);
  }, [chapters, currentChapterId, saveToSupabase]);

  // ─── Dark mode effect ───
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
    localStorage.setItem("ichen_dark_mode", String(darkMode));
  }, [darkMode]);

  const currentWordCountRef = useRef<number>(0);
  const pendingContentRef = useRef<{ chapterId: string; content: string } | null>(null);

  // ─── Editor change handler ───
  const handleEditorChange = useCallback((content: string) => {
    const chapterId = currentChapterId;

    setChapters((prev) => prev.map((ch) => (ch.id === chapterId ? { ...ch, content } : ch)));

    localStorage.setItem(`chapter_${chapterId}`, content);
    pendingContentRef.current = { chapterId, content };

    if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current);
    autoSaveTimeoutRef.current = setTimeout(() => {
      if (pendingContentRef.current) {
        const { chapterId: id, content: c } = pendingContentRef.current;
        saveToSupabase(id, c, currentWordCountRef.current);
      }
    }, 2000);
  }, [currentChapterId, saveToSupabase]);

  useEffect(() => {
    return () => { if (autoSaveTimeoutRef.current) clearTimeout(autoSaveTimeoutRef.current); };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      if (currentChapter) {
        localStorage.setItem(`chapter_${currentChapter.id}`, currentChapter.content);
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [currentChapter]);

  // ─── Selection tracking with position for floating toolbar ───
  useEffect(() => {
    const handleSelectionChange = () => {
      if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
      selectionTimeoutRef.current = setTimeout(() => {
        // Don't show toolbar when editing book title or chapter titles
        if (editingTitle || editingChapterId) {
          setSelectedText("");
          setSelectionPosition(null);
          return;
        }

        const selection = window.getSelection();
        // Also check if the selection is inside an input or textarea (title fields)
        const anchorNode = selection?.anchorNode;
        const parentElement = anchorNode instanceof Element ? anchorNode : anchorNode?.parentElement;
        if (parentElement?.closest('input, textarea')) {
          setSelectedText("");
          setSelectionPosition(null);
          return;
        }

        if (selection && selection.toString().trim().length > 10) {
          const text = selection.toString().trim();
          setSelectedText(text);
          const range = selection.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          setSelectionPosition({
            x: rect.left + rect.width / 2,
            y: rect.top,
          });
        } else {
          setSelectedText("");
          setSelectionPosition(null);
        }
      }, 300);
    };

    document.addEventListener("selectionchange", handleSelectionChange);
    return () => {
      document.removeEventListener("selectionchange", handleSelectionChange);
      if (selectionTimeoutRef.current) clearTimeout(selectionTimeoutRef.current);
    };
  }, [editingTitle, editingChapterId]);

  // ─── Chapter actions ───
  const handleAddChapter = async () => {
    if (!user || !bookId || chapterLoading) return;
    setChapterLoading("adding");

    const sortOrder = chapters.length;
    const title = `Chapter ${chapters.length + 1}`;

    try {
      const { data: newChap, error } = await supabase
        .from("chapters")
        .insert({ book_id: bookId, user_id: user.id, title, content: "", word_count: 0, sort_order: sortOrder })
        .select()
        .single();

      if (error || !newChap) throw error || new Error("Failed to create chapter");

      const ch: Chapter = { id: newChap.id, title: newChap.title, wordCount: 0, content: "", isComplete: false };
      setChapters((prev) => [...prev, ch]);
      setCurrentChapterId(ch.id);
    } catch (err) {
      console.error("Failed to add chapter:", err);
      toast({ title: "Error", description: "Failed to add chapter.", variant: "destructive" });
    } finally {
      setChapterLoading(null);
    }
  };

  const handleDeleteChapter = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    if (chapters.length <= 1) {
      toast({ title: "Cannot delete", description: "You must have at least one chapter." });
      return;
    }
    if (chapterLoading) return;
    setChapterLoading("deleting");

    const previous = chapters;
    const updated = chapters.filter((ch) => ch.id !== chapterId);
    setChapters(updated);
    if (currentChapterId === chapterId) setCurrentChapterId(updated[0].id);
    localStorage.removeItem(`chapter_${chapterId}`);

    if (user) {
      try {
        const { error } = await supabase.from("chapters").delete().eq("id", chapterId).eq("user_id", user.id);
        if (error) throw error;
      } catch (err) {
        console.error("Failed to delete chapter:", err);
        toast({ title: "Error", description: "Failed to delete chapter. Reverting.", variant: "destructive" });
        setChapters(previous);
      }
    }
    setChapterLoading(null);
  };

  const handleWordCountChange = (wordCount: number) => {
    currentWordCountRef.current = wordCount;
    setChapters((prev) => prev.map((ch) => (ch.id === currentChapterId ? { ...ch, wordCount } : ch)));
    if (wordCountTimerRef.current) clearTimeout(wordCountTimerRef.current);
    setWordCountJustChanged(true);
    wordCountTimerRef.current = setTimeout(() => setWordCountJustChanged(false), 800);
  };

  // ─── Chapter title editing ───
  const startEditingChapterTitle = (e: React.MouseEvent, chapter: Chapter) => {
    e.stopPropagation();
    setEditingChapterId(chapter.id);
    setEditingChapterTitle(chapter.title);
    setTimeout(() => chapterTitleInputRef.current?.focus(), 0);
  };

  const saveChapterTitle = async () => {
    if (!editingChapterId) return;
    const trimmed = editingChapterTitle.trim() || "Untitled";
    setChapters((prev) => prev.map((ch) => (ch.id === editingChapterId ? { ...ch, title: trimmed } : ch)));
    setEditingChapterId(null);
    if (user) {
      try {
        await supabase.from("chapters").update({ title: trimmed }).eq("id", editingChapterId).eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to update chapter title:", err);
      }
    }
  };

  const cancelEditingChapterTitle = () => {
    setEditingChapterId(null);
    setEditingChapterTitle("");
  };

  // ─── Chapter completion toggle ───
  const handleToggleComplete = async (e: React.MouseEvent, chapterId: string) => {
    e.stopPropagation();
    setChapters((prev) => prev.map((ch) => (ch.id === chapterId ? { ...ch, isComplete: !ch.isComplete } : ch)));
    // Note: chapters table doesn't have is_complete column yet, so we persist locally
    // TODO: Add is_complete column to chapters table
  };

  // ─── Drag-and-drop reordering ───
  const handleDragStart = (index: number) => setDragIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = async (targetIndex: number) => {
    if (dragIndex === null || dragIndex === targetIndex) {
      setDragIndex(null);
      setDragOverIndex(null);
      return;
    }
    const reordered = [...chapters];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(targetIndex, 0, moved);
    setChapters(reordered);
    setDragIndex(null);
    setDragOverIndex(null);

    if (user) {
      try {
        await Promise.all(
          reordered.map((ch, i) =>
            supabase.from("chapters").update({ sort_order: i }).eq("id", ch.id).eq("user_id", user.id)
          )
        );
      } catch (err) {
        console.error("Failed to update sort order:", err);
      }
    }
  };

  const handleDragEnd = () => {
    setDragIndex(null);
    setDragOverIndex(null);
  };

  // ─── Book title ───
  const handleTitleSave = async () => {
    const trimmed = bookTitle.trim() || "My First Novel";
    setBookTitle(trimmed);
    localStorage.setItem("ichen_book_title", trimmed);
    setEditingTitle(false);
    if (user && bookId) {
      try {
        await supabase.from("books").update({ title: trimmed }).eq("id", bookId).eq("user_id", user.id);
      } catch (err) {
        console.error("Failed to update book title:", err);
      }
    }
  };

  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  // ─── AI usage helpers ───
  const incrementAiUsage = () => {
    const newCount = totalAiRequests + 1;
    setTotalAiRequests(newCount);
    localStorage.setItem("ichen_ai_usage", JSON.stringify({ count: newCount, date: new Date().toDateString() }));
  };

  const addFeedbackToHistory = (persona: string, selectedTextStr: string, feedbackText: string) => {
    const newRecord: FeedbackRecord = {
      id: Date.now().toString(),
      persona,
      timestamp: Date.now(),
      selectedText: selectedTextStr,
      feedback: feedbackText,
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

  const formatTime = (date: Date): string =>
    date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: true });

  // ─── Sync status indicator ───
  const renderSyncStatus = () => {
    switch (syncStatus) {
      case "syncing":
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-amber-500">
            <Loader2 size={12} className="animate-spin" /> Syncing...
          </span>
        );
      case "synced":
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-green-600">
            <Cloud size={12} /> Synced {lastSaved ? formatTime(lastSaved) : ""}
          </span>
        );
      case "local-only":
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <CloudOff size={12} /> Local only
          </span>
        );
      case "loading":
        return (
          <span className="flex items-center gap-1 text-[10px] sm:text-xs text-muted-foreground">
            <Loader2 size={12} className="animate-spin" /> Loading...
          </span>
        );
      default:
        return null;
    }
  };

  if (syncStatus === "loading" && chapters.length === 0) {
    return (
      <div className="flex items-center justify-center h-screen bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-primary" />
          <p className="text-muted-foreground text-sm">Loading your manuscript...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen overflow-hidden transition-colors duration-300 ${focusMode ? "bg-[hsl(40,30%,97%)]" : ""}`}>
      <WelcomeModal open={showWelcome} onClose={() => setShowWelcome(false)} />

      {/* Floating AI Toolbar on selection */}
      <FloatingAiToolbar
        selectedText={selectedText}
        position={selectionPosition}
        totalAiRequests={totalAiRequests}
        aiRequestLimit={10}
        onDismiss={() => {
          setSelectedText("");
          setSelectionPosition(null);
        }}
        onAnalyze={(persona, feedbackText) => {
          if (totalAiRequests < 10) {
            incrementAiUsage();
            addFeedbackToHistory(persona, selectedText, feedbackText);
          }
        }}
      />

      {/* Focus mode hint */}
      {showFocusHint && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] px-4 py-2 bg-foreground/90 text-background text-xs rounded-full shadow-lg animate-fade-in pointer-events-none">
          Focus Mode — press Esc or Ctrl+Shift+F to exit
        </div>
      )}

      {/* Header — hidden in focus mode */}
      <header
        className={`h-12 sm:h-16 min-h-[48px] sm:min-h-[64px] bg-background border-b flex items-center justify-between px-2 sm:px-4 shrink-0 transition-all duration-300 ${
          focusMode ? "opacity-0 pointer-events-none h-0 min-h-0 border-none overflow-hidden" : ""
        }`}
      >
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={() => setLeftSidebarOpen(!leftSidebarOpen)}
            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted shrink-0"
            title={leftSidebarOpen ? "Hide chapters" : "Show chapters"}
          >
            {leftSidebarOpen ? <PanelLeftClose size={18} /> : <PanelLeftOpen size={18} />}
          </button>
          <img src="/logo.png" alt="ICHEN Manuscript" className="h-8 sm:h-10 w-auto shrink-0" />
          <div className="w-px h-5 sm:h-6 bg-border hidden sm:block" />
          {editingTitle ? (
            <input
              ref={titleInputRef}
              value={bookTitle}
              onChange={(e) => setBookTitle(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleTitleSave();
                if (e.key === "Escape") {
                  setBookTitle(localStorage.getItem("ichen_book_title") || "My First Novel");
                  setEditingTitle(false);
                }
              }}
              className="text-foreground text-sm bg-transparent border-b border-primary outline-none px-1 py-0.5 hidden sm:inline max-w-[200px]"
            />
          ) : (
            <button
              onClick={() => setEditingTitle(true)}
              className="group flex items-center gap-1.5 text-foreground text-sm truncate hidden sm:inline-flex hover:text-primary transition-colors"
              title="Click to edit book title"
            >
              <span className="truncate">{bookTitle}</span>
              <Pencil size={12} className="opacity-0 group-hover:opacity-60 transition-opacity shrink-0" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <span className="hidden md:inline-flex">{renderSyncStatus()}</span>
          {!isOnline && (
            <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-destructive/10 text-destructive border border-destructive/20">
              <WifiOff size={12} />
              Offline
            </span>
          )}
          <button className="hidden sm:inline-flex px-3 py-1.5 text-sm border border-border rounded-md text-foreground hover:bg-muted transition-colors">
            Export
          </button>
          <button
            onClick={() => {
              if (currentChapter) saveToSupabase(currentChapter.id, currentChapter.content, currentChapter.wordCount);
            }}
            className="px-3 py-1.5 text-xs sm:text-sm bg-primary text-primary-foreground rounded-md hover:opacity-90 transition-opacity"
          >
            Save
          </button>
          {user && (
            <div className="hidden sm:flex items-center gap-2 ml-1">
              <span className="text-xs text-muted-foreground truncate max-w-[120px]">{user.email}</span>
              <button
                onClick={handleSignOut}
                className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded hover:bg-destructive/10"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
          )}
          {/* Dark mode toggle */}
          <button
            onClick={() => setDarkMode((v) => !v)}
            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          {/* Focus mode toggle */}
          <button
            onClick={() => setFocusMode((v) => !v)}
            className="p-1.5 sm:p-2 text-muted-foreground hover:text-foreground transition-colors rounded hover:bg-muted"
            title="Focus mode (Ctrl+Shift+F)"
          >
            <Maximize2 size={18} />
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

          {chapters.map((chapter, index) => {
            const isActive = chapter.id === currentChapterId;
            const isEditing = editingChapterId === chapter.id;
            const isDragOver = dragOverIndex === index && dragIndex !== index;
            return (
              <div
                key={chapter.id}
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={() => handleDrop(index)}
                onDragEnd={handleDragEnd}
                onClick={() => setCurrentChapterId(chapter.id)}
                className={`group p-3 rounded-lg mb-2 cursor-pointer transition-all duration-200 ${
                  isActive
                    ? "border-2 bg-chapter-active border-chapter-active-border"
                    : "border border-chapter-inactive bg-chapter-inactive hover:border-chapter-hover"
                } ${isDragOver ? "border-primary border-2 scale-[1.01]" : ""} ${
                  dragIndex === index ? "opacity-50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <GripVertical className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0 cursor-grab opacity-0 group-hover:opacity-100 transition-opacity" />
                    <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                    {isEditing ? (
                      <input
                        ref={chapterTitleInputRef}
                        value={editingChapterTitle}
                        onChange={(e) => setEditingChapterTitle(e.target.value)}
                        onBlur={saveChapterTitle}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveChapterTitle();
                          if (e.key === "Escape") cancelEditingChapterTitle();
                        }}
                        onClick={(e) => e.stopPropagation()}
                        className="text-sm font-medium text-foreground bg-transparent border-b border-primary outline-none px-0 py-0 min-w-0 w-full"
                      />
                    ) : (
                      <p
                        className="text-sm font-medium text-foreground truncate cursor-text"
                        onDoubleClick={(e) => startEditingChapterTitle(e, chapter)}
                      >
                        {chapter.title}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleToggleComplete(e, chapter.id)}
                      className={`p-0.5 rounded transition-colors ${
                        chapter.isComplete
                          ? "text-green-600 hover:text-green-700"
                          : "text-muted-foreground/40 hover:text-muted-foreground opacity-0 group-hover:opacity-100"
                      }`}
                      title={chapter.isComplete ? "Mark as draft" : "Mark as complete"}
                    >
                      <Check className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => handleDeleteChapter(e, chapter.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-destructive/10 transition-opacity"
                      disabled={chapterLoading === "deleting"}
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

          <button
            onClick={handleAddChapter}
            disabled={chapterLoading === "adding"}
            className="w-full p-3 rounded-lg border-2 border-dashed border-muted-foreground/30 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:border-primary/60 hover:text-foreground transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {chapterLoading === "adding" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            {chapterLoading === "adding" ? "Adding..." : "Add Chapter"}
          </button>

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

          <KeyboardShortcuts />
        </aside>

        {/* Center Editor */}
        <main className={`flex-1 overflow-hidden flex flex-col transition-colors duration-300 ${focusMode ? "bg-[hsl(40,30%,97%)]" : "bg-muted/30"}`}>
          {currentChapter ? (
            <>
              {/* Chapter header — fades out in focus mode */}
              <div
                className={`px-6 py-3 border-b border-border transition-all duration-300 ${
                  focusMode
                    ? "opacity-0 h-0 py-0 overflow-hidden border-none"
                    : "bg-muted/50"
                }`}
              >
                <h1 className="text-base font-semibold text-foreground">{currentChapter.title}</h1>
                <p className="text-xs text-muted-foreground mt-0.5">
                  <span
                    className={`transition-colors duration-500 ${
                      wordCountJustChanged ? "text-primary font-semibold" : ""
                    }`}
                  >
                    {currentChapter.wordCount.toLocaleString()} words
                  </span>
                  {" "}&bull;{" "}
                  {currentChapter.isComplete ? "Complete" : "Draft"}
                </p>
              </div>

              {/* Focus mode exit button — appears at top right in focus mode */}
              {focusMode && (
                <div className="absolute top-3 right-4 z-10 flex items-center gap-2">
                  {/* Floating word count */}
                  <span
                    className={`text-xs font-medium transition-all duration-500 ${
                      wordCountJustChanged
                        ? "text-primary scale-110"
                        : "text-muted-foreground/50"
                    }`}
                  >
                    {currentChapter.wordCount.toLocaleString()} words
                  </span>
                  {/* Sync status */}
                  <span className="text-xs text-muted-foreground/40">
                    {syncStatus === "syncing" ? (
                      <Loader2 size={12} className="animate-spin inline" />
                    ) : syncStatus === "synced" ? (
                      <Cloud size={12} className="inline text-green-500/60" />
                    ) : null}
                  </span>
                  <button
                    onClick={() => setFocusMode(false)}
                    className="p-1.5 text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded hover:bg-muted/40"
                    title="Exit focus mode (Esc)"
                  >
                    <Minimize2 size={14} />
                  </button>
                </div>
              )}

              {/* Editor canvas */}
              <div className={`flex-1 overflow-y-auto flex justify-center py-6 sm:py-10 px-3 sm:px-6 transition-all duration-300 bg-muted/30 ${focusMode ? "py-12 sm:py-16" : ""}`}>
                <div className={`w-full transition-all duration-500 bg-background rounded-xl border border-border/40 shadow-sm ${focusMode ? "max-w-[680px]" : "max-w-[800px]"}`}>
                  <LexicalEditor
                    key={currentChapterId}
                    initialContent={currentChapter.content}
                    onChange={handleEditorChange}
                    onWordCountChange={handleWordCountChange}
                    placeholder="Start writing your story..."
                  />
                </div>
              </div>

              {/* Bottom status bar in focus mode */}
              {focusMode && (
                <div className="absolute bottom-0 left-0 right-0 flex justify-center pb-4 pointer-events-none">
                  <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-foreground/5 border border-border/30 text-xs text-muted-foreground/50">
                    <span>{currentChapter.title}</span>
                    <span>&bull;</span>
                    <span className={`transition-colors duration-300 ${wordCountJustChanged ? "text-primary/70" : ""}`}>
                      {currentChapter.wordCount.toLocaleString()} words
                    </span>
                  </div>
                </div>
              )}
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
                <h2 className="font-semibold text-foreground mb-4">Craft Coach</h2>

                {/* Selection highlight indicator */}
                {selectedText && (
                  <div className="mb-3 px-3 py-2 rounded-lg bg-primary/8 border border-primary/20 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse shrink-0" />
                    <span className="text-xs text-primary font-medium">
                      {selectedText.split(/\s+/).filter(Boolean).length} words selected
                    </span>
                    <button
                      onClick={() => { setSelectedText(""); setSelectionPosition(null); }}
                      className="ml-auto text-muted-foreground hover:text-foreground"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}

                {/* Stats Card */}
                <div className="bg-background border border-border rounded-lg p-4 mb-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Chapter Words</span>
                      <span className={`text-sm font-semibold transition-colors duration-300 ${wordCountJustChanged ? "text-primary" : "text-foreground"}`}>
                        {currentChapter?.wordCount.toLocaleString() || 0}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">AI Analyses</span>
                      <span className={`text-sm font-semibold ${totalAiRequests >= 10 ? "text-destructive" : "text-foreground"}`}>
                        {totalAiRequests}/10
                      </span>
                    </div>
                    {/* Usage bar */}
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-1">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          totalAiRequests >= 10
                            ? "bg-destructive"
                            : totalAiRequests >= 8
                            ? "bg-amber-400"
                            : "bg-primary"
                        }`}
                        style={{ width: `${Math.min((totalAiRequests / 10) * 100, 100)}%` }}
                      />
                    </div>
                    {totalAiRequests >= 10 && (
                      <p className="text-xs text-destructive mt-1">Daily limit reached. Upgrade for more.</p>
                    )}
                    {totalAiRequests >= 8 && totalAiRequests < 10 && (
                      <p className="text-xs text-amber-600 mt-1">{10 - totalAiRequests} analyses remaining today</p>
                    )}
                  </div>
                </div>

                {/* AI Feedback Panel */}
                <div className="mb-4">
                  <AiFeedbackPanel
                    selectedText={selectedText}
                    totalAiRequests={totalAiRequests}
                    aiRequestLimit={10}
                    onApplySuggestion={(text) => { console.log("Applying suggestion:", text); }}
                    onDismiss={() => { setSelectedText(""); setSelectionPosition(null); }}
                    onAnalyze={(persona, feedbackText) => {
                      if (totalAiRequests < 10) {
                        incrementAiUsage();
                        addFeedbackToHistory(persona, selectedText, feedbackText);
                      }
                    }}
                  />
                </div>

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
              <EmotionHeatmap chapterContent={currentChapter?.content || ""} onAnalyze={incrementAiUsage} />
            )}
            {rightTab === "ghost" && (
              <GhostReader chapterContent={currentChapter?.content || ""} onAnalyze={incrementAiUsage} />
            )}
            {rightTab === "branch" && (
              <WhatIfBranching
                selectedText={selectedText}
                onApply={(text) => { console.log("Apply branch:", text); }}
                onAnalyze={incrementAiUsage}
              />
            )}
            {rightTab === "bible" && (
              <StoryBible chapterContent={currentChapter?.content || ""} onAnalyze={incrementAiUsage} />
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};

export default Editor;
