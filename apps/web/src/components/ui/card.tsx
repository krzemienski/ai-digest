interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = "", glow = false }: CardProps) {
  return (
    <div className={`bg-cyber-surface border border-cyber-overlay rounded-lg p-4 ${glow ? "shadow-neon-cyan" : ""} ${className}`}>
      {children}
    </div>
  );
}
