import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { streamChatCompletion } from "@/lib/ollama";
import { processDocument } from "@/lib/documentProcessor";
import { generateTitle } from "@/lib/helpers";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const activeStreams = new Map<string, { abort: () => void }>();

export async function GET() {
  return NextResponse.json({ error: "Method not allowed. Use POST." }, { status: 405 });
}

function processAttachmentsToBase64(
  attachments: { path?: string; url?: string; mimetype: string; originalName?: string }[]
): string[] {
  const imageTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const images: string[] = [];
  for (const att of attachments) {
    if (!imageTypes.includes(att.mimetype)) continue;
    const relativePath = att.path ?? att.url;
    if (!relativePath) continue;
    const filePath = path.join(process.cwd(), relativePath);
    if (!fs.existsSync(filePath)) continue;
    try {
      const buffer = fs.readFileSync(filePath);
      images.push(buffer.toString("base64"));
    } catch {
      // skip
    }
  }
  return images;
}

export async function POST(request: NextRequest) {
  const streamId = randomUUID();
  const abortController = new AbortController();

  try {
    const body = await request.json();
    const { conversationId, message, model, options, attachments: rawAttachments } = body;
    const attachments = Array.isArray(rawAttachments) ? rawAttachments : [];

    if (!conversationId || !message) {
      return NextResponse.json(
        { error: "conversationId and message are required" },
        { status: 400 }
      );
    }

    const conversation = await prisma.conversation.findUnique({
      where: { id: conversationId },
      include: { messages: { orderBy: { createdAt: "asc" } } },
    });
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const userMessageId = randomUUID();
    try {
      await prisma.message.create({
        data: {
          id: userMessageId,
          conversationId,
          role: "user",
          content: message,
        },
      });
    } catch (err: unknown) {
      const prismaErr = err as { code?: string };
      if (prismaErr?.code === "P2003") {
        return NextResponse.json(
          { error: "Conversation no longer exists. Please start a new chat.", code: "CONVERSATION_GONE" },
          { status: 404 }
        );
      }
      throw err;
    }

    if (attachments.length > 0) {
      for (const att of attachments) {
        await prisma.attachment.create({
          data: {
            messageId: userMessageId,
            filename: att.filename ?? att.originalName ?? "file",
            originalName: att.originalName ?? att.filename ?? "file",
            mimetype: att.mimetype ?? "application/octet-stream",
            size: att.size ?? 0,
            path: att.path ?? att.url ?? "",
          },
        });
      }
    }

    if (conversation.messages.length === 0) {
      const title = generateTitle(message);
      await prisma.conversation.update({
        where: { id: conversationId },
        data: { title, model: model ?? "glm-4.7-flash" },
      });
    }

    const attachmentImages = processAttachmentsToBase64(attachments);
    let extractedTexts: string[] = [];
    for (const att of attachments) {
      const processed = await processDocument(att);
      if (processed?.content) {
        extractedTexts.push(`--- FILE: ${processed.filename} ---\n${processed.content}`);
      }
    }
    const combinedMessage =
      extractedTexts.length > 0
        ? `${message}\n\n---\n📎 Attached Document Content:\n\n${extractedTexts.join("\n\n")}`
        : message;

    const messageHistory = [
      ...(options?.systemPrompt ? [{ role: "system" as const, content: options.systemPrompt }] : []),
      ...conversation.messages.map((m) => ({ role: m.role as "user" | "assistant" | "system", content: m.content })),
      {
        role: "user" as const,
        content: combinedMessage,
        ...(attachmentImages.length > 0 ? { images: attachmentImages } : {}),
      },
    ];

    const assistantMessageId = randomUUID();
    activeStreams.set(streamId, { abort: () => abortController.abort() });

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const send = (obj: object) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
        };
        try {
          send({ type: "start", messageId: assistantMessageId, streamId });

          let thinkingStarted = false;
          let thinkingEnded = false;
          let fullThinking = "";

          const result = await streamChatCompletion(
            {
              model: model ?? conversation.model ?? "glm-4.7-flash",
              messages: messageHistory,
              options: {
                temperature: options?.temperature ?? 0.7,
                topP: options?.topP ?? 1,
                maxTokens: options?.maxTokens ?? 4096,
              },
            },
            (chunk) => {
              if (chunk.type === "thinking_chunk") {
                if (!thinkingStarted) {
                  thinkingStarted = true;
                  send({ type: "thinking_start" });
                }
                fullThinking += chunk.content;
                send({ type: "thinking_chunk", content: chunk.content });
              } else if (chunk.type === "content_chunk") {
                if (thinkingStarted && !thinkingEnded) {
                  thinkingEnded = true;
                  send({ type: "thinking_end", thinking: fullThinking, duration: 0 });
                }
                if (!thinkingStarted) thinkingEnded = true;
                send({ type: "content_chunk", content: chunk.content });
              }
            },
            abortController.signal
          );

          if (thinkingStarted && !thinkingEnded) {
            send({ type: "thinking_end", thinking: fullThinking, duration: result.thinkingDuration ?? 0 });
          }
          send({ type: "done", stats: result.stats });

          try {
            await prisma.message.create({
              data: {
                id: assistantMessageId,
                conversationId,
                role: "assistant",
                content: result.content,
                thinking: result.thinking || null,
                thinkingDuration: result.thinkingDuration ?? null,
              },
            });
          } catch (saveErr: unknown) {
            const prismaErr = saveErr as { code?: string };
            if (prismaErr?.code === "P2003") {
              send({ type: "error", message: "Conversation no longer exists. Start a new chat." });
            } else {
              throw saveErr;
            }
          }
        } catch (err) {
          const msg = (err as Error).message;
          if (msg === "Generation cancelled" || msg.includes("abort")) {
            send({ type: "cancelled" });
          } else {
            send({ type: "error", message: msg || "Failed to generate response" });
          }
        } finally {
          activeStreams.delete(streamId);
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    activeStreams.delete(streamId);
    console.error("POST /api/chat/stream:", err);
    return NextResponse.json(
      { error: (err as Error).message ?? "Stream failed" },
      { status: 500 }
    );
  }
}

export function getActiveStreams() {
  return activeStreams;
}
