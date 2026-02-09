import { desc, eq, and } from "drizzle-orm";
import type { Database } from "../client";
import { podcastLogs } from "../schema";

export async function insertLog(
  db: Database,
  entry: typeof podcastLogs.$inferInsert
) {
  const rows = await db.insert(podcastLogs).values(entry).returning();
  return rows[0]!;
}

export async function getLogsByEpisode(
  db: Database,
  episodeId: string
) {
  return db.query.podcastLogs.findMany({
    where: eq(podcastLogs.episodeId, episodeId),
    orderBy: [desc(podcastLogs.createdAt)],
  });
}

export async function getLogsByEpisodeAndStage(
  db: Database,
  episodeId: string,
  stage: string
) {
  return db.query.podcastLogs.findMany({
    where: and(
      eq(podcastLogs.episodeId, episodeId),
      eq(podcastLogs.stage, stage)
    ),
    orderBy: [desc(podcastLogs.createdAt)],
  });
}
