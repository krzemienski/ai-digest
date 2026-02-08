import { usePreferencesStore } from "@/stores/preferences-store";

export function useOnboarding() {
  const { onboardingComplete, completeOnboarding, loadPreferences } = usePreferencesStore();

  return {
    isFirstLaunch: !onboardingComplete,
    completeOnboarding,
    loadPreferences,
  };
}
