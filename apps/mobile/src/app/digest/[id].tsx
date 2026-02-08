import { useLocalSearchParams } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberText } from "@/design-system/primitives";

export default function DigestDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <ScreenLayout>
      <CyberText variant="h2" className="p-4">
        Digest {id}
      </CyberText>
    </ScreenLayout>
  );
}
