import { View } from "react-native";
import { CyberToggle, CyberInput } from "@/design-system/primitives";
import { CategoryChip } from "@/design-system/composites";

type Frequency = "Daily" | "Weekly" | "Monthly";

const FREQUENCIES: Frequency[] = ["Daily", "Weekly", "Monthly"];

interface NotificationSetupProps {
  pushEnabled: boolean;
  onTogglePush: (enabled: boolean) => void;
  email: string;
  onChangeEmail: (email: string) => void;
  frequency: Frequency;
  onChangeFrequency: (frequency: Frequency) => void;
}

export function NotificationSetup({
  pushEnabled,
  onTogglePush,
  email,
  onChangeEmail,
  frequency,
  onChangeFrequency,
}: NotificationSetupProps) {
  return (
    <View className="gap-6">
      <CyberToggle
        label="Push Notifications"
        value={pushEnabled}
        onValueChange={onTogglePush}
      />

      <CyberInput
        variant="email"
        label="Email for digest"
        placeholder="you@example.com"
        value={email}
        onChangeText={onChangeEmail}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View className="flex-row gap-3">
        {FREQUENCIES.map((freq) => (
          <CategoryChip
            key={freq}
            label={freq}
            selected={frequency === freq}
            onPress={() => onChangeFrequency(freq)}
          />
        ))}
      </View>
    </View>
  );
}
