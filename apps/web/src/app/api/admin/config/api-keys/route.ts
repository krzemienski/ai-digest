import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const [anthropic, elevenlabs] = await Promise.all([
      queries.getApiKeyMasked(db, "anthropic"),
      queries.getApiKeyMasked(db, "elevenlabs"),
    ]);

    return NextResponse.json({
      success: true,
      data: { anthropic, elevenlabs },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

const putBodySchema = z.object({
  provider: z.enum(["anthropic", "elevenlabs"]),
  key: z.string().min(1),
});

export async function PUT(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as unknown;
    const parsed = putBodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid request body",
          details: parsed.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { provider, key } = parsed.data;

    await queries.setApiKey(db, provider, key);

    const last4 = key.slice(-4);
    const masked = `****...${last4}`;

    return NextResponse.json({
      success: true,
      provider,
      masked,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
