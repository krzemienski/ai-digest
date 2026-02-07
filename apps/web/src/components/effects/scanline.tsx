"use client";
import { useReducedMotion } from "./reduced-motion";

export function Scanline({ children }: { children: React.ReactNode }) {
  const prefersReduced = useReducedMotion();

  return (
    <div className="relative overflow-hidden">
      {children}
      {!prefersReduced && (
        <div
          className="pointer-events-none absolute inset-0 z-10"
          aria-hidden="true"
          style={{
            background: "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 255, 255, 0.03) 2px, rgba(0, 255, 255, 0.03) 4px)",
          }}
        />
      )}
    </div>
  );
}
