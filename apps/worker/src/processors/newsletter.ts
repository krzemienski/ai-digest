import { db, queries, digestItems, normalizedItems } from "@ai-digest/db";
import { sendDigestNewsletter } from "@ai-digest/email";
import type { DigestEmailSection, DigestEmailItem } from "@ai-digest/email";
import { eq, asc } from "drizzle-orm";

export async function processNewsletter(
  digestId: string
): Promise<{ sent: number; failed: number } | null> {
  // Get active subscribers
  const activeSubscribers = await queries.getSubscribers(db);

  if (activeSubscribers.length === 0) {
    console.log("[Newsletter] No active subscribers, skipping");
    return null;
  }

  // Get digest
  const digest = await queries.getDigestById(db, digestId);
  if (!digest) {
    console.error("[Newsletter] Digest not found:", digestId);
    return null;
  }

  // Get digest items with their normalized items
  const items = await db
    .select({
      rank: digestItems.rank,
      section: digestItems.section,
      title: normalizedItems.title,
      summary: normalizedItems.summary,
      source: normalizedItems.source,
      sourceUrl: normalizedItems.sourceUrl,
      compositeScore: normalizedItems.compositeScore,
    })
    .from(digestItems)
    .innerJoin(normalizedItems, eq(digestItems.normalizedItemId, normalizedItems.id))
    .where(eq(digestItems.digestId, digestId))
    .orderBy(asc(digestItems.rank));

  // Group items by section (immutable pattern)
  const sectionMap = new Map<string, DigestEmailItem[]>();
  for (const item of items) {
    const sectionName = item.section;
    const existing = sectionMap.get(sectionName) ?? [];
    sectionMap.set(sectionName, [
      ...existing,
      {
        title: item.title,
        summary: item.summary,
        source: item.source,
        sourceUrl: item.sourceUrl,
        compositeScore: item.compositeScore ?? 0,
      },
    ]);
  }

  const sections: DigestEmailSection[] = Array.from(sectionMap.entries()).map(
    ([topic, sectionItems]) => ({
      topic,
      items: sectionItems,
    })
  );

  // Build email data
  const unsubscribeBaseUrl =
    process.env.UNSUBSCRIBE_URL ?? "https://ai-digest.dev/api/unsubscribe";
  const subscriberEmails = activeSubscribers.map((s) => s.email);

  // Drizzle date() columns return strings in YYYY-MM-DD format
  const digestDate = String(digest.digestDate);

  console.log(`[Newsletter] Sending to ${subscriberEmails.length} subscribers...`);

  const result = await sendDigestNewsletter(
    {
      digestDate,
      synthesis: digest.synthesis,
      sections,
    },
    subscriberEmails,
    unsubscribeBaseUrl
  );

  console.log(`[Newsletter] Sent: ${result.sent}, Failed: ${result.failed}`);
  return result;
}
