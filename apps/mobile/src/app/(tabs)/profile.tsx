import { ScreenLayout } from "@/design-system/layouts";
import { ProfileView } from "@/features/profile/ProfileView";

export default function ProfileScreen() {
  return (
    <ScreenLayout scrollable={true}>
      <ProfileView />
    </ScreenLayout>
  );
}
