import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/ollama";

export async function GET() {
  const baseUrl = (process.env.OLLAMA_BASE_URL || "http://45.198.59.91:11434").replace(/\/+$/, "");
  try {
    const isHealthy = await checkHealth();
    return NextResponse.json({
      status: isHealthy ? "connected" : "disconnected",
      url: baseUrl,
      provider: "ollama",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = (err as Error).message ?? "Connection failed";
    return NextResponse.json({
      status: "error",
      message,
      url: baseUrl,
      provider: "ollama",
      hint: "If on Vercel: set OLLAMA_BASE_URL. On GPU server: OLLAMA_HOST=0.0.0.0, allow port 11434 from internet.",
    });
  }
}
