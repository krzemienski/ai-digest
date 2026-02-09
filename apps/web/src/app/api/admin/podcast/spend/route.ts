import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries } from "@ai-digest/db";

const MONTHLY_THRESHOLD_USD = 50;

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const now = new Date();
    const result = await queries.getMonthlyCostTotal(db, now.getFullYear(), now.getMonth() + 1);

    return NextResponse.json({
      success: true,
      data: {
        currentMonth: {
          total: result.totalCost,
          count: result.episodeCount,
          year: result.year,
          month: result.month,
        },
        threshold: MONTHLY_THRESHOLD_USD,
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
