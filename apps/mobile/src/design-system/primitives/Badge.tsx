import { View } from "react-native";
import { CyberText } from "./Text";

type BadgeVariant = "status" | "tag";
type StatusColor = "green" | "amber" | "magenta";
type TagColor = "purple" | "blue";
type BadgeColor = StatusColor | TagColor;

interface CyberBadgeProps {
  variant?: BadgeVariant;
  color: BadgeColor;
  label: string;
  className?: string;
}

const colorClasses: Record<BadgeColor, string> = {
  green: "bg-cyber-green/20",
  amber: "bg-cyber-amber/20",
  magenta: "bg-cyber-magenta/20",
  purple: "bg-cyber-purple/20",
  blue: "bg-cyber-blue/20",
};

const textColorClasses: Record<BadgeColor, string> = {
  green: "text-cyber-green",
  amber: "text-cyber-amber",
  magenta: "text-cyber-magenta",
  purple: "text-cyber-purple",
  blue: "text-cyber-blue",
};

export function CyberBadge({
  variant: _variant = "status",
  color,
  label,
  className = "",
}: CyberBadgeProps) {
  return (
    <View
      className={`rounded-pill px-2 py-0.5 self-start ${colorClasses[color]} ${className}`}
    >
      <CyberText variant="tag" className={textColorClasses[color]}>
        {label}
      </CyberText>
    </View>
  );
}
