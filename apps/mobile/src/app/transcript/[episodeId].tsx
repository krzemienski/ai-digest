import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberText } from "@/design-system/primitives";
import { TranscriptView } from "@/features/podcast/TranscriptView";
import { api } from "@/services/api-endpoints";
import type { Transcript } from "@ai-digest/shared";

export default function TranscriptScreen() {
  const { episodeId } = useLocalSearchParams<{ episodeId: string }>();
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const [title, setTitle] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!episodeId) return;

    async function fetchTranscript() {
      setIsLoading(true);
      const res = await api.getEpisode(episodeId as string);
      if (res.success && res.data) {
        setTitle(res.data.title);
        setTranscript(res.data.transcript ?? null);
      }
      setIsLoading(false);
    }

    void fetchTranscript();
  }, [episodeId]);

  if (isLoading) {
    return (
      <ScreenLayout>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color="#00FFFF" />
        </View>
      </ScreenLayout>
    );
  }

  return (
    <ScreenLayout>
      {title ? (
        <View className="px-4 pt-4 pb-2">
          <CyberText variant="h2" numberOfLines={2}>
            {title}
          </CyberText>
          <CyberText variant="caption">Transcript</CyberText>
        </View>
      ) : null}
      <TranscriptView transcript={transcript} />
    </ScreenLayout>
  );
}
