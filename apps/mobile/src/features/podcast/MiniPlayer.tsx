import { View, Pressable } from "react-native";
import { CyberText, CyberIcon } from "@/design-system/primitives";
import { useAudioStore } from "@/stores/audio-store";

interface MiniPlayerProps {
  onPress: () => void;
  onPlayPause: () => void;
}

export function MiniPlayer({ onPress, onPlayPause }: MiniPlayerProps) {
  const currentEpisode = useAudioStore((s) => s.currentEpisode);
  const isPlaying = useAudioStore((s) => s.isPlaying);

  if (!currentEpisode) {
    return null;
  }

  return (
    <Pressable
      onPress={onPress}
      className="h-16 flex-row items-center px-4 gap-3 bg-cyber-surface border-t border-cyber-overlay"
    >
      <View className="w-10 h-10 rounded-lg bg-cyber-overlay items-center justify-center">
        <CyberIcon name="headset-outline" size="sm" color="#00FFFF" />
      </View>

      <View className="flex-1 gap-0.5">
        <CyberText variant="body-small" numberOfLines={1}>
          {currentEpisode.title}
        </CyberText>
        <CyberText variant="caption" numberOfLines={1}>
          {currentEpisode.status === "ready" ? "Now Playing" : currentEpisode.status}
        </CyberText>
      </View>

      <Pressable
        onPress={(e) => {
          e.stopPropagation?.();
          onPlayPause();
        }}
        hitSlop={8}
        className="w-8 h-8 items-center justify-center"
      >
        <CyberIcon
          name={isPlaying ? "pause" : "play"}
          size="lg"
          color="#00FFFF"
        />
      </Pressable>
    </Pressable>
  );
}
