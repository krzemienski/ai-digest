import { NextRequest, NextResponse } from "next/server";
import { db, queries } from "@ai-digest/db";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const CONFIG_KEYS = ["topics", "scoring", "synthesis", "budget", "schedule", "podcast"] as const;

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest();
  if (authError) return authError;

  try {
    const configEntries = await Promise.all(
      CONFIG_KEYS.map(async (key) => {
        const value = await queries.getConfig(db, key);
        return [key, value] as const;
      })
    );

    const configMap = Object.fromEntries(configEntries);

    return NextResponse.json({
      success: true,
      data: configMap,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
