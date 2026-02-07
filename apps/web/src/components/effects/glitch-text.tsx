"use client";
import { useReducedMotion } from "./reduced-motion";

interface GlitchTextProps {
  children: React.ReactNode;
  className?: string;
}

export function GlitchText({ children, className = "" }: GlitchTextProps) {
  const prefersReduced = useReducedMotion();

  return (
    <span className={`relative inline-block ${className}`}>
      {children}
      {!prefersReduced && (
        <span
          aria-hidden="true"
          className="absolute inset-0 text-cyber-magenta opacity-0 hover:opacity-100"
          style={{ animation: "glitch 3s infinite", animationDelay: "0.1s" }}
        >
          {children}
        </span>
      )}
    </span>
  );
}
