"use client";
import { type InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full h-10 px-3 bg-cyber-bg border border-cyber-overlay rounded text-cyber-text font-mono text-sm placeholder:text-cyber-text-secondary/50 focus:outline-none focus:border-cyber-cyan focus:shadow-neon-cyan transition-all ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
export { Input };
