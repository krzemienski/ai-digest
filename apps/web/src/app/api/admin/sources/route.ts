import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const createSourceSchema = z.object({
  type: z.string().min(1),
  name: z.string().min(1),
  config: z.record(z.string(), z.unknown()),
  enabled: z.boolean().optional().default(true),
});

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest();
  if (authError) return authError;

  try {
    const sources = await queries.getSources(db);
    return NextResponse.json({ success: true, data: sources });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest();
  if (authError) return authError;

  try {
    const body = await request.json() as unknown;
    const parsed = createSourceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid source data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const source = await queries.createSource(db, parsed.data);
    return NextResponse.json(
      { success: true, data: source },
      { status: 201 }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
