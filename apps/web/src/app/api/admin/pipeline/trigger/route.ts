import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { processPipeline } from "@/lib/processors/pipeline";

export const maxDuration = 800;

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = await request.json().catch(() => ({})) as Record<string, unknown>;

    after(async () => {
      try {
        await processPipeline({
          triggerType: "manual",
          enablePodcast: body.enablePodcast !== false,
          enableNewsletter: body.enableNewsletter !== false,
        });
      } catch (error) {
        console.error("[Pipeline] Background execution failed:", error);
      }
    });

    return NextResponse.json({
      success: true,
      data: { status: "started" },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: `Failed to trigger pipeline: ${message}` },
      { status: 500 }
    );
  }
}
