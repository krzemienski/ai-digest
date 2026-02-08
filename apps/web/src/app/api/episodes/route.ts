import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const offset = (page - 1) * limit;

  const episodes = await queries.getEpisodes(db, { limit, offset });

  return NextResponse.json(
    { success: true, data: episodes, meta: { page, limit, total: episodes.length } },
    { headers: { "Cache-Control": "public, max-age=300" } }
  );
}
