import { db } from "@ai-digest/db";
import { runIngestion, runNormalization } from "@ai-digest/agents";
import { randomUUID } from "crypto";

async function main() {
  console.log("Starting ingestion test...");

  const pipelineRunId = randomUUID();
  console.log(`Pipeline run ID: ${pipelineRunId}`);

  const rawItems = await runIngestion(db);
  console.log(`Fetched ${rawItems.length} raw items`);

  if (rawItems.length === 0) {
    console.error("No items fetched — check source configs and network");
    process.exit(1);
  }

  const { inserted, skipped } = await runNormalization(db, rawItems, pipelineRunId);
  console.log(`Normalized: ${inserted} inserted, ${skipped} skipped`);

  console.log("Ingestion test complete.");
  process.exit(0);
}

main().catch((err) => {
  console.error("Test failed:", err);
  process.exit(1);
});
