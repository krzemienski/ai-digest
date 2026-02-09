import type { Database } from "@ai-digest/db";
import { normalizedItems, eq } from "@ai-digest/db";
import { deterministicId } from "@ai-digest/shared";
import type { RawFetchResult } from "../fetchers/types";

/**
 * Normalize and deduplicate raw fetch results into standardized database records.
 *
 * Creates deterministic IDs from source+sourceId to detect and skip duplicates.
 * Standardizes field formats and initializes empty categories array for later classification.
 *
 * @param db - Database connection
 * @param rawItems - Raw fetch results from ingestion stage
 * @param pipelineRunId - ID of the current pipeline run for tracking
 * @returns Count of inserted items and skipped duplicates
 */
export async function runNormalization(
  db: Database,
  rawItems: readonly RawFetchResult[],
  pipelineRunId: string,
): Promise<{ inserted: number; skipped: number }> {
  let inserted = 0;
  let skipped = 0;

  for (const raw of rawItems) {
    const id = deterministicId(raw.source, raw.sourceId);

    // Check if item already exists (dedup by deterministic ID)
    const existing = await db.query.normalizedItems.findFirst({
      where: eq(normalizedItems.id, id),
      columns: { id: true },
    });

    if (existing) {
      skipped = skipped + 1;
      continue;
    }

    await db.insert(normalizedItems).values({
      id,
      source: raw.source,
      sourceId: raw.sourceId,
      sourceUrl: raw.sourceUrl,
      title: raw.title,
      summary: raw.summary,
      content: raw.content ?? null,
      authors: raw.authors.map((a) => (typeof a === "string" ? a : String(a))),
      publishedAt: raw.publishedAt,
      categories: [],
      metadata: raw.metadata,
      pipelineRunId,
    });

    inserted = inserted + 1;
  }

  console.log(
    `[Normalize] Inserted ${inserted}, skipped ${skipped} duplicates`,
  );
  return { inserted, skipped };
}
