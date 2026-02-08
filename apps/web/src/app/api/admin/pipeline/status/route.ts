import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { requireAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const currentRuns = await queries.getRecentRuns(db, 1);
    const recentRuns = await queries.getRecentRuns(db, 10);

    const current = currentRuns.length > 0 ? currentRuns[0] : null;

    return NextResponse.json({
      success: true,
      data: { current, recent: recentRuns },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
