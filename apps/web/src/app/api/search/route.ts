import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { applyRateLimit } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, 60, 60_000);
  if (rateLimited) return rateLimited;

  const q = request.nextUrl.searchParams.get("q");

  if (!q || q.trim().length === 0) {
    return NextResponse.json(
      { success: true, data: [] },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  }

  try {
    const results = await queries.fullTextSearch(db, q, { limit: 20 });

    return NextResponse.json(
      { success: true, data: results },
      { headers: { "Cache-Control": "public, max-age=60" } }
    );
  } catch (_error) {
    return NextResponse.json(
      { success: false, error: "Search failed" },
      { status: 500 }
    );
  }
}
