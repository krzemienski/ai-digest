import { Card } from "@/components/ui/card";
import { SourceBadge } from "@/components/digest/source-badge";

interface SearchResultCardProps {
  title: string;
  summary: string;
  source: string;
  sourceUrl: string;
  score?: number;
}

export function SearchResultCard({ title, summary, source, sourceUrl, score }: SearchResultCardProps) {
  return (
    <Card className="hover:border-accent/30 transition-colors">
      <a
        href={sourceUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block"
      >
        <h4 className="text-sm font-semibold text-text-primary hover:text-accent transition-colors mb-1">
          {title}
        </h4>
      </a>
      <p className="text-xs text-text-secondary leading-relaxed mb-3 line-clamp-3">
        {summary}
      </p>
      <div className="flex items-center justify-between">
        <SourceBadge source={source} />
        {typeof score === "number" && (
          <span className="text-xs text-text-secondary">
            relevance: {score.toFixed(2)}
          </span>
        )}
      </div>
    </Card>
  );
}
