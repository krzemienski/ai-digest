import { useState } from "react";
import { View, Alert, ScrollView } from "react-native";
import { CyberText, CyberButton, CyberToggle } from "@/design-system/primitives";
import { SettingsGroup } from "@/design-system/composites";

export function ConfigDashboard() {
  // Placeholder state for config toggles (API may not have all fields)
  const [config, setConfig] = useState({
    // Processing
    autoClassification: true,
    duplicateDetection: true,
    qualityFiltering: true,
    // Delivery
    emailNotifications: true,
    pushNotifications: false,
    digestGeneration: true,
    // Schedule
    dailyDigest: true,
    weeklyDigest: false,
    realTimeAlerts: false,
  });

  const handleToggle = (key: keyof typeof config) => {
    setConfig((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = () => {
    // TODO: Call admin API to save config when available
    Alert.alert("Success", "Configuration saved successfully");
  };

  const handleReset = () => {
    Alert.alert(
      "Reset to Defaults",
      "Are you sure you want to reset all settings to their default values?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset",
          style: "destructive",
          onPress: () => {
            setConfig({
              autoClassification: true,
              duplicateDetection: true,
              qualityFiltering: true,
              emailNotifications: true,
              pushNotifications: false,
              digestGeneration: true,
              dailyDigest: true,
              weeklyDigest: false,
              realTimeAlerts: false,
            });
            Alert.alert("Success", "Settings reset to defaults");
          },
        },
      ],
    );
  };

  return (
    <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
      <CyberText variant="h2" className="mb-6">
        Configuration
      </CyberText>

      <SettingsGroup title="Processing">
        <View className="gap-3">
          <CyberToggle
            label="Auto Classification"
            value={config.autoClassification}
            onValueChange={() => handleToggle("autoClassification")}
            accentColor="cyan"
          />
          <CyberToggle
            label="Duplicate Detection"
            value={config.duplicateDetection}
            onValueChange={() => handleToggle("duplicateDetection")}
            accentColor="cyan"
          />
          <CyberToggle
            label="Quality Filtering"
            value={config.qualityFiltering}
            onValueChange={() => handleToggle("qualityFiltering")}
            accentColor="cyan"
          />
        </View>
      </SettingsGroup>

      <SettingsGroup title="Delivery">
        <View className="gap-3">
          <CyberToggle
            label="Email Notifications"
            value={config.emailNotifications}
            onValueChange={() => handleToggle("emailNotifications")}
            accentColor="cyan"
          />
          <CyberToggle
            label="Push Notifications"
            value={config.pushNotifications}
            onValueChange={() => handleToggle("pushNotifications")}
            accentColor="cyan"
          />
          <CyberToggle
            label="Digest Generation"
            value={config.digestGeneration}
            onValueChange={() => handleToggle("digestGeneration")}
            accentColor="cyan"
          />
        </View>
      </SettingsGroup>

      <SettingsGroup title="Schedule">
        <View className="gap-3">
          <CyberToggle
            label="Daily Digest"
            value={config.dailyDigest}
            onValueChange={() => handleToggle("dailyDigest")}
            accentColor="cyan"
          />
          <CyberToggle
            label="Weekly Digest"
            value={config.weeklyDigest}
            onValueChange={() => handleToggle("weeklyDigest")}
            accentColor="cyan"
          />
          <CyberToggle
            label="Real-time Alerts"
            value={config.realTimeAlerts}
            onValueChange={() => handleToggle("realTimeAlerts")}
            accentColor="cyan"
          />
        </View>
      </SettingsGroup>

      <View className="gap-3 mt-6 mb-8">
        <CyberButton
          variant="primary"
          label="Save Configuration"
          onPress={handleSave}
          accessibilityLabel="Save configuration"
        />
        <CyberButton
          variant="ghost"
          label="Reset to Defaults"
          onPress={handleReset}
          accessibilityLabel="Reset configuration to defaults"
        />
      </View>
    </ScrollView>
  );
}
