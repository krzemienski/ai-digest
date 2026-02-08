import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#09090B",
        surface: "#18181B",
        "surface-elevated": "#27272A",
        border: "#3F3F46",
        "border-subtle": "#27272A",
        "text-primary": "#FAFAFA",
        "text-secondary": "#A1A1AA",
        "text-muted": "#71717A",
        accent: "#3B82F6",
        "accent-hover": "#60A5FA",
        success: "#22C55E",
        warning: "#EAB308",
        destructive: "#EF4444",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        display: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        card: "6px",
        button: "8px",
        input: "6px",
      },
    },
  },
};
export default config;
