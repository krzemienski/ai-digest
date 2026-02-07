interface ProgressProps {
  value: number;
  className?: string;
}

export function Progress({ value, className = "" }: ProgressProps) {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={`h-2 w-full bg-cyber-overlay rounded-full overflow-hidden ${className}`}>
      <div
        className="h-full bg-cyber-cyan rounded-full transition-all duration-300 shadow-neon-cyan"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
