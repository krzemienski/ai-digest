import { useState, useCallback } from "react";
import { View, KeyboardAvoidingView, Platform } from "react-native";
import { router } from "expo-router";
import { ScreenLayout } from "@/design-system/layouts";
import { CyberText, CyberButton, CyberInput } from "@/design-system/primitives";
import { api } from "@/services/api-endpoints";
import { useAuthStore } from "@/stores/auth-store";

export default function RegisterScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = useAuthStore((s) => s.login);

  const handleRegister = useCallback(async () => {
    if (!email.trim() || !password.trim() || !confirmPassword.trim()) {
      setError("All fields are required");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const res = await api.register(email.trim(), password, email.trim().split("@")[0] as string);
      if (res.success) {
        // Auto-login after successful registration
        const loginSuccess = await login(email.trim(), password);
        if (loginSuccess) {
          router.replace("/(tabs)");
        } else {
          setError("Account created but login failed. Please sign in manually.");
          router.replace("/(auth)/login");
        }
      } else {
        setError(res.error ?? "Registration failed. Please try again.");
      }
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [email, password, confirmPassword, login]);

  const handleGoToLogin = useCallback(() => {
    router.back();
  }, []);

  return (
    <ScreenLayout scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 justify-center px-6"
      >
        <View className="items-center mb-10">
          <CyberText variant="h1" className="text-cyber-cyan mb-2">
            Create Account
          </CyberText>
          <CyberText variant="caption">Join the AI Digest network</CyberText>
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
            placeholder="Min. 8 characters"
            value={password}
            onChangeText={setPassword}
            autoCapitalize="none"
          />

          <CyberInput
            variant="password"
            label="Confirm Password"
            placeholder="Re-enter your password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            autoCapitalize="none"
            onSubmitEditing={handleRegister}
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
            label="Create Account"
            loading={isLoading}
            onPress={handleRegister}
          />

          <CyberButton
            variant="ghost"
            size="md"
            label="Already have an account? Sign In"
            onPress={handleGoToLogin}
          />
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}
