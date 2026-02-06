"use client";

import { useState } from "react";
import { ChevronDown, Brain, Sparkles } from "lucide-react";

export default function ThinkingBlock({
  content,
  duration,
  isStreaming,
}: {
  content: string;
  duration?: number | null;
  isStreaming?: boolean;
}) {
  const [isExpanded, setIsExpanded] = useState(isStreaming ?? false);

  if (!content && !isStreaming) return null;

  return (
    <div className="mb-4 rounded-lg overflow-hidden border border-[var(--border-color)] bg-[var(--bg-thinking)] transition-all">
      <button
        type="button"
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-4 py-2 flex items-center justify-between text-left hover:bg-[var(--bg-hover)] transition-colors group"
      >
        <div className="flex items-center gap-2">
          {isStreaming ? (
            <div className="flex items-center gap-2 text-[var(--text-secondary)]">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span className="text-xs font-medium">Thinking...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[var(--accent-primary)]">
              <Brain className="w-3.5 h-3.5" />
              <span className="text-xs font-medium">
                Thought for {duration != null ? duration.toFixed(1) : "a few"}s
              </span>
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
        />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-out ${isExpanded ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"}`}
      >
        <div className="p-4 text-xs font-mono text-[var(--text-secondary)] leading-relaxed border-t border-[var(--border-color)] bg-[var(--bg-code)]">
          {content || (isStreaming && <span className="animate-pulse">Processing thoughts...</span>)}
        </div>
      </div>
    </div>
  );
}
