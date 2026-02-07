import { NextResponse } from "next/server";
import { listMcpToolsAsOllama, getMcpServerConfigs } from "@/lib/mcp";

/**
 * GET /api/mcp/tools
 * Returns MCP tools in Ollama-compatible format for use with tool-calling models (e.g. qwen3).
 * Requires MCP_SERVERS (JSON) or MCP_SERVER_TYPE + MCP_SERVER_COMMAND/ARGS or MCP_SERVER_URL.
 */
export async function GET() {
  const configs = getMcpServerConfigs();
  if (configs.length === 0) {
    return NextResponse.json(
      { tools: [], servers: [], message: "No MCP servers configured. Set MCP_SERVERS or MCP_SERVER_* env." },
      { status: 200 }
    );
  }

  try {
    const { tools, servers } = await listMcpToolsAsOllama();
    return NextResponse.json({ tools, servers });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list MCP tools";
    console.error("GET /api/mcp/tools:", message);
    return NextResponse.json({ error: message, tools: [], servers: [] }, { status: 500 });
  }
}
