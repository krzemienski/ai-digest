import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const updateSourceSchema = z.object({
  type: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  config: z.record(z.string(), z.unknown()).optional(),
  enabled: z.boolean().optional(),
});

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json() as unknown;
    const parsed = updateSourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid source data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const source = await queries.updateSource(db, id, parsed.data);
    return NextResponse.json({ success: true, data: source });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    await queries.deleteSource(db, id);
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
