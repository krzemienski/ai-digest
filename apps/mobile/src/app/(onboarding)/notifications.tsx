import { useState, useCallback } from "react";
import { View } from "react-native";
import { router } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberText, CyberButton } from "@/design-system/primitives";
import { usePreferencesStore } from "@/stores/preferences-store";
import { NotificationSetup } from "@/features/onboarding/NotificationSetup";

type Frequency = "Daily" | "Weekly" | "Monthly";

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

export default function NotificationsScreen() {
  const [pushEnabled, setPushEnabled] = useState(false);
  const [email, setEmail] = useState("");
  const [frequency, setFrequency] = useState<Frequency>("Daily");

  const toggleNotifications = usePreferencesStore((s) => s.toggleNotifications);
  const completeOnboarding = usePreferencesStore((s) => s.completeOnboarding);

  const handleDone = useCallback(async () => {
    await toggleNotifications(pushEnabled);
    await completeOnboarding();
    router.replace("/(tabs)");
  }, [pushEnabled, toggleNotifications, completeOnboarding]);

  return (
    <ScreenLayout scrollable>
      <View className="flex-1 px-6 pt-12 gap-6">
        <CyberText variant="h2">Stay Updated</CyberText>

        <NotificationSetup
          pushEnabled={pushEnabled}
          onTogglePush={setPushEnabled}
          email={email}
          onChangeEmail={setEmail}
          frequency={frequency}
          onChangeFrequency={setFrequency}
        />

        <View className="mt-auto pb-8 gap-3">
          <CyberButton
            variant="primary"
            size="lg"
            label="Done"
            onPress={handleDone}
          />
          <CyberText variant="caption" className="text-center">
            You can change these later in Settings
          </CyberText>
          <PaginationDots activeIndex={2} />
        </View>
      </View>
    </ScreenLayout>
  );
}
