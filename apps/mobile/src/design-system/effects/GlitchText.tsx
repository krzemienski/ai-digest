import React, { useEffect } from "react";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
  Easing,
} from "react-native-reanimated";
import { useReducedMotion } from "@/hooks/useReducedMotion";
import { CyberText } from "@/design-system/primitives";

interface GlitchTextProps {
  text: string;
  active?: boolean;
  className?: string;
}

export function GlitchText({
  text,
  active = false,
  className = "",
}: GlitchTextProps) {
  const reducedMotion = useReducedMotion();
  const translateX = useSharedValue(0);

  const shouldAnimate = active && !reducedMotion;

  useEffect(() => {
    if (shouldAnimate) {
      translateX.value = withSequence(
        withTiming(3, { duration: 50, easing: Easing.linear }),
        withTiming(-3, { duration: 50, easing: Easing.linear }),
        withTiming(2, { duration: 50, easing: Easing.linear }),
        withTiming(0, { duration: 50, easing: Easing.linear })
      );
    } else {
      translateX.value = 0;
    }
  }, [shouldAnimate, translateX]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  if (!shouldAnimate) {
    return <CyberText className={className}>{text}</CyberText>;
  }

  return (
    <Animated.View style={animatedStyle}>
      <CyberText className={className}>{text}</CyberText>
    </Animated.View>
  );
}
