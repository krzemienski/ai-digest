import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { pipelineRuns, pipelineStages } from "../schema";

export async function createPipelineRun(db: Database, data: typeof pipelineRuns.$inferInsert) {
  const rows = await db.insert(pipelineRuns).values(data).returning();
  return rows[0]!;
}

export async function updatePipelineRun(db: Database, id: string, data: Partial<typeof pipelineRuns.$inferInsert>) {
  const rows = await db.update(pipelineRuns).set(data).where(eq(pipelineRuns.id, id)).returning();
  return rows[0]!;
}

export async function createPipelineStage(db: Database, data: typeof pipelineStages.$inferInsert) {
  const rows = await db.insert(pipelineStages).values(data).returning();
  return rows[0]!;
}

export async function updatePipelineStage(db: Database, id: string, data: Partial<typeof pipelineStages.$inferInsert>) {
  const rows = await db.update(pipelineStages).set(data).where(eq(pipelineStages.id, id)).returning();
  return rows[0]!;
}

export async function getRecentRuns(db: Database, limit = 10) {
  return db.query.pipelineRuns.findMany({
    limit,
    orderBy: [desc(pipelineRuns.startedAt)],
  });
}
