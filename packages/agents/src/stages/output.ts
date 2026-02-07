import { eq, and, isNull, gte, desc } from "drizzle-orm";
import type { Database } from "@ai-digest/db";
import { normalizedItems, digests, digestItems } from "@ai-digest/db";
import type { ScoringConfig, SynthesisConfig, SynthesisStyle, DigestMetadata } from "@ai-digest/shared";
import { formatDigestDate } from "@ai-digest/shared";

interface OutputResult {
  digestId: string;
  itemCount: number;
  topTopics: string[];
}

export async function runOutput(
  db: Database,
  pipelineRunId: string,
  synthesis: string,
  synthesisStyle: SynthesisStyle,
  scoringConfig: ScoringConfig,
  synthesisConfig: SynthesisConfig
): Promise<OutputResult> {
  // Gather top scored, non-duplicate items
  const topItems = await db.query.normalizedItems.findMany({
    where: and(
      eq(normalizedItems.pipelineRunId, pipelineRunId),
      isNull(normalizedItems.duplicateOf),
      gte(normalizedItems.compositeScore, scoringConfig.minScore)
    ),
    orderBy: [desc(normalizedItems.compositeScore)],
    limit: synthesisConfig.maxItems,
  });

  // Group items by primary topic section
  const sections: Record<string, typeof topItems> = {};
  for (const item of topItems) {
    const section = item.categories[0] ?? "General AI";
    const existing = sections[section] ?? [];
    sections[section] = [...existing, item];
  }

  // Collect unique topics and source breakdown
  const topTopics: string[] = [];
  const sourceBreakdown: Record<string, number> = {};
  for (const item of topItems) {
    for (const topic of item.categories) {
      if (!topTopics.includes(topic)) {
        topTopics.push(topic);
      }
    }
    const count = sourceBreakdown[item.source] ?? 0;
    sourceBreakdown[item.source] = count + 1;
  }

  const digestDate = formatDigestDate(new Date());

  // Create digest metadata
  const metadata: DigestMetadata = {
    topTopics,
    sourceBreakdown,
    dateRange: {
      start: digestDate,
      end: digestDate,
    },
  };

  // Create digest record
  const digestRows = await db.insert(digests).values({
    digestDate,
    synthesis,
    synthesisStyle,
    itemCount: topItems.length,
    metadata,
    pipelineRunId,
  }).returning();
  const digest = digestRows[0]!;

  // Create digest_items linking digest to items with rank and section
  const digestItemValues: { digestId: string; normalizedItemId: string; rank: number; section: string }[] = [];
  let globalRank = 1;

  for (const [section, sectionItems] of Object.entries(sections)) {
    // Items within each section are already sorted by composite score (from query)
    for (const item of sectionItems) {
      digestItemValues.push({
        digestId: digest.id,
        normalizedItemId: item.id,
        rank: globalRank,
        section,
      });
      globalRank = globalRank + 1;
    }
  }

  if (digestItemValues.length > 0) {
    await db.insert(digestItems).values(digestItemValues);
  }

  console.log(`Digest created: ${digest.id}, ${topItems.length} items across ${topTopics.length} topics`);

  return {
    digestId: digest.id,
    itemCount: topItems.length,
    topTopics,
  };
}
