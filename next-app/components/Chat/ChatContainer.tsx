"use client";

import { useRef, useEffect, useState } from "react";
import { useChatContext } from "@/context/ChatContext";
import MessageItem from "./MessageItem";
import InputArea from "./InputArea";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ThemeToggle from "@/components/Common/ThemeToggle";
import { ArrowDown, Sparkles, Code2, Mail, Lightbulb, PanelLeftOpen, FileText } from "lucide-react";
import { DEFAULT_SUGGESTIONS, type SuggestionItem } from "@/lib/suggestions";

const SUGGESTION_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  code: Code2,
  lightbulb: Lightbulb,
  mail: Mail,
  file: FileText,
};

function getSuggestionIcon(iconId?: string) {
  return SUGGESTION_ICONS[iconId ?? ""] ?? Lightbulb;
}

export default function ChatContainer({
  sidebarToggle,
  isSidebarOpen = false,
  suggestions: suggestionsProp,
}: {
  sidebarToggle?: () => void;
  isSidebarOpen?: boolean;
  suggestions?: SuggestionItem[];
} = {}) {
  const suggestions = suggestionsProp ?? DEFAULT_SUGGESTIONS;
  const {
    messages,
    sendMessage,
    stopStream,
    isStreaming,
    streamingContent,
    thinkingContent,
    thinkingDuration,
    isThinking,
    currentConversationId,
    isLoading,
    error,
    streamError,
    refreshConversations,
    gpuStatus,
    gpuStatusMessage,
  } = useChatContext();

  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [userAutoScroll, setUserAutoScroll] = useState(true);

  const messagesList = Array.isArray(messages) ? messages : [];
  const displayMessages = [...messagesList];
  if (isStreaming) {
    displayMessages.push({
      id: "streaming-temp",
      role: "assistant",
      content: streamingContent,
      thinking: thinkingContent,
      thinking_duration: thinkingDuration ?? undefined,
      isStreaming: true,
    });
  }

  useEffect(() => {
    if (bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto" });
      setUserAutoScroll(true);
      setShowScrollButton(false);
    }
  }, [currentConversationId]);

  useEffect(() => {
    const lastMsg = messagesList[messagesList.length - 1];
    if (lastMsg?.role === "user") {
      setUserAutoScroll(true);
      setShowScrollButton(false);
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesList.length]);

  useEffect(() => {
    if (userAutoScroll && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: "auto", block: "end" });
      if (showScrollButton) setShowScrollButton(false);
    }
  }, [messages, streamingContent, thinkingContent, isThinking]);

  const handleScroll = () => {
    if (scrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 250;
      if (isNearBottom !== userAutoScroll) setUserAutoScroll(isNearBottom);
      if (!isNearBottom !== showScrollButton) setShowScrollButton(!isNearBottom);
    }
  };

  const toBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setUserAutoScroll(true);
    setShowScrollButton(false);
  };

  return (
    <div className="chat-window relative flex-1 flex flex-col h-full overflow-hidden bg-[var(--bg-primary)]">
      {/* Immersive background gradient */}
      <div className="chat-window-bg pointer-events-none absolute inset-0 bg-gradient-to-b from-[var(--bg-secondary)]/40 via-transparent to-[var(--bg-primary)]" aria-hidden />

      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="relative flex-1 overflow-y-auto scrollbar-thin flex flex-col min-h-0"
      >
        {/* Sticky header: same place as messages scroll, easy navigation */}
        <header className="sticky top-0 z-10 flex items-center px-4 py-3 h-[56px] bg-[var(--bg-primary)]/95 backdrop-blur-sm border-b border-[var(--border-color)]/50 shrink-0">
          <div className="absolute left-4 flex items-center gap-2">
            {sidebarToggle && !isSidebarOpen && (
              <button
                type="button"
                onClick={sidebarToggle}
                className="p-2 rounded-lg hover:bg-[var(--bg-hover)] text-[var(--text-secondary)] transition-colors"
                aria-label="Open sidebar"
              >
                <PanelLeftOpen className="w-5 h-5" />
              </button>
            )}
          </div>
          <div className="w-full flex justify-center pointer-events-none">
            {!isSidebarOpen && (
              <span className="font-serif font-bold text-lg text-[var(--text-primary)] tracking-tight">AIM Intelligence</span>
            )}
          </div>
          <div className="absolute right-4 flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

      {(error || streamError) && (
        <div className="relative flex items-center justify-between gap-3 px-4 py-2.5 bg-rose-500/10 border-b border-rose-500/20 text-[var(--text-primary)] text-sm shrink-0">
          <span>{error || streamError}</span>
          <button type="button" onClick={() => refreshConversations()} className="px-3 py-1.5 rounded-md bg-rose-500/20 hover:bg-rose-500/30 text-sm font-medium">
            Retry
          </button>
        </div>
      )}

      {gpuStatus !== "connected" && gpuStatus !== "checking" && (
        <div className="relative flex items-center gap-3 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/20 text-[var(--text-primary)] text-sm shrink-0">
          <span className="font-medium">Ollama offline.</span>
          <span className="text-[var(--text-muted)] truncate flex-1 min-w-0">{gpuStatusMessage ?? "Cannot reach Ollama. Set OLLAMA_BASE_URL and ensure the server is reachable."}</span>
        </div>
      )}

      {displayMessages.length > 0 && isStreaming && (
        <div className="relative flex items-center gap-2 px-4 py-1.5 border-b border-[var(--border-color)]/50 bg-[var(--bg-secondary)]/50 shrink-0">
          <Badge variant="default" className="gap-1">
            <Sparkles className="w-3 h-3" />
            AI is thinking…
          </Badge>
        </div>
      )}

      <div className="flex-1 min-h-0 pb-36 md:pb-40 px-2">
        {displayMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center px-4 py-16 max-w-3xl mx-auto">
            {currentConversationId && isLoading ? (
              <Card className="w-full max-w-md border-[var(--border-color)] bg-[var(--bg-primary)]/80">
                <CardContent className="flex items-center justify-center py-12">
                  <p className="text-[var(--text-muted)] text-sm flex items-center gap-2">
                    <Sparkles className="w-4 h-4 animate-pulse" />
                    Loading messages…
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="w-full max-w-2xl space-y-10">
                <div className="text-center space-y-2">
                  <h1 className="text-3xl md:text-4xl font-serif font-medium text-[var(--text-primary)] leading-tight tracking-tight">
                    Experience Aim Intelligence
                  </h1>
                  <p className="text-[var(--text-secondary)] text-base">
                    Ask anything. Get answers with tables, diagrams, and clear structure.
                  </p>
                </div>
                <div className="max-w-3xl mx-auto">
                  <InputArea
                    onSend={sendMessage}
                    onStop={stopStream}
                    isStreaming={isStreaming}
                    disabled={isStreaming && !streamingContent && !isThinking}
                  />
                </div>
                <div className="hidden sm:block">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {suggestions.map((s, idx) => {
                    const Icon = getSuggestionIcon(s.iconId);
                    return (
                      <Card
                        key={s.text + idx}
                        className="cursor-pointer border-[var(--border-color)] bg-[var(--bg-primary)] shadow-sm transition-all hover:shadow-md hover:border-[var(--border-hover)] hover:bg-[var(--bg-secondary)]/50"
                      >
                        <button type="button" onClick={() => sendMessage(s.text)} className="w-full text-left h-full block">
                          <CardHeader className="pb-2">
                            <div className="flex items-center gap-2">
                              <div className="p-2 rounded-lg bg-[var(--accent-primary)]/10 text-[var(--accent-primary)]">
                                <Icon className="w-4 h-4" />
                              </div>
                              <Badge variant="secondary" className="text-[10px] capitalize">
                                {s.type}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <span className="text-sm font-medium text-[var(--text-primary)] leading-snug line-clamp-2">
                              {s.text}
                            </span>
                          </CardContent>
                        </button>
                      </Card>
                    );
                  })}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-8 max-w-3xl mx-auto w-full py-4">
            {displayMessages.map((msg) => (
              <MessageItem
                key={msg.id}
                message={msg}
                onDelete={() => {}}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}
        <div ref={bottomRef} className="h-4" />
      </div>
      </div>

      {showScrollButton && (
        <button
          type="button"
          onClick={toBottom}
          className="absolute bottom-36 left-1/2 -translate-x-1/2 p-2.5 rounded-full bg-[var(--bg-primary)] border border-[var(--border-color)] shadow-lg hover:bg-[var(--bg-hover)] transition-all z-10"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4 text-[var(--text-primary)]" />
        </button>
      )}

      {displayMessages.length > 0 && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-[var(--bg-primary)] via-[var(--bg-primary)] to-transparent pt-8 pb-6 px-4">
          <div className="max-w-3xl mx-auto">
            <InputArea
              onSend={sendMessage}
              onStop={stopStream}
              isStreaming={isStreaming}
              disabled={isStreaming && !streamingContent && !isThinking}
            />
            <div className="text-center mt-3">
              <p className="text-[11px] text-[var(--text-muted)]">
                Worlds best inference model from AIM Research Labs
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
