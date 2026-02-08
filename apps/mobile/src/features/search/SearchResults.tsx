import { useCallback } from "react";
import { FlatList, View } from "react-native";
import { useRouter } from "expo-router";
import { CyberCard, CyberText, CyberBadge } from "@/design-system/primitives";
import type { DigestItem } from "@ai-digest/shared";

interface SearchResultsProps {
  results: DigestItem[];
}

export function SearchResults({ results }: SearchResultsProps) {
  const router = useRouter();

  const handlePress = useCallback(
    (item: DigestItem) => {
      router.push(`/digest/${item.id}`);
    },
    [router],
  );

  const renderItem = useCallback(
    ({ item }: { item: DigestItem }) => {
      const title = item.item?.title ?? "Untitled";
      const source = item.item?.source ?? "unknown";
      const summary = item.item?.summary ?? "";
      const category = item.item?.categories?.[0] ?? item.section ?? "General";

      return (
        <View className="px-4">
          <CyberCard onPress={() => handlePress(item)} className="mb-3">
            <View className="gap-2">
              <CyberText variant="h3" numberOfLines={2}>
                {title}
              </CyberText>
              <CyberText variant="caption">{source}</CyberText>
              <CyberText variant="body-small" numberOfLines={2}>
                {summary}
              </CyberText>
              <CyberBadge variant="tag" color="purple" label={category} />
            </View>
          </CyberCard>
        </View>
      );
    },
    [handlePress],
  );

  const keyExtractor = useCallback((item: DigestItem) => item.id, []);

  return (
    <FlatList
      data={results}
      renderItem={renderItem}
      keyExtractor={keyExtractor}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
    />
  );
}
