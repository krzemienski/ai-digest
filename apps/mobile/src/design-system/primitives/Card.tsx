import { View, Pressable, type ViewProps, type PressableProps } from "react-native";

type GlowColor = "none" | "cyan" | "magenta" | "green";

interface CyberCardProps extends Omit<ViewProps, "style"> {
  glow?: GlowColor;
  onPress?: PressableProps["onPress"];
  className?: string;
  children: React.ReactNode;
}

const glowClasses: Record<GlowColor, string> = {
  none: "",
  cyan: "shadow-neon-cyan",
  magenta: "shadow-neon-magenta",
  green: "shadow-neon-green",
};

export function CyberCard({
  glow = "none",
  onPress,
  className = "",
  children,
  ...props
}: CyberCardProps) {
  const baseClasses = `bg-cyber-surface rounded-card p-4 ${glowClasses[glow]} ${className}`;

  if (onPress) {
    return (
      <Pressable accessibilityRole="button" onPress={onPress} className={baseClasses} {...props}>
        {children}
      </Pressable>
    );
  }

  return (
    <View className={baseClasses} {...props}>
      {children}
    </View>
  );
}
