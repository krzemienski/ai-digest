import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import {
  FlatList,
  View,
  Pressable,
  TextInput,
  Text,
  type ViewStyle,
} from "react-native";
import { CyberText, CyberIcon } from "@/design-system/primitives";
import { EmptyState } from "@/design-system/composites";
import { useAudioStore } from "@/stores/audio-store";
import { formatDuration } from "@/utils/format";
import type { Transcript, TranscriptSegment } from "@ai-digest/shared";

interface TranscriptViewProps {
  transcript: Transcript | null;
}

const SPEAKER_COLORS: Record<string, string> = {
  "Host A": "#00FFFF",
  "Host B": "#FF6EC7",
  Brian: "#00FFFF",
  Sarah: "#FF6EC7",
};

function getSpeakerColor(speaker: string): string {
  if (SPEAKER_COLORS[speaker]) {
    return SPEAKER_COLORS[speaker] as string;
  }
  // Deterministic color for unknown speakers based on char code
  const hash = speaker.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const colors = ["#00FFFF", "#FF6EC7", "#7B61FF", "#FFD700", "#00FF88"];
  return colors[hash % colors.length] as string;
}

function isHostA(speaker: string): boolean {
  return speaker === "Host A" || speaker === "Brian";
}

interface HighlightedTextProps {
  text: string;
  searchQuery: string;
}

function HighlightedText({ text, searchQuery }: HighlightedTextProps) {
  if (!searchQuery.trim()) {
    return (
      <CyberText variant="body-small" className="text-cyber-text">
        {text}
      </CyberText>
    );
  }

  const lowerText = text.toLowerCase();
  const lowerQuery = searchQuery.toLowerCase();
  const parts: { text: string; highlight: boolean }[] = [];
  let lastIndex = 0;

  let matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
  while (matchIndex !== -1) {
    if (matchIndex > lastIndex) {
      parts.push({ text: text.slice(lastIndex, matchIndex), highlight: false });
    }
    parts.push({
      text: text.slice(matchIndex, matchIndex + searchQuery.length),
      highlight: true,
    });
    lastIndex = matchIndex + searchQuery.length;
    matchIndex = lowerText.indexOf(lowerQuery, lastIndex);
  }

  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), highlight: false });
  }

  return (
    <CyberText variant="body-small" className="text-cyber-text">
      {parts.map((part, i) =>
        part.highlight ? (
          <CyberText
            key={`${i}-${part.text.slice(0, 8)}`}
            variant="body-small"
            className="text-cyber-bg bg-cyber-cyan"
          >
            {part.text}
          </CyberText>
        ) : (
          part.text
        ),
      )}
    </CyberText>
  );
}

export function TranscriptView({ transcript }: TranscriptViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const flatListRef = useRef<FlatList<TranscriptSegment>>(null);
  const autoScrollEnabled = useRef(true);

  const currentTime = useAudioStore((s) => s.currentTime);
  const seek = useAudioStore((s) => s.seek);

  const segments = transcript?.segments ?? [];

  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const lower = searchQuery.toLowerCase();
    return segments.filter(
      (seg) =>
        seg.text.toLowerCase().includes(lower) ||
        seg.speaker.toLowerCase().includes(lower),
    );
  }, [segments, searchQuery]);

  const currentSegmentIndex = useMemo(() => {
    if (!segments.length) return -1;
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = segments[i];
      if (seg && currentTime >= seg.startTime) {
        return i;
      }
    }
    return -1;
  }, [segments, currentTime]);

  // Auto-scroll to current segment
  useEffect(() => {
    if (
      currentSegmentIndex >= 0 &&
      autoScrollEnabled.current &&
      !searchQuery.trim() &&
      flatListRef.current
    ) {
      flatListRef.current.scrollToIndex({
        index: currentSegmentIndex,
        animated: true,
        viewOffset: 100,
      });
    }
  }, [currentSegmentIndex, searchQuery]);

  const handleTimestampPress = useCallback(
    (time: number) => {
      seek(time);
    },
    [seek],
  );

  const handleScrollBeginDrag = useCallback(() => {
    autoScrollEnabled.current = false;
  }, []);

  const handleScrollEndDrag = useCallback(() => {
    // Re-enable auto-scroll after a short delay
    setTimeout(() => {
      autoScrollEnabled.current = true;
    }, 3000);
  }, []);

  const renderSegment = useCallback(
    ({ item, index }: { item: TranscriptSegment; index: number }) => {
      const isLeft = isHostA(item.speaker);
      const color = getSpeakerColor(item.speaker);
      const isActive = index === currentSegmentIndex && !searchQuery.trim();

      const containerStyle: ViewStyle = {
        alignItems: isLeft ? "flex-start" : "flex-end",
      };

      const bubbleClasses = isActive
        ? "bg-cyber-cyan/10 border border-cyber-cyan/30"
        : "bg-cyber-surface border border-cyber-overlay";

      return (
        <View
          className={`px-4 py-1.5 ${isLeft ? "pr-16" : "pl-16"}`}
          style={containerStyle}
        >
          <View className={`rounded-xl px-3 py-2 max-w-full ${bubbleClasses}`}>
            <View className="flex-row items-center gap-2 mb-1">
              <Text
                className="font-body-medium text-xs"
                style={{ color }}
              >
                {item.speaker}
              </Text>
              <Pressable
                onPress={() => handleTimestampPress(item.startTime)}
                hitSlop={4}
              >
                <CyberText variant="tag" className="text-cyber-text-secondary">
                  {formatDuration(item.startTime)}
                </CyberText>
              </Pressable>
            </View>
            <HighlightedText text={item.text} searchQuery={searchQuery} />
          </View>
        </View>
      );
    },
    [currentSegmentIndex, searchQuery, handleTimestampPress],
  );

  const renderSearchBar = useCallback(
    () => (
      <View className="px-4 py-3">
        <View className="flex-row items-center bg-cyber-surface border border-cyber-overlay rounded-button px-3 py-2 gap-2">
          <CyberIcon name="search-outline" size="sm" color="#A0A0B0" />
          <TextInput
            className="flex-1 text-cyber-text font-body text-sm"
            placeholder="Search transcript..."
            placeholderTextColor="#A0A0B0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            returnKeyType="search"
          />
          {searchQuery.length > 0 ? (
            <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
              <CyberIcon name="close-circle" size="sm" color="#A0A0B0" />
            </Pressable>
          ) : null}
        </View>
        {searchQuery.trim().length > 0 ? (
          <CyberText variant="caption" className="mt-1 px-1">
            {filteredSegments.length} result
            {filteredSegments.length === 1 ? "" : "s"}
          </CyberText>
        ) : null}
      </View>
    ),
    [searchQuery, filteredSegments.length],
  );

  const renderEmpty = useCallback(() => {
    if (searchQuery.trim()) {
      return (
        <View className="items-center py-10">
          <CyberText variant="body-small" className="text-cyber-text-secondary">
            No matching segments found.
          </CyberText>
        </View>
      );
    }
    return (
      <EmptyState
        variant="podcast"
        message="No transcript available for this episode."
      />
    );
  }, [searchQuery]);

  if (!transcript) {
    return (
      <EmptyState
        variant="podcast"
        message="No transcript available for this episode."
      />
    );
  }

  const keyExtractor = (_item: TranscriptSegment, index: number) =>
    `seg-${index}`;

  return (
    <FlatList
      ref={flatListRef}
      data={filteredSegments}
      renderItem={renderSegment}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderSearchBar}
      ListEmptyComponent={renderEmpty}
      onScrollBeginDrag={handleScrollBeginDrag}
      onScrollEndDrag={handleScrollEndDrag}
      onScrollToIndexFailed={() => {
        // Silently handle failed scroll-to-index
      }}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
    />
  );
}
