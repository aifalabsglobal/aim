"use client";

import { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useStreamResponse } from "@/hooks/useStreamResponse";
import { api } from "@/lib/api";

type Message = {
  id: string;
  role: string;
  content: string;
  thinking?: string | null;
  thinking_duration?: number | null;
  attachments?: { id: string; originalName: string }[];
  isStreaming?: boolean;
};

type Conversation = {
  id: string;
  title: string | null;
  model: string | null;
  createdAt: string;
  updatedAt: string;
};

type Settings = { temperature: number; topP: number; maxTokens: number; systemPrompt: string };

const defaultSettings: Settings = {
  temperature: 0.7,
  topP: 1,
  maxTokens: 4096,
  systemPrompt: "",
};

const ChatContext = createContext<{
  conversations: Conversation[];
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  currentModel: string | null;
  setCurrentModel: (name: string) => void;
  availableModels: { name: string; displayName?: string; id?: string }[];
  gpuStatus: string;
  messages: Message[];
  setMessages: (m: Message[] | ((prev: Message[]) => Message[])) => void;
  sendMessage: (content: string, attachments?: unknown[]) => Promise<void>;
  createNewChat: () => Promise<string | null>;
  deleteConversation: (id: string) => Promise<void>;
  isLoading: boolean;
  isStreaming: boolean;
  stopStream: () => void;
  streamingContent: string;
  thinkingContent: string;
  isThinking: boolean;
  thinkingDuration: number | null;
  settings: Settings;
  updateSettings: (s: Partial<Settings>) => void;
  error: string | null;
  streamError: string | null;
  refreshModels: () => Promise<void>;
  refreshConversations: () => Promise<void>;
} | null>(null);

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider");
  return ctx;
}

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null);
  const [currentModel, setCurrentModel] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<{ name: string; displayName?: string; id?: string }[]>([]);
  const [gpuStatus, setGpuStatus] = useState("checking");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const currentConversationIdRef = useRef<string | null>(null);
  currentConversationIdRef.current = currentConversationId;

  // Hydration-safe: restore from localStorage only after mount (avoids server/client mismatch)
  useEffect(() => {
    const savedModel = localStorage.getItem("selectedModel");
    if (savedModel) setCurrentModel(savedModel);
    const savedSettings = localStorage.getItem("ai-settings");
    if (savedSettings) {
      try {
        setSettings((prev) => ({ ...defaultSettings, ...prev, ...JSON.parse(savedSettings) }));
      } catch {
        // ignore
      }
    }
  }, []);

  const streamResponse = useStreamResponse();
  const {
    startStream,
    stopStream,
    isStreaming,
    streamingContent,
    thinkingContent,
    isThinking,
    thinkingDuration,
  } = streamResponse;
  const streamError = streamResponse.streamError ?? null;

  useEffect(() => {
    localStorage.setItem("ai-settings", JSON.stringify(settings));
  }, [settings]);

  const updateSettings = useCallback((s: Partial<Settings>) => {
    setSettings((prev) => ({ ...prev, ...s }));
  }, []);

  const fetchModels = useCallback(async () => {
    try {
      const data = await api.getModels();
      const models = Array.isArray(data?.models) ? data.models : [];
      setAvailableModels(models);
      const saved = typeof window !== "undefined" ? localStorage.getItem("selectedModel") : null;
      if (saved && models.some((m: { name: string }) => m.name === saved)) {
        setCurrentModel(saved);
      } else if (data.defaultModel && models.some((m: { name: string }) => m.name === data.defaultModel)) {
        setCurrentModel(data.defaultModel);
      } else if (models.length > 0 && !currentModel) {
        setCurrentModel(models[0].name);
      }
    } catch {
      setAvailableModels([]);
    }
  }, [currentModel]);

  const checkGPUStatus = useCallback(async () => {
    try {
      const data = await api.getGPUStatus();
      setGpuStatus(data.status ?? "disconnected");
    } catch {
      setGpuStatus("disconnected");
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getConversations();
      const list = Array.isArray(data) ? data : (data && typeof data === "object" && "conversations" in data && Array.isArray((data as { conversations: unknown[] }).conversations) ? (data as { conversations: Conversation[] }).conversations : []);
      setConversations(list);
    } catch {
      setError("Failed to load conversations");
      setConversations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await api.getConversation(id);
      // Only apply if this conversation is still selected (avoid stale response overwriting)
      if (currentConversationIdRef.current !== id) return;
      const raw = Array.isArray(data?.messages) ? data.messages : [];
      const normalized: Message[] = raw.map((m: { id: string; role: string; content: string; thinking?: string | null; thinkingDuration?: number | null; thinking_duration?: number | null; attachments?: { id: string; originalName?: string }[] }) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        thinking: m.thinking ?? null,
        thinking_duration: m.thinking_duration ?? m.thinkingDuration ?? null,
        attachments: Array.isArray(m.attachments) ? m.attachments.map((a) => ({ id: a.id, originalName: a.originalName ?? "file" })) : undefined,
        isStreaming: false,
      }));
      setMessages(normalized);
    } catch {
      if (currentConversationIdRef.current !== id) return;
      setError("Failed to load messages");
      setMessages([]);
    } finally {
      if (currentConversationIdRef.current === id) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchModels();
    checkGPUStatus();
    const t = setInterval(checkGPUStatus, 30000);
    return () => clearInterval(t);
  }, [fetchModels, checkGPUStatus]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    if (currentConversationId) {
      setMessages([]);
      loadMessages(currentConversationId);
    } else {
      setMessages([]);
    }
  }, [currentConversationId, loadMessages]);

  const createNewChat = useCallback(async () => {
    try {
      const data = await api.createConversation({ model: currentModel ?? undefined });
      setConversations((prev) => [data, ...prev]);
      setCurrentConversationId(data.id);
      setMessages([]);
      return data.id;
    } catch {
      return null;
    }
  }, [currentModel]);

  const sendMessage = useCallback(
    async (content: string, attachments: unknown[] = []) => {
      let convId = currentConversationId;
      if (!convId) {
        convId = await createNewChat();
        if (!convId) return;
      }
      const userMessage: Message = {
        id: `temp-${Date.now()}`,
        role: "user",
        content,
        attachments: (attachments as { id?: string; originalName?: string }[]).map((a, i) => ({
          id: a.id ?? String(i),
          originalName: a.originalName ?? "file",
        })),
      };
      setMessages((prev) => [...prev, userMessage]);
      try {
        await startStream({
          conversationId: convId,
          message: content,
          model: currentModel ?? undefined,
          options: settings,
          attachments: attachments as { path?: string; url?: string; mimetype: string; originalName?: string; filename?: string; size?: number }[],
        });
      } catch (err) {
        setError((err as Error).message);
      }
    },
    [currentConversationId, currentModel, settings, createNewChat, startStream]
  );

  useEffect(() => {
    if (!isStreaming && currentConversationId && messages.length > 0) {
      loadMessages(currentConversationId);
      fetchConversations();
    }
  }, [isStreaming]); // eslint-disable-line react-hooks/exhaustive-deps

  const deleteConversation = useCallback(async (id: string) => {
    try {
      await api.deleteConversation(id);
      setConversations((prev) => prev.filter((c) => c.id !== id));
      if (currentConversationId === id) {
        setCurrentConversationId(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  }, [currentConversationId]);

  const selectModel = useCallback((name: string) => {
    setCurrentModel(name);
    if (typeof window !== "undefined") localStorage.setItem("selectedModel", name);
  }, []);

  return (
    <ChatContext.Provider
      value={{
        conversations,
        currentConversationId,
        setCurrentConversationId,
        currentModel,
        setCurrentModel: selectModel,
        availableModels,
        gpuStatus,
        messages,
        setMessages,
        sendMessage,
        createNewChat,
        deleteConversation,
        isLoading,
        isStreaming,
        stopStream,
        streamingContent,
        thinkingContent,
        isThinking,
        thinkingDuration,
        settings,
        updateSettings,
        error,
        streamError,
        refreshModels: fetchModels,
        refreshConversations: fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}
