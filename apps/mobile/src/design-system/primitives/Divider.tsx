import { View } from "react-native";

type DividerGlow = "none" | "cyan" | "magenta";

interface CyberDividerProps {
  glow?: DividerGlow;
  className?: string;
}

const glowClasses: Record<DividerGlow, string> = {
  none: "",
  cyan: "shadow-neon-cyan",
  magenta: "shadow-neon-magenta",
};

export function CyberDivider({
  glow = "none",
  className = "",
}: CyberDividerProps) {
  return (
    <View
      className={`h-[1px] w-full bg-cyber-overlay ${glowClasses[glow]} ${className}`}
    />
  );
}
