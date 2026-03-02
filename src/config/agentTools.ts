export interface AgentTool {
  name: string;
  description: string;
  parameters: {
    type: "object";
    properties: Record<string, {
      type: string;
      description: string;
    }>;
    required: string[];
  };
}

export const AGENT_TOOLS: AgentTool[] = [
  {
    name: "analyze_emotions",
    description: "Analyze the emotional intensity and arc of the chapter content. Returns emotion scores for each paragraph.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The chapter text to analyze"
        }
      },
      required: ["content"]
    }
  },
  {
    name: "simulate_reader",
    description: "Simulate a first-time reader experiencing the chapter. Identifies confusion points, questions, and engagement issues.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The chapter text to analyze"
        }
      },
      required: ["content"]
    }
  },
  {
    name: "extract_story_bible",
    description: "Extract and catalog characters, locations, timeline events, and key facts from the chapter.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The chapter text to analyze"
        }
      },
      required: ["content"]
    }
  },
  {
    name: "generate_branches",
    description: "Generate alternate versions of selected text with different approaches (more emotional, more action, more description, etc).",
    parameters: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "The text to create alternatives for"
        },
        count: {
          type: "number",
          description: "Number of alternatives to generate (1-3)"
        }
      },
      required: ["text"]
    }
  },
  {
    name: "critique_prose",
    description: "Analyze writing style, clarity, pacing, and prose quality. Provides specific improvement suggestions.",
    parameters: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description: "The text to critique"
        },
        focus: {
          type: "string",
          description: "Optional focus area: 'clarity', 'pacing', 'style', or 'all'"
        }
      },
      required: ["content"]
    }
  }
];
