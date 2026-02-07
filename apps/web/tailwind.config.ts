import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#0A0A0F",
          surface: "#12121A",
          overlay: "#1A1A2E",
          cyan: "#00FFFF",
          magenta: "#FF0066",
          green: "#00FF88",
          purple: "#8B5CF6",
          blue: "#3388FF",
          amber: "#FFAA00",
          text: "#FFFFFF",
          "text-secondary": "#A0A0B0",
          "email-bg": "#0D0D14",
          "email-text": "#F0F0F5",
        },
      },
      fontFamily: {
        mono: ["var(--font-jetbrains-mono)", "JetBrains Mono", "monospace"],
        sans: ["var(--font-inter)", "Inter", "sans-serif"],
      },
      boxShadow: {
        "neon-cyan": "0 0 10px rgba(0, 255, 255, 0.3), 0 0 20px rgba(0, 255, 255, 0.1)",
        "neon-magenta": "0 0 10px rgba(255, 0, 102, 0.3), 0 0 20px rgba(255, 0, 102, 0.1)",
        "neon-green": "0 0 10px rgba(0, 255, 136, 0.3), 0 0 20px rgba(0, 255, 136, 0.1)",
      },
      animation: {
        "pulse-neon": "pulse-neon 2s ease-in-out infinite",
        glitch: "glitch 0.3s ease-in-out",
      },
      keyframes: {
        "pulse-neon": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.7" },
        },
      },
    },
  },
};
export default config;
