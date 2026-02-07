import { desc, eq, gte } from "drizzle-orm";
import type { Database } from "../client";
import { normalizedItems } from "../schema";

export async function getItemsByPipelineRun(db: Database, pipelineRunId: string) {
  return db.query.normalizedItems.findMany({
    where: eq(normalizedItems.pipelineRunId, pipelineRunId),
  });
}

export async function getItemsByScore(db: Database, minScore: number, limit = 50) {
  return db.query.normalizedItems.findMany({
    where: gte(normalizedItems.compositeScore, minScore),
    orderBy: [desc(normalizedItems.compositeScore)],
    limit,
  });
}

export async function updateItemScores(db: Database, id: string, scores: {
  relevanceScore?: number;
  noveltyScore?: number;
  impactScore?: number;
  compositeScore?: number;
}) {
  const rows = await db.update(normalizedItems).set(scores).where(eq(normalizedItems.id, id)).returning();
  return rows[0]!;
}

export async function markDuplicate(db: Database, id: string, duplicateOf: string) {
  const rows = await db.update(normalizedItems).set({ duplicateOf }).where(eq(normalizedItems.id, id)).returning();
  return rows[0]!;
}
