import { View, Pressable } from "react-native";
import { useRouter } from "expo-router";
import { CyberText, CyberIcon } from "@/design-system/primitives";
import { NeonBorder } from "@/design-system/effects";
import { useAudioStore } from "@/stores/audio-store";
import { formatDuration } from "@/utils/format";
import { shareContent } from "@/features/shared/ShareSheet";
import { WaveformSeek } from "./WaveformSeek";

const SPEED_OPTIONS = [0.5, 1, 1.25, 1.5, 2] as const;

export function FullPlayer() {
  const router = useRouter();
  const currentEpisode = useAudioStore((s) => s.currentEpisode);
  const isPlaying = useAudioStore((s) => s.isPlaying);
  const currentTime = useAudioStore((s) => s.currentTime);
  const duration = useAudioStore((s) => s.duration);
  const playbackSpeed = useAudioStore((s) => s.playbackSpeed);
  const collapsePlayer = useAudioStore((s) => s.collapsePlayer);
  const pause = useAudioStore((s) => s.pause);
  const resume = useAudioStore((s) => s.resume);
  const seek = useAudioStore((s) => s.seek);
  const setSpeed = useAudioStore((s) => s.setSpeed);

  if (!currentEpisode) {
    return null;
  }

  const elapsed = currentTime;
  const remaining = Math.max(0, duration - currentTime);

  const handlePlayPause = () => {
    if (isPlaying) {
      pause();
    } else {
      resume();
    }
  };

  const handleSkipBack = () => {
    seek(Math.max(0, currentTime - 15));
  };

  const handleSkipForward = () => {
    seek(Math.min(duration, currentTime + 15));
  };

  const handleShare = () => {
    void shareContent(currentEpisode.title);
  };

  const handleTranscript = () => {
    router.push(`/transcript/${currentEpisode.id}`);
  };

  return (
    <View className="flex-1 bg-cyber-bg px-6 pt-4">
      {/* Collapse button */}
      <View className="flex-row justify-end mb-4">
        <Pressable onPress={collapsePlayer} hitSlop={12} className="p-2">
          <CyberIcon name="chevron-down" size="md" color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Episode art placeholder */}
      <View className="items-center mb-6">
        <NeonBorder color="cyan">
          <View className="w-64 h-64 rounded-lg bg-cyber-overlay items-center justify-center">
            <CyberIcon name="headset-outline" size="lg" color="#00FFFF" />
          </View>
        </NeonBorder>
      </View>

      {/* Episode title */}
      <CyberText variant="h2" className="text-center mb-1" numberOfLines={2}>
        {currentEpisode.title}
      </CyberText>
      <CyberText variant="caption" className="text-center mb-6">
        AI Digest
      </CyberText>

      {/* Seek bar */}
      <WaveformSeek currentTime={currentTime} duration={duration} onSeek={seek} />

      {/* Time row */}
      <View className="flex-row justify-between px-1 mb-6">
        <CyberText variant="caption">{formatDuration(elapsed)}</CyberText>
        <CyberText variant="caption">-{formatDuration(remaining)}</CyberText>
      </View>

      {/* Main controls */}
      <View className="flex-row items-center justify-center gap-8 mb-8">
        <Pressable onPress={handleSkipBack} hitSlop={12} className="p-2">
          <CyberIcon name="play-back" size="md" color="#FFFFFF" />
        </Pressable>

        <Pressable
          onPress={handlePlayPause}
          className="w-16 h-16 rounded-full bg-cyber-cyan items-center justify-center shadow-neon-cyan"
        >
          <CyberIcon
            name={isPlaying ? "pause" : "play"}
            size="lg"
            color="#000000"
          />
        </Pressable>

        <Pressable onPress={handleSkipForward} hitSlop={12} className="p-2">
          <CyberIcon name="play-forward" size="md" color="#FFFFFF" />
        </Pressable>
      </View>

      {/* Speed selector */}
      <View className="flex-row justify-center gap-2 mb-6">
        {SPEED_OPTIONS.map((speed) => {
          const isActive = playbackSpeed === speed;
          return (
            <Pressable
              key={speed}
              onPress={() => setSpeed(speed)}
              className={`px-3 py-1.5 rounded-full ${
                isActive ? "bg-cyber-cyan" : "bg-cyber-overlay"
              }`}
            >
              <CyberText
                variant="body-small"
                className={isActive ? "text-black" : "text-cyber-text-secondary"}
              >
                {speed}x
              </CyberText>
            </Pressable>
          );
        })}
      </View>

      {/* Secondary row */}
      <View className="flex-row justify-center gap-8">
        <Pressable onPress={handleShare} hitSlop={12} className="p-2">
          <CyberIcon name="share-outline" size="md" color="#A0A0B0" />
        </Pressable>

        <Pressable onPress={handleTranscript} hitSlop={12} className="p-2">
          <CyberIcon name="document-text-outline" size="md" color="#A0A0B0" />
        </Pressable>
      </View>
    </View>
  );
}
