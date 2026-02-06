import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const conversations = await prisma.conversation.findMany({
      orderBy: { updatedAt: "desc" },
      select: {
        id: true,
        title: true,
        model: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return NextResponse.json(conversations, {
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  } catch (error) {
    console.error("GET /api/conversations:", error);
    return NextResponse.json({ error: "Failed to fetch conversations" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { title, model } = body;
    const conversation = await prisma.conversation.create({
      data: {
        title: title ?? "New Conversation",
        model: model ?? "glm-4.7-flash",
      },
    });
    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages: [],
    });
  } catch (error) {
    console.error("POST /api/conversations:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }
}
