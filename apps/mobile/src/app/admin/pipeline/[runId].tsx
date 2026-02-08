import { useLocalSearchParams } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { SessionDetail } from "@/features/admin/SessionDetail";

export default function SessionDetailScreen() {
  const { runId } = useLocalSearchParams<{ runId: string }>();

  return (
    <ScreenLayout scrollable edges={["top", "left", "right"]}>
      <SessionDetail runId={runId as string} />
    </ScreenLayout>
  );
}
