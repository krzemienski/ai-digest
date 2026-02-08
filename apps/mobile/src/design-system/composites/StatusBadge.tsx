import { View } from "react-native";
import { CyberBadge } from "@/design-system/primitives";

type PipelineStatus = "running" | "success" | "failed" | "queued";

interface StatusBadgeProps {
  status: PipelineStatus;
}

type BadgeColor = "green" | "amber" | "magenta" | "purple" | "blue";

const statusConfig: Record<PipelineStatus, { color: BadgeColor; label: string }> = {
  running: { color: "blue", label: "Running" },
  success: { color: "green", label: "Success" },
  failed: { color: "magenta", label: "Failed" },
  queued: { color: "purple", label: "Queued" },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = statusConfig[status];

  if (status === "running") {
    return (
      <View className="flex-row items-center gap-1.5">
        <View className="w-2 h-2 rounded-full bg-cyber-cyan" />
        <CyberBadge variant="status" color={config.color} label={config.label} />
      </View>
    );
  }

  return <CyberBadge variant="status" color={config.color} label={config.label} />;
}
