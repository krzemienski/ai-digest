import { eq } from "drizzle-orm";
import type { SourceConfig } from "@ai-digest/shared";
import type { Database } from "../client";
import { sources } from "../schema";

export type NewSource = typeof sources.$inferInsert;

export async function getSources(db: Database) {
  return db.query.sources.findMany();
}

export async function getSourceById(db: Database, id: string) {
  return db.query.sources.findFirst({
    where: eq(sources.id, id),
  });
}

export async function createSource(db: Database, data: NewSource) {
  const rows = await db.insert(sources).values(data).returning();
  return rows[0]!;
}

export async function updateSource(db: Database, id: string, data: Partial<NewSource>) {
  const rows = await db.update(sources).set({ ...data, updatedAt: new Date() }).where(eq(sources.id, id)).returning();
  return rows[0]!;
}

export async function deleteSource(db: Database, id: string) {
  const rows = await db.delete(sources).where(eq(sources.id, id)).returning();
  return rows[0];
}

/**
 * Extract the duplicate-detection key from a source config based on its type.
 * Returns the key field value used to identify duplicates, or null if the type
 * has no meaningful key (e.g., producthunt).
 */
function getDuplicateKey(type: string, config: SourceConfig): string | null {
  switch (type) {
    case "rss":
      return config.rss?.url ?? null;
    case "reddit":
      return config.reddit?.subreddits?.slice().sort().join(",") ?? null;
    case "github":
      return config.github?.query ?? null;
    case "arxiv":
      return config.arxiv?.categories?.slice().sort().join(",") ?? null;
    case "hackernews":
      return config.hackernews?.keywords?.slice().sort().join(",") ?? null;
    case "huggingface":
      return config.huggingface?.tasks?.slice().sort().join(",") ?? null;
    case "producthunt":
      return config.producthunt?.topic ?? null;
    default:
      return null;
  }
}

export interface BulkCreateResult {
  added: number;
  skipped: number;
  errors: string[];
}

/**
 * Bulk-create sources with duplicate detection.
 *
 * For each source, checks if a source with the same `type` and matching config
 * key field already exists (RSS: url, Reddit: subreddits, GitHub: query, etc.).
 *
 * Processes sources one at a time within a transaction for atomicity.
 *
 * @param db - Database instance
 * @param newSources - Array of source objects to insert
 * @param options - `skipDuplicates` (default true): skip duplicates silently
 * @returns Summary of added, skipped, and errored sources
 */
export async function bulkCreateSources(
  db: Database,
  newSources: NewSource[],
  options?: { skipDuplicates?: boolean },
): Promise<BulkCreateResult> {
  const skipDuplicates = options?.skipDuplicates ?? true;

  const result: BulkCreateResult = { added: 0, skipped: 0, errors: [] };

  if (newSources.length === 0) {
    return result;
  }

  await db.transaction(async (tx) => {
    // Pre-fetch all existing sources to check duplicates in-memory
    const existingSources = await tx.query.sources.findMany({
      columns: { type: true, config: true },
    });

    // Build a set of "type::key" strings for fast lookup
    const existingKeys = new Set<string>();
    for (const existing of existingSources) {
      const key = getDuplicateKey(existing.type, existing.config);
      if (key !== null) {
        existingKeys.add(`${existing.type}::${key}`);
      }
    }

    for (const source of newSources) {
      try {
        const dupKey = getDuplicateKey(source.type, source.config);
        const lookupKey = dupKey !== null ? `${source.type}::${dupKey}` : null;

        if (lookupKey !== null && existingKeys.has(lookupKey)) {
          if (skipDuplicates) {
            result.skipped += 1;
            continue;
          }
          result.errors.push(`Duplicate source: ${source.name} (${source.type})`);
          continue;
        }

        await tx.insert(sources).values(source);
        result.added += 1;

        // Add to the set so subsequent sources in this batch are also deduped
        if (lookupKey !== null) {
          existingKeys.add(lookupKey);
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        result.errors.push(`Failed to insert "${source.name}": ${message}`);
      }
    }
  });

  return result;
}
