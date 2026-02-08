import { View, Alert } from "react-native";
import { useRouter } from "expo-router";
import Constants from "expo-constants";
import { CyberText, CyberButton, CyberIcon, CyberToggle } from "@/design-system/primitives";
import { SettingsGroup } from "@/design-system/composites";
import { useAuthStore } from "@/stores/auth-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { TopicEditor } from "./TopicEditor";

export function ProfileView() {
  const router = useRouter();

  // Auth store selectors
  const email = useAuthStore((s) => s.email);
  const logout = useAuthStore((s) => s.logout);

  // Preferences store selectors
  const topics = usePreferencesStore((s) => s.topics);
  const notificationsEnabled = usePreferencesStore((s) => s.notificationsEnabled);
  const notifyDigests = usePreferencesStore((s) => s.notifyDigests);
  const notifyPodcasts = usePreferencesStore((s) => s.notifyPodcasts);
  const setTopics = usePreferencesStore((s) => s.setTopics);
  const toggleNotifications = usePreferencesStore((s) => s.toggleNotifications);
  const toggleDigestNotify = usePreferencesStore((s) => s.toggleDigestNotify);
  const togglePodcastNotify = usePreferencesStore((s) => s.togglePodcastNotify);

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/(auth)/login");
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handlePrivacyPolicy = () => {
    Alert.alert("Privacy Policy", "Coming soon");
  };

  const handleTermsOfService = () => {
    Alert.alert("Terms of Service", "Coming soon");
  };

  const handleTopicsChange = (newTopics: string[]) => {
    void setTopics(newTopics);
  };

  const handleNotificationsToggle = (enabled: boolean) => {
    void toggleNotifications(enabled);
  };

  const handleDigestNotifyToggle = (enabled: boolean) => {
    void toggleDigestNotify(enabled);
  };

  const handlePodcastNotifyToggle = (enabled: boolean) => {
    void togglePodcastNotify(enabled);
  };

  const appVersion = Constants.expoConfig?.version ?? "Unknown";

  return (
    <View className="gap-6">
      {/* Profile Header */}
      <View className="items-center gap-4">
        <View className="w-24 h-24 rounded-full bg-cyber-surface border-2 border-cyber-cyan items-center justify-center">
          <CyberIcon name="person" size="lg" color="#00FFFF" />
        </View>
        <View className="items-center">
          <CyberText variant="h2">AI Digest User</CyberText>
          {email ? (
            <CyberText variant="body" className="text-cyber-text-muted mt-1">
              {email}
            </CyberText>
          ) : null}
        </View>
      </View>

      {/* Topic Preferences */}
      <SettingsGroup title="Topic Preferences">
        <TopicEditor selectedTopics={topics} onTopicsChange={handleTopicsChange} />
      </SettingsGroup>

      {/* Notifications */}
      <SettingsGroup title="Notifications">
        <View className="gap-4">
          <CyberToggle
            label="Push Notifications"
            value={notificationsEnabled}
            onValueChange={handleNotificationsToggle}
          />
          <CyberToggle
            label="Digest Notifications"
            value={notifyDigests}
            onValueChange={handleDigestNotifyToggle}
          />
          <CyberToggle
            label="Podcast Notifications"
            value={notifyPodcasts}
            onValueChange={handlePodcastNotifyToggle}
          />
        </View>
      </SettingsGroup>

      {/* App Info */}
      <SettingsGroup title="App Info">
        <View className="gap-3">
          <View className="flex-row justify-between items-center">
            <CyberText variant="body">Version</CyberText>
            <CyberText variant="body" className="text-cyber-text-muted">
              {appVersion}
            </CyberText>
          </View>
          <CyberButton
            variant="ghost"
            size="sm"
            label="Privacy Policy"
            onPress={handlePrivacyPolicy}
            className="justify-start"
          />
          <CyberButton
            variant="ghost"
            size="sm"
            label="Terms of Service"
            onPress={handleTermsOfService}
            className="justify-start"
          />
        </View>
      </SettingsGroup>

      {/* Sign Out */}
      <View className="mt-4">
        <CyberButton
          variant="danger"
          size="lg"
          label="Sign Out"
          onPress={handleSignOut}
          accessibilityLabel="Sign out of your account"
        />
      </View>
    </View>
  );
}
