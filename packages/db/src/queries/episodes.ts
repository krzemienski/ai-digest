import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { episodes } from "../schema";

export async function getEpisodes(db: Database, opts: { limit?: number; offset?: number } = {}) {
  const { limit = 20, offset = 0 } = opts;
  return db.query.episodes.findMany({
    limit,
    offset,
    orderBy: [desc(episodes.createdAt)],
  });
}

export async function getEpisodeById(db: Database, id: string) {
  return db.query.episodes.findFirst({
    where: eq(episodes.id, id),
  });
}

export async function createEpisode(db: Database, data: typeof episodes.$inferInsert) {
  const rows = await db.insert(episodes).values(data).returning();
  return rows[0]!;
}

export async function updateEpisodeStatus(db: Database, id: string, status: string, updates: Partial<typeof episodes.$inferInsert> = {}) {
  const rows = await db.update(episodes).set({ ...updates, status }).where(eq(episodes.id, id)).returning();
  return rows[0]!;
}
