import { and, count, desc, gte, isNull, lte } from "drizzle-orm";
import type { Database } from "../client";
import { normalizedItems } from "../schema";

/**
 * Fetch non-duplicate normalized items within a date range, ranked by composite score.
 * Used by the podcast processor for time-window-based content selection.
 */
export async function getItemsByDateRange(
  db: Database,
  start: Date,
  end: Date,
  limit = 100
) {
  return db.query.normalizedItems.findMany({
    where: and(
      isNull(normalizedItems.duplicateOf),
      gte(normalizedItems.publishedAt, start),
      lte(normalizedItems.publishedAt, end)
    ),
    orderBy: [desc(normalizedItems.compositeScore)],
    limit,
    columns: {
      id: true,
      title: true,
      sourceUrl: true,
      summary: true,
      source: true,
      categories: true,
      compositeScore: true,
      publishedAt: true,
    },
  });
}

/**
 * Count non-duplicate normalized items within a date range.
 * Used by the item-count API endpoint to preview available items.
 */
export async function getItemCountByDateRange(
  db: Database,
  start: Date,
  end: Date
) {
  const rows = await db
    .select({ value: count() })
    .from(normalizedItems)
    .where(
      and(
        isNull(normalizedItems.duplicateOf),
        gte(normalizedItems.publishedAt, start),
        lte(normalizedItems.publishedAt, end)
      )
    );

  return rows[0]?.value ?? 0;
}
