import { TopicSection } from "./topic-section";
import { DigestCard } from "./digest-card";

interface DigestItem {
  id: string;
  rank: number;
  section: string;
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  compositeScore: number | null;
}

interface DigestFeedProps {
  digestDate: string;
  synthesis: string;
  items: DigestItem[];
}

export function DigestFeed({ digestDate, synthesis, items }: DigestFeedProps) {
  // Group items by section (immutable)
  const sectionMap = new Map<string, DigestItem[]>();
  for (const item of items) {
    const existing = sectionMap.get(item.section) ?? [];
    sectionMap.set(item.section, [...existing, item]);
  }

  return (
    <div>
      {/* Date header */}
      <div className="mb-6">
        <h2 className="font-mono text-2xl font-bold text-cyber-cyan tracking-wider">
          {digestDate}
        </h2>
      </div>

      {/* Editorial Synthesis */}
      <div className="bg-cyber-surface border-l-2 border-cyber-cyan rounded-r-lg p-5 mb-8">
        <h3 className="font-mono text-xs font-bold uppercase tracking-wider text-cyber-cyan mb-2">
          Editorial Synthesis
        </h3>
        <p className="text-sm text-cyber-text leading-relaxed whitespace-pre-line">
          {synthesis}
        </p>
      </div>

      {/* Topic sections */}
      {Array.from(sectionMap.entries()).map(([topic, sectionItems]) => (
        <TopicSection key={topic} topic={topic}>
          {sectionItems.map((item) => (
            <DigestCard
              key={item.id}
              title={item.title}
              summary={item.summary}
              source={item.source}
              sourceUrl={item.sourceUrl}
              compositeScore={item.compositeScore ?? 0}
            />
          ))}
        </TopicSection>
      ))}
    </div>
  );
}
