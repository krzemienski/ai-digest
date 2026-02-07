import type { Database } from "@ai-digest/db";
import { normalizedItems, eq } from "@ai-digest/db";
import { deterministicId } from "@ai-digest/shared";
import type { RawFetchResult } from "../fetchers/types";

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
      authors: raw.authors,
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
