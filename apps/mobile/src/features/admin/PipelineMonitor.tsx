import { useEffect, useRef } from "react";
import { View, FlatList, Pressable, Alert } from "react-native";
import { useRouter } from "expo-router";
import { CyberText, CyberButton } from "@/design-system/primitives";
import { StatusBadge } from "@/design-system/composites";
import { useAdminStore } from "@/stores/admin-store";
import { formatRelativeTime } from "@/utils/format";

type PipelineStatus = "running" | "success" | "failed" | "queued";

function mapStatus(status: string): PipelineStatus {
  if (status === "completed") return "success";
  if (status === "running") return "running";
  if (status === "failed") return "failed";
  if (status === "pending") return "queued";
  return "queued";
}

function calculateDuration(startedAt: string, completedAt: string | null): string {
  const start = new Date(startedAt).getTime();
  const end = completedAt ? new Date(completedAt).getTime() : Date.now();
  const durationSeconds = Math.floor((end - start) / 1000);

  if (durationSeconds < 60) return `${durationSeconds}s`;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;
  return `${minutes}m ${seconds}s`;
}

export function PipelineMonitor() {
  const router = useRouter();
  const pipelineStatus = useAdminStore((s) => s.pipelineStatus);
  const triggerPipeline = useAdminStore((s) => s.triggerPipeline);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetch = () => void useAdminStore.getState().fetchPipelineStatus();
    fetch();

    intervalRef.current = setInterval(fetch, 30_000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const handleTriggerPipeline = async () => {
    const success = await triggerPipeline();
    if (success) {
      Alert.alert("Success", "Pipeline triggered successfully");
    } else {
      Alert.alert("Error", "Failed to trigger pipeline");
    }
  };

  const handleRunPress = (runId: string) => {
    router.push(`/admin/pipeline/${runId}`);
  };

  const currentRun = pipelineStatus?.current;
  const recentRuns = pipelineStatus?.recent ?? [];

  return (
    <View className="flex-1 px-4 pt-4">
      <View className="flex-row items-center justify-between mb-4">
        <CyberText variant="h2">Pipeline Monitor</CyberText>
        <CyberButton
          variant="primary"
          size="sm"
          label="Trigger Pipeline"
          onPress={() => void handleTriggerPipeline()}
          accessibilityLabel="Trigger pipeline manually"
        />
      </View>

      {currentRun ? (
        <View className="bg-cyber-surface rounded-card p-4 mb-4">
          <View className="flex-row items-center justify-between mb-2">
            <CyberText variant="body-medium">Current Run</CyberText>
            <StatusBadge status={mapStatus(currentRun.status)} />
          </View>
          <View className="gap-1">
            <CyberText variant="caption">
              Started: {formatRelativeTime(currentRun.startedAt)}
            </CyberText>
            <CyberText variant="caption">
              Items: {currentRun.itemsProcessed}
            </CyberText>
            <CyberText variant="caption">
              Duration: {calculateDuration(currentRun.startedAt, currentRun.completedAt)}
            </CyberText>
          </View>
        </View>
      ) : null}

      <CyberText variant="h3" className="mb-3">
        Recent Runs
      </CyberText>

      <FlatList
        data={recentRuns}
        keyExtractor={(item) => item.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 16 }}
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Pipeline run from ${formatRelativeTime(item.startedAt)}`}
            onPress={() => handleRunPress(item.id)}
            className="bg-cyber-surface rounded-card p-4 mb-3"
          >
            <View className="flex-row items-center justify-between mb-2">
              <CyberText variant="body-medium" className="flex-1 mr-2">
                {formatRelativeTime(item.startedAt)}
              </CyberText>
              <StatusBadge status={mapStatus(item.status)} />
            </View>
            <View className="flex-row items-center justify-between">
              <CyberText variant="caption">Items: {item.itemsProcessed}</CyberText>
              <CyberText variant="caption">
                Duration: {calculateDuration(item.startedAt, item.completedAt)}
              </CyberText>
            </View>
          </Pressable>
        )}
        ListEmptyComponent={
          <View className="items-center justify-center py-12">
            <CyberText variant="body" className="text-cyber-text-secondary">
              No pipeline runs yet
            </CyberText>
          </View>
        }
      />
    </View>
  );
}
