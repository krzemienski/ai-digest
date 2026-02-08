import { ScreenLayout } from "@/design-system/layouts";
import { PipelineMonitor } from "@/features/admin/PipelineMonitor";

export default function PipelineMonitorScreen() {
  return (
    <ScreenLayout edges={["top", "left", "right"]}>
      <PipelineMonitor />
    </ScreenLayout>
  );
}
