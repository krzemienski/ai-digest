import { desc, eq } from "drizzle-orm";
import type { Database } from "../client";
import { podcastConfigs } from "../schema";

export async function getConfigs(db: Database) {
  return db.query.podcastConfigs.findMany({
    orderBy: [desc(podcastConfigs.createdAt)],
  });
}

export async function getConfigById(db: Database, id: string) {
  return db.query.podcastConfigs.findFirst({
    where: eq(podcastConfigs.id, id),
  });
}

export async function createConfig(
  db: Database,
  data: typeof podcastConfigs.$inferInsert
) {
  const rows = await db.insert(podcastConfigs).values(data).returning();
  return rows[0]!;
}

export async function updateConfig(
  db: Database,
  id: string,
  data: Partial<Omit<typeof podcastConfigs.$inferInsert, "id" | "createdAt">>
) {
  const rows = await db
    .update(podcastConfigs)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(podcastConfigs.id, id))
    .returning();
  return rows[0]!;
}

export async function getActiveConfig(db: Database) {
  return db.query.podcastConfigs.findFirst({
    where: eq(podcastConfigs.isActive, true),
    orderBy: [desc(podcastConfigs.updatedAt)],
  });
}
