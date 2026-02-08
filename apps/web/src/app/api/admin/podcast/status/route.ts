import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, episodes, desc } from "@ai-digest/db";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const episode = await db.query.episodes.findFirst({
      orderBy: [desc(episodes.createdAt)],
    });

    if (!episode) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: episode.id,
        digestId: episode.digestId,
        title: episode.title,
        status: episode.status,
        audioUrl: episode.audioUrl,
        durationSeconds: episode.durationSeconds,
        targetDurationMinutes: episode.targetDurationMinutes,
        podcastStages: episode.podcastStages,
        scriptPreview: episode.scriptPreview,
        createdAt: episode.createdAt,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
