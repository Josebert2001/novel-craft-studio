import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, useState } from 'react';
import { $getRoot } from 'lexical';
import { GrammarIssue, checkGrammar } from '@/lib/grammarCheck';

let grammarCheckTimeout: ReturnType<typeof setTimeout>;

export function GrammarDecorator() {
  const [editor] = useLexicalComposerContext();
  const [issues, setIssues] = useState<GrammarIssue[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    const unregister = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const root = $getRoot();
        const text = root.getTextContent();

        clearTimeout(grammarCheckTimeout);
        grammarCheckTimeout = setTimeout(async () => {
          if (text.length > 10) {
            setIsChecking(true);
            const newIssues = await checkGrammar(text);
            setIssues(newIssues);
            setIsChecking(false);
          }
        }, 2000);
      });
    });

    return unregister;
  }, [editor]);

  return null;
}
