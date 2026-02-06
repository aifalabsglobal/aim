import { NextResponse } from "next/server";
import { checkHealth } from "@/lib/ollama";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function GET() {
  try {
    const isHealthy = await checkHealth();
    return NextResponse.json({
      status: isHealthy ? "connected" : "disconnected",
      url: OLLAMA_BASE_URL,
      provider: "ollama",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({
      status: "error",
      message: (err as Error).message,
      url: OLLAMA_BASE_URL,
      provider: "ollama",
    });
  }
}
