import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const previewSchema = z.object({
  text: z.string().min(1),
  voiceId: z.string().min(1),
  settings: z.record(z.unknown()).optional(),
});

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest();
  if (authError) return authError;

  try {
    const body = await request.json() as unknown;
    const parsed = previewSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid preview request", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        message: "Preview generation not yet implemented",
        voiceId: parsed.data.voiceId,
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
