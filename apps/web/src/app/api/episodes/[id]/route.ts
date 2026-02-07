import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const rateLimited = applyRateLimit(request, 60, 60_000);
  if (rateLimited) return rateLimited;

  const { id } = await params;
  const result = await queries.getEpisodeWithTranscript(db, id);

  if (!result) {
    return NextResponse.json(
      { success: false, error: "Episode not found" },
      { status: 404 }
    );
  }

  return NextResponse.json(
    { success: true, data: result },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
