import { useEffect } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Sparkles, GitBranch, Eye, BookMarked, ArrowRight, PenLine, Brain, BarChart3, Download } from "lucide-react";

const FEATURES = [
  {
    icon: PenLine,
    title: "Distraction-Free Writing",
    description: "A clean, focused canvas powered by a rich text editor with markdown shortcuts and smart formatting.",
  },
  {
    icon: Brain,
    title: "AI Craft Coach",
    description: "Select any passage and get instant editorial feedback from four specialized AI personas.",
  },
  {
    icon: BarChart3,
    title: "Emotion Heatmap",
    description: "Visualize the emotional arc of your chapter — joy, tension, fear, and sadness, paragraph by paragraph.",
  },
  {
    icon: Eye,
    title: "Ghost Reader",
    description: "Simulate a first-time reader's experience and discover where engagement drops or confusion creeps in.",
  },
  {
    icon: GitBranch,
    title: "What-If Branches",
    description: "Generate three alternate versions of any passage with a single click. Merge the best ideas.",
  },
  {
    icon: BookMarked,
    title: "Story Bible",
    description: "Automatically extract characters, locations, and timeline events from your manuscript.",
  },
];

const BETA_HIGHLIGHTS = [
  { label: "AI Craft Coach", detail: "4 specialized editorial personas" },
  { label: "Grammar Checking", detail: "Real-time Grammarly-style underlines" },
  { label: "Writing Agent", detail: "Multi-tool AI assistant for deep analysis" },
  { label: "Emotion Heatmap", detail: "Visualize your chapter's emotional arc" },
  { label: "Cloud Sync", detail: "Auto-save to the cloud, write anywhere" },
];

const Index = () => {
  // Propagate dark mode from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("ichen_dark_mode");
    if (stored === "true") document.documentElement.classList.add("dark");
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ICHEN" className="h-8 w-auto" />
            <span className="font-bold text-lg text-foreground tracking-tight">ICHEN Manuscript</span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/install"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
            >
              <Download className="h-3.5 w-3.5" />
              Install
            </Link>
            <Link
              to="/auth"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/auth"
              className="text-sm px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-28 px-6 text-center relative overflow-hidden">
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, hsl(224 72% 40% / 0.08) 0%, transparent 70%)",
          }}
        />

        <div className="max-w-4xl mx-auto relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-8">
            <Sparkles className="h-3 w-3" />
            Human-first AI writing
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-foreground leading-[1.08] tracking-tight mb-6">
            The AI editor that
            <br />
            <span className="text-primary">walks beside you</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            ICHEN Manuscript gives you the tools to write with clarity and confidence.
            AI suggests. You decide. Your story stays yours.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/auth"
              className="group inline-flex items-center gap-2 px-8 py-3.5 bg-primary text-primary-foreground rounded-xl font-semibold text-base hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20"
            >
              Start Writing Free
              <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              to="/auth"
              className="inline-flex items-center gap-2 px-8 py-3.5 border border-border rounded-xl font-medium text-base text-foreground hover:bg-muted transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Open Editor
            </Link>
          </div>

          <p className="mt-5 text-xs text-muted-foreground">
            No credit card required. Free to start.
          </p>
        </div>
      </section>

      {/* Editor preview strip */}
      <section className="px-6 pb-24">
        <div className="max-w-5xl mx-auto">
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden hidden sm:block">
            <div className="h-8 bg-muted border-b border-border flex items-center px-4 gap-2">
              <span className="w-3 h-3 rounded-full bg-destructive/50" />
              <span className="w-3 h-3 rounded-full bg-secondary/70" />
              <span className="w-3 h-3 rounded-full bg-green-400/60" />
              <span className="ml-4 text-xs text-muted-foreground">ICHEN Manuscript — Chapter 1</span>
            </div>
            <div className="hidden md:grid grid-cols-[200px_1fr_240px] divide-x divide-border h-72">
              {/* Left sidebar preview */}
              <div className="bg-sidebar p-4 flex flex-col gap-2 overflow-hidden">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-1">Chapters</p>
                {["Chapter 1", "Chapter 2", "Chapter 3"].map((ch, i) => (
                  <div
                    key={ch}
                    className={`px-3 py-2 rounded-lg text-xs font-medium truncate ${
                      i === 0
                        ? "bg-primary/15 text-primary border border-primary/30"
                        : "text-muted-foreground hover:bg-muted"
                    }`}
                  >
                    {ch}
                  </div>
                ))}
              </div>
              {/* Editor area preview */}
              <div className="p-8 flex flex-col gap-3 overflow-hidden">
                <div className="h-2 w-3/4 bg-muted rounded-full" />
                <div className="h-2 w-full bg-muted rounded-full" />
                <div className="h-2 w-5/6 bg-muted rounded-full" />
                <div className="h-2 w-2/3 bg-muted rounded-full mt-2" />
                <div className="h-2 w-full bg-muted rounded-full" />
                <div className="h-2 w-4/5 bg-muted rounded-full" />
                <div className="h-2 w-full bg-muted rounded-full mt-2" />
                <div className="h-2 w-3/5 bg-muted rounded-full" />
              </div>
              {/* Right panel preview */}
              <div className="bg-muted p-4 flex flex-col gap-3 overflow-hidden">
                <p className="text-xs font-semibold text-foreground">AI Craft Coach</p>
                <div className="space-y-1.5">
                  {["Clarity Coach", "Emotional Reader", "Plot Hunter", "Style Polisher"].map((p) => (
                    <div key={p} className="h-8 rounded-lg bg-background border border-border flex items-center px-2.5 gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary/50" />
                      <span className="text-[10px] text-muted-foreground">{p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features grid */}
      <section className="px-6 pb-28">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Every tool a writer needs
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Built around the craft of writing, not the novelty of AI.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="group p-6 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all duration-200"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="px-6 pb-28 bg-muted/40 py-20">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
              Writers love ICHEN
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map(({ quote, name, role }) => (
              <div key={name} className="bg-background rounded-xl border border-border p-6">
                <p className="text-foreground text-sm leading-relaxed mb-5 italic">"{quote}"</p>
                <div>
                  <p className="text-sm font-semibold text-foreground">{name}</p>
                  <p className="text-xs text-muted-foreground">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-28">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground mb-4">
            Ready to write your story?
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Join writers who choose ICHEN to craft with intention and clarity.
          </p>
          <Link
            to="/auth"
            className="group inline-flex items-center gap-2 px-10 py-4 bg-primary text-primary-foreground rounded-xl font-semibold text-lg hover:opacity-90 transition-all duration-200 shadow-lg shadow-primary/20"
          >
            Start Writing Free
            <ArrowRight className="h-5 w-5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-6 py-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/logo.png" alt="ICHEN" className="h-6 w-auto" />
            <span className="text-sm font-semibold text-foreground">ICHEN Manuscript</span>
          </div>
          <p className="text-xs text-muted-foreground">
            The AI editor that walks beside you.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
