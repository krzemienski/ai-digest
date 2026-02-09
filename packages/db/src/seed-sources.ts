import { SEED_SOURCES } from "@ai-digest/shared";
import { db } from "./client";
import { bulkCreateSources } from "./queries/sources";

async function main() {
  console.log(`Seeding ${SEED_SOURCES.length} sources...`);

  const result = await bulkCreateSources(db, SEED_SOURCES, { skipDuplicates: true });

  console.log(`Done: ${result.added} added, ${result.skipped} skipped`);

  if (result.errors.length > 0) {
    console.error("Errors:");
    for (const err of result.errors) {
      console.error(`  - ${err}`);
    }
  }

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
