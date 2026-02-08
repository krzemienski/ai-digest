import { useState, useCallback } from "react";
import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type GestureResponderEvent,
} from "react-native";
import { CyberText } from "./Text";

type ButtonVariant = "primary" | "danger" | "ghost" | "outline";
type ButtonSize = "sm" | "md" | "lg";

interface CyberButtonProps extends Omit<PressableProps, "children"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  label: string;
  className?: string;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-cyber-cyan shadow-neon-cyan",
  danger: "bg-cyber-magenta shadow-neon-magenta",
  ghost: "bg-transparent",
  outline: "bg-transparent border border-cyber-cyan",
};

const variantPressedClasses: Record<ButtonVariant, string> = {
  primary: "bg-cyber-cyan shadow-neon-cyan-strong",
  danger: "bg-cyber-magenta",
  ghost: "bg-cyber-surface",
  outline: "bg-cyber-cyan/10 border border-cyber-cyan shadow-neon-cyan",
};

const variantTextClasses: Record<ButtonVariant, string> = {
  primary: "text-black",
  danger: "text-white",
  ghost: "text-cyber-cyan",
  outline: "text-cyber-cyan",
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: "h-8 px-3",
  md: "h-11 px-5",
  lg: "h-[52px] px-6",
};

const sizeTextVariant: Record<ButtonSize, "body-small" | "body-medium"> = {
  sm: "body-small",
  md: "body-medium",
  lg: "body-medium",
};

export function CyberButton({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  label,
  className = "",
  onPressIn: onPressInProp,
  onPressOut: onPressOutProp,
  ...props
}: CyberButtonProps) {
  const [pressed, setPressed] = useState(false);
  const isDisabled = disabled || loading;

  const handlePressIn = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(true);
      onPressInProp?.(e);
    },
    [onPressInProp],
  );

  const handlePressOut = useCallback(
    (e: GestureResponderEvent) => {
      setPressed(false);
      onPressOutProp?.(e);
    },
    [onPressOutProp],
  );

  const currentVariantClass = pressed
    ? variantPressedClasses[variant]
    : variantClasses[variant];

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: isDisabled, busy: loading }}
      disabled={isDisabled}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      className={`flex-row items-center justify-center rounded-button ${sizeClasses[size]} ${currentVariantClass} ${isDisabled ? "opacity-50" : ""} ${className}`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === "primary" ? "#000000" : "#00FFFF"}
        />
      ) : (
        <CyberText
          variant={sizeTextVariant[size]}
          className={variantTextClasses[variant]}
        >
          {label}
        </CyberText>
      )}
    </Pressable>
  );
}
