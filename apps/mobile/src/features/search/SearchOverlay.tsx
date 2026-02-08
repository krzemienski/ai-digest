import { useEffect, useCallback } from "react";
import { View, Pressable, FlatList, ActivityIndicator } from "react-native";
import { CyberInput, CyberText, CyberIcon } from "@/design-system/primitives";
import { EmptyState } from "@/design-system/composites";
import { useSearchStore } from "@/stores/search-store";
import { useDebounce } from "@/hooks/useDebounce";
import { SearchResults } from "./SearchResults";

export function SearchOverlay() {
  const query = useSearchStore((s) => s.query);
  const results = useSearchStore((s) => s.results);
  const recentSearches = useSearchStore((s) => s.recentSearches);
  const isLoading = useSearchStore((s) => s.isLoading);
  const setQuery = useSearchStore((s) => s.setQuery);
  const search = useSearchStore((s) => s.search);
  const loadRecentSearches = useSearchStore((s) => s.loadRecentSearches);
  const clearRecentSearches = useSearchStore((s) => s.clearRecentSearches);
  const clearResults = useSearchStore((s) => s.clearResults);

  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    void loadRecentSearches();
  }, [loadRecentSearches]);

  useEffect(() => {
    if (debouncedQuery.trim().length > 0) {
      void search(debouncedQuery);
    } else {
      clearResults();
    }
  }, [debouncedQuery, search, clearResults]);

  const handleRecentPress = useCallback(
    (term: string) => {
      setQuery(term);
    },
    [setQuery],
  );

  const handleClearInput = useCallback(() => {
    setQuery("");
    clearResults();
  }, [setQuery, clearResults]);

  const renderRecentItem = useCallback(
    ({ item }: { item: string }) => (
      <Pressable
        onPress={() => handleRecentPress(item)}
        className="flex-row items-center gap-3 px-4 py-3"
      >
        <CyberIcon name="time-outline" size="sm" color="#A0A0B0" />
        <CyberText variant="body" className="flex-1">
          {item}
        </CyberText>
      </Pressable>
    ),
    [handleRecentPress],
  );

  const recentKeyExtractor = useCallback(
    (item: string, index: number) => `${item}-${index}`,
    [],
  );

  const showRecent = query.trim().length === 0 && recentSearches.length > 0;
  const showResults = query.trim().length > 0 && results.length > 0 && !isLoading;
  const showEmpty = query.trim().length > 0 && results.length === 0 && !isLoading;
  const showLoading = isLoading;

  return (
    <View className="flex-1">
      {/* Search input header */}
      <View className="flex-row items-center gap-2 px-4 pt-2 pb-3">
        <View className="flex-1">
          <CyberInput
            variant="search"
            placeholder="Search digests..."
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
          />
        </View>
        {query.length > 0 ? (
          <Pressable onPress={handleClearInput} className="p-2">
            <CyberIcon name="close-circle" size="md" color="#A0A0B0" />
          </Pressable>
        ) : null}
      </View>

      {/* Recent searches */}
      {showRecent ? (
        <View className="flex-1">
          <View className="flex-row items-center justify-between px-4 py-2">
            <CyberText variant="body-medium">Recent Searches</CyberText>
            <Pressable onPress={() => void clearRecentSearches()}>
              <CyberText variant="caption" className="text-cyber-cyan">
                Clear
              </CyberText>
            </Pressable>
          </View>
          <FlatList
            data={recentSearches}
            renderItem={renderRecentItem}
            keyExtractor={recentKeyExtractor}
            showsVerticalScrollIndicator={false}
          />
        </View>
      ) : null}

      {/* Loading */}
      {showLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      ) : null}

      {/* Results */}
      {showResults ? <SearchResults results={results} /> : null}

      {/* Empty state */}
      {showEmpty ? (
        <EmptyState
          variant="search"
          message="No results found. Try a different search term."
        />
      ) : null}
    </View>
  );
}
