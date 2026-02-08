import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { requireAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest();
  if (authError) return authError;

  try {
    const [subscribers, count] = await Promise.all([
      queries.getSubscribers(db),
      queries.getSubscriberCount(db),
    ]);

    return NextResponse.json({
      success: true,
      data: { subscribers, count },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
