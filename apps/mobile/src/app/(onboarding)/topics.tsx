import { useState, useCallback } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberText, CyberButton } from "@/design-system/primitives";
import { usePreferencesStore } from "@/stores/preferences-store";
import { TopicSelector } from "@/features/onboarding/TopicSelector";

function PaginationDots({ activeIndex }: { activeIndex: number }) {
  return (
    <View className="flex-row gap-2 justify-center">
      {[0, 1, 2].map((i) => (
        <View
          key={i}
          className={`w-2 h-2 rounded-full ${
            i === activeIndex ? "bg-cyber-cyan" : "bg-cyber-overlay"
          }`}
        />
      ))}
    </View>
  );
}

export default function TopicsScreen() {
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const setTopics = usePreferencesStore((s) => s.setTopics);
  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);

  const handleToggle = useCallback((topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic)
        ? prev.filter((t) => t !== topic)
        : [...prev, topic]
    );
  }, []);

  const handleNext = useCallback(async () => {
    await setTopics(selectedTopics);
    router.push("/(onboarding)/notifications");
  }, [selectedTopics, setTopics]);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  }, [completeOnboarding]);

  const hasSelection = selectedTopics.length > 0;

  return (
    <ScreenLayout scrollable>
      <View className="flex-1 px-6 pt-12 gap-6">
        <View className="gap-2">
          <CyberText variant="h2">What interests you?</CyberText>
          <CyberText variant="body-small" className="text-cyber-text-secondary">
            Select at least 1 topic
          </CyberText>
        </View>

        <TopicSelector selectedTopics={selectedTopics} onToggle={handleToggle} />

        <View className="mt-auto pb-8 gap-3">
          <CyberButton
            variant="primary"
            size="lg"
            label="Next"
            disabled={!hasSelection}
            onPress={handleNext}
          />
          <CyberButton
            variant="ghost"
            size="md"
            label="Skip"
            onPress={handleSkip}
          />
          <PaginationDots activeIndex={1} />
        </View>
      </View>
    </ScreenLayout>
  );
}
