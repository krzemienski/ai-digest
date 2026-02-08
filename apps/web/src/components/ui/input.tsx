"use client";
import { type InputHTMLAttributes, forwardRef } from "react";

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className = "", ...props }, ref) => (
    <input
      ref={ref}
      className={`w-full h-10 px-3 bg-bg border border-surface-elevated rounded text-text-primary text-sm placeholder:text-text-secondary/50 focus:outline-none focus:border-accent focus:transition-all ${className}`}
      {...props}
    />
  )
);
Input.displayName = "Input";
export { Input };
