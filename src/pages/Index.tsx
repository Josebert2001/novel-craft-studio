import { Link } from "react-router-dom";
import { BookOpen, Sparkles } from "lucide-react";

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-2xl">
        <div className="flex items-center justify-center gap-3 mb-6">
          <img src="/logo.png" alt="ICHEN Manuscript" className="h-12 w-12" />
          <h1 className="text-5xl font-bold text-foreground">ICHEN Manuscript</h1>
        </div>
        
        <p className="text-xl text-muted-foreground mb-8">
          The AI editor that walks beside you.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          <div className="bg-background border border-border rounded-lg p-4">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Rich Text Editor</h3>
            <p className="text-sm text-muted-foreground">
              Markdown shortcuts and intuitive formatting
            </p>
          </div>

          <div className="bg-background border border-border rounded-lg p-4">
            <Sparkles className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Smart Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered writing assistance at your fingertips
            </p>
          </div>

          <div className="bg-background border border-border rounded-lg p-4">
            <BookOpen className="h-8 w-8 text-primary mx-auto mb-2" />
            <h3 className="font-semibold text-foreground mb-1">Chapter Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Organize your work with chapters and progress tracking
            </p>
          </div>
        </div>

        <Link
          to="/editor"
          className="inline-block px-8 py-3 bg-primary text-primary-foreground rounded-lg font-semibold hover:opacity-90 transition-opacity"
        >
          Start Writing
        </Link>
      </div>
    </div>
  );
};

export default Index;
