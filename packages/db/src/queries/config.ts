import { eq } from "drizzle-orm";
import type { Database } from "../client";
import { config } from "../schema";
import { encryptApiKey, decryptApiKey } from "../crypto";

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

export async function setApiKey(
  db: Database,
  provider: "anthropic" | "elevenlabs",
  key: string
): Promise<void> {
  const encrypted = encryptApiKey(key);
  await setConfig(db, `apiKey:${provider}`, { encrypted });
}

export async function getApiKey(
  db: Database,
  provider: "anthropic" | "elevenlabs"
): Promise<string | null> {
  const row = await getConfig(db, `apiKey:${provider}`);
  if (!row) return null;

  const { encrypted } = row as { encrypted: string };
  return decryptApiKey(encrypted);
}

export async function getApiKeyMasked(
  db: Database,
  provider: "anthropic" | "elevenlabs"
): Promise<string | null> {
  const plaintext = await getApiKey(db, provider);
  if (!plaintext) return null;

  const last4 = plaintext.slice(-4);
  return `****...${last4}`;
}
