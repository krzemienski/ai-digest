import { View, ScrollView, Alert } from "react-native";
import { useRouter } from "expo-router";
import { CyberText, CyberButton } from "@/design-system/primitives";
import { StatusBadge } from "@/design-system/composites";
import { useAdminStore } from "@/stores/admin-store";
import { formatDate } from "@/utils/format";

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

interface SessionDetailProps {
  runId: string;
}

export function SessionDetail({ runId }: SessionDetailProps) {
  const router = useRouter();
  const pipelineStatus = useAdminStore((s) => s.pipelineStatus);
  const triggerPipeline = useAdminStore((s) => s.triggerPipeline);

  // Find the run in current or recent
  const run =
    pipelineStatus?.current?.id === runId
      ? pipelineStatus.current
      : pipelineStatus?.recent.find((r) => r.id === runId);

  const handleReRun = async () => {
    const success = await triggerPipeline();
    if (success) {
      Alert.alert("Success", "Pipeline triggered successfully", [
        {
          text: "OK",
          onPress: () => router.back(),
        },
      ]);
    } else {
      Alert.alert("Error", "Failed to trigger pipeline");
    }
  };

  if (!run) {
    return (
      <View className="flex-1 items-center justify-center px-4">
        <CyberText variant="body" className="text-cyber-text-secondary mb-4">
          Run not found
        </CyberText>
        <CyberButton
          variant="ghost"
          label="Go Back"
          onPress={() => router.back()}
          accessibilityLabel="Go back to pipeline monitor"
        />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
      <View className="flex-row items-center justify-between mb-6">
        <CyberText variant="h2">Pipeline Run</CyberText>
        <StatusBadge status={mapStatus(run.status)} />
      </View>

      <View className="bg-cyber-surface rounded-card p-4 mb-4">
        <CyberText variant="h3" className="mb-3">
          Run Information
        </CyberText>
        <View className="gap-2">
          <View className="flex-row justify-between">
            <CyberText variant="body" className="text-cyber-text-secondary">
              Run ID
            </CyberText>
            <CyberText variant="body-medium">{run.id}</CyberText>
          </View>
          <View className="flex-row justify-between">
            <CyberText variant="body" className="text-cyber-text-secondary">
              Status
            </CyberText>
            <CyberText variant="body-medium">{run.status}</CyberText>
          </View>
          <View className="flex-row justify-between">
            <CyberText variant="body" className="text-cyber-text-secondary">
              Started
            </CyberText>
            <CyberText variant="body-medium">{formatDate(run.startedAt)}</CyberText>
          </View>
          {run.completedAt ? (
            <View className="flex-row justify-between">
              <CyberText variant="body" className="text-cyber-text-secondary">
                Completed
              </CyberText>
              <CyberText variant="body-medium">{formatDate(run.completedAt)}</CyberText>
            </View>
          ) : null}
          <View className="flex-row justify-between">
            <CyberText variant="body" className="text-cyber-text-secondary">
              Duration
            </CyberText>
            <CyberText variant="body-medium">
              {calculateDuration(run.startedAt, run.completedAt)}
            </CyberText>
          </View>
          <View className="flex-row justify-between">
            <CyberText variant="body" className="text-cyber-text-secondary">
              Items Processed
            </CyberText>
            <CyberText variant="body-medium">{run.itemsProcessed}</CyberText>
          </View>
        </View>
      </View>

      <View className="bg-cyber-surface rounded-card p-4 mb-4">
        <CyberText variant="h3" className="mb-3">
          Execution Log
        </CyberText>
        <CyberText variant="body" className="text-cyber-text-secondary">
          Detailed step-by-step execution log will be available in a future update.
        </CyberText>
      </View>

      <View className="gap-3 mt-4 mb-8">
        <CyberButton
          variant="primary"
          label="Re-run Pipeline"
          onPress={() => void handleReRun()}
          accessibilityLabel="Re-run pipeline"
        />
        <CyberButton
          variant="ghost"
          label="Back to Monitor"
          onPress={() => router.back()}
          accessibilityLabel="Go back to pipeline monitor"
        />
      </View>
    </ScrollView>
  );
}
