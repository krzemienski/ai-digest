import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { requireAdminFromRequest } from "@/lib/admin-auth";

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const sources = await queries.getSources(db);

    const exportData = sources.map((source) => ({
      name: source.name,
      type: source.type,
      config: source.config,
      enabled: source.enabled,
    }));

    const dateStr = new Date().toISOString().slice(0, 10);
    const json = JSON.stringify(exportData, null, 2);

    return new NextResponse(json, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="sources-export-${dateStr}.json"`,
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
