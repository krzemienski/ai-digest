import { View } from "react-native";
import { CyberText } from "@/design-system/primitives";

interface SettingsGroupProps {
  title: string;
  children: React.ReactNode;
}

export function SettingsGroup({ title, children }: SettingsGroupProps) {
  return (
    <View className="gap-2 mb-4">
      <CyberText variant="h3">{title}</CyberText>
      <View className="bg-cyber-surface rounded-card p-4">{children}</View>
    </View>
  );
}
