import { sql } from "drizzle-orm";
import type { Database } from "../client";

export async function fullTextSearch(
  db: Database,
  query: string,
  opts: { limit?: number; offset?: number; sourceType?: string; dateRange?: string } = {}
) {
  const { limit = 20, offset = 0, sourceType, dateRange } = opts;

  // Build date interval
  let dateInterval: string | null = null;
  if (dateRange === "24h") dateInterval = "24 hours";
  else if (dateRange === "7d") dateInterval = "7 days";
  else if (dateRange === "30d") dateInterval = "30 days";

  // Build query with optional filters
  const items = await db.execute(sql`
    SELECT *, ts_rank(search_vector, plainto_tsquery('english', ${query})) AS rank
    FROM normalized_items
    WHERE search_vector @@ plainto_tsquery('english', ${query})
      ${sourceType ? sql`AND source = ${sourceType}` : sql``}
      ${dateInterval ? sql`AND published_at >= now() - ${dateInterval}::interval` : sql``}
    ORDER BY rank DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return items;
}
