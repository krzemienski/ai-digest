import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { config } from "../schema";

export async function getConfig(db: Database, key: string) {
  const row = await db.query.config.findFirst({
    where: eq(config.key, key),
  });
  return row?.value ?? null;
}

export async function setConfig(db: Database, key: string, value: unknown) {
  const rows = await db
    .insert(config)
    .values({ key, value, updatedAt: new Date() })
    .onConflictDoUpdate({
      target: config.key,
      set: { value, updatedAt: new Date() },
    })
    .returning();
  return rows[0]!;
}
