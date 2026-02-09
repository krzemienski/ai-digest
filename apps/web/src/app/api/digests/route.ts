import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get("limit") ?? "10")));
    const offset = (page - 1) * limit;

    const digests = await queries.getDigests(db, { limit, offset });

    return NextResponse.json(
      { success: true, data: digests, meta: { page, limit, total: digests.length } },
      { headers: { "Cache-Control": "public, max-age=300" } }
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
