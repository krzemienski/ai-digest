interface CardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export function Card({ children, className = "", glow = false }: CardProps) {
  return (
    <div className={`bg-surface border border-surface-elevated rounded-lg p-4 ${glow ? "" : ""} ${className}`}>
      {children}
    </div>
  );
}
