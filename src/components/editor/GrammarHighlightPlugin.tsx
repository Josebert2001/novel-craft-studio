import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useRef, useCallback, useState } from 'react';
import { GrammarIssue } from '@/lib/grammarCheck';

interface UnderlineRect {
  left: number;
  top: number;
  width: number;
  height: number;
  type: GrammarIssue['type'];
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

export function GrammarHighlightPlugin({ issues }: { issues: GrammarIssue[] }) {
  const [editor] = useLexicalComposerContext();
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const [underlines, setUnderlines] = useState<UnderlineRect[]>([]);

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

    // Build a map of global offset -> { textNode, localOffset }
    let globalOffset = 0;
    const nodeMap: { node: Text; start: number; end: number }[] = [];
    for (const tn of textNodes) {
      const len = tn.textContent?.length || 0;
      nodeMap.push({ node: tn, start: globalOffset, end: globalOffset + len });
      globalOffset += len;
    }

    const rootRect = rootEl.getBoundingClientRect();
    const newUnderlines: UnderlineRect[] = [];

    for (const issue of issues) {
      const issueStart = issue.offset;
      const issueEnd = issue.offset + issue.length;

      // Find overlapping text nodes
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

  const colorMap: Record<GrammarIssue['type'], string> = {
    grammar: 'hsl(0 84% 60%)',       // red
    spelling: 'hsl(0 84% 60%)',      // red
    style: 'hsl(217 91% 60%)',       // blue
    passive: 'hsl(45 93% 47%)',      // yellow
    'weak-verb': 'hsl(45 93% 47%)',  // yellow
  };

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
      {underlines.map((u, i) => (
        <div
          key={i}
          className="grammar-underline"
          style={{
            position: 'absolute',
            left: u.left,
            top: u.top,
            width: u.width,
            height: u.height,
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='4' height='3' viewBox='0 0 4 3' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 3 Q1 0 2 3 Q3 6 4 3' stroke='${encodeURIComponent(colorMap[u.type])}' fill='none' stroke-width='1'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'repeat-x',
            backgroundSize: '4px 3px',
          }}
        />
      ))}
    </div>
  );
}
