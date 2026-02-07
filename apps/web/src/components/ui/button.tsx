"use client";
import { type ButtonHTMLAttributes, forwardRef } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "primary" | "danger";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className = "", variant = "default", size = "md", ...props }, ref) => {
    const baseClasses = "inline-flex items-center justify-center font-mono font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed rounded";

    const variantClasses = {
      default: "border border-cyber-cyan text-cyber-cyan hover:bg-cyber-cyan/10 hover:shadow-neon-cyan",
      primary: "bg-cyber-cyan text-cyber-bg hover:bg-cyber-cyan/90 hover:shadow-neon-cyan",
      danger: "border border-cyber-magenta text-cyber-magenta hover:bg-cyber-magenta/10 hover:shadow-neon-magenta",
    };

    const sizeClasses = {
      sm: "h-8 px-3 text-xs",
      md: "h-10 px-4 text-sm",
      lg: "h-12 px-6 text-base",
    };

    return (
      <button
        ref={ref}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
export { Button, type ButtonProps };
