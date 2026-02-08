import { NextRequest, NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, subscribers, eq } from "@ai-digest/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const rows = await db.update(subscribers)
      .set({ status: "unsubscribed" })
      .where(eq(subscribers.id, id))
      .returning();

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Subscriber not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: { id } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
