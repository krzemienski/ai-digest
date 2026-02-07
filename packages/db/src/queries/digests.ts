import { desc, eq, asc } from "drizzle-orm";
import type { Database } from "../client";
import { digests, digestItems, normalizedItems } from "../schema";

export async function getDigests(db: Database, opts: { limit?: number; offset?: number } = {}) {
  const { limit = 20, offset = 0 } = opts;
  return db.query.digests.findMany({
    limit,
    offset,
    orderBy: [desc(digests.createdAt)],
  });
}

export async function getDigestById(db: Database, id: string) {
  return db.query.digests.findFirst({
    where: eq(digests.id, id),
  });
}

export async function getLatestDigest(db: Database) {
  return db.query.digests.findFirst({
    orderBy: [desc(digests.digestDate)],
  });
}

export async function createDigest(db: Database, data: typeof digests.$inferInsert) {
  const rows = await db.insert(digests).values(data).returning();
  return rows[0]!;
}

export async function addDigestItems(db: Database, items: (typeof digestItems.$inferInsert)[]) {
  return db.insert(digestItems).values(items).returning();
}

export async function getDigestWithItems(db: Database, digestId: string) {
  const digest = await db.query.digests.findFirst({
    where: eq(digests.id, digestId),
  });

  if (!digest) return null;

  const items = await db
    .select({
      id: digestItems.id,
      rank: digestItems.rank,
      section: digestItems.section,
      normalizedItemId: digestItems.normalizedItemId,
      title: normalizedItems.title,
      summary: normalizedItems.summary,
      source: normalizedItems.source,
      sourceUrl: normalizedItems.sourceUrl,
      compositeScore: normalizedItems.compositeScore,
      categories: normalizedItems.categories,
    })
    .from(digestItems)
    .innerJoin(normalizedItems, eq(digestItems.normalizedItemId, normalizedItems.id))
    .where(eq(digestItems.digestId, digestId))
    .orderBy(asc(digestItems.rank));

  return { ...digest, items };
}
