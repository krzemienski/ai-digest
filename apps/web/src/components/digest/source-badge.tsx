import { Badge } from "@/components/ui/badge";

const SOURCE_COLORS: Record<string, string> = {
  hackernews: "#f97316",
  github: "#22c55e",
  arxiv: "#ef4444",
  rss: "#3b82f6",
  huggingface: "#eab308",
  reddit: "#f97316",
  producthunt: "#f97316",
};

interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const color = SOURCE_COLORS[source] ?? "#3b82f6";
  return <Badge color={color}>{source}</Badge>;
}
