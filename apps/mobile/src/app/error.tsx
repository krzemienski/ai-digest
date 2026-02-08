import { ScreenLayout } from "@/design-system/layouts";
import { ErrorScreen } from "@/features/shared/ErrorScreen";
import { useRouter } from "expo-router";

export default function ErrorRoute() {
  const router = useRouter();

  return (
    <ScreenLayout>
      <ErrorScreen onRetry={() => router.back()} />
    </ScreenLayout>
  );
}
