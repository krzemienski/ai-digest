import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";

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

  try {
    // Fetch from ElevenLabs (no Redis cache — use Next.js fetch cache instead)
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: "ELEVENLABS_API_KEY not configured" },
        { status: 500 }
      );
    }

    const response = await fetch("https://api.elevenlabs.io/v1/voices", {
      headers: { "xi-api-key": apiKey },
      next: { revalidate: 3600 },
    });

    if (!response.ok) {
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

    return NextResponse.json({ success: true, data: { voices, cached: false } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
