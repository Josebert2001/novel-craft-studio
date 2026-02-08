import {
  LexicalComposer,
  InitialConfigType,
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import {
  HeadingNode,
  QuoteNode,
} from '@lexical/rich-text';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { EditorState } from 'lexical';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import ToolbarPlugin from './ToolbarPlugin';
import WordCountPlugin from './WordCountPlugin';



interface LexicalEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onWordCountChange?: (wordCount: number) => void;
  placeholder?: string;
}

export default function LexicalEditor({
  initialContent = '',
  onChange,
  onWordCountChange,
  placeholder = 'Start writing your story...',
}: LexicalEditorProps) {
  const editorConfig: InitialConfigType = {
    namespace: 'NovelCraftEditor',
    theme: {
      paragraph: 'editor-paragraph',
      heading: {
        h1: 'editor-heading-h1',
        h2: 'editor-heading-h2',
        h3: 'editor-heading-h3',
      },
      list: {
        nested: {
          listitem: 'editor-nested-listitem',
        },
        ol: 'editor-list-ol',
        ul: 'editor-list-ul',
        listitem: 'editor-listitem',
      },
      link: 'editor-link',
      text: {
        bold: 'editor-text-bold',
        italic: 'editor-text-italic',
        underline: 'editor-text-underline',
      },
    },
    nodes: [
      HeadingNode,
      ListNode,
      ListItemNode,
      QuoteNode,
      CodeNode,
      CodeHighlightNode,
      AutoLinkNode,
      LinkNode,
    ],
    onError: (error: Error) => {
      console.error('Lexical error:', error);
    },
  };

  const handleChange = (editorState: EditorState) => {
    editorState.read(() => {
      const content = JSON.stringify(editorState.toJSON());
      onChange(content);
    });
  };

  return (
    <LexicalComposer initialConfig={editorConfig}>
      <div className="lexical-editor-container">
        <ToolbarPlugin />
        {onWordCountChange && <WordCountPlugin onWordCountChange={onWordCountChange} />}
        <MarkdownShortcutPlugin />
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className="lexical-content-editable"
            />
          }
          placeholder={
            <div className="lexical-placeholder">{placeholder}</div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
}
