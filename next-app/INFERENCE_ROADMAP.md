# Inference Roadmap – Best-in-class with Ollama + MCP

## Goal

Make AIM Intelligence the **best inference experience** by:

1. **MCP (Model Context Protocol)** – Connect to MCP servers so the model can use tools (filesystem, web search, APIs, etc.).
2. **Multiple Ollama models** – Use the right model per task (e.g. qwen3 for tool calling, code models for code, reasoning models for math).
3. **Ollama tool-calling** – When MCP tools are configured, pass them to Ollama and run an agent loop (model requests tool → we execute via MCP → feed result back → model continues).

---

## Implemented (this pass)

### MCP foundation

| Item | Description |
|------|-------------|
| **@modelcontextprotocol/sdk + zod** | Installed in `next-app`. |
| **lib/mcp.ts** | MCP client: `getMcpServerConfigs()`, `listMcpToolsAsOllama()`, `callMcpTool(name, args)`, `mcpToolToOllama()`. Supports **stdio** (spawn process) and **Streamable HTTP** transports. |
| **GET /api/mcp/tools** | Returns `{ tools: OllamaTool[], servers: string[] }` for use with tool-calling models. |
| **Env** | `MCP_SERVERS` (JSON array) or single server: `MCP_SERVER_TYPE` (stdio \| http), `MCP_SERVER_COMMAND`, `MCP_SERVER_ARGS` (comma-sep), `MCP_SERVER_URL`. |
| **Ollama tool-calling in chat** | `lib/ollama.ts`: optional `tools`, stream parsing for `tool_calls`, return `tool_calls`. Chat stream: MCP tools passed to Ollama; agent loop (execute tools via `callMcpTool`, append assistant + tool messages, re-call up to 5×). Assistant/tool message format uses `type: "function"` and `function.index` for Ollama. |
| **Content display** | Prose: justified text, `max-width: 100%`, `overflow-wrap`, responsive padding; message row and list: `min-w-0`, `max-w-full`, break-words so content fits any screen. |
| **Model routing** | When MCP tools are configured, fetch MCP tools with models; if no saved model, prefer first tool-capable model (qwen3, qwen2.5, llama3.2, etc.). ModelSwitcher shows "Tools" badge on tool-capable models and hint: "Use a tool-capable model (e.g. qwen3) for MCP". |
| **MCP in the UI** | Chat header shows "MCP: N tools · K servers" when configured. Settings modal has "MCP Tools" section listing each tool (name + description). Context exposes `mcpInfo: { tools, servers }`. |

### Config examples

**Single stdio server (e.g. filesystem):**

```env
MCP_SERVER_TYPE=stdio
MCP_SERVER_COMMAND=npx
MCP_SERVER_ARGS=-y,@modelcontextprotocol/server-filesystem
```

**Single HTTP server:**

```env
MCP_SERVER_TYPE=http
MCP_SERVER_URL=http://localhost:3001/mcp
```

**Multiple servers (JSON):**

```env
MCP_SERVERS=[{"type":"stdio","name":"fs","command":"npx","args":["-y","@modelcontextprotocol/server-filesystem"]},{"type":"http","name":"search","url":"https://your-mcp-search.example/mcp"}]
```

---

## Next steps (short-term)

- **Optional auto-routing** – Heuristics (e.g. "code" in message → prefer code model; "search" or tools enabled → prefer qwen3). Setting: "Auto model" vs "Manual".
- **Optional tool picker** – Let users attach context from a tool before sending. Advanced.

---

## Medium-term

- **Multiple MCP servers** – Already supported in config; ensure tool names don't clash (prefix by server name if needed).
- **Resources & prompts** – Use MCP `listResources` / `readResource` and `listPrompts` / `getPrompt` to inject context or prompt templates.
- **Caching** – Cache `listMcpToolsAsOllama()` per deployment so we don't spawn/list on every request.
- **Stability** – Timeouts and retries for MCP calls; don't block chat if one server is down.

---

## Longer-term

- **RAG** – Vector store over conversations or uploaded docs; retrieve before calling Ollama.
- **Evaluation** – Simple feedback (thumbs up/down) and logging to tune model choice and prompts.
- **Multi-backend** – Optional OpenAI/Anthropic for comparison or fallback while keeping Ollama + MCP as primary.

---

## References

- [MCP Specification](https://modelcontextprotocol.io)
- [MCP TypeScript SDK](https://www.npmjs.com/package/@modelcontextprotocol/sdk)
- [Ollama Tool Calling](https://docs.ollama.com/capabilities/tool-calling)
- [Ollama Models](https://ollama.com/library) – e.g. qwen3, llama3.2
