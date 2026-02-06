import { NextRequest, NextResponse } from "next/server";

/** Base URL of a local Whisper service (e.g. http://localhost:9000). No OpenAI. */
const WHISPER_BASE_URL = process.env.WHISPER_BASE_URL?.replace(/\/+$/, "");
const MAX_SIZE = 25 * 1024 * 1024; // 25MB

export async function POST(request: NextRequest) {
  if (!WHISPER_BASE_URL) {
    return NextResponse.json(
      { error: "Voice transcription not configured. Set WHISPER_BASE_URL to a local Whisper service." },
      { status: 503 }
    );
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No audio file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "Audio file too large (max 25MB)" }, { status: 400 });
    }

    const body = new FormData();
    body.append("file", file);
    const lang = formData.get("language");
    if (lang && typeof lang === "string") body.append("language", lang);

    const url = `${WHISPER_BASE_URL}/transcribe`;
    const res = await fetch(url, {
      method: "POST",
      body,
      signal: AbortSignal.timeout(60000),
    });

    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      return NextResponse.json({ error: err?.error ?? res.statusText }, { status: res.status });
    }

    const data = (await res.json()) as { text?: string };
    const text = typeof data?.text === "string" ? data.text.trim() : "";
    return NextResponse.json({ text });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Transcription failed";
    console.error("POST /api/transcribe:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Optional: allow clients to check if Whisper is configured without sending audio. */
export async function GET() {
  if (!WHISPER_BASE_URL) {
    return NextResponse.json({ configured: false }, { status: 503 });
  }
  return NextResponse.json({ configured: true, baseUrl: WHISPER_BASE_URL });
}
