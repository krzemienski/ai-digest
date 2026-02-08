import { View } from "react-native";
import { CyberText, CyberButton, CyberIcon } from "@/design-system/primitives";
import type Ionicons from "@expo/vector-icons/Ionicons";

type EmptyStateVariant = "digest" | "podcast" | "newsletter" | "search";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  variant: EmptyStateVariant;
  message: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const variantIcons: Record<EmptyStateVariant, IoniconsName> = {
  digest: "newspaper-outline",
  podcast: "headset-outline",
  newsletter: "mail-outline",
  search: "search-outline",
};

export function EmptyState({ variant, message, ctaLabel, onCta }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <CyberIcon
        name={variantIcons[variant]}
        size="lg"
        color="#555570"
      />
      <CyberText variant="body" className="text-center text-cyber-text-secondary">
        {message}
      </CyberText>
      {ctaLabel && onCta ? (
        <CyberButton variant="ghost" label={ctaLabel} onPress={onCta} />
      ) : null}
    </View>
  );
}
