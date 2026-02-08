import React from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";

interface TabShellProps {
  children: React.ReactNode;
  miniPlayerVisible?: boolean;
}

export function TabShell({
  children,
  miniPlayerVisible = false,
}: TabShellProps) {
  return (
    <KeyboardAvoidingView
      className="flex-1 bg-cyber-bg"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className={`flex-1 ${miniPlayerVisible ? "pb-16" : ""}`}>
        {children}
      </View>
    </KeyboardAvoidingView>
  );
}
