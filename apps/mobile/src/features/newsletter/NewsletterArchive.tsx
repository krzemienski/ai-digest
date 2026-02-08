import { useEffect, useState, useCallback } from "react";
import {
  FlatList,
  RefreshControl,
  View,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useRouter } from "expo-router";
import { DigestCard, EmptyState } from "@/design-system/composites";
import {
  CyberText,
  CyberButton,
  CyberInput,
} from "@/design-system/primitives";
import { api } from "@/services/api-endpoints";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";
import { formatRelativeTime } from "@/utils/format";
import type { Digest } from "@ai-digest/shared";

export function NewsletterArchive() {
  const router = useRouter();
  const [digests, setDigests] = useState<Digest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [email, setEmail] = useState("");
  const [subscribeLoading, setSubscribeLoading] = useState(false);
  const [subscribeMessage, setSubscribeMessage] = useState<string | null>(null);

  const fetchNewsletters = useCallback(async (pageNum = 1) => {
    if (pageNum === 1) {
      setIsLoading(true);
    }
    const res = await api.getDigests(pageNum);
    if (res.success && res.data) {
      const newDigests = pageNum === 1 ? res.data : [...digests, ...res.data];
      setDigests(newDigests);
      setPage(pageNum);
      setHasMore((res.meta?.total ?? 0) > pageNum * 10);
    }
    setIsLoading(false);
  }, [digests]);

  const refresh = useCallback(async () => {
    const res = await api.getDigests(1);
    if (res.success && res.data) {
      setDigests(res.data);
      setPage(1);
      setHasMore((res.meta?.total ?? 0) > 10);
    }
  }, []);

  const { refreshing, onRefresh } = usePullToRefresh(refresh);

  useEffect(() => {
    void fetchNewsletters(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || isLoading) return;
    void fetchNewsletters(page + 1);
  }, [hasMore, isLoading, page, fetchNewsletters]);

  const handleDigestPress = useCallback(
    (id: string) => {
      router.push(`/newsletters/${id}`);
    },
    [router],
  );

  const handleSubscribe = useCallback(async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }
    setSubscribeLoading(true);
    setSubscribeMessage(null);
    const res = await api.subscribe(trimmed);
    if (res.success) {
      setSubscribeMessage("Subscribed! Check your inbox.");
      setEmail("");
    } else {
      setSubscribeMessage(res.error ?? "Failed to subscribe. Try again.");
    }
    setSubscribeLoading(false);
  }, [email]);

  const renderHeader = useCallback(
    () => (
      <View className="px-4 pt-4 pb-2">
        <CyberText variant="h2" className="mb-2">
          Newsletter
        </CyberText>
        <CyberText variant="body-small" className="text-cyber-text-secondary mb-4">
          Get the latest AI news delivered to your inbox.
        </CyberText>
        <View className="flex-row items-end gap-2 mb-2">
          <View className="flex-1">
            <CyberInput
              variant="email"
              placeholder="your@email.com"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>
          <CyberButton
            label="Subscribe"
            size="md"
            loading={subscribeLoading}
            onPress={() => void handleSubscribe()}
          />
        </View>
        {subscribeMessage ? (
          <CyberText variant="caption" className="mb-2 text-cyber-cyan">
            {subscribeMessage}
          </CyberText>
        ) : null}
        <View className="mt-4 mb-2">
          <CyberText variant="h3">Past Issues</CyberText>
        </View>
      </View>
    ),
    [email, subscribeLoading, subscribeMessage, handleSubscribe],
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
            title={item.synthesis?.slice(0, 80) ?? `Newsletter ${item.digestDate}`}
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
        variant="newsletter"
        message="No newsletter issues yet. Subscribe to be notified when the first one is published."
        ctaLabel="Refresh"
        onCta={() => void refresh()}
      />
    );
  }, [isLoading, refresh]);

  const keyExtractor = useCallback((item: Digest) => item.id, []);

  return (
    <FlatList
      data={digests}
      renderItem={renderDigestCard}
      keyExtractor={keyExtractor}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={renderEmpty}
      ListFooterComponent={renderFooter}
      onEndReached={handleLoadMore}
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
