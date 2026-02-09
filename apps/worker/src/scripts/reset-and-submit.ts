import { db, episodes, eq } from "@ai-digest/db";
import { Queue } from "bullmq";

async function main() {
  // Reset the existing episode
  const result = await db
    .update(episodes)
    .set({ status: "generating" })
    .where(eq(episodes.id, "0da5da3e-baaa-4a58-b54a-c4af757a7733"))
    .returning({ id: episodes.id, status: episodes.status });
  console.log("Reset episode:", result);

  // Submit BullMQ job
  const queue = new Queue("podcast", {
    connection: { host: "localhost", port: 6379 },
  });

  const job = await queue.add("podcast", {
    episodeId: "0da5da3e-baaa-4a58-b54a-c4af757a7733",
    digestId: "058cbbe4-7b49-438b-b105-db126a522ea1",
    targetDurationMinutes: 30,
    model: "claude-haiku-4-5-20251001",
    style: "professional",
  });

  console.log("Job added:", job.id);
  await queue.close();
  process.exit(0);
}

main();
