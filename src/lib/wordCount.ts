/**
 * Calculate word count from plain text
 * @param text - The text content to count words from
 * @returns The number of words in the text
 */
export const calculateWordCount = (text: string): number => {
  if (!text || text.trim().length === 0) {
    return 0;
  }

  // Split by whitespace and filter out empty strings
  const words = text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0);

  return words.length;
};

/**
 * Extract plain text from Lexical editor state JSON
 * @param content - The Lexical editor state JSON string
 * @returns Plain text content
 */
export const extractTextFromLexicalContent = (content: string): string => {
  try {
    const editorState = JSON.parse(content);
    let text = "";

    const traverseNode = (node: any): void => {
      if (node.type === "text" && node.text) {
        text += node.text + " ";
      }

      if (node.children && Array.isArray(node.children)) {
        node.children.forEach((child: any) => {
          traverseNode(child);
        });
      }
    };

    if (editorState.root && editorState.root.children) {
      editorState.root.children.forEach((child: any) => {
        traverseNode(child);
      });
    }

    return text.trim();
  } catch {
    return "";
  }
};

/**
 * Get word count from Lexical editor state JSON
 * @param content - The Lexical editor state JSON string
 * @returns The number of words
 */
export const getWordCountFromLexicalContent = (content: string): number => {
  const text = extractTextFromLexicalContent(content);
  return calculateWordCount(text);
};
