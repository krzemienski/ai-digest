import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db, queries, sources, count, eq } from "@ai-digest/db";
import { requireAdminFromRequest } from "@/lib/admin-auth";

const itemCountParamsSchema = z.object({
  start: z.string().datetime({ message: "start must be a valid ISO date string" }),
  end: z.string().datetime({ message: "end must be a valid ISO date string" }),
});

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  const url = new URL(request.url);
  const parsed = itemCountParamsSchema.safeParse({
    start: url.searchParams.get("start"),
    end: url.searchParams.get("end"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { success: false, error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const startDate = new Date(parsed.data.start);
  const endDate = new Date(parsed.data.end);

  if (startDate >= endDate) {
    return NextResponse.json(
      { success: false, error: "start must be before end" },
      { status: 400 }
    );
  }

  try {
    const [itemCount, sourceCountRows] = await Promise.all([
      queries.getItemCountByDateRange(db, startDate, endDate),
      db
        .select({ value: count() })
        .from(sources)
        .where(eq(sources.enabled, true)),
    ]);

    const sourceCount = sourceCountRows[0]?.value ?? 0;

    return NextResponse.json({
      success: true,
      data: {
        itemCount,
        sourceCount,
        dateRange: {
          start: parsed.data.start,
          end: parsed.data.end,
        },
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
