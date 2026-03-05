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
import { HorizontalRuleNode } from '@lexical/react/LexicalHorizontalRuleNode';
import { EditorState, LexicalEditor as LexicalEditorType } from 'lexical';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect, forwardRef, useImperativeHandle } from 'react';
import ToolbarPlugin from './ToolbarPlugin';
import WordCountPlugin from './WordCountPlugin';
import { SceneBreakNode } from './SceneBreakNode';
import { GrammarHighlightPlugin } from './editor/GrammarHighlightPlugin';
import { GrammarIssue } from '@/lib/grammarCheck';

export interface LexicalEditorHandle {
  getEditor: () => LexicalEditorType | null;
}

interface LexicalEditorProps {
  initialContent?: string;
  onChange: (content: string) => void;
  onWordCountChange?: (wordCount: number) => void;
  placeholder?: string;
  grammarIssues?: GrammarIssue[];
  onGrammarApplyFix?: (issue: GrammarIssue, replacement: string) => void;
  onGrammarIgnore?: (issue: GrammarIssue) => void;
}

function EditorRefPlugin({ editorRef }: { editorRef: React.MutableRefObject<LexicalEditorType | null> }) {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editorRef.current = editor;
  }, [editor, editorRef]);
  return null;
}

const LexicalEditorComponent = forwardRef<LexicalEditorHandle, LexicalEditorProps>(({
  initialContent = '',
  onChange,
  onWordCountChange,
  placeholder = 'Start writing your story...',
  grammarIssues = [],
  onGrammarApplyFix,
  onGrammarIgnore,
}, ref) => {
  const internalEditorRef = { current: null as LexicalEditorType | null };

  useImperativeHandle(ref, () => ({
    getEditor: () => internalEditorRef.current,
  }));

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
      HorizontalRuleNode,
      SceneBreakNode,
    ],
    editorState: initialContent ? (() => {
      try {
        const parsed = JSON.parse(initialContent);
        if (parsed && parsed.root) {
          return initialContent;
        }
      } catch {
        // Not valid JSON, ignore
      }
      return null;
    })() : null,
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
        <EditorRefPlugin editorRef={internalEditorRef as React.MutableRefObject<LexicalEditorType | null>} />
        <ToolbarPlugin />
        {onWordCountChange && <WordCountPlugin onWordCountChange={onWordCountChange} />}
        <MarkdownShortcutPlugin />
        <div style={{ position: 'relative' }}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable
                className="lexical-content-editable"
                spellCheck={true}
                role="textbox"
                aria-label="Editor content"
              />
            }
            placeholder={
              <div className="lexical-placeholder">{placeholder}</div>
            }
            ErrorBoundary={LexicalErrorBoundary}
          />
          <GrammarHighlightPlugin issues={grammarIssues} onApplyFix={onGrammarApplyFix} onIgnore={onGrammarIgnore} />
        </div>
        <OnChangePlugin onChange={handleChange} />
        <HistoryPlugin />
      </div>
    </LexicalComposer>
  );
});

LexicalEditorComponent.displayName = 'LexicalEditor';

export default LexicalEditorComponent;
