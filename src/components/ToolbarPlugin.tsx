import { useEffect, useState } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  FORMAT_TEXT_COMMAND,
  TextFormatType,
} from 'lexical';
import { $setBlocksType } from '@lexical/selection';
import { $createHeadingNode } from '@lexical/rich-text';
import { HeadingNode } from '@lexical/rich-text';
import { $createListNode, ListNode, ListItemNode } from '@lexical/list';
import { INSERT_UNORDERED_LIST_COMMAND, INSERT_ORDERED_LIST_COMMAND } from '@lexical/list';
import {
  Bold,
  Italic,
  Underline,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
} from 'lucide-react';

type BlockType = 'paragraph' | 'h1' | 'h2' | 'h3' | 'bullet' | 'number';

export default function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [blockType, setBlockType] = useState<BlockType>('paragraph');

  useEffect(() => {
    const removeUpdateListener = editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();

        if ($isRangeSelection(selection)) {
          setIsBold(selection.hasFormat('bold'));
          setIsItalic(selection.hasFormat('italic'));
          setIsUnderline(selection.hasFormat('underline'));
        }

        // Determine current block type
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor.getNode();
          const parent = anchor.getParent();

          try {
            // Check for heading
            if (parent?.getType() === 'heading') {
              const headingNode = parent as HeadingNode;
              const headingTag = headingNode.getTag();
              setBlockType(
                headingTag === 'h1'
                  ? 'h1'
                  : headingTag === 'h2'
                    ? 'h2'
                    : headingTag === 'h3'
                      ? 'h3'
                      : 'paragraph'
              );
            } else if (parent?.getType() === 'listitem') {
              // Check for list
              const listParent = parent.getParent();
              if (listParent?.getType() === 'list') {
                const listNode = listParent as ListNode;
                setBlockType(listNode.getListType() === 'number' ? 'number' : 'bullet');
              }
            } else {
              setBlockType('paragraph');
            }
          } catch {
            setBlockType('paragraph');
          }
        }
      });
    });

    return () => {
      removeUpdateListener();
    };
  }, [editor]);

  const handleFormatText = (format: TextFormatType) => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const handleHeading = (level: 'h1' | 'h2' | 'h3') => {
    editor.update(() => {
      const selection = $getSelection();
      if (!$isRangeSelection(selection)) return;

      $setBlocksType(selection, () => $createHeadingNode(level));
    });
  };

  const ToolbarButton = ({
    onClick,
    icon: Icon,
    title,
    isActive = false,
  }: {
    onClick: () => void;
    icon: React.ComponentType<any>;
    title: string;
    isActive?: boolean;
  }) => (
    <button
      onClick={onClick}
      title={title}
      className={`toolbar-button ${isActive ? 'toolbar-button-active' : ''}`}
      type="button"
    >
      <Icon size={18} />
    </button>
  );

  return (
    <div className="lexical-toolbar-wrapper">
      <div className="lexical-toolbar">
        <ToolbarButton
          onClick={() => handleFormatText('bold')}
          icon={Bold}
          title="Bold (Ctrl+B)"
          isActive={isBold}
        />
        <ToolbarButton
          onClick={() => handleFormatText('italic')}
          icon={Italic}
          title="Italic (Ctrl+I)"
          isActive={isItalic}
        />
        <ToolbarButton
          onClick={() => handleFormatText('underline')}
          icon={Underline}
          title="Underline (Ctrl+U)"
          isActive={isUnderline}
        />
        <div className="toolbar-divider" />
        <ToolbarButton
          onClick={() => handleHeading('h1')}
          icon={Heading1}
          title="Heading 1"
          isActive={blockType === 'h1'}
        />
        <ToolbarButton
          onClick={() => handleHeading('h2')}
          icon={Heading2}
          title="Heading 2"
          isActive={blockType === 'h2'}
        />
        <ToolbarButton
          onClick={() => handleHeading('h3')}
          icon={Heading3}
          title="Heading 3"
          isActive={blockType === 'h3'}
        />
        <div className="toolbar-divider" />
        <ToolbarButton
          onClick={() => {
            editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
          }}
          icon={List}
          title="Bullet List"
          isActive={blockType === 'bullet'}
        />
        <ToolbarButton
          onClick={() => {
            editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
          }}
          icon={ListOrdered}
          title="Numbered List"
          isActive={blockType === 'number'}
        />
      </div>
    </div>
  );
}
