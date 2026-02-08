import React from "react";
import { View } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

interface ScanlineProps {
  children: React.ReactNode;
  opacity?: number;
}

export function Scanline({ children, opacity = 0.05 }: ScanlineProps) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <>{children}</>;
  }

  return (
    <View style={{ position: "relative" }}>
      {children}
      <View
        pointerEvents="none"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: `rgba(0, 0, 0, ${opacity})`,
        }}
      />
    </View>
  );
}
