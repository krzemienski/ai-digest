import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  ScrollView,
  View,
  ActivityIndicator,
} from "react-native";
import { useRouter } from "expo-router";
import { DigestCard, CategoryChip, EmptyState } from "@/design-system/composites";
import { useDigestStore } from "@/stores/digest-store";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { useResponsiveLayout } from "@/hooks/useResponsiveLayout";
import { formatRelativeTime } from "@/utils/format";
import type { Digest } from "@ai-digest/shared";

const CATEGORIES = ["All", "AI", "ML", "Web", "Mobile", "Security", "Data"] as const;

export function DigestFeed() {
  const router = useRouter();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");

  const digests = useDigestStore((s) => s.digests);
  const isLoading = useDigestStore((s) => s.isLoading);
  const hasMore = useDigestStore((s) => s.hasMore);
  const fetchDigests = useDigestStore((s) => s.fetchDigests);
  const loadMore = useDigestStore((s) => s.loadMore);
  const refresh = useDigestStore((s) => s.refresh);

  const { refreshing, onRefresh } = usePullToRefresh(refresh);
  const { columns } = useResponsiveLayout();

  useEffect(() => {
    void fetchDigests();
  }, [fetchDigests]);

  const handleDigestPress = useCallback(
    (id: string) => {
      router.push(`/digest/${id}`);
    },
    [router],
  );

  const renderCategoryChips = useCallback(
    () => (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16, gap: 8, paddingVertical: 12 }}
      >
        {CATEGORIES.map((cat) => (
          <CategoryChip
            key={cat}
            label={cat}
            selected={selectedCategory === cat}
            onPress={() => setSelectedCategory(cat)}
          />
        ))}
      </ScrollView>
    ),
    [selectedCategory],
  );

  const renderDigestCard = useCallback(
    ({ item }: { item: Digest }) => {
      const firstCategory =
        item.metadata?.topTopics?.[0] ?? "General";
      const firstSource =
        item.metadata?.sourceBreakdown
          ? Object.keys(item.metadata.sourceBreakdown)[0] ?? "AI Digest"
          : "AI Digest";

      return (
        <View className="px-4">
          <DigestCard
            title={item.synthesis?.slice(0, 80) ?? `Digest ${item.digestDate}`}
            source={firstSource}
            summary={item.synthesis ?? ""}
            category={firstCategory}
            timestamp={formatRelativeTime(item.digestDate)}
            onPress={() => handleDigestPress(item.id)}
          />
        </View>
      );
    },
    [handleDigestPress],
  );

  const numColumns = columns > 1 ? columns : 1;

  const renderFooter = useCallback(() => {
    if (!hasMore) return null;
    return (
      <View className="py-4 items-center">
        <ActivityIndicator color="#00FFFF" />
      </View>
    );
  }, [hasMore]);

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
        variant="digest"
        message="No digests yet. Check back soon for your daily AI news."
        ctaLabel="Refresh"
        onCta={() => void refresh()}
      />
    );
  }, [isLoading, refresh]);

  const keyExtractor = useCallback((item: Digest) => item.id, []);

  return (
    <FlatList
      key={`digest-feed-${numColumns}`}
      data={digests}
      renderItem={renderDigestCard}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      columnWrapperStyle={numColumns > 1 ? { gap: 16 } : undefined}
      ListHeaderComponent={renderCategoryChips}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={() => void loadMore()}
      onEndReachedThreshold={0.5}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor="#00FFFF"
          colors={["#00FFFF"]}
        />
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
    />
  );
}
