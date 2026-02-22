import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Download, Smartphone, Monitor, ArrowLeft, Share, MoreVertical, PlusSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const Install = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => setInstalled(true));

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="border-b border-border px-6 h-16 flex items-center">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Back</span>
        </Link>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Download className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl font-bold mb-3">Install ICHEN Manuscript</h1>
          <p className="text-muted-foreground text-lg">
            Add ICHEN to your home screen for a native app experience — works offline too.
          </p>
        </div>

        {installed ? (
          <div className="text-center p-8 rounded-xl border border-border bg-card">
            <p className="text-lg font-semibold text-primary mb-2">✅ App Installed!</p>
            <p className="text-muted-foreground text-sm">You can now launch ICHEN from your home screen.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {deferredPrompt && (
              <div className="text-center">
                <Button onClick={handleInstall} size="lg" className="gap-2 text-base px-8">
                  <Download className="h-5 w-5" />
                  Install App
                </Button>
              </div>
            )}

            <div className="grid gap-6 sm:grid-cols-2">
              {/* iOS */}
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">iPhone / iPad</h3>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">1.</span>
                    <span>Open this page in <strong className="text-foreground">Safari</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">2.</span>
                    <span className="flex items-center gap-1">Tap the <Share className="h-4 w-4 inline text-foreground" /> Share button</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">3.</span>
                    <span className="flex items-center gap-1">Tap <PlusSquare className="h-4 w-4 inline text-foreground" /> <strong className="text-foreground">Add to Home Screen</strong></span>
                  </li>
                </ol>
              </div>

              {/* Android */}
              <div className="p-6 rounded-xl border border-border bg-card">
                <div className="flex items-center gap-3 mb-4">
                  <Monitor className="h-5 w-5 text-muted-foreground" />
                  <h3 className="font-semibold">Android / Desktop</h3>
                </div>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">1.</span>
                    <span>Open this page in <strong className="text-foreground">Chrome</strong></span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">2.</span>
                    <span className="flex items-center gap-1">Tap the <MoreVertical className="h-4 w-4 inline text-foreground" /> menu</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">3.</span>
                    <span>Tap <strong className="text-foreground">Install app</strong> or <strong className="text-foreground">Add to Home Screen</strong></span>
                  </li>
                </ol>
              </div>
            </div>
          </div>
        )}

        <div className="mt-12 text-center">
          <Link to="/auth" className="text-sm text-primary hover:underline">
            Or continue in the browser →
          </Link>
        </div>
      </main>
    </div>
  );
};

export default Install;
