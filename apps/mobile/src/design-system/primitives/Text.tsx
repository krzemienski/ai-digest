import { Text, type TextProps } from "react-native";

type TextVariant =
  | "h1"
  | "h2"
  | "h3"
  | "body"
  | "body-medium"
  | "body-small"
  | "caption"
  | "tag"
  | "code";

interface CyberTextProps extends Omit<TextProps, "style"> {
  variant?: TextVariant;
  color?: string;
  className?: string;
  children: React.ReactNode;
}

const variantClasses: Record<TextVariant, string> = {
  h1: "font-heading text-3xl text-cyber-text",
  h2: "font-heading text-2xl text-cyber-text",
  h3: "font-heading-medium text-xl text-cyber-text",
  body: "font-body text-base text-cyber-text",
  "body-medium": "font-body-medium text-base text-cyber-text",
  "body-small": "font-body text-sm text-cyber-text",
  caption: "font-body text-xs text-cyber-text-secondary",
  tag: "font-mono text-xs text-cyber-text-secondary",
  code: "font-heading text-sm text-cyber-text",
};

export function CyberText({
  variant = "body",
  className = "",
  children,
  ...props
}: CyberTextProps) {
  const baseClasses = variantClasses[variant];

  return (
    <Text className={`${baseClasses} ${className}`} {...props}>
      {children}
    </Text>
  );
}
