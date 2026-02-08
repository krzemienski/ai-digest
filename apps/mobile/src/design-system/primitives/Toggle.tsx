import { View, Switch } from "react-native";
import { CyberText } from "./Text";

type AccentColor = "cyan" | "magenta" | "green" | "purple";

interface CyberToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  accentColor?: AccentColor;
  label?: string;
  className?: string;
}

const accentHex: Record<AccentColor, string> = {
  cyan: "#00FFFF",
  magenta: "#FF0066",
  green: "#00FF88",
  purple: "#8B5CF6",
};

const TRACK_FALSE_COLOR = "#1A1A2E";

export function CyberToggle({
  value,
  onValueChange,
  accentColor = "cyan",
  label,
  className = "",
}: CyberToggleProps) {
  const hex = accentHex[accentColor];

  return (
    <View className={`flex-row items-center ${className}`}>
      {label ? (
        <CyberText variant="body" className="flex-1 mr-3">
          {label}
        </CyberText>
      ) : null}
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: TRACK_FALSE_COLOR, true: hex }}
        thumbColor={value ? hex : "#FFFFFF"}
      />
    </View>
  );
}
