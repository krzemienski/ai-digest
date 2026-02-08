import { useEffect } from "react";
import { View, FlatList, ActivityIndicator, Pressable } from "react-native";
import { CyberText, CyberButton, CyberBadge } from "@/design-system/primitives";
import { StatusBadge } from "@/design-system/composites";
import { useAdminStore } from "@/stores/admin-store";

export function SourceManager() {
  const sources = useAdminStore((s) => s.sources);
  const isLoading = useAdminStore((s) => s.isLoading);
  const error = useAdminStore((s) => s.error);
  const fetchSources = useAdminStore((s) => s.fetchSources);

  useEffect(() => {
    void fetchSources();
  }, [fetchSources]);

  if (isLoading && sources.length === 0) {
    return (
      <View className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color="#00FFFF" />
        <CyberText variant="body" className="mt-4">
          Loading sources...
        </CyberText>
      </View>
    );
  }

  if (error && sources.length === 0) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <CyberText variant="body" className="text-cyber-magenta text-center mb-4">
          {error}
        </CyberText>
        <CyberButton
          variant="primary"
          label="Retry"
          onPress={() => void fetchSources()}
          accessibilityLabel="Retry loading sources"
        />
      </View>
    );
  }

  return (
    <View className="flex-1 px-4 pt-4">
      <View className="flex-row items-center justify-between mb-4">
        <CyberText variant="h2">Sources</CyberText>
        <CyberButton
          variant="primary"
          size="sm"
          label="Add Source"
          onPress={() => {
            // TODO: Navigate to add source screen
          }}
          accessibilityLabel="Add new source"
        />
      </View>

      <FlatList
        data={sources}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Source: ${item.name}`}
            className="bg-cyber-surface rounded-card p-4 mb-3"
          >
            <View className="flex-row items-center justify-between mb-2">
              <CyberText variant="body-medium" className="flex-1 mr-2">
                {item.name}
              </CyberText>
              <StatusBadge status={item.enabled ? "success" : "failed"} />
            </View>

            <View className="flex-row items-center gap-2">
              <CyberBadge variant="tag" color="purple" label={item.type} />
              <CyberText variant="caption" className="flex-1" numberOfLines={1}>
                {item.url}
              </CyberText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <CyberText variant="body" className="text-cyber-text-secondary">
              No sources configured
            </CyberText>
          </View>
        }
      />
    </View>
  );
}
