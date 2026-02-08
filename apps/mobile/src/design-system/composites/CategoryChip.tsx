import { Pressable } from "react-native";
import { CyberText } from "@/design-system/primitives";

interface CategoryChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
}

export function CategoryChip({ label, selected, onPress }: CategoryChipProps) {
  const borderClass = selected ? "border-cyber-cyan shadow-neon-cyan" : "border-cyber-overlay";
  const textClass = selected ? "text-cyber-cyan" : "";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-pill px-4 py-1.5 border ${borderClass}`}
    >
      <CyberText variant="tag" className={textClass}>
        {label}
      </CyberText>
    </Pressable>
  );
}
