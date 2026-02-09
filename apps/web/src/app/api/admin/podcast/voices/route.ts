import { NextRequest, NextResponse } from "next/server";
import IORedis from "ioredis";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const REDIS_URL = process.env.REDIS_URL ?? "redis://localhost:6379";
const CACHE_KEY = "elevenlabs:voices";
const CACHE_TTL_SECONDS = 3600; // 1 hour

interface ElevenLabsVoice {
  voice_id: string;
  name: string;
  category: string;
  preview_url: string;
  labels: Record<string, string>;
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  const redis = new IORedis(REDIS_URL);

  try {
    // Check cache first
    const cached = await redis.get(CACHE_KEY);
    if (cached) {
      await redis.quit();
      return NextResponse.json({ success: true, data: { voices: JSON.parse(cached), cached: true } });
    }

    // Fetch from ElevenLabs
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      await redis.quit();
      return NextResponse.json(
        { success: false, error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
    });

    if (!response.ok) {
      await redis.quit();
      return NextResponse.json(
        { success: false, error: `ElevenLabs API error: ${response.status}` },
        { status: 502 }
      );
    }

    const data = (await response.json()) as { voices: ElevenLabsVoice[] };

    const voices = data.voices.map(v => ({
      voiceId: v.voice_id,
      name: v.name,
      category: v.category,
      previewUrl: v.preview_url,
      labels: v.labels,
    }));

    // Cache in Redis
    await redis.set(CACHE_KEY, JSON.stringify(voices), "EX", CACHE_TTL_SECONDS);
    await redis.quit();

    return NextResponse.json({ success: true, data: { voices, cached: false } });
  } catch (err: unknown) {
    await redis.quit().catch(() => {});
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
