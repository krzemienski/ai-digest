import { NextRequest, NextResponse } from "next/server";
import { after } from "next/server";
import { z } from "zod";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import { db, queries } from "@ai-digest/db";
import { processDiscovery } from "@/lib/processors/discovery";

export const maxDuration = 300;

const discoverSchema = z.object({
  topics: z.array(z.string()).optional(),
  sourceTypes: z.array(z.string()).optional(),
  maxSources: z.number().int().min(1).max(50).optional(),
});

export async function POST(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const body = (await request.json()) as unknown;
    const parsed = discoverSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const run = await queries.createDiscoveryRun(db, {
      topics: parsed.data.topics,
      sourceTypes: parsed.data.sourceTypes,
      maxSources: parsed.data.maxSources,
    });

    after(async () => {
      try {
        await processDiscovery({ runId: run.id });
      } catch (error) {
        console.error("[Discovery] Background execution failed:", error);
      }
    });

    return NextResponse.json(
      { success: true, data: { runId: run.id, status: "pending" as const } },
      { status: 201 },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}

export async function GET(request: NextRequest) {
  const authError = await requireAdminFromRequest(request);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const runId = searchParams.get("runId");

    if (runId) {
      const run = await queries.getDiscoveryRun(db, runId);
      if (!run) {
        return NextResponse.json(
          { success: false, error: "Discovery run not found" },
          { status: 404 },
        );
      }
      return NextResponse.json({ success: true, data: run });
    }

    const runs = await queries.getRecentDiscoveryRuns(db);
    return NextResponse.json({ success: true, data: runs });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 },
    );
  }
}
