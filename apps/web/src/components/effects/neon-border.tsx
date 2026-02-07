"use client";
import { useReducedMotion } from "./reduced-motion";

interface NeonBorderProps {
  children: React.ReactNode;
  color?: "cyan" | "magenta" | "green";
  className?: string;
}

const SHADOW_MAP = {
  cyan: "0 0 5px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.1)",
  magenta: "0 0 5px rgba(255, 0, 255, 0.3), 0 0 20px rgba(255, 0, 255, 0.1)",
  green: "0 0 5px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.1)",
};

const BORDER_MAP = {
  cyan: "border-cyber-cyan/40",
  magenta: "border-cyber-magenta/40",
  green: "border-cyber-green/40",
};

export function NeonBorder({ children, color = "cyan", className = "" }: NeonBorderProps) {
  const prefersReduced = useReducedMotion();

  return (
    <div
      className={`rounded-lg border ${BORDER_MAP[color]} ${className}`}
      style={{
        boxShadow: prefersReduced ? "none" : SHADOW_MAP[color],
        animation: prefersReduced ? "none" : "neon-pulse 4s ease-in-out infinite",
      }}
    >
      {children}
    </div>
  );
}
