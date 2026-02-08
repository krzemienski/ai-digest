import { View } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

type IconSize = "sm" | "md" | "lg";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface CyberIconProps {
  name: IoniconsName;
  size?: IconSize;
  color?: string;
  className?: string;
}

const sizeMap: Record<IconSize, number> = {
  sm: 16,
  md: 24,
  lg: 32,
};

export function CyberIcon({
  name,
  size = "md",
  color = "#FFFFFF",
  className = "",
}: CyberIconProps) {
  return (
    <View className={className}>
      <Ionicons name={name} size={sizeMap[size]} color={color} />
    </View>
  );
}
