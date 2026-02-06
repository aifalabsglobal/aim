import { NextRequest, NextResponse } from "next/server";
import { getActiveStreams } from "../stream/route";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { streamId } = body;
    const activeStreams = getActiveStreams();

    if (streamId && activeStreams.has(streamId)) {
      const stream = activeStreams.get(streamId)!;
      stream.abort();
      activeStreams.delete(streamId);
      return NextResponse.json({ success: true, message: "Generation stopped" });
    }
    for (const [, stream] of activeStreams) {
      stream.abort();
    }
    activeStreams.clear();
    return NextResponse.json({ success: true, message: "All generations stopped" });
  } catch (err) {
    console.error("POST /api/chat/stop:", err);
    return NextResponse.json({ error: "Failed to stop" }, { status: 500 });
  }
}
