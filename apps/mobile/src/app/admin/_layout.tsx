import { Stack, useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useAuthStore } from "@/stores/auth-store";

export default function AdminLayout() {
  const router = useRouter();
  const isAdmin = useAuthStore((s) => s.isAdmin);
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const isLoading = useAuthStore((s) => s.isLoading);

  useEffect(() => {
    if (!isLoading && (!isLoggedIn || !isAdmin)) {
      router.replace("/(tabs)");
    }
  }, [isLoggedIn, isAdmin, isLoading, router]);

  if (isLoading) {
    return (
      <View className="flex-1 bg-cyber-bg items-center justify-center">
        <ActivityIndicator color="#00FFFF" />
      </View>
    );
  }

  if (!isAdmin) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="config" />
      <Stack.Screen name="sources" />
      <Stack.Screen name="pipeline/index" />
      <Stack.Screen name="pipeline/[runId]" />
    </Stack>
  );
}
