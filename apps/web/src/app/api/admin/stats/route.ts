import { NextResponse } from "next/server";
import { requireAdminFromRequest } from "@/lib/admin-auth";
import {
  db,
  normalizedItems,
  digests,
  episodes,
  subscribers,
  pipelineRuns,
  sources,
  eq,
  desc,
  sql,
} from "@ai-digest/db";

export async function GET() {
  const authError = await requireAdminFromRequest();
  if (authError) return authError;

  try {
    const [itemCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(normalizedItems);
    const [digestCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(digests);
    const [episodeCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(episodes)
      .where(eq(episodes.status, "ready"));
    const [subscriberCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(subscribers)
      .where(eq(subscribers.status, "active"));

    // Latest pipeline run
    const latestRun = await db.query.pipelineRuns.findFirst({
      orderBy: [desc(pipelineRuns.startedAt)],
    });

    // Source health
    const allSources = await db.query.sources.findMany();
    const healthy = allSources.filter(s => s.consecutiveErrors === 0).length;
    const degraded = allSources.filter(
      s => s.consecutiveErrors > 0 && s.consecutiveErrors < 3
    ).length;
    const erroring = allSources.filter(s => s.consecutiveErrors >= 3).length;

    return NextResponse.json({
      success: true,
      data: {
        totalItems: itemCount?.count ?? 0,
        totalDigests: digestCount?.count ?? 0,
        totalEpisodes: episodeCount?.count ?? 0,
        totalSubscribers: subscriberCount?.count ?? 0,
        latestPipelineRun: latestRun
          ? {
              id: latestRun.id,
              status: latestRun.status,
              startedAt: latestRun.startedAt,
              completedAt: latestRun.completedAt,
              itemsIngested: latestRun.itemsIngested,
              costUsd: latestRun.costUsd,
            }
          : null,
        sourceHealth: {
          healthy,
          degraded,
          erroring,
          total: allSources.length,
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
