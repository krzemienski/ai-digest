import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { sources } from "../schema";

export async function getSources(db: Database) {
  return db.query.sources.findMany();
}

export async function getSourceById(db: Database, id: string) {
  return db.query.sources.findFirst({
    where: eq(sources.id, id),
  });
}

export async function createSource(db: Database, data: typeof sources.$inferInsert) {
  const rows = await db.insert(sources).values(data).returning();
  return rows[0]!;
}

export async function updateSource(db: Database, id: string, data: Partial<typeof sources.$inferInsert>) {
  const rows = await db.update(sources).set({ ...data, updatedAt: new Date() }).where(eq(sources.id, id)).returning();
  return rows[0]!;
}

export async function deleteSource(db: Database, id: string) {
  const rows = await db.delete(sources).where(eq(sources.id, id)).returning();
  return rows[0];
}
