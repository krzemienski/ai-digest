import { sql } from "drizzle-orm";
import type { Database } from "../client";

export async function fullTextSearch(db: Database, query: string, opts: { limit?: number; offset?: number } = {}) {
  const { limit = 20, offset = 0 } = opts;
  const tsQuery = query.split(/\s+/).join(" & ");

  const items = await db.execute(sql`
    SELECT *, ts_rank(search_vector, to_tsquery('english', ${tsQuery})) AS rank
    FROM normalized_items
    WHERE search_vector @@ to_tsquery('english', ${tsQuery})
    ORDER BY rank DESC
    LIMIT ${limit} OFFSET ${offset}
  `);

  return items;
}
