import { useEffect, useRef } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { getWordCountFromLexicalContent } from '../lib/wordCount';

interface WordCountPluginProps {
  onWordCountChange: (wordCount: number) => void;
}

export default function WordCountPlugin({ onWordCountChange }: WordCountPluginProps) {
  const [editor] = useLexicalComposerContext();
  const lastWordCountRef = useRef<number>(-1);
  const callbackRef = useRef(onWordCountChange);
  callbackRef.current = onWordCountChange;

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const editorStateJson = JSON.stringify(editorState.toJSON());
        const wordCount = getWordCountFromLexicalContent(editorStateJson);
        if (wordCount !== lastWordCountRef.current) {
          lastWordCountRef.current = wordCount;
          callbackRef.current(wordCount);
        }
      });
    });

    return () => {
      removeUpdateListener();
    };
  }, [editor]);

  return null;
}
