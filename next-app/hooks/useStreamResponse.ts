"use client";

import { useState, useRef, useCallback } from "react";
import { fetchEventSource } from "@microsoft/fetch-event-source";

export function useStreamResponse() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const [thinkingContent, setThinkingContent] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [thinkingDuration, setThinkingDuration] = useState<number | null>(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const startStream = useCallback(
    async (params: {
      conversationId: string;
      message: string;
      model?: string;
      options?: Record<string, unknown>;
      attachments?: unknown[];
    }) => {
      setIsStreaming(true);
      setStreamingContent("");
      setThinkingContent("");
      setIsThinking(false);
      setThinkingDuration(null);
      setStreamError(null);
      abortControllerRef.current = new AbortController();

      try {
        await fetchEventSource("/api/chat/stream", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId: params.conversationId,
            message: params.message,
            model: params.model,
            options: params.options ?? {},
            attachments: params.attachments ?? [],
          }),
          signal: abortControllerRef.current.signal,
          onmessage(ev) {
            try {
              const data = JSON.parse(ev.data) as {
                type: string;
                content?: string;
                duration?: number;
                thinking?: string;
                message?: string;
              };
              switch (data.type) {
                case "thinking_start":
                  setIsThinking(true);
                  break;
                case "thinking_chunk":
                  setThinkingContent((prev) => prev + (data.content ?? ""));
                  break;
                case "thinking_end":
                  setIsThinking(false);
                  setThinkingDuration(data.duration ?? null);
                  if (data.thinking) setThinkingContent(data.thinking);
                  break;
                case "content_chunk":
                  setStreamingContent((prev) => prev + (data.content ?? ""));
                  break;
                case "done":
                  setIsStreaming(false);
                  break;
                case "tool_use":
                  /* MCP tool executed; more content may follow */
                  break;
                case "cancelled":
                  setIsStreaming(false);
                  break;
                case "error":
                  setStreamError(data.message ?? "Error");
                  setIsStreaming(false);
                  break;
              }
            } catch {
              // ignore parse errors
            }
          },
          onclose() {
            setIsStreaming(false);
          },
          onerror(err) {
            setStreamError((err as Error).message);
            setIsStreaming(false);
            throw err;
          },
        });
      } catch (err) {
        setStreamError((err as Error).message);
        setIsStreaming(false);
      }
    },
    []
  );

  const stopStream = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsStreaming(false);
    }
  }, []);

  return {
    startStream,
    stopStream,
    isStreaming,
    streamingContent,
    thinkingContent,
    isThinking,
    thinkingDuration,
    streamError,
  };
}
