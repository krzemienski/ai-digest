import { eq, sql } from "drizzle-orm";
import type { Database } from "../client";
import { subscribers } from "../schema";

export async function getSubscribers(db: Database) {
  return db.query.subscribers.findMany({
    where: eq(subscribers.status, "active"),
  });
}

export async function createSubscriber(db: Database, data: typeof subscribers.$inferInsert) {
  const rows = await db.insert(subscribers).values(data).returning();
  return rows[0]!;
}

export async function removeSubscriber(db: Database, email: string) {
  const rows = await db
    .update(subscribers)
    .set({ status: "unsubscribed", unsubscribedAt: new Date() })
    .where(eq(subscribers.email, email))
    .returning();
  return rows[0]!;
}

export async function getSubscriberCount(db: Database) {
  const result = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(subscribers)
    .where(eq(subscribers.status, "active"));
  return result[0]!.count;
}
