import { desc, eq, and, gte, lt, sql } from "drizzle-orm";
import type { Database } from "../client";
import { episodes, transcripts, podcastLogs } from "../schema";

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

export async function getEpisodeWithTranscript(db: Database, id: string) {
  const episode = await db.query.episodes.findFirst({
    where: eq(episodes.id, id),
  });

  if (!episode) return null;

  const transcript = await db.query.transcripts.findFirst({
    where: eq(transcripts.episodeId, id),
  });

  return { ...episode, transcript: transcript ?? null };
}

export async function getEpisodeHistory(
  db: Database,
  opts: { page?: number; limit?: number } = {}
) {
  const { page = 1, limit = 20 } = opts;
  const offset = (page - 1) * limit;

  const results = await db.query.episodes.findMany({
    limit,
    offset,
    orderBy: [desc(episodes.createdAt)],
  });

  const countResult = await db.select({ count: sql<number>`count(*)::int` }).from(episodes);
  const total = countResult[0]?.count ?? 0;

  return {
    episodes: results,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  };
}

export async function getEpisodeWithFullDetail(db: Database, id: string) {
  const episode = await db.query.episodes.findFirst({
    where: eq(episodes.id, id),
  });

  if (!episode) return null;

  const transcript = await db.query.transcripts.findFirst({
    where: eq(transcripts.episodeId, id),
  });

  const logs = await db.query.podcastLogs.findMany({
    where: eq(podcastLogs.episodeId, id),
    orderBy: [desc(podcastLogs.createdAt)],
  });

  return {
    ...episode,
    transcript: transcript ?? null,
    logs,
  };
}

export async function getMonthlyCostTotal(
  db: Database,
  year: number,
  month: number
) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 1);

  const result = await db
    .select({
      totalCost: sql<number>`coalesce(sum(${episodes.costUsd}), 0)::real`,
      episodeCount: sql<number>`count(*)::int`,
    })
    .from(episodes)
    .where(
      and(
        gte(episodes.createdAt, startDate),
        lt(episodes.createdAt, endDate)
      )
    );

  return {
    totalCost: result[0]?.totalCost ?? 0,
    episodeCount: result[0]?.episodeCount ?? 0,
    year,
    month,
  };
}

export async function getReadyEpisodes(
  db: Database,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 20, offset = 0 } = options;
  return db
    .select()
    .from(episodes)
    .where(eq(episodes.status, "ready"))
    .orderBy(desc(episodes.createdAt))
    .limit(limit)
    .offset(offset);
}
