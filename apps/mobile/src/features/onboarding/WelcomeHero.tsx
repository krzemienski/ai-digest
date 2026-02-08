import { View } from "react-native";
import { CyberText } from "@/design-system/primitives";
import { PulsingDot } from "@/design-system/effects";

export function WelcomeHero() {
  return (
    <View className="items-center gap-4">
      <CyberText variant="h1" className="text-cyber-cyan">
        AI DIGEST
      </CyberText>
      <CyberText variant="body" className="text-cyber-text-secondary">
        Your AI-curated tech digest
      </CyberText>
      <PulsingDot color="#00FFFF" size={12} />
    </View>
  );
}
