import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  View,
  Pressable,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { EpisodeRow, EmptyState } from "@/design-system/composites";
import { CyberText } from "@/design-system/primitives";
import { useAudioStore } from "@/stores/audio-store";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";
import { api } from "@/services/api-endpoints";
import { formatDuration, formatDate } from "@/utils/format";
import type { Episode } from "@ai-digest/shared";

type SortOrder = "Newest" | "Oldest";

export function EpisodeList() {
  const router = useRouter();
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortOrder, setSortOrder] = useState<SortOrder>("Newest");

  const currentEpisode = useAudioStore((s) => s.currentEpisode);
  const { play } = useAudioPlayer();

  const fetchEpisodes = useCallback(async () => {
    const res = await api.getEpisodes(1, 50);
    if (res.success && res.data) {
      setEpisodes(res.data);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    void fetchEpisodes();
  }, [fetchEpisodes]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchEpisodes();
    setRefreshing(false);
  }, [fetchEpisodes]);

  const handlePlay = useCallback(
    (episode: Episode) => {
      void play(episode);
    },
    [play],
  );

  const handlePress = useCallback(
    (id: string) => {
      router.push(`/transcript/${id}`);
    },
    [router],
  );

  const sortedEpisodes = [...episodes].sort((a, b) => {
    const dateA = new Date(a.createdAt).getTime();
    const dateB = new Date(b.createdAt).getTime();
    return sortOrder === "Newest" ? dateB - dateA : dateA - dateB;
  });

  const renderSortToggle = useCallback(
    () => (
      <View className="flex-row items-center justify-between px-4 py-3">
        <CyberText variant="h2">Episodes</CyberText>
        <View className="flex-row gap-2">
          {(["Newest", "Oldest"] as const).map((order) => (
            <Pressable
              key={order}
              onPress={() => setSortOrder(order)}
              className={`px-3 py-1 rounded-full ${
                sortOrder === order
                  ? "bg-cyber-cyan/20 border border-cyber-cyan"
                  : "bg-cyber-surface border border-cyber-overlay"
              }`}
            >
              <CyberText
                variant="caption"
                className={
                  sortOrder === order
                    ? "text-cyber-cyan"
                    : "text-cyber-text-secondary"
                }
              >
                {order}
              </CyberText>
            </Pressable>
          ))}
        </View>
      </View>
    ),
    [sortOrder],
  );

  const renderItem = useCallback(
    ({ item }: { item: Episode }) => {
      const isCurrentlyPlaying = currentEpisode?.id === item.id;

      return (
        <View
          className={
            isCurrentlyPlaying
              ? "border-l-2 border-l-cyber-cyan bg-cyber-cyan/5"
              : ""
          }
        >
          <EpisodeRow
            title={item.title}
            date={formatDate(item.createdAt)}
            duration={
              item.durationSeconds
                ? formatDuration(item.durationSeconds)
                : "--:--"
            }
            onPlay={() => handlePlay(item)}
            onPress={() => handlePress(item.id)}
          />
        </View>
      );
    },
    [currentEpisode?.id, handlePlay, handlePress],
  );

  const renderEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      );
    }
    return (
      <EmptyState
        variant="podcast"
        message="No episodes available yet. Check back after a podcast is generated."
        ctaLabel="Refresh"
        onCta={() => void handleRefresh()}
      />
    );
  }, [isLoading, handleRefresh]);

  const keyExtractor = useCallback((item: Episode) => item.id, []);

  return (
    <FlatList
      data={sortedEpisodes}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderSortToggle}
      ListEmptyComponent={renderEmpty}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => void handleRefresh()}
          tintColor="#00FFFF"
          colors={["#00FFFF"]}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
    />
  );
}
