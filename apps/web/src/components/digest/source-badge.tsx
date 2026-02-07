import { Badge } from "@/components/ui/badge";

const SOURCE_COLORS: Record<string, string> = {
  hackernews: "#FF6600",
  github: "#00FF88",
  arxiv: "#B31B1B",
  rss: "#00FFFF",
  huggingface: "#FFD21E",
  reddit: "#FF4500",
  producthunt: "#DA552F",
};

interface SourceBadgeProps {
  source: string;
}

export function SourceBadge({ source }: SourceBadgeProps) {
  const color = SOURCE_COLORS[source] ?? "#00FFFF";
  return <Badge color={color}>{source}</Badge>;
}
