import { ScreenLayout } from "@/design-system/layouts";
import { CyberText } from "@/design-system/primitives";

export default function ProfileScreen() {
  return (
    <ScreenLayout>
      <CyberText variant="h1" className="p-4">
        Profile
      </CyberText>
    </ScreenLayout>
  );
}
