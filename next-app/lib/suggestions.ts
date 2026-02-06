/**
 * Default suggestion prompts for the empty chat state.
 * Replace or extend this list; can later be loaded from API.
 */
export type SuggestionItem = {
  text: string;
  type: string;
  iconId?: string;
};

export const DEFAULT_SUGGESTIONS: SuggestionItem[] = [
  { text: "Help me check my React state logic", type: "tech", iconId: "code" },
  { text: "Explain how quantum computing works", type: "science", iconId: "lightbulb" },
  { text: "Draft an email for a client meeting", type: "writing", iconId: "mail" },
  { text: "Summarize this document in bullet points", type: "writing", iconId: "file" },
  { text: "Debug this Python function", type: "tech", iconId: "code" },
  { text: "Compare two options and give pros/cons", type: "analysis", iconId: "lightbulb" },
];
