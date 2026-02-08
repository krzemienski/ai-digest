import { View } from "react-native";
import { CyberCard, CyberText, CyberBadge } from "@/design-system/primitives";

interface DigestCardProps {
  title: string;
  source: string;
  summary: string;
  category: string;
  timestamp: string;
  onPress: () => void;
}

export function DigestCard({
  title,
  source,
  summary,
  category,
  timestamp,
  onPress,
}: DigestCardProps) {
  return (
    <CyberCard onPress={onPress} className="mb-3">
      <View className="gap-2">
        <CyberText variant="h3">{title}</CyberText>
        <CyberText variant="caption">{source}</CyberText>
        <CyberText variant="body-small" numberOfLines={3}>
          {summary}
        </CyberText>
        <View className="flex-row items-center justify-between">
          <CyberBadge variant="tag" color="purple" label={category} />
          <CyberText variant="caption">{timestamp}</CyberText>
        </View>
      </View>
    </CyberCard>
  );
}
