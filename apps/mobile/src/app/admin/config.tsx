import { ScreenLayout } from "@/design-system/layouts";
import { ConfigDashboard } from "@/features/admin/ConfigDashboard";

export default function ConfigScreen() {
  return (
    <ScreenLayout scrollable edges={["top", "left", "right"]}>
      <ConfigDashboard />
    </ScreenLayout>
  );
}
