import { useLocalSearchParams } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberText } from "@/design-system/primitives";

export default function TranscriptScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  return (
    <ScreenLayout scrollable>
      <CyberText variant="h2" className="p-4">
        Transcript
      </CyberText>
      <CyberText variant="caption" className="px-4">
        Episode: {episodeId}
      </CyberText>
    </ScreenLayout>
  );
}
