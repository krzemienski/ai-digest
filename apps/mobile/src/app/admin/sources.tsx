import { ScreenLayout } from "@/design-system/layouts";
import { SourceManager } from "@/features/admin/SourceManager";

export default function SourcesScreen() {
  return (
    <ScreenLayout edges={["top", "left", "right"]}>
      <SourceManager />
    </ScreenLayout>
  );
}
