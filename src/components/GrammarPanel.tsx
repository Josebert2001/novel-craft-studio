import { GrammarIssue } from '@/lib/grammarCheck';
import { AlertCircle, CheckCircle2, Lightbulb, Zap, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface GrammarPanelProps {
  issues: GrammarIssue[];
  isChecking: boolean;
  onApplyFix: (issue: GrammarIssue, replacement: string) => void;
  onIgnore: (issue: GrammarIssue) => void;
}

const issueIcons: Record<GrammarIssue['type'], React.ReactNode> = {
  grammar: <AlertCircle className="h-4 w-4 text-destructive" />,
  spelling: <AlertCircle className="h-4 w-4 text-destructive" />,
  style: <Lightbulb className="h-4 w-4 text-primary" />,
  passive: <Zap className="h-4 w-4 text-yellow-500" />,
  'weak-verb': <Zap className="h-4 w-4 text-purple-500" />,
};

const issueColors: Record<GrammarIssue['type'], string> = {
  grammar: 'bg-destructive/5 border-destructive/20',
  spelling: 'bg-destructive/5 border-destructive/20',
  style: 'bg-primary/5 border-primary/20',
  passive: 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800',
  'weak-verb': 'bg-purple-50 border-purple-200 dark:bg-purple-950/20 dark:border-purple-800',
};

export function GrammarPanel({ issues, isChecking, onApplyFix, onIgnore }: GrammarPanelProps) {
  const grammarCount = issues.filter(i => i.type === 'grammar' || i.type === 'spelling').length;
  const styleCount = issues.filter(i => i.type === 'style' || i.type === 'passive' || i.type === 'weak-verb').length;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">Writing Assistant</h3>
        {isChecking ? (
          <div className="flex items-center gap-2">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">Checking...</span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <Badge variant={grammarCount > 0 ? "destructive" : "secondary"}>
              {grammarCount} Grammar
            </Badge>
            <Badge variant={styleCount > 0 ? "default" : "secondary"}>
              {styleCount} Style
            </Badge>
          </div>
        )}
      </div>

      {/* Issues List */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {issues.length === 0 && !isChecking && (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CheckCircle2 className="h-8 w-8 text-green-500 mb-2" />
              <p className="text-sm text-muted-foreground">No issues found!</p>
            </div>
          )}

          {issues.map((issue, index) => (
            <div
              key={`${issue.offset}-${index}`}
              className={`rounded-lg border p-3 ${issueColors[issue.type]}`}
            >
              <div className="flex items-start gap-2">
                {issueIcons[issue.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{issue.shortMessage}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {issue.message}
                  </p>
                </div>
              </div>

              {/* Suggestions */}
              {issue.replacements.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {issue.replacements.map((replacement, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => onApplyFix(issue, replacement)}
                    >
                      → {replacement}
                    </Button>
                  ))}
                </div>
              )}

              {/* Ignore button */}
              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] text-muted-foreground mt-1.5 px-1"
                onClick={() => onIgnore(issue)}
              >
                Ignore
              </Button>
            </div>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
