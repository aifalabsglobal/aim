/**
 * MCP (Model Context Protocol) client for AIM Intelligence.
 * Connects to MCP servers (stdio or Streamable HTTP), lists tools, and executes them.
 * Tools are converted to Ollama-compatible format for use with tool-calling models (e.g. qwen3).
 */

export type McpServerConfig = {
  type: "stdio" | "http";
  name?: string;
  /** For stdio: executable (e.g. "npx") */
  command?: string;
  /** For stdio: args (e.g. ["-y", "@modelcontextprotocol/server-filesystem"]) */
  args?: string[];
  /** For http: base URL of the MCP Streamable HTTP server */
  url?: string;
};

export type OllamaTool = {
  type: "function";
  function: {
    name: string;
    description: string;
    parameters: { type: "object"; properties?: Record<string, unknown>; required?: string[] };
  };
};

/** Parse MCP server config from env. Supports MCP_SERVERS (JSON) or single MCP_SERVER_* vars. */
export function getMcpServerConfigs(): McpServerConfig[] {
  const json = process.env.MCP_SERVERS;
  if (json) {
    try {
      const arr = JSON.parse(json) as McpServerConfig[];
      return Array.isArray(arr) ? arr.filter((s) => s.type === "stdio" || s.type === "http") : [];
    } catch {
      return [];
    }
  }
  const type = process.env.MCP_SERVER_TYPE as "stdio" | "http" | undefined;
  if (!type || (type !== "stdio" && type !== "http")) return [];
  if (type === "stdio") {
    const command = process.env.MCP_SERVER_COMMAND;
    const argsStr = process.env.MCP_SERVER_ARGS;
    if (!command) return [];
    const args = argsStr ? argsStr.split(",").map((a) => a.trim()).filter(Boolean) : [];
    return [{ type: "stdio", name: "default", command, args }];
  }
  const url = process.env.MCP_SERVER_URL;
  if (!url) return [];
  return [{ type: "http", name: "default", url }];
}

/** Convert MCP tool schema to Ollama tool format. */
export function mcpToolToOllama(tool: { name: string; description?: string; inputSchema?: Record<string, unknown> }): OllamaTool {
  const schema = tool.inputSchema && typeof tool.inputSchema === "object" ? tool.inputSchema : { type: "object" as const, properties: {} };
  const parameters = {
    type: "object" as const,
    properties: (schema.properties as Record<string, unknown>) ?? {},
    required: (schema.required as string[]) ?? [],
  };
  return {
    type: "function",
    function: {
      name: tool.name,
      description: tool.description ?? "",
      parameters,
    },
  };
}

/** List tools from all configured MCP servers and return them in Ollama format. */
export async function listMcpToolsAsOllama(): Promise<{ tools: OllamaTool[]; servers: string[] }> {
  const configs = getMcpServerConfigs();
  if (configs.length === 0) return { tools: [], servers: [] };

  const { Client } = await import("@modelcontextprotocol/sdk/client");
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
  const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

  const allTools: OllamaTool[] = [];
  const serverNames: string[] = [];

  for (const config of configs) {
    const client = new Client({ name: "aim-intelligence", version: "1.0.0" });
    let transport: InstanceType<typeof StdioClientTransport> | InstanceType<typeof StreamableHTTPClientTransport>;

    if (config.type === "stdio" && config.command) {
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args ?? [],
      });
      await transport.start();
    } else if (config.type === "http" && config.url) {
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    } else {
      continue;
    }

    try {
      await client.connect(transport);
      const result = await client.listTools();
      const tools = result?.tools ?? [];
      for (const t of tools) {
        allTools.push(mcpToolToOllama(t));
      }
      serverNames.push(config.name ?? config.type);
    } catch (err) {
      console.error("MCP list tools error:", config.name ?? config.type, err);
    } finally {
      await transport.close();
    }
  }

  return { tools: allTools, servers: serverNames };
}

/** Call a single MCP tool by name. Finds the tool in the first server that has it. */
export async function callMcpTool(
  name: string,
  args: Record<string, unknown>
): Promise<{ text: string; error?: string }> {
  const configs = getMcpServerConfigs();
  if (configs.length === 0) return { text: "", error: "No MCP servers configured" };

  const { Client } = await import("@modelcontextprotocol/sdk/client");
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js");
  const { StreamableHTTPClientTransport } = await import("@modelcontextprotocol/sdk/client/streamableHttp.js");

  for (const config of configs) {
    const client = new Client({ name: "aim-intelligence", version: "1.0.0" });
    let transport: InstanceType<typeof StdioClientTransport> | InstanceType<typeof StreamableHTTPClientTransport>;

    if (config.type === "stdio" && config.command) {
      transport = new StdioClientTransport({
        command: config.command,
        args: config.args ?? [],
      });
      await transport.start();
    } else if (config.type === "http" && config.url) {
      transport = new StreamableHTTPClientTransport(new URL(config.url));
    } else {
      continue;
    }

    try {
      await client.connect(transport);
      const list = await client.listTools();
      const hasTool = list?.tools?.some((t) => t.name === name);
      if (!hasTool) {
        await transport.close();
        continue;
      }
      const result = await client.callTool({ name, arguments: args });
      await transport.close();

      const rawContent = result?.content;
      const content = Array.isArray(rawContent) ? rawContent : [];
      const textParts: string[] = [];
      for (const c of content) {
        if (c && typeof c === "object" && "type" in c && c.type === "text" && "text" in c) {
          textParts.push(String(c.text));
        }
      }
      return { text: textParts.join("\n") };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await transport.close();
      return { text: "", error: msg };
    }
  }

  return { text: "", error: `Tool "${name}" not found on any MCP server` };
}
