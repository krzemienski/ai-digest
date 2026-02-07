import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
