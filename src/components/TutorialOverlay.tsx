import { useState } from "react";
import { Edit3, MousePointerClick, Sparkles, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface TutorialStep {
  title: string;
  description: string;
  icon: React.ReactNode;
  spotlight: "center" | "center-select" | "right";
}

const steps: TutorialStep[] = [
  {
    title: "Start Writing",
    description: "The center canvas is your distraction-free space. Just click and write — like a blank page waiting for your story.",
    icon: <Edit3 className="h-6 w-6" />,
    spotlight: "center",
  },
  {
    title: "Select Your Text",
    description: "Highlight any sentence or paragraph you'd like feedback on. Just click and drag to select.",
    icon: <MousePointerClick className="h-6 w-6" />,
    spotlight: "center-select",
  },
  {
    title: "Get AI Feedback",
    description: "Choose an AI persona from the right panel — each one gives a different editorial perspective. You decide what to keep.",
    icon: <Sparkles className="h-6 w-6" />,
    spotlight: "right",
  },
];

interface TutorialOverlayProps {
  open: boolean;
  onClose: () => void;
}

export const TutorialOverlay = ({ open, onClose }: TutorialOverlayProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!open) return null;

  const step = steps[currentStep];
  const isLast = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep((s) => s + 1);
    }
  };

  const handleComplete = () => {
    localStorage.setItem("ichen_tutorial_completed", "true");
    setCurrentStep(0);
    onClose();
  };

  const handleSkip = () => {
    handleComplete();
  };

  // Spotlight position styles
  const getSpotlightStyle = (): React.CSSProperties => {
    switch (step.spotlight) {
      case "center":
        return {
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(600px, 50vw)",
          height: "300px",
        };
      case "center-select":
        return {
          top: "45%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "min(500px, 45vw)",
          height: "120px",
        };
      case "right":
        return {
          top: "35%",
          right: "16px",
          width: "min(300px, 25vw)",
          height: "250px",
        };
      default:
        return {};
    }
  };

  // Card position
  const getCardPosition = (): string => {
    switch (step.spotlight) {
      case "center":
        return "top-[72%] left-1/2 -translate-x-1/2";
      case "center-select":
        return "top-[62%] left-1/2 -translate-x-1/2";
      case "right":
        return "top-[35%] right-[calc(min(300px,25vw)+32px)]";
      default:
        return "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2";
    }
  };

  return (
    <div className="fixed inset-0 z-[200] animate-in fade-in duration-300">
      {/* Dark backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={handleSkip} />

      {/* Spotlight cutout */}
      <div
        className="absolute rounded-2xl border-2 border-primary/40 animate-in fade-in zoom-in-95 duration-500"
        style={{
          ...getSpotlightStyle(),
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.55), 0 0 40px 4px hsl(var(--primary) / 0.15)",
          background: "transparent",
        }}
      />

      {/* Tooltip card */}
      <div
        className={`absolute ${getCardPosition()} w-[340px] max-w-[90vw] animate-in slide-in-from-bottom-4 fade-in duration-500`}
      >
        <div className="bg-background border border-border rounded-xl shadow-2xl p-5">
          {/* Step indicator */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1.5">
              {steps.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    i === currentStep
                      ? "w-6 bg-primary"
                      : i < currentStep
                      ? "w-1.5 bg-primary/40"
                      : "w-1.5 bg-muted-foreground/20"
                  }`}
                />
              ))}
            </div>
            <span className="text-[10px] text-muted-foreground font-medium">
              {currentStep + 1} of {steps.length}
            </span>
          </div>

          {/* Icon + content */}
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
              {step.icon}
            </div>
            <div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.description}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-[11px] text-muted-foreground hover:text-foreground transition-colors"
            >
              Skip tutorial
            </button>
            <Button size="sm" onClick={handleNext} className="gap-1 text-xs">
              {isLast ? "Start Writing" : "Next"}
              {!isLast && <ChevronRight className="h-3 w-3" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
