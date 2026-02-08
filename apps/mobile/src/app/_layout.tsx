import { useEffect, useState } from "react";
import { View } from "react-native";
import { Slot } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from "@expo-google-fonts/jetbrains-mono";
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from "@expo-google-fonts/inter";
import { SpaceMono_400Regular } from "@expo-google-fonts/space-mono";
import { useAuthStore } from "@/stores/auth-store";
import { usePreferencesStore } from "@/stores/preferences-store";
import { CyberText } from "@/design-system/primitives";
import { PulsingDot } from "@/design-system/effects";
import "../globals.css";

SplashScreen.preventAutoHideAsync();

const FONT_TIMEOUT_MS = 5000;

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    SpaceMono_400Regular,
  });
  const [timedOut, setTimedOut] = useState(false);
  const [appReady, setAppReady] = useState(false);

  const checkAuth = useAuthStore((s) => s.checkAuth);
  const loadPreferences = usePreferencesStore((s) => s.loadPreferences);

  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  // Load auth + preferences after fonts ready
  useEffect(() => {
    if (fontsLoaded || fontError || timedOut) {
      Promise.all([checkAuth(), loadPreferences()]).then(() => {
        setAppReady(true);
        SplashScreen.hideAsync();
      });
    }
  }, [fontsLoaded, fontError, timedOut, checkAuth, loadPreferences]);

  if (!appReady) {
    return (
      <View className="flex-1 items-center justify-center bg-cyber-bg">
        <CyberText variant="h1" className="text-cyber-cyan mb-4">
          AI DIGEST
        </CyberText>
        <PulsingDot color="#00FFFF" size={12} />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Slot />
    </GestureHandlerRootView>
  );
}
