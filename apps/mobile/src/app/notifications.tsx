import { ScreenLayout } from "@/design-system/layouts";
import { NotificationCenter } from "@/features/shared/NotificationCenter";

export default function NotificationsScreen() {
  return (
    <ScreenLayout scrollable={false}>
      <NotificationCenter />
    </ScreenLayout>
  );
}
