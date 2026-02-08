import { Pressable } from "react-native";
import { CyberText } from "@/design-system/primitives";

interface TopicChipProps {
  label: string;
  selected: boolean;
  onToggle: () => void;
}

export function TopicChip({ label, selected, onToggle }: TopicChipProps) {
  const selectedClass = selected
    ? "bg-cyber-cyan/10 border-cyber-cyan shadow-neon-cyan"
    : "bg-cyber-surface border-cyber-overlay";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      onPress={onToggle}
      className={`rounded-card px-4 py-3 border ${selectedClass}`}
    >
      <CyberText variant="body-small" className={selected ? "text-cyber-cyan" : ""}>
        {label}
      </CyberText>
    </Pressable>
  );
}
