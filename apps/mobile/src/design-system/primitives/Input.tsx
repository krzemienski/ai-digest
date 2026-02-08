import { useState } from "react";
import { View, TextInput, type TextInputProps } from "react-native";
import { CyberText } from "./Text";

type InputVariant = "text" | "email" | "password" | "search";

interface CyberInputProps extends Omit<TextInputProps, "style"> {
  variant?: InputVariant;
  label?: string;
  error?: string;
  className?: string;
}

const variantConfig: Record<
  InputVariant,
  { keyboardType: TextInputProps["keyboardType"]; secureTextEntry: boolean }
> = {
  text: { keyboardType: "default", secureTextEntry: false },
  email: { keyboardType: "email-address", secureTextEntry: false },
  password: { keyboardType: "default", secureTextEntry: true },
  search: { keyboardType: "default", secureTextEntry: false },
};

export function CyberInput({
  variant = "text",
  label,
  error,
  className = "",
  onFocus: onFocusProp,
  onBlur: onBlurProp,
  ...props
}: CyberInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const config = variantConfig[variant];

  const borderClasses = isFocused
    ? "border-cyber-cyan shadow-neon-cyan"
    : "border-cyber-overlay";

  return (
    <View className={className}>
      {label ? (
        <CyberText variant="caption" className="mb-1">
          {label}
        </CyberText>
      ) : null}
      <TextInput
        className={`bg-cyber-surface text-cyber-text rounded-button px-4 py-3 border ${borderClasses} font-body text-base`}
        placeholderTextColor="#A0A0B0"
        keyboardType={config.keyboardType}
        secureTextEntry={config.secureTextEntry}
        onFocus={(e) => {
          setIsFocused(true);
          onFocusProp?.(e);
        }}
        onBlur={(e) => {
          setIsFocused(false);
          onBlurProp?.(e);
        }}
        {...props}
      />
      {error ? (
        <CyberText variant="caption" className="mt-1 text-cyber-magenta">
          {error}
        </CyberText>
      ) : null}
    </View>
  );
}
