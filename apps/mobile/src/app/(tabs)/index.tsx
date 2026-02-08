import { ScreenLayout } from "@/design-system/layouts";
import { CyberText } from "@/design-system/primitives";

export default function HomeScreen() {
  return (
    <ScreenLayout>
      <CyberText variant="h1" className="p-4">
        Home
      </CyberText>
    </ScreenLayout>
  );
}
