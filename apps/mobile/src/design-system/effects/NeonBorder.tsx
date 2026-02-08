import React from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useEffect } from "react";
import { Platform } from "react-native";
import { useReducedMotion } from "@/hooks/useReducedMotion";

type NeonColor = "cyan" | "magenta" | "green";

interface NeonBorderProps {
  color?: NeonColor;
  intensity?: number;
  animated?: boolean;
  children: React.ReactNode;
}

const colorMap: Record<NeonColor, string> = {
  cyan: "#00FFFF",
  magenta: "#FF0066",
  green: "#00FF88",
};

const colorRgb: Record<NeonColor, [number, number, number]> = {
  cyan: [0, 255, 255],
  magenta: [255, 0, 102],
  green: [0, 255, 136],
};

export function NeonBorder({
  color = "cyan",
  intensity = 1,
  animated = true,
  children,
}: NeonBorderProps) {
  const reducedMotion = useReducedMotion();
  const opacity = useSharedValue(0.3 * intensity);

  const shouldAnimate = animated && !reducedMotion;

  useEffect(() => {
    if (shouldAnimate) {
      opacity.value = withRepeat(
        withTiming(0.8 * intensity, {
          duration: 1500,
          easing: Easing.inOut(Easing.ease),
        }),
        -1,
        true
      );
    } else {
      opacity.value = 0.5 * intensity;
    }
  }, [shouldAnimate, intensity, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    const [r, g, b] = colorRgb[color];

    if (Platform.OS === "web") {
      return {
        borderWidth: 1,
        borderColor: colorMap[color],
        borderRadius: 8,
        boxShadow: `0 0 ${10 * intensity}px rgba(${r}, ${g}, ${b}, ${opacity.value}), 0 0 ${20 * intensity}px rgba(${r}, ${g}, ${b}, ${opacity.value * 0.4})`,
      } as Record<string, unknown>;
    }

    return {
      borderWidth: 1,
      borderColor: colorMap[color],
      borderRadius: 8,
      shadowColor: `rgb(${r}, ${g}, ${b})`,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: opacity.value,
      shadowRadius: 10 * intensity,
      elevation: 8,
    };
  });

  return (
    <Animated.View style={animatedStyle}>
      {children}
    </Animated.View>
  );
}
