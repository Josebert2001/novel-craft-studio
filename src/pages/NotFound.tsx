import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { BookOpen, Home, ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <div className="text-center max-w-md">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <img src="/logo.png" alt="ICHEN Manuscript" className="h-9 w-auto" />
          <span className="font-bold text-lg text-foreground tracking-tight">ICHEN Manuscript</span>
        </div>

        <h1 className="text-7xl font-bold text-primary/20 mb-2">404</h1>
        <p className="text-xl font-semibold text-foreground mb-2">Page not found</p>
        <p className="text-sm text-muted-foreground mb-8">
          The page <code className="px-1.5 py-0.5 bg-muted rounded text-xs">{location.pathname}</code> doesn't exist in this manuscript.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Home className="h-4 w-4" />
            Back to Home
          </Link>
          <Link
            to="/editor"
            className="inline-flex items-center gap-2 px-5 py-2.5 border border-border rounded-lg text-sm font-medium text-foreground hover:bg-muted transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Open Editor
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
