import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  const { id: conversationId, messageId } = await params;
  try {
    const message = await prisma.message.findFirst({
      where: { id: messageId, conversationId },
    });
    if (!message) {
      return NextResponse.json({ error: "Message not found" }, { status: 404 });
    }
    await prisma.message.delete({ where: { id: messageId } });
    return NextResponse.json({ success: true, message: "Message deleted" });
  } catch (error) {
    console.error("DELETE /api/conversations/[id]/messages/[messageId]:", error);
    return NextResponse.json({ error: "Failed to delete message" }, { status: 500 });
  }
}
