import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
      },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    const messages = conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      thinking: m.thinking,
      thinkingDuration: m.thinkingDuration,
      createdAt: m.createdAt,
      attachments: m.attachments.map((a) => ({
        id: a.id,
        messageId: a.messageId,
        filename: a.filename,
        originalName: a.originalName,
        mimetype: a.mimetype,
        size: a.size,
        path: a.path,
        createdAt: a.createdAt,
      })),
    }));
    return NextResponse.json(
      {
        id: conversation.id,
        title: conversation.title,
        model: conversation.model,
        createdAt: conversation.createdAt,
        updatedAt: conversation.updatedAt,
        messages,
      },
      { headers: { "Cache-Control": "no-store, no-cache, must-revalidate" } }
    );
  } catch (error) {
    console.error("GET /api/conversations/[id]:", error);
    return NextResponse.json({ error: "Failed to fetch conversation" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const body = await request.json().catch(() => ({}));
    const { title, model } = body;
    const data: { title?: string; model?: string } = {};
    if (title !== undefined) data.title = title;
    if (model !== undefined) data.model = model;
    const conversation = await prisma.conversation.update({
      where: { id },
      data,
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
          include: { attachments: true },
        },
      },
    });
    const messages = conversation.messages.map((m) => ({
      id: m.id,
      conversationId: m.conversationId,
      role: m.role,
      content: m.content,
      thinking: m.thinking,
      thinkingDuration: m.thinkingDuration,
      createdAt: m.createdAt,
      attachments: m.attachments,
    }));
    return NextResponse.json({
      id: conversation.id,
      title: conversation.title,
      model: conversation.model,
      createdAt: conversation.createdAt,
      updatedAt: conversation.updatedAt,
      messages,
    });
  } catch (error) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    console.error("PUT /api/conversations/[id]:", error);
    return NextResponse.json({ error: "Failed to update conversation" }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    await prisma.conversation.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Conversation deleted" });
  } catch (error) {
    const e = error as { code?: string };
    if (e.code === "P2025") {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }
    console.error("DELETE /api/conversations/[id]:", error);
    return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 });
  }
}
