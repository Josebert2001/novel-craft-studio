import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PanelLeftOpen, Edit3, Sparkles } from "lucide-react";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

export const WelcomeModal = ({ open, onClose }: WelcomeModalProps) => {
  const [dontShowAgain, setDontShowAgain] = useState(false);

  const handleStartWriting = () => {
    if (dontShowAgain) {
      localStorage.setItem("ichen_welcome_dismissed", "true");
    }
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleStartWriting(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <img src="/logo.png" alt="ICHEN Manuscript" className="h-12 w-auto mb-2" />
          <DialogTitle className="text-xl">Welcome to ICHEN Manuscript!</DialogTitle>
          <DialogDescription>
            Your human-first AI-assisted writing environment.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <PanelLeftOpen className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Left Sidebar</p>
              <p className="text-xs text-muted-foreground">Your chapters — add, reorder, and navigate your manuscript.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Edit3 className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">Writing Canvas</p>
              <p className="text-xs text-muted-foreground">A distraction-free editor — just you and your words.</p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
            <Sparkles className="h-5 w-5 text-primary mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-medium text-foreground">AI Craft Coach</p>
              <p className="text-xs text-muted-foreground">Select text and get editorial feedback — AI suggests, you decide.</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          <Checkbox
            id="dont-show"
            checked={dontShowAgain}
            onCheckedChange={(checked) => setDontShowAgain(checked === true)}
          />
          <label htmlFor="dont-show" className="text-xs text-muted-foreground cursor-pointer">
            Don't show this again
          </label>
        </div>

        <Button onClick={handleStartWriting} className="w-full">
          Start Writing
        </Button>
      </DialogContent>
    </Dialog>
  );
};
