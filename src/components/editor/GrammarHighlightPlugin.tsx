import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useCallback, useState } from 'react';
import { GrammarIssue } from '@/lib/grammarCheck';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { AlertCircle, Lightbulb, Zap } from 'lucide-react';

interface UnderlineRect {
  left: number;
  top: number;
  width: number;
  height: number;
  type: GrammarIssue['type'];
  issueIndex: number;
}

function getTextNodesIn(node: Node): Text[] {
  const textNodes: Text[] = [];
  const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
  let current: Text | null;
  while ((current = walker.nextNode() as Text | null)) {
    textNodes.push(current);
  }
  return textNodes;
}

const issueIcons: Record<GrammarIssue['type'], React.ReactNode> = {
  grammar: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
  spelling: <AlertCircle className="h-3.5 w-3.5 text-destructive" />,
  style: <Lightbulb className="h-3.5 w-3.5 text-primary" />,
  passive: <Zap className="h-3.5 w-3.5 text-yellow-500" />,
  'weak-verb': <Zap className="h-3.5 w-3.5 text-purple-500" />,
};

const colorMap: Record<GrammarIssue['type'], string> = {
  grammar: 'hsl(0 84% 60%)',
  spelling: 'hsl(0 84% 60%)',
  style: 'hsl(217 91% 60%)',
  passive: 'hsl(45 93% 47%)',
  'weak-verb': 'hsl(45 93% 47%)',
};

interface GrammarHighlightPluginProps {
  issues: GrammarIssue[];
  onApplyFix?: (issue: GrammarIssue, replacement: string) => void;
  onIgnore?: (issue: GrammarIssue) => void;
}

export function GrammarHighlightPlugin({ issues, onApplyFix, onIgnore }: GrammarHighlightPluginProps) {
  const [editor] = useLexicalComposerContext();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [underlines, setUnderlines] = useState<UnderlineRect[]>([]);
  const [openPopover, setOpenPopover] = useState<number | null>(null);

  const recalculate = useCallback(() => {
    const rootEl = editor.getRootElement();
    if (!rootEl || issues.length === 0) {
      setUnderlines([]);
      return;
    }

    const textNodes = getTextNodesIn(rootEl);
    if (textNodes.length === 0) {
      setUnderlines([]);
      return;
    }

    let globalOffset = 0;
    const nodeMap: { node: Text; start: number; end: number }[] = [];
    for (const tn of textNodes) {
      const len = tn.textContent?.length || 0;
      nodeMap.push({ node: tn, start: globalOffset, end: globalOffset + len });
      globalOffset += len;
    }

    const rootRect = rootEl.getBoundingClientRect();
    const newUnderlines: UnderlineRect[] = [];

    for (let issueIdx = 0; issueIdx < issues.length; issueIdx++) {
      const issue = issues[issueIdx];
      const issueStart = issue.offset;
      const issueEnd = issue.offset + issue.length;

      for (const { node, start, end } of nodeMap) {
        if (start >= issueEnd || end <= issueStart) continue;

        const rangeStart = Math.max(issueStart - start, 0);
        const rangeEnd = Math.min(issueEnd - start, node.textContent?.length || 0);

        try {
          const range = document.createRange();
          range.setStart(node, rangeStart);
          range.setEnd(node, rangeEnd);
          const rects = range.getClientRects();

          for (const rect of Array.from(rects)) {
            newUnderlines.push({
              left: rect.left - rootRect.left,
              top: rect.bottom - rootRect.top - 2,
              width: rect.width,
              height: 3,
              type: issue.type,
              issueIndex: issueIdx,
            });
          }
        } catch {
          // Range errors if offsets don't match DOM
        }
      }
    }

    setUnderlines(newUnderlines);
  }, [editor, issues]);

  useEffect(() => {
    recalculate();

    const unregister = editor.registerUpdateListener(() => {
      requestAnimationFrame(recalculate);
    });

    const rootEl = editor.getRootElement();
    const scrollParent = rootEl?.closest('.flex-1.overflow-y-auto') || rootEl?.parentElement;

    const handleScroll = () => requestAnimationFrame(recalculate);
    const handleResize = () => requestAnimationFrame(recalculate);

    scrollParent?.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    return () => {
      unregister();
      scrollParent?.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [editor, recalculate]);

  const rootEl = editor.getRootElement();
  if (!rootEl || underlines.length === 0) return null;

  // Group underlines by issueIndex so we only render one popover per issue
  const issueGroups = new Map<number, UnderlineRect[]>();
  for (const u of underlines) {
    if (!issueGroups.has(u.issueIndex)) {
      issueGroups.set(u.issueIndex, []);
    }
    issueGroups.get(u.issueIndex)!.push(u);
  }

  return (
    <div
      ref={overlayRef}
      className="grammar-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none',
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      {Array.from(issueGroups.entries()).map(([issueIdx, rects]) => {
        const issue = issues[issueIdx];
        if (!issue) return null;
        const isOpen = openPopover === issueIdx;

        return (
          <Popover
            key={issueIdx}
            open={isOpen}
            onOpenChange={(open) => setOpenPopover(open ? issueIdx : null)}
          >
            <PopoverTrigger asChild>
              <div style={{ pointerEvents: 'none' }}>
                {rects.map((u, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      left: u.left,
                      top: u.top - 14,
                      width: u.width,
                      height: 18,
                      pointerEvents: 'auto',
                      cursor: 'pointer',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenPopover(isOpen ? null : issueIdx);
                    }}
                  >
                    {/* Visible wavy underline */}
                    <div
                      style={{
                        position: 'absolute',
                        left: 0,
                        bottom: 0,
                        width: u.width,
                        height: u.height,
                        backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='3' viewBox='0 0 4 3' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 3 Q1 0 2 3 Q3 6 4 3' stroke='${encodeURIComponent(colorMap[u.type])}' fill='none' stroke-width='1'/%3E%3C/svg%3E")`,
                        backgroundRepeat: 'repeat-x',
                        backgroundSize: '4px 3px',
                      }}
                    />
                  </div>
                ))}
              </div>
            </PopoverTrigger>
            <PopoverContent
              className="w-64 p-3"
              side="bottom"
              align="start"
              onOpenAutoFocus={(e) => e.preventDefault()}
            >
              <div className="flex items-start gap-2 mb-2">
                {issueIcons[issue.type]}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground">{issue.shortMessage}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    {issue.message}
                  </p>
                </div>
              </div>

              {issue.replacements.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {issue.replacements.map((replacement, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="h-6 text-[11px] px-2"
                      onClick={() => {
                        onApplyFix?.(issue, replacement);
                        setOpenPopover(null);
                      }}
                    >
                      → {replacement}
                    </Button>
                  ))}
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-5 text-[10px] text-muted-foreground mt-2 px-1"
                onClick={() => {
                  onIgnore?.(issue);
                  setOpenPopover(null);
                }}
              >
                Ignore
              </Button>
            </PopoverContent>
          </Popover>
        );
      })}
    </div>
  );
}
