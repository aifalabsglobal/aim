const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://45.198.59.91:11434").replace(/\/+$/, "");

function normalizeModelName(modelName: string | null | undefined): string {
  if (!modelName) return "glm-4.7-flash:latest";
  if (!modelName.includes(":")) return `${modelName}:latest`;
  return modelName;
}

export async function getModels(): Promise<
  { name: string; displayName: string; size?: number; modifiedAt?: string; details?: Record<string, unknown> }[]
> {
  const url = `${OLLAMA_BASE_URL}/api/tags`;
  const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Ollama connection failed: ${res.status}`);
  const data = (await res.json()) as { models?: { name: string; size?: number; modified_at?: string; details?: Record<string, unknown> }[] };
  if (!data?.models) return [];
  return data.models.map((m) => ({
    name: m.name,
    displayName: m.name.split(":")[0],
    size: m.size,
    modifiedAt: m.modified_at,
    details: m.details || {},
  }));
}

const HEALTH_TIMEOUT_MS = Number(process.env.OLLAMA_HEALTH_TIMEOUT_MS) || 15000;

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(HEALTH_TIMEOUT_MS) });
    if (res.status !== 200) {
      const text = await res.text();
      throw new Error(`Ollama returned ${res.status}${text ? `: ${text.slice(0, 100)}` : ""}`);
    }
    return true;
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Connection failed";
    if (msg.includes("fetch failed") || msg.includes("ECONNREFUSED") || msg.includes("ENOTFOUND") || msg.includes("timeout") || msg.includes("Failed to fetch")) {
      throw new Error(`Cannot reach Ollama at ${OLLAMA_BASE_URL}. ${msg}`);
    }
    throw e;
  }
}

export type StreamChunk =
  | { type: "thinking_chunk"; content: string }
  | { type: "content_chunk"; content: string }
  | { type: "tool_calls"; tool_calls: OllamaToolCall[] };

export type OllamaTool = {
  type: "function";
  function: { name: string; description: string; parameters: { type: "object"; properties?: Record<string, unknown>; required?: string[] } };
};

export type OllamaToolCall = {
  function: { name: string; arguments?: Record<string, unknown> };
};

type ChatMessage = {
  role: string;
  content: string;
  images?: string[];
  tool_calls?: OllamaToolCall[];
};
type ToolMessage = { role: "tool"; tool_name: string; content: string };

export async function streamChatCompletion(
  params: {
    model: string;
    messages: (ChatMessage | ToolMessage)[];
    options?: { temperature?: number; topP?: number; maxTokens?: number };
    tools?: OllamaTool[];
  },
  onChunk: (chunk: StreamChunk) => void,
  signal?: AbortSignal
): Promise<{
  content: string;
  thinking: string;
  thinkingDuration: number;
  stats?: Record<string, unknown>;
  tool_calls?: OllamaToolCall[];
}> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const normalizedModel = normalizeModelName(params.model);
  const body: Record<string, unknown> = {
    model: normalizedModel,
    messages: params.messages.map((m) => {
      if (m.role === "tool") {
        return { role: "tool", tool_name: (m as ToolMessage).tool_name, content: (m as ToolMessage).content };
      }
      const msg = m as ChatMessage;
      const toolCalls = msg.tool_calls?.length
        ? msg.tool_calls.map((tc, i) => ({
            type: "function" as const,
            function: { index: i, name: tc.function.name, arguments: tc.function.arguments },
          }))
        : undefined;
      return {
        role: msg.role,
        content: msg.content,
        ...(msg.images?.length ? { images: msg.images } : {}),
        ...(toolCalls?.length ? { tool_calls: toolCalls } : {}),
      };
    }),
    stream: true,
    options: {
      temperature: params.options?.temperature ?? 0.7,
      top_p: params.options?.topP ?? 1,
      num_predict: params.options?.maxTokens ?? 4096,
    },
  };
  if (params.tools?.length) body.tools = params.tools;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: signal ?? AbortSignal.timeout(300000),
  });

  if (!res.ok) {
    let detail = res.statusText;
    try {
      const errBody = (await res.json()) as { error?: string };
      if (errBody?.error) detail = errBody.error;
    } catch {
      // use statusText
    }
    throw new Error(`Ollama (${url}): ${res.status} ${detail}`);
  }
  if (!res.body) throw new Error(`Ollama (${url}): no response body`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let fullContent = "";
  let thinkingContent = "";
  let stats: Record<string, unknown> = {};
  const toolCallsAcc: OllamaToolCall[] = [];

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const data = JSON.parse(line) as {
          error?: string;
          message?: {
            content?: string;
            thinking?: string;
            tool_calls?: { function?: { name?: string; arguments?: Record<string, unknown> } }[];
          };
          response?: string;
          done?: boolean;
          total_duration?: number;
          prompt_eval_duration?: number;
        };
        if (data.error) throw new Error(data.error);
        if (data.message) {
          if (data.message.thinking) {
            thinkingContent += data.message.thinking;
            onChunk({ type: "thinking_chunk", content: data.message.thinking });
          }
          const content = data.message.content ?? data.response ?? "";
          if (content) {
            fullContent += content;
            onChunk({ type: "content_chunk", content });
          }
          if (data.message.tool_calls?.length) {
            toolCallsAcc.length = 0;
            for (const tc of data.message.tool_calls) {
              if (tc?.function?.name)
                toolCallsAcc.push({
                  function: { name: tc.function.name, arguments: tc.function.arguments ?? {} },
                });
            }
            if (toolCallsAcc.length) onChunk({ type: "tool_calls", tool_calls: [...toolCallsAcc] });
          }
        } else if (data.response) {
          fullContent += data.response;
          onChunk({ type: "content_chunk", content: data.response });
        }
        if (data.done && data.prompt_eval_duration != null) {
          stats = { totalDuration: data.total_duration, promptEvalDuration: data.prompt_eval_duration };
        }
      } catch (e) {
        if ((e as Error).message?.includes("Ollama") || (e as Error).message?.includes("error")) throw e;
      }
    }
  }

  const thinkingDuration = (stats.promptEvalDuration as number) ? (stats.promptEvalDuration as number) / 1e9 : 0;
  return {
    content: fullContent,
    thinking: thinkingContent,
    thinkingDuration,
    stats,
    ...(toolCallsAcc.length ? { tool_calls: toolCallsAcc } : {}),
  };
}
