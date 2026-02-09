import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import IORedis from "ioredis";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const RATE_LIMIT_KEY = "elevenlabs:voice-preview:rate";
const MAX_REQUESTS_PER_MINUTE = 10;
const DEFAULT_PREVIEW_TEXT =
  "Welcome to AI Digest, your daily briefing on artificial intelligence news and breakthroughs.";

const previewSchema = z.object({
  voiceId: z.string().min(1),
  text: z.string().max(500).optional(),
  settings: z
    .object({
      stability: z.number().min(0).max(1).optional(),
      similarityBoost: z.number().min(0).max(1).optional(),
      style: z.number().min(0).max(1).optional(),
      speed: z.number().min(0.5).max(2).optional(),
    })
    .optional(),
});

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  const redis = new IORedis(REDIS_URL);

  try {
    // Rate limiting
    const count = await redis.incr(RATE_LIMIT_KEY);
    if (count === 1) {
      await redis.expire(RATE_LIMIT_KEY, 60);
    }
    if (count > MAX_REQUESTS_PER_MINUTE) {
      await redis.quit();
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Max 10 previews per minute." },
        { status: 429 }
      );
    }

    const body = (await request.json()) as unknown;
    const parsed = previewSchema.safeParse(body);
    if (!parsed.success) {
      await redis.quit();
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      await redis.quit();
      return NextResponse.json(
        { success: false, error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    const { voiceId, text, settings } = parsed.data;
    const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?output_format=mp3_44100_128`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text ?? DEFAULT_PREVIEW_TEXT,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: settings?.stability ?? 0.7,
          similarity_boost: settings?.similarityBoost ?? 0.75,
          style: settings?.style ?? 0.3,
        },
      }),
    });

    await redis.quit();

    if (!response.ok) {
      const errorText = await response.text().catch(() => "unknown");
      return NextResponse.json(
        { success: false, error: `ElevenLabs TTS error: ${response.status} — ${errorText}` },
        { status: 502 }
      );
    }

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": String(audioBuffer.byteLength),
      },
    });
  } catch (err: unknown) {
    await redis.quit().catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
