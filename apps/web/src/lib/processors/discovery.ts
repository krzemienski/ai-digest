import { db, queries } from "@ai-digest/db";
import { runDiscoveryAgent } from "@ai-digest/agents";
import type { DiscoveryAgentConfig } from "@ai-digest/agents";
import { resolveApiKey } from "./api-keys";

interface DiscoveryInput {
  readonly runId: string;
}

export async function processDiscovery(input: DiscoveryInput): Promise<void> {
  const { runId } = input;

  // Fetch the discovery run from DB
  const run = await queries.getDiscoveryRun(db, runId);
  if (!run) {
    throw new Error(`Discovery run not found: ${runId}`);
  }

  // Mark as running
  await queries.updateDiscoveryRun(db, runId, {
    status: "running",
    startedAt: new Date(),
  });

  try {
    // Resolve Anthropic API key (DB first, then env fallback)
    const apiKey = await resolveApiKey("anthropic");

    const config: DiscoveryAgentConfig = {
      topics: run.topics ?? [],
      sourceTypes: run.sourceTypes ?? [],
      maxSources: run.maxSources ?? 10,
      apiKey,
      onProgress: (message: string) => {
        console.log(`[Discovery] ${message}`);
      },
    };

    console.log(`[Discovery] Starting: topics=[${config.topics.join(", ")}], maxSources=${config.maxSources}`);

    const result = await runDiscoveryAgent(config);

    // On success: store candidates and mark completed
    await queries.updateDiscoveryRun(db, runId, {
      status: "completed",
      candidates: result.candidates as unknown[],
      completedAt: new Date(),
    });

    console.log(
      `[Discovery] Completed: ${result.candidates.length} candidates found in ${Math.round(result.durationMs / 1000)}s`
    );
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);

    // On error: store error message and mark failed
    await queries.updateDiscoveryRun(db, runId, {
      status: "failed",
      error: errMsg,
      completedAt: new Date(),
    });

    console.error(`[Discovery] Failed: ${errMsg}`);
    throw error;
  }
}
