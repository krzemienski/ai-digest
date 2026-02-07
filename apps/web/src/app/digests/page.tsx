import { db, queries } from "@ai-digest/db";
import { Container } from "@/components/layout/container";
import { DigestFeed } from "@/components/digest/digest-feed";

export default async function DigestsPage() {
  const latestDigest = await queries.getLatestDigest(db);

  if (!latestDigest) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h2 className="font-mono text-xl text-cyber-text-secondary">No digests yet</h2>
          <p className="text-sm text-cyber-text-secondary/60 mt-2">
            Run the pipeline to generate your first digest.
          </p>
        </div>
      </Container>
    );
  }

  const digestWithItems = await queries.getDigestWithItems(db, latestDigest.id);

  if (!digestWithItems) {
    return (
      <Container className="py-12">
        <p className="text-cyber-text-secondary">Digest data unavailable.</p>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <DigestFeed
        digestDate={String(digestWithItems.digestDate)}
        synthesis={digestWithItems.synthesis}
        items={digestWithItems.items}
      />
    </Container>
  );
}
