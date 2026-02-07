interface NeonBorderProps {
  children: React.ReactNode;
  color?: "cyan" | "magenta" | "green";
  className?: string;
}

const glowMap = {
  cyan: "shadow-neon-cyan",
  magenta: "shadow-neon-magenta",
  green: "shadow-neon-green",
};

export function NeonBorder({ children, color = "cyan", className = "" }: NeonBorderProps) {
  return (
    <div className={`${glowMap[color]} rounded-lg ${className}`}>
      {children}
    </div>
  );
}
