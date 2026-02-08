import React from "react";
import { ScrollView, View } from "react-native";
import { SafeAreaView, type Edge } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";

interface ScreenLayoutProps {
  children: React.ReactNode;
  scrollable?: boolean;
  edges?: Edge[];
}

export function ScreenLayout({
  children,
  scrollable = false,
  edges = ["top", "bottom", "left", "right"],
}: ScreenLayoutProps) {
  return (
    <SafeAreaView edges={edges} className="flex-1 bg-cyber-bg">
      <StatusBar style="light" />
      {scrollable ? (
        <ScrollView
          className="flex-1"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ flexGrow: 1 }}
        >
          {children}
        </ScrollView>
      ) : (
        <View className="flex-1">{children}</View>
      )}
    </SafeAreaView>
  );
}
