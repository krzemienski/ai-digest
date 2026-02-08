import { useCallback } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberButton } from "@/design-system/primitives";
import { usePreferencesStore } from "@/stores/preferences-store";
import { WelcomeHero } from "@/features/onboarding/WelcomeHero";

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

export default function WelcomeScreen() {
  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);

  const handleGetStarted = useCallback(() => {
    router.push("/(onboarding)/topics");
  }, []);

  const handleSkip = useCallback(async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  }, [completeOnboarding]);

  return (
    <ScreenLayout>
      <View className="flex-1 justify-center items-center px-6 gap-12">
        <WelcomeHero />

        <View className="w-full gap-3">
          <CyberButton
            variant="primary"
            size="lg"
            label="Get Started"
            onPress={handleGetStarted}
          />
          <CyberButton
            variant="ghost"
            size="md"
            label="Skip"
            onPress={handleSkip}
          />
        </View>

        <PaginationDots activeIndex={0} />
      </View>
    </ScreenLayout>
  );
}
