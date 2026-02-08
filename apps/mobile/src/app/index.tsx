import { Redirect } from "expo-router";
import { useAuthStore } from "@/stores/auth-store";
import { usePreferencesStore } from "@/stores/preferences-store";

export default function Index() {
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const onboardingComplete = usePreferencesStore((s) => s.onboardingComplete);

  if (!onboardingComplete) {
    return <Redirect href="/(onboarding)/welcome" />;
  }

  if (!isLoggedIn) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)" />;
}
