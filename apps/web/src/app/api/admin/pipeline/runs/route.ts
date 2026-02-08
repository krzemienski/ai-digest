import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { requireAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const runs = await queries.getRecentRuns(db, 20);

    return NextResponse.json({
      success: true,
      data: runs,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
