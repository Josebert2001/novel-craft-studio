import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { getWordCountFromLexicalContent } from '../lib/wordCount';

interface WordCountPluginProps {
  onWordCountChange: (wordCount: number) => void;
}

export default function WordCountPlugin({ onWordCountChange }: WordCountPluginProps) {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const editorStateJson = JSON.stringify(editorState.toJSON());
        const wordCount = getWordCountFromLexicalContent(editorStateJson);
        onWordCountChange(wordCount);
      });
    });

    return () => {
      removeUpdateListener();
    };
  }, [editor, onWordCountChange]);

  return null;
}
