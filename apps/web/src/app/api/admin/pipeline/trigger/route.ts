import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { getQueueClient } from "@/lib/queue";

export async function POST(request: NextRequest) {
  const authError = requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;
    const queue = getQueueClient();
    const job = await queue.add("pipeline", { ...body, triggeredBy: "admin" });

    return NextResponse.json({
      success: true,
      data: { jobId: job.id },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Failed to trigger pipeline: ${message}` },
      { status: 500 }
    );
  }
}
