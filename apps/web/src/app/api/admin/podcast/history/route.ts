import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries } from "@ai-digest/db";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const page = Number(request.nextUrl.searchParams.get("page") ?? "1");
    const limit = Number(request.nextUrl.searchParams.get("limit") ?? "20");

    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json(
        { success: false, error: "Invalid pagination: page >= 1, 1 <= limit <= 100" },
        { status: 400 }
      );
    }

    const result = await queries.getEpisodeHistory(db, { page, limit });

    return NextResponse.json({
      success: true,
      data: {
        episodes: result.episodes.map(ep => ({
          id: ep.id,
          digestId: ep.digestId,
          title: ep.title,
          status: ep.status,
          audioUrl: ep.audioUrl,
          durationSeconds: ep.durationSeconds,
          targetDurationMinutes: ep.targetDurationMinutes,
          model: ep.model,
          style: ep.style,
          costUsd: ep.costUsd,
          createdAt: ep.createdAt,
        })),
        pagination: result.pagination,
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
