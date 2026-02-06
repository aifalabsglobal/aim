const OLLAMA_BASE_URL = (process.env.OLLAMA_BASE_URL || "http://localhost:11434").replace(/\/+$/, "");

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

export async function checkHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${OLLAMA_BASE_URL}/api/tags`, { signal: AbortSignal.timeout(5000) });
    return res.status === 200;
  } catch {
    return false;
  }
}

export type StreamChunk = { type: "thinking_chunk"; content: string } | { type: "content_chunk"; content: string };

export async function streamChatCompletion(
  params: {
    model: string;
    messages: { role: string; content: string; images?: string[] }[];
    options?: { temperature?: number; topP?: number; maxTokens?: number };
  },
  onChunk: (chunk: StreamChunk) => void,
  signal?: AbortSignal
): Promise<{ content: string; thinking: string; thinkingDuration: number; stats?: Record<string, unknown> }> {
  const url = `${OLLAMA_BASE_URL}/api/chat`;
  const normalizedModel = normalizeModelName(params.model);
  const body = {
    model: normalizedModel,
    messages: params.messages.map((m) => ({
      role: m.role,
      content: m.content,
      ...(m.images?.length ? { images: m.images } : {}),
    })),
    stream: true,
    options: {
      temperature: params.options?.temperature ?? 0.7,
      top_p: params.options?.topP ?? 1,
      num_predict: params.options?.maxTokens ?? 4096,
    },
  };

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
          message?: { content?: string; thinking?: string };
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
  return { content: fullContent, thinking: thinkingContent, thinkingDuration, stats };
}
