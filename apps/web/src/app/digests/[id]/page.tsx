import { db, queries } from "@ai-digest/db";
import { Container } from "@/components/layout/container";
import { DigestDetail } from "@/components/digest/digest-detail";

export default async function DigestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const digestWithItems = await queries.getDigestWithItems(db, id);

  if (!digestWithItems) {
    return (
      <Container className="py-12">
        <div className="text-center">
          <h2 className="text-xl text-text-secondary">
            Digest not found
          </h2>
          <p className="text-sm text-text-secondary/60 mt-2">
            The requested digest does not exist or has been removed.
          </p>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <DigestDetail
        digestDate={String(digestWithItems.digestDate)}
        synthesis={digestWithItems.synthesis}
        items={digestWithItems.items}
      />
    </Container>
  );
}
