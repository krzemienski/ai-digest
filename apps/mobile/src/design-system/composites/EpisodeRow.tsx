import { View, Image, Pressable } from "react-native";
import { CyberText, CyberIcon } from "@/design-system/primitives";

interface EpisodeRowProps {
  title: string;
  date: string;
  duration: string;
  imageUrl?: string;
  onPlay: () => void;
  onPress: () => void;
}

export function EpisodeRow({
  title,
  date,
  duration,
  imageUrl,
  onPlay,
  onPress,
}: EpisodeRowProps) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center px-4 py-3 gap-3"
    >
      {imageUrl ? (
        <Image
          source={{ uri: imageUrl }}
          className="w-10 h-10 rounded-card"
        />
      ) : (
        <View className="w-10 h-10 rounded-card bg-cyber-surface items-center justify-center">
          <CyberIcon name="headset-outline" size="sm" color="#00FFFF" />
        </View>
      )}

      <View className="flex-1 gap-0.5">
        <CyberText variant="body-medium" numberOfLines={1}>
          {title}
        </CyberText>
        <CyberText variant="caption">
          {date} · {duration}
        </CyberText>
      </View>

      <Pressable onPress={onPlay} hitSlop={8}>
        <CyberIcon name="play-circle" size="lg" color="#00FFFF" />
      </Pressable>
    </Pressable>
  );
}
