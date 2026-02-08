import { View } from "react-native";
import { CyberText, CyberButton, CyberIcon } from "@/design-system/primitives";
import type Ionicons from "@expo/vector-icons/Ionicons";

type EmptyStateVariant = "digest" | "podcast" | "newsletter" | "search";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

interface EmptyStateProps {
  variant: EmptyStateVariant;
  message?: string;
  ctaLabel?: string;
  onCta?: () => void;
}

const variantIcons: Record<EmptyStateVariant, IoniconsName> = {
  digest: "newspaper-outline",
  podcast: "headset-outline",
  newsletter: "mail-outline",
  search: "search-outline",
};

const variantDefaults: Record<
  EmptyStateVariant,
  { message: string; subText: string }
> = {
  digest: {
    message: "No digest today",
    subText: "Check back tomorrow",
  },
  podcast: {
    message: "No episodes yet",
    subText: "New episodes drop daily",
  },
  newsletter: {
    message: "No issues yet",
    subText: "Subscribe to get notified",
  },
  search: {
    message: "No results found",
    subText: "Try a different search term",
  },
};

export function EmptyState({ variant, message, ctaLabel, onCta }: EmptyStateProps) {
  const defaults = variantDefaults[variant];
  const displayMessage = message ?? defaults.message;

  return (
    <View className="flex-1 items-center justify-center px-8 gap-4">
      <View className="w-16 h-16 items-center justify-center">
        <CyberIcon
          name={variantIcons[variant]}
          size="lg"
          color="#555570"
        />
      </View>

      <View className="gap-2 items-center">
        <CyberText variant="h3" className="text-center">
          {displayMessage}
        </CyberText>
        <CyberText variant="caption" className="text-center text-cyber-text-tertiary">
          {defaults.subText}
        </CyberText>
      </View>

      {ctaLabel && onCta ? (
        <CyberButton variant="ghost" label={ctaLabel} onPress={onCta} />
      ) : null}
    </View>
  );
}
