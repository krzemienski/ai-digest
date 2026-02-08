import { db, queries } from "@ai-digest/db";
import { Container } from "@/components/layout/container";
import { Card } from "@/components/ui/card";
import { SubscribeForm } from "@/components/subscribe/subscribe-form";
import Link from "next/link";

export default async function ArchivePage() {
  const digests = await queries.getDigests(db, { limit: 50 });

  return (
    <Container className="py-8">
      <h1 className="text-2xl font-bold text-accent mb-6">
        Newsletter Archive
      </h1>

      <div className="mb-8">
        <p className="text-text-secondary text-sm mb-3">
          Subscribe to receive future digests in your inbox.
        </p>
        <SubscribeForm />
      </div>

      {digests.length === 0 ? (
        <p className="text-center text-text-secondary text-sm py-12">
          No archived digests yet.
        </p>
      ) : (
        <div className="space-y-4">
          {digests.map((digest) => {
            const truncatedSynthesis =
              digest.synthesis.length > 200
                ? `${digest.synthesis.slice(0, 200)}...`
                : digest.synthesis;

            return (
              <Link key={digest.id} href={`/digests/${digest.id}`}>
                <Card className="hover:border-accent transition-colors cursor-pointer mb-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                    <h2 className="text-lg font-bold text-text-primary">
                      Digest — {String(digest.digestDate)}
                    </h2>
                    <span className="text-xs text-text-secondary">
                      {digest.itemCount} items
                    </span>
                  </div>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {truncatedSynthesis}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </Container>
  );
}
