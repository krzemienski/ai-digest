import Link from "next/link";
import { TopicSection } from "./topic-section";
import { Card } from "@/components/ui/card";
import { SourceBadge } from "./source-badge";
import { ScoreIndicator } from "./score-indicator";

interface DigestDetailItem {
  id: string;
  rank: number;
  section: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  compositeScore: number | null;
}

interface DigestDetailProps {
  digestDate: string;
  synthesis: string;
  items: DigestDetailItem[];
}

export function DigestDetail({ digestDate, synthesis, items }: DigestDetailProps) {
  // Group items by section (immutable)
  const sectionMap = new Map<string, DigestDetailItem[]>();
  for (const item of items) {
    const existing = sectionMap.get(item.section) ?? [];
    sectionMap.set(item.section, [...existing, item]);
  }

  // Build related items index: for each topic, list item IDs from other topics
  const topicToItems = new Map<string, DigestDetailItem[]>();
  for (const item of items) {
    const existing = topicToItems.get(item.section) ?? [];
    topicToItems.set(item.section, [...existing, item]);
  }

  return (
    <div>
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/digests"
          className="font-mono text-xs text-cyber-cyan hover:text-cyber-green transition-colors"
        >
          &larr; Back to Digests
        </Link>
      </div>

      {/* Date header */}
      <div className="mb-6">
        <h1 className="font-mono text-3xl font-bold text-cyber-cyan tracking-wider">
          {digestDate}
        </h1>
      </div>

      {/* Full editorial synthesis */}
      <div className="bg-cyber-surface border-l-2 border-cyber-cyan rounded-r-lg p-6 mb-10">
        <h2 className="font-mono text-xs font-bold uppercase tracking-wider text-cyber-cyan mb-3">
          Editorial Synthesis
        </h2>
        <p className="text-sm text-cyber-text leading-relaxed whitespace-pre-line">
          {synthesis}
        </p>
      </div>

      {/* Topic sections with full item details */}
      {Array.from(sectionMap.entries()).map(([topic, sectionItems]) => (
        <TopicSection key={topic} topic={topic}>
          {sectionItems.map((item) => (
            <Card key={item.id} className="hover:border-cyber-cyan/30 transition-colors">
              <div className="mb-2">
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-sm font-semibold text-cyber-text hover:text-cyber-cyan transition-colors"
                >
                  {item.title}
                </a>
              </div>
              <p className="text-sm text-cyber-text-secondary leading-relaxed mb-4 whitespace-pre-line">
                {item.summary}
              </p>
              <div className="flex items-center justify-between">
                <SourceBadge source={item.source} />
                <ScoreIndicator score={item.compositeScore ?? 0} />
              </div>
            </Card>
          ))}
        </TopicSection>
      ))}

      {/* Related Items section */}
      {topicToItems.size > 1 && (
        <section className="mt-12 border-t border-cyber-overlay pt-8">
          <h2 className="font-mono text-lg font-bold text-cyber-magenta tracking-wider mb-6">
            Related Items by Topic
          </h2>
          <div className="grid gap-6 md:grid-cols-2">
            {Array.from(topicToItems.entries()).map(([topic, topicItems]) => (
              <Card key={topic}>
                <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-cyber-green mb-3">
                  {topic}
                </h3>
                <ul className="space-y-2">
                  {topicItems.map((item) => (
                    <li key={item.id} className="flex items-start gap-2">
                      <span className="text-cyber-cyan text-xs mt-0.5">&bull;</span>
                      <a
                        href={item.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-xs text-cyber-text-secondary hover:text-cyber-cyan transition-colors"
                      >
                        {item.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
