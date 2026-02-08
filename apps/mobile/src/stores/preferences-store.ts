import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFS_KEY = "user_preferences";
const ONBOARDING_KEY = "onboarding_complete";

interface StoredPrefs {
  topics: string[];
  notificationsEnabled: boolean;
  notifyDigests: boolean;
  notifyPodcasts: boolean;
}

interface PreferencesState {
  topics: string[];
  notificationsEnabled: boolean;
  notifyDigests: boolean;
  notifyPodcasts: boolean;
  onboardingComplete: boolean;
  isLoading: boolean;

  loadPreferences: () => Promise<void>;
  setTopics: (topics: string[]) => Promise<void>;
  toggleNotifications: (enabled: boolean) => Promise<void>;
  toggleDigestNotify: (enabled: boolean) => Promise<void>;
  togglePodcastNotify: (enabled: boolean) => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

function buildStoredPrefs(state: PreferencesState): StoredPrefs {
  return {
    topics: state.topics,
    notificationsEnabled: state.notificationsEnabled,
    notifyDigests: state.notifyDigests,
    notifyPodcasts: state.notifyPodcasts,
  };
}

export const usePreferencesStore = create<PreferencesState>((set, get) => ({
  topics: [],
  notificationsEnabled: false,
  notifyDigests: true,
  notifyPodcasts: true,
  onboardingComplete: false,
  isLoading: true,

  loadPreferences: async () => {
    try {
      const [prefsRaw, onboarding] = await Promise.all([
        AsyncStorage.getItem(PREFS_KEY),
        AsyncStorage.getItem(ONBOARDING_KEY),
      ]);
      if (prefsRaw) {
        try {
          const prefs = JSON.parse(prefsRaw) as Partial<StoredPrefs>;
          set({
            topics: Array.isArray(prefs.topics) ? prefs.topics : [],
            notificationsEnabled: prefs.notificationsEnabled ?? false,
            notifyDigests: prefs.notifyDigests ?? true,
            notifyPodcasts: prefs.notifyPodcasts ?? true,
          });
        } catch {
          await AsyncStorage.removeItem(PREFS_KEY);
        }
      }
      set({
        onboardingComplete: onboarding === "true",
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  setTopics: async (topics) => {
    set({ topics });
    const prefs = buildStoredPrefs({ ...get(), topics });
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  toggleNotifications: async (enabled) => {
    set({ notificationsEnabled: enabled });
    const prefs = buildStoredPrefs({ ...get(), notificationsEnabled: enabled });
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  toggleDigestNotify: async (enabled) => {
    set({ notifyDigests: enabled });
    const prefs = buildStoredPrefs({ ...get(), notifyDigests: enabled });
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  togglePodcastNotify: async (enabled) => {
    set({ notifyPodcasts: enabled });
    const prefs = buildStoredPrefs({ ...get(), notifyPodcasts: enabled });
    await AsyncStorage.setItem(PREFS_KEY, JSON.stringify(prefs));
  },

  completeOnboarding: async () => {
    set({ onboardingComplete: true });
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
  },
}));
