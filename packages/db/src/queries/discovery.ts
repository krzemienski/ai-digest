import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { discoveryRuns } from "../schema";

export async function createDiscoveryRun(
  db: Database,
  data: {
    topics?: string[];
    sourceTypes?: string[];
    maxSources?: number;
  }
) {
  const rows = await db
    .insert(discoveryRuns)
    .values({
      topics: data.topics,
      sourceTypes: data.sourceTypes,
      maxSources: data.maxSources ?? 10,
    })
    .returning();
  return rows[0]!;
}

export async function getDiscoveryRun(db: Database, id: string) {
  return db.query.discoveryRuns.findFirst({
    where: eq(discoveryRuns.id, id),
  });
}

export async function updateDiscoveryRun(
  db: Database,
  id: string,
  data: Partial<{
    status: string;
    candidates: unknown[];
    addedSourceIds: string[];
    error: string | null;
    startedAt: Date;
    completedAt: Date;
  }>
) {
  const rows = await db
    .update(discoveryRuns)
    .set(data)
    .where(eq(discoveryRuns.id, id))
    .returning();
  return rows[0]!;
}

export async function getRecentDiscoveryRuns(
  db: Database,
  limit: number = 10
) {
  return db.query.discoveryRuns.findMany({
    orderBy: [desc(discoveryRuns.createdAt)],
    limit,
  });
}
