import { View } from "react-native";
import { useRouter } from "expo-router";
import { CyberText, CyberButton, CyberIcon } from "@/design-system/primitives";

interface ErrorScreenProps {
  message?: string;
  detail?: string;
  onRetry?: () => void;
}

export function ErrorScreen({
  message = "Something went wrong",
  detail,
  onRetry,
}: ErrorScreenProps) {
  const router = useRouter();

  return (
    <View className="flex-1 items-center justify-center px-8 gap-6">
      <CyberIcon
        name="alert-circle-outline"
        size="lg"
        color="#E879F9"
      />

      <View className="gap-2 items-center">
        <CyberText variant="h2" className="text-center">
          {message}
        </CyberText>

        {detail && (
          <CyberText
            variant="body-small"
            className="text-center text-cyber-text-secondary"
          >
            {detail}
          </CyberText>
        )}
      </View>

      <View className="gap-3 w-full">
        {onRetry && (
          <CyberButton
            variant="primary"
            label="Retry"
            onPress={onRetry}
          />
        )}

        <CyberButton
          variant="ghost"
          label="Go Home"
          onPress={() => router.push("/(tabs)")}
        />
      </View>
    </View>
  );
}
