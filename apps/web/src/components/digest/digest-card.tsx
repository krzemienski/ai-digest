import { Card } from "@/components/ui/card";
import { SourceBadge } from "./source-badge";
import { ScoreIndicator } from "./score-indicator";

interface DigestCardProps {
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  compositeScore: number;
}

export function DigestCard({ title, summary, source, sourceUrl, compositeScore }: DigestCardProps) {
  return (
    <Card className="hover:border-accent/30 transition-colors">
      <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
        <h4 className="text-sm font-semibold text-text-primary hover:text-accent transition-colors mb-1">
          {title}
        </h4>
      </a>
      <p className="text-xs text-text-secondary leading-relaxed mb-3">
        {summary}
      </p>
      <div className="flex items-center justify-between">
        <SourceBadge source={source} />
        <ScoreIndicator score={compositeScore} />
      </div>
    </Card>
  );
}
