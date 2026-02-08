import { ScreenLayout } from "@/design-system/layouts";
import { DigestFeed } from "@/features/digest/DigestFeed";

export default function HomeScreen() {
  return (
    <ScreenLayout>
      <DigestFeed />
    </ScreenLayout>
  );
}
