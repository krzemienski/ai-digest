import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const bulkSourceSchema = z.object({
  name: z.string().min(1),
  type: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional().default(true),
});

const bulkImportSchema = z.array(bulkSourceSchema).min(1, "At least one source is required");

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = await request.json() as unknown;
    const parsed = bulkImportSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Invalid source data",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const result = await queries.bulkCreateSources(db, parsed.data, {
      skipDuplicates: true,
    });

    return NextResponse.json({
      success: true,
      data: {
        added: result.added,
        skipped: result.skipped,
        errors: result.errors,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
