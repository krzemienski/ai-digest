import { useState, useCallback } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberText, CyberButton, CyberInput } from "@/design-system/primitives";
import { useAuthStore } from "@/stores/auth-store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);

  const handleLogin = useCallback(async () => {
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const success = await login(email.trim(), password);
      if (success) {
        router.replace("/(tabs)");
      } else {
        setError("Invalid email or password");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, login]);

  const handleGoToRegister = useCallback(() => {
    router.push("/(auth)/register");
  }, []);

  return (
    <ScreenLayout scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-10">
          <CyberText variant="h1" className="text-cyber-cyan mb-2">
            Sign In
          </CyberText>
          <CyberText variant="caption">Access your AI Digest</CyberText>
        </View>

        <View className="gap-4 mb-6">
          <CyberInput
            variant="email"
            label="Email"
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <CyberInput
            variant="password"
            label="Password"
            placeholder="Enter your password"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
            onSubmitEditing={handleLogin}
            returnKeyType="go"
          />
        </View>

        {error ? (
          <View className="mb-4">
            <CyberText variant="body-small" className="text-cyber-magenta text-center">
              {error}
            </CyberText>
          </View>
        ) : null}

        <View className="gap-3">
          <CyberButton
            variant="primary"
            size="lg"
            label="Log In"
            loading={isLoading}
            onPress={handleLogin}
          />

          <CyberButton
            variant="ghost"
            size="md"
            label="Create Account"
            onPress={handleGoToRegister}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
