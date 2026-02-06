import { NextResponse } from "next/server";
import { getModels } from "@/lib/ollama";

const OLLAMA_BASE_URL = process.env.OLLAMA_BASE_URL || "http://localhost:11434";

export async function GET() {
  try {
    const models = await getModels();
    const enhanced = models.map((m) => ({
      ...m,
      id: m.name,
      provider: "ollama",
      isDefault: m.name.includes("glm-4.7-flash"),
    }));
    return NextResponse.json({
      models: enhanced,
      defaultModel: enhanced.find((m) => m.isDefault)?.name ?? models[0]?.name ?? "glm-4.7-flash",
      source: OLLAMA_BASE_URL,
    });
  } catch (err) {
    console.error("GET /api/models:", err);
    return NextResponse.json({
      models: [
        {
          id: "glm-4.7-flash",
          name: "glm-4.7-flash",
          displayName: "GLM-4.7 Flash",
          provider: "ollama",
          isDefault: true,
          offline: true,
        },
      ],
      defaultModel: "glm-4.7-flash",
      source: OLLAMA_BASE_URL,
      error: (err as Error).message,
    });
  }
}
